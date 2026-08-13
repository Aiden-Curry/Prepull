import { GuildDomainError } from "./errors.ts";
export function assertVersion(expected: number, actual: number) { if (expected !== actual) throw new GuildDomainError("CONFLICT", `Stale update. Reload required; current version is ${actual}.`); }
