pub mod identity;
pub mod metadata;
pub mod provider;
pub mod reputation;

use provider::ChainConfig;
use sqlx::PgPool;

/// Block batch size per eth_getLogs call to avoid RPC limits.
pub const BLOCK_BATCH_SIZE: u64 = 100;

/// Poll interval between indexer cycles (in seconds).
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
        "Starting indexer for {} chain(s): {:?}",
        chains.len(),
        chains.iter().map(|c| c.chain_id).collect::<Vec<_>>()
    );

    loop {
        for chain in &chains {
            if let Err(e) = index_chain(&pool, chain).await {
                tracing::error!(
                    chain_id = chain.chain_id,
                    "Indexer error for chain {}: {:?}",
                    chain.chain_id,
                    e
                );
            }
        }

        tokio::time::sleep(std::time::Duration::from_secs(POLL_INTERVAL_SECS)).await;
    }
}

/// Index a single chain: fetch new blocks and process identity + reputation events.
async fn index_chain(pool: &PgPool, chain: &ChainConfig) -> Result<(), Box<dyn std::error::Error>> {
    let provider = provider::create_provider(chain)?;

    // Get the latest block number from the RPC
    let latest_block = provider::get_latest_block(&provider).await?;

    // --- Identity events ---
    let identity_addr = chain.identity_address.to_string();
    let identity_last = crate::db::indexer_state::get_last_block(pool, chain.chain_id, &identity_addr)
        .await?
        .unwrap_or(chain.start_block as i64 - 1);

    if identity_last < latest_block as i64 {
        let from = (identity_last + 1) as u64;
        let to = latest_block;

        // Process in batches
        let mut batch_from = from;
        while batch_from <= to {
            let batch_to = std::cmp::min(batch_from + BLOCK_BATCH_SIZE - 1, to);

            tracing::info!(
                chain_id = chain.chain_id,
                "Indexing identity events blocks {} - {}",
                batch_from,
                batch_to
            );

            identity::index_identity_events(pool, &provider, chain, batch_from, batch_to).await?;

            crate::db::indexer_state::update_last_block(
                pool,
                chain.chain_id,
                &identity_addr,
                batch_to as i64,
            )
            .await?;

            batch_from = batch_to + 1;
        }
    }

    // --- Reputation events ---
    let reputation_addr = chain.reputation_address.to_string();
    let reputation_last =
        crate::db::indexer_state::get_last_block(pool, chain.chain_id, &reputation_addr)
            .await?
            .unwrap_or(chain.start_block as i64 - 1);

    if reputation_last < latest_block as i64 {
        let from = (reputation_last + 1) as u64;
        let to = latest_block;

        let mut batch_from = from;
        while batch_from <= to {
            let batch_to = std::cmp::min(batch_from + BLOCK_BATCH_SIZE - 1, to);

            tracing::info!(
                chain_id = chain.chain_id,
                "Indexing reputation events blocks {} - {}",
                batch_from,
                batch_to
            );

            reputation::index_reputation_events(pool, &provider, chain, batch_from, batch_to)
                .await?;

            crate::db::indexer_state::update_last_block(
                pool,
                chain.chain_id,
                &reputation_addr,
                batch_to as i64,
            )
            .await?;

            batch_from = batch_to + 1;
        }
    }

    Ok(())
}
