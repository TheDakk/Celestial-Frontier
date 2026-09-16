import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
import {rolldown} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/node_modules/rolldown/dist/index.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',producer='/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src',input=root+'/audits/C2_CONTINUOUS_SKIN_20260916/current-producer-poses-v2',output=root+'/audits/C2_CONTINUOUS_SKIN_20260916/transition-after';
const sha=b=>createHash('sha256').update(b).digest('hex');const sources=new Map();const remember=p=>{const b=fs.readFileSync(p);sources.set(p,{path:p,sha256:sha(b)});return b;};
const candidate=JSON.parse(remember(root+'/audits/C2_CONTINUOUS_SKIN_20260916/candidate-10/manifest.json'));
const entry=`import {createGsapPlayer} from 'cf-proof/motion/index.ts';
import {createTurnPoseSampler} from '${root}/port/v2/tools/quadruped-proof/turn-performance.mjs';
import {createQuadrupedContactSolver,poseMatrices} from '${root}/port/v2/apps/game/src/creature-rig-contact.ts';
import {createCompiledSkinField,applyCompiledSkinField} from '${root}/port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createTurnContactSampler} from '${root}/port/v2/tools/quadruped-proof/turn-contact-transition.mjs';
export function createProbe(record,skin,plans){
 const sampler=createTurnPoseSampler(createGsapPlayer),solver=createQuadrupedContactSolver(record),compiled=createCompiledSkinField(skin,record.geometry.width,record.geometry.height);
 const contact=createTurnContactSampler({plans,motionSampler:sampler,solver});
 const field=pose=>{const a=new Float64Array(skin.vertices.length*2);applyCompiledSkinField(compiled,poseMatrices(record,pose),a);for(let i=0;i<a.length;i++)a[i]*=i%2?record.geometry.height:record.geometry.width;return a;};
 return{sample(ms){const raw=contact.sample(ms),resolved=contact.resolve(ms,raw),planted=resolved.planted;return{ms,planted,raw,pose:resolved.pose,rawField:field(raw),resolvedField:field(resolved.pose),compression:resolved.compression};},dispose(){sampler.dispose();}};
}`;
fs.mkdirSync(output,{recursive:false});
const bundle=await rolldown({input:'\0probe',platform:'node',plugins:[{name:'probe',resolveId(id){if(id==='\0probe')return id;if(id.startsWith('cf-proof/'))return path.join(producer,id.slice(9));},load(id){if(id==='\0probe')return entry;},transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);}}]});
try{await bundle.write({file:output+'/bundle.mjs',format:'es'});}finally{await bundle.close();}
const {createProbe}=await import(pathToFileURL(output+'/bundle.mjs'));
const keys=timeline=>{const set=new Set([0,timeline.bodyMs,timeline.durationMs]);for(const track of Object.values(timeline.tracks))for(const k of track)set.add(k.ms);for(const track of [timeline.root.dx,timeline.root.dy])for(const k of track)set.add(k.ms);for(const s of timeline.secondary)for(const k of s.keys){set.add(k.ms);set.add(k.ms-s.lagMs);}return [...set].filter(Number.isFinite);};
const maxField=(a,b)=>{let max=0,vertex=null;for(let i=0;i<a.length;i+=2){const n=Math.hypot(a[i]-b[i],a[i+1]-b[i+1]);if(n>max){max=n;vertex=i/2;}}return{maxPx:max,vertex};};
const poseDelta=(a,b)=>{let max=0,joint=null;const values={};for(const n of new Set([...Object.keys(a),...Object.keys(b)])){const change=(b[n]?.rotation??0)-(a[n]?.rotation??0);if(Math.abs(change)>max){max=Math.abs(change);joint=n;}if(Math.abs(change)>1e-7)values[n]=change;}return{maxRadians:max,joint,values};};
const compare=(probe,a,b)=>{const x=probe.sample(a),y=probe.sample(b);return{a,b,planted:[x.planted,y.planted],raw:poseDelta(x.raw,y.raw),resolved:poseDelta(x.pose,y.pose),rawField:maxField(x.rawField,y.rawField),resolvedField:maxField(x.resolvedField,y.resolvedField),compression:[x.compression,y.compression]};};
const rows=[];
for(const row of candidate.results){
 const source=JSON.parse(remember(input+'/'+row.id+'-poses.json')),record=JSON.parse(remember(path.resolve(root,row.record))),binding=JSON.parse(remember(root+'/audits/C2_CONTINUOUS_SKIN_20260916/candidate-10/'+row.id+'.binding.json')),probe=createProbe(record,binding.paintSkin,source.plans),boundaries=new Map();
 const add=(t,label)=>{if(t>.10001&&t<9999.89999&&Number.isFinite(t)){const existing=[...boundaries.keys()].find(x=>Math.abs(x-t)<1e-7);if(existing!==undefined)boundaries.get(existing).push(label);else boundaries.set(t,[label]);}};
 add(5000,'role switch');
 for(const [index,plan]of source.plans.entries()){
  const base=index*5000,b=plan.beats,hold=b.hitstopEnd-b.impactAt;
  for(const [name,t]of Object.entries(b))if(t<5000)add(base+t,'phase '+name);
  const idle=index?plan.clips.target.idle:plan.clips.attacker.idle;
  if(idle.source==='timeline')for(let cycle=0;cycle<Math.ceil(5000/idle.timeline.bodyMs)+1;cycle++)for(const k of keys(idle.timeline)){
   const local=cycle*idle.timeline.bodyMs+((k%idle.timeline.bodyMs)+idle.timeline.bodyMs)%idle.timeline.bodyMs;
   const global=local<b.impactAt?local:local+hold;if(global<5000)add(base+global,'idle key/wrap');
  }
  if(!index){
   const action=plan.clips.attacker.action.timeline;
   if(action)for(const k of keys(action)){const local=b.actionStart+k,global=local<b.impactAt?local:local+hold;if(global>=b.actionStart&&global<=b.actionEnd)add(base+global,'action key');}
   const approach=plan.clips.attacker.approach.timeline;
   for(const k of keys(approach)){if(k>=0&&k<=approach.durationMs){add(base+b.commandEnd+k/approach.durationMs*(b.actionStart-b.commandEnd),'approach key');add(base+b.actionEnd+k/approach.durationMs*(b.returnEnd-b.actionEnd),'return key');}}
  }else if(plan.clips.target.reaction?.source==='timeline')for(const k of keys(plan.clips.target.reaction.timeline))if(b.reactionStart+k<5000)add(base+b.reactionStart+k,'reaction key');
 }
 const probes=[];for(const [atMs,labels]of [...boundaries].sort((a,b)=>a[0]-b[0])){const epsilon=[.1,.001,.00001].map(e=>compare(probe,atMs-e,atMs+e));probes.push({atMs,labels,epsilon});}
 const windows={civet:[2075,2083.3333333333335],fox:[2183.3333333333335,2191.6666666666665],procedural:[2383.3333333333335,2391.6666666666665]};
 const [lo,hi]=windows[row.id],window=compare(probe,lo,hi),substeps=[];for(let i=0;i<10;i++)substeps.push(compare(probe,lo+(hi-lo)*i/10,lo+(hi-lo)*(i+1)/10));
 const result={id:row.id,window,substeps,boundaryCount:probes.length,boundaries:probes};fs.writeFileSync(output+'/'+row.id+'.json',JSON.stringify(result,null,2));rows.push({id:row.id,boundaryCount:probes.length,window,jumps:probes.filter(p=>p.epsilon[2].resolvedField.maxPx>.05||p.epsilon[2].rawField.maxPx>.05)});probe.dispose();
}
for(const s of sources.values())if(sha(fs.readFileSync(s.path))!==s.sha256)throw Error('Source changed: '+s.path);
const report={scope:'Current producer epsilon continuity diagnostic; unchanged motion/skin. Values in native cut-out pixels.',rows,sources:[...sources.values()]};fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({output,rows:rows.map(r=>({id:r.id,boundaries:r.boundaryCount,jumps:r.jumps.map(j=>j.atMs)}))},null,2));
