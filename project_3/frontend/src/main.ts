import { CONTRACT_ADDRESSES } from './config';
import {
  connectWallet as walletConnect,
  provider,
  getActiveSigner,
  getNFTContract,
  getDEXContract,
  getMarketplaceContract,
  getLoanManagerContract,
  getBankContract
} from './wallet';
import { ethers } from 'ethers';

// Elements
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const accountSpan = document.getElementById('account') as HTMLSpanElement;
const ethBalanceSpan = document.getElementById('ethBalance') as HTMLSpanElement;
const dexBalanceSpan = document.getElementById('dexBalance') as HTMLSpanElement;
const adminTabBtn = document.getElementById('adminTabBtn') as HTMLButtonElement;

// NFT Market elements
const mintBtn = document.getElementById('mintBtn') as HTMLButtonElement;
const mintPriceDisplay = document.getElementById('mintPriceDisplay') as HTMLInputElement;
const mintStatus = document.getElementById('mintStatus') as HTMLDivElement;
const marketListingsGrid = document.getElementById('marketListingsGrid') as HTMLDivElement;
const auctionsGrid = document.getElementById('auctionsGrid') as HTMLDivElement;

// DEX Swap elements
const swapInputAmount = document.getElementById('swapInputAmount') as HTMLInputElement;
const swapInputSuffix = document.getElementById('swapInputSuffix') as HTMLSpanElement;
const swapOutputAmount = document.getElementById('swapOutputAmount') as HTMLInputElement;
const swapOutputSuffix = document.getElementById('swapOutputSuffix') as HTMLSpanElement;
const swapFromLabel = document.getElementById('swapFromLabel') as HTMLLabelElement;
const swapToLabel = document.getElementById('swapToLabel') as HTMLLabelElement;
const toggleSwapDirBtn = document.getElementById('toggleSwapDirBtn') as HTMLButtonElement;
const executeSwapBtn = document.getElementById('executeSwapBtn') as HTMLButtonElement;
const swapStatus = document.getElementById('swapStatus') as HTMLDivElement;
const ratePreview = document.getElementById('ratePreview') as HTMLSpanElement;

// DEX Reserve elements
const contractRateDisplay = document.getElementById('contractRateDisplay') as HTMLSpanElement;
const marketplaceDexReserves = document.getElementById('marketplaceDexReserves') as HTMLSpanElement;
const marketplaceEthReserves = document.getElementById('marketplaceEthReserves') as HTMLSpanElement;
const marketplaceAllowanceDisplay = document.getElementById('marketplaceAllowanceDisplay') as HTMLSpanElement;
const approveDexMarketBtn = document.getElementById('approveDexMarketBtn') as HTMLButtonElement;
const approveDexMarketStatus = document.getElementById('approveDexMarketStatus') as HTMLDivElement;

// Portfolio Approvals
const nftMarketApprovedDisplay = document.getElementById('nftMarketApprovedDisplay') as HTMLSpanElement;
const nftLoansApprovedDisplay = document.getElementById('nftLoansApprovedDisplay') as HTMLSpanElement;
const approveNftMarketBtn = document.getElementById('approveNftMarketBtn') as HTMLButtonElement;
const approveNftLoansBtn = document.getElementById('approveNftLoansBtn') as HTMLButtonElement;
const portfolioApprovalStatus = document.getElementById('portfolioApprovalStatus') as HTMLDivElement;
const myNftsGrid = document.getElementById('myNftsGrid') as HTMLDivElement;

// Loans Tab elements
const dexLoanCollateralAmount = document.getElementById('dexLoanCollateralAmount') as HTMLInputElement;
const dexLoanDurationCycles = document.getElementById('dexLoanDurationCycles') as HTMLInputElement;
const maxLoanCyclesDisplay = document.getElementById('maxLoanCyclesDisplay') as HTMLSpanElement;
const loanManagerDEXAllowance = document.getElementById('loanManagerDEXAllowance') as HTMLSpanElement;
const approveDexLoanManagerBtn = document.getElementById('approveDexLoanManagerBtn') as HTMLButtonElement;
const borrowDexBtn = document.getElementById('borrowDexBtn') as HTMLButtonElement;
const dexLoanRequestStatus = document.getElementById('dexLoanRequestStatus') as HTMLDivElement;
const myDexLoansList = document.getElementById('myDexLoansList') as HTMLDivElement;
const nftLoanRequestsList = document.getElementById('nftLoanRequestsList') as HTMLDivElement;
const myNftLoansList = document.getElementById('myNftLoansList') as HTMLDivElement;

// Admin Panel elements
const currentAdminSwapRate = document.getElementById('currentAdminSwapRate') as HTMLSpanElement;
const adminSwapRateInput = document.getElementById('adminSwapRateInput') as HTMLInputElement;
const adminSetSwapRateBtn = document.getElementById('adminSetSwapRateBtn') as HTMLButtonElement;
const adminSwapRateStatus = document.getElementById('adminSwapRateStatus') as HTMLDivElement;

const adminMintPriceInput = document.getElementById('adminMintPriceInput') as HTMLInputElement;
const adminSetMintPriceBtn = document.getElementById('adminSetMintPriceBtn') as HTMLButtonElement;
const adminBaseUriInput = document.getElementById('adminBaseUriInput') as HTMLInputElement;
const adminSetBaseUriBtn = document.getElementById('adminSetBaseUriBtn') as HTMLButtonElement;
const adminNftStatus = document.getElementById('adminNftStatus') as HTMLDivElement;

const adminPaymentCycleInput = document.getElementById('adminPaymentCycleInput') as HTMLInputElement;
const adminInterestInput = document.getElementById('adminInterestInput') as HTMLInputElement;
const adminTerminationFeeInput = document.getElementById('adminTerminationFeeInput') as HTMLInputElement;
const adminMaxDurationInput = document.getElementById('adminMaxDurationInput') as HTMLInputElement;
const adminSaveLoanParamsBtn = document.getElementById('adminSaveLoanParamsBtn') as HTMLButtonElement;
const adminLoansStatus = document.getElementById('adminLoansStatus') as HTMLDivElement;

// Bank Admin elements
const adminBankEthBalance = document.getElementById('adminBankEthBalance') as HTMLSpanElement;
const adminBankDexBalance = document.getElementById('adminBankDexBalance') as HTMLSpanElement;
const adminModuleAddressInput = document.getElementById('adminModuleAddressInput') as HTMLInputElement;
const adminEnableModuleBtn = document.getElementById('adminEnableModuleBtn') as HTMLButtonElement;
const adminDisableModuleBtn = document.getElementById('adminDisableModuleBtn') as HTMLButtonElement;
const adminModuleAuthStatus = document.getElementById('adminModuleAuthStatus') as HTMLSpanElement;
const adminBankStatus = document.getElementById('adminBankStatus') as HTMLDivElement;

// Global App State
let activeAccount: string | null = null;
let swapDirection: 'ETH_TO_DEX' | 'DEX_TO_ETH' = 'ETH_TO_DEX';
let cachedSwapRate: bigint = 1000n;

// Initialize dynamic tab switching
function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab-btn')) as HTMLButtonElement[];

  function activateTab(target: string) {
    tabs.forEach(x => x.classList.remove('active'));
    const activeBtn = tabs.find(t => t.dataset.tab === target);
    if (activeBtn) activeBtn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => {
      (p as HTMLElement).classList.toggle('hidden', p.id !== target);
    });
    localStorage.setItem('activeTab', target);
  }

  // Restore saved tab, or default to first
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab && document.querySelector(`.tab-btn[data-tab="${savedTab}"]`)) {
    activateTab(savedTab);
  }

  tabs.forEach((t) => t.addEventListener('click', () => {
    const target = t.dataset.tab!;
    activateTab(target);
    // Re-fetch data on tab switch to keep state fresh
    if (activeAccount) {
      refreshData();
    }
  }));
}

