const { chromium } = require("playwright");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const assert = require("node:assert/strict");
(async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf
    .addPage([600, 800])
    .drawText("Concepts grow through meaningful connections.", {
      x: 60,
      y: 700,
      size: 18,
      font,
    });
  pdf
    .addPage([600, 800])
    .drawText("Reflection turns study into understanding.", {
      x: 60,
      y: 700,
      size: 18,
      font,
    });
  const bytes = await pdf.save();
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.ECHO_BROWSER || undefined,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.ECHO_URL || "http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Resource library", exact: true })
    .click();
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page
    .getByRole("dialog")
    .locator("input[type=file]")
    .setInputFiles({
      name: "study-fixture.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(bytes),
    });
  await page
    .getByRole("button", { name: "Add to library", exact: true })
    .click();
  await page.locator(".textLayer span").first().waitFor({ timeout: 30000 });
  assert.ok(
    (await page.locator(".textLayer").innerText()).includes(
      "meaningful connections",
    ),
  );
  await page
    .locator(".textLayer span")
    .first()
    .evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
  await page
    .getByRole("button", { name: "Save highlight", exact: true })
    .click();
  await page
    .getByLabel("Explain the idea in your own words")
    .fill("Knowledge becomes useful through connections.");
  await page
    .getByRole("button", { name: "Save connected note", exact: true })
    .click();
  await page.locator(".saved-highlights span").first().waitFor();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector(".textLayer")
      ?.textContent.includes("Reflection turns"),
  );
  await page
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.querySelector(".textLayer")?.textContent.includes("Concepts grow"),
  );
  await page.locator(".saved-highlights span").first().waitFor();
  await page.screenshot({
    path: "test-results/pdf-reader.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS PDF upload, canvas rendering, selectable text, permanent highlight, page navigation",
  );
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  assert.equal(
    await page
      .locator(".sidebar")
      .evaluate((el) => Math.round(el.getBoundingClientRect().right)),
    0,
  );
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  console.log("PASS mobile sidebar is fully hidden when closed");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
