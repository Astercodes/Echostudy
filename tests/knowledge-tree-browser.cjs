const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const page = await b.newPage({ viewport: { width: 1600, height: 1050 } });
    page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
    await installAuthMock(page);
    await page.goto("http://127.0.0.1:5180");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Knowledge tree", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("faith");
    await page
      .getByRole("button", { name: "Add concept", exact: true })
      .click();
    await page
      .getByLabel("Concept name", { exact: true })
      .fill("Understanding wisdom");
    await page
      .getByRole("button", { name: "Save concept", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Grow a fruit", exact: true })
      .click();
    await page
      .getByLabel("Fruit name", { exact: true })
      .fill("Wisdom in daily decisions");
    await page
      .getByLabel("Fruit content", { exact: true })
      .fill("An example I want stored privately inside the fruit.");
    await page.getByRole("button", { name: "Save fruit", exact: true }).click();
    assert.equal(
      await page
        .getByText("An example I want stored privately inside the fruit.", {
          exact: true,
        })
        .count(),
      0,
    );
    await page.screenshot({ path: "tests/knowledge-tree-preview.png" });
    await page.reload();
    await page
      .getByRole("button", { name: "Knowledge tree", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("faith");
    await page
      .getByRole("button", {
        name: "Fruit: Wisdom in daily decisions",
        exact: true,
      })
      .click();
    assert.equal(
      await page
        .getByRole("heading", {
          name: "Wisdom in daily decisions",
          exact: true,
        })
        .count(),
      1,
    );
    await page
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("knowledge");
    assert.equal(
      await page
        .getByRole("button", {
          name: "Fruit: Wisdom in daily decisions",
          exact: true,
        })
        .count(),
      0,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    console.log(
      "PASS separate trees, concept and fruit creation, hidden content, reload persistence, mobile overflow",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
