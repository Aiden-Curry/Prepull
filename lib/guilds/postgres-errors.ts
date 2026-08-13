import { GuildDomainError } from "./errors.ts";

type PgFailure = { code?: string; constraint?: string };

export function mapPostgresError(error: unknown): GuildDomainError {
  if (error instanceof GuildDomainError) return error;
  const candidate = error as PgFailure;
  const constraint = candidate.constraint ?? "";
  if (candidate.code === "23505") {
    if (constraint.includes("owner") || constraint.includes("membership_owner")) return new GuildDomainError("CONFLICT", "The guild must have only one active owner.");
    if (constraint.includes("signup")) return new GuildDomainError("DUPLICATE", "A signup already exists for this raid character.");
    if (constraint.includes("claim")) return new GuildDomainError("DUPLICATE", "This character already has an active claim.");
    if (constraint.includes("guild_members")) return new GuildDomainError("DUPLICATE", "That character is already in this guild.");
    return new GuildDomainError("DUPLICATE", "The requested record already exists.");
  }
  if (candidate.code === "23503") return new GuildDomainError("CROSS_GUILD_REFERENCE", "The referenced guild record does not belong to this operation.");
  if (candidate.code === "23514") {
    if (constraint.includes("owner")) return new GuildDomainError("CONFLICT", "The guild must retain exactly one active owner.");
    return new GuildDomainError("CONFLICT", "The requested guild change violates a data rule.");
  }
  if (candidate.code === "23502") return new GuildDomainError("CONFLICT", "A required guild value is missing.");
  if (candidate.code === "40001" || candidate.code === "40P01") return new GuildDomainError("CONFLICT", "The operation conflicted with another update. Reload and try again.");
  if (candidate.code === "57P01" || candidate.code === "08000" || candidate.code === "08003" || candidate.code === "08006" || candidate.code === "53300") return new GuildDomainError("UNAVAILABLE", "Guild storage is temporarily unavailable.");
  if (constraint.includes("main_alt")) return new GuildDomainError("INVALID_RELATIONSHIP", "That main/alt relationship is invalid.");
  return new GuildDomainError("UNAVAILABLE", "Guild storage could not complete the operation.");
}
