import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Preparation only until root authorizes the frozen build. Root owns the shared
// foreground + checkout lease and macOS out-of-sandbox approval around this chain.
// node audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-chain.mjs DIST FRESH_OUTPUT_ROOT
// Four independent fresh origins, strictly desktop -> phone -> wrong-asset -> default.
// A nonzero, timeout, missing/ambiguous report or source/dist drift stops the chain.
const repo=fs.realpathSync(fileURLToPath(new URL('../..',import.meta.url)));
assert.equal(process.argv.length,4,'Expected frozen evidence dist and fresh output root');
const dist=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]);
assert(!fs.existsSync(out)&&!out.startsWith(dist+path.sep),'Fresh output outside dist required');
assert.equal(fs.realpathSync(path.dirname(out)),path.dirname(out),'Output parent must already exist and be real');
const observer=path.join(repo,'audits/STATIC_LANDING_PORTRAIT_20260908/native-landing-still-runner.mjs');
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
const report={schema:'cf-static-earth-landing-native-chain/v1',certification:false,status:'RUNNING',
  startedAt:new Date().toISOString(),dist,out,sources:null,distInventory:null,modes:[],
  limitations:['Four bounded scoped fresh-origin observers; not a full profile, human art acceptance, physical iPhone/Safari or driver-release qualification.',
    'Root must hold the foreground and checkout locks around the entire chain; this runner does not acquire nested locks.']};
const persist=()=>fs.writeFileSync(path.join(out,'chain-report.json'),JSON.stringify(report,null,2)+'\n');
persist();
try{
  report.sources=sourceInventory();report.distInventory=distInventory();persist();
  for(const mode of ['desktop','phone','blocked','default']){
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
    assert.equal(review.schema,'cf-native-earth-landing-still/v1');assert.equal(review.mode,mode);assert.equal(review.status,'PASS');
    assert.equal(review.dist,dist);assert.equal(review.certification,false);
    for(const [name,digest]of Object.entries(review.sources))assert.equal(digest,report.sources[name]?.sha256,'Native source binding differs: '+name);
    assert.deepEqual(sourceInventory(),report.sources,'Source changed during '+mode);
    assert.deepEqual(distInventory(),report.distInventory,'Dist changed during '+mode);
    item.status='PASS';persist();
  }
  report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error.stack??error);const item=report.modes.at(-1);if(item?.status==='RUNNING')item.status='FAIL';process.exitCode=1;}
finally{report.endedAt=new Date().toISOString();persist();}
console.log(JSON.stringify({status:report.status,output:out,failure:report.failure??null}));
