pragma solidity ^0.8.28;

contract Marketplace {

    // ### DEX MARKETPLACE ###

    function buyDex() external payable {
        uint ethReceived = msg.value;

        // convert received eth to dex
        uint dexTotal = ETHtoDEX(ethReceived);

        // check if contract's balance has enough DEX
        require(balanceOf(address(this)) >= dexTotal, "not enough dex tokens in the contract");
        balance = balance + ethReceived;

        // transfer DEX to client
        _transfer(address(this), msg.sender, dexTotal);
    }

    function sellDex(uint256 dexAmount) external {
        // check if client has enough DEX to sell specified ammount
        require(balanceOf(msg.sender) >= dexAmount, "Not enough DEX tokens");
        uint256 ethTotal = DEXtoETH(dexAmount);

        // check if contract has enough ETH to transfer
        require(address(this).balance >= ethTotal, "Not enough ETH in contract");


        // make DEX transaction from client to contract
        _transfer(msg.sender, address(this), dexAmount);

        // effects before interactions
        balance -= ethTotal;

        // make ETH transaction from contract to client
        (bool success, ) = msg.sender.call{value: ethTotal}("");
        require(success, "eth transfer failed");
    }

    // ### NFT MARKETPLACE ###
    
    function buy(uint256 tokenId) external payable {}
    function sell(uint256 tokenId, uint256 price) external {}
    function auction(uint256 tokenId, uint256 minimumPrice, uint256 duration) external {}
    function bid(uint256 tokenId, uint256 price) external {}

    event auctionCreated(address seller, uint256 tokenId, uint256 minimumPrice, uint256 duration);
    event auctionBid(address bidder, uint256 tokenId, uint256 price);
    event auctionEnded(address seller, address buyer, uint256 tokenId, uint256 finalPrice);

    
}
