import { WCL_SITES } from "../lib/warcraft-logs/context.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { WclTransport, WclTransportError, WCL_TOKEN_ENDPOINT } from "../lib/warcraft-logs/transport.ts";

const credentials = () => ({ clientId: "test-client", clientSecret: "test-secret" });
const tokenResponse = () => Response.json({ access_token: "test-token", expires_in: 100, token_type: "Bearer" });
const graphResponse = () => Response.json({ data: { characterData: { character: null } } });

test("WCL uses fixed public endpoints, Basic client credentials and a memory-only deduplicated token", async () => {
  let now = 0, tokens = 0, graphs = 0;
  const client = new WclTransport({ credentials, now: () => now, fetch: async (input, init) => {
    assert.equal(init?.redirect, "error"); assert.equal(init?.cache, "no-store");
    if (input === WCL_TOKEN_ENDPOINT) {
      tokens++;
      assert.equal(init?.headers && new Headers(init.headers).get("authorization"), `Basic ${Buffer.from("test-client:test-secret").toString("base64")}`);
      assert.equal((init?.body as FormData).get("grant_type"), "client_credentials");
      await new Promise(resolve => setTimeout(resolve, 5));
      return tokenResponse();
    }
    assert.equal(input, WCL_SITES.vanilla.graphql); graphs++;
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-token");
    return graphResponse();
  } });
  const results = await Promise.all(Array.from({ length: 8 }, () => client.query("vanilla", "query { characterData { character(id: 1) { id } } }")));
  assert.equal(tokens, 1); assert.equal(graphs, 8);
  assert.doesNotMatch(JSON.stringify({ client, results }), /test-token|test-secret|test-client/);
  now = 89_999; await client.query("vanilla", "query { __typename }"); assert.equal(tokens, 1);
  now = 90_000; await client.query("vanilla", "query { __typename }"); assert.equal(tokens, 2);
  now = 200_000; await client.query("vanilla", "query { __typename }"); assert.equal(tokens, 3);
});

test("WCL missing credentials perform no HTTP requests", async () => {
  const client = new WclTransport({ credentials: () => undefined, fetch: async () => { assert.fail("Unexpected request"); } });
  await assert.rejects(client.query("vanilla", "query { __typename }"), (error: unknown) => error instanceof WclTransportError && error.kind === "configuration");
});

for (const [status, kind] of [[401, "authentication"], [403, "authentication"], [429, "rate-limit"], [500, "upstream"]] as const) {
  test(`WCL HTTP ${status} is sanitized and never retried inline`, async () => {
    let calls = 0;
    const client = new WclTransport({ credentials, fetch: async input => {
      calls++;
      return input === WCL_TOKEN_ENDPOINT ? tokenResponse() : new Response("sensitive upstream detail", { status, headers: { "retry-after": "99999" } });
    } });
    await assert.rejects(client.query("vanilla", "query { __typename }"), (error: unknown) => {
      assert.ok(error instanceof WclTransportError); assert.equal(error.kind, kind);
      assert.doesNotMatch(String(error), /sensitive/);
      if (status === 429) assert.equal(error.retryAfterSeconds, 300);
      return true;
    });
    assert.equal(calls, 2);
  });
}

test("WCL partial GraphQL data survives while messages and extensions are stripped", async () => {
  const client = new WclTransport({ credentials, fetch: async input => input === WCL_TOKEN_ENDPOINT ? tokenResponse() : Response.json({
    data: { characterData: { character: { successfulRaid: {}, failedRaid: null } } },
    errors: [{ message: "sensitive detail", extensions: { token: "secret" }, path: ["characterData", "character", "failedRaid"] }],
  }) });
  const result = await client.query("vanilla", "query { __typename }");
  assert.ok(result.data); assert.deepEqual(result.errors, [{ path: ["characterData", "character", "failedRaid"], message: "GraphQL request failed (unrecognized upstream details withheld)." }]);
  assert.doesNotMatch(JSON.stringify(result), /sensitive|secret|extensions/);
});

