import fs from 'node:fs';import path from 'node:path';
import{repoRelativeSource}from'../../../port/v2/tools/creature-animation/record-source.mjs';
const root=path.resolve(import.meta.dirname,'../../..');
export const canonicalPath=p=>path.relative(root,path.resolve(root,p)).split(path.sep).join('/');
export const isCanonicalPath=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!p.startsWith('../')&&canonicalPath(p)===p;
/** Exact files the registered fit consumes, plus its authoring manifest and declaration. */
export function expectedFitInputPaths(f){
 const d=f.dir,m=f.markingsDir,record=JSON.parse(fs.readFileSync(d+'/record.json')),parts=JSON.parse(fs.readFileSync(d+'/parts/manifest.json'));
 const out=[d+'/record.json',d+'/binding.json',d+'/parts/manifest.json',d+'/parts/keyed.png',d+'/parts/atlas/'+parts.creatureId+'.png',repoRelativeSource(record.source)];
 if(fs.existsSync(m+'/markings.json')){out.push(m+'/markings.json');const markings=JSON.parse(fs.readFileSync(m+'/markings.json'));for(const v of Object.values(markings.patterns??{}))if(v?.file)out.push(m+'/'+v.file);}
 if(f.declarationPath)out.push(f.declarationPath);
 return[...new Set(out.map(canonicalPath))].sort();
}
