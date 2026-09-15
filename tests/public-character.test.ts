import assert from "node:assert/strict";
import test from "node:test";
import { CharacterProviderError, type CharacterProvider } from "../lib/providers/character-provider.ts";
import { lookupPublicCharacter, projectPublicCharacter, publicLookupCacheKey } from "../lib/public-character/lookup.ts";
import { normalizePublicLookup, publicCharacterPath } from "../lib/public-character/path.ts";
import type { PublicCacheEntry, PublicCharacterCacheStore } from "../lib/public-character/types.ts";
import type { NormalizedCharacter } from "../lib/types.ts";

class TestCache implements PublicCharacterCacheStore {
  values = new Map<string, { entry: PublicCacheEntry; expiresAt: Date }>();
  writes = 0;
  async get(key: string, now: Date) { const value = this.values.get(key); return value && value.expiresAt > now ? value.entry : undefined; }
  async set(key: string, entry: PublicCacheEntry, expiresAt: Date) { this.writes += 1; this.values.set(key, { entry, expiresAt }); }
}

const input = { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: " Firemaw ", characterName: " Aidy " };
const character: NormalizedCharacter = { id: "provider-private-id", name: "Aidy", region: "eu", realm: "Firemaw", contentVersion: "era", realmType: "era", level: 60, race: "Orc", class: "Warrior", spec: "Fury", faction: "Horde", professions: [], talents: [], equipment: [], dataMeta: { provider: "mock", isLive: false } };
const providerFor = (findCharacter: CharacterProvider["findCharacter"]): CharacterProvider => ({ findCharacter, async getCharacter() { return null; } });

test("public lookup normalizes canonical Era/TBC URLs while preserving realm ecosystem", () => {
  assert.deepEqual(normalizePublicLookup(input), { ok: true, lookup: { contentVersion: "era", realmType: "era", region: "eu", realm: "firemaw", characterName: "aidy" } });
  assert.equal(publicCharacterPath(input), "/era/characters/era/eu/firemaw/aidy");
  assert.equal(publicCharacterPath({ ...input, contentVersion: "tbc", realmType: "anniversary" }), "/tbc/characters/anniversary/eu/firemaw/aidy");
  assert.equal(normalizePublicLookup({ ...input, characterName: "Éowyn" }).ok, true);
  assert.equal(normalizePublicLookup({ ...input, characterName: "../token" }).ok, false);
});

test("public projection is an explicit allowlist with no trusted or provider-private state", () => {
  const source = { ...character, userId: "private", syncId: "private", rawProviderBody: { token: "private" } } as NormalizedCharacter & Record<string, unknown>;
  const projection = projectPublicCharacter(source, new Date("2026-09-15T12:00:00Z")); const serialized = JSON.stringify(projection);
  assert.deepEqual(Object.keys(projection).sort(), ["className", "contentVersion", "faction", "level", "name", "providerStatus", "race", "realm", "realmType", "region", "retrievedAt", "specialization"].sort());
  assert.doesNotMatch(serialized, /userId|syncId|equipment|token|email|readiness|planner/i);
});

test("a fresh positive lookup populates cache and repeated normalized lookup calls provider once", async () => {
  const cache = new TestCache(); let calls = 0; const provider = providerFor(async () => { calls += 1; return character; }); const now = new Date("2026-09-15T12:00:00Z");
  const first = await lookupPublicCharacter(input, { cache, provider, now });
  const second = await lookupPublicCharacter({ ...input, realm: "firemaw", characterName: "AIDY" }, { cache, provider, now: new Date(now.getTime() + 1_000) });
  assert.equal(first.status, "found"); assert.equal(first.status === "found" && first.cache, "miss"); assert.equal(second.status === "found" && second.cache, "hit"); assert.equal(calls, 1); assert.equal(cache.writes, 1);
});

test("positive cache expires and key dimensions separate version, region, and realm ecosystem", async () => {
  const normalized = normalizePublicLookup(input); assert.equal(normalized.ok, true); if (!normalized.ok) return;
  const base = normalized.lookup;
  assert.notEqual(publicLookupCacheKey(base), publicLookupCacheKey({ ...base, contentVersion: "tbc" }));
  assert.notEqual(publicLookupCacheKey(base), publicLookupCacheKey({ ...base, region: "us" }));
  assert.notEqual(publicLookupCacheKey(base), publicLookupCacheKey({ ...base, realmType: "anniversary" }));
  const cache = new TestCache(); let calls = 0; const provider = providerFor(async () => { calls += 1; return character; }); const now = new Date("2026-09-15T12:00:00Z");
  await lookupPublicCharacter(input, { cache, provider, now }); await lookupPublicCharacter(input, { cache, provider, now: new Date(now.getTime() + 10 * 60_000 + 1) }); assert.equal(calls, 2);
});

test("not-found is cached briefly while transient provider failures are never negatively cached", async () => {
  const now = new Date("2026-09-15T12:00:00Z"); const missingCache = new TestCache(); let missingCalls = 0;
  const missing = providerFor(async () => { missingCalls += 1; return null; });
  assert.equal((await lookupPublicCharacter(input, { cache: missingCache, provider: missing, now })).status, "not_found");
  assert.equal((await lookupPublicCharacter(input, { cache: missingCache, provider: missing, now: new Date(now.getTime() + 44_000) })).status, "not_found"); assert.equal(missingCalls, 1);
  await lookupPublicCharacter(input, { cache: missingCache, provider: missing, now: new Date(now.getTime() + 46_000) }); assert.equal(missingCalls, 2);
  const errorCache = new TestCache(); let errorCalls = 0; const failing = providerFor(async () => { errorCalls += 1; throw new CharacterProviderError("ProviderUnavailable", "private upstream detail"); });
  assert.equal((await lookupPublicCharacter(input, { cache: errorCache, provider: failing, now })).status, "temporary_error");
  assert.equal((await lookupPublicCharacter(input, { cache: errorCache, provider: failing, now })).status, "temporary_error"); assert.equal(errorCalls, 2); assert.equal(errorCache.writes, 0);
});

test("Anniversary remains distinct and unsupported provider responses never fall back to Era", async () => {
  const cache = new TestCache(); const anniversary = { ...input, contentVersion: "tbc" as const, realmType: "anniversary" as const, realm: "Spineshatter" }; let receivedRealmType = "";
  const provider = providerFor(async (lookup) => { receivedRealmType = lookup.realmType; throw new CharacterProviderError("UnsupportedRealmType", "unsupported"); });
  assert.equal((await lookupPublicCharacter(anniversary, { cache, provider })).status, "unsupported"); assert.equal(receivedRealmType, "anniversary"); assert.equal(cache.writes, 0);
});
