pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTContract is ERC721, Ownable {

    uint256 private tokenIdCounter;

    constructor() payable ERC721("Simple NFT", "SNFT"){}

    function mint() external payable {
        require(msg.value == mintPrice, "Wrong value");
        tokenIdCounter += 1;
        uint256 tokenId = tokenIdCounter;
        _safeMint(msg.sender, tokenId);
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _burn(tokenId);
    }
   
}
