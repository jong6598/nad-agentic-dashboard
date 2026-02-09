# System Architecture

## Overview

The NAD-8004 Dashboard is a full-stack application that indexes, aggregates, and visualizes EIP-8004 (Agent Identity) and x402 (Payment Protocol) data from the Monad blockchain. It serves as a comprehensive dashboard for exploring agent identities, reputations, and on-chain activities.

---

## High-Level System Diagram

```
+-------------------+      +-------------------+
|   Monad Mainnet   |      |   Monad Testnet   |
|   (Chain 143)     |      |   (Chain 10143)   |
|                   |      |                   |
| IdentityRegistry  |      | IdentityRegistry  |
| ReputationRegistry|      | ReputationRegistry|
+--------+----------+      +--------+----------+
         |                           |
         |  RPC (eth_getLogs)        |  RPC (eth_getLogs)
         |                           |
         +----------+   +------------+
                    |   |
                    v   v
         +---------------------+
         |    Event Indexer    |
         |    (Rust / alloy)  |
         |                     |
         | - Poll blocks       |
         | - Parse events      |
         | - Fetch metadata    |
         | - Track cursors     |
         +----------+----------+
                    |
                    | sqlx (INSERT/UPDATE)
                    |
         +----------v----------+
         |    PostgreSQL DB    |
         |                     |
         | - agents            |
         | - feedbacks         |
         | - feedback_responses|
         | - activity_log      |
         | - indexer_state     |
         +----------+----------+
                    |
                    | sqlx (SELECT)
                    |
         +----------v----------+
         |    Axum API Server  |
         |    (Rust)           |
         |                     |
         | GET /api/agents     |
         | GET /api/agents/:id |
         | GET /api/leaderboard|
         | GET /api/stats      |
         | ...                 |
         +----------+----------+
                    |
                    | HTTP/JSON (CORS)
                    |
         +----------v----------+
         |  Next.js Frontend   |
         |  (App Router)       |
         |                     |
         | - Agent Explorer    |
         | - Agent Detail      |
         | - Leaderboard       |
         | - Create Molt       |
         | - Wallet Connect    |
         +---------------------+
                    |
                    | Browser
                    v
              +----------+
              |   User   |
              +----------+
```

---

## Data Flow

### 1. On-Chain Events to Database

```
Monad Chain
    |
    | Block production (events emitted by IdentityRegistry / ReputationRegistry)
    v
Event Indexer (Rust)
    |
    | 1. Poll eth_getLogs from last indexed block to latest
    | 2. Parse event logs (Registered, URIUpdated, MetadataSet,
    |    NewFeedback, FeedbackRevoked, ResponseAppended)
    | 3. On Registered/URIUpdated: fetch agentURI, parse EIP-8004 metadata
    | 4. Write parsed data to PostgreSQL
    | 5. Update indexer_state cursor (last_block per chain/contract)
    v
PostgreSQL
    |
    | Tables: agents, feedbacks, activity_log, indexer_state
    v
Ready for API queries
```

### 2. API Request Flow

```
User Browser
    |
    | HTTP GET /api/agents?search=legal&sort=score
    v
Next.js Frontend (Client-Side)
    |
    | TanStack Query hook (useAgents) triggers fetch
    v
Axum API Server
    |
    | 1. Parse and validate query parameters
    | 2. Execute SQL query via sqlx
    | 3. Serialize result as JSON
    v
PostgreSQL
    |
    | SELECT with filters, sorting, pagination
    v
JSON Response -> TanStack Query cache -> React render -> UI
```

### 3. Wallet Interaction Flow (Create Molt)

```
User Browser
    |
    | Fill "Create Molt" form, click Submit
    v
Next.js Frontend
    |
    | wagmi useWriteContract -> IdentityRegistry.register(uri)
    v
MetaMask / Wallet
    |
    | Sign and broadcast transaction to Monad chain
    v
Monad Chain
    |
    | Transaction mined, Registered event emitted
    v
Event Indexer (picks up on next poll)
    |
    | Indexes new agent, fetches metadata
    v
PostgreSQL -> API -> Frontend (agent appears in dashboard)
```

---

## Component Descriptions

### Frontend (Next.js 15 / App Router)

| Component       | Technology          | Responsibility                                         |
|----------------|---------------------|--------------------------------------------------------|
| App Router      | Next.js 15          | File-based routing (`/agents`, `/agents/[agentId]`, `/leaderboard`, `/create`) |
| UI Components   | shadcn/ui + Tailwind CSS v4 | Reusable UI primitives (Button, Card, Tabs, Badge, Skeleton, etc.) |
| State Management| TanStack Query      | Server state caching, background refetch, pagination   |
| API Client      | fetch / axios       | HTTP client layer with typed request/response          |
| Wallet          | wagmi + viem        | Wallet connection, chain switching, contract writes    |
| Charts          | recharts            | Reputation score time-series visualization             |
| Design System   | Tailwind v4 @theme  | OKLCH color palette, Monad-inspired dark purple/violet theme |

