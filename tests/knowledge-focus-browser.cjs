const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(p);
    await p.goto("http://127.0.0.1:5180");
    await enterWorkspace(p);
    const btn = (name) => p.getByRole("button", { name, exact: true });
    const tab = (name) => p.getByRole("tab", { name, exact: true });
    await btn("Knowledge Ecosystem").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    await p
      .getByRole("combobox", { name: "Grove (sub-area)", exact: true })
      .selectOption({ label: "Management" });
    await btn("Grove: Management").click();
    await btn("Focus on this grove").click();
    assert.equal(await tab("Management").getAttribute("aria-selected"), "true");
    assert.equal(
      await p
        .getByRole("combobox", { name: "Life-area tree", exact: true })
        .count(),
      0,
    );
    await btn("Add tree").click();
    await p.getByLabel("Tree name", { exact: true }).fill("My focused tree");
    await btn("Save tree").click();
    await btn("Tree: People Management").click();
    await btn("Focus on this tree").click();
    assert.equal(
      await tab("People Management").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(await btn("Tree: Project Management").count(), 0);
    await btn("Grow a branch").click();
    await p.getByLabel("Branch name", { exact: true }).fill("Focused practice");
    await btn("Save branch").click();
    await tab("Knowledge Ecosystem").click();
    assert.equal(
      await p
        .getByRole("combobox", { name: "Grove (sub-area)", exact: true })
        .inputValue(),
      await p
        .getByRole("combobox", { name: "Grove (sub-area)", exact: true })
        .locator("option", { hasText: "Management" })
        .first()
        .getAttribute("value"),
    );
    await btn("Branch: Focused practice").waitFor();
    await btn("Tree: My focused tree").waitFor();
    await btn("Tree: People Management").click();
    await btn("Focus on this tree").click();
    assert.equal(await tab("People Management").count(), 1);
    await btn("Close focus: People Management").click();
    assert.equal(
      await tab("Knowledge Ecosystem").getAttribute("aria-selected"),
      "true",
    );
    await btn("Branch: Focused practice").waitFor();
    await tab("Management").click();
    const saved = await p.evaluate(() =>
      JSON.parse(
        localStorage.getItem(
          "echostudy-v1:11111111-1111-4111-8111-111111111111",
        ),
      ),
    );
    const grove = saved.lifeAreas
      .find((a) => a.id === "leadership")
      .subAreas.find((s) => s.name === "Management");
    assert.equal(
      saved.concepts.find((n) => n.title === "My focused tree").subAreaId,
      grove.id,
    );
    assert.equal(
      saved.concepts.find((n) => n.title === "Focused practice").parent,
      "ecosystem-management-v1:people",
    );
    await p.setViewportSize({ width: 390, height: 844 });
    assert(await tab("Knowledge Ecosystem").isVisible());
    assert.deepEqual(errors, []);
    console.log(
      "PASS focus tabs, duplicate prevention, shared edits, default filters, close safety, placement and mobile tabs",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
