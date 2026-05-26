pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDEX is IERC20 {
        function ETHtoDEX(uint ethAmount) external view returns (uint);
        function DEXtoETH(uint dexAmount) external view returns (uint);
}