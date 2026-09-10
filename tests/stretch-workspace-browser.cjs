const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(page);
    await page.goto("http://127.0.0.1:5180");
    await enterWorkspace(page);
    await page.reload();
    const button = (name) => page.getByRole("button", { name, exact: true });
    const field = (name) =>
      page
        .locator("label.field")
        .filter({ has: page.getByText(name, { exact: true }) })
        .locator("input, textarea, select")
        .first();
    await button("Study workspace").click();
    assert.equal(await page.getByText("Turn understanding").count(), 0);
    await button("Stretch workspace").click();
    await button("Discover").click();
    for (const text of [
      "Knowledge-driven",
      "Gap-driven",
      "Goal-driven",
      "Life-driven",
      "User-created",
    ])
      assert(
        await page
          .locator(".stretch-source-cards")
          .getByText(text, { exact: true })
          .isVisible(),
      );
    await field("Find knowledge to practise").fill("SBI");
    await field("Knowledge starting point")
      .locator("option")
      .filter({ hasText: "SBI" })
      .waitFor({ state: "attached" });
    const options = await field("Knowledge starting point")
      .locator("option")
      .evaluateAll((all) =>
        all.map((o) => ({ value: o.value, text: o.textContent })),
      );
    const leaf = options.find((o) => o.value && /SBI/.test(o.text));
    assert(leaf);
    await field("Knowledge starting point").selectOption(leaf.value);
    await page
      .getByRole("heading", { name: "Rewrite three vague feedback statements" })
      .waitFor();
    await page
      .locator(".stretch-environments button")
      .filter({ hasText: "Simulated" })
      .click();
    await button("Shape this stretch").click();
    await page
      .getByText("Connections, environment & schedule", { exact: true })
      .click();
    await field("Repeat practice").selectOption("weekly");
    await button("Save stretch").click();
    await button("Start stretch").filter({ visible: true }).first().click();
    await page
      .getByRole("heading", { name: "Try a constructed challenge" })
      .waitFor();
    const response = page.locator(".practice-step textarea").first();
    await response.fill(
      "At yesterday's meeting you interrupted twice; the speaker could not finish.",
    );
    await button("Pause timer").click();
    await field("Accuracy").selectOption("Developing");
    await button("Save & return").click();
    await button("Study workspace").click();
    await button("Stretch workspace").click();
    await button("Resume practice").click();
    assert.match(
      await page.locator(".practice-step textarea").first().inputValue(),
      /interrupted twice/,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "test-results/stretch-player-desktop.png" });
    await button("Review result & harvest").click();
    await field("What did you do, and what happened?").fill(
      "Rewrote three statements and rehearsed the difficult response.",
    );
    await field("Harvest · What did this practice produce?").fill(
      "Three specific feedback statements.",
    );
    await field("What do you need to return to Study to understand?").fill(
      "How to distinguish observation from interpretation.",
    );
    await button("Save practice result").click();
    await page
      .getByRole("heading", { name: "Harvest your results." })
      .waitFor();
    assert(
      await page
        .getByText("Three specific feedback statements.", { exact: true })
        .isVisible(),
    );
    await button("My practice").click();
    assert.equal(await button("Start stretch").count(), 1);
    await page.reload();
    await button("Stretch workspace").click();
    assert.equal(await button("Start stretch").count(), 1);
    await button("Harvest").click();
    await button("Mark gap addressed").click();
    assert(
      await page
        .getByRole("heading", { name: "Study gap addressed" })
        .isVisible(),
    );
    await button("My practice").click();
    await button("Record result").click();
    await field("What did you do, and what happened?").fill(
      "The second attempt was clearer.",
    );
    await button("Save practice result").click();
    await button("Attempt history").click();
    await button("Compare with previous attempt").click();
    await page
      .getByRole("dialog", { name: "Compare practice attempts" })
      .waitFor();
    assert.equal(await page.locator(".stretch-comparison tbody tr").count(), 9);
    await button("Close dialog").click();
    await button("Discover").click();
    await page
      .locator(".stretch-source-cards button")
      .filter({ hasText: "Life-driven" })
      .click();
    await field("What is happening in your life?").fill(
      "I have a feedback conversation on Friday",
    );
    await field("When is this opportunity?").fill("2026-09-18");
    assert(
      (await page.locator(".stretch-related input[type=checkbox]").count()) > 0,
    );
    await page.locator(".stretch-related input[type=checkbox]").first().check();
    await button("Turn this into a stretch").click();
    await button("Save stretch").click();
    await button("Discover").click();
    await page
      .locator(".stretch-source-cards button")
      .filter({ hasText: "Goal-driven" })
      .click();
    await field("Goal to practise toward").selectOption("g5");
    await field("Capability needed for this goal").fill(
      "explain a difficult idea clearly",
    );
    await field("Knowledge needed for this goal").fill(
      "the underlying principles",
    );
    await field("Evidence that would demonstrate progress").fill(
      "A listener can explain the idea back",
    );
    await button("Shape this stretch").click();
    assert.match(
      await field("What ability will you use or stretch?").inputValue(),
      /explain a difficult idea clearly/,
    );
    await button("Save stretch").click();
    await button("Discover").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "test-results/stretch-discover-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () =>
        document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: "test-results/stretch-discover-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS separate workspaces, five sources, specific SBI task, guided practice persistence, pause, Harvest, automatic repeat, gap resolution, life matches and mobile layout",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
