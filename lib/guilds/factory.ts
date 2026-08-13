import { databaseConfigured } from "./db.ts";
import { MemoryGuildRepository } from "./repository.ts";
import { PostgresGuildRepository } from "./postgres-repository.ts";
import type { GuildRepository } from "./repository.ts";
const memory = new MemoryGuildRepository();
const postgres = new PostgresGuildRepository();
export function getGuildRepository(): GuildRepository { return getConfiguredGuildRepository(); }
export function repositoryDriver(): "memory" | "postgres" { const configured = process.env.GUILD_REPOSITORY_DRIVER; if (configured === "memory") return "memory"; if (configured === "postgres") return "postgres"; if (process.env.NODE_ENV === "production") throw new Error("GUILD_REPOSITORY_DRIVER=postgres is required in production."); return "memory"; }
export function getConfiguredGuildRepository(): GuildRepository { const driver = repositoryDriver(); if (driver === "postgres") { if (!databaseConfigured()) throw new Error("DATABASE_URL is required when GUILD_REPOSITORY_DRIVER=postgres."); return postgres as unknown as GuildRepository; } return memory; }
