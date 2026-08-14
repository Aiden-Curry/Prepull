import { test, expect } from "@playwright/test";
import inventory from "../../data/acceptance/guild-action-inventory.json";

test.skip(!process.env.E2E_ACTION_HARNESS, "Requires the explicitly enabled acceptance action harness.");

test("every enabled harness route renders exactly one matching form", async ({ page }) => {
  for (const { name } of inventory.actions) {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    const response = await page.goto(`/acceptance/actions/${name}`);
    expect(response?.status(), name).toBe(200);
    await expect(page).toHaveTitle(/PrePull/);
    await expect(page.locator("h1")).toHaveText("Server Action acceptance harness");
    await expect(page.locator("form[data-testid='server-action-form']")).toHaveCount(1);
    await expect(page.locator(`form[data-action='${name}']`)).toHaveCount(1);
    await expect(page.locator(`form[data-action='${name}'] button[type='submit']`)).toHaveCount(1);
    expect(consoleErrors, name).toEqual([]);
  }
});

test("unknown harness action is not found", async ({ request }) => {
  const response = await request.get("/acceptance/actions/not-a-real-action");
  expect(response.status()).toBe(404);
});
