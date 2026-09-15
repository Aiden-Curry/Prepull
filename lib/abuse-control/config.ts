export type AbuseEndpoint = "public_lookup" | "signup" | "signin" | "oauth_start" | "battle_net_import";
export type AbuseDimension = "client" | "account";
export type AbusePolicy = { bucket: string; endpoint: AbuseEndpoint; dimension: AbuseDimension; limit: number; windowMs: number };

export const ABUSE_POLICIES: readonly AbusePolicy[] = [
  { bucket: "public_lookup:client:v1", endpoint: "public_lookup", dimension: "client", limit: 20, windowMs: 60_000 },
  { bucket: "signup:client:v1", endpoint: "signup", dimension: "client", limit: 5, windowMs: 10 * 60_000 },
  { bucket: "signup:account:v1", endpoint: "signup", dimension: "account", limit: 5, windowMs: 10 * 60_000 },
  { bucket: "signin:client:v1", endpoint: "signin", dimension: "client", limit: 10, windowMs: 10 * 60_000 },
  { bucket: "signin:account:v1", endpoint: "signin", dimension: "account", limit: 10, windowMs: 10 * 60_000 },
  { bucket: "oauth_start:client:v1", endpoint: "oauth_start", dimension: "client", limit: 10, windowMs: 10 * 60_000 },
  { bucket: "battle_net_import:client:v1", endpoint: "battle_net_import", dimension: "client", limit: 120, windowMs: 20 * 60_000 },
  { bucket: "battle_net_import:account:v1", endpoint: "battle_net_import", dimension: "account", limit: 100, windowMs: 20 * 60_000 },
] as const;
