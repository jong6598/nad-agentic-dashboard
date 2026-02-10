# NAD-8004 Dashboard

An EIP-8004 Agent Identity Dashboard built on the Monad blockchain. Explore, track, and manage AI agent identities and reputations on-chain with a modern, visually rich interface featuring holographic 3D agent cards.

---

## Key Features

- **Agent Explorer** -- Browse and search registered AI agents with filtering by category, chain, and reputation score
- **Holographic Agent Card** -- Pokemon-card-style 3D holographic cards with mouse-tracking effects for each agent's detail view
- **Reputation Tracking** -- View reputation scores, feedback history, and score trends over time with interactive charts
- **Leaderboard** -- Ranked agent table with gold/silver/bronze badges based on reputation scores
- **Wallet Integration** -- Connect your wallet via MetaMask to interact with Monad chain, register agents, and submit feedback
- **Multi-Chain Support** -- Supports both Monad Mainnet (chain 143) and Monad Testnet (chain 10143)

---

## Tech Stack

| Layer    | Technology                                                           |
|----------|----------------------------------------------------------------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui     |
| Wallet   | wagmi, viem                                                          |
| Charts   | recharts                                                             |
| Backend  | Rust, Axum, sqlx, alloy                                              |
| Database | PostgreSQL 15+                                                       |
| Chain    | Monad Mainnet (143), Monad Testnet (10143)                           |

---

## Quick Start

For detailed setup instructions, see the [Local Development Setup Guide](./docs/deployment.md).

```bash
# Clone the repository
git clone https://github.com/your-org/nad-8004-dashboard.git
cd nad-8004-dashboard

# Backend
cd backend
cp .env.example .env   # Edit with your database and RPC credentials
cargo run

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
nad-8004-dashboard/
├── frontend/               # Next.js 15 frontend application
│   ├── src/
│   │   ├── app/            # App Router pages (agents, leaderboard, create)
│   │   ├── components/     # React components (agents, layout, wallet, ui)
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── lib/            # Utilities, API client, chain config, contracts
│   │   ├── providers/      # Web3Provider (wagmi + TanStack Query)
│   │   └── types/          # Shared TypeScript types
│   └── package.json
├── backend/                # Rust backend (API server + event indexer)
│   ├── src/
│   │   ├── api/            # Axum route handlers
│   │   ├── db/             # Database query modules (sqlx)
│   │   ├── indexer/        # Monad event indexer (alloy)
│   │   ├── types/          # Shared Rust types
│   │   └── main.rs         # Entry point
│   ├── migrations/         # PostgreSQL migration files
│   └── Cargo.toml
├── docs/                   # Documentation
│   ├── architecture.md     # System architecture and data flow
│   ├── api-contract.md     # API contract specification
│   ├── api-reference.md    # Complete API reference with examples
│   ├── deployment.md       # Local development setup guide
│   └── monad-chains.md     # Chain configuration and contract addresses
└── CLAUDE.md               # Project guidelines and agent team roles
```

---

## Documentation

| Document                                       | Description                                  |
|------------------------------------------------|----------------------------------------------|
| [Architecture](./docs/architecture.md)         | System diagram and data flow                 |
| [API Contract](./docs/api-contract.md)         | API endpoint specification                   |
| [API Reference](./docs/api-reference.md)       | Complete API docs with curl examples         |
| [Deployment](./docs/deployment.md)             | Local development setup guide                |
| [Monad Chains](./docs/monad-chains.md)         | Chain config and contract addresses          |

---

## Screenshots

> Screenshots will be added once the UI is finalized.

---

## Contract Addresses

| Network         | IdentityRegistry                               | ReputationRegistry                              |
|-----------------|------------------------------------------------|-------------------------------------------------|
| Mainnet (143)   | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`   | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`   |
| Testnet (10143) | `0x8004A818BFB912233c491871b3d84c89A494BD9e`   | `0x8004B663056A597Dffe9eCcC1965A193B7388713`   |

---

## License

This project is licensed under the [MIT License](./LICENSE).
