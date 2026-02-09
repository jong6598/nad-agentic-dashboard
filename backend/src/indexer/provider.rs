use alloy::primitives::Address;
use alloy::providers::{Provider, ProviderBuilder, RootProvider};
use alloy::transports::http::{Client, Http};

/// Configuration for a single chain to index.
#[derive(Debug, Clone)]
pub struct ChainConfig {
    pub chain_id: i32,
    pub rpc_url: String,
    pub identity_address: Address,
    pub reputation_address: Address,
}

/// The alloy HTTP provider type used throughout the indexer.
pub type HttpProvider = RootProvider<Http<Client>>;

/// Create an alloy HTTP provider for the given chain config.
pub fn create_provider(config: &ChainConfig) -> Result<HttpProvider, Box<dyn std::error::Error>> {
    let url = config.rpc_url.parse()?;
    let provider = ProviderBuilder::new().on_http(url);
    Ok(provider)
}

/// Get the latest block number from the RPC provider.
pub async fn get_latest_block(provider: &HttpProvider) -> Result<u64, Box<dyn std::error::Error>> {
    let block_number = provider.get_block_number().await?;
    Ok(block_number)
}

/// Build all chain configs from environment variables with fallback defaults.
///
/// Environment variables:
/// - MONAD_MAINNET_RPC_URL (default: https://rpc.monad.xyz)
/// - MONAD_TESTNET_RPC_URL (default: https://testnet-rpc.monad.xyz)
/// - INDEX_MAINNET (default: "true") — set to "false" to skip mainnet
/// - INDEX_TESTNET (default: "true") — set to "false" to skip testnet
pub fn get_chain_configs() -> Vec<ChainConfig> {
    let mut configs = Vec::new();

    let index_mainnet = std::env::var("INDEX_MAINNET")
        .unwrap_or_else(|_| "true".to_string());
    let index_testnet = std::env::var("INDEX_TESTNET")
        .unwrap_or_else(|_| "true".to_string());

    if index_mainnet != "false" {
        let rpc_url = std::env::var("MONAD_MAINNET_RPC_URL")
            .unwrap_or_else(|_| "https://rpc.monad.xyz".to_string());

        configs.push(ChainConfig {
            chain_id: 143,
            rpc_url,
            identity_address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
                .parse::<Address>()
                .expect("Invalid mainnet identity address"),
            reputation_address: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
                .parse::<Address>()
                .expect("Invalid mainnet reputation address"),
        });
    }

    if index_testnet != "false" {
        let rpc_url = std::env::var("MONAD_TESTNET_RPC_URL")
            .unwrap_or_else(|_| "https://testnet-rpc.monad.xyz".to_string());

        configs.push(ChainConfig {
            chain_id: 10143,
            rpc_url,
            identity_address: "0x8004A818BFB912233c491871b3d84c89A494BD9e"
                .parse::<Address>()
                .expect("Invalid testnet identity address"),
            reputation_address: "0x8004B663056A597Dffe9eCcC1965A193B7388713"
                .parse::<Address>()
                .expect("Invalid testnet reputation address"),
        });
    }

    configs
}
