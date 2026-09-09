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
        d = JSON.parse(localStorage.getItem(key));
      const n = d.concepts.find(
        (x) => x.id === "ecosystem-management-v1:fruit-feedback",
      );
      n.prerequisites = ["Conditional probability", "Decision theory missing"];
      n.description =
        "Monetary policy provides a useful comparison for this idea.";
      n.learning = {
        test: {
          attempts: [
            {
              id: "weak",
              questionId: "q",
              question: "Explain the reasoning",
              accuracy: 30,
              confidence: 90,
              result: "Misconception",
              gap: "Reasoning gaps",
              at: new Date().toISOString(),
            },
          ],
        },
      };
      const areaId = d.lifeAreas.find((x) => x.id !== "leadership").id;
      d.concepts.push(
        {
          id: "probability",
          title: "Conditional probability",
          kind: "concept",
          areaId,
          subAreaId: "",
          parent: "",
          status: "Confident",
          links: [],
          prerequisites: [],
        },
        {
          id: "monetary",
          title: "Monetary policy",
          kind: "concept",
          areaId,
          subAreaId: "",
          parent: "",
          status: "Growing",
          links: [],
          prerequisites: [],
        },
      );
      localStorage.setItem(key, JSON.stringify(d));
    });
    await p.reload();
    const btn = (name) => p.getByRole("button", { name, exact: true });
    const select = (name) => p.getByRole("combobox", { name, exact: true });
    await btn("Knowledge Ecosystem").click();
    await select("Life-area tree").selectOption("leadership");
    await btn("Growth suggestions").click();
    await p
      .getByRole("heading", {
        name: "Knowledge intelligence · Growth suggestions",
      })
      .waitFor();
    await p.screenshot({
      path: "test-results/knowledge-intelligence-desktop.png",
    });
    await select("Gap category").selectOption("prerequisite");
    assert.equal(
      await p
        .getByRole("heading", {
          name: "Missing prerequisite: Conditional probability",
          exact: true,
        })
        .count(),
      0,
    );
    const missing = p
      .locator(".intelligence-finding")
      .filter({ hasText: "Missing prerequisite: Decision theory missing" });
    await missing
      .getByRole("button", { name: "Plant prerequisite", exact: true })
      .click();
    assert.equal(
      await p
        .getByRole("textbox", { name: "Seed question or idea", exact: true })
        .inputValue(),
      "Decision theory missing",
    );
    await btn("Close dialog").click();
    await btn("Growth suggestions").click();
    await select("Gap category").selectOption("understanding");
    await p
      .locator(".intelligence-finding")
      .filter({ hasText: "Reasoning gap" })
      .getByRole("button", { name: "Open Chew", exact: true })
      .click();
    await p.getByRole("textbox", { name: "Restate it", exact: true }).waitFor();
    await btn("Done").click();
    await btn("Growth suggestions").click();
    await select("Gap category").selectOption("connection");
    await p
      .getByRole("textbox", { name: "Search findings", exact: true })
      .fill("Monetary policy");
    await p
      .locator(".intelligence-finding")
      .first()
      .getByRole("button", { name: "Inspect related source", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "Content · Monetary policy", exact: true })
      .waitFor();
    await btn("Return to ecosystem").click();
    await btn("Growth suggestions").click();
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({
      path: "test-results/knowledge-intelligence-mobile.png",
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS intelligence filters, global prerequisites, prefilled seed, prescribed study action, cross-forest source and mobile layout",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
