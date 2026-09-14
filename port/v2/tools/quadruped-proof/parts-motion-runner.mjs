import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import http from 'node:http';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {rolldown} from 'rolldown';
import {openChromiumCdp} from '../browsercdp.mjs';import {acquireWorkspaceLock} from '../workspacelock.mjs';import {requireTenSecondMedia} from './capture-contract.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),output=path.resolve(process.argv[2]),producer=path.resolve(process.argv[3]);
const mode=process.argv[4]??'parts';if(!['parts','--portrait-fallback','--repair-gates','--repaired-parts','--band-gates','--pair-gates','--seam-gates','--seam-parts'].includes(mode))throw Error('Unknown proof mode');
if(fs.existsSync(output))throw Error('New output directory required');const sha=b=>createHash('sha256').update(b).digest('hex');
if(mode==='--seam-parts'){
 const gateFile=process.argv[5];if(!gateFile)throw Error('Seam captures require a prior native gate report');
 const gate=JSON.parse(fs.readFileSync(path.resolve(gateFile)));
 if(gate.mode!=='--seam-gates'||gate.status!=='PASS'||gate.seamGates?.status!=='PASS'
  ||JSON.stringify(gate.seamGates.rows.map(r=>r.id))!==JSON.stringify(['civet','fox','procedural'])
  ||gate.seamGates.rows.some(r=>r.status!=='PASS'||r.updateP95Ms>=2||Object.values(r.rest).some(n=>n!==0)))throw Error('Missing complete native seam qualification');
 const ear=gate.seamGates.rows[0].pairs.find(p=>p.name==='head--ear-far');
 if(!ear||['approach-quarter','approach-three-quarter'].some(f=>ear.frames[f]?.rigid.uncoveredPixels<3||ear.frames[f]?.strips.uncoveredPixels!==0))throw Error('Ear negative control not reproduced');
 if(!Array.isArray(gate.sources)||!gate.sources.length)throw Error('Missing gate source binding');
 for(const r of gate.sources)if(sha(fs.readFileSync(r.path))!==r.sha256)throw Error('Source changed after seam gates: '+r.path);
}

