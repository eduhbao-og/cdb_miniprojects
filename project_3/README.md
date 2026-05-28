# Project 3 — CDB DApp (NFT Marketplace + Lending)
## Eduardo Sampaio, nº66097 | Gonçalo Vicente, nº66118

Decentralized NFT marketplace with DEX/ETH purchases, auctions, and collateralized lending (DEX-based and NFT-based loans), backed by a PostgreSQL history service.

## Prerequisites

- Node.js 18+, npm
- Docker (for PostgreSQL)
- MetaMask browser extension

## Quick Start (full stack)

```bash
# 1. Install all dependencies
make frontend-install
make backend-install

# 2. Start everything (Hardhat node → deploy → frontend → DB → backend)
#    Backend stays in foreground; logs for other services go to /tmp/.
make dev-all
```

To stop everything: `make down`.

## Manual Step-by-Step

### Terminal 1 — Hardhat node

```bash
make node
```

### Terminal 2 — Deploy + Frontend + Backend

```bash
# Install deps (skip if already done)
make frontend-install
make backend-install

# Compile contracts (if not cached)
make compile

# Deploy to localhost — auto-updates frontend/src/config.ts
make deploy-local

# Start Vite dev server (background)
make frontend-dev
```

### Terminal 3 — Database + Backend

```bash
# Start Docker PostgreSQL container
make db-start

# Create user, database, and tables
make db-setup

# Start backend (Express server, stays in foreground)
make backend-dev
```

### Teardown

```bash
make down   # kills hardhat/vite/tsx processes, removes Postgres container
```

## Important Notes

- **MetaMask** must be on Hardhat network: chain ID `0x7a69` (31337), RPC `http://127.0.0.1:8545`. The frontend adds it automatically if missing.
- **`deploy-local`** overwrites `frontend/src/config.ts` with fresh contract addresses. Run it after any contract change.
- **Postgres** defaults: user `cdb_user`, password `cdb_password`, database `cdb_db`, host `localhost:5432`. Configurable via environment variables in `server.ts`.
- **After `make down`**, run `make dev-all` again or follow the manual steps to restart.
