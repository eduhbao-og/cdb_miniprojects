// SPDX-License-Identifier: MIT
/* 

*/
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DecentralizedFinance is ERC20 {
    // TODO: define variables
    address payable owner;
    uint256 balance;
    struct Loan{
        address payable borrower;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
    }

    mapping (uint256 => Loan) loans;
    
    uint256 paymentCycle;
    uint256 interest;
    uint256 termination;
    uint256 maxLoanDuration;
    uint256 dexSwapRate;

    event loanCreated(address borrower, uint256 amount, uint256 deadline);
    event loanFinished(address borrower, uint256 amount);


    constructor(uint256 swapRate, uint256 cycle, uint256 interestRate, uint256 terminationFee) ERC20("DEX", "DEX") {
        _mint(address(this), 10**18);
        dexSwapRate = swapRate;
        paymentCycle = cycle;
        interest = interestRate;
        termination = terminationFee;
    }

    function buyDex() external payable {
        // TODO: implement this
    }

    function sellDex(uint256 dexAmount) external {
        // TODO: implement this
    }

    function loan(uint256 dexAmount, uint256 deadline) external {
        // TODO: implement this

    }

    function makePayment(uint256 loanId) external{

    }

    function terminateLoan( uint256 loanId) external{

    }

    function getBalance() external{

    }

    function getDexBalance() external{

    }

    function checkLoan(uint256 loanId) external {

    }
}