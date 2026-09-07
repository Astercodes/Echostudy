const { chromium } = require('playwright');
const { installAuthMock, enterWorkspace } = require('./auth-mock.cjs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, channel:process.env.ECHO_BROWSER || undefined});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await installAuthMock(page);
    await page.goto('http://127.0.0.1:5180');
    await enterWorkspace(page);
    await page.getByRole('button', {name:'Open your profile',exact:true}).click();
    await page.getByRole('dialog', {name:'Your profile'}).waitFor();
    await page.keyboard.press('Escape');
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button', {name:'Open account menu',exact:true}).click();
    await page.getByRole('button', {name:'Log out',exact:true}).click();
    await page.getByRole('heading', {name:'Make time. Grow your mind. Become more.'}).waitFor();
    assert.equal(new URL(page.url()).pathname,'/');
    await page.reload();
    await page.getByRole('heading', {name:'Make time. Grow your mind. Become more.'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Open account menu',exact:true}).count(),0);
    assert.deepEqual(errors,[]);
    console.log('PASS desktop profile, mobile account menu, logout to landing and signed-out reload');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
