import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {components} from '../C163_REFERENCE_REPAIR_20261002/diagnose-head.mjs';
import {placeRemainderIslands,MAX_SHARE} from '../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
import {authoredRegionOwners} from '../../port/v2/tools/creature-animation/authored-region-owners.mjs';
const base='audits/C183_ISLAND_AUTHORING_20261002',src='audits/C173_SPECIALIZED_REFERENCES_20261002/04-spider-part-ids',out=base+'/04-spider',read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs');
assert(!fs.existsSync(out));const author=json(src+'/authoring.json'),record=json(src+'/fit01/record.json');assert.equal(record.provenance.authoringSha256,sha(read(src+'/authoring.json')));assert.equal(record.geometry.cutoutAssetHash,sha(read(src+'/master.png')));
fs.mkdirSync(out);fs.mkdirSync(out+'/original');fs.mkdirSync(out+'/baseline-fit');const inputs=[];
function copy(from,to){const bytes=read(from);fs.writeFileSync(to,bytes,{flag:'wx'});inputs.push({source:from,snapshot:to,sha256:sha(bytes),bytes:bytes.length});}
function tree(from,to){fs.mkdirSync(to);for(const e of fs.readdirSync(from,{withFileTypes:true})){if(e.isDirectory())tree(from+'/'+e.name,to+'/'+e.name);else copy(from+'/'+e.name,to+'/'+e.name);}}
for(const name of ['master.png','authoring.json','subject-source.json','presence.json'])copy(src+'/'+name,out+'/original/'+name);
for(const name of ['record.json','binding.json','pre-split-binding.json','declaration.json'])copy(src+'/fit01/'+name,out+'/baseline-fit/'+name);
tree(src+'/fit01/parts',out+'/baseline-fit/parts');copy(src+'/conservation-01.json',out+'/original-conservation.json');
copy('audits/G1_AUTO_AUTHOR_20260926/auto-g2c207m/04-spider/score.json',out+'/auto-transfer-refusal.json');
const ownerInfo=authoredRegionOwners(author.parts,author.remainderPart),own=PNG.sync.read(read(src+'/fit01/parts/ownership.png')),key=PNG.sync.read(read(src+'/fit01/parts/keyed.png'));
const colors=new Map(ownerInfo.ownerParts.map((_,i)=>{const k=i+1;return[`${(k*83)%200+35},${(k*137)%200+35},${(k*47)%200+35}`,k];}));
const labels=Uint8Array.from({length:own.width*own.height},(_,i)=>{if(!own.data[i*4+3])return 0;const value=colors.get(`${own.data[i*4]},${own.data[i*4+1]},${own.data[i*4+2]}`);assert(value,'known owner');return value;});
const rem=ownerInfo.ownerParts.findIndex(p=>p.id===author.remainderPart)+1,cs=components(labels,own.width,own.height,rem,ownerInfo.ownerParts),total=cs.reduce((n,c)=>n+c.pixels,0);let cap;
try{const c=placeRemainderIslands(labels,own.width,own.height,rem);cap={status:'PASS',islands:c.islands,moved:c.moved};}catch(error){cap={status:'REFUSED',reason:String(error.message)};}
const masked=Buffer.alloc(key.data.length);for(const c of cs.slice(1))for(const i of c.indices)key.data.copy(masked,i*4,i*4,i*4+4);
fs.writeFileSync(out+'/original-remainder-islands.png',PNG.sync.write({width:key.width,height:key.height,data:masked}),{flag:'wx'});
const row={schema:'cf.c183-source-island-diagnosis/v1',id:'04-spider',packet:out+'/original',fit:out+'/baseline-fit',sourceManualFit:src+'/fit01',inputs,unchangedCap:MAX_SHARE,cap,remainderPixels:total,components:cs.map(({indices,...c},i)=>({...c,largest:i===0,share:c.pixels/total})),distinction:'Automatic C207m front21.9% refusal and independent manual C173 remainder9.1% refusal are different authorings; neither result replaces the other.',qualityAccepted:false,nativeRuns:0};
write(out+'/original-diagnosis.json',row);console.log(JSON.stringify({id:row.id,cap,components:row.components.slice(0,12)}));
