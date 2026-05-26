pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DEXContract is ERC20, Ownable {

    uint256 public dexSwapRate;

    constructor(uint256 swapRate) ERC20("DEX", "DEX") Ownable(msg.sender) {
        require(swapRate > 0, "Swap rate must be positive");
        dexSwapRate = swapRate;
        _mint(address(this), 10**18);
        _transfer(address(this), msg.sender, 10**18);
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

    receive() external payable {}
}
