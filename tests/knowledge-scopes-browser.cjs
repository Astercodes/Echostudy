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
    const open = async () => {
      await page
        .getByRole("button", { name: "Knowledge tree", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Knowledge & education", exact: true })
        .click();
    };
    await open();
    for (const name of [
      "Peel",
      "Squeeze",
      "Chew",
      "Regurgitate",
      "Absorb / Take Root",
      "Taste",
      "Apply",
      "Pluck",
      "Graft",
      "Plant",
      "Prune",
    ])
      assert(
        await page
          .locator(".orchard-detail")
          .getByRole("button", { name, exact: true })
          .isEnabled(),
      );
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Foundations", exact: true })
      .fill("A foundation for the entire life area.");
    await page
      .getByRole("group", { name: "Audio for Foundations", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    const branch = await page
      .getByRole("combobox", { name: "Stem (sub-area)", exact: true })
      .locator("option")
      .nth(1)
      .textContent();
    await page
      .getByRole("button", { name: "Stem: " + branch, exact: true })
      .click();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Foundations", exact: true })
        .inputValue(),
      "",
    );
    await page
      .getByRole("textbox", { name: "Foundations", exact: true })
      .fill("Only this branch.");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.reload();
    await open();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Foundations", exact: true })
        .inputValue(),
      "A foundation for the entire life area.",
    );
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("button", { name: "Stem: " + branch, exact: true })
      .click();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Foundations", exact: true })
        .inputValue(),
      "Only this branch.",
    );
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("button", { name: "Knowledge & education", exact: true })
      .click();
    await page
      .locator(".orchard-detail")
      .getByRole("button", { name: "Prune", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Prune & preserve", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Leaf: Transformers", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Knowledge & education", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Restore workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Leaf: Transformers", exact: true })
      .waitFor();
    console.log(
      "PASS clickable roots/branches, all actions, audio controls, independent persistence, archive and restore",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
