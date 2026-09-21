const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const {
  installAuthMock,
  enterWorkspace,
  USER_ONE,
} = require("./auth-mock.cjs");
(async () => {
  const { initialState, today } = await import("../src/model.js");
  const d = initialState();
  d.goals = [{ ...d.goals[0], id: "g", title: "Business learning" }];
  d.learningPlanner = ["Definition", "Components", "Purpose"].map(
    (title, i) => ({
      id: "l" + i,
      pathwayId: "p",
      goalId: "g",
      title,
      levelTitle: "Introduction to Business",
      levelOrder: 0,
      moduleTitle: i < 2 ? "What is Business?" : "Why Businesses Exist",
      moduleOrder: i < 2 ? 0 : 1,
      lessonOrder: i,
      topics: ["Concept " + i],
      curriculumLesson: true,
      type: "study",
      action: "Peel",
      resourceIds: [],
      duration: 25,
    }),
  );
  d.plans = {};
  d.sessions = [];
  d.timer = null;
  d.stretches = [];
  d.commitmentRules = [];
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(page);
    await page.addInitScript(
      ({ d, key }) => localStorage.setItem(key, JSON.stringify(d)),
      { d, key: "echostudy-v1:" + USER_ONE },
    );
    await page.goto("http://127.0.0.1:5183");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await page.locator(".pathway-card-open").click();
    const group = page.locator(".subtopic-group").first();
    await group.locator("summary").click();
    await group.getByRole("checkbox").nth(0).check();
    await group.getByRole("checkbox").nth(1).check();
    await page
      .getByRole("button", { name: "Work on selection", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Study action", { exact: true })
      .selectOption("Chew");
    await dialog
      .getByRole("button", { name: "Add selection to Time planner" })
      .click();
    await dialog.getByLabel("Schedule date").fill(today());
    await dialog
      .getByRole("button", { name: "Choose time and details" })
      .click();
    await dialog.getByRole("button", { name: "Save time block" }).click();
    const read = () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        "echostudy-v1:" + USER_ONE,
      );
    let saved = await read();
    assert.deepEqual(Object.values(saved.plans).flat()[0].pathwayStepIds, [
      "l0",
      "l1",
    ]);
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await group.locator("summary").click();
    await group
      .getByRole("button", { name: "Work on entire subtopic" })
      .click();
    await dialog
      .getByLabel("Study action", { exact: true })
      .selectOption("Chew");
    await dialog.getByRole("button", { name: "Study selection now" }).click();
    await dialog.getByRole("button", { name: "Start focused study" }).click();
    await page.getByRole("button", { name: "Finish & reflect" }).click();
    await dialog
      .locator("textarea")
      .fill("Studied both lessons; further practice needed.");
    await dialog.getByRole("button", { name: "Complete session" }).click();
    saved = await read();
    assert.deepEqual(saved.sessions[0].pathwayStepIds, ["l0", "l1"]);
    assert.equal(saved.learningPlanner[0].status, "in progress");
    assert.equal(saved.learningPlanner[2].status, "planned");
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await page.getByRole("button", { name: "Work on entire topic" }).click();
    await dialog
      .getByRole("button", { name: "Grow / open in ecosystem" })
      .click();
    await dialog.getByRole("button", { name: "Save to ecosystem" }).click();
    saved = await read();
    assert.equal(
      saved.concepts.filter(
        (n) => n.sourceLessonId && /^l[012]$/.test(n.sourceLessonId),
      ).length,
      3,
    );
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await group.locator("summary").click();
    await group
      .getByRole("button", { name: "Work on entire subtopic" })
      .click();
    await dialog
      .getByLabel("Workspace", { exact: true })
      .selectOption("stretch");
    await dialog
      .getByRole("button", { name: "Create Stretch for selection" })
      .click();
    await dialog
      .getByRole("button", { name: "Save stretch", exact: true })
      .click();
    saved = await read();
    assert.deepEqual(saved.stretches.at(-1).pathwayStepIds, ["l0", "l1"]);
    assert.deepEqual(errors, []);
    await page
      .getByRole("button", { name: "Growth Planner", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    console.log(
      "PASS selected lessons, entire subtopic/topic, scheduled Study completion, structured ecosystem growth, grouped Stretch and mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
