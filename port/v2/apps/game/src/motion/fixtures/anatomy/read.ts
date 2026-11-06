import fs from 'node:fs';import {createHash} from 'node:crypto';
const rows=JSON.parse(fs.readFileSync(new URL('./manifest.json',import.meta.url),'utf8')) as {id:string;file:string;sha256:string;recipeHash:string}[];
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
const stable=(v:unknown)=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export function verifyAnatomyFixture(id:string,bytes:Buffer){const row=rows.find(r=>r.id===id);if(!row||hash(bytes)!==row.sha256)throw Error('Anatomy fixture byte identity');const value=JSON.parse(bytes.toString()),{recipeHash,...body}=value;if(recipeHash!==row.recipeHash||hash(stable(body))!==recipeHash)throw Error('Anatomy fixture recipe identity');return value;}
export function readAnatomyFixture(id:string){const row=rows.find(r=>r.id===id);if(!row)throw Error('Unknown anatomy fixture');return verifyAnatomyFixture(id,fs.readFileSync(new URL(row.file,import.meta.url)));}
