const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const {
  installAuthMock,
  enterWorkspace,
  USER_ONE,
} = require("./auth-mock.cjs");

(async () => {
  const { initialState, validateBackup } = await import("../src/model.js");
  const { LEGACY_GOAL_AREAS } = await import("../src/life-areas.js");
  const legacy = initialState();
  legacy.version = 1;
  delete legacy.lifeAreas;
  legacy.goals = legacy.goals.map(({ areaId, subAreaId, ...g }) => ({
    ...g,
    domain: LEGACY_GOAL_AREAS.indexOf(areaId),
  }));
  legacy.goals.find((g) => g.id === "g5").progress = 35;
  const key = "echostudy-v1:" + USER_ONE;
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.ECHO_BROWSER || undefined,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) =>
      r.abort(),
    );
    await installAuthMock(page);
    await page.addInitScript(
      ({ key, legacy }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(legacy));
      },
      { key, legacy },
    );
    await page.goto(process.env.ECHO_URL || "http://127.0.0.1:5180", {
      waitUntil: "domcontentloaded",
    });
    await enterWorkspace(page);
    await page.getByRole("button", { name: "Goals", exact: true }).click();
    await page.getByText("291 sub-areas", { exact: true }).waitFor();
    const state = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
    let saved = await state();
    assert.equal(saved.version, 2);
    assert.equal(saved.goals.find((g) => g.id === "g5").progress, 35);
    assert.equal(saved.goals.find((g) => g.id === "g5").parent, "g4");
    assert.equal(saved.lifeAreas.length, 16);
    assert.ok(validateBackup(saved));
    console.log(
      "PASS existing account automatically migrates without losing goal progress or hierarchy",
    );
    await page.getByRole("button", { name: /^Life areas / }).click();
    assert.equal(await page.locator(".life-area-card").count(), 16);
    await page.screenshot({
      path: "test-results/life-areas-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Add life area", exact: true })
      .click();
    await page
      .getByLabel("Life area name", { exact: true })
      .fill("Creative scholarship");
    await page
      .getByRole("button", { name: "Add sub-area", exact: true })
      .click();
    await page.getByLabel("Sub-area 1", { exact: true }).fill("Public writing");
    await page
      .getByRole("button", { name: "Add sub-area", exact: true })
      .click();
    await page
      .getByLabel("Sub-area 2", { exact: true })
      .fill("Research practice");
    await page
      .getByRole("button", { name: "Save life area", exact: true })
      .click();
    assert.equal(await page.locator(".life-area-card").count(), 17);
    const levels = ["Year", "Quarter", "Month", "Week", "Day"];
    for (let index = 0; index < levels.length; index++)
      for (let chain = 1; chain <= 2; chain++) {
        await page
          .getByRole("button", { name: "New goal", exact: true })
          .click();
        const dialog = page.getByRole("dialog");
        await dialog
          .getByLabel("What capacity or outcome are you building?", {
            exact: true,
          })
          .fill(`Writing ${levels[index]} ${chain}`);
        await dialog
          .getByLabel("Horizon", { exact: true })
          .selectOption(levels[index]);
        await dialog
          .getByLabel("Life area", { exact: true })
          .selectOption({ label: "Creative scholarship" });
        await dialog
          .getByLabel("Sub-area (optional)", { exact: true })
          .selectOption({ label: "Public writing" });
        if (index) {
          saved = await state();
          const parent = saved.goals.find(
            (g) => g.title === `Writing ${levels[index - 1]} ${chain}`,
          );
          await dialog
            .getByLabel("Larger goal this contributes to", { exact: true })
            .selectOption(parent.id);
          assert.ok(
            !(
              await dialog
                .getByLabel("Larger goal this contributes to")
                .innerText()
            ).includes("energy systems"),
          );
        }
        await dialog
          .getByRole("button", { name: "Save goal", exact: true })
          .click();
        await dialog.waitFor({ state: "hidden" });
      }
    saved = await state();
    const custom = saved.lifeAreas.find(
      (a) => a.name === "Creative scholarship",
    );
    assert.equal(saved.goals.filter((g) => g.areaId === custom.id).length, 10);
    assert.ok(validateBackup(saved));
    console.log(
      "PASS custom area, sub-areas, and two complete yearly-to-daily goal chains",
    );
    const card = page
      .locator(".life-area-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Creative scholarship",
          exact: true,
        }),
      });
    await card.getByRole("button", { name: "Edit area & sub-areas" }).click();
    await page
      .getByLabel("Life area name", { exact: true })
      .fill("Creative practice");
    await page.getByLabel("Sub-area 1", { exact: true }).fill("Public essays");
    assert.equal(
      await page
        .getByRole("button", { name: "Remove sub-area 1", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Save life area", exact: true })
      .click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Goals", exact: true }).click();
    await page
      .getByLabel("Filter by life area")
      .selectOption({ label: "Creative practice" });
    await page
      .getByLabel("Filter by sub-area")
      .selectOption({ label: "Public essays" });
    await page.getByRole("button", { name: /^Daily / }).click();
    assert.equal(await page.locator("[data-goal-id]").count(), 2);
    assert.ok(
      (await page.locator(".area-goal-group").innerText()).includes(
        "Writing Day 1",
      ),
    );
    saved = await state();
    assert.equal(saved.lifeAreas.length, 17);
    assert.ok(validateBackup(saved));
    console.log(
      "PASS renames preserve links, referenced sub-areas cannot be removed, and filters survive data reload",
    );
    await page.screenshot({
      path: "test-results/goals-filtered-desktop.png",
      fullPage: true,
    });
    const initialBackup = saved;
    await page
      .getByRole("button", { name: "Settings & backup", exact: true })
      .click();
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export workspace", exact: true })
      .click();
    const download = await downloadPromise;
    const fs = require("node:fs/promises");
    const exported = JSON.parse(
      await fs.readFile(await download.path(), "utf8"),
    );
    assert.equal(exported.lifeAreas.length, 17);
    assert.ok(validateBackup(exported));
    await page
      .getByRole("dialog")
      .locator("input[type=file]")
      .setInputFiles({
        name: "restore.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(initialBackup)),
      });
    await page
      .getByRole("button", { name: "Restore backup", exact: true })
      .click();
    await page.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).lifeAreas.length === 17,
      key,
    );
    console.log(
      "PASS workspace export and restore preserve custom areas and goals",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.screenshot({
      path: "test-results/goals-mobile.png",
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.getByRole("button", { name: /^Life areas / }).click();
    await page.screenshot({
      path: "test-results/life-areas-mobile.png",
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    assert.deepEqual(errors, []);
    console.log("PASS mobile goals and life-area layouts, no runtime errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
