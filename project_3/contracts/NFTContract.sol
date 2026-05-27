pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Bank} from "./Bank.sol";

contract NFTContract is ERC721, Ownable {
    uint256 private tokenIdCounter;
    uint256 public mintPrice;
    string private baseTokenURI;
    Bank public bank;

    constructor(address bankAddress) payable ERC721("Simple NFT", "SNFT") Ownable(msg.sender) {
        mintPrice = 0.01 ether;
        require(bankAddress != address(0), "Invalid bank address");
        bank = Bank(payable(bankAddress));
    }

    function mint() external payable {
        require(msg.value == mintPrice, "Wrong value");
        tokenIdCounter += 1;
        _safeMint(msg.sender, tokenIdCounter);
        bank.deposit{value: msg.value}();
    }

    function burn(uint256 tokenId) external {
        require(
            _isAuthorized(ownerOf(tokenId), msg.sender, tokenId),
            "Not owner nor approved"
        );
        _burn(tokenId);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}
