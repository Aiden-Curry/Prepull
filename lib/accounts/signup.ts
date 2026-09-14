import bcrypt from "bcryptjs";
import { withTransaction } from "../guilds/db.ts";
import { GuildDomainError } from "../guilds/errors.ts";

export const MIN_ACCOUNT_PASSWORD_LENGTH = 12;
export const MAX_ACCOUNT_PASSWORD_BYTES = 72;

export type SignupInput = { email: string; password: string; confirmPassword: string };
export type SignupValidationError = { ok: false; code: "INVALID_EMAIL" | "PASSWORD_TOO_SHORT" | "PASSWORD_TOO_LONG" | "PASSWORD_MISMATCH"; field: "email" | "password" | "confirmPassword"; message: string };
export type ValidSignup = { ok: true; value: { email: string; password: string } };

export function normalizeAccountEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateSignupInput(input: SignupInput): ValidSignup | SignupValidationError {
  const email = normalizeAccountEmail(input.email);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, code: "INVALID_EMAIL", field: "email", message: "Enter a valid email address." };
  if (input.password.length < MIN_ACCOUNT_PASSWORD_LENGTH) return { ok: false, code: "PASSWORD_TOO_SHORT", field: "password", message: `Use at least ${MIN_ACCOUNT_PASSWORD_LENGTH} characters.` };
  if (Buffer.byteLength(input.password, "utf8") > MAX_ACCOUNT_PASSWORD_BYTES) return { ok: false, code: "PASSWORD_TOO_LONG", field: "password", message: "Use a password no longer than 72 bytes." };
  if (input.password !== input.confirmPassword) return { ok: false, code: "PASSWORD_MISMATCH", field: "confirmPassword", message: "Passwords do not match." };
  return { ok: true, value: { email, password: input.password } };
}

export function hashAccountPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function registerAccount(input: SignupInput) {
  const validation = validateSignupInput(input);
  if (!validation.ok) return validation;
  const passwordHash = await hashAccountPassword(validation.value.password);
  const account = await withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [validation.value.email]);
    const existing = await client.query("SELECT 1 FROM users WHERE lower(email)=$1 LIMIT 1", [validation.value.email]);
    if (existing.rowCount) throw new GuildDomainError("DUPLICATE", "An account with that email already exists.");
    const result = await client.query<{ id: string; email: string; name: string }>("INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id,email,name", [validation.value.email, passwordHash, "PrePull player"]);
    return result.rows[0];
  });
  return { ok: true as const, account };
}
