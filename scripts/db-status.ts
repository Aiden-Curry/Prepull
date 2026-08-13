import { query } from "../lib/guilds/db.ts";
const result = await query<{ version: string; applied_at: string }>("SELECT version, applied_at FROM schema_migrations ORDER BY version");
console.table(result.rows);
