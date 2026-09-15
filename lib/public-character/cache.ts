import { query } from "../guilds/db.ts";
import type { PublicCacheEntry, PublicCharacterCacheStore, PublicCharacterProjection } from "./types.ts";

type CacheRow = { status: "found" | "not_found"; projection: PublicCharacterProjection | null };

export class PostgresPublicCharacterCache implements PublicCharacterCacheStore {
  async get(key: string, now: Date) {
    const result = await query<CacheRow>(
      "SELECT status,projection FROM public_character_lookup_cache WHERE cache_key=$1 AND expires_at>$2",
      [key, now],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return row.status === "found" && row.projection
      ? { status: "found" as const, projection: row.projection }
      : { status: "not_found" as const, projection: null };
  }

  async set(key: string, entry: PublicCacheEntry, expiresAt: Date, now: Date) {
    await query("DELETE FROM public_character_lookup_cache WHERE expires_at<=$1", [now]);
    await query(
      `INSERT INTO public_character_lookup_cache(cache_key,status,projection,expires_at,created_at,updated_at)
       VALUES($1,$2,$3,$4,$5,$5)
       ON CONFLICT(cache_key) DO UPDATE SET status=excluded.status,projection=excluded.projection,expires_at=excluded.expires_at,updated_at=excluded.updated_at`,
      [key, entry.status, entry.projection ? JSON.stringify(entry.projection) : null, expiresAt, now],
    );
  }
}

export const publicCharacterCache = new PostgresPublicCharacterCache();
