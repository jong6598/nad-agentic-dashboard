pub mod identity;
pub mod metadata;
pub mod provider;
pub mod reputation;

use provider::ChainConfig;
use sqlx::PgPool;

/// Block batch size per eth_getLogs call to avoid RPC limits.
/// Both mainnet and testnet RPCs are limited to 100 block range.
pub const BLOCK_BATCH_SIZE: u64 = 100;

/// Poll interval between indexer cycles (in seconds).
/// Only applies when fully caught up to latest block.
pub const POLL_INTERVAL_SECS: u64 = 2;

/// Run the indexer loop for all configured chains.
/// This function runs forever, polling for new events every POLL_INTERVAL_SECS.
pub async fn run_indexer(pool: PgPool) {
    let chains = provider::get_chain_configs();

    if chains.is_empty() {
        tracing::warn!("No chain configs found — indexer has nothing to index");
        return;
    }

    tracing::info!(
        "Starting indexer for {} chain(s) | batch_size={} | poll_interval={}s",
        chains.len(),
        BLOCK_BATCH_SIZE,
        POLL_INTERVAL_SECS
    );
    for chain in &chains {
        let masked_rpc = if chain.rpc_url.len() > 20 {
            format!("{}...{}", &chain.rpc_url[..16], &chain.rpc_url[chain.rpc_url.len()-8..])
        } else {
            chain.rpc_url.clone()
        };
        tracing::info!(
            "  Chain {} | rpc={} | start_block={} | identity={} | reputation={}",
            chain.chain_id,
            masked_rpc,
            chain.start_block,
            chain.identity_address,
            chain.reputation_address
        );
    }

    loop {
        let mut all_caught_up = true;
        for chain in &chains {
            match index_chain(&pool, chain).await {
                Ok(caught_up) => {
                    if !caught_up {
                        all_caught_up = false;
                    }
                }
                Err(e) => {
                    tracing::error!(
                        chain_id = chain.chain_id,
                        "Indexer error for chain {}: {:?}",
                        chain.chain_id,
                        e
                    );
                }
            }
        }

        // Only sleep when fully caught up to latest block
        if all_caught_up {
            tokio::time::sleep(std::time::Duration::from_secs(POLL_INTERVAL_SECS)).await;
        }
    }
}

/// Index a single batch for a chain: process one batch each of identity + reputation events.
/// Returns Ok(true) if caught up to latest block, Ok(false) if still behind.
async fn index_chain(pool: &PgPool, chain: &ChainConfig) -> Result<bool, Box<dyn std::error::Error>> {
    let provider = provider::create_provider(chain)?;
    let batch_size = BLOCK_BATCH_SIZE;

    // Get the latest block number from the RPC
    let latest_block = provider::get_latest_block(&provider).await?;

    let identity_addr = chain.identity_address.to_string();
    let reputation_addr = chain.reputation_address.to_string();

    let identity_last = crate::db::indexer_state::get_last_block(pool, chain.chain_id, &identity_addr)
        .await?
        .unwrap_or(chain.start_block as i64 - 1);
    let reputation_last = crate::db::indexer_state::get_last_block(pool, chain.chain_id, &reputation_addr)
        .await?
        .unwrap_or(chain.start_block as i64 - 1);

    let identity_behind = identity_last < latest_block as i64;
    let reputation_behind = reputation_last < latest_block as i64;

    if !identity_behind && !reputation_behind {
        return Ok(true);
    }

    // Process one batch of identity events
    if identity_behind {
        let from = (identity_last + 1) as u64;
        let to = std::cmp::min(from + batch_size - 1, latest_block);

        tracing::info!(chain_id = chain.chain_id, "Indexing identity events blocks {} - {}", from, to);
        identity::index_identity_events(pool, &provider, chain, from, to).await?;
        crate::db::indexer_state::update_last_block_with_name(pool, chain.chain_id, &identity_addr, to as i64, Some("IdentityRegistry")).await?;
    }

    // Process one batch of reputation events
    if reputation_behind {
        let from = (reputation_last + 1) as u64;
        let to = std::cmp::min(from + batch_size - 1, latest_block);

        tracing::info!(chain_id = chain.chain_id, "Indexing reputation events blocks {} - {}", from, to);
        reputation::index_reputation_events(pool, &provider, chain, from, to).await?;
        crate::db::indexer_state::update_last_block_with_name(pool, chain.chain_id, &reputation_addr, to as i64, Some("ReputationRegistry")).await?;
    }

    Ok(false)
}
