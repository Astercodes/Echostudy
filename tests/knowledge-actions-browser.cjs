const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(page);
    await page.goto("http://127.0.0.1:5180");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Knowledge tree", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("faith");
    await page.getByRole("button", { name: "Add branch", exact: true }).click();
    await page
      .getByLabel("Branch name", { exact: true })
      .fill("Wisdom practice");
    await page
      .getByRole("button", { name: "Save branch", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Grow a leaf", exact: true })
      .click();
    await page
      .getByLabel("Leaf name", { exact: true })
      .fill("Wisdom principle");
    await page.getByRole("button", { name: "Save leaf", exact: true }).click();
    await page
      .getByRole("button", { name: "Grow a fruit", exact: true })
      .click();
    await page.getByLabel("Fruit name", { exact: true }).fill("Sound judgment");
    await page
      .getByLabel("Fruit content", { exact: true })
      .fill("Knowledge applied with discernment.");
    await page.getByRole("button", { name: "Save fruit", exact: true }).click();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    await page.getByRole("tab", { name: /Definitions/ }).click();
    await page
      .getByRole("textbox", { name: "Definitions", exact: true })
      .fill("Choosing well with evidence and care.");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Squeeze", exact: true }).click();
    await page.getByRole("tab", { name: /Edge cases/ }).click();
    await page
      .getByRole("textbox", { name: "Edge cases", exact: true })
      .fill("Incomplete information may require a reversible decision.");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Taste", exact: true }).click();
    assert.equal(
      await page
        .getByText("Choosing well with evidence and care.", { exact: true })
        .count(),
      0,
    );
    await page
      .getByLabel("Your answer from memory", { exact: true })
      .fill("Consider evidence and the effects on people.");
    await page
      .getByRole("button", { name: "Reveal reference & assess", exact: true })
      .click();
    await page
      .getByText("Choosing well with evidence and care.", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Partly understood", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Attempt saved" })
      .waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page
      .getByLabel("Situation or problem", { exact: true })
      .fill("A difficult team decision");
    await page
      .getByLabel("Evidence of doing", { exact: true })
      .fill("Compared two options and asked for feedback.");
    await page
      .getByLabel("Outcome and learning", { exact: true })
      .fill("Found an overlooked consequence.");
    await page
      .getByRole("button", { name: "Record application", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application history (1)", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Graft", exact: true }).click();
    await page.getByLabel("Find an idea", { exact: true }).fill("Transformers");
    await page.getByRole("checkbox", { name: /Transformers/ }).check();
    await page
      .getByLabel("Why connect to Transformers?", { exact: true })
      .fill("Both depend on understanding the consequences of a change.");
    await page
      .getByRole("button", { name: "Save grafts", exact: true })
      .click();
    assert.match(
      await page.locator(".orchard-detail").innerText(),
      /Transformers/,
    );
    await page.getByRole("button", { name: "Pluck", exact: true }).click();
    await page
      .getByRole("button", { name: "Copy & study independently", exact: true })
      .click();
    await page
      .getByRole("dialog", {
        name: "Pluck · Independent study · Sound judgment",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page
        .locator(".overlay")
        .evaluate((e) => getComputedStyle(e).backgroundColor),
      "rgb(243, 247, 253)",
    );
    await page.screenshot({ path: "tests/knowledge-isolate-preview.png" });
    await page
      .getByRole("button", { name: "Return to tree", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Branch: Sound judgment", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Grow a leaf", exact: true })
      .waitFor();
    await page
      .locator(".orchard-detail")
      .getByRole("button", { name: "Prune", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Prune & preserve", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Branch: Sound judgment", exact: true })
        .count(),
      0,
    );
    await page
      .locator(".orchard-toolbar")
      .getByRole("button", { name: "Pruned knowledge", exact: true })
      .click();
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.reload();
    await page
      .getByRole("button", { name: "Knowledge tree", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("faith");
    await page
      .getByRole("button", { name: "Branch: Sound judgment", exact: true })
      .click();
    await page.getByRole("button", { name: "Taste", exact: true }).click();
    await page
      .getByRole("button", { name: "Attempt history (1)", exact: true })
      .click();
    await page
      .getByText("Consider evidence and the effects on people.", {
        exact: true,
      })
      .waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    await page.getByRole("tab", { name: /Definitions/ }).click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Definitions", exact: true })
        .inputValue(),
      "Choosing well with evidence and care.",
    );
    await page.screenshot({ path: "tests/knowledge-peel-preview.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS all eight actions, graft meaning, concealed answers, application evidence, history, restoration, reload and mobile",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
