# Monad Chain Configuration

This document defines the Monad blockchain networks, RPC endpoints, contract addresses, and event signatures used by the NAD-8004 Dashboard.

---

## Supported Networks

### Monad Mainnet

| Property       | Value                                  |
|---------------|----------------------------------------|
| Chain ID       | `143`                                  |
| Network Name   | Monad Mainnet                          |
| RPC URL        | `https://rpc.monad.xyz`               |
| Block Explorer | `https://monadexplorer.com`            |
| Currency       | MON                                    |
| Currency Symbol| MON                                    |
| Decimals       | 18                                     |

### Monad Testnet

| Property       | Value                                  |
|---------------|----------------------------------------|
| Chain ID       | `10143`                                |
| Network Name   | Monad Testnet                          |
| RPC URL        | `https://testnet-rpc.monad.xyz`       |
| Block Explorer | `https://testnet.monadexplorer.com`    |
| Currency       | MON                                    |
| Currency Symbol| MON                                    |
| Decimals       | 18                                     |

---

## Contract Addresses

| Contract            | Monad Mainnet (143)                            | Monad Testnet (10143)                          |
|---------------------|------------------------------------------------|------------------------------------------------|
| IdentityRegistry    | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`  | `0x8004A818BFB912233c491871b3d84c89A494BD9e`  |
| ReputationRegistry  | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`  | `0x8004B663056A597Dffe9eCcC1965A193B7388713`  |

### Explorer Links

**Mainnet:**
- IdentityRegistry: `https://monadexplorer.com/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ReputationRegistry: `https://monadexplorer.com/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

**Testnet:**
- IdentityRegistry: `https://testnet.monadexplorer.com/address/0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ReputationRegistry: `https://testnet.monadexplorer.com/address/0x8004B663056A597Dffe9eCcC1965A193B7388713`

---

## Event Signatures

The indexer listens for the following events emitted by the two registry contracts. Event signatures are provided as both human-readable Solidity declarations and their corresponding Keccak-256 topic hashes.

### IdentityRegistry Events

#### Registered

Emitted when a new agent is registered.

```solidity
event Registered(uint256 indexed agentId, address indexed owner, string uri);
```

| Field    | Type    | Indexed | Description                     |
|----------|---------|---------|---------------------------------|
| agentId  | uint256 | Yes     | Unique agent identifier         |
| owner    | address | Yes     | Address that registered the agent |
| uri      | string  | No      | Initial metadata URI            |

**Topic 0:** `keccak256("Registered(uint256,address,string)")`

---

#### URIUpdated

Emitted when an agent's metadata URI is updated.

```solidity
event URIUpdated(uint256 indexed agentId, string oldURI, string newURI);
```

| Field    | Type    | Indexed | Description                     |
|----------|---------|---------|---------------------------------|
| agentId  | uint256 | Yes     | Agent identifier                |
| oldURI   | string  | No      | Previous metadata URI           |
| newURI   | string  | No      | Updated metadata URI            |

**Topic 0:** `keccak256("URIUpdated(uint256,string,string)")`

---

#### MetadataSet

Emitted when a key-value metadata entry is set for an agent.

```solidity
event MetadataSet(uint256 indexed agentId, string key, string value);
```

| Field    | Type    | Indexed | Description                     |
|----------|---------|---------|---------------------------------|
| agentId  | uint256 | Yes     | Agent identifier                |
| key      | string  | No      | Metadata key                    |
| value    | string  | No      | Metadata value                  |

**Topic 0:** `keccak256("MetadataSet(uint256,string,string)")`

---

### ReputationRegistry Events

#### NewFeedback

Emitted when a client submits feedback for an agent.

```solidity
event NewFeedback(
    uint256 indexed agentId,
    address indexed client,
    uint256 feedbackIndex,
    uint256 value,
    uint256 valueDecimals,
    string tag1,
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
);
```

| Field          | Type    | Indexed | Description                           |
|----------------|---------|---------|---------------------------------------|
| agentId        | uint256 | Yes     | Agent receiving feedback              |
| client         | address | Yes     | Address submitting feedback           |
| feedbackIndex  | uint256 | No      | Sequential feedback index             |
| value          | uint256 | No      | Numeric feedback value                |
| valueDecimals  | uint256 | No      | Decimal precision for value           |
| tag1           | string  | No      | Primary descriptive tag               |
| tag2           | string  | No      | Secondary descriptive tag             |
| endpoint       | string  | No      | Agent endpoint that was evaluated     |
| feedbackURI    | string  | No      | URI to extended feedback data         |
| feedbackHash   | bytes32 | No      | Hash of the feedback content          |

**Topic 0:** `keccak256("NewFeedback(uint256,address,uint256,uint256,uint256,string,string,string,string,bytes32)")`

---

#### FeedbackRevoked

Emitted when a previously submitted feedback is revoked by its author.

```solidity
event FeedbackRevoked(uint256 indexed agentId, address indexed client, uint256 feedbackIndex);
```

| Field          | Type    | Indexed | Description                           |
|----------------|---------|---------|---------------------------------------|
| agentId        | uint256 | Yes     | Agent whose feedback is being revoked |
| client         | address | Yes     | Original feedback author              |
| feedbackIndex  | uint256 | No      | Index of the revoked feedback         |

**Topic 0:** `keccak256("FeedbackRevoked(uint256,address,uint256)")`

---

#### ResponseAppended

Emitted when an agent owner appends a response to a feedback entry.

```solidity
event ResponseAppended(uint256 indexed agentId, uint256 feedbackIndex, string responseURI);
```

| Field          | Type    | Indexed | Description                           |
|----------------|---------|---------|---------------------------------------|
| agentId        | uint256 | Yes     | Agent responding to feedback          |
| feedbackIndex  | uint256 | No      | Index of the feedback being responded to |
| responseURI    | string  | No      | URI pointing to the response content  |

**Topic 0:** `keccak256("ResponseAppended(uint256,uint256,string)")`

---

## Indexer Configuration

### Polling Strategy

The event indexer uses a polling strategy to fetch logs from the Monad RPC:

| Parameter         | Value        | Description                                       |
|-------------------|-------------|---------------------------------------------------|
| Poll Interval     | 2 seconds   | Time between RPC polling cycles                   |
| Block Batch Size  | 1000        | Maximum blocks fetched per `eth_getLogs` call      |
| Start Block       | 0 (or last) | Start from genesis or last indexed block           |

### Cursor Tracking

The indexer maintains a cursor in the `indexer_state` table:

```
PRIMARY KEY(chain_id, contract_address)
```

Each row tracks the `last_block` successfully indexed for a given contract on a given chain. On startup, the indexer resumes from `last_block + 1`.

### Indexed Contracts Per Chain

For each supported chain, the indexer polls two contracts:

1. **IdentityRegistry** -- Listens for `Registered`, `URIUpdated`, `MetadataSet`
2. **ReputationRegistry** -- Listens for `NewFeedback`, `FeedbackRevoked`, `ResponseAppended`

---

## Frontend Chain Configuration

The frontend uses wagmi/viem chain definitions. The chain configuration should be defined in `/frontend/src/lib/chains.ts`:

```typescript
import { defineChain } from "viem";

export const monadMainnet = defineChain({
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://monadexplorer.com",
    },
  },
});

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
});
```
