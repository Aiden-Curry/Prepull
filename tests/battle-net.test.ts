import assert from "node:assert/strict";
import test from "node:test";
import { BATTLE_NET_OAUTH_SCOPES } from "../lib/battle-net/config.ts";
import { LiveBattleNetOAuthClient, MockBattleNetOAuthClient, normalizeAccountProfile } from "../lib/battle-net/client.ts";
import { browserBindingHash, opaqueTokenHash, randomOpaqueToken } from "../lib/battle-net/security.ts";

test("Battle.net OAuth requests only identity and account-profile scopes", () => {
  const previousId = process.env.BATTLENET_CLIENT_ID; const previousSecret = process.env.BATTLENET_CLIENT_SECRET; process.env.BATTLENET_CLIENT_ID = "client"; process.env.BATTLENET_CLIENT_SECRET = "secret";
  try { const url = new URL(new LiveBattleNetOAuthClient().authorizationUrl({ region: "eu", state: "one-time", redirectUri: "https://example.test/api/auth/battlenet/callback" })); assert.equal(url.origin, "https://oauth.battle.net"); assert.deepEqual(url.searchParams.get("scope")?.split(" "), [...BATTLE_NET_OAUTH_SCOPES]); assert.equal(url.searchParams.get("response_type"), "code"); assert.equal(url.searchParams.get("state"), "one-time"); }
  finally { if (previousId === undefined) delete process.env.BATTLENET_CLIENT_ID; else process.env.BATTLENET_CLIENT_ID = previousId; if (previousSecret === undefined) delete process.env.BATTLENET_CLIENT_SECRET; else process.env.BATTLENET_CLIENT_SECRET = previousSecret; }
});

test("account profile normalization allowlists, deduplicates, and preserves Era ecosystem", () => {
  const characters = normalizeAccountProfile({ wow_accounts: [{ characters: [{ id: 1, name: "Aidy", realm: { name: "Firemaw", slug: "firemaw" } }, { id: 1, name: "Aidy", realm: { name: "Firemaw", slug: "firemaw" } }, { name: "../bad", realm: { name: "Firemaw" } }] }] }, "eu");
  assert.equal(characters.length, 1); assert.equal(characters[0].realmType, "era"); assert.equal(characters[0].contentSupport, "supported"); assert.equal(characters[0].region, "eu");
});

test("opaque state and browser binding are random, hashed, and partitioned", () => {
  const prior = process.env.BATTLE_NET_STATE_SECRET; process.env.BATTLE_NET_STATE_SECRET = "unit-test-state-secret-at-least-32-characters";
  try { const first = randomOpaqueToken(); const second = randomOpaqueToken(); assert.notEqual(first, second); assert.equal(opaqueTokenHash(first).length, 64); assert.notEqual(browserBindingHash(first), browserBindingHash(second)); assert.notEqual(browserBindingHash(first), opaqueTokenHash(first)); }
  finally { if (prior === undefined) delete process.env.BATTLE_NET_STATE_SECRET; else process.env.BATTLE_NET_STATE_SECRET = prior; }
});

test("mock OAuth represents unsupported Anniversary without Era fallback", async () => {
  const client = new MockBattleNetOAuthClient(); const token = await client.exchangeCode({ region: "us", code: "mock:default:us" }); const identity = await client.userInfo("us", token.accessToken); const characters = await client.discoverEraCharacters("us", token.accessToken);
  assert.equal(identity.subject, "mock-subject-default"); assert.ok(characters.some((item) => item.realmType === "anniversary" && item.contentSupport === "unsupported"));
});


test("global OAuth endpoints preserve exact callback for both regions", async () => {
  const previousId = process.env.BATTLENET_CLIENT_ID, previousSecret = process.env.BATTLENET_CLIENT_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.BATTLENET_CLIENT_ID = "test-client"; process.env.BATTLENET_CLIENT_SECRET = "test-secret";
  const redirectUri = "https://prepull-staging-brown.vercel.app/api/auth/battlenet/callback";
  try {
    const client = new LiveBattleNetOAuthClient();
    for (const region of ["eu", "us"] as const) {
      const url = new URL(client.authorizationUrl({ region, state: "test-state", redirectUri }));
      assert.equal(url.origin + url.pathname, "https://oauth.battle.net/authorize");
      assert.deepEqual([...url.searchParams.keys()].sort(), ["client_id", "redirect_uri", "response_type", "scope", "state"]);
      assert.equal(url.searchParams.get("redirect_uri"), redirectUri);
      assert.equal(url.searchParams.get("client_id"), process.env.BATTLENET_CLIENT_ID);
      globalThis.fetch = async (input, init) => {
        assert.equal(input, "https://oauth.battle.net/token");
        const body = new URLSearchParams(String(init?.body));
        assert.equal(body.get("redirect_uri"), redirectUri);
        assert.equal(body.get("grant_type"), "authorization_code");
        return Response.json({ access_token: "test-token", expires_in: 300 });
      };
      await client.exchangeCode({ region, code: "test-code", redirectUri });
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (previousId === undefined) delete process.env.BATTLENET_CLIENT_ID; else process.env.BATTLENET_CLIENT_ID = previousId;
    if (previousSecret === undefined) delete process.env.BATTLENET_CLIENT_SECRET; else process.env.BATTLENET_CLIENT_SECRET = previousSecret;
  }
});
