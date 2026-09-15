import { normalizeCharacterName, normalizeLookup } from "../characters/normalization.ts";
import type { CharacterLookup } from "../providers/character-provider.ts";
import type { CharacterRealmType, ContentVersion, Region } from "../types.ts";
import { PUBLIC_LOOKUP_BOUNDS } from "./config.ts";

export type PublicLookupInput = { contentVersion: ContentVersion; realmType: CharacterRealmType; region: Region; realm: string; characterName: string };

export function normalizePublicLookup(input: PublicLookupInput): { ok: true; lookup: CharacterLookup } | { ok: false; message: string } {
  const realmInput = input.realm.trim();
  const characterInput = input.characterName.trim().normalize("NFC");
  const realm = normalizeLookup(realmInput);
  const characterName = normalizeCharacterName(characterInput);
  if (!(["era", "tbc"] as string[]).includes(input.contentVersion) || !(["era", "anniversary"] as string[]).includes(input.realmType) || !(["eu", "us"] as string[]).includes(input.region)) return { ok: false, message: "Choose a valid version, realm ecosystem, and region." };
  if (!realmInput || realmInput.length > PUBLIC_LOOKUP_BOUNDS.maxRealmInputLength || !/^[a-z0-9-]{1,64}$/.test(realm)) return { ok: false, message: "Enter a valid realm." };
  if (!characterName || characterName.length > PUBLIC_LOOKUP_BOUNDS.maxCharacterNameLength || !/^\p{L}[\p{L}\p{M}-]*$/u.test(characterName)) return { ok: false, message: "Enter a valid character name." };
  return { ok: true, lookup: { ...input, realm, characterName } };
}

export function publicCharacterPath(input: PublicLookupInput) {
  const normalized = normalizePublicLookup(input);
  if (!normalized.ok) return undefined;
  const lookup = normalized.lookup;
  return `/${lookup.contentVersion}/characters/${lookup.realmType}/${lookup.region}/${encodeURIComponent(lookup.realm)}/${encodeURIComponent(lookup.characterName)}`;
}
