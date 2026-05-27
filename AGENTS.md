# AGENTS.md — cdb_miniprojects

## Quickstart

```bash
# Build & test (project_3)
cd project_3
make compile                   # npx hardhat compile
make node                      # npx hardhat node (keep running)
make deploy-local              # deploy to localhost, auto-updates frontend/src/config.ts

# Frontend (separate terminal)
make frontend-install          # cd frontend && npm install
make frontend-dev              # cd frontend && npm run dev (Vite dev server)
```

## Project structure

- `project_3/` — Hardhat 3 Beta (Solidity 0.8.28, TypeScript scripts, ethers v6). Only active project.
  - `contracts/` — Solidity smart contracts (DEX ERC20, NFT ERC721, Marketplace, LoanManager)
  - `scripts/deploy.ts` — Deploys contracts to localhost; **automatically overwrites** `frontend/src/config.ts`
  - `test/DEXContractTest.sol` — Solidity tests using forge-std (requires Foundry)
  - `frontend/` — Standalone Vite + TypeScript app with MetaMask integration
  - `backend/schema_setup.sql` — PostgreSQL schema (not wired up yet)
- `project_1/`, `project_2/` — Older projects, likely irrelevant.

## Key quirks

- **Deploy script** writes deployed addresses directly to `frontend/src/config.ts`. Run `make deploy-local` after `make node`.
- **No foundry.toml** — tests use forge-std but `forge` is not installed in this env. Tests may fail without Foundry.
- **No eslint/prettier** — no linting, formatting, or typecheck config in the repo.
- **ABIs in `frontend/src/abis/`** are minimal/hand-crafted, not auto-generated from Hardhat artifacts.
- Frontend expects MetaMask on Hardhat network (chain ID 0x7, localhost:8545).
- Hardhat v3 Beta (no plugins beyond `@nomicfoundation/hardhat-ethers`).

## Commands

| Action | Command |
|--------|---------|
| Compile | `make compile` or `npx hardhat compile` |
| Start local node | `make node` or `npx hardhat node` |
| Deploy to localhost | `make deploy-local` or `npx hardhat run scripts/deploy.ts --network localhost` |
| Frontend dev server | `make frontend-dev` or `cd frontend && npm run dev` |
| Frontend build | `make frontend-build` or `cd frontend && npm run build` |
