import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base=path.dirname(new URL(import.meta.url).pathname),repo=path.resolve(base,'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),out=path.join(base,'final-results.json');
assert(!fs.existsSync(out),'Review receipt is immutable');
const nativeFile=path.join(base,'native-ground-ruler/report.json'),native=JSON.parse(fs.readFileSync(nativeFile));assert.equal(native.status,'PASS');
const result={schema:'cf-earth-cohesion-final-review/v1',status:'RUNNING',nativeReportSha256:sha(fs.readFileSync(nativeFile)),sourceChecks:[],distChecks:0,encodedImageChecks:0,controls:[],limitations:['Isolated local study only; native game integration and human art acceptance remain open.','Native strongLight mutant hit an earlier legacy-contact guard. Offline same-acceptor replay isolates its measured lighting ratios so the lighting ruler is separately negative-controlled.']};
for(const [file,expected] of Object.entries(native.sources)){assert.equal(sha(fs.readFileSync(path.join(repo,file))),expected,file);result.sourceChecks.push(file);}
const stat=JSON.parse(fs.readFileSync(path.join(base,'static-ground-ruler.json')));assert.equal(stat.status,'PASS');for(const [file,expected] of Object.entries(stat.sources))assert.equal(sha(fs.readFileSync(path.join(base,file))),expected,file);
for(const row of native.dist.inventory){const bytes=fs.readFileSync(path.join(repo,native.dist.path,row.path));assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);result.distChecks++;}
const visited=new Set();function checkImages(v){if(!v||typeof v!=='object')return;if(typeof v.path==='string'&&v.path.endsWith('.png')&&typeof v.sha256==='string'){const key=v.path;if(!visited.has(key)){visited.add(key);const bytes=fs.readFileSync(path.join(base,'native-ground-ruler',key));assert.equal(bytes.length,v.bytes);assert.equal(sha(bytes),v.sha256,key);assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));assert(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0);result.encodedImageChecks++;}}for(const value of Object.values(v))checkImages(value);}checkImages(native.modes);
const source=fs.readFileSync(path.join(base,'study-runner.mjs'),'utf8'),begin='function acceptCohesion(value) {',end='function acceptGeometry(geometry, mode) {';assert.equal(source.split(begin).length,2);assert.equal(source.split(end).length,2);const acceptSource=source.slice(source.indexOf(begin),source.indexOf(end));const accept=vm.runInNewContext('('+acceptSource.trim()+')',{assert});
function inRealm(value){return vm.runInContext('JSON.parse(input)',vm.createContext({input:JSON.stringify(value)}));}
// Feed JSON parsed inside the acceptor realm so strict array prototypes are equal.
const context=vm.createContext({assert,input:''});vm.runInContext(acceptSource,context);const execute=value=>{context.input=JSON.stringify(value);vm.runInContext('acceptCohesion(JSON.parse(input))',context);};
for(const mode of native.modes){assert.equal(mode.status,'PASS');const good=mode.cohesion[0];execute(good);const variants=[
 ['missing-declared-paw',v=>{v.contacts=v.contacts.filter(c=>c.id!=='Civet:paw:3');}],
 ['isolated-measured-overstrong-light',v=>{v.lighting=structuredClone(mode.cohesion.find(c=>c.mode==='strongLight').lighting);}],
 ['empty-lighting-region',v=>{v.lighting[0].ink=0;}],
 ['changed-alpha-row',v=>{v.owner.alphaRow=[0,0,0,.9,0];}],
 ['empty-background-ruler',v=>{v.outsideObserved=0;}],
 ['empty-contact-ruler',v=>{v.contacts[0].pixels=0;}],
 ['borrowed-source-lost',v=>{v.owner.borrowedSourcesIntact=false;}]
 ];for(const [kind,mutate]of variants){const value=structuredClone(good);mutate(value);let rejection=null;try{execute(value);}catch(e){rejection=String(e);}assert(rejection,kind+' vacuously passed');result.controls.push({mode:mode.name,kind,rejected:true,reason:rejection});}execute(good);
}
result.status='PASS';result.checkedAt=new Date().toISOString();fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:result.status,sources:result.sourceChecks.length,distFiles:result.distChecks,images:result.encodedImageChecks,isolatedControls:result.controls.length,nativeReportSha256:result.nativeReportSha256}));