// Show banner helper
function showBanner(element: HTMLDivElement, message: string, type: 'info' | 'err' | 'success') {
  element.textContent = message;
  element.className = `status-banner status-${type}`;
  element.style.display = 'block';
  setTimeout(() => {
    element.style.display = 'none';
  }, 10000);
}

// Standard data refresh coordinator
async function refreshData() {
  if (!activeAccount || !provider) return;

  try {
    const nft = await getNFTContract();
    const dex = await getDEXContract();
    const marketplace = await getMarketplaceContract();
    const loanManager = await getLoanManagerContract();

    if (!nft || !dex || !marketplace || !loanManager) return;

    // 1. Fetch Balances
    const ethBal = await provider.getBalance(activeAccount);
    ethBalanceSpan.textContent = parseFloat(ethers.formatEther(ethBal)).toFixed(4);

    const dexBal = await dex.balanceOf(activeAccount);
    dexBalanceSpan.textContent = parseFloat(ethers.formatEther(dexBal)).toFixed(2);

    // 2. Fetch Swap Rate Info
    const rate = await dex.dexSwapRate();
    cachedSwapRate = BigInt(rate);
    const rateDisplay = parseFloat(ethers.formatEther(rate)).toString();
    ratePreview.textContent = `Rate: 1 ETH = ${rateDisplay} DEX`;
    contractRateDisplay.textContent = `${rateDisplay} DEX / ETH`;
    currentAdminSwapRate.textContent = `${rateDisplay} DEX / ETH`;

    // 3. Fetch Bank reserves (central vault)
    const bank = await getBankContract();
    if (bank) {
      const bDexRes = await bank.getTokenBalance();
      marketplaceDexReserves.textContent = `${parseFloat(ethers.formatEther(bDexRes)).toFixed(2)} DEX`;

      const bEthRes = await bank.getBalance();
      marketplaceEthReserves.textContent = `${parseFloat(ethers.formatEther(bEthRes)).toFixed(4)} ETH`;
    }

    // 4. Fetch Allowances
    const mAllowance = await dex.allowance(activeAccount, CONTRACT_ADDRESSES.MARKETPLACE);
    marketplaceAllowanceDisplay.textContent = `${parseFloat(ethers.formatEther(mAllowance)).toFixed(2)} DEX`;

    const lmAllowance = await dex.allowance(activeAccount, CONTRACT_ADDRESSES.LOAN_MANAGER);
    loanManagerDEXAllowance.textContent = `${parseFloat(ethers.formatEther(lmAllowance)).toFixed(2)} DEX`;

    // 5. Fetch Approvals
    const isApprovedMarket = await nft.isApprovedForAll(activeAccount, CONTRACT_ADDRESSES.MARKETPLACE);
    nftMarketApprovedDisplay.textContent = isApprovedMarket ? "Approved ✅" : "Not Approved ❌";
    nftMarketApprovedDisplay.style.color = isApprovedMarket ? "#10b981" : "#ef4444";

    const isApprovedLoans = await nft.isApprovedForAll(activeAccount, CONTRACT_ADDRESSES.LOAN_MANAGER);
    nftLoansApprovedDisplay.textContent = isApprovedLoans ? "Approved ✅" : "Not Approved ❌";
    nftLoansApprovedDisplay.style.color = isApprovedLoans ? "#10b981" : "#ef4444";

    // 6. Fetch NFT Mint Price
    const mPrice = await nft.mintPrice();
    mintPriceDisplay.value = `${ethers.formatEther(mPrice)}`;

    // 7. Fetch Loan Params
    const maxDur = await loanManager.maxLoanDuration();
    maxLoanCyclesDisplay.textContent = maxDur.toString();

    // 8. Admin Verification
    const nftOwner = await nft.owner();
    const dexOwner = await dex.owner();
    const lmOwner = await loanManager.owner();
    const bankOwner = bank ? await bank.owner() : null;

    const isAdmin = 
      activeAccount.toLowerCase() === nftOwner.toLowerCase() ||
      activeAccount.toLowerCase() === dexOwner.toLowerCase() ||
      activeAccount.toLowerCase() === lmOwner.toLowerCase() ||
      (bankOwner !== null && activeAccount.toLowerCase() === bankOwner.toLowerCase());

    if (isAdmin) {
      adminTabBtn.classList.remove('hidden');
      // Pre-fill Admin settings
      adminSwapRateInput.placeholder = rate.toString();
      adminMintPriceInput.placeholder = ethers.formatEther(mPrice);
      
      const cycle = await loanManager.paymentCycle();
      adminPaymentCycleInput.placeholder = cycle.toString();
      
      const interest = await loanManager.interest();
      adminInterestInput.placeholder = interest.toString();
      
      const term = await loanManager.termination();
      adminTerminationFeeInput.placeholder = ethers.formatEther(term);
      
      adminMaxDurationInput.placeholder = maxDur.toString();

      // Load Bank balances
      if (bank) {
        const bEth = await bank.getBalance();
        adminBankEthBalance.textContent = `${parseFloat(ethers.formatEther(bEth)).toFixed(4)} ETH`;
        const bDex = await bank.getTokenBalance();
        adminBankDexBalance.textContent = `${parseFloat(ethers.formatEther(bDex)).toFixed(2)} DEX`;
      }
    } else {
      adminTabBtn.classList.add('hidden');
    }

    // 9. Load grids (NFTs, Listings, Auctions, Loans)
    await loadGridsAndLists(nft, dex, marketplace, loanManager);

  } catch (err) {
    console.error("Refresh error:", err);
  }
}

