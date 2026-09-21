import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const fury = "/era/guides/classes/warrior/fury";

test("Fury renders three desktop trees, verified ranks and prerequisite connectors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(fury);
  const tree = page.locator('[data-guide-talent-build]'); await expect(tree).toContainText("not your character's current talents");
  await expect(tree.locator('[data-talent-allocation]')).toHaveText("17/34/0 · 51 points");
  for (const name of ["arms", "fury", "protection"]) await expect(tree.locator(`[data-talent-tree="${name}"]`)).toBeVisible();
  const boxes = await tree.locator('[data-talent-tree]').evaluateAll(es => es.map(e => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y })));
  expect(new Set(boxes.map(b => b.y)).size).toBe(1); expect(boxes[0].x).toBeLessThan(boxes[1].x);
  await expect(tree.locator('[data-talent-id="cruelty"]')).toHaveAttribute('data-rank', '5');
  await expect(tree.locator('[data-talent-id="piercingHowl"]')).toHaveAttribute('data-selected', 'false');
  await expect(tree.locator('[data-prerequisite]')).toHaveCount(9);
  await expect(tree.locator('[data-prerequisite="enrage:flurry"]')).toHaveAttribute('data-selected', 'true');
  const impale = tree.locator('[data-talent-id="impale"]'); await impale.focus(); await page.keyboard.press('Enter');
  await expect(tree.locator('[aria-live]')).toContainText('Prerequisite: Deep Wounds at maximum rank.');
  await expect(tree.locator('[aria-live] a')).toHaveAttribute('href', 'https://www.wowhead.com/classic/spell=16494');
  await expect(page.locator('script[src="https://wow.zamimg.com/js/tooltips.js"]')).toHaveCount(1);
  const axe = await new AxeBuilder({page}).analyze(); expect(axe.violations.filter(v => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
});
test("390px tree navigation, tap details, blocked tooltips and accessibility", async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.route('https://wow.zamimg.com/**', route => route.abort()); await page.goto(fury);
  const tree = page.locator('[data-guide-talent-build]');
  for (const name of ['arms','fury','protection']) {
    await page.getByLabel('Talent tree', {exact:true}).selectOption(name);
    await expect(tree.locator(`[data-talent-tree="${name}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const node=tree.locator(`[data-talent-tree="${name}"] [data-talent-id]`).first(); await node.click(); await expect(tree.locator('[aria-live] a')).toBeVisible();
    expect((await node.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  }
  const axe=await new AxeBuilder({page}).analyze(); expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact??''))).toEqual([]);
});
test("guide talents never replace public Armory talents or convert other guides", async ({page}) => {
  await page.goto('/era/characters/era/eu/firemaw/aidy'); await expect(page.locator('#character-talents')).toBeVisible(); await expect(page.locator('[data-guide-talent-build]')).toHaveCount(0);
  for(const path of ['/era/guides/classes/mage/frost','/era/guides/classes/rogue/combat']) {await page.goto(path);await expect(page.locator('#talents')).toBeVisible();await expect(page.locator('[data-guide-talent-build]')).toHaveCount(0);}
});
