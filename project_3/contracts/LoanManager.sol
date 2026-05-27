pragma solidity ^0.8.28;

import {IDEX} from "./IDEX.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Bank} from "./Bank.sol";

contract LoanManager is Ownable, ERC721Holder, ReentrancyGuard {

    struct DEXLoan {
        address borrower;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
        uint256 paymentsMade;
        uint256 startTime;
    }

    struct NFTLoan {
        address borrower;
        address provider;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
        uint256 paymentsMade;
        uint256 startTime;
    }

    mapping(uint256 => DEXLoan) public DEXloans;
    mapping(uint256 => NFTLoan) public NFTloans;

    uint256 public loanCounter;
    uint256 public paymentCycle;
    uint256 public interest;
    uint256 public termination;
    uint256 public maxLoanDuration;

    IDEX public dex;
    IERC721 public nft;
    Bank public bank;

    constructor(
            address dexAddress,
            address nftAddress,
            address bankAddress,
            uint256 loan, 
            uint256 cycle, 
            uint256 interestRate, 
            uint256 terminationFee, 
            uint256 duration) Ownable(msg.sender) {
        dex = IDEX(dexAddress);
        nft = IERC721(nftAddress);
        require(bankAddress != address(0), "Invalid bank address");
        bank = Bank(bankAddress);
        loanCounter = loan;
        paymentCycle = cycle;
        interest = interestRate;
        termination = terminationFee;
        maxLoanDuration = duration;
    }

    event DEXloanCreated(address indexed borrower, uint256 amount, uint256 deadline);
    event DEXloanFinished(address indexed borrower, uint256 amount);
    event NFTloanRequested(address indexed borrower, uint256 amount, uint256 deadline);
    event NFTloanCreated(address indexed borrower, address indexed provider, uint256 amount, uint256 deadline);
    event NFTloanFinished(address indexed borrower, address indexed provider, uint256 amount);

    receive() external payable {}

    function loanDEX(uint256 dexAmount, uint256 deadline) external nonReentrant {
        require(dexAmount > 0, "Invalid collateral amount");
        require(deadline > 0 && deadline <= maxLoanDuration, "Invalid deadline");

        uint256 loanValue = dex.DEXtoETH(dexAmount) / 2;
        require(loanValue > 0, "Loan value too small");
        require(bank.getBalance() >= loanValue, "Insufficient liquidity");

        require(dex.transferFrom(msg.sender, address(bank), dexAmount), "DEX transfer to bank failed");

        DEXloans[loanCounter] = DEXLoan({
            borrower: msg.sender,
            collateral: dexAmount,
            amount: loanValue,
            deadline: deadline,
            paymentsMade: 0,
            startTime: block.timestamp
        });

        emit DEXloanCreated(msg.sender, loanValue, deadline);
        loanCounter++;

        bank.withdraw(payable(msg.sender), loanValue);
    }

    function makeDEXLoanPayment(uint256 loanId) external payable {
        DEXLoan storage loan = DEXloans[loanId];
        require(msg.sender == loan.borrower, "Only borrower can pay");

        if (msg.value > 0) {
            bank.deposit{value: msg.value}();
        }

        uint256 cyclesPassed = (block.timestamp - loan.startTime) / paymentCycle;
        if (cyclesPassed > loan.paymentsMade) {
            emit DEXloanFinished(loan.borrower, loan.amount);
            delete DEXloans[loanId];
            return;
        }

        uint256 payment = (loan.amount * interest) / (loan.deadline * 100);

        if (loan.paymentsMade == loan.deadline - 1) {
            require(msg.value == payment + loan.amount, "Incorrect final payment");
            bank.withdrawToken(loan.borrower, loan.collateral);
            emit DEXloanFinished(loan.borrower, loan.amount);
            delete DEXloans[loanId];
        } else {
            require(msg.value == payment, "Incorrect payment");
            loan.paymentsMade++;
        }
    }

    function terminateDEXLoan(uint256 loanId) external payable {
        DEXLoan storage loan = DEXloans[loanId];
        require(msg.sender == loan.borrower, "Only borrower can terminate");
        require(msg.value == loan.amount + termination, "Incorrect termination payment");

        bank.deposit{value: msg.value}();
        bank.withdrawToken(msg.sender, loan.collateral);
        emit DEXloanFinished(loan.borrower, loan.amount);
        delete DEXloans[loanId];
    }

    function checkDEXLoan(uint256 loanId) external {
        DEXLoan storage loan = DEXloans[loanId];
        require(loan.borrower != address(0), "Loan does not exist");

        uint256 cyclesPassed = (block.timestamp - loan.startTime) / paymentCycle;
        if (cyclesPassed > loan.paymentsMade) {
            emit DEXloanFinished(loan.borrower, loan.amount);
            delete DEXloans[loanId];
        }
    }

    function requestLoanNFT(uint256 loanValue, uint256 tokenId, uint256 deadline) external nonReentrant {
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(deadline > 0 && deadline <= maxLoanDuration, "Invalid deadline");

        require(loanValue > 0, "Loan value too small");
        require(bank.getBalance() >= loanValue, "Insufficient liquidity");

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        NFTloans[tokenId] = NFTLoan({
            borrower: msg.sender,
            provider: address(0),
            collateral: dex.ETHtoDEX(loanValue) * 2,
            amount: loanValue,
            deadline: deadline,
            paymentsMade: 0,
            startTime: 0
        });

        emit NFTloanRequested(msg.sender, loanValue, deadline);
    }

    function loanNFT(uint256 tokenId) external nonReentrant {
        
        NFTLoan storage loan = NFTloans[tokenId];
        
        require(loan.provider == address(0), "Loan Already has provider");
        require(loan.borrower != msg.sender, "Cannot place collateral on self NFT loan");

        require(dex.balanceOf(msg.sender) >= loan.collateral, "Not enough DEX tokens");
        require(bank.getBalance() >= loan.amount, "Insufficient liquidity");

        require(dex.transferFrom(msg.sender, address(bank), loan.collateral), "DEX transfer to bank failed");

        NFTloans[tokenId].provider = msg.sender;
        NFTloans[tokenId].startTime = block.timestamp;

        emit NFTloanCreated(loan.borrower, loan.provider, loan.amount, loan.deadline);
        bank.withdraw(payable(msg.sender), loan.amount);
    }

    function makeNFTLoanPayment(uint256 tokenId) external payable nonReentrant{
        NFTLoan storage loan = NFTloans[tokenId];
        require(msg.sender == loan.borrower, "Only borrower can pay");

        if (msg.value > 0) {
            bank.deposit{value: msg.value}();
        }

        uint256 cyclesPassed = (block.timestamp - loan.startTime) / paymentCycle;
        if (cyclesPassed > loan.paymentsMade) {
            nft.safeTransferFrom(address(this), loan.provider, tokenId);
            emit NFTloanFinished(loan.borrower, loan.provider, loan.amount);
            delete NFTloans[tokenId];
            return;
        }

        uint256 payment = (loan.amount * interest) / (loan.deadline * 100);

        if (loan.paymentsMade == loan.deadline - 1) {
            require(msg.value == payment + loan.amount, "Incorrect final payment");

            bank.withdrawToken(loan.provider, loan.collateral);
            bank.withdraw(payable(loan.provider), (loan.amount * interest) / (2 * 100));

            nft.safeTransferFrom(address(this), msg.sender, tokenId);

            emit NFTloanFinished(loan.borrower, loan.provider, loan.amount);
            delete NFTloans[tokenId];
        } else {
            require(msg.value == payment, "Incorrect payment");
            loan.paymentsMade++;
        }
    }

    function terminateNFTLoan(uint256 tokenId) external payable nonReentrant{
        NFTLoan storage loan = NFTloans[tokenId];
        require(msg.sender == loan.borrower, "Only borrower can terminate");
        require(msg.value == loan.amount + termination, "Incorrect termination payment");

        bank.deposit{value: msg.value}();
        bank.withdrawToken(loan.provider, loan.collateral);
        bank.withdraw(payable(loan.provider), termination);

        nft.safeTransferFrom(address(this), msg.sender, tokenId);
    
        emit NFTloanFinished(loan.borrower, loan.provider,loan.amount);
        delete NFTloans[tokenId];
    }

    function checkNFTLoan(uint256 tokenId) external {
        NFTLoan storage loan = NFTloans[tokenId];
        require(loan.borrower != address(0), "Loan does not exist");

        uint256 cyclesPassed = (block.timestamp - loan.startTime) / paymentCycle;
        if (cyclesPassed > loan.paymentsMade) {
            nft.safeTransferFrom(address(this), loan.provider, tokenId);
            emit NFTloanFinished(loan.borrower, loan.provider, loan.amount);
            delete NFTloans[tokenId];
        }
    }    

    function setPaymentCycle(uint256 value) external onlyOwner {
        require(value > 0, "Payment cycle must be positive");
        paymentCycle = value;
    }

    function setInterest(uint256 value) external onlyOwner {
        interest = value;
    }

    function setTerminationFee(uint256 value) external onlyOwner {
        termination = value;
    }

    function setMaxLoanDuration(uint256 value) external onlyOwner {
        maxLoanDuration = value;
    }
}
