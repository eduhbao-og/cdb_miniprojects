Frontend setup (TypeScript + Vite) for interacting with contracts via MetaMask and ethers.js.

Quickstart

1. cd frontend
2. npm install
3. Edit `src/config.ts` and set deployed contract addresses for NFT, DEX and Marketplace.
4. npm run dev

Notes
- The frontend uses ethers v6 APIs (BrowserProvider, JsonRpcSigner).
- ABIs are minimal: add full ABIs if you need more function coverage.
- To integrate build into a backend, set environment variables or generate `config.ts` during deploy.
