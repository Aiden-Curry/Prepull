import { databaseConfigured } from "./db.ts";
import { MemoryGuildRepository } from "./repository.ts";
import { PostgresGuildRepository } from "./postgres-repository.ts";
import type { GuildRepository } from "./repository.ts";
const memory = new MemoryGuildRepository();
const postgres = new PostgresGuildRepository();
export function getGuildRepository(): GuildRepository { if (databaseConfigured()) return postgres as unknown as GuildRepository; if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required for production guild persistence."); return memory; }
