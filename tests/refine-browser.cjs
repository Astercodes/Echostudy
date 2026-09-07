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
    await installAuthMock(page);
    let mode = "success",
      requests = [];
    await page.route("**/api/refine-stretch", (r) => {
      requests.push(r.request().postDataJSON());
      return r.fulfill({
        status: mode === "success" ? 200 : 503,
        contentType: "application/json",
        body: JSON.stringify(
          mode === "success"
            ? {
                suggestion: {
                  title: "Explain a transformer in five minutes",
                  objective: "Practise a clear technical explanation",
                  success:
                    "Listener explains the voltage change in their own words",
                  rationale: "Makes your practice observable",
                },
              }
            : {
                error:
                  "AI refinement is not configured yet. You can continue editing manually.",
              },
        ),
      });
    });
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
      .fill("Explain transformers");
    await page.getByLabel("Linked goal", { exact: true }).selectOption("g5");
    await page
      .getByRole("button", { name: "Refine with AI", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Apply suggestion", exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Practical activity", { exact: true }).inputValue(),
      "Explain transformers",
    );
    assert.equal(requests[0].title, "Explain transformers");
    assert.deepEqual(Object.keys(requests[0]).sort(), [
      "objective",
      "success",
      "title",
    ]);
    assert.equal(requests[0].outcome, undefined);
    await page
      .getByLabel("Practical activity", { exact: true })
      .fill("My revised idea");
    assert.equal(
      await page
        .getByRole("button", { name: "Apply suggestion", exact: true })
        .isEnabled(),
      false,
    );
    await page
      .getByRole("button", { name: "Refine with AI", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Apply suggestion", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Practical activity", { exact: true }).inputValue(),
      "Explain a transformer in five minutes",
    );
    assert.equal(
      await page.getByLabel("Linked goal", { exact: true }).inputValue(),
      "g5",
    );
    mode = "unavailable";
    await page
      .getByRole("button", { name: "Refine with AI", exact: true })
      .click();
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page.getByLabel("Practical activity", { exact: true }).inputValue(),
      "Explain a transformer in five minutes",
    );
    console.log(
      "PASS AI preview, stale-draft protection, apply and unavailable-state draft preservation",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
