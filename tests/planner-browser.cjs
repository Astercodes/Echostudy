const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await installAuthMock(page);
    await page.goto("http://127.0.0.1:5180");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "24-hour planner", exact: true })
      .click();
    const row = page.locator(".plan-row").last();
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    assert.equal(
      await page.getByLabel("Ends", { exact: true }).getAttribute("type"),
      "time",
    );
    await page.getByLabel("Ends", { exact: true }).fill("23:50");
    await page.getByRole("combobox", { name: "Linked goal", exact: true }).selectOption("g5");
    await page
      .getByRole("button", { name: "Save time block", exact: true })
      .click();
    assert.match(await row.innerText(), /23:50/);
    assert.match(await row.innerText(), /Goal:/);
    await page.reload();
    await page
      .getByRole("button", { name: "24-hour planner", exact: true })
      .click();
    await page
      .locator(".plan-row")
      .last()
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Ends", { exact: true }).inputValue(),
      "23:50",
    );
    assert.equal(
      await page.getByRole("combobox", { name: "Linked goal", exact: true }).inputValue(),
      "g5",
    );
    await page.getByLabel("Ends", { exact: true }).fill("00:00");
    await page
      .getByRole("button", { name: "Save time block", exact: true })
      .click();
    assert.match(await page.locator(".plan-row").last().innerText(), /24:00/);
    await page.screenshot({ path: "tests/planner-palette.png" });
    console.log(
      "PASS: end picker, midnight, goal links and reload persistence",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});


