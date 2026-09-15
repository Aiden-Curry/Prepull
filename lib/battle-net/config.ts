export const BATTLE_NET_OAUTH_SCOPES = ["openid", "wow.profile"] as const;

export const BATTLE_NET_LIMITS = {
  oauthStateMs: 10 * 60_000,
  loginGrantMs: 2 * 60_000,
  importSessionMs: 20 * 60_000,
  maxDiscoveredCharacters: 100,
  importConcurrency: 3,
} as const;

export const BATTLE_NET_COOKIES = {
  browserBinding: "prepull-bnet-binding",
  loginGrant: "prepull-bnet-grant",
} as const;
