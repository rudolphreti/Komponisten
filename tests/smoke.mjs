import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.getByRole('heading',{name:'Walther von der Vogelweide',exact:true}).waitFor();
assert.equal(await page.locator('.list-item').count(),39);
await page.screenshot({path:'/tmp/klangspuren.png',fullPage:true});
const overflows=await page.locator('.export-root .back').evaluateAll(els=>els.map((e,i)=>({index:i+1,scroll:e.scrollHeight,height:e.clientHeight})).filter(e=>e.scroll>e.height+2));console.log('Overflows',overflows);
await page.getByLabel('Karten durchsuchen').fill('Mozart');assert.equal(await page.locator('.list-item').count(),2);await page.getByLabel('Karten durchsuchen').fill('');
await page.getByLabel('Projekttitel').fill('Testprojekt');await page.waitForTimeout(800);await page.reload();await page.getByRole('heading',{name:'Walther von der Vogelweide',exact:true}).waitFor();assert.equal(await page.getByLabel('Projekttitel').inputValue(),'Testprojekt');
const downloadPromise=page.waitForEvent('download',{timeout:120000});await page.getByRole('button',{name:'PDF exportieren'}).click();
try{const file=await downloadPromise;await file.saveAs('/tmp/klangspuren-test.pdf');console.log('PDF downloaded')}catch(e){console.log('NOTICE',await page.locator('.toast').textContent());throw e}
assert.deepEqual(errors,[]);console.log('Smoke checks passed');await browser.close();
