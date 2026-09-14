import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { hashAccountPassword, normalizeAccountEmail, validateSignupInput } from "../lib/accounts/signup.ts";

test("signup normalizes email and accepts a password-manager friendly password", () => {
  assert.equal(normalizeAccountEmail("  Player@Example.COM "), "player@example.com");
  const result = validateSignupInput({ email: "  Player@Example.COM ", password: "correct horse battery staple", confirmPassword: "correct horse battery staple" });
  assert.equal(result.ok, true); if (result.ok) assert.equal(result.value.email, "player@example.com");
});

test("signup rejects invalid email, short, oversized, and mismatched passwords", () => {
  assert.equal(validateSignupInput({ email: "not-email", password: "abcdefghijkl", confirmPassword: "abcdefghijkl" }).ok, false);
  assert.equal(validateSignupInput({ email: "a@example.com", password: "short", confirmPassword: "short" }).ok, false);
  assert.equal(validateSignupInput({ email: "a@example.com", password: "🔥".repeat(19), confirmPassword: "🔥".repeat(19) }).ok, false);
  assert.equal(validateSignupInput({ email: "a@example.com", password: "abcdefghijkl", confirmPassword: "abcdefghijkm" }).ok, false);
});

test("signup hashing uses bcrypt and never returns plaintext", async () => {
  const password = "correct horse battery staple"; const hash = await hashAccountPassword(password);
  assert.notEqual(hash, password); assert.match(hash, /^\$2[aby]\$/); assert.equal(await bcrypt.compare(password, hash), true);
});
