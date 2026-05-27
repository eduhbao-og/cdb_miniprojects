// src/server.ts

import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
});

interface UserRecord {
  id: number;
  address: string;
  username: string;
}

interface NftRecord {
  id: number;
  uri: string;
  owner_id: number | null;
}

interface SaleRecord {
  id: number;
  nft_id: number | null;
  seller_id: number | null;
  price: string;
  active: boolean;
}

interface AuctionRecord {
  id: number;
  nft_id: number | null;
  seller_id: number | null;
  minimum_price: string;
  end_time: string;
  highest_bidder_id: number | null;
  highest_bid: string;
  active: boolean;
}

interface DexLoanRecord {
  id: number;
  borrower_id: number | null;
  loan_amount: string;
  interest_rate: string;
  duration: number;
  start_time: string;
  end_time: string;
}

interface NftLoanRecord {
  id: number;
  nft_id: number | null;
  borrower_id: number | null;
  provider_id: number | null;
  amount: string;
  interest_rate: string;
  duration: number;
  start_time: string;
  end_time: string;
}

const allowedTables = new Set(['users', 'nfts', 'sales', 'auctions', 'dexloans', 'nftloans']);

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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'Backend is up' });
});

app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const users = await readAll('users');
    res.json(users as UserRecord[]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await readOne('users', Number(req.params.id));
    res.json(user as UserRecord);
  } catch (error) {
    if ((error as Error).message === 'Not found') {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(500).json({ message: 'Failed to fetch user', error: (error as Error).message });
  }
});

app.get('/api/:table', async (req: Request, res: Response) => {
  try {
    const table = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
    const rows = await readAll(table);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: 'Invalid table name', error: (error as Error).message });
  }
});

app.get('/api/:table/:id', async (req: Request, res: Response) => {
  try {
    const table = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
    const row = await readOne(table, Number(req.params.id));
    res.json(row);
  } catch (error) {
    if ((error as Error).message === 'Not found') {
      res.status(404).json({ message: 'Record not found' });
      return;
    }

    res.status(400).json({ message: 'Invalid request', error: (error as Error).message });
  }
});

app.post('/api/:table', async (req: Request, res: Response) => {
  try {
    const table = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
    if (!isRecord(req.body)) {
      res.status(400).json({ message: 'JSON object required' });
      return;
    }

    const row = await createOne(table, req.body);
    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create record', error: (error as Error).message });
  }
});

app.put('/api/:table/:id', async (req: Request, res: Response) => {
  try {
    const table = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
    if (!isRecord(req.body)) {
      res.status(400).json({ message: 'JSON object required' });
      return;
    }

    const row = await updateOne(table, Number(req.params.id), req.body);
    res.json(row);
  } catch (error) {
    if ((error as Error).message === 'Not found') {
      res.status(404).json({ message: 'Record not found' });
      return;
    }

    res.status(400).json({ message: 'Failed to update record', error: (error as Error).message });
  }
});

app.delete('/api/:table/:id', async (req: Request, res: Response) => {
  try {
    const table = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
    const row = await deleteOne(table, Number(req.params.id));
    res.json({ message: 'Record deleted', row });
  } catch (error) {
    if ((error as Error).message === 'Not found') {
      res.status(404).json({ message: 'Record not found' });
      return;
    }

    res.status(400).json({ message: 'Failed to delete record', error: (error as Error).message });
  }
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});