import assert from "node:assert/strict";
import test from "node:test";
import {
  authSignInHref,
  DEFAULT_AUTH_CALLBACK,
  protectedRouteCallback,
  sanitizeAuthCallback,
} from "../lib/auth-callback.ts";

test("auth callbacks preserve safe versioned internal paths", () => {
  assert.equal(sanitizeAuthCallback("/tbc/profile?view=summary#details"), "/tbc/profile?view=summary#details");
  assert.equal(sanitizeAuthCallback("/era/guilds/example/raids/example/prep"), "/era/guilds/example/raids/example/prep");
  assert.equal(decodeURIComponent(authSignInHref("/tbc/profile?foo=bar")), "/auth/signin?callbackUrl=/tbc/profile?foo=bar");
});

test("auth callbacks reject external and executable destinations", () => {
  for (const value of ["https://example.com", "//example.com/path", "javascript:alert(1)", "data:text/html,test", "/\\example.com", "/profile"]) {
    assert.equal(sanitizeAuthCallback(value), DEFAULT_AUTH_CALLBACK, value);
  }
});

test("protected route callbacks serialize query values deterministically", () => {
  assert.equal(
    protectedRouteCallback("tbc", "/profile", { foo: "bar", filter: ["one", "two"], empty: undefined }),
    "/tbc/profile?foo=bar&filter=one&filter=two",
  );
});
