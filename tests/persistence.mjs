import{chromium,expect}from'@playwright/test';import assert from'node:assert/strict';import{mkdtemp,readFile}from'node:fs/promises';
const profile=await mkdtemp('/tmp/klangspuren-profile-');const options={executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox'],viewport:{width:1440,height:1000}};
let context=await chromium.launchPersistentContext(profile,options);
try{
 let page=await context.newPage();await page.goto('http://localhost:5173');await page.locator('.grid-tile').first().waitFor();
 await page.locator('.tile-heading').nth(1).click();await page.getByLabel('Name',{exact:true}).fill('Mein gespeicherter Komponist');await page.getByRole('button',{name:'Bild & Ausschnitt'}).click();
 const png=await readFile('public/portraits/12.png');const large=Buffer.concat([png,Buffer.alloc(4*1024*1024)]);
 await page.locator('input[type=file]').nth(1).setInputFiles({name:'large.png',mimeType:'image/png',buffer:large});
 await expect(page.locator('.card-holder img')).toHaveAttribute('src',/^data:/,{timeout:15000});
 await page.getByLabel('Vergrößerung').fill('1.25');await page.getByLabel('Horizontal').fill('123');await page.getByLabel('Karten durchsuchen').fill('gespeicherter');await page.getByRole('button',{name:'Rückseite',exact:true}).click();
 await page.getByLabel('Projekttitel').fill('Nach dem Schließen');
 const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('klangspuren:state:v1')));assert.equal(snapshot.project.title,'Nach dem Schließen');assert.ok(snapshot.project.cards[1].image.startsWith('local-image:'));assert.ok(JSON.stringify(snapshot).length<200000);
 await context.close();context=await chromium.launchPersistentContext(profile,options);page=await context.newPage();
 // Restoration must work without fetching the default project.
 await page.route('**/default-project.json',r=>r.abort());await page.goto('http://localhost:5173');await page.locator('.grid-tile').first().waitFor();
 await expect(page.getByLabel('Projekttitel')).toHaveValue('Nach dem Schließen');assert.equal(await page.locator('.grid-tile').count(),1);await expect(page.getByLabel('Karten durchsuchen')).toHaveValue('gespeicherter');assert.equal(await page.locator('.card-holder .back').count(),1);
 await expect(page.getByLabel('Vergrößerung')).toHaveValue('1.25');await expect(page.getByLabel('Horizontal')).toHaveValue('123');
 await page.getByRole('button',{name:'Vorderseite',exact:true}).click();assert.ok((await page.locator('.card-holder img').getAttribute('src')).length>5*1024*1024);
 await page.getByRole('button',{name:'Text & Inhalt'}).click();await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Mein gespeicherter Komponist');
 // Simulate quota exhaustion and ensure the UI never claims the edit was saved.
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}});await page.getByLabel('Projekttitel').fill('Speicher voll');await expect(page.locator('.save-state')).toHaveText('Nicht gespeichert');await expect(page.locator('.toast')).toContainText('Browserspeicher');
 const migration=await context.newPage();await migration.goto('http://localhost:5173');await migration.locator('.grid-tile').first().waitFor();
 const legacy=JSON.parse(await readFile('public/default-project.json','utf8'));legacy.title='Bisheriges Projekt';
 await migration.evaluate(async project=>{localStorage.setItem('klangspuren:state:v1','broken JSON');await new Promise((resolve,reject)=>{const r=indexedDB.open('klangspuren',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(project,'current');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}})},legacy);
 await migration.addInitScript(()=>localStorage.setItem('klangspuren:state:v1','broken JSON'));await migration.reload();await expect(migration.getByLabel('Projekttitel')).toHaveValue('Bisheriges Projekt');await expect(migration.locator('.toast')).toContainText('lokale Speicher');
 assert.equal(await migration.evaluate(()=>JSON.parse(localStorage.getItem('klangspuren:state:v1')).project.title),'Bisheriges Projekt');
 console.log('Immediate save, browser restart, editor state, large image restoration, quota warning, corrupt-state recovery and legacy migration passed');
}finally{await context.close()}
