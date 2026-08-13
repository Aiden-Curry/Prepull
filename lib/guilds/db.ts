import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { mapPostgresError } from "./postgres-errors.ts";

let pool: Pool | undefined;
export function databaseConfigured() { return Boolean(process.env.DATABASE_URL); }
export function getPool() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for production guild persistence."); pool ??= new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined, max: 10 }); return pool; }
export async function closePool() { if (pool) { const current = pool; pool = undefined; await current.end(); } }
export async function withTransaction<T>(run: (client: PoolClient) => Promise<T>) { let client: PoolClient | undefined; try { client = await getPool().connect(); await client.query("BEGIN"); const result = await run(client); await client.query("COMMIT"); return result; } catch (error) { if (client) { try { await client.query("ROLLBACK"); } catch { /* preserve the normalized operation error */ } } throw mapPostgresError(error); } finally { client?.release(); } }
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) { try { return await getPool().query<T>(text, values); } catch (error) { throw mapPostgresError(error); } }
