pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LoanManager is Ownable {

    struct DEXLoan{
        address borrower;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
        uint256 paymentsMade;
        uint256 startTime;
    }

    struct NFTLoan{
        address borrower;
        address provider;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
        uint256 paymentsMade;
        uint256 startTime;
    }

    mapping (uint256 => DEXLoan) DEXloans;
    mapping (uint256 => NFTLoan) NFTloans;

    uint256 loanCounter = 0;
    uint256 paymentCycle;
    uint256 interest;
    uint256 termination;
    uint256 maxLoanDuration;

    uint256 dexSwapRate;

    event DEXloanCreated(address borrower, uint256 amount, uint256 deadline);
    event DEXloanFinished(address borrower, uint256 amount);
    event NFTloanCreated(address borrower, address provider, uint256 amount, uint256 deadline);
    event NFTloanFinished(address borrower, address provider, uint256 amount);

    function checkDEXLoan(uint256 loanId) external {
        require(msg.sender == owner, "Only owner can check DEX loans");
        DEXLoan storage l = DEXloans[loanId];
        require(l.borrower != address(0), "Loan does not exist");

        // check if number of payments made corresponds to number of cycles passed
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            // if some payment is late, terminate loan and keep client's collateral
            emit DEXloanFinished(l.borrower, l.amount);
            delete DEXloans[loanId];
        }
    }
    
    function loanDEX(uint256 dexAmount, uint256 deadline) external {
        require(maxLoanDuration >= deadline);

        // transfer collateral to contract
        _transfer(msg.sender, address(this), dexAmount);
        uint ethTotal = DEXtoETH(dexAmount)/2;
        require(address(this).balance >= ethTotal, "Insufficient liquidity");

        // effects before interactions
        balance -= ethTotal;
        
        // transfer loan to client
        (bool success, ) = msg.sender.call{value: ethTotal}("");
        require(success, "eth transfer failed");
        
        DEXLoan memory newLoan = Loan(msg.sender, dexAmount, ethTotal, deadline, 0, block.timestamp);
        DEXloans[loanCounter] = newLoan;
        loanCounter = loanCounter + 1;
        emit DEXloanCreated(msg.sender, ethTotal, deadline);
    }

    function makeDEXLoanPayment(uint256 loanId) external payable {
        DEXLoan storage l = DEXloans[loanId];
        
        require(DEXloans[loanId].borrower != address(0), "Invalid loan");
        require(msg.sender == l.borrower, "Invalid loan");

        // check if payment deadline has expired
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            emit DEXloanFinished(l.borrower, l.amount);
            delete DEXloans[loanId];
            return;
        }
        
        // 𝑐𝑦𝑐𝑙𝑒𝑃𝑎𝑦𝑚𝑒𝑛𝑡 = 𝑎𝑚𝑜𝑢𝑛𝑡 𝑥 𝑖𝑛𝑡𝑒𝑟𝑒𝑠𝑡 / 𝑑𝑒𝑎𝑑𝑙𝑖𝑛𝑒
        // we divide by 100 because interest is an integer
        uint256 payment = (l.amount * interest) / (l.deadline * 100);

        // check if current payment is the last one
        if (l.paymentsMade == l.deadline - 1) {
            // final payment
            require(msg.value == payment + l.amount,"Incorrect Payment");
            _transfer(address(this), l.borrower, l.collateral);
            emit DEXloanFinished(l.borrower, l.amount);
            delete DEXloans[loanId];
        } else {
            // normal payment
            require(msg.value == payment, "Incorrect payment");
            l.paymentsMade ++;
        }
        balance += msg.value;
    }

    function terminateDEXLoan(uint256 loanId) external payable {
        require(DEXloans[loanId].borrower != address(0), "Invalid loan");
        require(msg.sender == DEXloans[loanId].borrower);
        require(msg.value == DEXloans[loanId].amount + termination);

        // if all conditions hold, transfer collateral back to client
        _transfer(address(this), msg.sender, DEXloans[loanId].collateral);
        emit DEXloanFinished(DEXloans[loanId].borrower, DEXloans[loanId].amount);
        delete DEXloans[loanId];
        balance += msg.value;
    }

    function checkDEXLoan(uint256 loanId) external {
        require(msg.sender == owner, "Only owner can check loans");
        DEXLoan storage l = DEXloans[loanId];
        require(l.borrower != address(0), "Loan does not exist");

        // check if number of payments made corresponds to number of cycles passed
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            // if some payment is late, terminate loan and keep client's collateral
            emit DEXloanFinished(l.borrower, l.amount);
            delete DEXloans[loanId];
        }
    }

    // ### ADMIN FUNCTIONS ###

    function setPaymentCycle(uint256 value) external isOwner {
        paymentCycle = value;
    }

    function setInterest(uint256 value) external isOwner {
        interest = value;
    }

    function setTerminationFee(uint256 value) external isOwner {
        termination = value;
    }

    function setMaxLoanDuration(uint256 value) external isOwner {
        maxLoanDuration = value;
    }

    function setDexSwapRate(uint256 value) external isOwner {
        dexSwapRate = value;
    }

}
