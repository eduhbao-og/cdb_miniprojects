import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hre from "hardhat";

import * as baseEthers from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying contracts...");

  let ethers = (hre as any).ethers;

  if (!ethers) {
    console.log("Using ESM runtime fallback for Ethers provider integration...");

    const provider = new baseEthers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner(0);

    ethers = {
      getContractFactory: async (name: string) => {
        const artifactPath = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        if (!fs.existsSync(artifactPath)) {
          throw new Error(`Artifact for ${name} not found. Did you run 'make compile'?`);
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        return new baseEthers.ContractFactory(artifact.abi, artifact.bytecode, signer);
      }
    };
  }

  // 1. Deploy Bank first — no dependencies (setDexToken is called post-deployment)
  const bankFactory = await ethers.getContractFactory("Bank");
  const bank = await bankFactory.deploy();
  await bank.waitForDeployment();
  const bankAddress = await bank.getAddress();
  console.log("Bank deployed to:", bankAddress);

  // 2. Deploy DEXContract with bank address — stores bank ref, mints to self
  const dexFactory = await ethers.getContractFactory("DEXContract");
  const dex = await dexFactory.deploy(baseEthers.parseEther("1000"), bankAddress);
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("DEXContract deployed to:", dexAddress);

  // 3. Link Bank to DEX token (requires DEX address)
  const setDexTx = await bank.setDexToken(dexAddress);
  await setDexTx.wait();
  console.log("Bank.setDexToken() called");

  // 4. Have deployer approve Bank and deposit initial DEX supply
  const approveTx = await dex.approve(bankAddress, baseEthers.parseEther("1000000"));
  await approveTx.wait();
  console.log("DEX approved Bank for token transfer");

  const depositTx = await bank.depositToken(baseEthers.parseEther("1000000"));
  await depositTx.wait();
  console.log("Initial DEX supply deposited to Bank");

  // 5. Deploy NFTContract with bank address
  const nftFactory = await ethers.getContractFactory("NFTContract");
  const nft = await nftFactory.deploy(bankAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFTContract deployed to:", nftAddress);

  // 6. Deploy Marketplace with nft, dex, bank addresses
  const marketplaceFactory = await ethers.getContractFactory("Marketplace");
  const marketplace = await marketplaceFactory.deploy(nftAddress, dexAddress, bankAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // 7. Deploy LoanManager with all parameters
  const loanManagerFactory = await ethers.getContractFactory("LoanManager");
  const loanManager = await loanManagerFactory.deploy(
    dexAddress,
    nftAddress,
    bankAddress,
    1,                          // loanCounter start
    60,                         // paymentCycle (seconds)
    10,                         // interest rate (%)
    baseEthers.parseEther("0.01"), // terminationFee
    12                          // maxLoanDuration (cycles)
  );
  await loanManager.waitForDeployment();
  const loanManagerAddress = await loanManager.getAddress();
  console.log("LoanManager deployed to:", loanManagerAddress);

  // 8. Authorize contracts on Bank (only these can withdraw)
  const authMarketTx = await bank.setAuthorizedModule(marketplaceAddress, true);
  await authMarketTx.wait();
  console.log("Bank authorized Marketplace");

  const authLoanTx = await bank.setAuthorizedModule(loanManagerAddress, true);
  await authLoanTx.wait();
  console.log("Bank authorized LoanManager");

  // 9. Write addresses to frontend config
  const frontendConfigPath = path.join(__dirname, "../frontend/src/config.ts");

  const configContent = `export const CONTRACT_ADDRESSES = {
  NFT: "${nftAddress}",
  DEX: "${dexAddress}",
  MARKETPLACE: "${marketplaceAddress}",
  LOAN_MANAGER: "${loanManagerAddress}",
  BANK: "${bankAddress}"
};

export const BACKEND_URL = "http://localhost:3000";
`;

  fs.writeFileSync(frontendConfigPath, configContent, "utf-8");
  console.log(`Successfully updated frontend config at: ${frontendConfigPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
