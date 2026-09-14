import { Pool, type QueryResult, type QueryResultRow } from 'pg';

let pool: Pool | null = null;
let circuitTrippedUntil = 0; // Timestamp for cooldown if connection fails
const COOLDOWN_MS = 60_000; // 60s cooldown if Azure DB is offline/firewalled

function getConnectionString(): string | null {
  let connStr = process.env.AZURE_DB_CONNECTION_STRING;
  if (!connStr) return null;

  // Clean up any repeated prefix if present
  if (connStr.startsWith('AZURE_DB_CONNECTION_STRING=')) {
    connStr = connStr.replace(/^AZURE_DB_CONNECTION_STRING=/, '').trim();
  }

  return connStr.trim() || null;
}

export function getAzurePool(): Pool | null {
  if (pool) return pool;

  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    pool.on('error', (err) => {
      console.warn('[Azure DB] Pool background error:', err.message);
      circuitTrippedUntil = Date.now() + COOLDOWN_MS;
    });

    return pool;
  } catch (err: any) {
    console.error('[Azure DB] Failed to initialize connection pool:', err.message);
    return null;
  }
}

export function isAzureDbConfigured(): boolean {
  return Boolean(getConnectionString());
}

export function isAzureDbCircuitOpen(): boolean {
  return Date.now() < circuitTrippedUntil;
}

export async function checkAzureDb(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
  circuitOpen?: boolean;
}> {
  if (!isAzureDbConfigured()) {
    return { connected: false, error: 'AZURE_DB_CONNECTION_STRING not configured' };
  }

  if (isAzureDbCircuitOpen()) {
    const remainingSeconds = Math.ceil((circuitTrippedUntil - Date.now()) / 1000);
    return {
      connected: false,
      circuitOpen: true,
      error: `Circuit open (cooldown active for ${remainingSeconds}s)`,
    };
  }

  const p = getAzurePool();
  if (!p) {
    return { connected: false, error: 'Pool initialization failed' };
  }

  const start = Date.now();
  try {
    const client = await p.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return { connected: true, latencyMs };
    } finally {
      client.release();
    }
  } catch (err: any) {
    circuitTrippedUntil = Date.now() + COOLDOWN_MS;
    return { connected: false, error: err.message };
  }
}

/**
 * Execute a safe SELECT query against Azure DB.
 * Returns null if Azure DB is unconfigured, circuit open, or if query fails.
 * This allows routes to gracefully fall back to Supabase.
 */
export async function queryAzure<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<T[] | null> {
  if (!isAzureDbConfigured() || isAzureDbCircuitOpen()) {
    return null;
  }

  const p = getAzurePool();
  if (!p) return null;

  try {
    const res: QueryResult<T> = await p.query(sql, params);
    return res.rows;
  } catch (err: any) {
    console.warn('[Azure DB] Query failed (falling back to Supabase):', err.message);
    circuitTrippedUntil = Date.now() + COOLDOWN_MS;
    return null;
  }
}

/**
 * Execute a safe INSERT/UPDATE/DELETE statement against Azure DB.
 * Returns true if executed successfully, false if skipped or failed.
 */
export async function executeAzure(sql: string, params?: any[]): Promise<boolean> {
  if (!isAzureDbConfigured() || isAzureDbCircuitOpen()) {
    return false;
  }

  const p = getAzurePool();
  if (!p) return false;

  try {
    await p.query(sql, params);
    return true;
  } catch (err: any) {
    console.warn('[Azure DB] Execution failed:', err.message);
    circuitTrippedUntil = Date.now() + COOLDOWN_MS;
    return false;
  }
}

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
  return `"${name}"`;
}

