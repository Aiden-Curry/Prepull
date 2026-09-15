import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function opaqueTokenHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stateSecret() {
  const value = process.env.BATTLE_NET_STATE_SECRET || process.env.NEXTAUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "test") return "prepull-test-battle-net-state-secret";
  throw new Error("BATTLE_NET_STATE_SECRET or NEXTAUTH_SECRET is required.");
}

export function browserBindingHash(value: string, secret = stateSecret()) {
  return createHmac("sha256", secret).update(`battle-net-browser\0${value}`).digest("hex");
}

export function hashesEqual(left: string, right: string) {
  return left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
