import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {requireBattleCaptureTimeline,requireBattleCaptureMedia} from '../../port/v2/tools/battle2-proof/capture-timeline.mjs';

export const CPU_LIMIT_MS=1000/60;
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const jsonHash=v=>sha(JSON.stringify(v));
const need=(v,why)=>{if(!v)throw Error('All-pairs: '+why);};
export const prescribedRows=(A,B)=>[{side:'A',an:A,dn:B,dmg:9,crit:false,hpA:30,hpB:21},{side:'B',an:B,dn:A,dmg:6,crit:false,hpA:24,hpB:21},{side:'A',an:A,dn:B,dodge:true},{side:'B',an:B,dn:A,dodge:true},{side:'A',an:A,dn:B,dmg:21,crit:true,hpA:24,hpB:0}];
export function validateManifest(m){
 need(m?.schema==='cf.c163-all-pairs/v1','manifest schema');
 need(m.fits?.length===38&&new Set(m.fits.map(f=>f.name)).size===38,'exact 38 unique fits');
 need(m.pairs?.length===1444,'missing pair: expected 1444');
 const names=new Set(m.fits.map(f=>f.name)),seen=new Set();
 for(const p of m.pairs){need(names.has(p.left)&&names.has(p.right),'unknown fit');const key=p.left+'\0'+p.right;need(!seen.has(key),'duplicate pair');seen.add(key);need(p.scriptSha256===jsonHash(p.script),'altered script');
  need(p.script.labels?.A===p.left+' [A]'&&p.script.labels?.B===p.right+' [B]'&&p.script.labels.A!==p.script.labels.B,'distinct exact transcript labels');
  need(jsonHash(p.script.rows)===jsonHash(prescribedRows(p.script.labels.A,p.script.labels.B)),'five coherent turns required');
  need(p.expectedTurns?.length===5,'missing expected anatomy turns');
  for(const[i,t]of p.expectedTurns.entries())need(t.attacker===([0,2,4].includes(i)?'left':'right')&&t.outcome===([2,3].includes(i)?'dodge':'hit')&&t.targetFaints===(i===4),'altered expected turn outcome');
 }
 for(const a of names)for(const b of names)need(seen.has(a+'\0'+b),'missing ordered pair');
 return{pairs:seen.size,fits:names.size};
}
export function validatePairReport(p,r){
 need(r?.status==='DIAGNOSTIC_PASS','missing/red report');
 need(r.cpuThrottle===4,'CPU throttle must be exactly 4');
 need(r.pairCase?.id===p.id&&r.pairCase.scriptSha256===p.scriptSha256,'pair identity differs');
 need(jsonHash(r.script)===p.scriptSha256&&r.scriptSha256===p.scriptSha256,'altered script');
 need(jsonHash(r.pairAssetBinding)===jsonHash({left:p.fitConfig.left.dir,right:p.fitConfig.right.dir,effect:p.effectAnchors,arena:Object.fromEntries(['recipe','far','mid','near'].map(k=>[k,p.arena[k]]))}),'actual asset binding differs');
 const g=r.gates,c=r.capture;need(g&&c,'missing gates/capture');
 need(g.names?.left===p.left&&g.names?.right===p.right,'actual fit names differ');
 need(jsonHash(g.supports)===jsonHash(p.supports),'registered supports differ');
 need(g.plateMedium===p.arena.medium,'painted medium differs');
 need(g.mediums?.left===p.mediums.left&&g.mediums?.right===p.mediums.right,'physical medium differs');
 need(g.skipped?.length===0&&g.turns?.length===5,'missing stageable turns');
 need(g.refusals?.left===0&&g.refusals?.right===0&&c.refusalsAtEnd?.left===0&&c.refusalsAtEnd?.right===0&&c.refusalLog?.length===0,'rig refusal');
 const timeline=requireBattleCaptureTimeline(g,c);requireBattleCaptureMedia(c.encodedMedia,timeline.plannedDurationMs);
 need(c.frameSequenceEnd===c.frames,'omitted live sample');
 const turnActions=g.turns.map(()=>new Set()),targetActions=g.turns.map(()=>new Set());let maxCpu=0;
 for(const [i,f]of c.frameSamples.entries()){
  need(f.sampleIndex===i,'omitted/reordered live sample');
  need(f.refusals===0,'per-frame refusal');
  need(Number.isFinite(f.cpuMs)&&f.cpuMs<=CPU_LIMIT_MS,'CPU frame exceeds 1000/60 ms at '+i+': '+f.cpuMs);
  maxCpu=Math.max(maxCpu,f.cpuMs);const turn=g.turns[f.turn];
  if(f.attackerAction)turnActions[f.turn].add(f.attackerAction);
  if(f.targetAction)targetActions[f.turn].add(f.targetAction);
 }
 for(const [i,t]of g.turns.entries()){
  const e=p.expectedTurns[i];need(t.attacker===e.attacker&&t.outcome===e.outcome&&t.targetFaints===e.targetFaints,'turn outcome differs '+i);
  need(t.attack&&t.actionSource==='timeline','false anatomy/family fallback '+i);
  for(const k of ['verb','contactJoint','contactMs'])need(t.attack[k]===e.attack[k],'anatomical attack differs '+i+' '+k);
  need(t.contactAtLaunch&&Number.isFinite(t.contactAtLaunch.x)&&Number.isFinite(t.contactAtLaunch.y),'missing launch-joint observation '+i);
  need(t.effectAnchoring?.launch==='contact-joint'&&t.effectAnchoring?.impact==='target-body','effect anchoring fallback '+i);
  const q=t.effectAnchoring.launchPoint;need(Math.abs(q.x-t.contactAtLaunch.x)<1e-6&&Math.abs(q.y-t.contactAtLaunch.y)<1e-6,'launch differs from posed contact joint '+i);
  need(turnActions[i].has('melee:'+t.attack.verb),'missing live anatomical action '+i);
  if(e.outcome==='dodge')need(targetActions[i].has('dodge'),'missing exact target dodge turn '+i);
  if(e.targetFaints)need(targetActions[i].has('faint'),'missing exact final target faint');else need(!targetActions[i].has('faint'),'unexpected earlier faint '+i);
 }
 const required=['launch','launch-plus-40','approach-50','impact','reaction-50','return-end'];
 for(let i=0;i<5;i++)for(const name of required)need(r.stills?.some(s=>s.turn===i&&s.name===name),'missing still '+i+' '+name);
 for(const expected of p.inputs){const actual=r.sources?.find(s=>s.path===expected.path);need(actual?.sha256===expected.sha256,'missing/changed input '+expected.path);}
 const intervals=c.frameSamples.slice(1).map((f,i)=>f.ms-c.frameSamples[i].ms).sort((a,b)=>a-b);
 return{status:'PASS',claim:'CPU_BUDGET_PASS',overall60fpsQualification:'UNMEASURED',id:p.id,frames:c.frames,maxCpuMs:maxCpu,cpuLimitMs:CPU_LIMIT_MS,turns:5,cadenceObservation:{frameIntervals:intervals.length,averageFps:intervals.length*1000/c.durationMs,p95IntervalMs:intervals[Math.floor(intervals.length*.95)],maxIntervalMs:Math.max(...intervals),scope:'Observed rAF intervals; inherited 57fps capture-integrity floor is not 60fps qualification.'},scope:'One representative habitat; five scripted turns, not every verb, habitat or scale.'};
}
export function sealCaptureFiles(dir){
 const report=JSON.parse(fs.readFileSync(path.join(dir,'report.json'))),names=['report.json','frame-samples.json','battle-full.webm',...(report.stills??[]).map(s=>s.file)];
 need(names.length>3&&new Set(names).size===names.length,'empty/duplicate capture files');
 const files=names.map(file=>{need(path.basename(file)===file,'unsafe capture path');const b=fs.readFileSync(path.join(dir,file));need(b.length>0,'empty capture file');return{file,sha256:sha(b),bytes:b.length};});
 fs.writeFileSync(path.join(dir,'capture-integrity.json'),JSON.stringify({schema:'cf.c163-capture-integrity/v1',files},null,2)+'\n',{flag:'wx'});
}
export function validatePairFiles(p,dir){
 const reportFile=path.join(dir,'report.json');need(fs.existsSync(reportFile),'missing report '+p.id);const r=JSON.parse(fs.readFileSync(reportFile));
 const integrity=JSON.parse(fs.readFileSync(path.join(dir,'capture-integrity.json'))),required=['report.json','frame-samples.json','battle-full.webm',...(r.stills??[]).map(s=>s.file)];need(integrity.schema==='cf.c163-capture-integrity/v1'&&integrity.files.length===required.length&&new Set(integrity.files.map(f=>f.file)).size===required.length,'capture integrity inventory differs');
 for(const name of required){const h=integrity.files.find(f=>f.file===name);need(h&&path.basename(name)===name,'missing capture hash');const b=fs.readFileSync(path.join(dir,name));need(b.length===h.bytes&&sha(b)===h.sha256,'capture bytes changed '+name);}
 need(r.capture?.sampleLedger?.file==='frame-samples.json','missing sample ledger');
 const raw=fs.readFileSync(path.join(dir,'frame-samples.json'));need(sha(raw)===r.capture.sampleLedger.sha256&&jsonHash(JSON.parse(raw))===jsonHash(r.capture.frameSamples),'sample ledger differs');
 for(const s of r.stills??[])need(fs.statSync(path.join(dir,s.file)).size>0,'missing still bytes');
 need(fs.statSync(path.join(dir,'battle-full.webm')).size>0,'missing full media');
 const result=validatePairReport(p,r),hashFor=file=>integrity.files.find(f=>f.file===file).sha256;
 return{...result,scriptSha256:p.scriptSha256,captureIntegrity:{schema:'cf.c163-verified-capture/v1',verified:true,receiptSha256:sha(fs.readFileSync(path.join(dir,'capture-integrity.json'))),reportSha256:hashFor('report.json'),sampleLedgerSha256:hashFor('frame-samples.json'),mediaSha256:hashFor('battle-full.webm'),files:integrity.files.length}};
}
export function validateSweep(m,results){
 validateManifest(m);need(Array.isArray(results)&&results.length===1444,'missing pair report');const byId=new Map(results.map(r=>[r.id,r]));need(byId.size===1444,'duplicate result');
 for(const p of m.pairs){const r=byId.get(p.id);need(r?.status==='PASS','missing/red pair result '+p.id);
  need(r.claim==='CPU_BUDGET_PASS'&&r.overall60fpsQualification==='UNMEASURED','missing CPU-only qualification '+p.id);
  need(Number.isSafeInteger(r.frames)&&r.frames>0&&Number.isFinite(r.maxCpuMs)&&r.maxCpuMs>0&&r.maxCpuMs<=CPU_LIMIT_MS&&r.cpuLimitMs===CPU_LIMIT_MS&&r.turns===5,'missing/invalid CPU observations '+p.id);
  need(r.scriptSha256===p.scriptSha256,'result script identity differs '+p.id);
  const h=r.captureIntegrity;need(h?.schema==='cf.c163-verified-capture/v1'&&h.verified===true&&Number.isSafeInteger(h.files)&&h.files>=33&&['receiptSha256','reportSha256','sampleLedgerSha256','mediaSha256'].every(k=>/^[a-f0-9]{64}$/.test(h[k]??'')),'missing verified capture evidence '+p.id);
 }
 return{status:'PASS',claim:'CPU_BUDGET_PASS',overall60fpsQualification:'UNMEASURED',pairs:1444,scope:'All 38×38 ordered fits, one declared representative habitat each; not all habitats, verbs, scales or device tiers.'};
}