export async function upsertAzure(table: string, row: Record<string, any>): Promise<boolean> {
  const columns = Object.keys(row).filter((key) => row[key] !== undefined);
  if (!columns.includes('id') || columns.length === 0) return false;

  const names = columns.map(quoteIdent).join(', ');
  const values = columns.map((_, index) => `$${index + 1}`).join(', ');
  const updates = columns
    .filter((key) => key !== 'id')
    .map((key) => `${quoteIdent(key)} = EXCLUDED.${quoteIdent(key)}`)
    .join(', ');

  const sql = `
    INSERT INTO public.${quoteIdent(table)} (${names})
    VALUES (${values})
    ON CONFLICT (id) DO ${updates ? `UPDATE SET ${updates}` : 'NOTHING'}
  `;

  return executeAzure(sql, columns.map((key) => row[key]));
}

export async function upsertManyAzure(table: string, rows: Record<string, any>[]): Promise<void> {
  for (const row of rows) {
    await upsertAzure(table, row);
  }
}

export async function deleteAzure(table: string, id: string): Promise<boolean> {
  return executeAzure(`DELETE FROM public.${quoteIdent(table)} WHERE id = $1`, [id]);
}

/**
 * Ensures required large-object tables (notes, showcase_projects, competitions)
 * exist in Azure PostgreSQL database.
 */
export async function initAzureTables(): Promise<boolean> {
  if (!isAzureDbConfigured() || isAzureDbCircuitOpen()) {
    return false;
  }

  const p = getAzurePool();
  if (!p) return false;

  try {
    await p.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS public.notes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text NOT NULL,
        code text NOT NULL,
        subject text,
        year text NOT NULL DEFAULT '1st-year',
        semester text NOT NULL DEFAULT 'sem-1',
        branch text DEFAULT 'All Branches',
        description text,
        pdf_url text NOT NULL,
        file_size text DEFAULT 'PDF Document',
        page_count integer,
        author text DEFAULT 'CampusCoder Academic Team',
        tags text[] DEFAULT '{}',
        topics jsonb DEFAULT '[]'::jsonb,
        highlights text[] DEFAULT '{}',
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.showcase_projects (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text NOT NULL,
        tagline text NOT NULL,
        description text NOT NULL,
        tech_stack text[] NOT NULL DEFAULT '{}',
        category text NOT NULL DEFAULT 'Web App',
        github_url text,
        live_url text,
        demo_video_url text,
        author_id uuid,
        author_name text NOT NULL,
        author_email text,
        author_college text,
        author_branch text,
        author_year text,
        stars integer NOT NULL DEFAULT 0,
        featured boolean NOT NULL DEFAULT false,
        status text NOT NULL DEFAULT 'approved',
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.competitions (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text NOT NULL,
        subtitle text,
        platform text NOT NULL,
        platform_url text NOT NULL,
        type text NOT NULL DEFAULT 'hackathon',
        difficulty text NOT NULL DEFAULT 'All Levels',
        prize_pool text,
        team_size text DEFAULT 'Solo or Team',
        mode text NOT NULL DEFAULT 'Online',
        status text NOT NULL DEFAULT 'Upcoming',
        start_date timestamp with time zone,
        deadline_date text NOT NULL,
        target_date timestamp with time zone NOT NULL,
        concluded_date text,
        description text,
        tags text[] DEFAULT '{}',
        banner_gradient text DEFAULT 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
        perks text[] DEFAULT '{}',
        eligibility text DEFAULT 'Open to all students and developers',
        timeline jsonb DEFAULT '[]'::jsonb,
        prep_kit jsonb DEFAULT '[]'::jsonb,
        checklist text[] DEFAULT '{}',
        featured boolean DEFAULT false,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.resources (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text NOT NULL,
        description text,
        link text NOT NULL,
        category text NOT NULL,
        event_id uuid,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    console.log('[Azure DB] Large-object tables verified / initialized successfully.');
    return true;
  } catch (err: any) {
    console.warn('[Azure DB] Table initialization warning:', err.message);
    circuitTrippedUntil = Date.now() + COOLDOWN_MS;
    return false;
  }
}
