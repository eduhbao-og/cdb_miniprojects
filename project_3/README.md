# Sample Hardhat 3 Beta Project (minimal)

This project has a minimal setup of Hardhat 3 Beta, without any plugins.

## What's included?

The project includes native support for TypeScript, Hardhat scripts, tasks, and support for Solidity compilation and tests.

## Deploying locally

1. Start the local node:

```bash
npx hardhat node
```

2. In another terminal, deploy contracts:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

3. Copy the printed contract addresses into `frontend/src/config.ts`.
