import assert from "node:assert/strict";
import test from "node:test";
import {
  authSignInHref,
  authSignUpHref,
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

test("signup and sign-in links preserve only safe versioned callbacks", () => {
  assert.equal(authSignUpHref("/tbc/characters/connect?region=eu"), "/auth/signup?callbackUrl=%2Ftbc%2Fcharacters%2Fconnect%3Fregion%3Deu");
  assert.equal(authSignInHref("https://evil.example"), "/auth/signin?callbackUrl=%2Fera%2Fguilds");
});

test("protected route callbacks serialize query values deterministically", () => {
  assert.equal(
    protectedRouteCallback("tbc", "/profile", { foo: "bar", filter: ["one", "two"], empty: undefined }),
    "/tbc/profile?foo=bar&filter=one&filter=two",
  );
});
