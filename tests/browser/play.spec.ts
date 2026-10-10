import { expect, test } from "@playwright/test";
test("play, switch, pause, crash, retry and persist settings", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "TAP TO PLAY" })).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-menu.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await page.getByRole("button", { name: /REDUCED MOTION/ }).click();
  await page.getByRole("button", { name: "TAP TO PLAY" }).click();
  await expect(page.locator("#hud")).toBeVisible();
  if (info.project.name === "mobile")
    await page.locator("canvas").tap({ position: { x: 120, y: 260 } });
  else await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Pause game" }).click();
  const score = await page.locator("#score").textContent();
  await page.waitForTimeout(250);
  expect(await page.locator("#score").textContent()).toBe(score);
  await expect(page.getByRole("button", { name: "RESUME" })).toBeFocused();
  await page.getByRole("button", { name: "RESUME" }).click();
  // Lower lane avoids the first upper barrier and collects its shard.
  await expect(page.locator("#score")).not.toHaveText("0");
  await page.waitForTimeout(2400);
  await expect(page.locator("#over")).toBeHidden();
  await page.screenshot({
    path: `test-results/${info.project.name}-playing.png`,
    fullPage: true,
  });
  // Return to menu, then do not dodge: a real collision ends the run.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "MAIN MENU" }).first().click();
  for (let attempt = 0; attempt < 3; attempt++) {
    await page
      .getByRole("button", { name: attempt ? "PLAY AGAIN" : "TAP TO PLAY" })
      .click();
    await expect(page.locator("#over")).toBeVisible({ timeout: 6000 });
    expect(
      Number(
        (await page.locator("#final-score").textContent())?.replaceAll(",", ""),
      ),
    ).toBeGreaterThan(0);
  }
  await page.screenshot({
    path: `test-results/${info.project.name}-over.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unmute sound", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "REDUCED MOTION ON" }),
  ).toBeVisible();
  expect(
    Number(await page.locator("#menu-best").textContent()),
  ).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
test("keyboard repeat, focus loss, and arrow controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "TAP TO PLAY" }).click();
  await page.keyboard.down("Space");
  await page.waitForTimeout(180);
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await page.waitForTimeout(2600);
  await expect(page.locator("#over")).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator("#paused")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#paused")).toBeHidden();
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#over")).toBeHidden();
});
