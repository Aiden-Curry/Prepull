import type { CharacterRealmType, ContentVersion, NormalizedCharacter, Region } from "../types.ts";
export type CharacterLookup = { contentVersion: ContentVersion; realmType: CharacterRealmType; region: Region; realm: string; characterName: string };
export interface CharacterProvider { findCharacter(lookup: CharacterLookup): Promise<NormalizedCharacter | null>; getCharacter(id: string): Promise<NormalizedCharacter | null>; }
export type ProviderErrorCode = "CharacterNotFound" | "RealmNotFound" | "UnsupportedRealmType" | "UnsupportedGameVersion" | "ProviderUnavailable" | "AuthenticationFailure" | "RateLimited" | "MalformedProviderResponse";
export class CharacterProviderError extends Error { readonly code: ProviderErrorCode; readonly status?: number; constructor(code: ProviderErrorCode, message: string, status?: number) { super(message); this.name = "CharacterProviderError"; this.code = code; this.status = status; } }
