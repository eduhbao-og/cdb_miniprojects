pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTContract is ERC721 {

    uint256 private tokenIdCounter;

    constructor() payable ERC721("Simple NFT", "SNFT"){}

    function mint() external payable {
        require(msg.value == mintPrice, "Wrong value");
        tokenIdCounter += 1;
        uint256 tokenId = tokenIdCounter;
        _safeMint(msg.sender, tokenId);
    }

    function burn() external {}
    function buy(address seller) external payable {}
    function sell(uint256 tokenId, uint256 price) external {}
    function auction(uint256 tokenId, uint256 minimumPrice, uint256 duration) external {}

    event auctionCreated(address seller, uint256 tokenId, uint256 minimumPrice, uint256 duration);
    event auctionEnded(address seller, address buyer, uint256 tokenId, uint256 finalPrice);
    
}
