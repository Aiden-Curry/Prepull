import { BATTLE_NET_LIMITS, BATTLE_NET_OAUTH_SCOPES } from "./config.ts";
import type { BattleNetDiscoveredCharacter, BattleNetIdentity } from "./types.ts";
import { normalizeCharacterName, normalizeLookup } from "../characters/normalization.ts";
import type { Region } from "../types.ts";

export class BattleNetOAuthError extends Error {
  readonly code: "configuration" | "token_exchange" | "userinfo" | "account_profile" | "malformed";
  constructor(code: "configuration" | "token_exchange" | "userinfo" | "account_profile" | "malformed", message: string) { super(message); this.code = code; this.name = "BattleNetOAuthError"; }
}

type TokenResponse = { access_token?: string; expires_in?: number; token_type?: string; scope?: string };
type UserInfoResponse = { sub?: string; id?: string | number; battletag?: string };
type AccountCharacter = { id?: number; name?: string; character?: { id?: number; name?: string }; realm?: { name?: string; slug?: string }; level?: number; playable_class?: { name?: string }; playable_race?: { name?: string } };
type AccountProfile = { wow_accounts?: Array<{ characters?: AccountCharacter[] }> };

export interface BattleNetOAuthClient {
  authorizationUrl(input: { region: Region; state: string; redirectUri: string }): string;
  exchangeCode(input: { region: Region; code: string; redirectUri: string }): Promise<{ accessToken: string; expiresIn: number }>;
  userInfo(region: Region, accessToken: string): Promise<BattleNetIdentity>;
  discoverEraCharacters(region: Region, accessToken: string): Promise<BattleNetDiscoveredCharacter[]>;
}

function credentials() {
  const clientId = process.env.BATTLENET_CLIENT_ID;
  const clientSecret = process.env.BATTLENET_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new BattleNetOAuthError("configuration", "Battle.net login is not configured.");
  return { clientId, clientSecret };
}

async function safeJson<T>(response: Response, code: BattleNetOAuthError["code"]): Promise<T> {
  if (!response.ok) { console.warn("[battle-net-oauth] provider request failed", { event: `${code}_failed`, status: response.status }); throw new BattleNetOAuthError(code, "Battle.net could not complete this request."); }
  try { return await response.json() as T; } catch { throw new BattleNetOAuthError("malformed", "Battle.net returned an unreadable response."); }
}

