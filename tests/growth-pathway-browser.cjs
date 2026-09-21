const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const {
  installAuthMock,
  enterWorkspace,
  USER_ONE,
} = require("./auth-mock.cjs");
(async () => {
  const { initialState, today } = await import("../src/model.js");
  const data = initialState(),
    day = today();
  data.plans = {};
  data.sessions = [];
  data.stretches = [];
  data.timer = null;
  data.learningPlanner = [];
  data.commitmentRules = [];
  data.goals = [
    {
      ...data.goals[0],
      id: "energy-goal",
      title:
        "Develop deep expertise in strategy and innovation in the energy industry",
      level: "Year",
      progress: 0,
    },
  ];
  data.resources.push({
    id: "energy-source",
    title: "Energy work power",
    kind: "url",
    url: "https://example.org/energy",
    tags: [],
    highlights: [],
    locations: [],
  });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      }),
      errors = [];
    let apiCalls = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(page);
    await page.addInitScript(
      ({ data, key }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(data));
      },
      { data, key: "echostudy-v1:" + USER_ONE },
    );
    await page.route("**/api/growth-pathway", (r) => {
      apiCalls++;
      return r.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Gemini unavailable. Your saved pathways are unchanged.",
        }),
      });
    });
    await page.goto("http://127.0.0.1:5183");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    assert.equal(await page.locator(".growth-goal-options").count(), 0);
    await page
      .getByRole("button", { name: "New pathway", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: /Develop deep expertise/ })
      .click();
    await dialog.getByText("Optional Gemini draft", { exact: true }).click();
    await dialog.getByRole("button", { name: "Enhance with Gemini" }).click();
    await dialog.getByRole("alert").waitFor();
    await dialog.getByRole("button", { name: "Build my pathway" }).click();
    await dialog.getByRole("button", { name: "Save pathway" }).click();
    assert.equal(apiCalls, 1);
    assert.equal(await page.locator(".growth-step").count(), 1);
    assert.equal(
      await page.locator(".growth-step>h2").innerText(),
      "Energy, work & power",
    );
    await page.screenshot({
      path: "C:/Users/ayeni/Downloads/growth-curriculum-desktop.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Grow in ecosystem" }).click();
    await dialog.getByRole("button", { name: "Save to ecosystem" }).click();
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    let saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)),
      "echostudy-v1:" + USER_ONE,
    );
    const conceptId = saved.learningPlanner[0].conceptId;
    assert.ok(conceptId);
    assert.ok(
      saved.concepts.some((n) => n.parent === conceptId && n.kind === "leaf"),
    );
    await page
      .locator(".growth-step")
      .getByRole("button", { name: "Add to Time planner" })
      .click();
    await dialog.getByLabel("Schedule date").fill(day);
    await dialog
      .getByRole("button", { name: "Choose time and details" })
      .click();
    assert.equal(
      await dialog.getByLabel("What is this time for?").inputValue(),
      "Energy, work & power",
    );
    await dialog.getByRole("button", { name: "Save time block" }).click();
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await page
      .locator(".growth-step")
      .getByRole("button", { name: "Study now" })
      .click();
    await dialog.getByRole("button", { name: "Start focused study" }).click();
    await page.getByRole("button", { name: "Finish & reflect" }).click();
    await dialog
      .locator("textarea")
      .fill("Explained energy and power with an example.");
    await dialog.getByRole("button", { name: "Complete session" }).click();
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)),
      "echostudy-v1:" + USER_ONE,
    );
    assert.equal(saved.learningPlanner[0].status, "in progress");
    assert.equal(saved.sessions[0].conceptId, conceptId);
    assert.equal(saved.sessions[0].resourceId, "energy-source");
    assert.equal(saved.sessions[0].pathwayStepId, saved.learningPlanner[0].id);
    await page
      .locator(".growth-step")
      .getByRole("button", { name: "Create Stretch" })
      .click();
    await dialog
      .getByRole("button", { name: "Save stretch", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await page.locator(".lesson-directory>summary").click();
    await page
      .locator(".lesson-directory")
      .getByRole("button", { name: /Map an Energy Company/ })
      .click();
    assert.equal(await page.locator(".lesson-concepts li").count(), 15);
    await page
      .locator(".growth-step")
      .getByRole("button", { name: "Practise now" })
      .click();
    await dialog
      .getByRole("button", { name: "Save stretch", exact: true })
      .click();
    saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)),
      "echostudy-v1:" + USER_ONE,
    );
    assert.ok(
      saved.stretches.some(
        (s) =>
          s.title === "Map an Energy Company" &&
          s.objective.includes("Who buys it?"),
      ),
    );
    assert.ok(
      saved.learningPlanner.some(
        (s) =>
          s.sourceLessonId === saved.learningPlanner[0].id &&
          s.type === "stretch",
      ),
    );
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().right<=0);
    await page.screenshot({
      path: "C:/Users/ayeni/Downloads/growth-curriculum-mobile.png",
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.getByRole("button", { name: "← All pathways" }).click();
    assert.equal(await page.locator(".growth-goal-options").count(), 0);
    assert.equal(await page.locator(".pathway-library-card").count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      "PASS clean goal selection, curriculum, source lineage, schedule, study, progress, practice and applied lesson, mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
