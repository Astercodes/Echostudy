const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const { chromium } = require("playwright");
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
      .getByRole("button", { name: "Begin a session", exact: true })
      .click();
    await page.getByLabel("Intellectual", { exact: true }).check();
    await page.getByLabel("Learning", { exact: true }).check();
    await page
      .getByRole("button", { name: "Start focused study", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Finish & reflect", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .locator("textarea")
      .fill("I can explain the principle and identify a missing prerequisite.");
    await page
      .getByRole("button", { name: "Complete session", exact: true })
      .click();
    await page.getByRole("button", { name: "Barns", exact: true }).click();
    assert.equal(await page.locator(".barn-card").count(), 16);
    await page
      .locator(".barn-card")
      .filter({ hasText: "Intellectual Capacity" })
      .click();
    await page
      .getByRole("button", { name: "Record capacity evidence", exact: true })
      .click();
    await page.getByLabel("Evidence life area").selectOption("knowledge");
    await page.getByLabel("Capacity stage").selectOption("3");
    await page
      .getByLabel("What can you now carry or do? Give a concrete example.")
      .fill("Explained transformers independently with a diagram.");
    await page
      .getByLabel("Supporting study session (optional)")
      .selectOption({ index: 1 });
    await page
      .getByRole("button", { name: "Save evidence", exact: true })
      .click();
    await page
      .getByText("Explained transformers independently with a diagram.", {
        exact: true,
      })
      .waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Barns", exact: true }).click();
    assert.ok(
      (
        await page
          .locator(".barn-card")
          .filter({ hasText: "Intellectual Capacity" })
          .innerText()
      ).includes("Applying independently"),
    );
    await page.getByLabel("Barn life area").selectOption("faith");
    assert.ok(
      (
        await page
          .locator(".barn-card")
          .filter({ hasText: "Intellectual Capacity" })
          .innerText()
      ).includes("Not yet assessed"),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: "test-results/barns-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS Barns session tagging, evidence, context filters, reload persistence and mobile layout",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
