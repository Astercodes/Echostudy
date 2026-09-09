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
    const btn = (name) => p.getByRole("button", { name, exact: true });
    const box = (name) => p.getByRole("textbox", { name, exact: true });
    const select = (name) => p.getByRole("combobox", { name, exact: true });
    await btn("Knowledge Ecosystem").click();
    await select("Life-area tree").selectOption("leadership");
    await btn("Fruit: Giving Effective Corrective Feedback").click();
    await btn("Peel").click();
    await box("Foundations").fill("Preserve the original foundations.");
    await p.locator(".knowledge-sources > summary").click();
    await p.getByText("Upload or add a web resource", { exact: true }).click();
    await box("Resource title").fill("Feedback lecture");
    await box("Web / YouTube / report URL").fill(
      "https://www.youtube.com/watch?v=feedback",
    );
    await box("Page, chapter or timestamp for new reference").fill(
      "12:40–15:10",
    );
    await box("Citation or evidence note for new reference").fill(
      "Lecture, 2026; examples of useful feedback.",
    );
    await btn("Save & link web resource").click();
    await p
      .getByRole("dialog")
      .locator(".source-reference")
      .getByText("Feedback lecture", { exact: true })
      .waitFor();
    await btn("Done").click();
    await btn("Pluck").click();
    await btn("Copy & study independently").click();
    await box("Fruit content").fill("My independent study content.");
    await btn("Save study content").click();
    await p.getByText("Study content saved.", { exact: true }).waitFor();
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Chew", exact: true })
      .click();
    const studyText = p
      .locator(".learning-workspace .voice-field textarea")
      .first();
    await studyText.fill("Working the idea with a counterexample.");
    await p.locator(".knowledge-sources > summary").click();
    await select("Library resource").selectOption({
      label: "Feedback lecture",
    });
    await box("Page, chapter or timestamp for new reference").fill("18:00");
    await btn("Link library resource").click();
    await p.getByText("Upload or add a web resource", { exact: true }).click();
    await p
      .getByLabel("Upload PDF, text, audio or video", { exact: true })
      .setInputFiles({
        name: "practice-notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Supporting study material"),
      });
    await p
      .getByRole("dialog")
      .locator(".source-reference")
      .getByText("practice-notes.txt", { exact: true })
      .waitFor();
    await btn("Done").click();
    await btn("Return to ecosystem").click();
    await p.locator(".knowledge-notebook > summary").click();
    await select("Notebook collection").selectOption("pluck");
    await btn("Resume independent study").click();
    assert.equal(
      await box("Fruit content").inputValue(),
      "My independent study content.",
    );
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Peel", exact: true })
      .click();
    assert.equal(
      await box("Foundations").inputValue(),
      "Preserve the original foundations.",
    );
    await p.locator(".knowledge-sources > summary").click();
    await p
      .getByRole("dialog")
      .locator(".source-reference")
      .getByText("Feedback lecture", { exact: true })
      .waitFor();
    await btn("Done").click();
    await btn("Return to ecosystem").click();
    await p.reload();
    await btn("Knowledge Ecosystem").click();
    await p.locator(".knowledge-notebook > summary").click();
    await select("Notebook collection").selectOption("pluck");
    await btn("Resume independent study").click();
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Chew", exact: true })
      .click();
    assert.equal(
      await p
        .locator(".learning-workspace .voice-field textarea")
        .first()
        .inputValue(),
      "Working the idea with a counterexample.",
    );
    const state = await p.evaluate(() =>
      JSON.parse(
        localStorage.getItem(
          "echostudy-v1:11111111-1111-4111-8111-111111111111",
        ),
      ),
    );
    const original = state.concepts.find(
      (n) => n.id === "ecosystem-management-v1:fruit-feedback",
    );
    assert.equal(
      original.learning.peel.foundations,
      "Preserve the original foundations.",
    );
    assert.notEqual(original.description, "My independent study content.");
    assert.equal(state.resources.length, 2);
    assert.equal(
      state.resources.find((r) => r.title === "Feedback lecture").knowledgeRefs
        .length,
      3,
    );
    await p.locator(".knowledge-sources > summary").click();
    await p.screenshot({
      path: "test-results/notebook-component-resources.png",
    });
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "test-results/notebook-mobile.png" });
    await p.setViewportSize({ width: 1440, height: 1000 });
    await btn("Done").click();
    await btn("Return to ecosystem").click();
    await p.screenshot({ path: "test-results/notebook-records.png" });
    await btn("Resource library").click();
    await p
      .locator(".resource-card")
      .filter({ hasText: "Feedback lecture" })
      .click();
    await p
      .getByText("Referenced in the ecosystem · 3", { exact: true })
      .click();
    await p.getByText("12:40–15:10", { exact: true }).first().waitFor();
    await btn("Knowledge Ecosystem").click();
    await select("Life-area tree").selectOption("leadership");
    for (const name of [
      "Leadership & influence",
      "Grove: Management",
      "Tree: People Management",
    ]) {
      await btn(name).click();
      await btn("Peel").click();
      await p.locator(".knowledge-sources > summary").click();
      assert.equal(
        await p.getByRole("dialog").locator(".source-reference").count(),
        0,
      );
      await select("Library resource").selectOption({
        label: "Feedback lecture",
      });
      await btn("Link library resource").click();
      await btn("Done").click();
    }
    await btn("Plant").click();
    await p.locator(".action-component-review > summary").click();
    await p
      .locator(".action-component-review .voice-field textarea")
      .first()
      .fill("A planting plan kept neatly in the notebook.");
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await p.locator(".knowledge-notebook > summary").click();
    await select("Notebook collection").selectOption("plant");
    await btn("Review planting notes").click();
    await p.locator(".action-component-review > summary").click();
    assert.equal(
      await p
        .locator(".action-component-review .voice-field textarea")
        .first()
        .inputValue(),
      "A planting plan kept neatly in the notebook.",
    );
    await btn("Save & close notes").click();
    assert.deepEqual(errors, []);
    console.log(
      "PASS editable Pluck, saved content, original preservation, notebook reload, inherited component citations, library linking, file upload and mobile layout",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
