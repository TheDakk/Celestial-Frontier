import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';import {inspectArenaSet} from './arena-set.mjs';import {sha256} from './contracts.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const stable=v=>JSON.stringify(v,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
test('arena intake binds full compiler card, context, ground, dimensions and keyed copies; mutations refuse',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-arena-intake-'));try{
  const put=(name,bytes)=>{fs.writeFileSync(path.join(root,name),bytes);return{path:name,sha256:sha256(bytes)};};
  const image=(keyed=false,width=1024)=>{const p=new PNG({width,height:576});p.data.fill(255);if(keyed)for(let i=3;i<width*100*4;i+=4)p.data[i]=0;return PNG.sync.write(p);};
  const full=image(),keyed=image(true),card='SYSTEM CARD - SYNTHETIC TEST ONLY\n  Light: fixture',compiler=put('compiler.txt',Buffer.from(card+'\n\nSUBJECT\nfixture'));
  const context={schema:'cf.arena.proof-context/v1',encounterKind:'wild',worldKey:'fixture',combatants:['a','b'],round:0,biomeFamily:'temperate'};
  const recipe={schema:'cf.arena.authoring-proof/v1',extractedMasks:false,battleContext:context,seed:createHash('sha256').update(stable(context)).digest().readUInt32BE(0),groundLineNormalized:.78,canvasSize:{width:1024,height:576},systemCard:card,systemCardSource:compiler.path,systemCardSourceSha256:compiler.sha256,plates:[]};
  const layers=['far','mid','near'].map((role,i)=>{const source=put(role+'.png',full),runtime=i?put(role+'-keyed.png',keyed):source;recipe.plates.push({sha256:source.sha256,kind:i?'key-painted terrain':'scene',groundLineNormalized:.78});return{role,source,runtime};});
  const manifest={schema:'cf.arena-intake/v1',recipe:put('recipe.json',Buffer.from(JSON.stringify(recipe))),layers};
  const accept=inspectArenaSet(root,manifest);assert.equal(accept.layers.length,3);assert.equal(accept.qualityAccepted,false);assert.equal(accept.layers[0].transparentPixels,0);
  for(const mutate of [r=>r.seed++,r=>r.battleContext.clock=123,r=>r.plates[1].groundLineNormalized=.77,r=>r.systemCard=card.split('\n')[0],r=>r.extractedMasks=true]){
   const bad=structuredClone(recipe);mutate(bad);const m={...manifest,recipe:put('bad.json',Buffer.from(JSON.stringify(bad)))};assert.throws(()=>inspectArenaSet(root,m));
  }
  for(const mutate of [m=>m.layers.reverse(),m=>m.layers[1].runtime=m.layers[1].source,m=>m.layers[1].runtime=put('opaque-mid.png',full),m=>m.layers[2].runtime=put('wrong-size.png',image(true,1025)),m=>m.layers[0].runtime=put('transparent-far.png',keyed)]){const bad=structuredClone(manifest);mutate(bad);assert.throws(()=>inspectArenaSet(root,bad));}
  const changed=PNG.sync.read(full);changed.data[0]=3;const bad=structuredClone(manifest);bad.layers[0].runtime=put('repainted-far.png',PNG.sync.write(changed));assert.throws(()=>inspectArenaSet(root,bad),/changed painted pixels/);
  assert.equal(sha256(fs.readFileSync(path.join(root,'far.png'))),layers[0].source.sha256);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
