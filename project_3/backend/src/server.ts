// src/server.ts

import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { Pool } from 'pg';
import { LOAN_MANAGER_ABI, MARKETPLACE_ABI } from './abis';

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://cdb_user:cdb_password@localhost:5432/cdb_db',
});

interface SaleRecord {
  id: number;
  nft_id: number | null;
  buyer_address: string | null;
  price: string;
  cur: 'DEX' | 'ETH';
}

interface AuctionRecord {
  id: number;
  nft_id: number | null;
  seller_address: string | null;
  buyer_address: string | null;
  price: string;
}

interface DexLoanRecord {
  id: number;
  borrower_address: string | null;
  amount: string;
}

interface NftLoanRecord {
  id: number;
  nft_id: number | null;
  borrower_id: string | null;
  provider_id: string | null;
  amount: string;
}

const allowedTables = new Set(['sales', 'auctions', 'dexloans', 'nftloans']);

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

function getContractAddresses(): { MARKETPLACE: string; LOAN_MANAGER: string } {
  const envMarketplace = process.env.MARKETPLACE_ADDRESS;
  const envLoanManager = process.env.LOAN_MANAGER_ADDRESS;

  if (envMarketplace && envLoanManager) {
    return { MARKETPLACE: envMarketplace, LOAN_MANAGER: envLoanManager };
  }

  const configPath = path.resolve(__dirname, '../../frontend/src/config.ts');

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const marketplaceMatch = content.match(/MARKETPLACE:\s*"([^"]+)"/);
    const loanManagerMatch = content.match(/LOAN_MANAGER:\s*"([^"]+)"/);

    if (marketplaceMatch?.[1] && loanManagerMatch?.[1]) {
      return {
        MARKETPLACE: marketplaceMatch[1],
        LOAN_MANAGER: loanManagerMatch[1],
      };
    }
  }

  throw new Error('Contract addresses not found. Set MARKETPLACE_ADDRESS and LOAN_MANAGER_ADDRESS or run the deployment script to update frontend/src/config.ts.');
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? '';
}

function normalizeTableName(table: string): string {
  const value = table.toLowerCase();

  if (!allowedTables.has(value)) {
    throw new Error(`Unknown table: ${table}`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readAll(table: string): Promise<unknown[]> {
  const name = normalizeTableName(table);
  const result = await pool.query(`SELECT * FROM ${name} ORDER BY id`);

  return result.rows;
}

async function readOne(table: string, id: number): Promise<unknown> {
  const name = normalizeTableName(table);
  const result = await pool.query(`SELECT * FROM ${name} WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    throw new Error('Not found');
  }

  return result.rows[0];
}

async function createOne(table: string, payload: Record<string, unknown>): Promise<unknown> {
  const name = normalizeTableName(table);
  const columns = Object.keys(payload).filter((key) => key !== 'id');

  if (columns.length === 0) {
    throw new Error('No columns provided');
  }

  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const sql = `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const values = columns.map((key) => payload[key]);

  const result = await pool.query(sql, values);

  return result.rows[0];
}

async function updateOne(table: string, id: number, payload: Record<string, unknown>): Promise<unknown> {
  const name = normalizeTableName(table);
  const columns = Object.keys(payload).filter((key) => key !== 'id');

  if (columns.length === 0) {
    throw new Error('No columns provided');
  }

  const assignments = columns.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const sql = `UPDATE ${name} SET ${assignments} WHERE id = $${columns.length + 1} RETURNING *`;
  const values = [...columns.map((key) => payload[key]), id];

  const result = await pool.query(sql, values);

  if (result.rows.length === 0) {
    throw new Error('Not found');
  }

  return result.rows[0];
}

async function deleteOne(table: string, id: number): Promise<unknown> {
  const name = normalizeTableName(table);
  const result = await pool.query(`DELETE FROM ${name} WHERE id = $1 RETURNING *`, [id]);

  if (result.rows.length === 0) {
    throw new Error('Not found');
  }

  return result.rows[0];
}

async function handleItemSold(buyer: string, tokenId: bigint, price: bigint, isDex: boolean): Promise<void> {
  const currency = isDex ? 'DEX' : 'ETH';
  await pool.query(
    'INSERT INTO sales (nft_id, buyer_address, price, cur) VALUES ($1, $2, $3, $4)',
    [Number(tokenId), buyer, price.toString(), currency],
  );
}

async function handleAuctionEnded(seller: string, buyer: string, tokenId: bigint, finalPrice: bigint): Promise<void> {
  await pool.query(
    'INSERT INTO auctions (nft_id, seller_address, buyer_address, price) VALUES ($1, $2, $3, $4)',
    [Number(tokenId), seller, buyer, finalPrice.toString()],
  );
}

async function handleDexLoanFinished(borrower: string, amount: bigint): Promise<void> {
  await pool.query(
    'INSERT INTO dexloans (borrower_address, amount) VALUES ($1, $2)',
    [borrower, amount.toString()],
  );
}

async function handleNftLoanFinished(borrower: string, provider: string, amount: bigint): Promise<void> {
  await pool.query(
    'INSERT INTO nftloans (nft_id, borrower_id, provider_id, amount) VALUES ($1, $2, $3, $4)',
    [0, borrower, provider, amount.toString()],
  );
}

let lastPolledBlock = 0;
let pollInterval: ReturnType<typeof setInterval> | null = null;

function startEventListeners(): void {
  const addresses = getContractAddresses();
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const marketplace = new ethers.Contract(addresses.MARKETPLACE, MARKETPLACE_ABI, provider);
  const loanManager = new ethers.Contract(addresses.LOAN_MANAGER, LOAN_MANAGER_ABI, provider);

  console.log('Listening for contract completion events at:', addresses);

  // Initial catch-up: poll from block 0
  void pollEvents(marketplace, loanManager, provider);

  // Then poll every 2 seconds for new blocks
  pollInterval = setInterval(() => pollEvents(marketplace, loanManager, provider), 2000);
}

async function pollEvents(
  marketplace: ethers.Contract,
  loanManager: ethers.Contract,
  provider: ethers.JsonRpcProvider
): Promise<void> {
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = lastPolledBlock > 0 ? lastPolledBlock + 1 : 0;
    if (fromBlock > currentBlock) return;

    const [newSales, newAuctions, newDexLoans, newNftLoans] = await Promise.all([
      marketplace.queryFilter(marketplace.filters.ItemSold(), fromBlock, 'latest'),
      marketplace.queryFilter(marketplace.filters.AuctionEnded(), fromBlock, 'latest'),
      loanManager.queryFilter(loanManager.filters.DEXloanFinished(), fromBlock, 'latest'),
      loanManager.queryFilter(loanManager.filters.NFTloanFinished(), fromBlock, 'latest'),
    ]);

    for (const log of newSales) {
      if (!('args' in log)) continue;
      const [buyer, tokenId, price, isDex] = log.args as unknown as [string, bigint, bigint, boolean];
      await handleItemSold(buyer, tokenId, price, isDex);
    }

    for (const log of newAuctions) {
      if (!('args' in log)) continue;
      const [seller, buyer, tokenId, finalPrice] = log.args as unknown as [string, string, bigint, bigint];
      await handleAuctionEnded(seller, buyer, tokenId, finalPrice);
    }

    for (const log of newDexLoans) {
      if (!('args' in log)) continue;
      const [borrower, amount] = log.args as unknown as [string, bigint];
      await handleDexLoanFinished(borrower, amount);
    }

    for (const log of newNftLoans) {
      if (!('args' in log)) continue;
      const [borrower, provider, amount] = log.args as unknown as [string, string, bigint];
      await handleNftLoanFinished(borrower, provider, amount);
    }

    if (lastPolledBlock === 0) {
      console.log(`Caught up historical events: ${newSales.length} sales, ${newAuctions.length} auctions, ${newDexLoans.length} DEX loans, ${newNftLoans.length} NFT loans`);
    }

    lastPolledBlock = currentBlock;
  } catch (err) {
    console.error('Polling error:', err);
  }
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'Backend is up' });
});

