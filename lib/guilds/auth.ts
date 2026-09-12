import { requireAuthenticatedUser } from "../auth.ts";
export type AuthenticatedUser = { id: string; displayName: string };
export async function requireUser(callbackUrl?: string): Promise<AuthenticatedUser> { return requireAuthenticatedUser(callbackUrl); }
export function requireGuildOwner(userId: string, ownerUserId: string) { if (userId !== ownerUserId) throw new Error("Only the guild owner can perform this action."); }
