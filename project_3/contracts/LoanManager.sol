pragma solidity ^0.8.28;

contract LoanManager {

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

    function checkLoan(uint256 loanId) external {
        require(msg.sender == owner, "Only owner can check loans");
        Loan storage l = loans[loanId];
        require(l.borrower != address(0), "Loan does not exist");

        // check if number of payments made corresponds to number of cycles passed
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            // if some payment is late, terminate loan and keep client's collateral
            emit loanFinished(l.borrower, l.amount);
            delete loans[loanId];
        }
    }
    
    function loan(uint256 dexAmount, uint256 deadline) external {
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
        
        Loan memory newLoan = Loan(msg.sender, dexAmount, ethTotal, deadline, 0, block.timestamp);
        loans[counter] = newLoan;
        counter = counter + 1;
        emit loanCreated(msg.sender, ethTotal, deadline);
    }

    function makePayment(uint256 loanId) external payable {
        Loan storage l = loans[loanId];
        
        require(loans[loanId].borrower != address(0), "Invalid loan");
        require(msg.sender == l.borrower, "Invalid loan");

        // check if payment deadline has expired
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            emit loanFinished(l.borrower, l.amount);
            delete loans[loanId];
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
            emit loanFinished(l.borrower, l.amount);
            delete loans[loanId];
        } else {
            // normal payment
            require(msg.value == payment, "Incorrect payment");
            l.paymentsMade ++;
        }
        balance += msg.value;
    }

    function terminateLoan(uint256 loanId) external payable {
        require(loans[loanId].borrower != address(0), "Invalid loan");
        require(msg.sender == loans[loanId].borrower);
        require(msg.value == loans[loanId].amount + termination);

        // if all conditions hold, transfer collateral back to client
        _transfer(address(this), msg.sender, loans[loanId].collateral);
        emit loanFinished(loans[loanId].borrower, loans[loanId].amount);
        delete loans[loanId];
        balance += msg.value;
    }

    function checkLoan(uint256 loanId) external {
        require(msg.sender == owner, "Only owner can check loans");
        Loan storage l = loans[loanId];
        require(l.borrower != address(0), "Loan does not exist");

        // check if number of payments made corresponds to number of cycles passed
        if (l.paymentsMade < (block.timestamp - l.startTime) / paymentCycle) {
            // if some payment is late, terminate loan and keep client's collateral
            emit loanFinished(l.borrower, l.amount);
            delete loans[loanId];
        }
    }

}
