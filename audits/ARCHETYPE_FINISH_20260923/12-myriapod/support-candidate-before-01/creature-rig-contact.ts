/** Record-driven planted contact constraint, separate from clip authoring.
 * Preserves each authored paw's perspective offset. No creature names/genes,
 * clocks, curve edits, or nearest-bone fitting. Flight passes through unchanged. */
import type {CreaturePoseV1,CreatureRigRecordV1,CreaturePartsBindingV1} from './creature-rig.js';
import {selectPaintedContactVertex} from '../../../tools/creature-animation/painted-contact-selector.mjs';
import {measureMotionScale} from '../../../tools/creature-animation/motion-scale.mjs';
import {familyContractForRecord,familyContactChains,contactStanceForAction} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {compileBodyCard,type ResolvedAnatomyRecord,type MotionGenomeFields} from './motion/body-card.js';
import {buildTimeline,sampleKeys} from './motion/timeline.js';
import {createContactTravel} from './creature-contact-travel.js';
import {createTerminalContactSolver} from './creature-terminal-contact.js';
import {terminalPaintedSupport} from './creature-terminal-support.js';
import {validateTerminalContactPads} from '../../../tools/creature-animation/terminal-contact-pads.mjs';
import {GRAPH} from '../../../tools/creature-animation/quadruped-template.mjs';
import {composeAffine,rotationAround,transformPoint,IDENTITY_AFFINE,createTwoBoneChain,type Affine2} from '../../../tools/creature-animation/kinematics.js';
const point=(p:readonly [number,number])=>({x:p[0],y:p[1]});
const legs=['hindFar','foreFar','hindNear','foreNear'];
const angle=(a:{x:number;y:number},b:{x:number;y:number})=>Math.atan2(b.y-a.y,b.x-a.x);
const wrapped=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export function poseMatrices(record:CreatureRigRecordV1,pose:CreaturePoseV1):Record<string,Affine2>{
 const matrices:Record<string,Affine2>={},length=Math.hypot(record.landmarks.chest![0]-record.landmarks.pelvis![0],record.landmarks.chest![1]-record.landmarks.pelvis![1]);
 for(const [name,parent]of [['root',null],...GRAPH] as Array<[string,string|null]>){
  const key=pose[name],pivot=point(record.landmarks[parent??'root']!);
  const local=key?rotationAround(pivot,key.rotation,{x:(key.dx??0)*length,y:(key.dy??0)*length}):IDENTITY_AFFINE;
  matrices[name]=parent?composeAffine(matrices[parent]!,local):local;
 }return matrices;
}
export function createQuadrupedContactSolver(record:CreatureRigRecordV1){
 if(record.template.id!=='quadruped')throw Error('Contact solver requires quadruped');
 const length=Math.hypot(record.landmarks.chest![0]-record.landmarks.pelvis![0],record.landmarks.chest![1]-record.landmarks.pelvis![1]);
 const chains=legs.map(id=>{
  const root=point(record.landmarks[id+'Root']!),joint=point(record.landmarks[id+'Knee']!),end=point(record.landmarks[id+'Ankle']!);
  const cross=(end.x-root.x)*(joint.y-root.y)-(end.y-root.y)*(joint.x-root.x),chain=createTwoBoneChain({root,joint,end,bend:cross<0?-1:1});
  return {id,root,joint,end,chain};
 });
 return {resolve(input:CreaturePoseV1,planted:boolean){
  if(!planted)return {pose:input,compression:0};
  const pose:Record<string,{rotation:number;dx?:number;dy?:number}>=Object.fromEntries(Object.entries(input).map(([j,k])=>[j,{...k}]));
  let matrices=poseMatrices(record,pose),compression=0;
  for(const c of chains){
   const root=transformPoint(matrices[c.id+'Root']!,c.root),dx=c.end.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower;
   if(Math.abs(dx)>=max)throw Error('Planted contact outside horizontal reach');
   compression=Math.max(compression,c.end.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y);
  }
  if(compression>length*.08)throw Error('Planted contact exceeds quadruped compression bound');
  if(compression>0){pose.root={rotation:0,...pose.root,dy:(pose.root?.dy??0)+compression/length};matrices=poseMatrices(record,pose);}
  for(const c of chains){
   const parent=matrices[c.id+'Root']!,root=transformPoint(parent,c.root),solved=c.chain.solve(root,c.end);
   const upper=wrapped(angle(solved.root,solved.joint)-angle(c.root,c.joint));
   const lower=wrapped(angle(solved.joint,solved.end)-angle(c.joint,c.end));
   pose[c.id+'Knee']={rotation:wrapped(upper-Math.atan2(parent[1],parent[0]))};
   pose[c.id+'Ankle']={rotation:wrapped(lower-upper)};pose[c.id+'Paw']={rotation:wrapped(-lower)};
  }
  return {pose,compression};
 }};
}

