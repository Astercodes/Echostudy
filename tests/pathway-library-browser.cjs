const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const {
  installAuthMock,
  enterWorkspace,
  USER_ONE,
} = require("./auth-mock.cjs");
(async () => {
  const { initialState } = await import("../src/model.js");
  const d = initialState();
  d.goals = [
    { ...d.goals[0], id: "g", title: "Energy industry", level: "Year" },
    { ...d.goals[0], id: "other", title: "Leadership", level: "Month" },
  ];
  d.learningPlanner = [
    {
      id: "a",
      pathwayId: "p",
      goalId: "g",
      title: "First lesson",
      type: "study",
    },
    {
      id: "b",
      pathwayId: "q",
      goalId: "g",
      title: "Second lesson",
      type: "study",
    },
  ];
  d.growthPlannerFocus = {};
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
    await installAuthMock(page);
    await page.addInitScript(
      ({ d, key }) => localStorage.setItem(key, JSON.stringify(d)),
      { d, key: "echostudy-v1:" + USER_ONE },
    );
    await page.goto("http://127.0.0.1:5183");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    const cards = page.locator(".pathway-library-card");
    await cards.first().waitFor();
    assert.equal(await cards.count(), 2);
    const box = await cards.first().boundingBox();
    assert.ok(box.width < 380 && box.height < 250);
    const hero = await page.locator(".growth-pathway-hero").boundingBox(),
      heading = await page.locator(".pathway-library-heading").boundingBox();
    assert.ok(heading.y - hero.y - hero.height >= 30);
    await page.screenshot({
      path: "C:/Users/ayeni/Downloads/compact-pathways.png",
      fullPage: true,
    });
    await cards.first().locator("summary").click();
    await cards
      .first()
      .getByRole("button", { name: "Edit name", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Pathway name").fill("My energy pathway");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    assert.equal(
      await cards.first().locator("h3").innerText(),
      "My energy pathway",
    );
    await cards
      .first()
      .getByRole("button", { name: "Move later", exact: true })
      .click();
    assert.equal(
      await cards.last().locator("h3").innerText(),
      "My energy pathway",
    );
    await cards
      .last()
      .getByRole("button", { name: "Move to another goal" })
      .click();
    await dialog.getByLabel("Destination goal").selectOption("other");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await cards
      .last()
      .getByRole("button", { name: "Delete pathway", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Delete pathway", exact: true })
      .click();
    assert.equal(await cards.count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    console.log(
      "PASS compact cards, spacing, edit, reorder, move, delete and mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
