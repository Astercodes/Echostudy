const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const {
  installAuthMock,
  enterWorkspace,
  USER_ONE,
} = require("./auth-mock.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(page);
    const { initialState } = await import("../src/model.js");
    const d = initialState();
    await page.addInitScript(
      ({ d, key }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(d));
      },
      { d, key: "echostudy-v1:" + USER_ONE },
    );
    const source =
      "Cybersecurity protects systems, networks and data. Access requires authorization.";
    const structure = {
      title: "Cybersecurity",
      structure: "Classification",
      summary: "Protected assets and access conditions.",
      origin: "Gemini draft",
      concepts: [
        {
          id: "assets",
          parent: "",
          label: "Protected assets",
          detail: "Systems, networks and data",
          quote: "systems, networks and data",
          essential: true,
          exact: false,
          category: "concept",
        },
        {
          id: "authorization",
          parent: "assets",
          label: "Authorization",
          detail: "Permission required for access",
          quote: "Access requires authorization.",
          essential: true,
          exact: true,
          category: "qualifier",
        },
      ],
      relationships: [],
    };
    let verified = 0;
    await page.route("**/api/knowledge-mastery", (route) => {
      const body = route.request().postDataJSON();
      assert.ok(route.request().headers().authorization.startsWith("Bearer "));
      if (body.operation === "analyze")
        return route.fulfill({ json: { result: structure } });
      verified++;
      if (verified === 1)
        return route.fulfill({
          status: 503,
          json: {
            error: "AI unavailable for this test. Your answer is saved.",
          },
        });
      return route.fulfill({
        json: {
          result: {
            origin: "Gemini draft",
            items: body.deck.concepts.map((c) => ({
              id: c.id,
              status: "correct",
              reason: "Valid paraphrase",
              evidence: body.answer,
              qualifierOmitted: false,
            })),
            unsupported: [],
            fluency: "Group the assets before explaining the access condition.",
            application: null,
            notes: "Check the source if uncertain.",
          },
        },
      });
    });
    await page.goto("http://127.0.0.1:5183");
    await enterWorkspace(page);
    await page
      .getByRole("button", { name: "Study workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Open Knowledge Mastery", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Structure knowledge", exact: true })
      .click();
    await page.getByLabel("Title", { exact: true }).fill("Cybersecurity");
    await page.getByLabel("Source passage").fill(source);
    await page
      .getByLabel("Source reference: page, chapter or timestamp")
      .fill("Lecture 1, page 2");
    await page.getByRole("button", { name: "Analyze with AI" }).click();
    await page.getByRole("heading", { name: "Editable hierarchy" }).waitFor();
    assert.equal(await page.locator(".kme-concept").count(), 2);
    await page.screenshot({
      path: "../mastery-structure-preview.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Prepare active recall" }).click();
    await page.getByRole("button", { name: /Full reconstruction/ }).click();
    assert.equal(await page.locator(".kme-source:visible").count(), 0);
    assert.equal(
      await page.getByText(source, { exact: true }).isVisible(),
      false,
    );
    await page
      .getByLabel("Your reconstruction")
      .fill(
        "Systems, data and networks are protected. Access needs permission.",
      );
    await page.getByRole("button", { name: "Verify with AI" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "AI unavailable" })
      .waitFor();
    assert.match(
      await page.getByLabel("Your reconstruction").inputValue(),
      /permission/,
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Knowledge Mastery", exact: true })
      .click();
    await page
      .getByRole("button", { name: /Cybersecurity.*Resume saved answer/ })
      .click();
    assert.match(
      await page.getByLabel("Your reconstruction").inputValue(),
      /permission/,
    );
    await page
      .getByRole("button", { name: "Reveal and review myself" })
      .click();
    await page
      .getByRole("button", { name: "Save review and schedule retrieval" })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Resolve uncertain" })
      .waitFor();
    await page
      .getByLabel("Assessment for Protected assets", { exact: true })
      .selectOption("correct");
    await page
      .getByLabel("Assessment for Authorization", { exact: true })
      .selectOption("partial");
    await page
      .getByRole("button", { name: "Save review and schedule retrieval" })
      .click();
    await page.getByRole("heading", { name: "Retrieval history" }).waitFor();
    assert.ok(
      await page
        .locator(".kme-stats")
        .getByText("50%", { exact: true })
        .count(),
    );
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)),
      "echostudy-v1:" + USER_ONE,
    );
    assert.equal(saved.masteryDecks[0].attempts.length, 1);
    assert.equal(saved.masteryDecks[0].source, source);
    assert.equal(saved.masteryDecks[0].review.authorization.intervalDays, 1);
    assert.deepEqual(saved.concepts, d.concepts);
    await page.getByRole("button", { name: "Practise again" }).click();
    await page.getByRole("button", { name: /Full reconstruction/ }).click();
    await page
      .getByLabel("Your reconstruction")
      .fill(
        "Digital systems, networks and data need protection. Access requires authorization.",
      );
    await page.getByRole("button", { name: "Verify with AI" }).click();
    await page
      .getByRole("button", { name: "Save review and schedule retrieval" })
      .click();
    await page.getByRole("heading", { name: "Retrieval history" }).waitFor();
    assert.ok(
      await page
        .locator(".kme-stats")
        .getByText("100%", { exact: true })
        .count(),
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Knowledge Mastery", exact: true })
      .click();
    await page
      .locator(".kme-deck")
      .filter({ hasText: "Cybersecurity" })
      .click();
    await page.locator(".kme-concept > summary").first().click();
    await page
      .getByLabel("Concept label", { exact: true })
      .first()
      .fill("Protected infrastructure");
    await page.getByRole("button", { name: "Progress", exact: true }).click();
    assert.equal(
      await page
        .locator(".kme-stats")
        .getByText("100%", { exact: true })
        .count(),
      0,
    );
    assert.equal(await page.locator(".kme-history > li").count(), 2);
    const revised = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)),
      "echostudy-v1:" + USER_ONE,
    );
    assert.ok(revised.masteryDecks[0].revision > 1);
    assert.equal(
      revised.masteryDecks[0].attempts[1].checklist[0].label,
      "Protected assets",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () =>
        document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
    );
    await page.screenshot({
      path: "../mastery-mobile-preview.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS mastery hierarchy, source hiding, API failure recovery, reload persistence, manual/AI review, scheduler, existing data preservation and mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
