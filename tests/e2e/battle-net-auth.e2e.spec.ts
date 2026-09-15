import { expect, test } from "@playwright/test";
import { Client } from "pg";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./helpers";

const dbUrl = process.env.E2E_DATABASE_URL;
async function cleanupDefaultConnection() {
  if (!dbUrl) throw new Error("E2E_DATABASE_URL is required for Battle.net acceptance isolation.");
  const client = new Client({ connectionString: dbUrl }); await client.connect();
  try { await client.query("DELETE FROM users WHERE id IN (SELECT user_id FROM battle_net_connections WHERE provider_region='eu' AND provider_subject='mock-subject-default' AND users.email IS NULL)"); await client.query("DELETE FROM battle_net_connections WHERE provider_region='eu' AND provider_subject='mock-subject-default'"); }
  finally { await client.end(); }
}

async function connectedEmail() { const client = new Client({ connectionString: dbUrl }); await client.connect(); try { return (await client.query("SELECT users.email FROM battle_net_connections connections JOIN users ON users.id=connections.user_id WHERE connections.provider_region='eu' AND connections.provider_subject='mock-subject-default'")).rows[0]?.email as string | null | undefined; } finally { await client.end(); } }
async function defaultIdentityCounts() { const client = new Client({ connectionString: dbUrl }); await client.connect(); try { const row = (await client.query("SELECT count(DISTINCT connections.user_id)::int AS users,count(*)::int AS connections FROM battle_net_connections connections WHERE connections.provider_region='eu' AND connections.provider_subject='mock-subject-default'")).rows[0]; return { users: Number(row.users), connections: Number(row.connections) }; } finally { await client.end(); } }

test.beforeEach(async () => cleanupDefaultConnection());
test.afterEach(async () => cleanupDefaultConnection());

test("Battle.net login discovers, bulk imports with partial success, and reaches dashboard", async ({ page }) => {
  await page.goto("/auth/signin?callbackUrl=%2Fera%2Fdashboard");
  await expect(page.getByRole("group", { name: "Where do you play?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue with Battle.net" }).click();
  await expect(page.getByRole("heading", { name: "Mock Battle.net authorization" })).toBeVisible();
  await page.getByRole("link", { name: "Authorize" }).click();
  await expect(page.getByRole("heading", { name: "Battle.net connected" })).toBeVisible();
  await expect(page.getByText("We found 4 characters.")).toBeVisible();
  await expect(page.getByText("TBC Anniversary")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.keyboard.press("Tab"); await expect(page.locator(":focus")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze(); expect(accessibility.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  await page.getByRole("button", { name: "Add 3 characters" }).click();
  await expect(page.getByRole("status")).toContainText("2 imported · 0 already added · 1 failed");
  await expect(page.getByRole("button", { name: "Retry failed character" })).toBeVisible();
  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await expect(page).toHaveURL(/\/era\/dashboard/);
  await expect(page.getByText("Aidy", { exact: true }).first()).toBeVisible();
});

test("Battle.net cancellation is safe and creates no account", async ({ page }) => {
  await page.goto("/auth/signin?callbackUrl=%2Ftbc%2Fcalendar");
  await page.getByRole("radio", { name: "Europe" }).check();
  await page.getByRole("button", { name: "Continue with Battle.net" }).click();
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("status")).toContainText("authorization was cancelled");
  await expect(page.locator('[data-content-version="tbc"]')).toBeVisible();
});

test("an email user can link Battle.net and another user cannot steal that identity", async ({ page }) => {
  await signIn(page); await page.goto("/era/profile");
  await page.getByRole("button", { name: "Connect Battle.net" }).click(); await page.getByRole("link", { name: "Authorize" }).click();
  await expect(page.getByRole("heading", { name: "Battle.net connected" })).toBeVisible(); expect(await connectedEmail()).toBe("e2e-owner@prepull.test");
  await page.getByRole("button", { name: "Sign out" }).click(); await signIn(page, "e2e-member-a@prepull.test"); await page.goto("/era/profile");
  await page.getByRole("button", { name: "Connect Battle.net" }).click(); await page.getByRole("link", { name: "Authorize" }).click();
  await expect(page.getByRole("status")).toContainText("already connected to another PrePull account"); expect(await connectedEmail()).toBe("e2e-owner@prepull.test");
});

test("returning Battle.net login reuses its user and preserves TBC content context", async ({ page }) => {
  await page.goto("/auth/signin?callbackUrl=%2Fera%2Fdashboard"); await page.getByRole("button", { name: "Continue with Battle.net" }).click(); await page.getByRole("link", { name: "Authorize" }).click();
  await expect(page.getByRole("heading", { name: "Battle.net connected" })).toBeVisible(); expect(await defaultIdentityCounts()).toEqual({ users: 1, connections: 1 });
  await page.getByRole("link", { name: "Go to dashboard" }).click(); await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/auth/signin?callbackUrl=%2Ftbc%2Fcalendar"); await page.getByRole("button", { name: "Continue with Battle.net" }).click(); await page.getByRole("link", { name: "Authorize" }).click();
  await expect(page.locator('[data-content-version="tbc"]')).toBeVisible(); await expect(page.getByRole("heading", { name: "Battle.net connected" })).toBeVisible(); await expect(page.getByRole("heading", { name: "Supported Era characters" })).toBeVisible();
  expect(await defaultIdentityCounts()).toEqual({ users: 1, connections: 1 });
});
