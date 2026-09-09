const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
(async () => {
  const b = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(p);
    await p.goto("http://127.0.0.1:5180");
    await enterWorkspace(p);
    await p.evaluate(() => {
      const key = "echostudy-v1:11111111-1111-4111-8111-111111111111",
        d = JSON.parse(localStorage.getItem(key)),
        n = d.concepts.find(
          (n) => n.id === "ecosystem-management-v1:fruit-feedback",
        );
      n.status = "Confident";
      n.description = "Distinctive research evidence";
      d.resources.push({
        id: "search-material",
        title: "Advanced evidence handbook",
        kind: "url",
        url: "https://example.com",
        concepts: [n.id],
      });
      localStorage.setItem(key, JSON.stringify(d));
    });
    await p.reload();
    const btn = (name) => p.getByRole("button", { name, exact: true });
    const sel = (name) => p.getByRole("combobox", { name, exact: true });
    const query = p.getByRole("textbox", {
      name: "Search this tree",
      exact: true,
    });
    await btn("Knowledge Ecosystem").click();
    await sel("Life-area tree").selectOption("leadership");
    assert((await query.boundingBox()).width > 700);
    assert.equal(await p.locator(".ecosystem-search-panel select").count(), 0);
    await query.fill("handbook");
    assert.equal(await p.locator(".orchard-results button").count(), 1);
    await p.locator(".orchard-results button").click();
    await p
      .locator(".orchard-detail h2")
      .getByText("Giving Effective Corrective Feedback", { exact: true })
      .waitFor();
    await query.fill("no such source");
    await p
      .getByText(
        "No sources match. Try another keyword or choose a broader forest or grove.",
        { exact: true },
      )
      .waitFor();
    await btn("Clear search text").click();
    assert.equal(await query.inputValue(), "");
    await query.fill("Distinctive research");
    assert.equal(await p.locator(".orchard-results button").count(), 1);
    await p.screenshot({ path: "test-results/ecosystem-search-desktop.png" });
    await sel("Grove (sub-area)").selectOption({ label: "Self-leadership" });
    await query.fill("Distinctive research");
    assert.equal(await p.locator(".orchard-results button").count(), 0);
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "test-results/ecosystem-search-mobile.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS wide search, keyword-only interface, content search, result selection, reset, grove scope and mobile layout",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
