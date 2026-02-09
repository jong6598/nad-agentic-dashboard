# NAD-8004 Dashboard — Implementation Plan

## Context

EIP-8004(Agent Identity) + x402(Payment) 기반 대시보드를 Monad 체인 위에 구축한다. 8004scan.io의 상위 호환으로, 에이전트 신원/평판/활동을 시각적으로 보여주는 대시보드. 핵심 차별점은 포켓몬카드 스타일의 홀로그래픽 3D 에이전트 카드 UI.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Wagmi + Viem |
| Backend | Rust + Axum + PostgreSQL (sqlx, alloy) |
| Chain | Monad Mainnet (143) + Testnet (10143) |

## Contract Addresses

| Network | IdentityRegistry | ReputationRegistry |
|---------|------------------|--------------------|
| Mainnet (143) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Testnet (10143) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

---

## Phase 1: Foundation (Parallel)

### Tech Lead — API Contract (blocks all FE/BE type work)
- **TL-1**: `/docs/api-contract.md` — 6 API endpoints 정의 (GET /api/agents, /agents/:id, /agents/:id/reputation, /agents/:id/activity, /leaderboard, /stats) with request/response shapes
- **TL-2**: `/docs/shared-types.md` — Agent, Feedback, Activity 등 공유 타입 정의

### Backend Developer — Rust Scaffolding (`feature/backend-scaffold`)
- **BE-1**: `cargo init` + Cargo.toml (axum, tokio, serde, sqlx, alloy, reqwest, tower-http, tracing, dotenvy) + basic Axum server with health check + CORS
- **BE-2**: PostgreSQL migrations — agents, feedbacks, feedback_responses, activity_log, indexer_state (5 files)
- **BE-3**: DB query module — `/backend/src/db/` (agents.rs, feedbacks.rs, activity.rs, indexer_state.rs)
- **BE-4**: Types module — `/backend/src/types/mod.rs` (depends on TL-1)
- **BE-5**: API route handlers — `/backend/src/api/` (agents.rs, leaderboard.rs, stats.rs)

### Frontend Developer — Next.js Scaffolding (`feature/frontend-scaffold`)
- **FE-1**: `create-next-app` + install wagmi, viem, @tanstack/react-query
- **FE-2**: `/frontend/src/lib/chains.ts` (Monad chain defs) + `/frontend/src/lib/wagmi.ts` + `/frontend/src/lib/contracts.ts` (addresses + ABI)
- **FE-3**: `/frontend/src/lib/api.ts` + `/frontend/src/types/index.ts` + TanStack Query hooks (depends on TL-1)
- **FE-4**: App Router page stubs — /agents, /agents/[agentId], /leaderboard, /create

### Designer — Design System (`feature/frontend-design-system`)
- **DS-1**: Tailwind v4 `@theme` (OKLCH, Monad-inspired dark purple/violet palette) + shadcn/ui components install (Button, Input, Card, Tabs, Badge, Sheet, Skeleton, Dialog) (depends on FE-1)
- **DS-2**: Header (logo, nav links, Connect Wallet, mobile hamburger → Sheet drawer) + Footer + MainLayout

### Docs Writer (`feature/docs-architecture`)
- **DW-1**: `/docs/architecture.md` — system diagram, data flow
- **DW-2**: `/docs/monad-chains.md` — chain config, contract addresses, event signatures

---

## Phase 2: Core Features

### Backend Developer — Indexer (`feature/backend-indexer`)
- **BE-6**: Event indexer — poll Monad RPC with alloy, parse Registered/URIUpdated/MetadataSet/NewFeedback/FeedbackRevoked/ResponseAppended, store in DB, track cursor per chain/contract
- **BE-7**: Metadata fetcher — on Registered/URIUpdated, fetch agentURI JSON, parse EIP-8004 schema, update agents table

### Designer — Components (`feature/frontend-agents-page`)
- **DS-3**: AgentCard — image, name, description, service tags, reputation score, x402 badge, chain badge
- **DS-4**: SearchBar (debounced) + CategoryFilter (All/Legal/Design/Trading/DeFi/Arbitrage chips) + ChainFilter
- **DS-5**: LeaderboardTable — rank badges (gold/silver/bronze), agent info, score

### Frontend Developer — Pages
- **FE-5**: `/agents` page — Banner + search + filters + 3 sections (Top Scored, Recently Deployed, Recent Reputation) (`feature/frontend-agents-page`, depends on DS-3, DS-4, FE-3)
- **FE-6**: `/leaderboard` page (`feature/frontend-leaderboard`, depends on DS-5)
- **FE-7**: Wallet connection — ConnectButton + ChainSwitcher, integrate into Header (`feature/frontend-wallet`, depends on FE-2, DS-2)

---

## Phase 3: Agent Detail Page (Signature Feature)

### Designer (`feature/frontend-agent-detail`)
- **DS-6**: HoloCard — 포켓몬카드 스타일 홀로그래픽 3D 카드
  - `perspective: 1000px`, `transform-style: preserve-3d`
  - Mouse tracking → `rotateX/rotateY` via CSS custom properties
  - Holographic shimmer: `conic-gradient` + `mix-blend-mode: color-dodge`
  - Tags: Newbie, X402-Verified, High Score
  - `prefers-reduced-motion` fallback
  - Reference: `simeydotme/pokemon-cards-css`

