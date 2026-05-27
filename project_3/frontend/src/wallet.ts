import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "./config";
import { NFT_ABI, DEX_ABI, MARKETPLACE_ABI, LOAN_MANAGER_ABI } from "./abis";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

const HARDHAT_CHAIN_ID = "0x7a69"; // hexadecimal for 31337
export let provider: ethers.BrowserProvider | null = null;
let currentAccount: string | null = null;

const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement | null;
const accountSpan = document.getElementById("account") as HTMLSpanElement | null;

// Dynamic wrapper to get the latest real-time signer
export async function getActiveSigner(): Promise<ethers.JsonRpcSigner | null> {
  const ethereum = window.ethereum;
  if (!ethereum) return null;
  
  provider = new ethers.BrowserProvider(ethereum);
  const accounts = await provider.send("eth_accounts", []);
  if (accounts.length === 0) return null;
  
  return await provider.getSigner(accounts[0]);
}

// Contract getters using the active signer
export async function getNFTContract(): Promise<ethers.Contract | null> {
  const signer = await getActiveSigner();
  if (!signer) return null;
  return new ethers.Contract(CONTRACT_ADDRESSES.NFT, NFT_ABI, signer);
}

export async function getDEXContract(): Promise<ethers.Contract | null> {
  const signer = await getActiveSigner();
  if (!signer) return null;
  return new ethers.Contract(CONTRACT_ADDRESSES.DEX, DEX_ABI, signer);
}

export async function getMarketplaceContract(): Promise<ethers.Contract | null> {
  const signer = await getActiveSigner();
  if (!signer) return null;
  return new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, signer);
}

export async function getLoanManagerContract(): Promise<ethers.Contract | null> {
  const signer = await getActiveSigner();
  if (!signer) return null;
  return new ethers.Contract(CONTRACT_ADDRESSES.LOAN_MANAGER, LOAN_MANAGER_ABI, signer);
}

export async function connectWallet() {
  const ethereum = window.ethereum;
  if (!ethereum) {
    showStatus("MetaMask not found", "err");
    return null;
  }

  provider = new ethers.BrowserProvider(ethereum);
  // 1. Request accounts first so the user authorizes the DApp before switching networks
  const accounts: string[] = await provider.send("eth_requestAccounts", []);
  if (accounts.length === 0) {
    showStatus("No MetaMask accounts available", "err");
    return null;
  }

  // 2. Ensure hardhat network after authorization
  await ensureHardhatNetwork(ethereum);

  currentAccount = accounts[0];

  if (accountSpan) {
    accountSpan.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
  }
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.textContent = "Wallet Connected";
  }

  return currentAccount;
}

async function ensureHardhatNetwork(ethereum: NonNullable<Window["ethereum"]>) {
  const chainId = await ethereum.request({ method: "eth_chainId" });
  if (chainId === HARDHAT_CHAIN_ID) return;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_CHAIN_ID }],
    });
  } catch (err: any) {
    // 4902 is standard, but sometimes it is wrapped, or message contains "Unrecognized chain ID"
    const isChainMissing =
      err.code === 4902 ||
      err.data?.originalError?.code === 4902 ||
      err.message?.includes("Unrecognized chain ID") ||
      err.message?.includes("wallet_addEthereumChain");

    if (isChainMissing) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: HARDHAT_CHAIN_ID,
          chainName: "Hardhat Local",
          rpcUrls: ["http://127.0.0.1:8545/", "http://localhost:8545/"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        }],
      });
    } else {
      throw err;
    }
  }
}

function showStatus(message: string, type: "info" | "err" = "info") {
  if (type === "err") {
    console.error(message);
  } else {
    console.log(message);
  }
}