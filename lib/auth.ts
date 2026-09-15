import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./guilds/db.ts";
import { redirect } from "next/navigation";
import { authSignInHref, DEFAULT_AUTH_CALLBACK, sanitizeAuthCallback } from "./auth-callback.ts";
import { BATTLE_NET_COOKIES } from "./battle-net/config.ts";
import { battleNetRepository } from "./battle-net/repository.ts";
import { opaqueTokenHash } from "./battle-net/security.ts";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required in production.");

function cookieValue(cookieHeader: string | undefined, name: string) { for (const item of cookieHeader?.split(";") ?? []) { const [key, ...parts] = item.trim().split("="); if (key === name) return decodeURIComponent(parts.join("=")); } return undefined; }

export const authOptions: NextAuthOptions = { session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, secret: process.env.NEXTAUTH_SECRET, providers: [CredentialsProvider({ name: "PrePull", credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, battleNetGrant: { label: "Battle.net grant", type: "hidden" } }, async authorize(credentials, request) {
  if (credentials?.battleNetGrant === "1") { const grant = cookieValue(request.headers?.cookie, BATTLE_NET_COOKIES.loginGrant); if (!grant) return null; const user = await battleNetRepository.consumeLoginGrant(opaqueTokenHash(grant)); return user ? { id: user.id, email: user.email, name: user.name } : null; }
  if (!credentials?.email || !credentials.password || !process.env.DATABASE_URL) return null; const email = credentials.email.trim().toLowerCase(); const result = await query<{ id: string; email: string; name: string; password_hash: string | null }>("SELECT id,email,name,password_hash FROM users WHERE lower(email)=$1 AND active=true", [email]); const user = result.rows[0]; if (!user?.password_hash || !(await bcrypt.compare(credentials.password, user.password_hash))) return null; return { id: user.id, email: user.email, name: user.name };
} })], callbacks: { async jwt({ token, user }) { if (user?.id) token.userId = user.id; return token; }, async session({ session, token }) { if (session.user && token.userId) session.user.id = String(token.userId); return session; } } };
export async function requireAuthenticatedUser(callbackUrl = DEFAULT_AUTH_CALLBACK) { const { getServerSession } = await import("next-auth"); const session = await getServerSession(authOptions); if (!session?.user?.id) redirect(authSignInHref(sanitizeAuthCallback(callbackUrl))); return { id: session.user.id, displayName: session.user.name ?? session.user.email ?? "PrePull user" }; }
