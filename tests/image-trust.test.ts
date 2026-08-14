import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedImageUrl } from "../lib/security/image-trust.ts";

test("image trust rejects arbitrary, local, data, and insecure URLs", () => {
  for (const value of [
    "https://evil.example/avatar.png",
    "http://static.prepull.app/avatar.png",
    "https://127.0.0.1/avatar.png",
    "https://169.254.169.254/latest/meta-data",
    "data:image/svg+xml,<svg/>",
    "file:///etc/passwd",
  ]) assert.equal(isTrustedImageUrl(value), false, value);
});

test("the reviewed HTTPS image origin is accepted", () => {
  assert.equal(isTrustedImageUrl("https://static.prepull.app/icons/warrior.png"), true);
  assert.equal(isTrustedImageUrl(undefined), false);
});
