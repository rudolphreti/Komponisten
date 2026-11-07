export const STATE_KEY='klangspuren:state:v1';
const imageKeys=new Map();
export function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('klangspuren',1);request.onupgradeneeded=()=>request.result.createObjectStore('projects');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function read(key){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
export async function prepareImages(project){
 const missing=[...new Set(project.cards.map(c=>c.image).filter(i=>i.startsWith('data:')&&!imageKeys.has(i)))];
 if(!missing.length)return;
 const entries=missing.map(image=>[image,'image:'+crypto.randomUUID()]);const db=await database();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');for(const[image,key]of entries)tx.objectStore('projects').put(image,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}
 for(const[image,key]of entries)imageKeys.set(image,key);
}
export function writeState(project,view){
 const cards=project.cards.map(c=>({...c,image:imageKeys.has(c.image)?'local-'+imageKeys.get(c.image):c.image}));
 localStorage.setItem(STATE_KEY,JSON.stringify({version:1,project:{...project,cards},view}));
}
export function validProject(p){return p?.version===1&&typeof p.title==='string'&&Array.isArray(p.cards)&&p.cards.length>0&&p.cards.length<=200&&p.cards.every(c=>c&&['id','name','years','epoch','vienna','traces','listen','notes','caption','image'].every(k=>typeof c[k]==='string')&&(!c.image||/^data:image\/(png|jpeg|webp);base64,/.test(c.image)||/^\/portraits\/\d+\.png$/.test(c.image))&&Number.isFinite(c.zoom)&&c.zoom>=.01&&c.zoom<=100&&[c.x,c.y].every(Number.isFinite))}
export async function restoreState(){
 let warning='';
 try{const raw=localStorage.getItem(STATE_KEY);if(raw){const state=JSON.parse(raw);if(state.version!==1||!state.project?.cards)throw Error();const cards=await Promise.all(state.project.cards.map(async c=>{if(typeof c.image==='string'&&c.image.startsWith('local-image:')){const key=c.image.slice(6),image=await read(key);if(typeof image!=='string')throw Error();imageKeys.set(image,key);return{...c,image}}return c}));const project={...state.project,cards};if(!validProject(project))throw Error();return{project,view:state.view||{}}}}
 catch{warning='Der lokale Speicher konnte nicht vollständig gelesen werden. Bitte die Projektdatei als Sicherung aufbewahren.'}
 try{const project=await read('current');if(validProject(project)){await prepareImages(project);return{project,view:{},warning}}}catch{warning||='Der lokale Speicher ist nicht verfügbar. Bitte das Projekt als Datei sichern.'}
 return{warning};
}