**Key Pages:**

- `/agents` -- Agent explorer with search, filters, and sorted sections (Top Scored, Recently Deployed, Recent Reputation)
- `/agents/[agentId]` -- Agent detail with holographic 3D card, reputation chart, and activity tabs
- `/leaderboard` -- Ranked agent table with gold/silver/bronze badges
- `/create` -- Create Molt form for registering new agents via IdentityRegistry

### Backend (Rust / Axum)

| Component       | Technology          | Responsibility                                         |
|----------------|---------------------|--------------------------------------------------------|
| HTTP Server     | Axum + tower-http   | Route handling, CORS, request parsing                  |
| Database        | sqlx (PostgreSQL)   | Type-safe async SQL queries, connection pooling        |
| Event Indexer   | alloy               | Monad RPC polling, event log parsing, ABI decoding     |
| Metadata Fetcher| reqwest             | HTTP client for fetching agent metadata URIs           |
| Logging         | tracing             | Structured logging for diagnostics                     |
| Configuration   | dotenvy             | Environment variable loading (.env files)              |

**API Modules:**

- `api/agents.rs` -- Handlers for `/api/agents`, `/api/agents/:id`, `/api/agents/:id/reputation`, `/api/agents/:id/activity`
- `api/leaderboard.rs` -- Handler for `/api/leaderboard`
- `api/stats.rs` -- Handler for `/api/stats`

**DB Modules:**

- `db/agents.rs` -- Agent CRUD and search queries
- `db/feedbacks.rs` -- Feedback queries and aggregation
- `db/activity.rs` -- Activity log queries with event type filtering
- `db/indexer_state.rs` -- Cursor tracking for the event indexer

**Indexer Modules:**

- `indexer/provider.rs` -- Monad RPC provider setup (alloy)
- `indexer/identity.rs` -- IdentityRegistry event parsing (Registered, URIUpdated, MetadataSet)
- `indexer/reputation.rs` -- ReputationRegistry event parsing (NewFeedback, FeedbackRevoked, ResponseAppended)
- `indexer/metadata.rs` -- Agent metadata URI fetching and EIP-8004 schema parsing

### Database (PostgreSQL)

| Table              | Purpose                                                |
|--------------------|--------------------------------------------------------|
| `agents`           | Registered agents with resolved metadata               |
| `feedbacks`        | Individual reputation feedbacks from the ReputationRegistry |
| `feedback_responses` | Responses appended to feedbacks by agent owners      |
| `activity_log`     | Unified timeline of all on-chain events per agent      |
| `indexer_state`    | Cursor tracking (last indexed block per chain/contract)|

**Key Constraints:**

- `agents`: `UNIQUE(agent_id, chain_id)` ensures no duplicate agents per chain
- `indexer_state`: `PRIMARY KEY(chain_id, contract_address)` tracks one cursor per contract per chain

---

## Contract Addresses

| Network            | Chain ID | IdentityRegistry                              | ReputationRegistry                             |
|--------------------|----------|------------------------------------------------|------------------------------------------------|
| Monad Mainnet      | 143      | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`  | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`  |
| Monad Testnet      | 10143    | `0x8004A818BFB912233c491871b3d84c89A494BD9e`  | `0x8004B663056A597Dffe9eCcC1965A193B7388713`  |

---

## Environment Variables

| Variable           | Description                        | Example                        |
|--------------------|------------------------------------|--------------------------------|
| `DATABASE_URL`     | PostgreSQL connection string       | `postgres://user:pass@localhost:5432/nad8004` |
| `MONAD_MAINNET_RPC`| Monad Mainnet RPC endpoint        | `https://rpc.monad.xyz`       |
| `MONAD_TESTNET_RPC`| Monad Testnet RPC endpoint        | `https://testnet-rpc.monad.xyz` |
| `CORS_ORIGINS`     | Allowed CORS origins (comma-sep)  | `http://localhost:3000`        |
| `RUST_LOG`         | Logging level                      | `info,nad8004=debug`          |
| `PORT`             | API server port                    | `8080`                         |

---

## Deployment Topology

```
+------------------------------+
|        Production            |
|                              |
|  +--------+  +--------+     |
|  | Next.js|  |  Axum  |     |
|  | (SSR)  |  | (API)  |     |
|  | :3000  |  | :8080  |     |
|  +---+----+  +---+----+     |
|      |           |           |
|      +-----------+           |
|            |                 |
|      +-----v------+         |
|      | PostgreSQL  |         |
|      |   :5432     |         |
|      +-------------+         |
+------------------------------+
         |         |
    Monad RPC   Monad RPC
   (Mainnet)   (Testnet)
```

For local development, all three services (Next.js, Axum, PostgreSQL) run on localhost with standard ports.
