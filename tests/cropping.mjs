import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.goto('http://localhost:5173');await page.locator('.list-item').first().waitFor();
 await page.getByRole('button',{name:'Bild & Ausschnitt'}).click();
 const frame=page.locator('.card-holder .portrait-window');await frame.scrollIntoViewIfNeeded();
 const box=await frame.boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+box.width*.7,y+40,{steps:10});await page.mouse.up();
 assert.ok(Number(await page.getByLabel('Horizontal').inputValue())>115,'drag must move beyond old 100% limit');
 const before=await page.getByLabel('Vergrößerung').inputValue();await page.mouse.move(x+30,y);await page.mouse.wheel(0,-500);await page.waitForTimeout(150);
 assert.ok(Number(await page.getByLabel('Vergrößerung').inputValue())>Number(before));
 await page.getByLabel('Vergrößerung').fill('0.4');assert.equal(await frame.locator('img').evaluate(i=>i.style.width),'40%');
 assert.equal(await frame.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Projekt speichern'}).click();await(await pending).saveAs('/tmp/crop-project.json');
 const project=JSON.parse(await readFile('/tmp/crop-project.json','utf8'));assert.ok(project.cards[0].x>100);assert.equal(project.cards[0].zoom,.4);
 // Export just the edited card to exercise the same crop without a lengthy full-deck export.
 project.cards=project.cards.slice(0,1);project.cards[0].x=75;project.cards[0].y=60;
 await page.locator('input[type=file]').first().setInputFiles({name:'crop.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
 await page.waitForTimeout(200);assert.equal(await page.getByLabel('Vergrößerung').inputValue(),'0.4');
 assert.equal(await page.locator('.export-root img').first().evaluate(i=>i.style.left),await frame.locator('img').evaluate(i=>i.style.left));
 const pdf=page.waitForEvent('download');await page.getByRole('button',{name:'PDF exportieren'}).click();await(await pdf).saveAs('/tmp/crop-test.pdf');
 await page.getByRole('button',{name:'Ausschnitt zurücksetzen'}).click();assert.equal(await page.getByLabel('Horizontal').inputValue(),'50');assert.equal(await page.getByLabel('Vergrößerung').inputValue(),'1');
 console.log('Mouse drag beyond bounds, wheel zoom, zoom out, white background, save/reopen, PDF and reset passed');
}finally{await browser.close()}
