import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Preparation only until root authorizes the frozen build. Root owns the shared
// foreground + checkout lease and macOS out-of-sandbox approval around this chain.
// node audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-v3-remaining-chain.mjs SAME_DIST FRESH_OUTPUT_ROOT
// Carry the exact retained desktop/phone PASS records; run only blocked -> default on two fresh origins. No rebuild.
// A nonzero, timeout, missing/ambiguous report or source/dist drift stops the chain.
const repo=fs.realpathSync(fileURLToPath(new URL('../..',import.meta.url)));
assert.equal(process.argv.length,4,'Expected unchanged v2 evidence dist and fresh remaining-output root');
const dist=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]);
assert(!fs.existsSync(out)&&!out.startsWith(dist+path.sep),'Fresh output outside dist required');
assert.equal(fs.realpathSync(path.dirname(out)),path.dirname(out),'Output parent must already exist and be real');
const observer=path.join(repo,'audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-v3-runner.mjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const observerText=fs.readFileSync(observer,'utf8');
const inventoryBlock=observerText.match(/const sourceNames = \[([\s\S]*?)\n\];/u);
assert(inventoryBlock,'Observer source inventory missing');
const names=[...inventoryBlock[1].matchAll(/'([^']+)'/gu)].map(match=>match[1]);
assert(names.length>15&&new Set(names).size===names.length,'Observer source inventory ambiguous');
const sourceInventory=()=>Object.fromEntries(names.map(name=>{
  const bytes=fs.readFileSync(path.join(repo,name));return[name,{bytes:bytes.length,sha256:hash(bytes)}];
}));
const distInventory=()=>{
  const result={};
  const visit=relative=>{
    for(const entry of fs.readdirSync(path.join(dist,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      const key=path.join(relative,entry.name),file=path.join(dist,key);
      assert(!entry.isSymbolicLink(),'Dist symlink unsupported: '+key);
      assert(fs.realpathSync(file).startsWith(dist+path.sep),'Dist path escaped');
      if(entry.isDirectory())visit(key);
      else{assert(entry.isFile(),'Dist non-file: '+key);const bytes=fs.readFileSync(file);result[key]={bytes:bytes.length,sha256:hash(bytes)};}
    }
  };visit('');assert(Object.keys(result).length>0,'Empty dist');return result;
};
fs.mkdirSync(out);
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'chain-runner.mjs'),fs.constants.COPYFILE_EXCL);
const report={schema:'cf-static-earth-landing-native-remaining-chain/v3',certification:false,status:'RUNNING',
  startedAt:new Date().toISOString(),dist,out,sources:null,distInventory:null,modes:[],
  limitations:['Only blocked/default run here; prior desktop/phone PASS records are hash/source/dist-bound without rerun. No full profile, human art acceptance, physical iPhone/Safari or driver-release qualification.',
    'Root must hold the foreground and checkout locks around the entire chain; this runner does not acquire nested locks.']};
const persist=()=>fs.writeFileSync(path.join(out,'chain-report.json'),JSON.stringify(report,null,2)+'\n');
persist();
try{
  report.sources=sourceInventory();report.distInventory=distInventory();persist();
  const predecessorRecords = {
    chain: {path:'audits/STATIC_LANDING_PORTRAIT_20260908/native-v2/chain-report.json',sha256:'45c9b4ec08a2d321da3dd9f50396920ae9923bde25d31fd3db57cf5dfc121ab0'},
    desktop: {path:'audits/STATIC_LANDING_PORTRAIT_20260908/native-v2/desktop/review.json',sha256:'6df31a5df3e90f98573ac922861309cc28dc0ce44494e196cbab8add9699743f'},
    phone: {path:'audits/STATIC_LANDING_PORTRAIT_20260908/native-v2/phone/review.json',sha256:'0fdd8a09afa9e17e9a0882bb1d2ad35bd7e2fedcafe7f21094c21aac2546e92b'},
    blockedFailure: {path:'audits/STATIC_LANDING_PORTRAIT_20260908/native-v2/blocked/review.json',sha256:'4cc8494c28fc845f690be411fdb1bc50727551c7df0b28a9ad11e7f5710a8b36'},
  };
  const readBound=record=>{const bytes=fs.readFileSync(path.join(repo,record.path));assert.equal(hash(bytes),record.sha256,'Predecessor report changed: '+record.path);return JSON.parse(bytes)};
  const prior=readBound(predecessorRecords.chain);
  assert.equal(prior.schema,'cf-static-earth-landing-native-chain/v2');assert.equal(prior.status,'FAIL');
  assert.deepEqual(prior.modes.map(x=>[x.mode,x.status]),[['desktop','PASS'],['phone','PASS'],['blocked','FAIL']]);
  assert.deepEqual(report.distInventory,prior.distInventory,'Prior frozen dist differs; rebuild/rebaseline forbidden');
  for(const [name,record]of Object.entries(prior.sources))assert.deepEqual(report.sources[name],record,'Prior source changed: '+name);
  const retainedScreenshots=[];
  for(const mode of ['desktop','phone','blockedFailure']){
    const record=predecessorRecords[mode],review=readBound(record);
    assert.equal(review.schema,'cf-native-earth-landing-still/v2');
    assert.equal(review.mode,mode==='blockedFailure'?'blocked':mode);
    assert.equal(review.status,mode==='blockedFailure'?'FAIL':'PASS');
    if(mode==='blockedFailure')assert(review.failure.includes('Blocked URL leaked to real server'),'Original diagnosis changed');
    assert.deepEqual(Object.keys(review.sources).sort(),Object.keys(prior.sources).sort(),'Prior source inventory incomplete');
    for(const [name,digest]of Object.entries(review.sources))assert.equal(digest,prior.sources[name].sha256,'Prior report source mismatch: '+name);
    assert(review.screenshots.length>0,'Prior native screenshot missing');
    for(const image of review.screenshots){
      assert(typeof image.path==='string'&&!path.isAbsolute(image.path)&&!image.path.split(/[\/]/u).includes('..'));
      const name=path.join(path.dirname(record.path),image.path),bytes=fs.readFileSync(path.join(repo,name));
      assert.equal(hash(bytes),image.sha256,'Prior screenshot changed');if(image.bytes!==undefined)assert.equal(bytes.length,image.bytes);
      retainedScreenshots.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
    }
  }
  report.predecessor={records:predecessorRecords,retainedScreenshots,carriedPasses:['desktop','phone'],
    firstFailure:'blocked server-wide digest inventory was incorrectly treated as the selected page request trace',
    sourceAndDistUnchanged:true,rerunPassedModes:false,
    pathPolicy:'All predecessor inputs resolve from repository-relative record paths; old report absolute output/dist paths are provenance only.'};persist();

  for(const mode of ['blocked','default']){
    assert.deepEqual(sourceInventory(),report.sources,'Source changed before '+mode);
    assert.deepEqual(distInventory(),report.distInventory,'Dist changed before '+mode);
    const output=path.join(out,mode),log=path.join(out,mode+'.log');
    const item={mode,status:'RUNNING',output,command:[process.execPath,observer,dist,output,mode],startedAt:new Date().toISOString()};
    report.modes.push(item);persist();
    const fd=fs.openSync(log,'wx');let result;
    try{result=spawnSync(process.execPath,[observer,dist,output,mode],{cwd:repo,stdio:['ignore',fd,fd],timeout:150_000});}
    finally{fs.closeSync(fd);}
    const bytes=fs.readFileSync(log);item.log={path:path.basename(log),bytes:bytes.length,sha256:hash(bytes)};
    item.endedAt=new Date().toISOString();item.exitCode=result.status;item.signal=result.signal;
    item.error=result.error?String(result.error):null;persist();
    assert(!result.error&&result.status===0&&result.signal===null,'Native '+mode+' failed; see retained log');
    const reviewBytes=fs.readFileSync(path.join(output,'review.json')),review=JSON.parse(reviewBytes);
    item.review={path:path.join(mode,'review.json'),bytes:reviewBytes.length,sha256:hash(reviewBytes)};
    assert.equal(review.schema,'cf-native-earth-landing-still/v3');assert.equal(review.mode,mode);assert.equal(review.status,'PASS');
    assert.equal(review.dist,dist);assert.equal(review.certification,false);
    assert.deepEqual(Object.keys(review.sources).sort(),Object.keys(report.sources).sort(),'Native source inventory omitted an owner');
    for(const [name,digest]of Object.entries(review.sources))assert.equal(digest,report.sources[name]?.sha256,'Native source binding differs: '+name);
    assert.deepEqual(sourceInventory(),report.sources,'Source changed during '+mode);
    assert.deepEqual(distInventory(),report.distInventory,'Dist changed during '+mode);
    item.status='PASS';persist();
  }
  report.status='PASS';report.combinedScopedModes={desktop:'retained-v2-PASS',phone:'retained-v2-PASS',blocked:'v3-PASS',default:'v3-PASS'};
}catch(error){report.status='FAIL';report.failure=String(error.stack??error);const item=report.modes.at(-1);if(item?.status==='RUNNING')item.status='FAIL';process.exitCode=1;}
finally{report.endedAt=new Date().toISOString();persist();}
console.log(JSON.stringify({status:report.status,output:out,failure:report.failure??null}));
