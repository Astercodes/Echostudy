const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
    await page.goto('http://127.0.0.1:5181/login');
    await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
    await page.getByPlaceholder('you@example.com').fill('preview@example.com');
    await page.getByPlaceholder('Enter your password', { exact: true }).fill('PreviewOnly123');
    await page.getByRole('button', { name: 'Show password' }).click();
    assert.equal(await page.getByPlaceholder('Enter your password', { exact: true }).getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await page.locator('.auth-garden img').evaluate(img => img.decode());
    await page.screenshot({ path: 'tests/auth-desktop-preview.png', fullPage: true });
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await page.getByRole('heading', { name: 'A fresh way back in.' }).waitFor();
    await page.getByRole('button', { name: 'Create an account' }).click();
    await page.getByRole('heading', { name: 'Start your next chapter.' }).waitFor();
    assert.equal(await page.locator('input').count(), 4);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.screenshot({ path: 'tests/auth-mobile-preview.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log('PASS login, password visibility, recovery and signup navigation, mobile layout');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
