pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bank is Ownable, ReentrancyGuard {
    mapping(address => bool) public authorizedModules;

    event AuthorizedModuleUpdated(address indexed module, bool enabled);
    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed module, address indexed recipient, uint256 amount);
    event TokenDeposited(address indexed sender, uint256 amount);
    event TokenWithdrawn(address indexed module, address indexed recipient, uint256 amount);

    IERC20 public dexToken;

    constructor() Ownable(msg.sender) {}

    function setDexToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        dexToken = IERC20(token);
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function deposit() external payable {
        require(msg.value > 0, "No ETH sent");
        emit Deposited(msg.sender, msg.value);
    }

    function setAuthorizedModule(address module, bool enabled) external onlyOwner {
        require(module != address(0), "Invalid module address");
        authorizedModules[module] = enabled;
        emit AuthorizedModuleUpdated(module, enabled);
    }

    function withdraw(address payable recipient, uint256 amount) external nonReentrant {
        require(authorizedModules[msg.sender], "Caller not authorized");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient contract balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, recipient, amount);
    }

    function depositToken(uint256 amount) external nonReentrant {
        require(address(dexToken) != address(0), "DEX token not set");
        require(amount > 0, "Amount must be greater than zero");
        require(dexToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit TokenDeposited(msg.sender, amount);
    }

    function withdrawToken(address recipient, uint256 amount) external nonReentrant {
        require(authorizedModules[msg.sender], "Caller not authorized");
        require(address(dexToken) != address(0), "DEX token not set");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        require(dexToken.balanceOf(address(this)) >= amount, "Insufficient token balance");

        require(dexToken.transfer(recipient, amount), "Token transfer failed");

        emit TokenWithdrawn(msg.sender, recipient, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance() external view returns (uint256) {
        if (address(dexToken) == address(0)) return 0;
        return dexToken.balanceOf(address(this));
    }
}