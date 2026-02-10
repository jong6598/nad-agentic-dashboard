# Shared Types

This document defines the data types shared between the frontend and backend. Both layers must conform to these shapes to ensure consistent serialization/deserialization across the API boundary.

- **Frontend usage:** `/frontend/src/types/index.ts` (TypeScript interfaces)
- **Backend usage:** `/backend/src/types/mod.rs` (Rust structs with `serde::Serialize`/`Deserialize`)

---

## Agent

Represents an EIP-8004 registered agent with its resolved metadata and computed reputation.

```typescript
interface Agent {
  agent_id: number;          // On-chain agent ID (uint256, fits in JS number for practical IDs)
  chain_id: number;          // Monad chain ID (143 = mainnet, 10143 = testnet)
  owner: string;             // Ethereum address of the agent owner (0x-prefixed, checksummed)
  uri: string;               // Agent metadata URI (EIP-8004 agentURI)
  name: string;              // Human-readable agent name (from metadata)
  description: string;       // Agent description (from metadata)
  image: string;             // Agent avatar/image URL (from metadata)
  categories: string[];      // Service categories (e.g., ["Legal", "DeFi"])
  x402_support: boolean;     // Whether the agent supports x402 payment protocol
  active: boolean;           // Whether the agent is currently active
  metadata: AgentMetadata;   // Full parsed EIP-8004 metadata object
  reputation_score: number;  // Computed average reputation score (0.0 - 5.0)
  feedback_count: number;    // Total number of feedbacks received
  created_at: string;        // ISO 8601 timestamp of registration (e.g., "2025-01-01T00:00:00Z")
}
```

**Notes:**
- The composite identifier for an agent is `{chain_id}-{agent_id}` (e.g., `"143-1"`).
- `reputation_score` is a decimal value between 0.0 and 5.0, computed as the mean of all non-revoked feedback values.
- When listed via `GET /api/agents`, the `uri` and `metadata` fields may be omitted for brevity.

---

## AgentMetadata

Parsed EIP-8004 agent metadata, fetched from the agent's `uri`.

```typescript
interface AgentMetadata {
  version: string;                    // Metadata schema version (e.g., "1.0")
  endpoints: AgentEndpoint[];         // Service endpoints exposed by the agent
  capabilities: string[];             // List of capability identifiers (e.g., ["contract-review"])
}

interface AgentEndpoint {
  url: string;        // Endpoint URL
  protocol: string;   // Protocol identifier (e.g., "x402", "http", "grpc")
}
```

---

## Feedback

Represents a single on-chain reputation feedback submitted to the ReputationRegistry.

```typescript
interface Feedback {
  id: number;                // Internal database ID
  agent_id: number;          // Target agent's on-chain ID
  chain_id: number;          // Chain where the feedback was submitted
  client_address: string;    // Ethereum address of the feedback submitter (0x-prefixed)
  feedback_index: number;    // On-chain feedback index for this agent
  value: number;             // Feedback value (numeric score)
  value_decimals: number;    // Decimal precision for the value field
  tag1: string;              // Primary tag (e.g., "quality", "speed")
  tag2: string;              // Secondary tag (e.g., "fast", "accurate")
  endpoint: string;          // The agent endpoint that was evaluated
  feedback_uri: string;      // URI pointing to extended feedback data
  feedback_hash: string;     // Hash of the feedback content (0x-prefixed)
  revoked: boolean;          // Whether this feedback has been revoked
  tx_hash: string;           // Transaction hash of the feedback submission (0x-prefixed)
  created_at: string;        // ISO 8601 timestamp
}
```

**Notes:**
- `value` combined with `value_decimals` represents the actual score: `actual = value / (10 ^ value_decimals)`.
- Revoked feedbacks (`revoked: true`) are excluded from reputation score calculations.

---

## Activity

Unified activity log entry capturing all on-chain events related to an agent.

```typescript
interface Activity {
  id: number;                // Internal database ID
  agent_id: number;          // Agent's on-chain ID
  chain_id: number;          // Chain where the event occurred
  event_type: EventType;     // Type of on-chain event
  event_data: object;        // Event-specific payload (JSONB, shape varies by event_type)
  block_number: number;      // Block number where the event was emitted
  tx_hash: string;           // Transaction hash (0x-prefixed)
  log_index: number;         // Log index within the transaction
  created_at: string;        // ISO 8601 timestamp (derived from block timestamp)
}
```

### EventType

```typescript
type EventType =
  | "Registered"         // Agent registered in IdentityRegistry
  | "URIUpdated"         // Agent URI updated in IdentityRegistry
  | "MetadataSet"        // Agent metadata key-value set in IdentityRegistry
  | "NewFeedback"        // New feedback submitted to ReputationRegistry
  | "FeedbackRevoked"    // Existing feedback revoked in ReputationRegistry
  | "ResponseAppended";  // Response appended to a feedback in ReputationRegistry
```

