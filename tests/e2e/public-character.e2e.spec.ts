import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { publicLookupCacheKey } from "../../lib/public-character/lookup";
import { normalizePublicLookup } from "../../lib/public-character/path";
import { base, deleteSyntheticAccount, resetPlayerState } from "./helpers";

const databaseUrl = () => process.env.E2E_DATABASE_URL ?? "postgres://prepull:prepull-test-only@localhost:5433/prepull_test";
async function database() { const client = new Client({ connectionString: databaseUrl() }); await client.connect(); return client; }
async function clearProtection(bucket: string) { const client = await database(); try { await client.query("DELETE FROM abuse_rate_limit_windows WHERE bucket=$1", [bucket]); } finally { await client.end(); } }
async function countOwnerCharacters() { const client = await database(); try { return Number((await client.query("SELECT count(*)::int AS count FROM user_characters characters JOIN users ON users.id=characters.user_id WHERE users.email=$1 AND characters.archived_at IS NULL", [base.email])).rows[0].count); } finally { await client.end(); } }
async function publicCacheRow(cacheKey: string) { const client = await database(); try { return (await client.query<{ status: string; updated_at: Date }>("SELECT status,updated_at FROM public_character_lookup_cache WHERE cache_key=$1", [cacheKey])).rows[0]; } finally { await client.end(); } }
async function clearPublicCache(cacheKey: string) { const client = await database(); try { await client.query("DELETE FROM public_character_lookup_cache WHERE cache_key=$1", [cacheKey]); } finally { await client.end(); } }

async function search(page: import("@playwright/test").Page, version: "era" | "tbc", realm: string, name: string, realmType: "era" | "anniversary" = version === "tbc" ? "anniversary" : "era") {
  await page.goto(`/${version}#character-search`);
  const finder = page.locator("#character-search"); await finder.getByRole("button", { name: realmType === "era" ? "ERA" : "ANNIVERSARY" }).click();
  await finder.getByLabel("Realm", { exact: true }).fill(realm); await finder.getByLabel("Character name").fill(name); await finder.getByRole("button", { name: "Find character" }).click();
  await page.waitForURL(new RegExp(`/${version}/characters/${realmType}/`));
}

