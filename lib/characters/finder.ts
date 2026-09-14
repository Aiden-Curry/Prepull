import { normalizeLookup } from "./normalization.ts";
import { CharacterProviderError } from "../providers/character-provider.ts";
import type { CharacterLookup } from "../providers/character-provider.ts";
import type { CharacterRealmType, ContentVersion, Region } from "../types.ts";

type FinderQuery = Record<string, string | string[] | undefined>;
export type FinderValidation = { ok: true; lookup: CharacterLookup } | { ok: false; message: string };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

export function validateFinderQuery(version: ContentVersion, query: FinderQuery): FinderValidation {
  const region = one(query.region); const realmType = one(query.realmType);
  const realm = normalizeLookup(one(query.realm)); const characterName = normalizeLookup(one(query.name));
  if (!(["eu", "us"] as string[]).includes(region)) return { ok: false, message: "Choose Europe or North America." };
  if (!(["era", "anniversary"] as string[]).includes(realmType)) return { ok: false, message: "Choose a supported realm ecosystem." };
  if (!/^[a-z0-9-]{1,64}$/.test(realm) || !/^[a-z0-9-]{1,32}$/.test(characterName)) return { ok: false, message: "Enter a valid realm and character name." };
  return { ok: true, lookup: { contentVersion: version, region: region as Region, realmType: realmType as CharacterRealmType, realm, characterName } };
}

export function safeFinderError(error: unknown) {
  if (!(error instanceof CharacterProviderError)) return "Character search is temporarily unavailable. Try again shortly.";
  if (error.code === "CharacterNotFound" || error.code === "RealmNotFound") return "We couldn't find that character. Check the spelling, realm, and region.";
  if (error.code === "UnsupportedRealmType") return "Live Anniversary character profiles aren't available yet. Era profiles are currently supported.";
  if (error.code === "UnsupportedGameVersion") return "Live character profiles aren't available for this content version yet.";
  if (error.code === "RateLimited") return "Character search is busy right now. Try again shortly.";
  return "Character search is temporarily unavailable. Try again shortly.";
}
