export type GuildErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CROSS_GUILD_REFERENCE" | "DUPLICATE" | "INVALID_IMPORT" | "CONFLICT" | "UNAVAILABLE";
export class GuildDomainError extends Error { constructor(public readonly code: GuildErrorCode, message: string) { super(message); this.name = "GuildDomainError"; } }
