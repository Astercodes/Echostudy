const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {installAuthMock,enterWorkspace,USER_ONE}=require('./auth-mock.cjs');
(async()=>{
 const {initialState,today}=await import('../src/model.js');
 const data=initialState(),day=today();
 const goal=data.goals[0];
 data.plans={[day]:[{id:'linked-study',title:'Planner study example',objective:'Explain the main idea',start:600,end:630,kind:'deep',goalId:goal.id,goalIds:[goal.id],intention:'chew'}]};
 data.sessions=[];data.timer=null;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await installAuthMock(page);
 await page.addInitScript(({data,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(data));},{data,key:'echostudy-v1:'+USER_ONE});
 await page.goto('http://127.0.0.1:5183');await enterWorkspace(page);
 await page.getByRole('button',{name:'Study workspace',exact:true}).click();
 await page.getByRole('heading',{name:'Planner study example',exact:true}).waitFor();
 await page.getByRole('button',{name:'Set your study intention',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('What are you studying?',{exact:true}).fill('Scheduled from Study');
 await dialog.locator('textarea').fill('Explain a concept clearly');
 await dialog.locator('.planner-goal-options input').first().check();
 await dialog.getByLabel('Start now',{exact:true}).uncheck();
 await dialog.getByLabel('Scheduled start',{exact:true}).fill('11:00');
 await dialog.getByRole('button',{name:'Schedule study',exact:true}).click();
 await page.getByRole('heading',{name:'Scheduled from Study',exact:true}).waitFor();
 await page.getByRole('button',{name:'24-hour planner',exact:true}).click();
 await page.locator('.plan-row').filter({hasText:'Scheduled from Study'}).waitFor();
 assert.equal(await page.locator('.plan-row').count(),2);
 await page.locator('.plan-row').filter({hasText:'Planner study example'}).getByRole('button',{name:'Start Planner study example',exact:true}).click();
 assert.equal(await dialog.getByLabel('What are you studying?',{exact:true}).inputValue(),'Planner study example');
 assert.equal(await dialog.locator('.study-intention-picker .selected strong').innerText(),'Chew');
 await dialog.getByRole('button',{name:'Start focused study',exact:true}).click();
 await page.waitForFunction(key=>Boolean(JSON.parse(localStorage.getItem(key)).timer),'echostudy-v1:'+USER_ONE);
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),'echostudy-v1:'+USER_ONE);
 assert.equal(saved.timer.blockId,'linked-study');assert.equal(saved.plans[day].length,2);
 assert.deepEqual(errors,[]);console.log('PASS planner → upcoming study, Study → planner, prefill and duplicate-free launch');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
