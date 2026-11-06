import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {test} from 'node:test';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),source=path.join(root,'audits/O3_20261103/w3-static/whale-observed-r02/packet');
const pairs=[['actual-eye-upper-head','whole-source-body-remainder'],['actual-pleated-lower-head-jaw','whole-source-body-remainder']];
function trial(field){const scratch=fs.mkdtempSync(path.join(root,'audits/.paint-boundary-pairs-'));try{
 const packet=path.join(scratch,'packet'),out=path.join(scratch,'fit');fs.mkdirSync(packet);
 for(const name of ['master.png','authoring.json','presence.json','subject-source.json'])fs.copyFileSync(path.join(source,name),path.join(packet,name));
 const author=JSON.parse(fs.readFileSync(path.join(packet,'authoring.json')));if(field!==undefined)author.paintBoundaryPairs=field;fs.writeFileSync(path.join(packet,'authoring.json'),JSON.stringify(author,null,2)+'\n');
 const r=spawnSync(process.execPath,[fileURLToPath(new URL('./intake-authored.mjs',import.meta.url)),packet,out],{cwd:root,encoding:'utf8',timeout:120000});
 return {code:r.status,log:r.stdout+r.stderr,receipt:fs.existsSync(out+'/receipt.json')?JSON.parse(fs.readFileSync(out+'/receipt.json')).surfaces:null,files:fs.existsSync(out)?fs.readdirSync(out):[]};
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}}
test('default source intake leaves excluded boundaries independent',()=>{const r=trial(undefined);assert.equal(r.code,0,r.log);assert.equal(r.receipt.weldedExcludedBoundaries,0);assert.equal(r.receipt.sourceCoordinateChanges,0);});
test('explicit continuous head/body boundaries reach the existing compiler',()=>{const r=trial(pairs);assert.equal(r.code,0,r.log);assert.equal(r.receipt.weldedExcludedBoundaries,2);assert.deepEqual(r.receipt.paintBoundaryPairs,pairs);assert.equal(r.receipt.sourceCoordinateChanges,0);});
test('unknown painted boundary refuses instead of silently falling back',()=>{const r=trial([['nonexistent-owner','whole-source-body-remainder']]);assert.notEqual(r.code,0,'unknown pair was silently ignored');assert.match(r.log,/paint boundary part pairs/);});
