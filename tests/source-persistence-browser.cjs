const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const p = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(p);
    await p.goto("http://127.0.0.1:5180");
    await enterWorkspace(p);
    await p.evaluate(() => {
      const key = "echostudy-v1:11111111-1111-4111-8111-111111111111";
      const d = JSON.parse(localStorage.getItem(key));
      d.resources.push({
        id: "source-regression",
        title: "The Practice of Leadership",
        kind: "url",
        url: "https://example.com/leadership",
        concepts: [],
      });
      localStorage.setItem(key, JSON.stringify(d));
    });
    await p.reload();
    const btn = (name) => p.getByRole("button", { name, exact: true });
    const box = (name) => p.getByRole("textbox", { name, exact: true });
    await btn("Knowledge Ecosystem").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    for (const [name, pages] of [
      ["Leadership & influence", "pp. 12–17"],
      ["Grove: Management", "Chapter 4, pp. 60–82"],
    ]) {
      await btn(name).click();
      await btn("Open content").click();
      await box("Workspace content").fill(`Study notes for ${name}`);
      await btn("Choose from library").click();
      await btn("Attach The Practice of Leadership").click();
      await box("Reference location for The Practice of Leadership").fill(
        pages,
      );
      await box("Citation for The Practice of Leadership").fill(
        "Leadership handbook, 2026 edition",
      );
      // Save and leave with the reference editor still open, without any secondary save/link action.
      await btn("Save study content").click();
      await btn("Return to ecosystem").click();
      await btn("Open content").click();
      await p
        .locator(".source-card")
        .getByText(pages, { exact: true })
        .waitFor();
      await btn("Edit reference for The Practice of Leadership").click();
      assert.equal(
        await box(
          "Reference location for The Practice of Leadership",
        ).inputValue(),
        pages,
      );
      await btn("Done editing").click();
      await p.screenshot({
        path: `test-results/sources-${name.startsWith("Grove") ? "grove" : "forest"}.png`,
      });
      await btn("Return to ecosystem").click();
    }
    await btn("Peel").click();
    await box("Foundations").fill(
      "A clear foundation for management practice.",
    );
    assert.equal(await p.locator(".source-card").count(), 0);
    await btn("Choose from library").click();
    await btn("Attach The Practice of Leadership").click();
    await box("Reference location for The Practice of Leadership").fill(
      "pp. 101–104",
    );
    await btn("Done editing").click();
    await p.screenshot({ path: "test-results/sources-action-desktop.png" });
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "test-results/sources-action-mobile.png" });
    await p.setViewportSize({ width: 1440, height: 1000 });
    await btn("Done").click();
    await p.reload();
    await btn("Knowledge Ecosystem").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    await btn("Grove: Management").click();
    await btn("Open content").click();
    await p
      .locator(".source-card")
      .getByText("Chapter 4, pp. 60–82", { exact: true })
      .waitFor();
    await btn("Return to ecosystem").click();
    await btn("Peel").click();
    await p
      .locator(".source-card")
      .getByText("pp. 101–104", { exact: true })
      .waitFor();
    await p.getByRole("tab", { name: "Prerequisites", exact: true }).click();
    assert.equal(await p.locator(".source-card").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS forest and grove select/edit/save/leave/reopen/reload; component isolation; desktop and mobile Sources UI",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
