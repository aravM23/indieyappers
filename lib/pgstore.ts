/**
 * Shared Postgres store for the dynamic data that must survive serverless
 * instances: sessions and sign-ups from Sign in with X. Activated when
 * DATABASE_URL (or POSTGRES_URL) is set; otherwise the app falls back to
 * local SQLite, which is fine for development.
 */
import { Pool } from "pg";

export interface JoinedFounder {
  handle: string;
  name: string;
  x_user_id: string;
  avatar_url: string | null;
  followers: number | null;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function pgConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
      max: 3,
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  schemaReady ??= getPool()
    .query(
      `CREATE TABLE IF NOT EXISTS sessions (
         token TEXT PRIMARY KEY,
         handle TEXT NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       );
       CREATE TABLE IF NOT EXISTS joined_founders (
         handle TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         x_user_id TEXT NOT NULL,
         avatar_url TEXT,
         followers INTEGER,
         oauth_access_token TEXT,
         oauth_refresh_token TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       );`
    )
    .then(() => undefined);
  await schemaReady;
}

export async function pgCreateSession(token: string, handle: string) {
  await ensureSchema();
  await getPool().query(
    "INSERT INTO sessions (token, handle) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING",
    [token, handle]
  );
}

export async function pgDestroySession(token: string) {
  await ensureSchema();
  await getPool().query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function pgSessionHandle(token: string): Promise<string | null> {
  await ensureSchema();
  const res = await getPool().query<{ handle: string }>(
    "SELECT handle FROM sessions WHERE token = $1",
    [token]
  );
  return res.rows[0]?.handle ?? null;
}

export async function pgUpsertJoinedFounder(f: JoinedFounder) {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO joined_founders
       (handle, name, x_user_id, avatar_url, followers, oauth_access_token, oauth_refresh_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (handle) DO UPDATE SET
       name = EXCLUDED.name,
       avatar_url = EXCLUDED.avatar_url,
       followers = EXCLUDED.followers,
       oauth_access_token = EXCLUDED.oauth_access_token,
       oauth_refresh_token = EXCLUDED.oauth_refresh_token`,
    [
      f.handle,
      f.name,
      f.x_user_id,
      f.avatar_url,
      f.followers,
      f.oauth_access_token,
      f.oauth_refresh_token,
    ]
  );
}

export async function pgGetJoinedFounder(
  handle: string
): Promise<JoinedFounder | null> {
  await ensureSchema();
  const res = await getPool().query<JoinedFounder>(
    "SELECT * FROM joined_founders WHERE LOWER(handle) = LOWER($1)",
    [handle]
  );
  return res.rows[0] ?? null;
}

export async function pgListJoinedFounders(): Promise<JoinedFounder[]> {
  await ensureSchema();
  const res = await getPool().query<JoinedFounder>(
    "SELECT * FROM joined_founders ORDER BY created_at ASC"
  );
  return res.rows;
}
