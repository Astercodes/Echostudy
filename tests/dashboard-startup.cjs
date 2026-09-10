const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { installAuthMock, enterWorkspace } = require('./auth-mock.cjs');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.ECHO_BROWSER || 'msedge' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await installAuthMock(page);
    await page.goto('http://127.0.0.1:5180');
    await enterWorkspace(page);
    await page.locator('.dashboard-plan').waitFor();
    await page.reload();
    await page.locator('.dashboard-plan').waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS sign-in and dashboard reload without runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
