import { createHmac, timingSafeEqual } from "node:crypto";
import { ABUSE_POLICIES, type AbuseEndpoint } from "./config.ts";
import { postgresRateLimitStore, type RateLimitStore } from "./store.ts";

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function abuseControlSecret() {
  const secret = process.env.ABUSE_CONTROL_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "test") return "prepull-test-abuse-control-secret";
  throw new Error("ABUSE_CONTROL_SECRET or NEXTAUTH_SECRET is required for abuse protection.");
}

export function derivePrivateRateLimitKey(bucket: string, subject: string, secret = abuseControlSecret()) {
  return createHmac("sha256", secret).update(`${bucket}\0${subject}`).digest("hex");
}

export function trustedClientIdentity(request: Request) {
  if (process.env.VERCEL === "1") return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "vercel-client-unavailable";
  if (process.env.NODE_ENV !== "production") return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local-development-client";
  throw new Error("Client identity is unavailable outside the trusted Vercel request boundary.");
}

function hasAcceptanceBypass(request: Request) {
  const configured = process.env.E2E_ABUSE_BYPASS_SECRET || (process.env.NODE_ENV !== "production" ? "local-e2e-abuse-bypass" : "");
  const supplied = request.headers.get("x-prepull-e2e-bypass") ?? "";
  if (!configured || configured.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(configured), Buffer.from(supplied));
}

export async function enforceAbusePolicy(input: { endpoint: AbuseEndpoint; request: Request; accountIdentifier?: string; store?: RateLimitStore; now?: Date }): Promise<RateLimitDecision> {
  if (hasAcceptanceBypass(input.request)) return { allowed: true };
  const store = input.store ?? postgresRateLimitStore; const now = input.now ?? new Date(); const client = trustedClientIdentity(input.request);
  let retryAfterSeconds = 0;
  for (const policy of ABUSE_POLICIES.filter((entry) => entry.endpoint === input.endpoint)) {
    if (policy.dimension === "account" && !input.accountIdentifier) continue;
    const subject = policy.dimension === "client" ? client : input.accountIdentifier!.trim().toLowerCase();
    const consumption = await store.consume(policy.bucket, derivePrivateRateLimitKey(policy.bucket, subject), policy.limit, policy.windowMs, now);
    if (consumption.count > policy.limit) retryAfterSeconds = Math.max(retryAfterSeconds, Math.max(1, Math.ceil((consumption.resetAt.getTime() - now.getTime()) / 1000)));
  }
  if (retryAfterSeconds) { console.warn("[abuse-control] request limited", { event: `${input.endpoint}_rate_limited` }); return { allowed: false, retryAfterSeconds }; }
  return { allowed: true };
}

export function rateLimitedJson(message: string, retryAfterSeconds: number) {
  return new Response(JSON.stringify({ message }), { status: 429, headers: { "content-type": "application/json; charset=utf-8", "retry-after": String(retryAfterSeconds), "cache-control": "private, no-store" } });
}
