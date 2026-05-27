export const MARKETPLACE_ABI = [
  'event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 price)',
  'event ItemSold(address indexed buyer, uint256 indexed tokenId, uint256 price)',
  'event AuctionCreated(address indexed seller, uint256 indexed tokenId, uint256 minimumPrice, uint256 duration)',
  'event AuctionBid(address indexed bidder, uint256 indexed tokenId, uint256 price)',
  'event AuctionEnded(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 finalPrice)',
];

export const LOAN_MANAGER_ABI = [
  'event DEXloanCreated(address indexed borrower, uint256 amount, uint256 deadline)',
  'event DEXloanFinished(address indexed borrower, uint256 amount)',
  'event NFTloanRequested(address indexed borrower, uint256 amount, uint256 deadline)',
  'event NFTloanCreated(address indexed borrower, address indexed provider, uint256 amount, uint256 deadline)',
  'event NFTloanFinished(address indexed borrower, address indexed provider, uint256 amount)',
];
