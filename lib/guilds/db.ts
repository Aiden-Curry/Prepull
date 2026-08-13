import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | undefined;
export function databaseConfigured() { return Boolean(process.env.DATABASE_URL); }
export function getPool() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for production guild persistence."); pool ??= new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined, max: 10 }); return pool; }
export async function withTransaction<T>(run: (client: PoolClient) => Promise<T>) { const client = await getPool().connect(); try { await client.query("BEGIN"); const result = await run(client); await client.query("COMMIT"); return result; } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } }
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) { return getPool().query<T>(text, values); }
