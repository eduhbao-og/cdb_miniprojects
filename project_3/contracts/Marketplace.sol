pragma solidity ^0.8.28;

import {IDEX} from "./IDEX.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ERC721Holder, ReentrancyGuard {

    IERC721 public nftContract;
    IDEX public dexContract;

    struct Sale {
        address seller;
        uint256 price;
        bool active;
    }

    struct Auction {
        address seller;
        uint256 minimumPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    mapping(uint256 => Sale) public sales;
    mapping(uint256 => Auction) public auctions;

    event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event AuctionCreated(address indexed seller, uint256 indexed tokenId, uint256 minimumPrice, uint256 duration);
    event AuctionBid(address indexed bidder, uint256 indexed tokenId, uint256 price);
    event AuctionEnded(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 finalPrice);

    constructor(address nftAddress, address dexAddress) {
        require(nftAddress != address(0), "Invalid NFT address");
        require(dexAddress != address(0), "Invalid DEX address");
        dexContract = IDEX(dexAddress);
        nftContract = IERC721(nftAddress);
    }

    function buyDex() external payable {
        require(msg.value > 0, "No ETH provided");

        uint256 dexTotal = dexContract.ETHtoDEX(msg.value);
        require(dexContract.balanceOf(address(this)) >= dexTotal, "Not enough DEX tokens in contract");

        dexContract.transfer(msg.sender, dexTotal);
    }

    function sellDex(uint256 dexAmount) external nonReentrant {
        require(dexAmount > 0, "DEX amount must be greater than zero");
        require(dexContract.balanceOf(msg.sender) >= dexAmount, "Not enough DEX tokens");

        uint256 ethTotal = dexContract.DEXtoETH(dexAmount);
        require(address(this).balance >= ethTotal, "Not enough ETH in contract");

        dexContract.transferFrom(msg.sender, address(this), dexAmount);

        (bool success, ) = msg.sender.call{value: ethTotal}("");
        require(success, "ETH transfer failed");
    }

    function sellNFT(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(!sales[tokenId].active, "Token already listed for sale");
        require(!auctions[tokenId].active, "Token already in auction");

        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        sales[tokenId] = Sale({seller: msg.sender, price: price, active: true});
        emit ItemListed(msg.sender, tokenId, price);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Sale storage sale = sales[tokenId];
        require(sale.active, "Token not for sale");
        require(msg.value >= sale.price, "Insufficient payment amount");

        address seller = sale.seller;
        uint256 listedPrice = sale.price;
        uint256 excess = msg.value - listedPrice;

        sale.active = false;
        sale.seller = address(0);

        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);

        (bool success, ) = seller.call{value: listedPrice}("");
        require(success, "Payment transfer failed");

        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund transfer failed");
        }

        emit ItemSold(msg.sender, tokenId, listedPrice);
    }

    function auction(uint256 tokenId, uint256 minimumPrice, uint256 duration) external {
        require(minimumPrice > 0, "Minimum price must be greater than zero");
        require(duration > 0, "Duration must be greater than zero");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(!sales[tokenId].active, "Token already listed for sale");
        require(!auctions[tokenId].active, "Token already in auction");

        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        auctions[tokenId] = Auction({
            seller: msg.sender,
            minimumPrice: minimumPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit AuctionCreated(msg.sender, tokenId, minimumPrice, duration);
    }

    function bid(uint256 tokenId) external payable nonReentrant {
        Auction storage auctionItem = auctions[tokenId];
        require(auctionItem.active, "Auction is not active");
        require(block.timestamp < auctionItem.endTime, "Auction already ended");
        require(msg.value >= auctionItem.minimumPrice, "Bid below minimum price");
        require(msg.value > auctionItem.highestBid, "Bid must be higher than current highest bid");

        if (auctionItem.highestBidder != address(0)) {
            (bool refunded, ) = auctionItem.highestBidder.call{value: auctionItem.highestBid}("");
            require(refunded, "Refund failed");
        }

        auctionItem.highestBid = msg.value;
        auctionItem.highestBidder = msg.sender;

        emit AuctionBid(msg.sender, tokenId, msg.value);
    }

    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auctionItem = auctions[tokenId];
        require(auctionItem.active, "Auction is not active");
        require(block.timestamp >= auctionItem.endTime, "Auction has not ended");

        auctionItem.active = false;
        address seller = auctionItem.seller;
        address buyer = auctionItem.highestBidder;
        uint256 finalPrice = auctionItem.highestBid;

        auctionItem.seller = address(0);
        auctionItem.highestBidder = address(0);

        if (buyer != address(0)) {
            nftContract.safeTransferFrom(address(this), buyer, tokenId);
            (bool success, ) = seller.call{value: finalPrice}("");
            require(success, "Payment transfer failed");
        } else {
            nftContract.safeTransferFrom(address(this), seller, tokenId);
        }

        emit AuctionEnded(seller, buyer, tokenId, finalPrice);
    }
}
