const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
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
    const button = (name) => p.getByRole("button", { name, exact: true });
    await button("Knowledge tree").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    await p
      .getByRole("combobox", { name: "Stem (sub-area)", exact: true })
      .selectOption({ label: "Management" });
    await button("Add branch").click();
    await p
      .getByLabel("Branch name", { exact: true })
      .fill("Management methods");
    await button("Save branch").click();
    await button("Grow a leaf").click();
    await p
      .getByLabel("Leaf name", { exact: true })
      .fill("Delegation principle");
    await button("Save leaf").click();
    await button("Grow a fruit").click();
    await p
      .getByLabel("Fruit name", { exact: true })
      .fill("Delegation in practice");
    await p
      .getByLabel("Fruit content", { exact: true })
      .fill("What is Bayesian decision making?");
    await button("Save fruit").click();
    await button("Plant").click();
    await p
      .getByLabel("Seed question or idea", { exact: true })
      .fill("What is Bayes' theorem?");
    await button("Save seed").click();
    await button("Grow seed").click();
    await p
      .getByRole("combobox", { name: "Grow into", exact: true })
      .selectOption("new");
    await p
      .getByLabel("New life-area tree name", { exact: true })
      .fill("Decision science");
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Grow seed", exact: true })
      .click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    await button("Fruit: Delegation in practice").click();
    await button("Pluck").click();
    await button("Copy & study independently").click();
    await p.getByRole("dialog").waitFor();
    await button("Return to tree").click();
    const saved = await p.evaluate(() =>
      JSON.parse(
        localStorage.getItem(
          "echostudy-v1:11111111-1111-4111-8111-111111111111",
        ),
      ),
    );
    const original = saved.concepts.find(
      (n) => n.kind === "fruit" && n.title === "Delegation in practice",
    );
    const copy = saved.concepts.find(
      (n) =>
        n.lineage?.action === "pluck" && n.lineage.sourceId === original.id,
    );
    assert(original.parent);
    assert(copy.standalone);
    assert(copy.lineage.path.includes("Management"));
    assert(saved.lifeAreas.some((a) => a.name === "Decision science"));
    await button("Prune").click();
    await button("Prune & preserve").click();
    await button("Pruned knowledge").click();
    await button("Restore").click();
    await p.getByRole("button", { name: "Close dialog", exact: true }).click();
    await p.reload();
    await button("Knowledge tree").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    await button("Fruit: Delegation in practice").waitFor();
    await button("Branch: Management methods").waitFor();
    await button("Leaf: Delegation principle").waitFor();
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS: Management hierarchy, seeds/new trees, nondestructive Pluck with lineage, Prune/restore and reload.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