export function normalizeAccountProfile(payload: AccountProfile, region: Region) {
  const seen = new Set<string>();
  const result: BattleNetDiscoveredCharacter[] = [];
  for (const account of payload.wow_accounts ?? []) for (const entry of account.characters ?? []) {
    const name = entry.character?.name ?? entry.name ?? "";
    const realmName = entry.realm?.name ?? "";
    const realmSlug = normalizeLookup(entry.realm?.slug ?? realmName);
    const normalizedName = normalizeCharacterName(name);
    if (!/^\p{L}[\p{L}\p{M}-]{0,31}$/u.test(normalizedName) || !/^[a-z0-9-]{1,64}$/.test(realmSlug)) continue;
    const key = `${region}:${realmSlug}:${normalizedName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ providerCharacterId: String(entry.character?.id ?? entry.id ?? "") || undefined, name, normalizedName, realmName, realmSlug, region, realmType: "era", contentSupport: "supported", className: entry.playable_class?.name, race: entry.playable_race?.name, level: entry.level });
    if (result.length >= BATTLE_NET_LIMITS.maxDiscoveredCharacters) return result;
  }
  return result;
}

export class LiveBattleNetOAuthClient implements BattleNetOAuthClient {
  authorizationUrl({ region, state, redirectUri }: { region: Region; state: string; redirectUri: string }) {
    const { clientId } = credentials();
    const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: BATTLE_NET_OAUTH_SCOPES.join(" "), state });
    return `https://${region}.battle.net/oauth/authorize?${query}`;
  }
  async exchangeCode({ region, code, redirectUri }: { region: Region; code: string; redirectUri: string }) {
    const { clientId, clientSecret } = credentials();
    const response = await fetch(`https://${region}.battle.net/oauth/token`, { method: "POST", headers: { authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }), cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const token = await safeJson<TokenResponse>(response, "token_exchange");
    if (!token.access_token || !token.expires_in) throw new BattleNetOAuthError("malformed", "Battle.net returned an invalid token response.");
    return { accessToken: token.access_token, expiresIn: token.expires_in };
  }
  async userInfo(region: Region, accessToken: string) {
    const payload = await safeJson<UserInfoResponse>(await fetch(`https://${region}.battle.net/oauth/userinfo`, { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10_000) }), "userinfo");
    const subject = String(payload.sub ?? payload.id ?? "");
    if (!subject || !payload.battletag) throw new BattleNetOAuthError("malformed", "Battle.net returned incomplete identity data.");
    return { subject, accountId: payload.id === undefined ? undefined : String(payload.id), battleTag: payload.battletag };
  }
  async discoverEraCharacters(region: Region, accessToken: string): Promise<BattleNetDiscoveredCharacter[]> {
    const locale = region === "eu" ? "en_GB" : "en_US";
    const query = new URLSearchParams({ namespace: `profile-classic1x-${region}`, locale });
    const response = await fetch(`https://${region}.api.blizzard.com/profile/user/wow?${query}`, { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
    return normalizeAccountProfile(await safeJson<AccountProfile>(response, "account_profile"), region);
  }
}

export class MockBattleNetOAuthClient implements BattleNetOAuthClient {
  authorizationUrl({ region, state, redirectUri }: { region: Region; state: string; redirectUri: string }) { const query = new URLSearchParams({ state, region, redirect_uri: redirectUri }); return `/api/auth/battlenet/mock-authorize?${query}`; }
  async exchangeCode({ region, code }: { region: Region; code: string }) { if (!code.startsWith(`mock:`) || !code.endsWith(`:${region}`)) throw new BattleNetOAuthError("token_exchange", "Mock authorization code is invalid."); return { accessToken: code, expiresIn: 300 }; }
  async userInfo(region: Region, accessToken: string) { const fixture = accessToken.split(":")[1] || "default"; return { subject: `mock-subject-${fixture}`, accountId: `mock-account-${fixture}`, battleTag: `${fixture[0]?.toUpperCase() ?? "P"}${fixture.slice(1)}#1234` }; }
  async discoverEraCharacters(region: Region, accessToken: string): Promise<BattleNetDiscoveredCharacter[]> {
    const fixture = accessToken.split(":")[1] || "default";
    if (fixture === "profile-failure") throw new BattleNetOAuthError("account_profile", "Synthetic profile failure.");
    return [
      { providerCharacterId: "101", name: "Aidy", normalizedName: "aidy", realmName: "Firemaw", realmSlug: "firemaw", region, realmType: "era", contentSupport: "supported", className: "Warrior", race: "Orc", level: 60 },
      { providerCharacterId: "102", name: "Rivyn", normalizedName: "rivyn", realmName: "Firemaw", realmSlug: "firemaw", region, realmType: "era", contentSupport: "supported", className: "Rogue", race: "Orc", level: 60 },
      { providerCharacterId: "103", name: "Providerdown", normalizedName: "providerdown", realmName: "Firemaw", realmSlug: "firemaw", region, realmType: "era", contentSupport: "supported", className: "Warrior", race: "Orc", level: 60 },
      { providerCharacterId: "104", name: "Whimsy", normalizedName: "whimsy", realmName: "Spineshatter", realmSlug: "spineshatter", region, realmType: "anniversary", contentSupport: "unsupported", className: "Mage", level: 70 },
    ];
  }
}

export function getBattleNetOAuthClient(): BattleNetOAuthClient {
  if (process.env.BATTLENET_OAUTH_MODE === "mock") {
    if (process.env.NODE_ENV === "production") throw new BattleNetOAuthError("configuration", "Mock Battle.net OAuth is disabled in production.");
    return new MockBattleNetOAuthClient();
  }
  return new LiveBattleNetOAuthClient();
}
