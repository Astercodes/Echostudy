const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
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
    await installAuthMock(page);
    await page.goto("http://127.0.0.1:5180");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Stretch workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Plan a stretch", exact: true })
      .click();
    await page
      .getByLabel("Practical activity", { exact: true })
      .fill("Explain a transformer to a friend");
    await page
      .getByLabel("What ability will you use or stretch?")
      .fill("Communicate a technical concept clearly");
    await page
      .getByLabel("What will successful practice look like?")
      .fill("My friend can explain the turns ratio back");
    await page.getByLabel("Linked goal", { exact: true }).selectOption("g5");
    await page.getByLabel("Practice sub-area").selectOption("knowledge-3");
    await page.getByLabel("Communication", { exact: true }).check();
    await page
      .getByRole("button", { name: "Save stretch", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start stretch", exact: true })
      .click();
    await page.reload();
    await page
      .getByRole("button", { name: "Stretch workspace", exact: true })
      .click();
    await page.getByText("In progress", { exact: false }).first().waitFor();
    await page
      .getByRole("button", { name: "Record result", exact: true })
      .click();
    await page.getByLabel("Actual practice minutes").fill("20");
    await page
      .getByLabel("How much of the planned activity did you complete? (%)")
      .fill("50");
    await page
      .getByLabel("What did you do, and what happened?")
      .fill("Explained two of four key ideas successfully");
    await page
      .getByRole("button", { name: "Save practice result", exact: true })
      .click();
    await page.getByRole("button", { name: "Barns", exact: true }).click();
    const card = page
      .locator(".barn-card")
      .filter({ hasText: "Communication Capacity" });
    assert.ok((await card.innerText()).includes("3% of your growth milestone"));
    await card.click();
    await page
      .getByText("Explained two of four key ideas successfully", {
        exact: true,
      })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.reload();
    await page
      .getByRole("button", { name: "Stretch workspace", exact: true })
      .click();
    await page.getByLabel("Stretch life area").selectOption("knowledge");
    await page.getByLabel("Stretch sub-area").selectOption("knowledge-3");
    assert.equal(await page.locator(".stretch-record").count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () =>
        document.querySelector(".sidebar").getBoundingClientRect().right <= 0,
    );
    await page.screenshot({
      path: "test-results/stretch-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS plan, start, partial completion, Barns credit, reload, context filters and mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