if(sha(fs.readFileSync(path.join(producer,'motion/gsap-adapter.ts')))!=='6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74')throw Error('Unexpected GSAP producer bytes');
const dirty=execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(s=>s&&s!=='?? .DS_Store');if(dirty.length)throw Error('Commit before native motion proof');
fs.mkdirSync(output,{recursive:true});const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-parts-motion-')),sources=new Map(),report={status:'RUNNING',mode,source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),errors:[],captures:[]};let browser,server,release;
const persist=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
const remember=p=>sources.set(p,{path:p,sha256:sha(fs.readFileSync(p))});
try{
 release=acquireWorkspaceLock('C2 parts motion native proof');
 const bundle=await rolldown({input:path.join(import.meta.dirname,'parts-motion-entry.mjs'),platform:'browser',plugins:[{name:'read-only-producer-and-provenance',resolveId(id){if(id.startsWith('cf-proof/')){const p=path.resolve(producer,id.slice(9));if(!p.startsWith(producer+path.sep))throw Error('Producer path escape');return p;}},transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);}}]});try{await bundle.write({dir:scratch,format:'es',entryFileNames:'bundle.js',chunkFileNames:'chunk-[hash].js'});}finally{await bundle.close();}
 const assets={'far.png':'audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-far.png','mid.png':'audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png','near.png':'audits/ARENA_EFFECTS_V42_PROOF_20260912/keyed/arena-near.png','arena.json':'audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json','anchors.json':'audits/WILD_V43_PROOF_20260913/wild-anchors.json','launch.png':'audits/WILD_V43_PROOF_20260913/registered/wild-launch.png','travel.png':'audits/WILD_V43_PROOF_20260913/second-pass/registered/wild-travel.png','impact.png':'audits/WILD_V43_PROOF_20260913/targeted-pass/registered/wild-impact.png','E.png':'audits/ART_KIT_WEATHER_LADDER_20260912/E.png','platypus.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/platypus.png','genome.json':'audits/CIVET_2D_PROOF_20260912/procedural-genome.json'};
 for(const id of ['civet','fox','procedural']){
  const base='audits/C2_PARTS_ATLAS_20260913/',directory=base+(id==='civet'?'civet-patched':id);
  assets[id+'.record.json']=id==='procedural'?base+'native-painter-parts-03/record.json':'audits/CIVET_2D_PROOF_20260912/'+id+'.landmarks.json';
  assets[id+'.master.png']=id==='procedural'?base+'native-painter-parts-03/master.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/'+(id==='fox'?'family-mammal-quadruped':id)+'.png';
  assets[id+'.keyed.png']=base+(id==='civet'?'civet-v2':id)+'/keyed.png';assets[id+'.binding.json']=directory+'/binding.json';assets[id+'.atlas.png']=directory+'/atlas/'+id+'.png';
 }
 if(mode==='--repair-gates'||mode==='--repaired-parts'||mode==='--band-gates'||mode==='--pair-gates'){
  const candidate='audits/C2_BOUNDED_REPAIR_20260913/candidate-01/';
  Object.assign(assets,{'civet.binding.json':candidate+'civet-patched/binding.json','civet.atlas.png':candidate+'civet-patched/atlas/civet.png','fox.record.json':candidate+'fox.landmarks.json','fox.binding.json':candidate+'fox/binding.json','fox.atlas.png':candidate+'fox/atlas/fox.png','civet-old.binding.json':'audits/C2_PARTS_ATLAS_20260913/civet-patched/binding.json','civet-old.atlas.png':'audits/C2_PARTS_ATLAS_20260913/civet-patched/atlas/civet.png','fox-old.record.json':'audits/CIVET_2D_PROOF_20260912/fox.landmarks.json'});
 }
 if(mode==='--band-gates'){const b='audits/C2_BAND_UNDERLAPS_20260913/civet/';assets['civet.binding.json']=b+'binding.json';assets['civet.atlas.png']=b+'atlas/civet.png';}
 if(mode==='--pair-gates'){const b='audits/C2_PAIR_BANDS_20260913/civet/';assets['civet.binding.json']=b+'binding.json';assets['civet.atlas.png']=b+'atlas/civet.png';assets['pairs.json']=b+'declaration.json';const d=JSON.parse(fs.readFileSync(path.join(root,b+'declaration.json')));d.cuts.forEach((c,i)=>assets['pair-'+i+'.png']=b+c.pairBand.file);}
 if(mode==='--seam-gates'||mode==='--seam-parts'){
  const candidate='audits/C2_DEFORMING_SEAMS_20260914/candidate-02/';
  const manifest=JSON.parse(fs.readFileSync(path.join(root,candidate+'manifest.json')));
  assets['saved-poses.json']='audits/C2_PAIR_BANDS_20260913/native-gates-01/report.json';
  for(const row of manifest.results){const id=row.id,b=row.base+'/';
   assets[id+'.record.json']=row.record;assets[id+'.binding.json']=candidate+id+'.binding.json';assets[id+'.atlas.png']=b+'atlas/'+id+'.png';
   assets[id+'-rigid.binding.json']=b+'binding.json';assets[id+'.cuts.json']=b+'declaration.json';
   const d=JSON.parse(fs.readFileSync(path.join(root,b+'declaration.json')));d.cuts.forEach((c,i)=>assets[id+'-pair-'+i+'.png']=b+c.pairBand.file);
  }
 }
 for(const[n,p]of Object.entries(assets)){const absolute=path.join(root,p);remember(absolute);fs.copyFileSync(absolute,path.join(scratch,n));}remember(import.meta.filename);remember(path.join(import.meta.dirname,'capture-contract.mjs'));
 fs.writeFileSync(path.join(scratch,'index.html'),'<html><head><style>html,body{margin:0;background:#141d22}</style></head><body><script type="module" src="bundle.js"></script></body></html>');
 const files=new Map(fs.readdirSync(scratch).map(n=>[n,fs.readFileSync(path.join(scratch,n))]));server=http.createServer((req,res)=>{const n=new URL(req.url,'http://127.0.0.1').pathname.slice(1)||'index.html',b=files.get(n);if(!b){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':n.endsWith('.js')?'text/javascript':n.endsWith('.html')?'text/html':n.endsWith('.json')?'application/json':'image/png'});res.end(b);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await openChromiumCdp({label:'C2 actual parts ten-second proof',userDataPrefix:'cf-parts-motion',commandTimeoutMs:60000,onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push(e.params.exceptionDetails);}});report.browser=browser.browser;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true}),send=(m,p={})=>browser.send(m,p,sessionId),evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1536,height:740,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+(mode==='--portrait-fallback'?'/?mode=portrait-fallback':mode==='--repair-gates'?'/?mode=repair-gates':mode==='--band-gates'?'/?mode=band-gates':mode==='--pair-gates'?'/?mode=pair-gates':mode==='--seam-gates'?'/?mode=seam-gates':'/')});
 const deadline=performance.now()+60000;for(;;){const state=await evaluate('window.cfPartsMotion?.state');if(state?.status==='FAIL'){report.observation=state;throw Error('Motion admission failed: '+JSON.stringify(state.errors));}if(state?.status==='READY'){report.observation=state;break;}if(performance.now()>deadline)throw Error('Motion readiness timeout');await new Promise(r=>setTimeout(r,100));}
 if(mode==='--seam-gates'){
  const g=await evaluate('window.cfPartsMotion.seamGates()');
  for(const[name,data]of Object.entries(g.artifacts))fs.writeFileSync(path.join(output,name),Buffer.from(data,'base64'));delete g.artifacts;
  report.seamGates=g;persist();if(g.status!=='PASS')throw Error('Native seam strips gate failed; no capture');
 }
 if(mode==='--repair-gates'){
  const gates=await evaluate('window.cfPartsMotion.repairGates()');
  for(const[name,data]of Object.entries(gates.artifacts))fs.writeFileSync(path.join(output,name),Buffer.from(data,'base64'));delete gates.artifacts;report.repairGates=gates;persist();
  if(gates.status!=='PASS')throw Error('Pack7 bounded repair gates failed; no motion capture authorized by this result');
 }
 if(mode==='--band-gates'){
  const g=await evaluate('window.cfPartsMotion.bandGates()');for(const[name,data]of Object.entries(g.artifacts))fs.writeFileSync(path.join(output,name),Buffer.from(data,'base64'));delete g.artifacts;report.bandGates=g;persist();
  const oracleTool=path.resolve(producer,'../../../tools/motion-proof/seam-oracle.mjs'),recordFile=path.join(root,'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'),declFile=path.join(root,'audits/C2_BAND_UNDERLAPS_20260913/civet/declaration.json');remember(oracleTool);remember(declFile);
  const decl=JSON.parse(fs.readFileSync(declFile)),joints=[...new Set(decl.cuts.map(c=>c.descendantJoint))],results={};
  for(const variant of ['disc-only','bands'])for(const frame of Object.keys(g.poses)){const name=variant+'-'+frame,record=JSON.parse(execFileSync(process.execPath,[oracleTool,path.join(output,name+'.png'),recordFile,'--joints='+joints.join(','),'--out='+path.join(output,name+'.seams.json')],{encoding:'utf8',maxBuffer:1024*1024}));results[name]=record;}
  g.cuts=decl.cuts.map(c=>({ancestor:c.ancestor,descendant:c.descendant,joint:c.descendantJoint,frames:Object.keys(g.poses).filter(f=>f!=='rest').map(frame=>({frame,discOnlyDelta:results['disc-only-'+frame].perJoint[c.descendantJoint].seamPixels-results['disc-only-rest'].perJoint[c.descendantJoint].seamPixels,bandDelta:results['bands-'+frame].perJoint[c.descendantJoint].seamPixels-results['bands-rest'].perJoint[c.descendantJoint].seamPixels}))}));
  g.failingCuts=g.cuts.filter(c=>c.frames.some(f=>f.bandDelta>0));g.negativeControlFails=g.cuts.some(c=>c.frames.some(f=>f.discOnlyDelta>0));g.rimTolerance='No positive delta accepted as rim without proof; strict zero-increase gate';g.status=Object.values(g.restDifferentChannels).every(n=>n===0)&&g.negativeControlFails&&!g.failingCuts.length?'PASS':'FAIL';persist();if(g.status!=='PASS')throw Error('Band seam/rest gate failed; stop before motion captures');
 }
 if(mode==='--pair-gates'){
  const start=await evaluate('window.cfPartsMotion.pairGateStart()');for(const[n,data]of Object.entries(start.artifacts))fs.writeFileSync(path.join(output,n),Buffer.from(data,'base64'));delete start.artifacts;
  report.pairGates={...start,pairs:[],status:'RUNNING'};persist();if(Object.values(start.restDifferentChannels).some(n=>n!==0))throw Error('Pair candidate changed rest pixels');
  const oracle=path.resolve(producer,'../../../tools/motion-proof/seam-oracle.mjs'),recordFile=path.join(root,'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json');remember(oracle);
  for(let i=0;i<start.cuts.length;i++){const cut=start.cuts[i],name=cut.ancestor+'--'+cut.descendant,dir=path.join(output,name);fs.mkdirSync(dir);const counts={};
   for(const frame of Object.keys(start.poses))for(const variant of ['disc-only','bands']){const capture=await evaluate('window.cfPartsMotion.renderPair('+i+','+JSON.stringify(variant)+','+JSON.stringify(frame)+')'),file=variant+'-'+frame;fs.writeFileSync(path.join(dir,file+'.png'),Buffer.from(capture.png,'base64'));const o=JSON.parse(execFileSync(process.execPath,[oracle,path.join(dir,file+'.png'),recordFile,'--joints='+cut.descendantJoint,'--disc=0.06','--out='+path.join(dir,file+'.seams.json')],{encoding:'utf8',maxBuffer:1024*1024}));counts[file]=o.perJoint[cut.descendantJoint].seamPixels;}
   const frames=Object.keys(start.poses).filter(f=>f!=='rest').map(frame=>({frame,discOnlyDelta:counts['disc-only-'+frame]-counts['disc-only-rest'],bandDelta:counts['bands-'+frame]-counts['bands-rest']}));const pair={name,joint:cut.descendantJoint,counts,frames,status:frames.some(f=>f.bandDelta>0)?'FAIL':'PASS'};report.pairGates.pairs.push(pair);persist();if(pair.status==='FAIL'){report.pairGates.status='FAIL';throw Error('Pair still leaks: '+name+'; stop before captures');}}
  report.pairGates.status='PASS';
 }
 if(mode!=='--repair-gates'&&mode!=='--band-gates'&&mode!=='--pair-gates'&&mode!=='--seam-gates')for(const id of ['civet','fox','procedural']){
  const plans=await evaluate('window.cfPartsMotion.select('+JSON.stringify(id)+')');fs.writeFileSync(path.join(output,id+'-plans.json'),JSON.stringify(plans,null,2)+'\n');
  const result=await evaluate('window.cfPartsMotion.capture('+JSON.stringify(id)+')');fs.writeFileSync(path.join(output,id+'-10s.webm'),Buffer.from(result.video,'base64'));delete result.video;
  const media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type','-of','json',path.join(output,id+'-10s.webm')],{encoding:'utf8'}));result.encodedMedia=media;report.captures.push(result);persist();requireTenSecondMedia(Number(media.format.duration));
  for(const [name,ms]of [['idle',500],['anticipation',plans[0].beats.actionStart+60],['strike',plans[0].beats.impactAt],['impact-hold',plans[0].beats.hitstopEnd+170],['hit',5000+plans[1].beats.reactionStart+150]]){await evaluate('window.cfPartsMotion.frame('+ms+')');const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,id+'-'+name+'.png'),Buffer.from(shot.data,'base64'));}
 }
 for(const[p,r]of sources)if(sha(fs.readFileSync(p))!==r.sha256)throw Error('Source changed: '+p);
 report.status=(mode==='--repair-gates'||mode==='--band-gates'||mode==='--pair-gates'||mode==='--seam-gates')?'PASS':'REVIEW';if(report.errors.length)throw Error('Browser errors');
}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;if(browser){try{const targets=await browser.send('Target.getTargets');report.failureTargets=targets.targetInfos.map(t=>({type:t.type,url:t.url}));}catch{}}}
finally{await browser?.close();if(server)await new Promise(r=>server.close(r));release?.();report.sources=[...sources.values()];persist();fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:report.status,captures:report.captures.map(({id,fps,updateP95Ms})=>({id,fps,updateP95Ms})),error:report.error}));
