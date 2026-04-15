// SPDX-License-Identifier: MIT
/* 

*/
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DecentralizedFinance is ERC20 {
    address payable owner;
    uint256 balance;
    struct Loan{
        address borrower;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
    }

    mapping (uint256 => Loan) loans;
    uint256 counter = 0;

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
        uint ethReceived = msg.value;
        uint dexTotal = ETHtoDEX(ethReceived);
        require(balanceOf(address(this)) >= dexTotal, "not enough dex tokens in the contract");
        balance = balance + ethReceived;
        transferFrom(address(this), msg.sender, dexTotal);
    }

    function sellDex(uint256 dexAmount) external {
        // TODO: implement this
    }

    function loan(uint256 dexAmount, uint256 deadline) external {
        require(maxLoanDuration >= deadline);
        uint ethTotal = DEXtoETH(dexAmount);
        (bool success, ) = msg.sender.call{value: ethTotal}("");
        require(success, "eth transfer failed");
        Loan memory newLoan = Loan(msg.sender, dexAmount, ethTotal, deadline);
        loans[counter] = newLoan;
        counter = counter + 1;
        emit loanCreated(msg.sender, ethTotal, deadline);
    }

    function makePayment(uint256 loanId) external{

    }

    function terminateLoan(uint256 loanId) external payable {
        require(msg.sender == loans[loanId].borrower);
        require(msg.value == loans[loanId].amount + termination);
        transferFrom(address(this), msg.sender, loans[loanId].collateral);
    }

    function getBalance() external{

    }

    function getDexBalance() view external returns (uint){
        return ETHtoDEX(balanceOf(msg.sender));
    }
    
    function checkLoan(uint256 loanId) external {

    }

    function DEXtoETH(uint dexAmount) view private returns (uint) {
        return (dexAmount * 10**18)/dexSwapRate;
    }

    function ETHtoDEX(uint ethAmount) view private returns (uint) {
        return (ethAmount * dexSwapRate)/10**18;
    }
}
