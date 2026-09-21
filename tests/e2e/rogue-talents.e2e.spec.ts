import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [1440, 390]) test(`Combat build switching, trees and details at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/era/guides/classes/rogue/combat");
  const tree = page.locator("[data-guide-talent-build]");
  for (const [id, allocation, talent, rank] of [
    ["era-combat-swords", "19/32/0", "swordSpecialization", "5"],
    ["era-combat-daggers", "15/31/5", "daggerSpecialization", "5"],
    ["era-combat-swords", "19/32/0", "swordSpecialization", "5"],
  ]) {
    await page.getByLabel("Guide build", { exact: true }).selectOption(id);
    await expect(tree).toHaveAttribute("data-guide-talent-build", id);
    await expect(tree).toContainText("not your character's current talents");
    await expect(tree.locator("[data-talent-allocation]")).toContainText(`${allocation} · 51 points`);
    await expect(tree.locator(`[data-talent-id="${talent}"]`)).toHaveAttribute("data-rank", rank);
    await expect(tree.locator(`[data-talent-id="${talent === "swordSpecialization" ? "daggerSpecialization" : "swordSpecialization"}"]`)).toHaveAttribute("data-rank", "0");
    for (const name of ["assassination", "combat", "subtlety"]) {
      if (width === 390) await page.getByLabel("Talent tree", { exact: true }).selectOption(name);
      await expect(tree.locator(`[data-talent-tree="${name}"]`)).toBeVisible();
    }
    if (width === 1440) {
      const ys = await tree.locator("[data-talent-tree]").evaluateAll(es => es.map(e => e.getBoundingClientRect().y));
      expect(new Set(ys).size).toBe(1);
    } else await page.getByLabel("Talent tree", { exact: true }).selectOption("combat");
    const node = tree.locator(`[data-talent-id="${talent}"]`);
    if (width === 1440) { await node.focus(); await page.keyboard.press("Enter"); } else await node.click();
    await expect(tree.locator("[aria-live]")).toContainText("Selected in this guide build");
    await expect(tree.locator("[aria-live] a")).toHaveAttribute("href", /wowhead.com\/classic\/spell=/);
    expect((await node.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
  }
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
});
