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
        uint256 paymentsMade;
        uint256 startTime;
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
        require(balanceOf(msg.sender) >= dexAmount, "Not enough DEX tokens");
        uint256 ethTotal = DEXtoETH(dexAmount);
        require(balanceOf(address(this)) >= ethTotal, "Not enough ETH in contract");
        transferFrom(msg.sender, address(this), dexAmount);
        (bool success, ) = msg.sender.call{value: ethTotal}("");
        require(success, "eth transfer failed");
        balance -= ethTotal;
    }

    function loan(uint256 dexAmount, uint256 deadline) external {
        require(maxLoanDuration >= deadline);
        uint ethTotal = DEXtoETH(dexAmount);
        (bool success, ) = msg.sender.call{value: ethTotal}("");
        require(success, "eth transfer failed");
        Loan memory newLoan = Loan(msg.sender, dexAmount, ethTotal, deadline, 0, block.timestamp);
        loans[counter] = newLoan;
        counter = counter + 1;
        emit loanCreated(msg.sender, ethTotal, deadline);
    }

    function makePayment(uint256 loanId) external payable {
        Loan storage l = loans[loanId];
        uint256 payment = (l.amount * interest) / l.deadline;
        if (l.paymentsMade == l.deadline - 1) {
            require(msg.value == payment + l.amount,"Incorrect Payment");
            transferFrom(address(this), l.borrower, l.collateral);
            emit loanFinished(l.borrower, l.amount);
            delete loans[loanId];
        } else {
            require(msg.value == payment, "Incorrect payment");
            l.paymentsMade ++;
        }
        balance += msg.value;
    }

    function terminateLoan(uint256 loanId) external payable {
        require(msg.sender == loans[loanId].borrower);
        require(msg.value == loans[loanId].amount + termination);
        transferFrom(address(this), msg.sender, loans[loanId].collateral);
        emit loanFinished(loans[loanId].borrower, loans[loanId].amount);
        delete loans[loanId];
        balance += msg.value;
    }

    function getBalance() view external returns (uint256){
        require(msg.sender == owner, "Only the owner can call this function");
        return balance;
    }

    function getDexBalance() view external returns (uint){
        return ETHtoDEX(balanceOf(msg.sender));
    }
    
    function checkLoan(uint256 loanId) external {
        require(msg.sender == owner, "Only owner can check loans");
        Loan storage l = loans[loanId];
        require(l.borrower != address(0), "Loan does not exist");
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            emit loanFinished(l.borrower, l.amount);
            delete loans[loanId];
        }
    }

    function DEXtoETH(uint dexAmount) view private returns (uint) {
        return (dexAmount * 10**18)/dexSwapRate;
    }

    function ETHtoDEX(uint ethAmount) view private returns (uint) {
        return (ethAmount * dexSwapRate)/10**18;
    }
}

