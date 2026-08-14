import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test("HTTPS production proxy sets secure HttpOnly session and sign-out removes access", async ({ page }) => {
  test.skip(process.env.E2E_HTTPS !== "true", "Runs only through the local HTTPS proxy.");
  await signIn(page);
  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name.includes("next-auth.session-token"));
  expect(session).toBeDefined();
  expect(session?.secure).toBeTruthy();
  expect(session?.httpOnly).toBeTruthy();
  expect(["Lax", "Strict", "None"]).toContain(session?.sameSite);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/auth\/signin/);
  await page.goto("/era/guilds");
  await expect(page).toHaveURL(/\/auth\/signin/);
});
