const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
    await page.goto(process.env.ECHO_URL || 'http://127.0.0.1:5181', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.eco-sculpture')?.classList.contains('phase-1'), { timeout: 8000 });
    await page.getByRole('button', { name: 'Pause growth cycle' }).click();
    assert.equal(await page.locator('.landing-links a[href="#students"], .landing-links a[href="#lifelong-learners"], .landing-links a[href="#questions"]').count(), 0);
    assert.equal(await page.locator('#how-it-works .problem-insights article').count(), 3);
    await page.locator('#growth-analytics').scrollIntoViewIfNeeded();
    await page.locator('#growth-analytics').screenshot({ path: 'tests/analytics-preview.png' });
    await page.locator('#study-actions').scrollIntoViewIfNeeded();
    await page.locator('.intention-menu button').filter({ hasText: 'Chew' }).click();
    assert.match(await page.locator('.intention-description').innerText(), /Make the reasoning yours/);
    await page.locator('#study-actions').screenshot({ path: 'tests/editorial-study-preview.png' });
    await page.locator('.cultivate-tools button').filter({ hasText: 'Graft' }).click();
    assert.match(await page.locator('.cultivate-result').innerText(), /unexpected connection/);
    await page.locator('.environment-tabs button').filter({ hasText: 'Real world' }).click();
    assert.match(await page.locator('.environment-body').innerText(), /Put the idea to work/);
    await page.locator('#practice').screenshot({ path: 'tests/editorial-stretch-preview.png' });
    await page.locator('.capacity-cloud button').filter({ hasText: 'Leadership' }).click();
    assert.equal(await page.locator('.capacity-display h3').innerText(), 'Leadership');
    for (const image of await page.locator('img[src^="/illustrations/"]').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(img => img.decode());
      assert.ok(await image.evaluate(img => img.naturalWidth > 0));
    }
    assert.equal(await page.locator('.copy-number').count(), 0);
    assert.equal(await page.locator('.product-showcase').count(), 0);
    assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(anchors => anchors.filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash)), []);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const section of await page.locator('main > section, .editorial-section, .ecosystem-story').all()) {
      await section.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow');
    }
    await page.locator('#barns-story').screenshot({ path: 'tests/editorial-barns-mobile-preview.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.vessel-drop').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.deepEqual(errors, []);
    console.log('PASS editorial interactions, illustration loading, navigation anchors, mobile overflow and reduced motion');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
