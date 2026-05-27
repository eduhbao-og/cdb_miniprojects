import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  const config = {
    NFT: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
    DEX: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    MARKETPLACE: "0x59b670e9fA9D0A427751Af201D676719a970857b",
    LOAN_MANAGER: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
    BANK: "0x0B306BF915C4d645ff596e518fAf3F9669b97016"
  };

  const signer = await provider.getSigner(0);
  const user = await provider.getSigner(1);
  const signerAddr = await signer.getAddress();
  const userAddr = await user.getAddress();

  console.log("Deployer:", signerAddr);
  console.log("User:", userAddr);

  const minABI = [
    "function balanceOf(address) view returns (uint256)",
    "function getBalance() view returns (uint256)",
    "function getTokenBalance() view returns (uint256)",
    "function deposit() payable",
    "function withdrawToken(address,uint256)",
    "function dexToken() view returns (address)",
    "function owner() view returns (address)",
    "function authorizedModules(address) view returns (bool)",
    "function ETHtoDEX(uint256) view returns (uint256)",
    "function DEXtoETH(uint256) view returns (uint256)",
    "function dexSwapRate() view returns (uint256)",
    "function buyDex() payable",
    "function sellDex(uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
  ];

  const dex = new ethers.Contract(config.DEX, minABI, signer);
  const bank = new ethers.Contract(config.BANK, minABI, signer);
  const marketplace = new ethers.Contract(config.MARKETPLACE, minABI, signer);

  // Check initial state
  console.log("\n--- INITIAL STATE ---");
  console.log("DEX owner:", await dex.owner());
  console.log("Bank owner:", await bank.owner());
  console.log("Bank dexToken:", await bank.dexToken());
  console.log("Bank ETH balance:", ethers.formatEther(await bank.getBalance()), "ETH");
  console.log("Bank DEX balance:", ethers.formatEther(await bank.getTokenBalance()), "DEX");
  console.log("Deployer DEX:", ethers.formatEther(await dex.balanceOf(signerAddr)), "DEX");
  console.log("User DEX:", ethers.formatEther(await dex.balanceOf(userAddr)), "DEX");
  console.log("Swap rate:", (await dex.dexSwapRate()).toString());

  // Check auth
  console.log("Marketplace authorized:", await bank.authorizedModules(config.MARKETPLACE));
  console.log("LoanManager authorized:", await bank.authorizedModules(config.LOAN_MANAGER));

  // User buys DEX
  console.log("\n--- USER BUYS DEX (0.1 ETH) ---");
  const ethAmount = ethers.parseEther("0.1");
  const expectedDex = (ethAmount * BigInt(1000)) / ethers.parseEther("1");
  console.log("Expected DEX:", ethers.formatEther(expectedDex));

  // Check if Bank has enough DEX
  const bankDex = await bank.getTokenBalance();
  console.log("Bank has enough DEX?", bankDex >= expectedDex);

  try {
    const mpAsUser = new ethers.Contract(config.MARKETPLACE, minABI, user);
    const tx = await mpAsUser.buyDex({ value: ethAmount });
    const receipt = await tx.wait();
    console.log("buyDex tx status:", receipt.status);

    if (receipt.status === 1) {
      console.log("User DEX after buy:", ethers.formatEther(await dex.balanceOf(userAddr)), "DEX");
      console.log("Bank DEX after buy:", ethers.formatEther(await bank.getTokenBalance()), "DEX");
      console.log("Bank ETH after buy:", ethers.formatEther(await bank.getBalance()), "ETH");
      console.log("User ETH after buy:", ethers.formatEther(await provider.getBalance(userAddr)), "ETH");
    }
  } catch (err: any) {
    console.error("buyDex failed:", err.reason || err.message);
  }
}

main().catch(console.error);