// Multi-contract scanner for NFT listings, auctions, and loan listings
async function loadGridsAndLists(
  nft: ethers.Contract,
  dex: ethers.Contract,
  marketplace: ethers.Contract,
  loanManager: ethers.Contract
) {
  // Reset grids
  marketListingsGrid.innerHTML = '';
  auctionsGrid.innerHTML = '';
  myNftsGrid.innerHTML = '';
  myDexLoansList.innerHTML = '';
  nftLoanRequestsList.innerHTML = '';
  myNftLoansList.innerHTML = '';

  // Scan existing tokens sequentially
  let tokenId = 1;
  let failures = 0;
  const maxFailures = 3; // stop scanning after consecutive reverts (token hasn't been minted yet)

  const activeSalesList: any[] = [];
  const activeAuctionsList: any[] = [];
  const ownedNftsList: any[] = [];

  while (failures < maxFailures) {
    try {
      const owner = await nft.ownerOf(tokenId);
      failures = 0; // reset failures on success

      if (owner.toLowerCase() === activeAccount!.toLowerCase()) {
        ownedNftsList.push({ id: tokenId, owner });
      } else if (owner.toLowerCase() === CONTRACT_ADDRESSES.MARKETPLACE.toLowerCase()) {
        // Check if listed for sale
        const sale = await marketplace.sales(tokenId);
        if (sale.active) {
          activeSalesList.push({ id: tokenId, seller: sale.seller, price: sale.price, isDex: sale.isDex });
        }

        // Check if listed for auction
        const auc = await marketplace.auctions(tokenId);
        if (auc.active) {
          activeAuctionsList.push({
            id: tokenId,
            seller: auc.seller,
            minPrice: auc.minimumPrice,
            highestBid: auc.highestBid,
            highestBidder: auc.highestBidder,
            endTime: Number(auc.endTime)
          });
        }
      } else if (owner.toLowerCase() === CONTRACT_ADDRESSES.LOAN_MANAGER.toLowerCase()) {
        // Check NFT Loans mapping
        const loan = await loanManager.NFTloans(tokenId);
        if (loan.borrower != ethers.ZeroAddress) {
          const formattedLoan = {
            id: tokenId,
            borrower: loan.borrower,
            provider: loan.provider,
            collateral: loan.collateral,
            amount: loan.amount,
            deadline: loan.deadline,
            paymentsMade: loan.paymentsMade,
            startTime: Number(loan.startTime)
          };

          if (loan.provider === ethers.ZeroAddress) {
            // Pending request list
            renderNFTLoanRequest(formattedLoan, loanManager);
          } else {
            // Funded active list (borrower or provider matches user)
            if (loan.borrower.toLowerCase() === activeAccount!.toLowerCase() || loan.provider.toLowerCase() === activeAccount!.toLowerCase()) {
              renderActiveNFTLoan(formattedLoan, loanManager);
            }
          }
        }
      }
    } catch (e) {
      failures++;
    }
    tokenId++;
  }

  // Render marketplace listings
  if (activeSalesList.length === 0) {
    marketListingsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        No active listings found. Mint or list an NFT to see it here!
      </div>`;
  } else {
    activeSalesList.forEach(sale => {
      renderSaleCard(sale, marketplace);
    });
  }

  // Render auctions
  if (activeAuctionsList.length === 0) {
    auctionsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        No active auctions found. Set up an auction in your portfolio to start one!
      </div>`;
  } else {
    activeAuctionsList.forEach(auc => {
      renderAuctionCard(auc, marketplace);
    });
  }

  // Render portfolio
  if (ownedNftsList.length === 0) {
    myNftsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
        You don't own any Nexus NFTs yet. Go to the **NFT Marketplace** tab to mint your first one!
      </div>`;
  } else {
    ownedNftsList.forEach(nftObj => {
      renderPortfolioNFTCard(nftObj, nft, marketplace, loanManager);
    });
  }

  // Render DEX Loans
  const loanCount = await loanManager.loanCounter();
  let activeDexLoansCount = 0;
  
  // DEX loan IDs start from 1 up to loanCounter
  for (let id = 1; id < Number(loanCount); id++) {
    try {
      const loan = await loanManager.DEXloans(id);
      if (loan.borrower.toLowerCase() === activeAccount!.toLowerCase()) {
        activeDexLoansCount++;
        renderDEXLoanItem(id, loan, loanManager);
      }
    } catch (e) {
      // Reverted or does not exist
    }
  }

  if (activeDexLoansCount === 0) {
    myDexLoansList.innerHTML = `
      <div class="muted" style="text-align: center; padding: 40px; color: var(--text-muted);">
        You have no active DEX collateral loans.
      </div>`;
  }

  // Set default placeholder for empty loans
  if (nftLoanRequestsList.innerHTML === '') {
    nftLoanRequestsList.innerHTML = `
      <div class="muted" style="text-align: center; padding: 40px; color: var(--text-muted);">
        No pending NFT loan requests found in network.
      </div>`;
  }
  if (myNftLoansList.innerHTML === '') {
    myNftLoansList.innerHTML = `
      <div class="muted" style="text-align: center; padding: 40px; color: var(--text-muted);">
        You have no active NFT collateral loans.
      </div>`;
  }
}

// CARD RENDERERS

function renderSaleCard(sale: any, marketplace: ethers.Contract) {
  const card = document.createElement('div');
  card.className = 'nft-item';
  const currencyLabel = sale.isDex ? 'DEX' : 'ETH';
  const buyLabel = sale.isDex ? 'Buy with DEX' : 'Buy with ETH';
  card.innerHTML = `
    <div class="nft-media">${sale.id}</div>
    <div class="nft-id">Nexus Token #${sale.id}</div>
    <div class="nft-seller">Seller: ${sale.seller.substring(0, 6)}...${sale.seller.substring(sale.seller.length - 4)}</div>
    <div class="nft-price">${parseFloat(ethers.formatEther(sale.price)).toFixed(4)} ${currencyLabel}</div>
    <button class="btn buy-btn" style="width: 100%;">${buyLabel}</button>
    <div class="status-banner" style="margin-top: 8px;"></div>
  `;

  const buyButton = card.querySelector('.buy-btn') as HTMLButtonElement;
  const statusElement = card.querySelector('.status-banner') as HTMLDivElement;

  buyButton.addEventListener('click', async () => {
    try {
      buyButton.disabled = true;

      if (sale.isDex) {
        showBanner(statusElement, "Checking DEX allowance...", "info");
        const dex = await getDEXContract();
        if (!dex) return;

        const allowance = await dex.allowance(activeAccount, CONTRACT_ADDRESSES.MARKETPLACE);
        if (BigInt(allowance) < sale.price) {
          showBanner(statusElement, "Approving DEX for Marketplace...", "info");
          const appTx = await dex.approve(CONTRACT_ADDRESSES.MARKETPLACE, ethers.MaxUint256);
          await appTx.wait();
        }

        showBanner(statusElement, "Processing DEX purchase...", "info");
        const tx = await marketplace.buyNFTWithDEX(sale.id, sale.price);
        await tx.wait();
      } else {
        showBanner(statusElement, "Processing ETH purchase...", "info");
        const tx = await marketplace.buyNFT(sale.id, { value: sale.price });
        await tx.wait();
      }

      showBanner(statusElement, "Purchased successfully!", "success");
      buyButton.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      buyButton.disabled = false;
      showBanner(statusElement, err.message || "Purchase failed", "err");
    }
  });

  marketListingsGrid.appendChild(card);
}

function renderAuctionCard(auc: any, marketplace: ethers.Contract) {
  const timeLeft = Math.max(0, auc.endTime - Math.floor(Date.now() / 1000));
  const timeText = timeLeft > 0 ? `${Math.ceil(timeLeft / 60)} min remaining` : "Expired";

  const card = document.createElement('div');
  card.className = 'nft-item';
  card.innerHTML = `
    <div class="nft-media">${auc.id}</div>
    <div class="nft-id">Nexus Token #${auc.id}</div>
    <div class="nft-seller">Auctioneer: ${auc.seller.substring(0, 6)}...${auc.seller.substring(auc.seller.length - 4)}</div>
    <div style="font-size: 13px; margin-bottom: 6px;">Min Price: <b>${ethers.formatEther(auc.minPrice)} ETH</b></div>
    <div style="font-size: 13px; margin-bottom: 6px;">
      Highest Bid: <b style="color:var(--success);">${auc.highestBidder === ethers.ZeroAddress ? "None" : ethers.formatEther(auc.highestBid) + " ETH"}</b>
    </div>
    ${auc.highestBidder !== ethers.ZeroAddress ? `<div class="nft-seller" style="margin-bottom: 6px;">Bidder: ${auc.highestBidder.substring(0, 6)}...${auc.highestBidder.substring(auc.highestBidder.length - 4)}</div>` : ''}
    <div style="font-size: 12px; color: var(--primary); font-weight:600; margin-bottom: 12px;">⏳ ${timeText}</div>
    
    ${timeLeft > 0 ? `
      <div class="form-group" style="margin-bottom: 8px;">
        <div class="input-wrapper">
          <input class="bid-amount-input" type="number" step="any" placeholder="Bid Amount" />
          <span class="input-suffix">ETH</span>
        </div>
      </div>
      <button class="btn bid-btn" style="width: 100%;">Place Bid</button>
    ` : `
      <button class="btn btn-secondary end-auction-btn" style="width: 100%;">Finalize Auction</button>
    `}
    <div class="status-banner" style="margin-top: 8px;"></div>
  `;

  const statusElement = card.querySelector('.status-banner') as HTMLDivElement;

  if (timeLeft > 0) {
    const bidBtn = card.querySelector('.bid-btn') as HTMLButtonElement;
    const amountInput = card.querySelector('.bid-amount-input') as HTMLInputElement;

    bidBtn.addEventListener('click', async () => {
      try {
        const val = amountInput.value;
        if (!val) return alert("Enter bid amount");
        bidBtn.disabled = true;
        showBanner(statusElement, "Placing bid...", "info");

        const bidVal = ethers.parseEther(val);
        const tx = await marketplace.bid(auc.id, { value: bidVal });
        await tx.wait();

      showBanner(statusElement, "Bid placed successfully!", "success");
      bidBtn.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      bidBtn.disabled = false;
        showBanner(statusElement, err.message || "Bid failed", "err");
      }
    });
  } else {
    const endBtn = card.querySelector('.end-auction-btn') as HTMLButtonElement;
    endBtn.addEventListener('click', async () => {
      try {
        endBtn.disabled = true;
        showBanner(statusElement, "Finalizing auction...", "info");
        const tx = await marketplace.endAuction(auc.id);
        await tx.wait();
      showBanner(statusElement, "Auction finalized successfully!", "success");
      endBtn.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      endBtn.disabled = false;
        showBanner(statusElement, err.message || "Finalize failed", "err");
      }
    });
  }

  auctionsGrid.appendChild(card);
}

function renderPortfolioNFTCard(
  nftObj: any,
  nftContract: ethers.Contract,
  marketplace: ethers.Contract,
  loanManager: ethers.Contract
) {
  const card = document.createElement('div');
  card.className = 'nft-item';
  card.innerHTML = `
    <div class="nft-media">${nftObj.id}</div>
    <div class="nft-id">Nexus Token #${nftObj.id}</div>
    
    <div class="action-drawer">
      <!-- Action Select -->
      <select class="action-select" style="background:#071018; border:1px solid #21303a; color:#fff; padding:6px; border-radius:6px; font-family:inherit; font-size:13px;">
        <option value="none">-- Select Action --</option>
        <option value="sell">💲 List for Sale</option>
        <option value="auction">⏳ Put on Auction</option>
        <option value="loan">🏦 Borrow ETH</option>
        <option value="burn">🔥 Burn Token</option>
      </select>

      <!-- Sell Action Content -->
      <div class="action-section sell-section hidden" style="margin-top: 8px;">
        <div class="form-group" style="margin-bottom: 8px;">
          <div style="display:flex;gap:6px;">
            <input class="sell-price-input" type="number" step="any" placeholder="Price" style="padding: 6px 10px; font-size: 13px; flex:1;" />
            <select class="sell-currency-select" style="background:#071018; border:1px solid #21303a; color:#fff; padding:6px; border-radius:6px; font-family:inherit; font-size:13px;">
              <option value="eth">ETH</option>
              <option value="dex">DEX</option>
            </select>
          </div>
        </div>
        <button class="btn sell-exec-btn" style="width: 100%; padding: 6px 12px; font-size:13px;">List NFT</button>
      </div>

      <!-- Auction Action Content -->
      <div class="action-section auction-section hidden" style="margin-top: 8px;">
        <div class="form-group" style="margin-bottom: 8px;">
          <input class="auc-price-input" type="number" step="any" placeholder="Min Bid (ETH)" style="padding: 6px 10px; font-size: 12px; margin-bottom: 4px;" />
          <input class="auc-dur-input" type="number" placeholder="Duration (seconds)" style="padding: 6px 10px; font-size: 12px;" />
        </div>
        <button class="btn btn-accent auc-exec-btn" style="width: 100%; padding: 6px 12px; font-size:13px;">Start Auction</button>
      </div>

      <!-- Loan Action Content -->
      <div class="action-section loan-section hidden" style="margin-top: 8px;">
        <div class="form-group" style="margin-bottom: 8px;">
          <input class="loan-val-input" type="number" step="any" placeholder="Loan Value (ETH)" style="padding: 6px 10px; font-size: 12px; margin-bottom: 4px;" />
          <input class="loan-dur-input" type="number" placeholder="Duration (cycles)" style="padding: 6px 10px; font-size: 12px;" />
        </div>
        <button class="btn btn-accent loan-exec-btn" style="width: 100%; padding: 6px 12px; font-size:13px;">Request Loan</button>
      </div>

      <!-- Burn Action Content -->
      <div class="action-section burn-section hidden" style="margin-top: 8px;">
        <button class="btn btn-danger burn-exec-btn" style="width: 100%; padding: 6px 12px; font-size:13px;">🔥 Burn Now</button>
      </div>
    </div>
    <div class="status-banner" style="margin-top: 8px;"></div>
  `;

  const select = card.querySelector('.action-select') as HTMLSelectElement;
  const sections = card.querySelectorAll('.action-section');
  const statusElement = card.querySelector('.status-banner') as HTMLDivElement;

  select.addEventListener('change', () => {
    sections.forEach(sec => sec.classList.add('hidden'));
    if (select.value !== 'none') {
      const activeSec = card.querySelector(`.${select.value}-section`) as HTMLDivElement;
      if (activeSec) activeSec.classList.remove('hidden');
    }
  });

  // NFT LIST FOR SALE IMPLEMENTATION
  const sellBtnExec = card.querySelector('.sell-exec-btn') as HTMLButtonElement;
  const sellPriceInput = card.querySelector('.sell-price-input') as HTMLInputElement;
  sellBtnExec.addEventListener('click', async () => {
    try {
      const price = sellPriceInput.value;
      if (!price) return alert("Enter price");
      sellBtnExec.disabled = true;
      showBanner(statusElement, "Approving & listing...", "info");

      // Verify approval first
      const approved = await nftContract.isApprovedForAll(activeAccount, CONTRACT_ADDRESSES.MARKETPLACE);
      if (!approved) {
        showBanner(statusElement, "Granting NFT Marketplace approval...", "info");
        const approveTx = await nftContract.setApprovalForAll(CONTRACT_ADDRESSES.MARKETPLACE, true);
        await approveTx.wait();
      }

      showBanner(statusElement, "Creating marketplace listing...", "info");
      const sellPriceParsed = ethers.parseEther(price);
      const currencySelect = card.querySelector('.sell-currency-select') as HTMLSelectElement;
      if (currencySelect.value === 'dex') {
        const sellTx = await marketplace.sellNFTForDEX(nftObj.id, sellPriceParsed);
        await sellTx.wait();
      } else {
        const sellTx = await marketplace.sellNFT(nftObj.id, sellPriceParsed);
        await sellTx.wait();
      }

      showBanner(statusElement, "NFT Listed for sale!", "success");
      sellBtnExec.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      sellBtnExec.disabled = false;
      showBanner(statusElement, err.message || "Listing failed", "err");
    }
  });

  // NFT AUCTION START IMPLEMENTATION
  const aucBtnExec = card.querySelector('.auc-exec-btn') as HTMLButtonElement;
  const aucPriceInput = card.querySelector('.auc-price-input') as HTMLInputElement;
  const aucDurInput = card.querySelector('.auc-dur-input') as HTMLInputElement;
  aucBtnExec.addEventListener('click', async () => {
    try {
      const price = aucPriceInput.value;
      const dur = aucDurInput.value;
      if (!price || !dur) return alert("Enter price and duration");
      aucBtnExec.disabled = true;
      showBanner(statusElement, "Approving & listing...", "info");

      // Verify approval first
      const approved = await nftContract.isApprovedForAll(activeAccount, CONTRACT_ADDRESSES.MARKETPLACE);
      if (!approved) {
        showBanner(statusElement, "Granting NFT Marketplace approval...", "info");
        const approveTx = await nftContract.setApprovalForAll(CONTRACT_ADDRESSES.MARKETPLACE, true);
        await approveTx.wait();
      }

      showBanner(statusElement, "Starting auction...", "info");
      const tx = await marketplace.auction(nftObj.id, ethers.parseEther(price), BigInt(dur));
      await tx.wait();

      showBanner(statusElement, "Auction started!", "success");
      aucBtnExec.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      aucBtnExec.disabled = false;
      showBanner(statusElement, err.message || "Auction listing failed", "err");
    }
  });

  // NFT LOAN REQUEST IMPLEMENTATION
  const loanBtnExec = card.querySelector('.loan-exec-btn') as HTMLButtonElement;
  const loanValInput = card.querySelector('.loan-val-input') as HTMLInputElement;
  const loanDurInput = card.querySelector('.loan-dur-input') as HTMLInputElement;
  loanBtnExec.addEventListener('click', async () => {
    try {
      const val = loanValInput.value;
      const dur = loanDurInput.value;
      if (!val || !dur) return alert("Enter value and duration");
      loanBtnExec.disabled = true;
      showBanner(statusElement, "Approving & listing...", "info");

      // Verify approval first
      const approved = await nftContract.isApprovedForAll(activeAccount, CONTRACT_ADDRESSES.LOAN_MANAGER);
      if (!approved) {
        showBanner(statusElement, "Granting NFT Loans approval...", "info");
        const approveTx = await nftContract.setApprovalForAll(CONTRACT_ADDRESSES.LOAN_MANAGER, true);
        await approveTx.wait();
      }

      showBanner(statusElement, "Publishing NFT loan request...", "info");
      const tx = await loanManager.requestLoanNFT(ethers.parseEther(val), nftObj.id, BigInt(dur));
      await tx.wait();

      showBanner(statusElement, "NFT Loan request published!", "success");
      loanBtnExec.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      loanBtnExec.disabled = false;
      showBanner(statusElement, err.message || "Borrow failed", "err");
    }
  });

  // BURN IMPLEMENTATION
  const burnBtnExec = card.querySelector('.burn-exec-btn') as HTMLButtonElement;
  burnBtnExec.addEventListener('click', async () => {
    if (!confirm("Are you sure you want to permanently burn this token? This is irreversible!")) return;
    try {
      burnBtnExec.disabled = true;
      showBanner(statusElement, "Incinerating NFT...", "info");
      const tx = await nftContract.burn(nftObj.id);
      await tx.wait();

      showBanner(statusElement, "Token incinerated!", "success");
      burnBtnExec.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      burnBtnExec.disabled = false;
      showBanner(statusElement, err.message || "Burn failed", "err");
    }
  });

  myNftsGrid.appendChild(card);
}

// DEX LOAN ELEMENT BUILDER
function renderDEXLoanItem(id: number, loan: any, loanManager: ethers.Contract) {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <div class="list-item-details">
      <div class="list-item-title">DEX Loan #${id}</div>
      <div class="list-item-meta">
        Collateral: <b>${ethers.formatEther(loan.collateral)} DEX</b> | 
        Principal: <b>${ethers.formatEther(loan.amount)} ETH</b>
      </div>
      <div class="list-item-meta">
        Cycle Payments Made: <b>${loan.paymentsMade.toString()} / ${loan.deadline.toString()}</b>
      </div>
    </div>
    <div class="list-item-actions" style="display:flex; flex-direction:column; gap:4px;">
      <button class="btn pay-cycle-btn" style="padding:4px 8px; font-size:12px;">Make Payment</button>
      <button class="btn btn-danger terminate-loan-btn" style="padding:4px 8px; font-size:12px;">Terminate Early</button>
    </div>
    <div class="status-banner" style="margin-top: 8px; grid-column:span 2;"></div>
  `;

  const statusElement = item.querySelector('.status-banner') as HTMLDivElement;
  const payBtn = item.querySelector('.pay-cycle-btn') as HTMLButtonElement;
  const termBtn = item.querySelector('.terminate-loan-btn') as HTMLButtonElement;

  payBtn.addEventListener('click', async () => {
    try {
      payBtn.disabled = true;
      showBanner(statusElement, "Sending cycle payment...", "info");
      
      // Calculate dynamic interest payment or principal repayment
      const interest = await loanManager.interest();
      const fee = (BigInt(loan.amount) * BigInt(interest)) / (BigInt(loan.deadline) * 100n);
      
      let finalVal = fee;
      if (Number(loan.paymentsMade) === Number(loan.deadline) - 1) {
        // Final payment includes full principal returned
        finalVal = fee + BigInt(loan.amount);
      }

      const tx = await loanManager.makeDEXLoanPayment(id, { value: finalVal });
      await tx.wait();
      
      showBanner(statusElement, "Payment settled!", "success");
      payBtn.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      payBtn.disabled = false;
      showBanner(statusElement, err.message || "Payment failed", "err");
    }
  });

  termBtn.addEventListener('click', async () => {
    try {
      termBtn.disabled = true;
      showBanner(statusElement, "Sending termination payment...", "info");

      const termFee = await loanManager.termination();
      const finalVal = BigInt(loan.amount) + BigInt(termFee);

      const tx = await loanManager.terminateDEXLoan(id, { value: finalVal });
      await tx.wait();

      showBanner(statusElement, "Loan terminated and collateral returned!", "success");
      termBtn.disabled = false;
      setTimeout(refreshData, 2000);
    } catch (err: any) {
      console.error(err);
      termBtn.disabled = false;
      showBanner(statusElement, err.message || "Termination failed", "err");
    }
  });

  myDexLoansList.appendChild(item);
}

// NFT LOAN REQUESTS RENDERER
function renderNFTLoanRequest(loan: any, loanManager: ethers.Contract) {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <div class="list-item-details">
      <div class="list-item-title">NFT Collateral Token #${loan.id}</div>
      <div class="list-item-meta">
        Borrower: <b>${loan.borrower.substring(0, 6)}...${loan.borrower.substring(loan.borrower.length - 4)}</b>
      </div>
      <div class="list-item-meta">
        Requested Principal: <b style="color:var(--primary);">${ethers.formatEther(loan.amount)} ETH</b>
      </div>
      <div class="list-item-meta">
        Collateral Required: <b>${ethers.formatEther(loan.collateral)} DEX</b>
      </div>
      <div class="list-item-meta">
        Duration: <b>${loan.deadline.toString()} Cycles</b>
      </div>
    </div>
    <div class="list-item-actions">
      ${loan.borrower.toLowerCase() !== activeAccount!.toLowerCase() ? `
        <button class="btn fund-btn" style="padding: 6px 12px; font-size:13px;">Fund Loan</button>
      ` : `
        <span style="font-size:11px; color:var(--text-muted);">Your Request</span>
      `}
    </div>
    <div class="status-banner" style="margin-top: 8px; grid-column:span 2;"></div>
  `;

  if (loan.borrower.toLowerCase() !== activeAccount!.toLowerCase()) {
    const fundBtn = item.querySelector('.fund-btn') as HTMLButtonElement;
    const statusElement = item.querySelector('.status-banner') as HTMLDivElement;

    fundBtn.addEventListener('click', async () => {
      try {
        fundBtn.disabled = true;
        showBanner(statusElement, "Verifying DEX token allowance...", "info");

        // Verify dex token allowance first
        const dex = await getDEXContract();
        if (!dex) return;

        const allowance = await dex.allowance(activeAccount, CONTRACT_ADDRESSES.LOAN_MANAGER);
        if (BigInt(allowance) < BigInt(loan.collateral)) {
          showBanner(statusElement, "Approving DEX collateral token transfer...", "info");
          const appTx = await dex.approve(CONTRACT_ADDRESSES.LOAN_MANAGER, ethers.MaxUint256);
          await appTx.wait();
        }

        showBanner(statusElement, "Providing loan capital...", "info");
        const tx = await loanManager.loanNFT(loan.id);
        await tx.wait();

        showBanner(statusElement, "Loan funded successfully!", "success");
        fundBtn.disabled = false;
        setTimeout(refreshData, 2000);
      } catch (err: any) {
        console.error(err);
        fundBtn.disabled = false;
        showBanner(statusElement, err.message || "Funding failed", "err");
      }
    });
  }

  nftLoanRequestsList.appendChild(item);
}

// ACTIVE NFT LOANS RENDERER
function renderActiveNFTLoan(loan: any, loanManager: ethers.Contract) {
  const isBorrower = loan.borrower.toLowerCase() === activeAccount!.toLowerCase();

  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <div class="list-item-details">
      <div class="list-item-title">Active NFT Loan (Token #${loan.id})</div>
      <div class="list-item-meta">Role: <b style="color:${isBorrower ? 'var(--primary)' : 'var(--success)'};">${isBorrower ? 'Borrower' : 'Lender'}</b></div>
      <div class="list-item-meta">
        Principal: <b>${ethers.formatEther(loan.amount)} ETH</b> | 
        Collateral: <b>${ethers.formatEther(loan.collateral)} DEX</b>
      </div>
      <div class="list-item-meta">
        Payments Made: <b>${loan.paymentsMade.toString()} / ${loan.deadline.toString()}</b>
      </div>
    </div>
    <div class="list-item-actions" style="display:flex; flex-direction:column; gap:4px;">
      ${isBorrower ? `
        <button class="btn pay-cycle-btn" style="padding:4px 8px; font-size:12px;">Make Payment</button>
        <button class="btn btn-danger terminate-loan-btn" style="padding:4px 8px; font-size:12px;">Repay & Terminate</button>
      ` : `
        <button class="btn btn-secondary check-loan-btn" style="padding:4px 8px; font-size:12px;">Check Defaults</button>
      `}
    </div>
    <div class="status-banner" style="margin-top: 8px; grid-column:span 2;"></div>
  `;

  const statusElement = item.querySelector('.status-banner') as HTMLDivElement;

  if (isBorrower) {
    const payBtn = item.querySelector('.pay-cycle-btn') as HTMLButtonElement;
    const termBtn = item.querySelector('.terminate-loan-btn') as HTMLButtonElement;

    payBtn.addEventListener('click', async () => {
      try {
        payBtn.disabled = true;
        showBanner(statusElement, "Sending cycle payment...", "info");

        const interest = await loanManager.interest();
        const fee = (BigInt(loan.amount) * BigInt(interest)) / (BigInt(loan.deadline) * 100n);

        let finalVal = fee;
        if (Number(loan.paymentsMade) === Number(loan.deadline) - 1) {
          finalVal = fee + BigInt(loan.amount);
        }

        const tx = await loanManager.makeNFTLoanPayment(loan.id, { value: finalVal });
        await tx.wait();

        showBanner(statusElement, "Payment settled!", "success");
        payBtn.disabled = false;
        setTimeout(refreshData, 2000);
      } catch (err: any) {
        console.error(err);
        payBtn.disabled = false;
        showBanner(statusElement, err.message || "Payment failed", "err");
      }
    });

    termBtn.addEventListener('click', async () => {
      try {
        termBtn.disabled = true;
        showBanner(statusElement, "Sending termination payment...", "info");

        const termFee = await loanManager.termination();
        const finalVal = BigInt(loan.amount) + BigInt(termFee);

        const tx = await loanManager.terminateNFTLoan(loan.id, { value: finalVal });
        await tx.wait();

        showBanner(statusElement, "Loan terminated and NFT returned!", "success");
        termBtn.disabled = false;
        setTimeout(refreshData, 2000);
      } catch (err: any) {
        console.error(err);
        termBtn.disabled = false;
        showBanner(statusElement, err.message || "Termination failed", "err");
      }
    });
  } else {
    // Lender action: check/claim defaults
    const checkBtn = item.querySelector('.check-loan-btn') as HTMLButtonElement;
    checkBtn.addEventListener('click', async () => {
      try {
        checkBtn.disabled = true;
        showBanner(statusElement, "Verifying loan status and payment schedules...", "info");

        const tx = await loanManager.checkNFTLoan(loan.id);
        await tx.wait();

        showBanner(statusElement, "Loan status check completed!", "success");
        checkBtn.disabled = false;
        setTimeout(refreshData, 2000);
      } catch (err: any) {
        console.error(err);
        checkBtn.disabled = false;
        showBanner(statusElement, err.message || "Verification completed (no changes)", "err");
      }
    });
  }

  myNftLoansList.appendChild(item);
}


// --- TRANSACTION ACTIONS HANDLERS ---

// NFT Minting
mintBtn.addEventListener('click', async () => {
  try {
    const nft = await getNFTContract();
    if (!nft) return alert("Wallet not connected");

    mintBtn.disabled = true;
    showBanner(mintStatus, "Minting your Nexus NFT...", "info");

    const price = await nft.mintPrice();
    const tx = await nft.mint({ value: price });
    await tx.wait();

    showBanner(mintStatus, "Minted successfully! View it in your Portfolio tab.", "success");
    mintBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    mintBtn.disabled = false;
    showBanner(mintStatus, err.message || "Minting failed", "err");
  }
});

// DEX Token swap toggler direction
toggleSwapDirBtn.addEventListener('click', () => {
  if (swapDirection === 'ETH_TO_DEX') {
    swapDirection = 'DEX_TO_ETH';
    swapFromLabel.textContent = 'Pay DEX';
    swapToLabel.textContent = 'Receive ETH (Estimate)';
    swapInputSuffix.textContent = 'DEX';
    swapOutputSuffix.textContent = 'ETH';
  } else {
    swapDirection = 'ETH_TO_DEX';
    swapFromLabel.textContent = 'Pay ETH';
    swapToLabel.textContent = 'Receive DEX (Estimate)';
    swapInputSuffix.textContent = 'ETH';
    swapOutputSuffix.textContent = 'DEX';
  }
  swapInputAmount.value = '';
  swapOutputAmount.value = '';
});

// Live exchange calculation
swapInputAmount.addEventListener('input', () => {
  const val = swapInputAmount.value;
  if (!val || isNaN(parseFloat(val))) {
    swapOutputAmount.value = '';
    return;
  }
  
  const parsedVal = parseFloat(val);
  const rawRate = cachedSwapRate;
  const oneEther = BigInt(ethers.parseEther("1"));
  
  if (swapDirection === 'ETH_TO_DEX') {
    // ETHtoDEX formula: (ethAmount * dexSwapRate) / 1 ether
    const ethWei = ethers.parseEther(parsedVal.toString() || "0");
    const dexRaw = (ethWei * rawRate) / oneEther;
    swapOutputAmount.value = ethers.formatEther(dexRaw);
  } else {
    // DEXtoETH formula: (dexAmount * 1 ether) / dexSwapRate
    const dexRaw = ethers.parseEther(parsedVal.toString() || "0");
    const ethWei = (dexRaw * oneEther) / rawRate;
    swapOutputAmount.value = ethers.formatEther(ethWei);
  }
});

// Execute Swap Handler
executeSwapBtn.addEventListener('click', async () => {
  try {
    const val = swapInputAmount.value;
    if (!val || parseFloat(val) <= 0) return alert("Enter valid swap amount");

    const marketplace = await getMarketplaceContract();
    if (!marketplace) return alert("Wallet not connected");

    executeSwapBtn.disabled = true;
    showBanner(swapStatus, "Initiating swap transaction...", "info");

    if (swapDirection === 'ETH_TO_DEX') {
      const tx = await marketplace.buyDex({ value: ethers.parseEther(val) });
      await tx.wait();
      showBanner(swapStatus, "Successfully swapped ETH for DEX!", "success");
    } else {
      // Swapping DEX for ETH: requires Marketplace allowance approval first
      const dex = await getDEXContract();
      if (!dex) return;

      const dexVal = ethers.parseEther(val);
      const allowance = await dex.allowance(activeAccount, CONTRACT_ADDRESSES.MARKETPLACE);
      
      if (BigInt(allowance) < dexVal) {
        showBanner(swapStatus, "Approving DEX token transfer for swap...", "info");
        const appTx = await dex.approve(CONTRACT_ADDRESSES.MARKETPLACE, ethers.MaxUint256);
        await appTx.wait();
      }

      showBanner(swapStatus, "Selling DEX for ETH...", "info");
      const tx = await marketplace.sellDex(dexVal);
      await tx.wait();
      showBanner(swapStatus, "Successfully swapped DEX for ETH!", "success");
    }

    swapInputAmount.value = '';
    swapOutputAmount.value = '';
    executeSwapBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    executeSwapBtn.disabled = false;
    showBanner(swapStatus, err.message || "Swap failed", "err");
  }
});

// Approve DEX for Marketplace Button
approveDexMarketBtn.addEventListener('click', async () => {
  try {
    const dex = await getDEXContract();
    if (!dex) return alert("Wallet not connected");

    approveDexMarketBtn.disabled = true;
    showBanner(approveDexMarketStatus, "Approving DEX for Marketplace...", "info");

    const tx = await dex.approve(CONTRACT_ADDRESSES.MARKETPLACE, ethers.MaxUint256);
    await tx.wait();

    showBanner(approveDexMarketStatus, "Approval granted successfully!", "success");
    approveDexMarketBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    approveDexMarketBtn.disabled = false;
    showBanner(approveDexMarketStatus, err.message || "Approval failed", "err");
  }
});

// Approve global NFT handlers
approveNftMarketBtn.addEventListener('click', async () => {
  try {
    const nft = await getNFTContract();
    if (!nft) return;

    approveNftMarketBtn.disabled = true;
    showBanner(portfolioApprovalStatus, "Approving NFT Marketplace...", "info");

    const tx = await nft.setApprovalForAll(CONTRACT_ADDRESSES.MARKETPLACE, true);
    await tx.wait();

    showBanner(portfolioApprovalStatus, "Marketplace approved successfully!", "success");
    approveNftMarketBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    approveNftMarketBtn.disabled = false;
    showBanner(portfolioApprovalStatus, err.message || "Approval failed", "err");
  }
});

approveNftLoansBtn.addEventListener('click', async () => {
  try {
    const nft = await getNFTContract();
    if (!nft) return;

    approveNftLoansBtn.disabled = true;
    showBanner(portfolioApprovalStatus, "Approving NFT Loans...", "info");

    const tx = await nft.setApprovalForAll(CONTRACT_ADDRESSES.LOAN_MANAGER, true);
    await tx.wait();

    showBanner(portfolioApprovalStatus, "Loans Portal approved successfully!", "success");
    approveNftLoansBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    approveNftLoansBtn.disabled = false;
    showBanner(portfolioApprovalStatus, err.message || "Approval failed", "err");
  }
});

// Approve DEX for LoanManager Button
approveDexLoanManagerBtn.addEventListener('click', async () => {
  try {
    const dex = await getDEXContract();
    if (!dex) return;

    approveDexLoanManagerBtn.disabled = true;
    showBanner(dexLoanRequestStatus, "Approving DEX for Loan Manager...", "info");

    const tx = await dex.approve(CONTRACT_ADDRESSES.LOAN_MANAGER, ethers.MaxUint256);
    await tx.wait();

    showBanner(dexLoanRequestStatus, "DEX approved successfully!", "success");
    approveDexLoanManagerBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    approveDexLoanManagerBtn.disabled = false;
    showBanner(dexLoanRequestStatus, err.message || "Approval failed", "err");
  }
});

// Borrow DEX Loan Request (Lock DEX -> Receive ETH)
borrowDexBtn.addEventListener('click', async () => {
  try {
    const collateralVal = dexLoanCollateralAmount.value;
    const dur = dexLoanDurationCycles.value;

    if (!collateralVal || parseFloat(collateralVal) <= 0) return alert("Enter valid collateral amount");
    if (!dur || parseInt(dur) <= 0) return alert("Enter valid duration cycles");

    const loanManager = await getLoanManagerContract();
    if (!loanManager) return alert("Wallet not connected");

    borrowDexBtn.disabled = true;
    showBanner(dexLoanRequestStatus, "Checking token transfer approvals...", "info");

    const dex = await getDEXContract();
    if (!dex) return;

    const collateral = ethers.parseEther(collateralVal);
    const allowance = await dex.allowance(activeAccount, CONTRACT_ADDRESSES.LOAN_MANAGER);

    if (BigInt(allowance) < collateral) {
      showBanner(dexLoanRequestStatus, "Approving DEX token transfer for collateral...", "info");
      const appTx = await dex.approve(CONTRACT_ADDRESSES.LOAN_MANAGER, ethers.MaxUint256);
      await appTx.wait();
    }

    showBanner(dexLoanRequestStatus, "Executing borrow loan transaction...", "info");
    const tx = await loanManager.loanDEX(collateral, BigInt(dur));
    await tx.wait();

    showBanner(dexLoanRequestStatus, "Loan created successfully! ETH added to wallet.", "success");
    dexLoanCollateralAmount.value = '';
    dexLoanDurationCycles.value = '';
    borrowDexBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    borrowDexBtn.disabled = false;
    showBanner(dexLoanRequestStatus, err.message || "Borrow failed", "err");
  }
});


// --- ADMIN ACTIONS IMPLEMENTATION ---

// DEX Swap rate adjustment
adminSetSwapRateBtn.addEventListener('click', async () => {
  try {
    const rateVal = adminSwapRateInput.value;
    if (!rateVal || parseInt(rateVal) <= 0) return alert("Enter valid swap rate");

    const dex = await getDEXContract();
    if (!dex) return;

    adminSetSwapRateBtn.disabled = true;
    showBanner(adminSwapRateStatus, "Updating DEX swap rate...", "info");

    const tx = await dex.setDexSwapRate(BigInt(rateVal));
    await tx.wait();

    showBanner(adminSwapRateStatus, "Swap rate updated successfully!", "success");
    adminSwapRateInput.value = '';
    adminSetSwapRateBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    adminSetSwapRateBtn.disabled = false;
    showBanner(adminSwapRateStatus, err.message || "Update failed", "err");
  }
});

// NFT Mint price adjustment
adminSetMintPriceBtn.addEventListener('click', async () => {
  try {
    const priceVal = adminMintPriceInput.value;
    if (!priceVal) return alert("Enter valid mint price");

    const nft = await getNFTContract();
    if (!nft) return;

    adminSetMintPriceBtn.disabled = true;
    showBanner(adminNftStatus, "Updating NFT mint price...", "info");

    const tx = await nft.setMintPrice(ethers.parseEther(priceVal));
    await tx.wait();

    showBanner(adminNftStatus, "NFT Mint price updated successfully!", "success");
    adminMintPriceInput.value = '';
    adminSetMintPriceBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    adminSetMintPriceBtn.disabled = false;
    showBanner(adminNftStatus, err.message || "Update failed", "err");
  }
});

// NFT Base URI adjustment
adminSetBaseUriBtn.addEventListener('click', async () => {
  try {
    const uriVal = adminBaseUriInput.value;
    if (!uriVal) return alert("Enter valid URI");

    const nft = await getNFTContract();
    if (!nft) return;

    adminSetBaseUriBtn.disabled = true;
    showBanner(adminNftStatus, "Updating base URI...", "info");

    const tx = await nft.setBaseURI(uriVal);
    await tx.wait();

    showBanner(adminNftStatus, "NFT Base URI updated successfully!", "success");
    adminBaseUriInput.value = '';
    adminSetBaseUriBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    adminSetBaseUriBtn.disabled = false;
    showBanner(adminNftStatus, err.message || "Update failed", "err");
  }
});

// Save all LoanManager variables
adminSaveLoanParamsBtn.addEventListener('click', async () => {
  try {
    const cycleVal = adminPaymentCycleInput.value;
    const interestVal = adminInterestInput.value;
    const termVal = adminTerminationFeeInput.value;
    const durationVal = adminMaxDurationInput.value;

    const loanManager = await getLoanManagerContract();
    if (!loanManager) return;

    adminSaveLoanParamsBtn.disabled = true;
    showBanner(adminLoansStatus, "Updating loan configuration parameters...", "info");

    if (cycleVal) {
      const tx = await loanManager.setPaymentCycle(BigInt(cycleVal));
      await tx.wait();
    }
    if (interestVal) {
      const tx = await loanManager.setInterest(BigInt(interestVal));
      await tx.wait();
    }
    if (termVal) {
      const tx = await loanManager.setTerminationFee(ethers.parseEther(termVal));
      await tx.wait();
    }
    if (durationVal) {
      const tx = await loanManager.setMaxLoanDuration(BigInt(durationVal));
      await tx.wait();
    }

    showBanner(adminLoansStatus, "Loan configurations saved successfully!", "success");
    adminPaymentCycleInput.value = '';
    adminInterestInput.value = '';
    adminTerminationFeeInput.value = '';
    adminMaxDurationInput.value = '';
    adminSaveLoanParamsBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    adminSaveLoanParamsBtn.disabled = false;
    showBanner(adminLoansStatus, err.message || "Failed to update configurations", "err");
  }
});


// Enable Module on Bank
adminEnableModuleBtn.addEventListener('click', async () => {
  try {
    const moduleAddr = adminModuleAddressInput.value.trim();
    if (!moduleAddr || !/^0x[a-fA-F0-9]{40}$/.test(moduleAddr)) return alert("Enter a valid address");

    const bank = await getBankContract();
    if (!bank) return;

    adminEnableModuleBtn.disabled = true;
    showBanner(adminBankStatus, "Enabling module on Bank...", "info");

    const tx = await bank.setAuthorizedModule(moduleAddr, true);
    await tx.wait();

    showBanner(adminBankStatus, "Module enabled successfully!", "success");
    adminModuleAddressInput.value = '';
    adminEnableModuleBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    adminEnableModuleBtn.disabled = false;
    showBanner(adminBankStatus, err.message || "Failed to enable module", "err");
  }
});

// Disable Module on Bank
adminDisableModuleBtn.addEventListener('click', async () => {
  try {
    const moduleAddr = adminModuleAddressInput.value.trim();
    if (!moduleAddr || !/^0x[a-fA-F0-9]{40}$/.test(moduleAddr)) return alert("Enter a valid address");

    const bank = await getBankContract();
    if (!bank) return;

    adminDisableModuleBtn.disabled = true;
    showBanner(adminBankStatus, "Disabling module on Bank...", "info");

    const tx = await bank.setAuthorizedModule(moduleAddr, false);
    await tx.wait();

    showBanner(adminBankStatus, "Module disabled successfully!", "success");
    adminModuleAddressInput.value = '';
    adminDisableModuleBtn.disabled = false;
    setTimeout(refreshData, 2000);
  } catch (err: any) {
    console.error(err);
    adminDisableModuleBtn.disabled = false;
    showBanner(adminBankStatus, err.message || "Failed to disable module", "err");
  }
});

// Check Module Authorization Status on input
adminModuleAddressInput.addEventListener('input', async () => {
  const moduleAddr = adminModuleAddressInput.value.trim();
  if (!moduleAddr || !/^0x[a-fA-F0-9]{40}$/.test(moduleAddr)) {
    adminModuleAuthStatus.textContent = 'Enter a valid address to check authorization status.';
    return;
  }
  try {
    const bank = await getBankContract();
    if (!bank) return;
    const isAuth = await bank.authorizedModules(moduleAddr);
    adminModuleAuthStatus.innerHTML = isAuth
      ? `<span style="color:var(--success);">✅ Authorized</span>`
      : `<span style="color:var(--danger);">❌ Not Authorized</span>`;
  } catch {
    adminModuleAuthStatus.textContent = 'Could not check authorization.';
  }
});

// --- INITIALIZATION ---

// Wallet Connect button
connectBtn.addEventListener('click', async () => {
  try {
    accountSpan.textContent = 'Connecting...';
    accountSpan.style.color = '';
    const account = await walletConnect();
    if (account) {
      activeAccount = account;
      await refreshData();
    } else {
      accountSpan.textContent = 'Connection failed';
      accountSpan.style.color = '#ff4500';
    }
  } catch (e: any) {
    console.error(e);
    accountSpan.textContent = `Error: ${e.message || e}`;
    accountSpan.style.color = '#ff4500';
  }
});

// Check if MetaMask is already connected on startup
async function init() {
  setupTabs();
  
  if ((window as any).ethereum == null) {
    accountSpan.textContent = 'MetaMask not found';
    connectBtn.disabled = true;
  } else {
    // Attempt silent recovery if already authorized
    const signer = await getActiveSigner();
    if (signer) {
      activeAccount = await signer.getAddress();
      accountSpan.textContent = `${activeAccount.substring(0, 6)}...${activeAccount.substring(activeAccount.length - 4)}`;
      connectBtn.disabled = true;
      connectBtn.textContent = "Wallet Connected";
      await refreshData();
    }

    // Listen for MetaMask account switches
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        activeAccount = null;
        accountSpan.textContent = 'Disconnected';
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect Wallet';
        ethBalanceSpan.textContent = '0.0000';
        dexBalanceSpan.textContent = '0.00';
      } else if (accounts[0].toLowerCase() !== activeAccount?.toLowerCase()) {
        activeAccount = accounts[0];
        accountSpan.textContent = `${activeAccount.substring(0, 6)}...${activeAccount.substring(activeAccount.length - 4)}`;
        connectBtn.disabled = true;
        connectBtn.textContent = "Wallet Connected";
        refreshData();
      }
    });
  }
}

init();