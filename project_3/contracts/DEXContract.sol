pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Bank} from "./Bank.sol";

contract DEXContract is ERC20, Ownable {

    uint256 public dexSwapRate;
    Bank public bank;

    constructor(uint256 swapRate, address bankAddress) ERC20("DEX", "DEX") Ownable(msg.sender) {
        require(swapRate > 0, "Swap rate must be positive");
        dexSwapRate = swapRate;
        require(bankAddress != address(0), "Invalid bank address");
        bank = Bank(payable(bankAddress));
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function DEXtoETH(uint256 dexAmount) public view returns (uint256) {
        return (dexAmount * 1 ether) / dexSwapRate;
    }

    function ETHtoDEX(uint256 ethAmount) public view returns (uint256) {
        return (ethAmount * dexSwapRate) / 1 ether;
    }

    function getDexBalance() external view returns (uint256) {
        return balanceOf(msg.sender);
    }

    function setDexSwapRate(uint256 swapRate) external onlyOwner {
        require(swapRate > 0, "Swap rate must be positive");
        dexSwapRate = swapRate;
    }

    receive() external payable {
        if (address(bank) != address(0)) {
            bank.deposit{value: msg.value}();
        }
    }
}
