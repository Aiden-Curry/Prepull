import { expect, test } from "@playwright/test";
import { base, id } from "./helpers";

async function submitCredentials(page: import("@playwright/test").Page, password = base.password) {
  await page.getByLabel("Email").fill(base.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
}

test("signed-out TBC profile preserves callback, query, failed login, and navigation version", async ({ page }) => {
  await page.goto("/tbc/profile?foo=bar");
  await expect(page).toHaveURL(/\/auth\/signin/);
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/tbc/profile?foo=bar");

  await submitCredentials(page, "incorrect-password");
  await expect(page.getByText("Sign-in failed. Check your credentials.")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/tbc/profile?foo=bar");

  await page.getByLabel("Password").fill(base.password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/tbc\/profile\?foo=bar$/);
  await expect(page.locator("[data-content-version='tbc']")).toBeVisible();
  await page.waitForLoadState("networkidle");

  for (const destination of ["Guilds", "Coverage", "Dashboard"]) {
    const expectedPath = `/tbc/${destination.toLowerCase()}`;
    const link = page.getByRole("link", { name: destination });
    await expect(link).toHaveAttribute("href", expectedPath);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
  }
});

test("signed-out Era profile returns to the Era profile", async ({ page }) => {
  await page.goto("/era/profile");
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/era/profile");
  await submitCredentials(page);
  await expect(page).toHaveURL(/\/era\/profile$/);
  await expect(page.locator("[data-content-version='era']")).toBeVisible();
});

test("signed-out nested TBC guild route returns to the exact protected destination", async ({ page }) => {
  const callback = `/tbc/guilds/${id("E2E_GUILD_A_ID")}/raids/${id("E2E_RAID_A_ID")}/prep`;
  await page.goto(callback);
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(callback);
  await submitCredentials(page);
  await expect(page).toHaveURL(new RegExp(`${callback}$`));
  await expect(page.locator("[data-content-version='tbc']")).toBeVisible();
});
