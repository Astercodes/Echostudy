const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.ECHO_BROWSER || undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await installAuthMock(page);
  await page.goto(process.env.ECHO_URL || "http://127.0.0.1:5180", {
    waitUntil: "domcontentloaded",
  });
  await enterWorkspace(page);
  await page
    .getByRole("heading", { name: "Make room for becoming." })
    .waitFor();
  await page
    .getByRole("button", { name: "Begin a session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start focused study", exact: true })
    .click();
  await page.locator(".timer-digits").waitFor();
  await page
    .getByLabel("Session notes")
    .fill("Transformers change voltage through electromagnetic induction.");
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.locator(".timer-digits").innerText();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator(".timer-digits").innerText(), paused);
  await page.reload();
  await page
    .getByRole("button", { name: "Study workspace", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Session notes").inputValue(),
    "Transformers change voltage through electromagnetic induction.",
  );
  assert.equal(await page.locator(".timer-digits").innerText(), paused);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish & reflect", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .locator("textarea")
    .fill("I can explain the turns ratio. I need to review induction.");
  await page
    .getByRole("button", { name: "Complete session", exact: true })
    .click();
  const state = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("echostudy-v1:11111111-1111-4111-8111-111111111111"),
    ),
  );
  assert.equal(state.sessions.length, 1);
  assert.ok(state.sessions[0].actualMs >= 1000);
  assert.equal(state.timer, null);
  console.log("PASS timer start, pause, reload recovery, notes and reflection");
  await page
    .getByRole("button", { name: "24-hour planner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add time block", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("What is this time for?").fill("Overlapping test");
  await dialog
    .getByRole("button", { name: "Save time block", exact: true })
    .click();
  await dialog.getByRole("alert").filter({ hasText: "overlaps" }).waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  console.log("PASS planner overlap rejection");
  await page.getByRole("button", { name: "Goals", exact: true }).click();
  await page.getByRole("button", { name: "New goal", exact: true }).click();
  await page
    .getByLabel("What capacity or outcome are you building?")
    .fill("Build scientific writing capacity");
  await page.getByRole("button", { name: "Save goal", exact: true }).click();
  await page
    .getByText("Build scientific writing capacity", { exact: true })
    .waitFor();
  console.log("PASS create goal");
  await page
    .getByRole("button", { name: "Knowledge tree", exact: true })
    .click();
  await page.getByRole("button", { name: "Transformers", exact: true }).click();
  await page
    .getByRole("button", { name: "Grow a branch", exact: true })
    .click();
  await page.getByLabel("Concept name", { exact: true }).fill("Turns ratio");
  await page
    .getByLabel("Your explanation, examples & questions")
    .fill("Voltage ratio follows winding turns ratio.");
  await page.getByRole("button", { name: "Save concept", exact: true }).click();
  await page
    .getByRole("heading", { name: "Turns ratio", exact: true })
    .waitFor();
  console.log("PASS grow knowledge branch");
  await page
    .getByRole("button", { name: "Resource library", exact: true })
    .click();
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page
    .getByRole("dialog")
    .locator("input[type=file]")
    .setInputFiles({
      name: "learning.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Learning connects new ideas to existing knowledge. Deliberate reflection makes knowledge useful.",
      ),
    });
  await page
    .getByRole("button", { name: "Add to library", exact: true })
    .click();
  await page.locator(".text-document").waitFor();
  await page.locator(".text-document .prewrap").evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await page
    .getByRole("button", { name: "Save highlight", exact: true })
    .click();
  await page
    .getByLabel("Explain the idea in your own words")
    .fill("Connect an insight to a concept before collecting more.");
  await page
    .getByRole("dialog")
    .getByText("Turns ratio", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save connected note", exact: true })
    .click();
  await page.locator(".reader-note").waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Resource library", exact: true })
    .click();
  await page.locator(".resource-card").first().click();
  await page.locator(".text-document").waitFor();
  await page.waitForFunction(() =>
    document
      .querySelector(".text-document")
      ?.textContent.includes("Deliberate reflection"),
  );
  await page.locator(".reader-note").waitFor();
  console.log(
    "PASS file upload, reading, highlight, concept linking, IndexedDB persistence",
  );
  await page.getByRole("button", { name: "Reflection", exact: true }).click();
  await page
    .getByLabel("What stretched your mind today?")
    .fill("The relationship between knowledge and application.");
  await page
    .getByRole("button", { name: "Save today's reflection", exact: true })
    .click();
  await page.getByRole("button", { name: "Growth", exact: true }).click();
  await page.locator(".history-row").waitFor();
  console.log("PASS daily reflection and growth record");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  );
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Knowledge tree", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/mobile-tree.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  );
  assert.deepEqual(errors, []);
  console.log("PASS mobile layout, navigation, no runtime errors");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
