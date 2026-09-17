import { projectArmory } from "../armory/projection.ts";
import { createHash } from "node:crypto";
import type { CharacterLookup, CharacterProvider } from "../providers/character-provider.ts";
import { CharacterProviderError } from "../providers/character-provider.ts";
import type { NormalizedCharacter } from "../types.ts";
import { publicCharacterCache } from "./cache.ts";
import { PUBLIC_LOOKUP_CACHE_TTL } from "./config.ts";
import { normalizePublicLookup, type PublicLookupInput } from "./path.ts";
import type { PublicCharacterCacheStore, PublicCharacterProjection } from "./types.ts";

export type PublicLookupResult =
  | { status: "found"; character: PublicCharacterProjection; cache: "hit" | "miss" }
  | { status: "not_found"; cache: "hit" | "miss" }
  | { status: "unsupported" }
  | { status: "invalid"; message: string }
  | { status: "temporary_error" };

export function publicLookupCacheKey(lookup: CharacterLookup) {
  const identity = [lookup.contentVersion, lookup.realmType, lookup.region, lookup.realm, lookup.characterName].join("\0");
  return `public-character:v1:${createHash("sha256").update(identity).digest("hex")}`;
}

export function projectPublicCharacter(character: NormalizedCharacter, now: Date): PublicCharacterProjection {
  return { name: character.name, realm: character.realm, region: character.region, level: character.level, race: character.race, className: character.class, specialization: character.spec, faction: character.faction, contentVersion: character.contentVersion, realmType: character.realmType, providerStatus: character.dataMeta?.isLive ? "live" : "preview", retrievedAt: character.dataMeta?.retrievedAt ?? now.toISOString(), armory: projectArmory(character, character.dataMeta?.retrievedAt ?? now.toISOString()) };
}

export async function lookupPublicCharacter(input: PublicLookupInput, dependencies: { cache?: PublicCharacterCacheStore; provider?: CharacterProvider; now?: Date } = {}): Promise<PublicLookupResult> {
  const normalized = normalizePublicLookup(input);
  if (!normalized.ok) return { status: "invalid", message: normalized.message };
  const now = dependencies.now ?? new Date(); const cache = dependencies.cache ?? publicCharacterCache; const provider = dependencies.provider ?? (await import("../providers/factory.ts")).getCharacterProvider();
  const key = publicLookupCacheKey(normalized.lookup);
  const cached = await cache.get(key, now);
  if (cached) { console.info("[public-character] lookup", { event: "cache_hit", version: input.contentVersion, realmType: input.realmType, region: input.region, outcome: cached.status }); return cached.status === "found" ? { status: "found", character: cached.projection, cache: "hit" } : { status: "not_found", cache: "hit" }; }
  console.info("[public-character] lookup", { event: "cache_miss", version: input.contentVersion, realmType: input.realmType, region: input.region });
  try {
    const character = await (provider.findPublicCharacter ? provider.findPublicCharacter(normalized.lookup) : provider.findCharacter(normalized.lookup));
    if (!character) { await cache.set(key, { status: "not_found", projection: null }, new Date(now.getTime() + PUBLIC_LOOKUP_CACHE_TTL.notFoundMs), now); console.info("[public-character] lookup", { event: "provider_not_found", version: input.contentVersion, realmType: input.realmType, region: input.region }); return { status: "not_found", cache: "miss" }; }
    const projection = projectPublicCharacter(character, now);
    await cache.set(key, { status: "found", projection }, new Date(now.getTime() + PUBLIC_LOOKUP_CACHE_TTL.foundMs), now);
    console.info("[public-character] lookup", { event: "provider_success", version: input.contentVersion, realmType: input.realmType, region: input.region });
    return { status: "found", character: projection, cache: "miss" };
  } catch (error) {
    if (error instanceof CharacterProviderError && (error.code === "UnsupportedRealmType" || error.code === "UnsupportedGameVersion")) return { status: "unsupported" };
    if (error instanceof CharacterProviderError && (error.code === "CharacterNotFound" || error.code === "RealmNotFound")) { await cache.set(key, { status: "not_found", projection: null }, new Date(now.getTime() + PUBLIC_LOOKUP_CACHE_TTL.notFoundMs), now); return { status: "not_found", cache: "miss" }; }
    console.warn("[public-character] lookup", { event: "provider_temporary_error", version: input.contentVersion, realmType: input.realmType, region: input.region });
    return { status: "temporary_error" };
  }
}
