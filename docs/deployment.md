# Local Development Setup

This guide walks you through setting up the NAD-8004 Dashboard for local development.

---

## Prerequisites

| Tool       | Minimum Version | Purpose                        |
|------------|----------------|--------------------------------|
| Node.js    | 18+            | Frontend runtime               |
| npm        | 9+             | Frontend package manager       |
| Rust       | 1.75+          | Backend language               |
| Cargo      | 1.75+          | Backend build tool             |
| PostgreSQL | 15+            | Database                       |
| Git        | 2.0+           | Version control                |

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/nad-8004-dashboard.git
cd nad-8004-dashboard
```

---

## 2. Database Setup

### Create the Database

```bash
# Start PostgreSQL if not already running
# macOS (Homebrew):
brew services start postgresql@15

# Create the database
createdb nad8004

# Or via psql:
psql -c "CREATE DATABASE nad8004;"
```

### Run Migrations

The migration files are located in `backend/migrations/`. Run them in order:

```bash
psql -d nad8004 -f backend/migrations/001_agents.sql
psql -d nad8004 -f backend/migrations/002_feedbacks.sql
psql -d nad8004 -f backend/migrations/003_feedback_responses.sql
psql -d nad8004 -f backend/migrations/004_activity_log.sql
psql -d nad8004 -f backend/migrations/005_indexer_state.sql
```

Or run all at once:

```bash
for f in backend/migrations/*.sql; do psql -d nad8004 -f "$f"; done
```

---

## 3. Backend Setup

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

If no `.env.example` exists, create `backend/.env` with the following:

```env
DATABASE_URL=postgres://your_user:your_password@localhost:5432/nad8004
MONAD_MAINNET_RPC=https://rpc.monad.xyz
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
CORS_ORIGINS=http://localhost:3000
RUST_LOG=info,nad8004=debug
PORT=8080
```

### Build and Run

```bash
cd backend

# Build the project
cargo build

# Run the server (starts API server + event indexer)
cargo run
```

The API server will start at `http://localhost:8080`. You can verify it is running:

```bash
curl http://localhost:8080/api/stats
```

---

## 4. Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Run the Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:3000`.

---

## 5. Environment Variables Reference

### Backend (`backend/.env`)

| Variable             | Required | Default | Description                                              |
|----------------------|----------|---------|----------------------------------------------------------|
| `DATABASE_URL`       | Yes      | --      | PostgreSQL connection string                             |
| `MONAD_MAINNET_RPC`  | Yes      | --      | Monad Mainnet RPC endpoint (chain ID 143)                |
| `MONAD_TESTNET_RPC`  | Yes      | --      | Monad Testnet RPC endpoint (chain ID 10143)              |
| `CORS_ORIGINS`       | No       | `http://localhost:3000` | Comma-separated list of allowed CORS origins |
| `RUST_LOG`           | No       | `info`  | Log level filter (e.g., `info,nad8004=debug`)            |
| `PORT`               | No       | `8080`  | Port for the API server                                  |

### Frontend (`frontend/.env.local`)

| Variable              | Required | Default | Description                          |
|-----------------------|----------|---------|--------------------------------------|
| `NEXT_PUBLIC_API_URL` | Yes      | --      | Backend API base URL                 |

---

## 6. Docker Compose (Optional)

If you prefer running PostgreSQL via Docker, create a `docker-compose.yml` in the project root:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: nad8004-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: nad8004
      POSTGRES_USER: nad8004
      POSTGRES_PASSWORD: nad8004
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d

volumes:
  pgdata:
```

Start the database:

```bash
docker compose up -d postgres
```

When using Docker Compose, set the following `DATABASE_URL` in your backend `.env`:

```env
DATABASE_URL=postgres://nad8004:nad8004@localhost:5432/nad8004
```

---

## 7. Running Both Services Together

Open two terminal windows (or use a terminal multiplexer like tmux):

**Terminal 1 -- Backend:**

```bash
cd backend
cargo run
```

**Terminal 2 -- Frontend:**

```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## 8. Troubleshooting

### PostgreSQL connection refused

- Ensure PostgreSQL is running: `pg_isready` should return "accepting connections".
- Verify the `DATABASE_URL` in your `.env` matches your local PostgreSQL credentials.
- If using Docker, ensure the container is running: `docker compose ps`.

### Rust compilation errors

- Ensure you have Rust 1.75 or higher: `rustc --version`.
- Run `cargo clean && cargo build` to clear cached artifacts.
- If `sqlx` compilation fails, ensure PostgreSQL client libraries are installed:
  - macOS: `brew install libpq`
  - Ubuntu: `sudo apt install libpq-dev`

### Frontend `npm install` fails

- Ensure you have Node.js 18+: `node --version`.
- Delete `node_modules` and `package-lock.json`, then retry:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### CORS errors in the browser

- Verify the `CORS_ORIGINS` environment variable in the backend `.env` includes `http://localhost:3000`.
- Ensure the backend is running and accessible at the URL specified by `NEXT_PUBLIC_API_URL`.

### Indexer not picking up events

- Verify the Monad RPC endpoints are reachable:
  ```bash
  curl -X POST https://rpc.monad.xyz -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
  ```
- Check the `indexer_state` table to see the current indexing cursor:
  ```sql
  SELECT * FROM indexer_state;
  ```
- Review the backend logs for error messages (set `RUST_LOG=debug` for verbose output).

### Port already in use

- Backend (8080): `lsof -i :8080` to find the conflicting process.
- Frontend (3000): `lsof -i :3000` to find the conflicting process.
- Change the port via environment variable (`PORT` for backend) or `npm run dev -- -p 3001` for frontend.