export interface ContactSupportVertex {
 readonly rest:readonly [number,number];
 readonly barycentric:number;
 readonly weights:ReadonlyArray<readonly [string,number]>;
}
export interface WeightedContactSupport {
 readonly rest:readonly [number,number];
 readonly vertices:ReadonlyArray<ContactSupportVertex>;
 /** Exact rendered part vertex selected from the binding, not a joint proxy. */
 readonly surface?:{readonly partId:string;readonly vertexIndex:number}|{readonly partId:string;readonly triangle:readonly [number,number,number];readonly barycentric:readonly [number,number,number]};
 /** Explicit terminal-rigid source pad; absent preserves endpoint support. */
 readonly pivotJoint?:string;
}
export type ContactSupport=readonly [number,number]|WeightedContactSupport;
/** Exact per-vertex LBS, then interpolation at the observed painted support.
 * Spatially varying weights must never be collapsed onto a common rest point. */
export function predictContactSupport(support:WeightedContactSupport,matrices:Readonly<Record<string,Affine2>>){
 let x=0,y=0;for(const vertex of support.vertices)for(const [joint,weight]of vertex.weights){const m=matrices[joint];if(!m)throw Error('Contact: missing support matrix '+joint);const p=transformPoint(m,point(vertex.rest));x+=vertex.barycentric*weight*p.x;y+=vertex.barycentric*weight*p.y;}return {x,y};
}
/** Source-owned painted vertices sampled independently of the skeleton endpoint.
 * Reads the binding; does not change source landmarks, skin weights, pins or joins. */
export function observedContactSupports(record:CreatureRigRecordV1,binding:CreaturePartsBindingV1):Readonly<Record<string,WeightedContactSupport>>{
 const skin=binding.paintSkin;if(!skin||binding.recordRecipeHash!==record.recipeHash)throw Error('Contact: source-bound painted skin required');
 const supports:Record<string,WeightedContactSupport>={},chains=familyContactChains(familyContractForRecord(record)),pads=validateTerminalContactPads(record,chains);
 for(const chain of chains){
  if(pads){supports[chain.end]=terminalPaintedSupport(record,binding,chain,pads.points[chain.end]!);continue;}
  const owner=binding.parts.find(p=>p.joint===chain.end),part=skin.parts.find(p=>p.id===owner?.id),end=record.landmarks[chain.end]!;
  if(!part)throw Error('Contact: missing painted surface '+chain.end);
  const best=selectPaintedContactVertex(skin.vertices,part,end,record.geometry.width,record.geometry.height);
  if(!best)throw Error('Contact: empty painted surface '+chain.end);
  const v=best.vertex;supports[chain.end]={rest:best.rest,surface:{partId:part.id,vertexIndex:best.vertexIndex},vertices:v.triangle.map((index,k)=>{const vertex=skin.vertices[index]!;return{rest:[vertex.x/record.geometry.width,vertex.y/record.geometry.height] as const,barycentric:v.barycentric[k]!,weights:vertex.weights.map(([j,w])=>[j,w] as const)};})};
 }return Object.freeze(supports);
}
export interface ContactPhase {readonly actionId:string;readonly elapsedMs:number;readonly durationMs:number;readonly realm?:string;readonly weight?:number;readonly travel?:'solver'|'stage';/** Signed stage translation already applied, in measured body-length units. */readonly stageDisplacement?:number;}
/** Source graph contacts for stance and alternating support. Elapsed phase is
 * explicit and replayable; rendering cadence is not solver state. */
