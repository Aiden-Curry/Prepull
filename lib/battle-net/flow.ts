import { BATTLE_NET_COOKIES, BATTLE_NET_LIMITS } from "./config.ts";
import { getBattleNetOAuthClient } from "./client.ts";
import { battleNetRepository, BattleNetDomainError } from "./repository.ts";
import { browserBindingHash, opaqueTokenHash, randomOpaqueToken } from "./security.ts";
import { sanitizeAuthCallback } from "../auth-callback.ts";
import type { ContentVersion, Region } from "../types.ts";
import type { BattleNetDiscoveredCharacter } from "./types.ts";

export function battleNetApplicationOrigin(request: Request) {
  const configured = process.env.NEXTAUTH_URL;
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV !== "production") return new URL(request.url).origin;
  throw new Error("NEXTAUTH_URL is required for Battle.net login.");
}

export function battleNetCallbackUri(request: Request) {
  const configured = process.env.BATTLENET_REDIRECT_URI;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("BATTLENET_REDIRECT_URI is required for Battle.net login.");
  return `${battleNetApplicationOrigin(request)}/api/auth/battlenet/callback`;
}

export function validateBattleNetRegion(value: unknown): Region | undefined { return value === "eu" || value === "us" ? value : undefined; }

export async function beginBattleNetOAuth(input: { request: Request; region: Region; intent: "login" | "link"; initiatingUserId?: string; callbackUrl?: string; fixture?: string; now?: Date }) {
  const now = input.now ?? new Date();
  const callbackUrl = sanitizeAuthCallback(input.callbackUrl, "/era/battle-net/import");
  const contentVersion: ContentVersion = callbackUrl.startsWith("/tbc") ? "tbc" : "era";
  const state = randomOpaqueToken(); const binding = randomOpaqueToken();
  await battleNetRepository.createOAuthState({ stateHash: opaqueTokenHash(state), browserBindingHash: browserBindingHash(binding), region: input.region, intent: input.intent, initiatingUserId: input.initiatingUserId, contentVersion, callbackUrl, expiresAt: new Date(now.getTime() + BATTLE_NET_LIMITS.oauthStateMs) }, now);
  let authorizationUrl = getBattleNetOAuthClient().authorizationUrl({ region: input.region, state, redirectUri: battleNetCallbackUri(input.request) });
  if (authorizationUrl.startsWith("/") && input.fixture && /^[a-z-]{1,32}$/.test(input.fixture)) { const url = new URL(authorizationUrl, battleNetApplicationOrigin(input.request)); url.searchParams.set("fixture", input.fixture); authorizationUrl = `${url.pathname}${url.search}`; }
  return { authorizationUrl, binding };
}

export async function completeBattleNetOAuth(input: { request: Request; state: string; code?: string; providerError?: string; browserBinding?: string; currentUserId?: string; now?: Date }) {
  const now = input.now ?? new Date();
  if (!input.state || !input.browserBinding) throw new BattleNetDomainError("invalid_state", "This Battle.net connection could not be verified.");
  const state = await battleNetRepository.consumeOAuthState(opaqueTokenHash(input.state), browserBindingHash(input.browserBinding), now);
  if (state.intent === "link" && state.initiatingUserId !== input.currentUserId) throw new BattleNetDomainError("forbidden", "Sign in with the account that started this connection.");
  if (input.providerError || !input.code) return { status: "cancelled" as const, callbackUrl: state.callbackUrl, contentVersion: state.contentVersion };
  const client = getBattleNetOAuthClient();
  const token = await client.exchangeCode({ region: state.region, code: input.code, redirectUri: battleNetCallbackUri(input.request) });
  const identity = await client.userInfo(state.region, token.accessToken);
  let characters: BattleNetDiscoveredCharacter[] = []; let discoveryStatus: "complete" | "era_unavailable" = "complete";
  try { characters = await client.discoverEraCharacters(state.region, token.accessToken); }
  catch { discoveryStatus = "era_unavailable"; }
  const connection = await battleNetRepository.connectIdentity({ intent: state.intent, initiatingUserId: state.initiatingUserId, region: state.region, identity, now });
  const importSessionId = await battleNetRepository.createImportSession({ userId: connection.userId, connectionId: connection.connectionId, contentVersion: state.contentVersion, callbackUrl: state.callbackUrl, discoveryStatus, expiresAt: new Date(now.getTime() + BATTLE_NET_LIMITS.importSessionMs), characters });
  console.info("[battle-net-oauth] completed", { event: connection.reauthorized ? "battle_net.reauthorized" : "battle_net.connected", intent: state.intent, region: state.region, discoveredCount: characters.length, discoveryStatus });
  if (state.intent === "link") return { status: "linked" as const, userId: connection.userId, importSessionId, contentVersion: state.contentVersion };
  const grant = randomOpaqueToken();
  await battleNetRepository.createLoginGrant(opaqueTokenHash(grant), connection.userId, importSessionId, new Date(now.getTime() + BATTLE_NET_LIMITS.loginGrantMs));
  return { status: "login" as const, userId: connection.userId, importSessionId, contentVersion: state.contentVersion, grant };
}

export function battleNetBindingCookie(value: string) { return { name: BATTLE_NET_COOKIES.browserBinding, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: Math.floor(BATTLE_NET_LIMITS.oauthStateMs / 1000) }; }
export function battleNetGrantCookie(value: string) { return { name: BATTLE_NET_COOKIES.loginGrant, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: Math.floor(BATTLE_NET_LIMITS.loginGrantMs / 1000) }; }
