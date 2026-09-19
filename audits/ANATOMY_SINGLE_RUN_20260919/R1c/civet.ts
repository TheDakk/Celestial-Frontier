import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {fixture,marks} from './offline.ts';
import {createQuadrupedContactSolver,poseMatrices} from '../../../port/v2/apps/game/src/creature-rig-contact.ts';
import {transformPoint} from '../../../port/v2/tools/creature-animation/kinematics.js';
import {createRenderedContactProbe,assessRenderedContacts} from '../../../port/v2/tools/quadruped-proof/rendered-contact.mjs';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.ts';
const out='audits/ANATOMY_SINGLE_RUN_20260919/R1c',base='audits/ANATOMY_COMPLETION_20260917',f=fixture('civet-sentinel-input-01'),compat=createQuadrupedContactSolver(f.record),sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const input=JSON.parse(fs.readFileSync(base+'/civet-sentinel-input-01/input-manifest.json')),hashes=[];
for(const row of input.files){const p=base+'/civet-sentinel-input-01/'+row.destination;const expected=row.sha256;assert.equal(sha(p),expected);assert.equal(sha(row.source),expected);hashes.push({path:p,original:row.source,sha256:expected});}
const req=createRequire(process.cwd()+'/port/v2/package.json'),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs'),atlas=PNG.sync.read(fs.readFileSync(base+'/civet-sentinel-input-01/parts/atlas/civet.png'));
const probe=createRenderedContactProbe({record:f.record,binding:f.binding,atlas:{width:atlas.width,height:atlas.height,rgba:atlas.data}}),old=JSON.parse(fs.readFileSync('audits/C2_CONTINUOUS_SKIN_20260916/native-10/report.json')).skinGates.rows.find(r=>r.id==='civet'),reproduction=[];
for(const [id,sample]of Object.entries(old.poses)){
 const reference=old.renderedContacts.frames[id];if(!reference?.planted)continue;
 const result=compat.resolve(sample.pose,true);f.rig.applyPose(result.pose);
 const observed=assessRenderedContacts(probe,{positionsByPart:f.positions,matrices:poseMatrices(f.record,result.pose),planted:true});
 assert(observed.maxBoneErrorPx<1e-8);assert(Math.abs(observed.maxRenderedRestDisplacementPx-reference.maxRenderedRestDisplacementPx)<1e-7);
 reproduction.push({id,atMs:sample.atMs,compression:result.compression,boneErrorPx:observed.maxBoneErrorPx,driftPx:observed.maxRenderedRestDisplacementPx,referenceDriftPx:reference.maxRenderedRestDisplacementPx});
}
const ab=[];
for(const [id,ms]of [['alert',5.825],['approach:walk',28.96666666666667],['dodge',6.25],['idle',322.397756384067]]){
 const raw=f.player(id).sample(ms),tl=f.timelines[id],phase={actionId:tl.actionId,elapsedMs:ms,durationMs:tl.durationMs},row={id,ms,phase,raw,compat:null,family:null};
 let c;try{c=compat.resolve(raw,true);f.rig.applyPose(c.pose);const o=assessRenderedContacts(probe,{positionsByPart:f.positions,matrices:poseMatrices(f.record,c.pose),planted:true});row.compat={compression:c.compression,boneErrorPx:o.maxBoneErrorPx,paintedPawDriftPx:o.maxRenderedRestDisplacementPx};}catch(e){row.compat={error:String(e)};}
 const familyInput=structuredClone(raw);for(const c of f.contact.chains)familyInput[c.hip]={rotation:0};if(id==='approach:walk')familyInput.root={rotation:0,...familyInput.root,dx:f.contact.stride*(ms/tl.durationMs)/f.program.bodyLength};
 const matrices=f.program.evaluate(familyInput),cycle=ms/tl.durationMs,sm=v=>v*v*(3-2*v);
 row.reach=f.contact.chains.map(ch=>{const root=transformPoint(matrices[ch.hip],ch.root),gait=id==='approach:walk',swing=gait&&(ch.group===1?cycle<.5:cycle>=.5),at=swing?(ch.group===1?cycle*2:(cycle-.5)*2):0,step=ch.group===1?(cycle<.5?sm(cycle*2):1):(cycle<.5?0:sm((cycle-.5)*2)),target={x:ch.endPoint.x+(gait?f.contact.stride*step:0)-(swing?Math.sign(ch.endPoint.x-ch.root.x)*ch.chain.lengths.lower*.10*Math.sin(Math.PI*at)**2:0),y:ch.endPoint.y-(swing?Math.sin(Math.PI*at)**2*ch.chain.lengths.lower*.15:0)},distance=Math.hypot(target.x-root.x,target.y-root.y),min=Math.abs(ch.chain.lengths.upper-ch.chain.lengths.lower),max=ch.chain.lengths.upper+ch.chain.lengths.lower;return{chain:ch.id,root,target,distance,min,max,violated:distance>max?'upper':distance<min?'lower':null,compatCompression:row.compat?.compression??null};});
 try{const solved=f.contact.resolve(raw,phase);f.rig.applyPose(solved.pose);const m=f.program.evaluate(solved.pose);row.family={boneError:solved.maxError,ankles:marks(f).map(mark=>{const p=f.positions[mark.part],r=f.record.landmarks[mark.joint];return{joint:mark.joint,offsetPx:Math.hypot((mark.xy[0]-r[0])*f.w,(mark.xy[1]-r[1])*f.h),driftPx:Math.hypot((p[mark.index*2]-mark.xy[0])*f.w,(p[mark.index*2+1]-mark.xy[1])*f.h),rotation:Math.atan2(m[mark.joint][1],m[mark.joint][0])};})};}catch(e){row.family={error:String(e)};}ab.push(row);
}
assert(ab.slice(0,3).every(r=>r.family.error&&r.reach.some(c=>c.violated==='upper')));assert(ab.slice(0,3).every(r=>r.compat.compression>0));
// Diagnostic switches are external. The shipped compiler ignores unknown inputs.
for(const name of ['persimmon-04','cranberry-07','devils-club-06']){const r=JSON.parse(fs.readFileSync(base+'/'+name+'/record.json'));const expected=compileBodyCard(r,r.genome);assert.deepEqual(compileBodyCard({...r,diagnostic:{order:'presentation-first',scale:'legacy-body-axis'}},r.genome),expected);}
f.close();
const report={status:'PASS_DIAGNOSIS_NOT_SENTINEL_CLEARANCE',runtime:process.version,hashes,reproduction,scope:'Candidate10 retained planted resolved poses are re-solved (idempotence) and replayed through unchanged skin and original contour probe. Current full-clip raw stream is separately A/B; old unplanted frames are not compared to a planted target.',ab,finding:'Adapter is byte-identical. Compat reproduces candidate10 planted contour displacement; current family lacks root accommodation and exceeds upper reach at the three retained failure times. R2c must preserve authored hip orientation and add bounded scale-relative root accommodation. Paw contour vs ankle-offset metrics differ; neither waives the family sentinel.'};
fs.writeFileSync(out+'/civet.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,reproduced:reproduction.length,ab:ab.map(r=>({id:r.id,compat:r.compat,family:r.family}))}));