export function createFamilyContactSolver(record:CreatureRigRecordV1,paintedSupports:Readonly<Record<string,ContactSupport>>={}){
 const template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks),padDeclaration=validateTerminalContactPads(record,familyContactChains(template));
 if(padDeclaration&&!Object.keys(paintedSupports).length)throw Error('Contact pad: observed painted supports required');
 const chains=familyContactChains(template).map(c=>{
  const root=template.fixedPivots?.[c.knee]?program.pivot(c.knee):point(record.landmarks[c.hip]!),joint=point(record.landmarks[c.knee]!),end=point(record.landmarks[c.end]!);
  const cross=(end.x-root.x)*(joint.y-root.y)-(end.y-root.y)*(joint.x-root.x);
  if(Math.abs(cross)<1e-12)throw Error('Contact: source bend direction missing '+c.id);
  const declaration=paintedSupports[c.end]??record.landmarks[c.end]!;
  const model:WeightedContactSupport='rest' in declaration?declaration:{rest:declaration,vertices:[{rest:declaration,barycentric:1,weights:[[c.end,1]]}]},support=model.rest;
  if(support.length!==2||support.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Contact: invalid painted support '+c.end);
  if(!model.vertices.length||model.vertices.length>(padDeclaration?9:3)||Math.abs(model.vertices.reduce((s,v)=>s+v.barycentric,0)-1)>1e-8)throw Error('Contact: invalid support interpolation '+c.end);
  for(const v of model.vertices)if(v.rest.length!==2||v.rest.some(n=>!Number.isFinite(n)||n<0||n>1)||!Number.isFinite(v.barycentric)||v.barycentric< -1e-8||!v.weights.length||new Set(v.weights.map(([j])=>j)).size!==v.weights.length||v.weights.some(([j,w])=>!Object.hasOwn(record.landmarks,j)||!Number.isFinite(w)||w<=0)||Math.abs(v.weights.reduce((s,[,w])=>s+w,0)-1)>1e-8)throw Error('Contact: invalid support weights '+c.end);
  const endpointOnly=model.vertices.every(v=>v.barycentric===0||(v.weights.length===1&&v.weights[0]![0]===c.end&&v.weights[0]![1]===1));
  if(padDeclaration&&(!c.terminal||model.rest[0]!==padDeclaration.points[c.end]![0]||model.rest[1]!==padDeclaration.points[c.end]![1]||!model.surface||model.pivotJoint!==c.terminal||!model.vertices.every(v=>v.barycentric===0||(v.weights.length===1&&v.weights[0]![0]===c.terminal&&v.weights[0]![1]===1))))throw Error('Contact pad: exact terminal-rigid support required '+c.end);
  if(!padDeclaration&&model.pivotJoint)throw Error('Contact pad: undeclared terminal support');
  const terminalSolver=padDeclaration?createTerminalContactSolver({root,joint,end,support:point(support),bend:cross<0?-1:1,limits:Object.fromEntries([['knee',c.knee],['end',c.end],['terminal',c.terminal!]].map(([key,joint])=>{const l=(template.contactLimitsDeg??template.limitsDeg)[joint!]!;return [key,{min:l.min*Math.PI/180,max:l.max*Math.PI/180}];})) as Parameters<typeof createTerminalContactSolver>[0]['limits']}):null;
  return {...c,root,joint,endPoint:end,support:point(support),model,endpointOnly,terminalSolver,offset:{x:support[0]-end.x,y:support[1]-end.y},chain:createTwoBoneChain({root,joint,end,bend:cross<0?-1:1})};
 });
 if(Object.keys(paintedSupports).length&&(Object.keys(paintedSupports).length!==chains.length||chains.some(c=>!Object.hasOwn(paintedSupports,c.end))))throw Error('Contact: exact painted support inventory required');
 // An explicit compact source-layout convention retracts upper-side feet
 // toward their fixed socket. No declaration retains the exact screen-up path.
 const swingLift=template.contactStance?.swingLift;
 if(template.contactStance&&Object.hasOwn(template.contactStance,'swingLift')&&
  (swingLift!=='toward-socket'||template.id!=='myriapod'||template.anatomyModel!=='myriapod-rigid-trunk-v1'||!template.fixedPivots||chains.some(c=>!Object.hasOwn(template.fixedPivots!,c.knee))))throw Error('Contact: invalid swing lift declaration');
 // Explicit named support groups must resolve to complete existing chains.
 // An absent declaration retains the historical hind-name convention exactly.
 const declaredHind=template.contactStance?.hind,hasDeclaredHind=!!template.contactStance&&Object.hasOwn(template.contactStance,'hind');
 if(hasDeclaredHind&&(!Array.isArray(declaredHind)||!declaredHind.length||new Set(declaredHind).size!==declaredHind.length||declaredHind.some(id=>typeof id!=='string'||!template.legs.includes(id)||!chains.some(c=>c.id===id))))throw Error('Contact: invalid declared hind support group');
 const hindGroup=hasDeclaredHind?new Set(declaredHind):null;
 const scaleLength=measureMotionScale(template,record.landmarks).length;
 const stride=chains.length?Math.min(...chains.map(c=>c.chain.lengths.upper+c.chain.lengths.lower))*.04:0;
 const direction=template.id==='brachyuran'?Math.sign(record.landmarks.leg0NearRoot![0]-record.landmarks.leg0FarRoot![0]):1;
 const hasOffset=chains.some(c=>c.offset.x!==0||c.offset.y!==0||!c.endpointOnly);
 const rigidSupportChains=new Map<string,ReturnType<typeof createTwoBoneChain>>();
 const travelPlans=new Map<string,{timeline:ReturnType<typeof buildTimeline>;path:ReturnType<typeof createContactTravel>}>();
 const travelFor=(phase:ContactPhase,weight:number)=>{
  if(phase.travel==='stage'||template.contactStance?.travel?.[phase.actionId]!=='source-steps')return null;
  let plan=travelPlans.get(phase.actionId);
  if(!plan){
   // Full admitted records carry motion identity/genome. Legacy contacts do not
   // need them; a declared source-step action must use the canonical compiler.
   const source=record as CreatureRigRecordV1&ResolvedAnatomyRecord&{genome?:MotionGenomeFields};
   const card=compileBodyCard(source,source.genome),timeline=buildTimeline(card,phase.actionId,card.identity.seed);
   if(timeline.loop)throw Error('Contact: source-step travel requires a nonloop timeline');
   plan={timeline,path:createContactTravel(timeline.root.dx,program.bodyLength)};
   travelPlans.set(phase.actionId,plan);
  }
  // An externally supplied pose/phase may not use the canonical clip clock.
  // Keep its existing fixed stance instead of inventing a source-step schedule.
  if(phase.durationMs!==plan.timeline.durationMs)return null;
  const at=plan.path.sample(phase.elapsedMs);
  // The review player blends a completed translated clip back to rest. Return
  // with a final signed step, so feet do not snap when its weight reaches zero.
  const step=phase.elapsedMs>=plan.timeline.durationMs&&weight<1&&at.base!==0
   ?{base:at.base,stride:-at.base,progress:1-weight}:at;
  return {...step,authoredDx:sampleKeys(plan.timeline.root.dx,phase.elapsedMs)*weight};
 };
 return {chains,scaleLength,stride,resolve(input:CreaturePoseV1,phase:ContactPhase){
  if(!Number.isFinite(phase.elapsedMs)||phase.elapsedMs<0||!Number.isFinite(phase.durationMs)||phase.durationMs<=0)throw Error('Contact: invalid phase');
  if(phase.travel!==undefined&&phase.travel!=='solver'&&phase.travel!=='stage')throw Error('Contact: invalid travel owner');
  if(phase.travel==='stage'&&phase.stageDisplacement!==undefined&&!Number.isFinite(phase.stageDisplacement))throw Error('Contact: invalid stage displacement');
  if(phase.travel==='stage')input={...input,root:{rotation:0,...input.root,dx:0}};
  const free=/:(flight|fly|swim|jet|hop|leap|climb)$/.test(phase.actionId)||phase.actionId==='melee:kick'||phase.realm==='aquatic'||phase.realm==='aerial'||phase.realm==='gas-giant';
  const stance=contactStanceForAction(template,phase.actionId),selected=free||stance==='none'?[]:chains.filter(c=>stance==='all'||(hindGroup?hindGroup.has(c.id):c.id.startsWith('hind')||c.id.startsWith('legHind')));
  if(!free&&stance==='hind'&&!selected.length)throw Error('Contact: declared hind stance has no chains');
  const gaitPolicy=template.contactStance?.gaits?.[phase.actionId],cycleAt=(phase.elapsedMs/phase.durationMs)%1;
  // Bounding lifts the forequarters during the authored upward spine stroke.
  // Other gait phases retain the established diagonal stance group. Lifted
  // limbs keep their authored keys rather than a second synthetic swing owner.
  const activeChains=!gaitPolicy?selected:gaitPolicy==='bounding'&&(input.spine?.rotation??0)<0?selected.filter(c=>c.id.startsWith('hind')):selected.filter(c=>!(c.group===1?cycleAt<.5:cycleAt>=.5));
  // A lifted leg keeps the authored pose and its original raw-clip guard.
  if(template.contactStance)for(const c of chains)if(!activeChains.includes(c))for(const j of [c.hip,c.knee,c.end,...c.terminal?[c.terminal]:[]]){const v=input[j];if(!v)continue;const l=template.limitsDeg[j]!,deg=v.rotation*180/Math.PI;if(deg<l.min-1e-7||deg>l.max+1e-7)throw Error('Contact: raw clip joint limit '+j+' '+phase.actionId+'@'+phase.elapsedMs+': '+deg);}
  if(!activeChains.length){program.evaluate(input);return {pose:input,contacts:[],maxError:0};}
  const weight=phase.weight??1;
  if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Contact: invalid blend weight');
  const sourceTravel=travelFor(phase,weight),gait=!!sourceTravel||/^approach:(walk|trot|gallop|crawl|scuttle)$/.test(phase.actionId);
  const pose:Record<string,{rotation:number;dx?:number;dy?:number}>=Object.fromEntries(Object.entries(input).map(([j,k])=>[j,{...k}]));
  // Preserve the existing shared leg-pivot owner; accommodation resolves reach
  // without transferring clip gait rotations into a second hip owner.
  for(const c of activeChains)if(template.legs.some(id=>c.hip===id+'Root'))pose[c.hip]={rotation:0};
  const progress=sourceTravel?.progress??phase.elapsedMs/phase.durationMs,cycle=sourceTravel?progress:progress%1,completed=Math.floor(progress);
  const smooth=(v:number)=>v*v*(3-2*v);
  // Replace only the authored horizontal curve; preserve any external offset.
  // Invalid translations must still reach the unchanged reach guard.
  if(gait)pose.root={rotation:0,...pose.root,dx:sourceTravel?(sourceTravel.base+sourceTravel.stride*progress)/program.bodyLength+(pose.root?.dx??0)-sourceTravel.authoredDx:phase.travel==='stage'?0:direction*stride*progress/program.bodyLength};
  const contacts=activeChains.map(c=>{
   const bodyPlanted=phase.travel==='stage'&&record.anatomy?.schema==='cf.anatomy-presence/v2'&&record.anatomy.folded?.includes(c.id)===true;
   const swing=!bodyPlanted&&gait&&!gaitPolicy&&(!sourceTravel||(sourceTravel.stride!==0&&progress<1))&&(c.group===1?cycle<.5:cycle>=.5),at=swing?(c.group===1?cycle*2:(cycle-.5)*2):0;
   const step=c.group===1?(cycle<.5?smooth(cycle*2):1):(cycle<.5?0:smooth((cycle-.5)*2));
   const lift=c.chain.lengths.lower*.15*weight;
   // Stage translation is signed and supplied by the caller, never inferred
   // from elapsed time. Only stance targets recede; airborne keys keep their
   // authored swing. Use the same measured scale as the stage adapter.
   const target={x:c.endPoint.x+(sourceTravel?sourceTravel.base+sourceTravel.stride*step:gait&&phase.travel!=='stage'?direction*stride*(completed+step):0)-(swing?Math.sign(c.endPoint.x-c.root.x)*c.chain.lengths.lower*.10*Math.sin(Math.PI*at)**2*weight:0),y:swingLift==='toward-socket'?c.endPoint.y+Math.sign(c.root.y-c.endPoint.y)*(swing?Math.sin(Math.PI*at)**2*lift:0):c.endPoint.y-(swing?Math.sin(Math.PI*at)**2*lift:0)};
   if(!swing&&!bodyPlanted&&phase.travel==='stage'&&phase.stageDisplacement!==undefined)target.x-=phase.stageDisplacement*scaleLength;
   return {joint:c.end,target,endpointTarget:{...target},paintedTarget:{x:target.x+c.offset.x,y:target.y+c.offset.y},stance:!swing,...bodyPlanted?{space:'body' as const}:{}};
  });
  if(padDeclaration){
   // A declared adhesive toe point remains fixed while its terminal joint can
   // rock within the original limits. No horizontal terrain plane is inferred.
   let matrices=program.evaluate(pose),compression=0;
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,target=contacts[i]!.paintedTarget,parent=matrices[c.hip]!,root=transformPoint(parent,c.root);
    const direct=c.terminalSolver!.solve({root,target,parentRotation:Math.atan2(parent[1],parent[0])});
    if(direct.status==='solved')continue;
    const ankle={x:target.x-c.offset.x,y:target.y-c.offset.y},dx=ankle.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower;
    if(Math.hypot(dx,ankle.y-root.y)<=max)continue;
    if(Math.abs(dx)>=max||ankle.y<root.y)throw Error('Contact pad: '+phase.actionId+'@'+phase.elapsedMs+' '+c.id+' outside accommodatable reach');
    compression=Math.max(compression,ankle.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y);
   }
   if(compression>scaleLength*.08)throw Error('Contact pad: exceeds scale compression bound');
   if(compression>0){pose.root={rotation:0,...pose.root,dy:(pose.root?.dy??0)+compression/program.bodyLength};matrices=program.evaluate(pose);}
   const padModes:Record<string,string>={};
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,contact=contacts[i]!,parent=matrices[c.hip]!,root=transformPoint(parent,c.root),solved=c.terminalSolver!.solve({root,target:contact.paintedTarget,parentRotation:Math.atan2(parent[1],parent[0])});
    if(solved.status!=='solved')throw Error('Contact pad: '+phase.actionId+'@'+phase.elapsedMs+' '+c.id+' no admitted candidate '+JSON.stringify(solved.attempts));
    pose[c.knee]={rotation:solved.rotations.knee};pose[c.end]={rotation:solved.rotations.end};pose[c.terminal!]={rotation:solved.rotations.terminal};contact.endpointTarget={...solved.points.end};padModes[c.end]=solved.mode;
   }
   const final=program.evaluate(pose);let maxError=0,maxPaintTargetErrorPx=0;
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,contact=contacts[i]!;
    for(const j of [c.knee,c.end,c.terminal!]){const l=(template.contactLimitsDeg??template.limitsDeg)[j]!,deg=pose[j]!.rotation*180/Math.PI;if(deg<l.min-1e-7||deg>l.max+1e-7)throw Error('Contact pad: joint limit '+j);}
    const endpoint=transformPoint(final[c.end]!,c.endPoint),paint=predictContactSupport(c.model,final);
    maxError=Math.max(maxError,Math.hypot(endpoint.x-contact.endpointTarget.x,endpoint.y-contact.endpointTarget.y));
    maxPaintTargetErrorPx=Math.max(maxPaintTargetErrorPx,Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height));
   }
   if(maxError>1e-8)throw Error('Contact pad: unresolved endpoint');
   if(maxPaintTargetErrorPx>.25)throw Error('Contact pad: painted support residual '+maxPaintTargetErrorPx);
   return {pose,contacts,maxError,compression,maxPaintTargetErrorPx,padModes};
  }
  const uncompressedRoot=pose.root;
  let compression=0,final=program.evaluate(pose);
  const rigidEligible=hasOffset&&activeChains.every(c=>c.endpointOnly);
  let iterativeFailure:unknown;
  // Initial endpoint solve, then at most three fixed-point support corrections.
  // Every pass solves exactly to its declared endpoint target; no reach clamp.
  try{for(let pass=0;pass<=(hasOffset?3:0);pass++){
   if(pass)for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,contact=contacts[i]!,m=final[c.end]!;
    // Preserve R2c's exact arithmetic for its endpoint-only reduction.
    if(c.endpointOnly)contact.endpointTarget={x:contact.paintedTarget.x-m[0]*c.offset.x-m[2]*c.offset.y,y:contact.paintedTarget.y-m[1]*c.offset.x-m[3]*c.offset.y};
    else{const predicted=predictContactSupport(c.model,final);contact.endpointTarget={x:contact.endpointTarget.x+(contact.paintedTarget.x-predicted.x),y:contact.endpointTarget.y+(contact.paintedTarget.y-predicted.y)};}}
   let matrices=program.evaluate(pose),shift=0;
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,target=contacts[i]!.endpointTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower;
    if(Math.hypot(dx,target.y-root.y)<=max)continue;
    if(Math.abs(dx)>=max||target.y<root.y)throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' '+c.id+' outside accommodatable reach');
    shift=Math.max(shift,target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y);
   }
   if(compression+shift>scaleLength*.08)throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' exceeds scale compression bound');
   if(shift>0){compression+=shift;pose.root={rotation:0,...pose.root,dy:(pose.root?.dy??0)+shift/program.bodyLength};matrices=program.evaluate(pose);}
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,target=contacts[i]!.endpointTarget,parent=matrices[c.hip]!,root=transformPoint(parent,c.root);
    let solved;try{solved=c.chain.solve(root,target);}catch(error){throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' '+c.id+' '+String(error));}
    const upper=wrapped(angle(solved.root,solved.joint)-angle(c.root,c.joint));
    const lower=wrapped(angle(solved.joint,solved.end)-angle(c.joint,c.endPoint));
    pose[c.knee]={rotation:wrapped(upper-Math.atan2(parent[1],parent[0]))};pose[c.end]={rotation:wrapped(lower-upper)};
    if(c.terminal)pose[c.terminal]={rotation:wrapped(-lower)};
   }
   final=program.evaluate(pose);
  }}catch(error){if(!rigidEligible)throw error;iterativeFailure=error;}
  const measure=()=>{
   let maxError=0,maxPaintTargetErrorPx=0;
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,contact=contacts[i]!;
    for(const j of [c.knee,c.end,...c.terminal?[c.terminal]:[]]){const l=(template.contactLimitsDeg??template.limitsDeg)[j]!,deg=pose[j]!.rotation*180/Math.PI;if(deg<l.min-1e-7||deg>l.max+1e-7)throw Error('Contact: joint limit '+j+' '+phase.actionId+'@'+phase.elapsedMs+': '+deg);}
    const p=transformPoint(final[c.end]!,c.endPoint),paint=c.endpointOnly?transformPoint(final[c.end]!,c.support):predictContactSupport(c.model,final);
    maxError=Math.max(maxError,Math.hypot(p.x-contact.endpointTarget.x,p.y-contact.endpointTarget.y));
    maxPaintTargetErrorPx=Math.max(maxPaintTargetErrorPx,Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height));
   }
   if(maxError>1e-8)throw Error('Contact: unresolved endpoint');
   return {maxError,maxPaintTargetErrorPx};
  };
  let measured={maxError:0,maxPaintTargetErrorPx:Infinity};
  if(iterativeFailure===undefined){try{measured=measure();}catch(error){if(!rigidEligible)throw error;iterativeFailure=error;}}
  // Preserve the exact accepted three-pass path. A rigid offset near a straight
  // knee can oscillate instead of converging. When every active support belongs
  // solely to its endpoint, solve that rigid point analytically. Mixed weights
  // retain their existing fixed-point path and refusal; no fit-specific rule.
  // An iterative reach/limit refusal can precede its residual assessment.
  // A rigid painted support still has an exact analytic solution to attempt;
  // it must independently satisfy every original bound from the authored root.
  if((iterativeFailure!==undefined||measured.maxPaintTargetErrorPx>.25)&&rigidEligible){try{
   const rigid=activeChains.map(c=>{
    let chain=rigidSupportChains.get(c.id);
    if(!chain){const cross=(c.support.x-c.root.x)*(c.joint.y-c.root.y)-(c.support.y-c.root.y)*(c.joint.x-c.root.x);
     chain=createTwoBoneChain({root:c.root,joint:c.joint,end:c.support,bend:cross<0?-1:1});rigidSupportChains.set(c.id,chain);}
    return chain;
   });
   // Recompute accommodation from the authored root, not from corrections that
   // belonged to the failed endpoint iteration. The same compression cap applies.
   if(uncompressedRoot)pose.root=uncompressedRoot;else delete pose.root;
   let matrices=program.evaluate(pose),shift=0;
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,target=contacts[i]!.paintedTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=rigid[i]!.lengths.upper+rigid[i]!.lengths.lower;
    if(Math.hypot(dx,target.y-root.y)<=max)continue;
    if(Math.abs(dx)>=max||target.y<root.y)throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' '+c.id+' rigid support outside accommodatable reach');
    shift=Math.max(shift,target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y);
   }
   if(shift>scaleLength*.08)throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' rigid support exceeds scale compression bound');
   compression=shift;
   if(shift>0){pose.root={rotation:0,...pose.root,dy:(pose.root?.dy??0)+shift/program.bodyLength};matrices=program.evaluate(pose);}
   for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,contact=contacts[i]!,parent=matrices[c.hip]!,root=transformPoint(parent,c.root),solved=rigid[i]!.solve(root,contact.paintedTarget);
    const upper=wrapped(angle(solved.root,solved.joint)-angle(c.root,c.joint));
    const lower=wrapped(angle(solved.joint,solved.end)-angle(c.joint,c.support));
    pose[c.knee]={rotation:wrapped(upper-Math.atan2(parent[1],parent[0]))};pose[c.end]={rotation:wrapped(lower-upper)};
    if(c.terminal)pose[c.terminal]={rotation:wrapped(-lower)};
    // The anatomical lower bone is unchanged: rotate its original vector from
    // the solved knee. The rigid support is only the IK target, not a new joint.
    const dx=c.endPoint.x-c.joint.x,dy=c.endPoint.y-c.joint.y,cos=Math.cos(lower),sin=Math.sin(lower);
    contact.endpointTarget={x:solved.joint.x+cos*dx-sin*dy,y:solved.joint.y+sin*dx+cos*dy};
   }
   final=program.evaluate(pose);measured=measure();
  }catch(error){if(iterativeFailure!==undefined){if(iterativeFailure instanceof Error)iterativeFailure.cause=error;throw iterativeFailure;}throw error;}}
  if(measured.maxPaintTargetErrorPx>.25)throw Error('Contact: painted support iteration residual '+measured.maxPaintTargetErrorPx);
  return {pose,contacts,maxError:measured.maxError,compression,maxPaintTargetErrorPx:measured.maxPaintTargetErrorPx};
 }};
}

/** Independent rendered support sample: positions are normalized source pixels.
 * A real footprint may be offset from the endpoint; preserve that rest offset. */
export function contactPaintDriftPx(current:readonly number[],source:readonly number[],target:readonly number[],rest:readonly number[],size:readonly number[]):number{
 if([current,source,target,rest,size].some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)))||size.some(v=>v<=0))throw Error('Contact paint: invalid sample');
 return Math.hypot((current[0]!-source[0]!-(target[0]!-rest[0]!))*size[0]!, (current[1]!-source[1]!-(target[1]!-rest[1]!))*size[1]!);
}
