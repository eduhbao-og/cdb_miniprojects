import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

export default defineConfig({
  solidity: {
    version: "0.8.28",
  },
  plugins: [hardhatEthers],
});