### Frontend Developer (`feature/frontend-agent-detail`)
- **FE-8**: `/agents/[agentId]` page — HoloCard + Tabs structure (depends on DS-6, FE-3)
- **FE-9**: Activity tabs — IdentityActivityTab (registration events), ReputationActivityTab (feedback given/received), LaborTab (commissions)
- **FE-10**: RatingChart — reputation score over time (recharts), time range selector (7d/30d/90d/All)

---

## Phase 4: Polish & QA

### Frontend Developer
- **FE-11**: `/create` page — Create Molt form + IdentityRegistry.register() via wagmi useWriteContract (`feature/frontend-create-molt`)

### QA/Tester
- **QA-1**: Backend integration tests — API endpoints (`feature/backend-tests`)
- **QA-2**: Frontend component tests — Vitest + React Testing Library (`feature/frontend-tests`)
- **QA-3**: E2E tests — Playwright (search, filter, detail, wallet, create) (`feature/e2e-tests`)
- **QA-4**: Indexer integration test — mock RPC, verify parsing + storage (`feature/backend-tests`)
- **QA-5**: Cross-browser + responsive testing (Chrome/Firefox/Safari, mobile/tablet/desktop)

### Docs Writer
- **DW-3**: `/docs/deployment.md` — local dev setup
- **DW-4**: `/docs/api-reference.md` — complete endpoint docs
- **DW-5**: Update all README files

---

## Critical Path

```
TL-1 (API Contract) ─┬─> BE-4 (Types) ──> BE-5 (Handlers)
                      └─> FE-3 (API Client)

BE-1 ──> BE-2 ──> BE-3 ──┬──> BE-5 ──> BE-6 ──> BE-7

FE-1 ──> DS-1 ──┬──> DS-2 ──> FE-7
                ├──> DS-3 + DS-4 ──> FE-5
                ├──> DS-5 ──> FE-6
                └──> DS-6 ──> FE-8 ──> FE-9 ──> FE-10

FE-7 ──> FE-11 (Create Molt)
```

## DB Schema (Key Tables)

```sql
-- agents
(id SERIAL PK, agent_id BIGINT, chain_id INT, owner TEXT, uri TEXT,
 metadata JSONB, name TEXT, description TEXT, image TEXT,
 x402_support BOOLEAN, active BOOLEAN, created_at TIMESTAMPTZ,
 UNIQUE(agent_id, chain_id))

-- feedbacks
(id SERIAL PK, agent_id BIGINT, chain_id INT, client_address TEXT,
 feedback_index BIGINT, value NUMERIC, value_decimals INT,
 tag1 TEXT, tag2 TEXT, endpoint TEXT, feedback_uri TEXT,
 feedback_hash TEXT, revoked BOOLEAN DEFAULT false,
 block_number BIGINT, tx_hash TEXT, created_at TIMESTAMPTZ)

-- activity_log (unified timeline)
(id SERIAL PK, agent_id BIGINT, chain_id INT, event_type TEXT,
 event_data JSONB, block_number BIGINT, tx_hash TEXT,
 log_index INT, created_at TIMESTAMPTZ)

-- indexer_state (cursor tracking)
(chain_id INT, contract_address TEXT, last_block BIGINT,
 updated_at TIMESTAMPTZ, PRIMARY KEY(chain_id, contract_address))
```

## File Structure

```
frontend/src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── agents/page.tsx, [agentId]/page.tsx
│   ├── leaderboard/page.tsx
│   └── create/page.tsx
├── components/
│   ├── layout/ (Header, Footer, MainLayout)
│   ├── agents/ (AgentCard, HoloCard, SearchBar, CategoryFilter, ChainFilter, *Tab, RatingChart)
│   ├── leaderboard/ (LeaderboardTable)
│   ├── wallet/ (ConnectButton, ChainSwitcher)
│   └── ui/ (shadcn components)
├── lib/ (utils, api, chains, wagmi, contracts)
├── hooks/ (useAgents, useAgent, useLeaderboard, useChainId, useAgentActivity)
├── providers/ (Web3Provider)
└── types/ (index.ts)

backend/src/
├── main.rs
├── api/ (mod, agents, leaderboard, stats)
├── indexer/ (mod, provider, identity, reputation, metadata)
├── db/ (mod, agents, feedbacks, activity, indexer_state)
├── types/ (mod)
└── migrations/ (001-005.sql)
```

## Verification
1. `cargo build` in backend/ — compiles without errors
2. `npm run dev` in frontend/ — dev server starts
3. Backend indexer connects to Monad RPC and starts indexing events
4. `/api/agents` returns indexed agents from DB
5. Frontend /agents page displays agent cards with real data
6. /agents/[agentId] shows HoloCard with holographic effect
7. Connect Wallet works with MetaMask on Monad chain
8. All QA tests pass
