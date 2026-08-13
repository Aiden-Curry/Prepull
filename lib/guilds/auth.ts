/** Development identity only. Replace this boundary with the real session provider before production guild data is enabled. */
export type AuthenticatedUser = { id: string; displayName: string };
export function requireUser(): AuthenticatedUser { if (process.env.NODE_ENV === "production") throw new Error("Guild workspace requires the production auth and persistence adapter."); return { id: process.env.PREPULL_DEV_USER_ID ?? "dev-user", displayName: "Development user" }; }
export function requireGuildOwner(userId: string, ownerUserId: string) { if (userId !== ownerUserId) throw new Error("Only the guild owner can perform this action."); }
