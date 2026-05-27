// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DEXContract} from "../contracts/DEXContract.sol";
import {Test} from "forge-std/Test.sol";

contract DEXContractTest is Test {
    DEXContract cont;
    uint256 constant SWAP_RATE = 50;

    function setUp() public {
        cont = new DEXContract(SWAP_RATE);
        vm.deal(address(this), 50 ether);
    }

    function testInitialSwapRate() public {
        assertEq(cont.dexSwapRate(), SWAP_RATE);
    }

    function testInitialBalanceForOwner() public {
        assertEq(cont.getDexBalance(), 1 ether, "Owner should receive initial DEX allocation");
    }

    function testETHtoDEXConversion() public {
        uint256 ethAmount = 1 ether;
        uint256 expectedDex = (ethAmount * SWAP_RATE) / 1 ether;
        assertEq(cont.ETHtoDEX(ethAmount), expectedDex);
    }

    function testDEXtoETHConversion() public {
        uint256 dexAmount = 5 ether;
        uint256 expectedEth = (dexAmount * 1 ether) / SWAP_RATE;
        assertEq(cont.DEXtoETH(dexAmount), expectedEth);
    }

    function testOwnerCanUpdateSwapRate() public {
        cont.setDexSwapRate(100);
        assertEq(cont.dexSwapRate(), 100);
    }

    function testSetSwapRateRevertsForZero() public {
        vm.expectRevert("Swap rate must be positive");
        cont.setDexSwapRate(0);
    }
}