### Event Data Shapes

Each `event_type` has a specific `event_data` structure:

```typescript
// Registered
interface RegisteredEventData {
  owner: string;   // Agent owner address
  uri: string;     // Initial agent URI
}

// URIUpdated
interface URIUpdatedEventData {
  old_uri: string; // Previous URI
  new_uri: string; // Updated URI
}

// MetadataSet
interface MetadataSetEventData {
  key: string;     // Metadata key
  value: string;   // Metadata value
}

// NewFeedback
interface NewFeedbackEventData {
  client: string;          // Feedback submitter address
  feedbackIndex: number;   // Index of the feedback
  value: number;           // Feedback score value
  tag1: string;            // Primary tag
  tag2: string;            // Secondary tag
  endpoint: string;        // Evaluated endpoint
}

// FeedbackRevoked
interface FeedbackRevokedEventData {
  client: string;          // Original feedback submitter
  feedbackIndex: number;   // Index of the revoked feedback
}

// ResponseAppended
interface ResponseAppendedEventData {
  feedbackIndex: number;   // Index of the feedback being responded to
  response_uri: string;    // URI of the response content
}
```

### Event Type Categories

Events are grouped into categories for filtering in the activity tab:

| Category     | Event Types                                          |
|-------------|------------------------------------------------------|
| `identity`   | `Registered`, `URIUpdated`, `MetadataSet`           |
| `reputation` | `NewFeedback`, `FeedbackRevoked`, `ResponseAppended` |
| `labor`      | Reserved for future labor/commission events           |

---

## LeaderboardEntry

Represents an agent's position in the reputation leaderboard.

```typescript
interface LeaderboardEntry {
  rank: number;              // Position in the leaderboard (1-indexed)
  agent_id: number;          // Agent's on-chain ID
  chain_id: number;          // Chain ID
  name: string;              // Agent name
  image: string;             // Agent avatar/image URL
  categories: string[];      // Service categories
  x402_support: boolean;     // x402 payment support
  reputation_score: number;  // Current reputation score
  feedback_count: number;    // Total feedback count
  owner: string;             // Agent owner address
}
```

**Notes:**
- `rank` is computed dynamically based on the current query filters (chain, category).
- Only active agents with at least one non-revoked feedback are eligible for the leaderboard.

---

## DashboardStats

Global dashboard statistics aggregated across all chains.

```typescript
interface DashboardStats {
  total_agents: number;                           // Total registered agents across all chains
  total_feedbacks: number;                        // Total feedback submissions across all chains
  total_chains: number;                           // Number of indexed chains (currently 2)
  agents_by_chain: Record<string, number>;        // Agent count per chain (key = chain ID as string)
  top_categories: CategoryCount[];                // Categories ranked by agent count
  recent_registrations_24h: number;               // Agent registrations in the last 24 hours
  recent_feedbacks_24h: number;                   // Feedback submissions in the last 24 hours
}

interface CategoryCount {
  category: string;   // Category name
  count: number;      // Number of agents in this category
}
```

---

## ReputationHistory

Time-series reputation data for an individual agent, used by the reputation chart.

```typescript
interface ReputationHistory {
  agent_id: number;              // Agent's on-chain ID
  chain_id: number;              // Chain ID
  current_score: number;         // Current (latest) reputation score
  history: ReputationPoint[];    // Daily aggregated score history
  feedbacks: Feedback[];         // Individual feedback records within the range
}

interface ReputationPoint {
  date: string;           // Date string in "YYYY-MM-DD" format
  score: number;          // Cumulative average score as of this date
  feedback_count: number; // Total number of feedbacks received as of this date
}
```

---

## Generic Response Types

### PaginatedResponse

Wrapper for all paginated list endpoints.

```typescript
interface PaginatedResponse<T> {
  data: T[];       // Array of items for the current page
  total: number;   // Total number of items matching the query
  page: number;    // Current page number (1-indexed)
  limit: number;   // Number of items per page
}
```

**Notes:**
- `GET /api/agents` uses `agents` as the key name instead of `data` for readability, but follows the same pagination pattern.
- `GET /api/agents/:id/activity` uses `activities` as the key name.

### ErrorResponse

Standard error response returned for all non-2xx status codes.

```typescript
interface ErrorResponse {
  error: string;    // Short error identifier (e.g., "Not found", "Bad request")
  message: string;  // Human-readable error description with context
  status: number;   // HTTP status code (400, 404, 500)
}
```

---

## Chain ID Constants

```typescript
const CHAIN_IDS = {
  MONAD_MAINNET: 143,
  MONAD_TESTNET: 10143,
} as const;

type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS]; // 143 | 10143
```

---

## Contract Addresses

```typescript
const CONTRACT_ADDRESSES: Record<number, { identity: string; reputation: string }> = {
  143: {
    identity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    reputation: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  },
  10143: {
    identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  },
};
```
