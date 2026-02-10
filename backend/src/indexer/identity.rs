use alloy::providers::Provider;
use alloy::rpc::types::Filter;
use alloy::sol;
use alloy::sol_types::SolEvent;
use sqlx::PgPool;

use super::metadata;
use super::provider::{ChainConfig, HttpProvider};
use crate::db;
use crate::types::{NewActivity, NewAgent};

// Define IdentityRegistry events using alloy's sol! macro
sol! {
    event Registered(uint256 indexed agentId, address indexed owner, string uri);
    event URIUpdated(uint256 indexed agentId, string oldURI, string newURI);
    event MetadataSet(uint256 indexed agentId, string key, string value);
}

/// Index identity events (Registered, URIUpdated, MetadataSet) for a block range.
pub async fn index_identity_events(
    pool: &PgPool,
    provider: &HttpProvider,
    chain: &ChainConfig,
    from_block: u64,
    to_block: u64,
) -> Result<(), Box<dyn std::error::Error>> {
    // Build filter for all identity events on the identity contract
    let filter = Filter::new()
        .address(chain.identity_address)
        .from_block(from_block)
        .to_block(to_block)
        .event_signature(vec![
            Registered::SIGNATURE_HASH,
            URIUpdated::SIGNATURE_HASH,
            MetadataSet::SIGNATURE_HASH,
        ]);

    let logs = provider.get_logs(&filter).await?;

    tracing::debug!(
        chain_id = chain.chain_id,
        "Fetched {} identity logs for blocks {} - {}",
        logs.len(),
        from_block,
        to_block
    );

    for log in logs {
        let block_number = log.block_number.unwrap_or(0) as i64;
        let tx_hash = log
            .transaction_hash
            .map(|h| format!("{:#x}", h))
            .unwrap_or_default();
        let log_index = log.log_index.unwrap_or(0) as i32;

        // Determine event type by matching topic0
        let topic0 = match log.topic0() {
            Some(t) => *t,
            None => {
                tracing::warn!("Skipping log with no topic0 at block {}", block_number);
                continue;
            }
        };

        if topic0 == Registered::SIGNATURE_HASH {
            match log.log_decode::<Registered>() {
                Ok(decoded) => {
                    let event = &decoded.inner.data;
                    let agent_id = event.agentId.to::<u64>() as i64;
                    let owner = format!("{:#x}", event.owner);
                    let uri = event.uri.clone();

                    tracing::info!(
                        chain_id = chain.chain_id,
                        agent_id = agent_id,
                        "Registered event: agent {} by {}",
                        agent_id,
                        owner
                    );

                    // Upsert agent
                    let new_agent = NewAgent {
                        agent_id,
                        chain_id: chain.chain_id,
                        owner: owner.clone(),
                        uri: Some(uri.clone()),
                        metadata: None,
                        name: None,
                        description: None,
                        image: None,
                        categories: None,
                        x402_support: false,
                        active: true,
                        block_number: Some(block_number),
                        tx_hash: Some(tx_hash.clone()),
                    };
                    if let Err(e) = db::agents::upsert_agent(pool, &new_agent).await {
                        tracing::error!("Failed to upsert agent {}: {:?}", agent_id, e);
                    }

                    // Insert activity
                    let activity = NewActivity {
                        agent_id,
                        chain_id: chain.chain_id,
                        event_type: "Registered".to_string(),
                        event_data: Some(serde_json::json!({
                            "owner": owner,
                            "uri": uri,
                        })),
                        block_number,
                        tx_hash: tx_hash.clone(),
                        log_index,
                    };
                    if let Err(e) = db::activity::insert_activity(pool, &activity).await {
                        tracing::error!("Failed to insert Registered activity: {:?}", e);
                    }

                    // Trigger metadata fetch in background
                    if !uri.is_empty() {
                        let pool_clone = pool.clone();
                        let uri_clone = uri.clone();
                        let chain_id = chain.chain_id;
                        tokio::spawn(async move {
                            metadata::fetch_and_update_metadata(
                                &pool_clone,
                                agent_id,
                                chain_id,
                                &uri_clone,
                            )
                            .await;
                        });
                    }
                }
                Err(e) => {
                    tracing::error!(
                        "Failed to decode Registered event at block {}: {:?}",
                        block_number,
                        e
                    );
                }
            }
        } else if topic0 == URIUpdated::SIGNATURE_HASH {
            match log.log_decode::<URIUpdated>() {
                Ok(decoded) => {
                    let event = &decoded.inner.data;
                    let agent_id = event.agentId.to::<u64>() as i64;
                    let old_uri = event.oldURI.clone();
                    let new_uri = event.newURI.clone();

                    tracing::info!(
                        chain_id = chain.chain_id,
                        agent_id = agent_id,
                        "URIUpdated event: agent {} uri changed",
                        agent_id
                    );

                    // Update agent URI — we upsert with minimal data; COALESCE in DB preserves other fields
                    let update_agent = NewAgent {
                        agent_id,
                        chain_id: chain.chain_id,
                        owner: String::new(), // will be preserved by COALESCE
                        uri: Some(new_uri.clone()),
                        metadata: None,
                        name: None,
                        description: None,
                        image: None,
                        categories: None,
                        x402_support: false,
                        active: true,
                        block_number: Some(block_number),
                        tx_hash: Some(tx_hash.clone()),
                    };
                    if let Err(e) = db::agents::upsert_agent(pool, &update_agent).await {
                        tracing::error!("Failed to update agent {} URI: {:?}", agent_id, e);
                    }

                    // Insert activity
                    let activity = NewActivity {
                        agent_id,
                        chain_id: chain.chain_id,
                        event_type: "URIUpdated".to_string(),
                        event_data: Some(serde_json::json!({
                            "old_uri": old_uri,
                            "new_uri": new_uri,
                        })),
                        block_number,
                        tx_hash: tx_hash.clone(),
                        log_index,
                    };
                    if let Err(e) = db::activity::insert_activity(pool, &activity).await {
                        tracing::error!("Failed to insert URIUpdated activity: {:?}", e);
                    }

                    // Trigger metadata re-fetch
                    if !new_uri.is_empty() {
                        let pool_clone = pool.clone();
                        let uri_clone = new_uri.clone();
                        let chain_id = chain.chain_id;
                        tokio::spawn(async move {
                            metadata::fetch_and_update_metadata(
                                &pool_clone,
                                agent_id,
                                chain_id,
                                &uri_clone,
                            )
                            .await;
                        });
                    }
                }
                Err(e) => {
                    tracing::error!(
                        "Failed to decode URIUpdated event at block {}: {:?}",
                        block_number,
                        e
                    );
                }
            }
        } else if topic0 == MetadataSet::SIGNATURE_HASH {
            match log.log_decode::<MetadataSet>() {
                Ok(decoded) => {
                    let event = &decoded.inner.data;
                    let agent_id = event.agentId.to::<u64>() as i64;
                    let key = event.key.clone();
                    let value = event.value.clone();

                    tracing::info!(
                        chain_id = chain.chain_id,
                        agent_id = agent_id,
                        "MetadataSet event: agent {} key={}",
                        agent_id,
                        key
                    );

                    // Update the agent's metadata field with the new key-value pair
                    if let Err(e) = update_agent_metadata_field(pool, agent_id, chain.chain_id, &key, &value).await {
                        tracing::error!(
                            "Failed to update metadata field for agent {}: {:?}",
                            agent_id,
                            e
                        );
                    }

                    // Insert activity
                    let activity = NewActivity {
                        agent_id,
                        chain_id: chain.chain_id,
                        event_type: "MetadataSet".to_string(),
                        event_data: Some(serde_json::json!({
                            "key": key,
                            "value": value,
                        })),
                        block_number,
                        tx_hash: tx_hash.clone(),
                        log_index,
                    };
                    if let Err(e) = db::activity::insert_activity(pool, &activity).await {
                        tracing::error!("Failed to insert MetadataSet activity: {:?}", e);
                    }
                }
                Err(e) => {
                    tracing::error!(
                        "Failed to decode MetadataSet event at block {}: {:?}",
                        block_number,
                        e
                    );
                }
            }
        }
    }

    Ok(())
}

/// Update a single metadata key-value on an agent's JSONB metadata column.
/// If the agent doesn't exist yet, this is a no-op (the Registered event
/// should have created it already).
async fn update_agent_metadata_field(
    pool: &PgPool,
    agent_id: i64,
    chain_id: i32,
    key: &str,
    value: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE agents
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object($3::text, $4::text),
            updated_at = NOW()
        WHERE agent_id = $1 AND chain_id = $2
        "#,
    )
    .bind(agent_id)
    .bind(chain_id)
    .bind(key)
    .bind(value)
    .execute(pool)
    .await?;

    Ok(())
}