app.get('/api/sales/by-buyer/:buyer_address', async (req: Request, res: Response) => {
  try {
    const buyerAddress = getParam(req.params.buyer_address);
    const result = await pool.query(
      'SELECT * FROM sales WHERE buyer_address = $1 ORDER BY id',
      [buyerAddress],
    );

    res.json(result.rows as SaleRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales', error: (error as Error).message });
  }
});

app.get('/api/auctions/by-buyer/:buyer_address', async (req: Request, res: Response) => {
  try {
    const buyerAddress = getParam(req.params.buyer_address);
    const result = await pool.query(
      'SELECT * FROM auctions WHERE buyer_address = $1 ORDER BY id',
      [buyerAddress],
    );

    res.json(result.rows as AuctionRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch auctions', error: (error as Error).message });
  }
});

app.get('/api/auctions/by-seller/:seller_address', async (req: Request, res: Response) => {
  try {
    const sellerAddress = getParam(req.params.seller_address);
    const result = await pool.query(
      'SELECT * FROM auctions WHERE seller_address = $1 ORDER BY id',
      [sellerAddress],
    );

    res.json(result.rows as AuctionRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch auctions', error: (error as Error).message });
  }
});

app.get('/api/dexloans/borrower/:borrower_address', async (req: Request, res: Response) => {
  try {
    const borrowerAddress = getParam(req.params.borrower_address);
    const result = await pool.query(
      'SELECT * FROM dexloans WHERE borrower_address = $1 ORDER BY id',
      [borrowerAddress],
    );

    res.json(result.rows as DexLoanRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch DEX loans', error: (error as Error).message });
  }
});

app.get('/api/nftloans/borrower/:borrower_id', async (req: Request, res: Response) => {
  try {
    const borrowerId = getParam(req.params.borrower_id);
    const result = await pool.query(
      'SELECT * FROM nftloans WHERE borrower_id = $1 ORDER BY id',
      [borrowerId],
    );

    res.json(result.rows as NftLoanRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch NFT loans', error: (error as Error).message });
  }
});

app.get('/api/nftloans/provider/:provider_id', async (req: Request, res: Response) => {
  try {
    const providerId = getParam(req.params.provider_id);
    const result = await pool.query(
      'SELECT * FROM nftloans WHERE provider_id = $1 ORDER BY id',
      [providerId],
    );

    res.json(result.rows as NftLoanRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch NFT loans', error: (error as Error).message });
  }
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startEventListeners();
});
