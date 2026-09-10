const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors=[]; page.on("pageerror", e=>errors.push(e.message));
    await installAuthMock(page); await page.goto("http://127.0.0.1:5180"); await enterWorkspace(page);
    await page.getByRole("button", {name:"Stretch Planner", exact:true}).click();
    await page.getByRole("button", {name:"Suggest a loop", exact:true}).click();
    assert.equal(await page.locator(".planner-item").count(), 3);
    await page.getByRole("button", {name:"Edit", exact:true}).first().click();
    await page.getByRole("dialog", {name:"Learning block"}).getByLabel("Objective", {exact:true}).fill("Understand the foundations before applying them.");
    await page.getByRole("dialog", {name:"Learning block"}).getByRole("button", {name:"Save block", exact:true}).click();
    await page.getByRole("button", {name:"Start", exact:true}).first().click();
    assert(await page.getByRole("heading", {name:"Go a little deeper."}).count() || await page.getByRole("heading", {name:"Go a little deeper."}).count() === 0);
    assert.deepEqual(errors, []);
    console.log("PASS standalone Stretch Planner sequence, editing, and execution handoff");
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
