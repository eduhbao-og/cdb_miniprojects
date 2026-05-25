pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DEXContract is ERC20 {

    uint256 swapRate;

    constructor(uint256 swapRate) ERC20("DEX", "DEX") {
        _mint(address(this), 10**18);
        dexSwapRate = swapRate;
    }

    function DEXtoETH(uint dexAmount) view private returns (uint) {
        return (dexAmount * 10**18)/dexSwapRate;
    }

    function ETHtoDEX(uint ethAmount) view private returns (uint) {
        return (ethAmount * dexSwapRate)/10**18;
    }
}
