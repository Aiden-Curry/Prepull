import assert from "node:assert/strict";
import test from "node:test";
import { ABUSE_POLICIES } from "../lib/abuse-control/config.ts";
import { abuseControlSecret, derivePrivateRateLimitKey, enforceAbusePolicy, trustedClientIdentity } from "../lib/abuse-control/service.ts";
import type { RateLimitStore } from "../lib/abuse-control/store.ts";

process.env.NEXTAUTH_SECRET ??= "prepull-unit-test-secret";

class TestRateStore implements RateLimitStore {
  counts = new Map<string, number>();
  async consume(bucket: string, keyHash: string, _limit: number, windowMs: number, now: Date) { const start = Math.floor(now.getTime() / windowMs) * windowMs; const key = `${bucket}:${keyHash}:${start}`; const count = (this.counts.get(key) ?? 0) + 1; this.counts.set(key, count); return { count, resetAt: new Date(start + windowMs) }; }
}
const request = (ip = "203.0.113.8") => new Request("http://localhost/test", { headers: { "x-forwarded-for": ip } });

test("lookup policy allows its threshold, then blocks with reliable Retry-After and resets by clock", async () => {
  const store = new TestRateStore(); const now = new Date("2026-09-15T12:00:00Z"); const policy = ABUSE_POLICIES.find((entry) => entry.endpoint === "public_lookup")!;
  for (let index = 0; index < policy.limit; index += 1) assert.deepEqual(await enforceAbusePolicy({ endpoint: "public_lookup", request: request(), store, now }), { allowed: true });
  const blocked = await enforceAbusePolicy({ endpoint: "public_lookup", request: request(), store, now }); assert.equal(blocked.allowed, false); if (!blocked.allowed) assert.equal(blocked.retryAfterSeconds, 60);
  assert.deepEqual(await enforceAbusePolicy({ endpoint: "public_lookup", request: request(), store, now: new Date(now.getTime() + 60_001) }), { allowed: true });
});

test("signup and sign-in have independent client/account buckets and configured thresholds", async () => {
  const store = new TestRateStore(); const now = new Date("2026-09-15T12:00:00Z");
  for (let index = 0; index < 5; index += 1) assert.equal((await enforceAbusePolicy({ endpoint: "signup", request: request(), accountIdentifier: "User@Example.com", store, now })).allowed, true);
  assert.equal((await enforceAbusePolicy({ endpoint: "signup", request: request(), accountIdentifier: "user@example.com", store, now })).allowed, false);
  assert.equal((await enforceAbusePolicy({ endpoint: "signin", request: request(), accountIdentifier: "user@example.com", store, now })).allowed, true);
});

test("rate-limit keys are stable HMAC digests and contain no raw email or IP", () => {
  const email = "private@example.com"; const ip = "203.0.113.8"; const first = derivePrivateRateLimitKey("signin:account:v1", email, "secret");
  assert.equal(first.length, 64); assert.equal(first, derivePrivateRateLimitKey("signin:account:v1", email, "secret")); assert.notEqual(first, derivePrivateRateLimitKey("signin:account:v1", email, "other-secret")); assert.doesNotMatch(first, new RegExp(`${email}|${ip}`));
});

test("production identity trusts Vercel-normalized metadata and refuses an untrusted deployment fallback", () => {
  const originalNodeEnv = process.env.NODE_ENV; const originalVercel = process.env.VERCEL;
  try { Reflect.set(process.env, "NODE_ENV", "production"); process.env.VERCEL = "1"; assert.equal(trustedClientIdentity(new Request("https://example.test", { headers: { "x-vercel-forwarded-for": "198.51.100.4", "x-forwarded-for": "spoofed" } })), "198.51.100.4"); delete process.env.VERCEL; assert.throws(() => trustedClientIdentity(request()), /trusted Vercel/); }
  finally { if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", originalNodeEnv); if (originalVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = originalVercel; }
});

test("production requires a server secret while tests have an explicit fallback", () => {
  const values = { nodeEnv: process.env.NODE_ENV, abuse: process.env.ABUSE_CONTROL_SECRET, auth: process.env.NEXTAUTH_SECRET };
  try { Reflect.set(process.env, "NODE_ENV", "production"); delete process.env.ABUSE_CONTROL_SECRET; delete process.env.NEXTAUTH_SECRET; assert.throws(() => abuseControlSecret(), /required/); Reflect.set(process.env, "NODE_ENV", "test"); assert.equal(abuseControlSecret(), "prepull-test-abuse-control-secret"); }
  finally { if (values.nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", values.nodeEnv); if (values.abuse === undefined) delete process.env.ABUSE_CONTROL_SECRET; else process.env.ABUSE_CONTROL_SECRET = values.abuse; if (values.auth === undefined) delete process.env.NEXTAUTH_SECRET; else process.env.NEXTAUTH_SECRET = values.auth; }
});