test("WCL GraphQL errors without data retain an explicit root failure", async () => {
  const client = new WclTransport({ credentials, fetch: async input => input === WCL_TOKEN_ENDPOINT ? tokenResponse() : Response.json({ errors: [{ message: "private" }] }) });
  assert.deepEqual(await client.query("vanilla", "query { __typename }"), { data: null, errors: [{ path: [], message: "GraphQL request failed (unrecognized upstream details withheld)." }], httpStatus: 200, operationName: "AnonymousQuery" });
});

test("WCL diagnostics retain operation, status and safe schema messages, never credential values", async () => {
  const client = new WclTransport({ credentials, fetch: async input => input === WCL_TOKEN_ENDPOINT ? tokenResponse() : Response.json({ errors: [
    { message: 'Cannot query field "badField" on type "Character". Extra private detail.', path: ["characterData"] },
    { message: 'Cannot query field "test-secret" on type "Character".', path: ["test-token"] },
  ] }) });
  const result = await client.query("fresh", "query DiagnosticAudit { __typename }");
  assert.equal(result.operationName, "DiagnosticAudit"); assert.equal(result.httpStatus, 200);
  assert.equal(result.errors[0].message, 'Cannot query field "badField" on type "Character".');
  assert.deepEqual(result.errors[1].path, []);
  assert.doesNotMatch(JSON.stringify(result), /test-secret|test-token|private detail/);
});
test("WCL transport requires an explicit allowed site and routes Fresh separately", async () => {
  const endpoints: string[] = [];
  const client = new WclTransport({ credentials, fetch: async input => { endpoints.push(String(input)); return input === WCL_TOKEN_ENDPOINT ? tokenResponse() : graphResponse(); } });
  await client.query("vanilla", "query { __typename }"); await client.query("fresh", "query { __typename }");
  assert.deepEqual(endpoints, [WCL_TOKEN_ENDPOINT, WCL_SITES.vanilla.graphql, WCL_SITES.fresh.graphql]);
  await assert.rejects(client.query("classic" as "vanilla", "query { __typename }"), (error: unknown) => error instanceof WclTransportError && error.kind === "configuration");
  assert.equal(endpoints.length, 3);
});

test("WCL malformed responses are rejected without exposing response bodies", async () => {
  for (const value of ["not json", "{}", "null", '{"data":[]}', '{"errors":[null]}']) {
    const client = new WclTransport({ credentials, fetch: async input => input === WCL_TOKEN_ENDPOINT ? tokenResponse() : new Response(value) });
    await assert.rejects(client.query("vanilla", "query { __typename }"), (error: unknown) => error instanceof WclTransportError && error.kind === "invalid-response");
  }
});

test("WCL timeout aborts requests and discards raw network errors", async () => {
  const client = new WclTransport({ credentials, timeoutMs: 5, fetch: async (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new Error("sensitive network detail")), { once: true });
  }) });
  await assert.rejects(client.query("vanilla", "query { __typename }"), (error: unknown) => error instanceof WclTransportError && error.kind === "timeout" && !String(error).includes("sensitive"));
});

test("WCL token failures release in-flight acquisition for a later request", async () => {
  let attempts = 0;
  const client = new WclTransport({ credentials, fetch: async input => {
    if (input !== WCL_TOKEN_ENDPOINT) return graphResponse();
    return ++attempts === 1 ? Response.json({ access_token: "bad", expires_in: -1 }) : tokenResponse();
  } });
  await assert.rejects(client.query("vanilla", "query { __typename }"));
  await client.query("vanilla", "query { __typename }"); assert.equal(attempts, 2);
});

test("WCL rejected bearer token is invalidated without an immediate retry", async () => {
  let tokens = 0, graphs = 0;
  const client = new WclTransport({ credentials, fetch: async input => {
    if (input === WCL_TOKEN_ENDPOINT) { tokens++; return tokenResponse(); }
    return ++graphs === 1 ? new Response(null, { status: 401 }) : graphResponse();
  } });
  await assert.rejects(client.query("vanilla", "query { __typename }"));
  assert.equal(tokens, 1); assert.equal(graphs, 1);
  await client.query("vanilla", "query { __typename }"); assert.equal(tokens, 2); assert.equal(graphs, 2);
});
