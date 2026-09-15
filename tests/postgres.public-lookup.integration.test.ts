import assert from "node:assert/strict";
import test from "node:test";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
process.env.NEXTAUTH_SECRET ??= "prepull-postgres-integration-secret";
const { query, closePool } = await import("../lib/guilds/db.ts");
const { PostgresPublicCharacterCache } = await import("../lib/public-character/cache.ts");
const { lookupPublicCharacter, publicLookupCacheKey } = await import("../lib/public-character/lookup.ts");
const { normalizePublicLookup } = await import("../lib/public-character/path.ts");
const { PostgresRateLimitStore } = await import("../lib/abuse-control/store.ts");
const { enforceAbusePolicy } = await import("../lib/abuse-control/service.ts");

const input = { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: "Firemaw", characterName: "Aidy" };
const character = { id: "private-provider-id", name: "Aidy", region: "eu" as const, realm: "Firemaw", contentVersion: "era" as const, realmType: "era" as const, level: 60, race: "Orc", class: "Warrior", spec: "Fury", faction: "Horde" as const, professions: [], talents: [], equipment: [], dataMeta: { provider: "mock" as const, isLive: false } };

test("PostgreSQL public cache survives repository recreation and suppresses a second provider call", { skip: !enabled }, async () => {
  const normalized = normalizePublicLookup(input); assert.equal(normalized.ok, true); if (!normalized.ok) return; const key = publicLookupCacheKey(normalized.lookup); let calls = 0;
  const provider = { async findCharacter() { calls += 1; return character; }, async getCharacter() { return null; } };
  try { await query("DELETE FROM public_character_lookup_cache WHERE cache_key=$1", [key]); const first = await lookupPublicCharacter(input, { cache: new PostgresPublicCharacterCache(), provider }); const second = await lookupPublicCharacter(input, { cache: new PostgresPublicCharacterCache(), provider }); assert.equal(first.status === "found" && first.cache, "miss"); assert.equal(second.status === "found" && second.cache, "hit"); assert.equal(calls, 1); assert.equal((await query("SELECT cache_key FROM public_character_lookup_cache WHERE cache_key=$1", [key])).rowCount, 1); }
  finally { await query("DELETE FROM public_character_lookup_cache WHERE cache_key=$1", [key]); }
});

test("PostgreSQL limiter is shared across instances and blocks before protected work", { skip: !enabled }, async () => {
  const request = new Request("http://localhost/api/public/characters", { headers: { "x-forwarded-for": "198.51.100.77" } }); const now = new Date("2026-09-15T12:00:00Z"); let protectedCalls = 0;
  try { await query("DELETE FROM abuse_rate_limit_windows WHERE bucket='public_lookup:client:v1'"); for (let index = 0; index < 20; index += 1) { const result = await enforceAbusePolicy({ endpoint: "public_lookup", request, store: new PostgresRateLimitStore(), now }); if (result.allowed) protectedCalls += 1; } const blocked = await enforceAbusePolicy({ endpoint: "public_lookup", request, store: new PostgresRateLimitStore(), now }); if (blocked.allowed) protectedCalls += 1; assert.equal(blocked.allowed, false); assert.equal(protectedCalls, 20); }
  finally { await query("DELETE FROM abuse_rate_limit_windows WHERE bucket='public_lookup:client:v1'"); }
});

test.after(async () => closePool());
