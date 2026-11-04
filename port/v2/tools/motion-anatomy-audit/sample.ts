import fs from 'node:fs';import path from 'node:path';import{gzipSync}from'node:zlib';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
import{compileBodyCard,buildTimeline,sampleTimeline,actionsFor}from'../../apps/game/src/motion/index.ts';
import{createFamilyContactSolver,observedContactSupports}from'../../apps/game/src/creature-rig-contact.ts';
import{familyContractForRecord,familyContactChains}from'../creature-animation/family-contracts.mjs';
import{createSkeletonPoseProgram}from'../creature-animation/skeleton-pose.mjs';
import{transformPoint}from'../creature-animation/kinematics.ts';
import{waveMetrics,contactMetrics,strikeMetrics}from'./metrics.mjs';
const [registryFile,outArg]=process.argv.slice(2),out=path.resolve(outArg!),root=process.cwd(),sha=(b:any)=>createHash('sha256').update(b).digest('hex');
if(fs.existsSync(out))throw Error('New report directory required');fs.mkdirSync(out,{recursive:true});
const inputs:any[]=[],read=(p:string)=>{const b=fs.readFileSync(p);inputs.push({path:path.relative(root,p),sha256:sha(b)});return JSON.parse(b.toString());},subjects=read(path.resolve(registryFile!)),rows:any[]=[],refusals:any[]=[];
const add=(rig:string,action:string,criterion:string,status:string,measurement:any,reason:string|null=null)=>rows.push({rig,action,criterion,status,measurement,reason});
const rms=(a:number[])=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
const wrap=(x:number)=>((x%1)+1)%1;
for(const subject of subjects){
 const samples:any[]=[];let actionIds:string[]=[];
 try{
  const record=read(path.resolve(subject.fit,'record.json')),binding=read(path.resolve(subject.fit,'binding.json')),template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks),card=compileBodyCard(record,record.genome),solver=createFamilyContactSolver(record,observedContactSupports(record,binding)),chains=familyContactChains(template);
  actionIds=Object.keys(actionsFor(record.template.id,record.anatomy)??{});
  for(const action of actionIds){
   try{
    const tl=buildTimeline(card,action,record.identity.seed),frames:any[]=[],contactErrors:any[]=[],joints:any={};
    for(let i=0;i<=240;i++){
     const ms=tl.durationMs*i/240,p=sampleTimeline(tl,ms),raw:any=Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation,dx:j==='root'?p.root.dx:0,dy:j==='root'?p.root.dy:0}]));
     let resolved:any={pose:raw,contacts:[]};try{resolved=solver.resolve(raw,{actionId:action,elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm,...action.startsWith('melee:')?{travel:'stage' as const}:{}});}catch(e){contactErrors.push({ms,error:String(e)});}
     const matrices=program.evaluate(resolved.pose),world=Object.fromEntries(Object.entries(record.landmarks).map(([j,v]:any)=>[j,transformPoint(matrices[j],{x:v[0],y:v[1]})]));
     const feet=Object.fromEntries(chains.map((c:any)=>{const contact=resolved.contacts.find((v:any)=>v.joint===c.end),base=record.landmarks[c.end],knee=record.landmarks[c.knee],lower=Math.hypot(base[0]-knee[0],base[1]-knee[1]),sign=template.contactStance?.swingLift==='toward-socket'?Math.sign(record.landmarks[c.hip][1]-base[1]):-1;return[c.id,{stance:contact?.stance===true,lift:sign*((world[c.end] as any).y-base[1])/lower}];}));
     if(i<240)for(const[j,v]of Object.entries(p.joints)){(joints[j]??=[]).push(v);}
     frames.push({ms,raw:p,resolved:resolved.pose,world,feet,headAngle:matrices.head?Math.atan2(matrices.head[1],matrices.head[0]):null,contactError:contactErrors.at(-1)?.ms===ms?contactErrors.at(-1).error:null});
    }
    const finite=frames.every(f=>Object.values(f.raw.joints).every(Number.isFinite)),replay=JSON.stringify(sampleTimeline(tl,tl.durationMs*.437))===JSON.stringify(sampleTimeline(buildTimeline(card,action,record.identity.seed),tl.durationMs*.437));
    add(subject.id,action,'finite-and-deterministic',finite&&replay?'PASS':'FAIL',{samples:frames.length,replay,maxAngleRad:Math.max(...Object.values(joints).flat() as number[])});
    add(subject.id,action,'contact-owner',contactErrors.length?'FAIL':'PASS',{refusals:contactErrors.length,first:contactErrors[0]??null},contactErrors.length?'actual contact solver refused':null);
    const locomotion=action.startsWith('approach:'),waveFamily=['serpent','fish','myriapod'].includes(record.template.id);
    if(locomotion&&waveFamily){
     const prefix=record.template.id==='fish'?'spine':'seg',chain=Object.keys(joints).filter(j=>new RegExp('^'+prefix+'[0-9]+$').test(j)).sort((a,b)=>Number(a.slice(prefix.length))-Number(b.slice(prefix.length)));const end=record.template.id==='fish'?'caudal':'tail';if(joints[end])chain.push(end);
     try{const v=waveMetrics(joints,chain);add(subject.id,action,'travelling-wave',v.status,v);
      const amplitudes=v.amplitudesRad,ratio=amplitudes.at(-1)!/amplitudes[0]!,spread=Math.max(...amplitudes)/Math.min(...amplitudes),envelope=record.template.id==='fish'?ratio>=2:spread<=2.5;
      add(subject.id,action,'wave-amplitude-envelope',envelope?'PASS':'FAIL',{tailHeadRatio:ratio,maximumMinimumRatio:spread});
     }catch(e){add(subject.id,action,'travelling-wave','FAIL',null,String(e));}
     add(subject.id,action,'world-path-following','FAIL',null,'UNMEASURABLE: action sampler has no stage displacement or preceding head-path history; Claude stage owner must supply both.');
    }else add(subject.id,action,'travelling-wave','N/A',null,'not a chain locomotion action');
    if(locomotion&&chains.length&&!/:(flight|fly|swim|jet|hop|leap|climb)$/.test(action)){
     let expected:any={};for(const c of chains){const id=c.id;if(record.template.id==='quadruped')expected[id]=({hindNear:0,foreNear:.25,hindFar:.5,foreFar:.75} as any)[id];else if(record.template.id==='myriapod')expected[id]=wrap(Number(/\d+/.exec(id)?.[0]??0)*.2+(id.endsWith('Near')?.5:0));else expected[id]=c.group*.5;}
     const first=expected[chains[0].id];expected=Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,wrap((v as number)-first)]));
     const duty=action==='approach:trot'?.55:record.template.id==='brachyuran'?.60:.65;
     try{const v=contactMetrics(frames.slice(0,240).map(f=>f.feet),chains.map((c:any)=>c.id),expected,duty);add(subject.id,action,'footfall-duty-lift',contactErrors.length?'FAIL':v.status,v,contactErrors.length?'samples include contact refusals':null);}catch(e){add(subject.id,action,'footfall-duty-lift','FAIL',null,String(e));}
    }else add(subject.id,action,'footfall-duty-lift',locomotion&&['radial','cephalopod'].includes(record.template.id)?'FAIL':'N/A',null,locomotion?'No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred.':'not cyclic walking');
    if(locomotion&&frames[0].world.head){const ys=frames.map(f=>f.world.head.y),avg=ys.reduce((s,v)=>s+v,0)/ys.length,angle=rms(frames.map(f=>f.headAngle)),height=rms(ys.map(v=>v-avg))/program.bodyLength;add(subject.id,action,'head-stabilization',angle<=12*Math.PI/180&&height<=.04?'PASS':'FAIL',{rmsDegrees:angle*180/Math.PI,rmsHeightBodyLengths:height});}else add(subject.id,action,'head-stabilization','N/A',null,'not locomotion or no head joint');
    if(action==='melee:strike'&&record.template.id==='serpent'){const ordered=template.graph.filter(([j]:any)=>/^seg\d+$/.test(j)||j==='tail'),length=ordered.reduce((s:number,[j,parent]:any)=>s+Math.hypot(record.landmarks[j][0]-record.landmarks[parent][0],record.landmarks[j][1]-record.landmarks[parent][1]),0);const v=strikeMetrics(frames.map(f=>f.world.head),length,tl.durationMs);add(subject.id,action,'strike-extension-speed',v.status,v);}else add(subject.id,action,'strike-extension-speed','N/A',null,'not serpent strike');
    if(['approach:walk','approach:crawl','approach:climb'].includes(action)&&['primate','flyer-membrane'].includes(record.template.id)&&!chains.some((c:any)=>/arm|wing/.test(c.id)))add(subject.id,action,'full-support-inventory','FAIL',{observed:chains.map((c:any)=>c.id)},'UNMEASURABLE: hindfeet are measured but knuckles/wing wrists are not contact chains; hindfoot PASS is not a full gait PASS.');
    if(action==='melee:strike'&&record.template.id==='serpent'){
     const relative=frames.map(f=>({x:f.world.head.x-f.world.root.x,y:f.world.head.y-f.world.root.y})),extension=(Math.max(...relative.map(p=>p.x))-Math.min(...relative.map(p=>p.x)))/program.bodyLength;
     add(subject.id,action,'strike-neck-recruitment',extension>=.30?'PASS':'FAIL',{rootRelativeHeadExcursionBodyAxes:extension,headParent:template.graph.find(([j]:any)=>j==='head')?.[1]},'Root surge does not prove S-neck straightening; current head is a sibling of the body chain. Stage/head-path recruitment is required.');
    }
    if(['melee','hit','dodge','cast'].includes(tl.family)){const f=frames.at(-1)!,end=Math.max(...Object.values(f.raw.joints).map((v:any)=>Math.abs(v)),Math.abs(f.raw.root.dx),Math.abs(f.raw.root.dy));add(subject.id,action,'action-end-rest',end<=1e-8?'PASS':'FAIL',{maxResidual:end});}
    const rest=Object.values(frames[0].raw.joints).every(v=>v===0)&&frames[0].raw.root.dx===0&&frames[0].raw.root.dy===0;
    add(subject.id,action,'authored-rest-start',rest?'PASS':'FAIL',{zero:rest},'pose channels only; painted rest belongs to static owner');
    // No pretend automated proof of species-specific semantics unsupported by samples.
    const unavailable=(subject.id==='tarantula'&&action==='melee:sting')||(subject.id==='starfish'&&['approach:drift','approach:pulse','melee:sting-arms'].includes(action))||(action==='approach:climb');
    add(subject.id,action,'anatomical-verb',unavailable?'FAIL':'UNMEASURED',null,unavailable?'Source anatomy/support cannot realize the advertised verb.':'See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy.');
    samples.push({action,durationMs:tl.durationMs,chainJoints:Object.keys(joints),frames});
   }catch(e){refusals.push({rig:subject.id,action,error:String(e)});add(subject.id,action,'sample-admission','FAIL',null,String(e));}
  }
 }catch(e){refusals.push({rig:subject.id,error:String(e)});add(subject.id,'*','rig-admission','FAIL',null,String(e));}
 fs.writeFileSync(path.join(out,subject.id+'-samples.json.gz'),gzipSync(JSON.stringify({subject,actionIds,samples}),{level:6}));
}
for(const i of inputs)if(sha(fs.readFileSync(path.resolve(i.path)))!==i.sha256)throw Error('Input changed: '+i.path);
const report={schema:'cf.motion-anatomy-audit/v1',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Actual library + contact owner + skeleton samples, 241/action. Contact context matches static owner: compiled card realm and melee travel=stage. No stage displacement/history; not painted/native/CPU certification. Ground-only gait projections are separately retained. UNMEASURED is not PASS.',subjects:subjects.length,rows,refusals,inputs};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const table=['# Motion anatomy measurements','','Failures and unmeasured anatomy remain explicit. Numeric targets are prospective game-design choices, not re-sealed biological measurements.','','| Rig | Action | Criterion | Verdict | Measurement / reason |','|---|---|---|---|---|',...rows.map(r=>`| ${r.rig} | ${r.action} | ${r.criterion} | ${r.status} | ${JSON.stringify(r.measurement??r.reason).replaceAll('|','/')} |`)];fs.writeFileSync(path.join(out,'TABLE.md'),table.join('\n')+'\n');
console.log(JSON.stringify({subjects:subjects.length,actions:rows.filter(r=>r.criterion==='finite-and-deterministic').length,rows:rows.length,failures:rows.filter(r=>r.status==='FAIL').length,refusals}));
