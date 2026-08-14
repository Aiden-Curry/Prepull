import { expect, type Page } from "@playwright/test";
export const base = { email: process.env.E2E_OWNER_EMAIL ?? "e2e-owner@prepull.test", password: process.env.E2E_PASSWORD ?? "e2e-only-password-not-production" };
export async function signIn(page: Page, email = base.email, password = base.password) { await page.goto("/auth/signin"); await page.getByLabel("Email").fill(email); await page.getByLabel("Password").fill(password); await page.getByRole("main").getByRole("button", { name: "Sign in" }).click(); await page.waitForURL(/\/era\/guilds/, { timeout: 10000 }); }
export async function attemptSignIn(page: Page, email: string, password: string) { await page.goto("/auth/signin"); await page.getByLabel("Email").fill(email); await page.getByLabel("Password").fill(password); await page.getByRole("main").getByRole("button", { name: "Sign in" }).click(); await page.waitForTimeout(500); }
export function id(name: string) { const value = process.env[name]; if (!value) throw new Error(`${name} is required for this acceptance test.`); return value; }
export async function expectSafeError(page: Page) { await expect(page.locator("body")).not.toContainText(/password_hash|NEXTAUTH_SECRET|DATABASE_URL|E2E_DATABASE_URL|stack trace|PostgreSQL|constraint|\b(?:SELECT|INSERT|UPDATE|DELETE)\s+(?:FROM|INTO|SET|WHERE)/i); }
export const syntheticCsv = {
  valid: "name,region,realm,class,level,faction,guildRank,mainName,preferredRole,notes\nE2E Character 1,eu,Firemaw,Warrior,60,Horde,Member,,DPS,\n",
  quotedComma: "name,region,realm,class,level,faction,guildRank,mainName,preferredRole,notes\n\"E2E, Quoted\",eu,Firemaw,Warrior,60,Horde,Member,,DPS,\n",
  utf8: "name,region,realm,class,level,faction,guildRank,mainName,preferredRole,notes\nE2E Åsa,eu,Firemaw,Warrior,60,Horde,Member,,DPS,\n",
  malformed: "name,region,realm\nmissing fields",
  duplicate: "name,region,realm,class,level,faction,guildRank,mainName,preferredRole,notes\nE2E Character 1,eu,Firemaw,Warrior,60,Horde,Member,,DPS,\nE2E Character 1,eu,Firemaw,Warrior,60,Horde,Member,,DPS,\n"
};
