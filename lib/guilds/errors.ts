export type GuildErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CROSS_GUILD_REFERENCE" | "DUPLICATE" | "INVALID_IMPORT" | "CONFLICT" | "UNAVAILABLE";
export class GuildDomainError extends Error { readonly code: GuildErrorCode; constructor(code: GuildErrorCode, message: string) { super(message); this.code = code; this.name = "GuildDomainError"; } }
