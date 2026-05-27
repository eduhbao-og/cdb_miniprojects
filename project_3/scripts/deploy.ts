import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hre from "hardhat";

// Fallback: Import the actual ethers library directly
import * as baseEthers from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying contracts...");

  // Try to grab it from Hardhat's runtime environment object first
  let ethers = (hre as any).ethers;

  // Fallback: If Hardhat failed to inject it due to the ESM bug, build it manually!
  if (!ethers) {
    console.log("Using ESM runtime fallback for Ethers provider integration...");
    
    // We bind Hardhat's provider directly to a standard Ethers Signer wrapper
    const provider = new baseEthers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner(0); // Uses the first account from 'hardhat node'
    
    ethers = {
      getContractFactory: async (name: string) => {
        // Read directly from Hardhat's compiled artifacts filesystem tree
        const artifactPath = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        if (!fs.existsSync(artifactPath)) {
          throw new Error(`Artifact for ${name} not found. Did you run 'make compile'?`);
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        return new baseEthers.ContractFactory(artifact.abi, artifact.bytecode, signer);
      }
    };
  }

  // 1. Deploy your contracts
  const nftFactory = await ethers.getContractFactory("NFTContract");
  const nft = await nftFactory.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFTContract deployed to:", nftAddress);

  const dexFactory = await ethers.getContractFactory("DEXContract");
  const dex = await dexFactory.deploy(1000);
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("DEXContract deployed to:", dexAddress);

  const marketplaceFactory = await ethers.getContractFactory("Marketplace");
  const marketplace = await marketplaceFactory.deploy(nftAddress, dexAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  const loanManagerFactory = await ethers.getContractFactory("LoanManager");
  // Deploying with parameters:
  // dexAddress, nftAddress, loan counter start = 1, paymentCycle = 60 seconds (1 minute),
  // interestRate = 10 (10%), terminationFee = 0.01 ether, maxLoanDuration = 12 cycles
  const loanManager = await loanManagerFactory.deploy(
    dexAddress,
    nftAddress,
    1,
    60,
    10,
    baseEthers.parseEther("0.01"),
    12
  );
  await loanManager.waitForDeployment();
  const loanManagerAddress = await loanManager.getAddress();
  console.log("LoanManager deployed to:", loanManagerAddress);

  // 2. Automate writing these addresses directly into your frontend config file
  const frontendConfigPath = path.join(__dirname, "../frontend/src/config.ts");

  const configContent = `export const CONTRACT_ADDRESSES = {
  NFT: "${nftAddress}",
  DEX: "${dexAddress}",
  MARKETPLACE: "${marketplaceAddress}",
  LOAN_MANAGER: "${loanManagerAddress}"
};
`;

  fs.writeFileSync(frontendConfigPath, configContent, "utf-8");
  console.log(`Successfully updated frontend config at: ${frontendConfigPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});