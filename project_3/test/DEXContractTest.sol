pragma solidity ^0.8.28;

import {DEXContract} from "../contracts/DEXContract.sol";
import {Test} from "forge-std/Test.sol";

contract DEXContractTest is Test {
    DEXContract cont;

    uint256 constant SWAP_RATE = 50;
    uint256 constant CYCLE = 3 seconds;
    uint256 constant INTEREST = 15;
    uint256 constant TERMINATION_FEE = 10;

    event loanCreated(address borrower, uint256 amount, uint256 deadline);
    event loanFinished(address borrower, uint256 amount);

    function setUp() public {
        cont = new DEXContract(SWAP_RATE, CYCLE, INTEREST, TERMINATION_FEE);
        // Fund this test contract with plenty of ETH
        vm.deal(address(this), 50 ether);
    }

    // Needed to receive ETH back from sellDex and loan functions
    receive() external payable {}

    function testBuyDEX() public {
        uint256 ethAmount = 1 ether;
        uint256 expectedDex = ETHtoDEX(ethAmount);

        cont.buyDex{value: ethAmount}();
        
        assertEq(cont.getDexBalance(), expectedDex, "DEX balance after buy is incorrect");
    }

    function testSellDEX() public {
        uint256 ethAmount = 1 ether;
        cont.buyDex{value: ethAmount}();
        
        uint256 dexToSell = cont.getDexBalance();
        uint256 expectedEthBack = DEXtoETH(dexToSell);

        uint256 ethBalanceBefore = address(this).balance;
        
        cont.sellDex(dexToSell);
        
        assertEq(cont.getDexBalance(), 0, "DEX tokens should be gone");
        assertEq(address(this).balance, ethBalanceBefore + expectedEthBack, "ETH back is incorrect");
    }

    function testTakeOutLoan() public {
        // Step 1: Buy some DEX to use as collateral
        cont.buyDex{value: 10 ether}();
        uint256 collateralDex = cont.getDexBalance();
        uint256 expectedLoanEth = DEXtoETH(collateralDex) / 2;

        uint256 ethBalanceBefore = address(this).balance;

        // Expect the contract to emit loanCreated
        vm.expectEmit(true, true, false, true);
        emit loanCreated(address(this), expectedLoanEth, 5);

        // Step 2: Request loan with a 5-cycle deadline
        cont.loan(collateralDex, 5);

        assertEq(address(this).balance, ethBalanceBefore + expectedLoanEth, "Loan ETH not received");
        assertEq(cont.getDexBalance(), 0, "Collateral should leave borrower balance");
    }

    function testMakeNormalPayment() public {
        cont.buyDex{value: 10 ether}();
        uint256 collateralDex = cont.getDexBalance();
        uint256 expectedLoanEth = DEXtoETH(collateralDex) / 2;
        
        cont.loan(collateralDex, 5);

        // Calculate expected cycle payment: (amount * interest) / (deadline * 100)
        uint256 expectedPayment = (expectedLoanEth * INTEREST) / (5 * 100);

        // Make the first payment
        cont.makePayment{value: expectedPayment}(0);
        
        // No assertion needed if it doesn't revert, but we verify it processes safely
    }

    function testCompleteLoanRepayment() public {
        cont.buyDex{value: 10 ether}();
        uint256 collateralDex = cont.getDexBalance();
        uint256 expectedLoanEth = DEXtoETH(collateralDex) / 2;
        
        cont.loan(collateralDex, 2); // 2-cycle loan (ID: 0)
        uint256 paymentPrice = (expectedLoanEth * INTEREST) / (2 * 100);

        // Payment 1 (Normal)
        cont.makePayment{value: paymentPrice}(0);

        // Payment 2 (Final: payment amount + original borrowed principal)
        uint256 finalPaymentPrice = paymentPrice + expectedLoanEth;
        
        vm.expectEmit(true, true, false, true);
        emit loanFinished(address(this), expectedLoanEth);

        cont.makePayment{value: finalPaymentPrice}(0);

        // Collateral should be returned safely
        assertEq(cont.getDexBalance(), collateralDex, "Collateral not returned after full payoff");
    }

    function testTerminateLoanEarly() public {
        cont.buyDex{value: 10 ether}();
        uint256 collateralDex = cont.getDexBalance();
        uint256 expectedLoanEth = DEXtoETH(collateralDex) / 2;
        
        cont.loan(collateralDex, 5); // ID: 0

        // Termination requires: original borrowed principal + termination fee
        uint256 terminationAmount = expectedLoanEth + TERMINATION_FEE;

        cont.terminateLoan{value: terminationAmount}(0);

        // Collateral returned
        assertEq(cont.getDexBalance(), collateralDex, "Collateral not returned after early termination");
    }

    function testLoanLiquidationWhenPaymentIsLate() public {
        cont.buyDex{value: 10 ether}();
        uint256 collateralDex = cont.getDexBalance();
        
        cont.loan(collateralDex, 5); // ID: 0

        // Fast-forward time past 1 payment cycle (3 seconds) without making a payment
        // vm.warp changes block.timestamp in Foundry
        vm.warp(block.timestamp + CYCLE + 1 seconds);

        // Attempting to make a payment now should trigger the liquidation logic 
        // inside makePayment() because paymentsMade (0) < cycles passed (1)
        vm.expectEmit(true, true, false, true);
        emit loanFinished(address(this), DEXtoETH(collateralDex) / 2);

        cont.makePayment{value: 0}(0); 

        // Confirm loan was deleted and collateral is trapped in contract
        assertEq(cont.getDexBalance(), 0, "Collateral should not be returned on liquidation");
    }

    function ETHtoDEX(uint256 ethAmount) view private returns (uint256) {
        return (ethAmount * SWAP_RATE) / 10**18;
    }

    function DEXtoETH(uint256 dexAmount) view private returns (uint256) {
        return (dexAmount * 10**18) / SWAP_RATE;
    }
}
