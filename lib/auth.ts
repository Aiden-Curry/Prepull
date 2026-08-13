import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./guilds/db.ts";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required in production.");

export const authOptions: NextAuthOptions = { session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, secret: process.env.NEXTAUTH_SECRET, providers: [CredentialsProvider({ name: "PrePull", credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } }, async authorize(credentials) { if (!credentials?.email || !credentials.password || !process.env.DATABASE_URL) return null; const result = await query<{ id: string; email: string; name: string; password_hash: string }>("SELECT id,email,name,password_hash FROM users WHERE email=$1 AND active=true", [credentials.email]); const user = result.rows[0]; if (!user || !(await bcrypt.compare(credentials.password, user.password_hash))) return null; return { id: user.id, email: user.email, name: user.name }; } })], callbacks: { async jwt({ token, user }) { if (user?.id) token.userId = user.id; return token; }, async session({ session, token }) { if (session.user && token.userId) session.user.id = String(token.userId); return session; } } };
export async function requireAuthenticatedUser() { const { getServerSession } = await import("next-auth"); const session = await getServerSession(authOptions); if (!session?.user?.id) throw new Error("Authentication is required."); return { id: session.user.id, displayName: session.user.name ?? session.user.email ?? "PrePull user" }; }
