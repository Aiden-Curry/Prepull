import fs from "node:fs/promises";
import path from "node:path";
import { query, withTransaction } from "../lib/guilds/db.ts";
const directory = path.join(process.cwd(), "migrations");
await query("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
const applied = new Set((await query<{ version: string }>("SELECT version FROM schema_migrations")).rows.map((row) => row.version));
for (const file of (await fs.readdir(directory)).filter((entry) => /^\d+_.+\.sql$/.test(entry)).sort()) { if (applied.has(file)) continue; const sql = await fs.readFile(path.join(directory, file), "utf8"); await withTransaction(async (client) => { await client.query(sql); await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]); }); console.log(`Applied ${file}`); }
console.log("Database migrations are up to date.");
