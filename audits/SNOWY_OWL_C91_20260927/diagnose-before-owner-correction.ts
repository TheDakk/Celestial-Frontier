/** Observation only: actual stage sample, contact/Float32 field/ARAP; no solver or limit edits. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{compileBodyCard,buildTimeline}from'../../port/v2/apps/game/src/motion/index.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{buildTurnPlan,sampleTurn,sampleClip}from'../../port/v2/apps/game/src/battle2/choreography.ts';
import{createFamilyContactSolver,observedContactSupports}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{createSkeletonPoseProgram}from'../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import{createCompiledSkinField,applyCompiledSkinField}from'../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import{createArapScratch,solveArapSkin}from'../../port/v2/tools/creature-animation/arap-skin.mjs';
const base=path.resolve('audits/SNOWY_OWL_C91_20260927'),fit=path.resolve(process.argv[2]??base+'/original-fit'),out=process.argv[3]??base+'/exact-pose.json';
if(fs.existsSync(out))throw Error('Fresh diagnosis required');
const inputs=new Map(),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>{const b=fs.readFileSync(p);inputs.set(p,sha(b));return JSON.parse(b.toString());};
const record=read(fit+'/record.json'),binding=read(fit+'/binding.json'),native=read(base+'/original-native-report.json'),arena=read(path.resolve('audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json'));
const card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),turn=native.gates.turns[3],nativeRefusal=native.capture.refusalLog[0];
const input:any={seed:arena.seed,attacker:{side:'left',mass:card.massClass.multiplier,card,seed:1,label:'Snowy Owl'},target:{side:'right',mass:card.massClass.multiplier,card,seed:2,label:'Snowy Owl'},delivery:'melee',theme:'wild',outcome:'hit',damage:21,critical:true,targetFaints:true,effect:null,arena:{groundLineY:.78,stands:native.gates.stands},readyMs:600,commandMs:300};
const generated=buildTurnPlan(input),plan={...generated,beats:turn.beats,phases:generated.phases,runUp:turn.runUp};
assert.equal(plan.clips.target.reaction!.source,'timeline');assert.equal((plan.clips.target.reaction as any).timeline.durationMs,nativeRefusal.context.durationMs);
const skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height,program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),field=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),output=target.slice(),contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
const probe=(label,pose,context)=>{let resolved:any=null,error=null;try{resolved=contact.resolve(pose,{...context,realm:card.realm});applyCompiledSkinField(field,program.evaluate(resolved.pose),target);solveArapSkin(scratch,target,output);}catch(e){error=String(e);}
 const folded=[];if(error?.includes('folded triangles'))for(let k=0;k<scratch.triangles.length;k+=3){const ids=Array.from(scratch.triangles.slice(k,k+3)),p=scratch.position,[a,b,c]=ids.map(i=>i*2),ratio=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))/scratch.areas[k/3];if(ratio<=0||!Number.isFinite(ratio))folded.push({triangle:k/3,ratio,parts:skin.parts.filter(p=>p.fieldTriangles.includes(k/3)).map(p=>p.id),vertices:ids.map(i=>({index:i,...skin.vertices[i],pinned:!!scratch.pins[i],target:[target[i*2]*w,target[i*2+1]*h],solved:[p[i*2],p[i*2+1]]}))});}
 return{label,context,error,pose,resolved:resolved?.pose,stats:{...scratch.stats},folded};};
const at=nativeRefusal.context.elapsedMs,rows=[];
rows.push(probe('rest',{}, {actionId:'idle',elapsedMs:0,durationMs:1,weight:1,travel:'stage'}));
for(const offset of [-.05,0,.05]){const ms=turn.beats.reactionStart+at+offset,s=sampleTurn(plan as any,ms);rows.push(probe('stage '+offset,s.target.pose,s.target.context));}
rows.push(probe('standalone same-time faint',sampleClip(plan.clips.target.reaction!,at),nativeRefusal.context));
const timeline=buildTimeline(card,'faint',record.identity.seed);const sources=[...inputs].map(([file,hash])=>({file,sha256:hash,unchanged:sha(fs.readFileSync(file))===hash}));assert(sources.every(r=>r.unchanged));
fs.writeFileSync(out,JSON.stringify({scope:'Exact native target composition at recorded turn beats; observed contact and actual unchanged Float32 field/ARAP. Standalone comparison and nearby times are diagnostics, not full motion admission.',fit,at,cardNotes:timeline.notes,seed:arena.seed,rows,sources},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows.map(r=>({label:r.label,error:r.error,folds:r.folded.map(f=>({triangle:f.triangle,parts:f.parts,xy:f.vertices.map(v=>[v.x,v.y]),pinned:f.vertices.map(v=>v.pinned)}))})),null,2));
