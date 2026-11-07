import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173');await page.locator('.grid-tile').first().waitFor();await page.getByRole('button',{name:'Bild & Ausschnitt'}).click();
 assert.equal(await page.locator('.grid-tile').count(),39);
 const tiles=page.locator('.grid-tile');const first=await tiles.nth(0).boundingBox(),second=await tiles.nth(1).boundingBox();assert.ok(Math.abs(first.y-second.y)<2);assert.ok(second.x>first.x+first.width);
 await page.locator('.card-holder .portrait-window').hover();await page.mouse.wheel(0,-100);await expect(page.getByLabel('Vergrößerung')).toHaveValue('1.05');
 await page.mouse.wheel(0,-100);await expect(page.getByLabel('Vergrößerung')).toHaveValue('1.1');
 await page.mouse.wheel(0,100);await expect(page.getByLabel('Vergrößerung')).toHaveValue('1.05');
 await page.waitForTimeout(300);for(let i=0;i<3;i++){await page.mouse.wheel(0,-10);await page.waitForTimeout(20)}await expect(page.getByLabel('Vergrößerung')).toHaveValue('1.05');await page.mouse.wheel(0,-10);await expect(page.getByLabel('Vergrößerung')).toHaveValue('1.1');
 assert.equal(await tiles.nth(1).locator('img').evaluate(i=>i.style.width),'100%');
 await tiles.nth(1).locator('.tile-heading').click();assert.equal(await page.locator('.card-holder h2').textContent(),'Neidhart');await expect(page.getByLabel('Vergrößerung')).toHaveValue('1');
 await page.getByRole('button',{name:'Text & Inhalt'}).click();await page.getByLabel('Name',{exact:true}).fill('Neidhart bearbeitet');await expect(tiles.nth(1).locator('.tile-heading h2')).toHaveText('Neidhart bearbeitet');
 await page.getByRole('button',{name:'Rückseite',exact:true}).click();assert.equal(await page.locator('.cards-grid .back').count(),39);await page.getByRole('button',{name:'Vorderseite',exact:true}).click();
 await page.getByLabel('Karten durchsuchen').fill('Mozart');assert.equal(await tiles.count(),2);await page.getByLabel('Karten durchsuchen').fill('');
 await page.screenshot({path:'/tmp/grid-desktop.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/grid-mobile.png',fullPage:false});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const mobile=await tiles.nth(0).boundingBox(),mobile2=await tiles.nth(1).boundingBox();assert.ok(Math.abs(mobile.y-mobile2.y)<2);assert.ok(mobile.width<first.width);assert.deepEqual(errors,[]);
 console.log('Responsive grid, selection/editing, front/back, filtering, exact 5-point wheel steps, touchpad accumulation and mobile passed');
}finally{await browser.close()}
