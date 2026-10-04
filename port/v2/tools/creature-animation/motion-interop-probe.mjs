// Read-only cross-lane diagnostic. The producer source directory is an explicit
// input; no source is copied into the repository or changed in the other lane.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {rolldown} from 'rolldown';
const motionRoot=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]),producer=path.join(motionRoot,'gsap-adapter.ts');
if(fs.existsSync(output))throw Error('Use new diagnostic output');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-motion-interop-')),sources=[];
try{
 const bundle=await rolldown({input:producer,platform:'node',plugins:[{name:'provenance',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.push({path:id,sha256:createHash('sha256').update(fs.readFileSync(id)).digest('hex')});}}]});try{await bundle.write({dir:scratch,entryFileNames:'producer.mjs',chunkFileNames:'chunk-[hash].mjs',format:'es'});}finally{await bundle.close();}
 const {createGsapPlayer}=await import(pathToFileURL(path.join(scratch,'producer.mjs')));
 const keys=(end)=>[{ms:0,value:0,ease:'ease-out'},{ms:100,value:end,ease:'ease-out'}];
 const timeline={tracks:{root:keys(0),spine:keys(0),head:keys(0)},root:{dx:keys(.2),dy:keys(-.1)},secondary:[],durationMs:100,bodyMs:100,loop:false};
 const calls=[],player=createGsapPlayer(timeline,{setJoint:(joint,rotation,dx,dy)=>calls.push({joint,rotation,dx,dy})},{now:()=>0});player.seek(100);player.stop();
 const nonRootOffsets=calls.filter(c=>c.joint!=='root'&&(c.dx!==0||c.dy!==0));
 const repairedControl=calls.map(c=>c.joint==='root'?c:{...c,dx:0,dy:0});
 const report={status:nonRootOffsets.length?'CONTRACT_MISMATCH':'PASS',calls,nonRootOffsets,producerSources:sources,expected:'A shared root displacement is emitted once for root; a child receives only an explicitly authored local offset.',negativeControl:repairedControl.filter(c=>c.joint!=='root'&&(c.dx||c.dy)).length===0?'PASS_ROOT_ONLY_CONTROL':'FAIL',rootOffsetPreserved:repairedControl.find(c=>c.joint==='root'),scope:'real GSAP producer seek on a synthetic translation-only timeline; no creature clips changed'};
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(nonRootOffsets.length)process.exitCode=1;
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