test("anonymous Era lookup opens a safe shareable public character", async ({ browser, page }) => {
  const normalized = normalizePublicLookup({ contentVersion: "era", realmType: "era", region: "eu", realm: "Firemaw", characterName: "Aidy" });
  expect(normalized.ok).toBeTruthy(); if (!normalized.ok) return;
  const cacheKey = publicLookupCacheKey(normalized.lookup); await clearPublicCache(cacheKey);
  try {
    await search(page, "era", "Firemaw", "Aidy", "era");
    await expect(page).toHaveURL(/\/era\/characters\/era\/eu\/firemaw\/aidy$/); await expect(page.getByRole("heading", { name: "Aidy", level: 1 })).toBeVisible(); await expect(page.getByText("Level 60 Orc Warrior")).toBeVisible(); await expect(page.getByRole("heading", { name: "Save this character" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/e2e-owner@|user_characters|character_sync|readiness|session planner|provider-private-id/i);
    const firstCache = await publicCacheRow(cacheKey); expect(firstCache.status).toBe("found");
    const url = page.url(); const context = await browser.newContext(); const shared = await context.newPage(); await shared.goto(url); await expect(shared.getByRole("heading", { name: "Aidy", level: 1 })).toBeVisible(); await context.close();
    const secondCache = await publicCacheRow(cacheKey); expect(secondCache.updated_at.toISOString()).toBe(firstCache.updated_at.toISOString());
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  } finally { await clearPublicCache(cacheKey); }
});

test("anonymous TBC lookup preserves version and Anniversary stays truthfully unsupported", async ({ page }) => {
  await search(page, "tbc", "Firemaw", "Aidy", "era"); await expect(page).toHaveURL(/\/tbc\/characters\/era\/eu\/firemaw\/aidy$/); await expect(page.locator("[data-content-version='tbc']")).toBeVisible(); await expect(page.getByRole("heading", { name: "Save this character" })).toBeVisible();
  await search(page, "tbc", "Spineshatter", "Aidy", "anniversary"); await expect(page).toHaveURL(/\/tbc\/characters\/anniversary\/eu\/spineshatter\/aidy$/); await expect(page.getByText(/Live PrePull syncing is not currently available/)).toBeVisible(); await expect(page.getByRole("button", { name: "Add to my characters" })).toHaveCount(0);
});

test("signup from a result returns to the exact character and completes trusted initial sync", async ({ page }) => {
  const email = `${randomUUID()}@public-beta-e2e.prepull.test`; const password = "public beta test password";
  try { await search(page, "era", "Firemaw", "Aidy", "era"); const publicUrl = page.url(); await page.getByRole("main").getByRole("link", { name: "Create account" }).click(); await page.waitForURL(/\/auth\/signup\?/); expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(new URL(publicUrl).pathname); await page.getByLabel("Email").fill(email); await page.locator("#signup-password").fill(password); await page.getByLabel("Confirm password").fill(password); await page.getByRole("button", { name: "Create account" }).click(); await expect(page).toHaveURL(publicUrl); await page.getByRole("button", { name: "Add to my characters" }).click(); await page.waitForURL(/\/era\/dashboard$/); await expect(page.getByRole("heading", { name: "What should I do next?" })).toBeVisible(); }
  finally { await deleteSyntheticAccount(email); }
});

test("sign-in restores the exact public result and an already-saved lookup opens without duplication", async ({ page }) => {
  await resetPlayerState();
  try { await search(page, "era", "Firemaw", "Aidy", "era"); const publicUrl = page.url(); await page.getByRole("main").getByRole("link", { name: "Sign in" }).click(); await page.waitForURL(/\/auth\/signin\?/); expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(new URL(publicUrl).pathname); await page.getByLabel("Email").fill(base.email); await page.getByLabel("Password").fill(base.password); await page.getByRole("main").getByRole("button", { name: "Sign in" }).click(); await expect(page).toHaveURL(publicUrl); await page.getByRole("button", { name: "Add to my characters" }).click(); await page.waitForURL(/\/era\/dashboard$/); await page.goto(publicUrl); await expect(page.getByRole("link", { name: "Open my character" })).toBeVisible(); expect(await countOwnerCharacters()).toBe(1); }
  finally { await resetPlayerState(); }
});

test("not-found and temporary provider errors are distinct and safe", async ({ page }) => {
  await page.goto("/era/characters/era/eu/firemaw/notacharacter"); await expect(page.getByRole("heading", { name: "We couldn't find that character." })).toBeVisible();
  await page.goto("/era/characters/era/eu/firemaw/providerdown"); await expect(page.getByRole("heading", { name: "Battle.net is temporarily unavailable." })).toBeVisible(); await expect(page.locator("body")).not.toContainText("Synthetic provider internals");
});

test("public search and profile are mobile, keyboard, and axe safe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/era#character-search"); await page.getByLabel("Realm", { exact: true }).fill("Firemaw"); await page.getByLabel("Character name").fill("Aidy"); await page.getByRole("button", { name: "Find character" }).focus(); await expect(page.getByRole("button", { name: "Find character" })).toBeFocused(); await page.keyboard.press("Enter"); await expect(page.getByRole("heading", { name: "Aidy", level: 1 })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy(); const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter((entry) => entry.impact === "serious" || entry.impact === "critical"), JSON.stringify(axe.violations)).toEqual([]);
});

test("public API returns 429 before protected work at the lookup threshold", async ({ request }) => {
  await clearProtection("public_lookup:client:v1"); const url = "/api/public/characters?version=era&realmType=era&region=eu&realm=firemaw&name=aidy"; let response;
  try { for (let index = 0; index < 45; index += 1) { response = await request.get(url, { headers: { "x-prepull-e2e-bypass": "", "x-forwarded-for": "198.51.100.99" } }); if (response.status() === 429) break; } expect(response!.status()).toBe(429); expect(response!.headers()["retry-after"]).toMatch(/^\d+$/); expect(await response!.json()).toEqual({ message: "Too many character searches. Try again shortly." }); }
  finally { await clearProtection("public_lookup:client:v1"); }
});

test("signup and credentials sign-in endpoints enforce separate durable limits", async ({ request }) => {
  await clearProtection("signup:client:v1"); await clearProtection("signup:account:v1"); await clearProtection("signin:client:v1"); await clearProtection("signin:account:v1"); const headers = { "x-prepull-e2e-bypass": "", "x-forwarded-for": "198.51.100.100", origin: "http://127.0.0.1:3100" };
  try { let signup; for (let index = 0; index < 6; index += 1) signup = await request.post("/api/auth/signup", { headers, data: { email: "limited@example.test", password: "short", confirmPassword: "short" } }); expect(signup!.status()).toBe(429); let signin; for (let index = 0; index < 11; index += 1) signin = await request.post("/api/auth/callback/credentials", { headers, form: { email: "limited@example.test", password: "wrong" }, maxRedirects: 0 }); expect(signin!.status()).toBe(429); }
  finally { for (const bucket of ["signup:client:v1", "signup:account:v1", "signin:client:v1", "signin:account:v1"]) await clearProtection(bucket); }
});
