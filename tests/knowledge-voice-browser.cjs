const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(page);
    await page.addInitScript(() => {
      window.testStreams = [];
      const gum = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices,
      );
      navigator.mediaDevices.getUserMedia = async (args) => {
        if (window.denyAudio)
          throw new DOMException("Denied", "NotAllowedError");
        const stream = await gum(args);
        window.testStreams.push(stream);
        return stream;
      };
      class Speech {
        start() {
          window.testSpeech = this;
        }
        stop() {
          this.onend?.();
        }
      }
      window.SpeechRecognition = Speech;
    });
    await page.goto("http://127.0.0.1:5180");
    await enterWorkspace(page);
    const openTree = async () => {
      await page
        .getByRole("button", { name: "Knowledge tree", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Concept: Transformers", exact: true })
        .click();
    };
    await openTree();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    const group = page.getByRole("group", {
      name: "Audio for Foundations",
      exact: true,
    });
    await page
      .getByRole("textbox", { name: "Foundations", exact: true })
      .fill("My existing explanation.");
    await group
      .getByRole("button", { name: "Record audio", exact: true })
      .click();
    await group.getByRole("button", { name: /Stop recording/ }).waitFor();
    await page.waitForFunction(() => Boolean(window.testSpeech));
    await group.getByRole("button", { name: /Stop recording · 2s/ }).waitFor();
    await page.evaluate(() => {
      const result = [{ transcript: "Voltage changes with turns ratio." }];
      result.isFinal = true;
      window.testSpeech.onresult({ results: [result] });
      window.testSpeech.onresult({ results: [result] });
    });
    await group.getByRole("button", { name: /Stop recording/ }).click();
    await group.locator("audio").waitFor();
    await group
      .getByRole("button", { name: "Append transcript", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Foundations", exact: true })
        .inputValue(),
      "My existing explanation.\n\nVoltage changes with turns ratio.",
    );
    assert(
      await page.evaluate(() =>
        window.testStreams.every((s) =>
          s.getTracks().every((t) => t.readyState === "ended"),
        ),
      ),
    );
    await page.getByRole("tab", { name: /Definitions/ }).click();
    assert.equal(await page.locator("audio").count(), 0);
    await page.getByRole("tab", { name: /Foundations/ }).click();
    await group
      .getByRole("button", { name: "Show recordings (1)", exact: true })
      .click();
    await group.locator("audio").waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.reload();
    await openTree();
    await page.getByRole("button", { name: "Peel", exact: true }).click();
    await group
      .getByRole("button", { name: "Show recordings (1)", exact: true })
      .click();
    await group.locator("audio").waitFor();
    assert.equal(
      await group
        .getByRole("textbox", {
          name: "Transcript for Foundations",
          exact: true,
        })
        .inputValue(),
      "Voltage changes with turns ratio.",
    );
    assert.equal(
      await group
        .getByRole("button", { name: "Transcript inserted", exact: true })
        .isDisabled(),
      true,
    );
    await group
      .getByRole("button", { name: "Record audio", exact: true })
      .click();
    await group.getByRole("button", { name: /Stop recording/ }).waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.waitForFunction(() =>
      window.testStreams.every((s) =>
        s.getTracks().every((t) => t.readyState === "ended"),
      ),
    );
    await page.getByRole("button", { name: "Chew", exact: true }).click();
    await page.evaluate(() => (window.denyAudio = true));
    await page
      .getByRole("button", { name: "Record audio", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Microphone access was denied" })
      .waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.evaluate(() => {
      window.denyAudio = false;
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;
    });
    await page
      .getByRole("button", { name: "Regurgitate", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Record audio", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "cannot generate transcripts" })
      .waitFor();
    await page.getByRole("button", { name: /Stop recording/ }).click();
    await page.locator("audio").waitFor();
    await page.screenshot({ path: "test-results/knowledge-voice.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS native synthetic-microphone recording, transcript insertion, duplicate events, field isolation, reload, cleanup, permission denial and unsupported transcription",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
