/** Record-driven planted contact constraint, separate from clip authoring.
 * Preserves each authored paw's perspective offset. No creature names/genes,
 * clocks, curve edits, or nearest-bone fitting. Flight passes through unchanged. */
import type {CreaturePoseV1,CreatureRigRecordV1,CreaturePartsBindingV1} from './creature-rig.js';
import {measureMotionScale} from '../../../tools/creature-animation/motion-scale.mjs';
import {familyContractForRecord,familyContactChains,contactStanceForAction} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
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
 readonly surface?:{readonly partId:string;readonly vertexIndex:number};
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
 const supports:Record<string,WeightedContactSupport>={};
 for(const chain of familyContactChains(familyContractForRecord(record))){
  const owner=binding.parts.find(p=>p.joint===chain.end),part=skin.parts.find(p=>p.id===owner?.id),end=record.landmarks[chain.end]!;
  if(!part)throw Error('Contact: missing painted surface '+chain.end);
  let best:WeightedContactSupport|undefined,distance=Infinity;
  for(const [vertexIndex,v] of part.vertices.entries()){let x=0,y=0;for(let k=0;k<3;k++){const p=skin.vertices[v.triangle[k]!]!,weight=v.barycentric[k]!;x+=p.x*weight/record.geometry.width;y+=p.y*weight/record.geometry.height;}
   const d=Math.hypot((x-end[0])*record.geometry.width,(y-end[1])*record.geometry.height);if(d<distance){distance=d;best={rest:[x,y],surface:{partId:part.id,vertexIndex},vertices:v.triangle.map((index,k)=>{const vertex=skin.vertices[index]!;return{rest:[vertex.x/record.geometry.width,vertex.y/record.geometry.height] as const,barycentric:v.barycentric[k]!,weights:vertex.weights.map(([j,w])=>[j,w] as const)};})};}}
  if(!best)throw Error('Contact: empty painted surface '+chain.end);supports[chain.end]=best;
 }return Object.freeze(supports);
}
export interface ContactPhase {readonly actionId:string;readonly elapsedMs:number;readonly durationMs:number;readonly realm?:string;readonly weight?:number;readonly travel?:'solver'|'stage';/** Signed stage translation already applied, in measured body-length units. */readonly stageDisplacement?:number;}
/** Source graph contacts for stance and alternating support. Elapsed phase is
 * explicit and replayable; rendering cadence is not solver state. */
export function createFamilyContactSolver(record:CreatureRigRecordV1,paintedSupports:Readonly<Record<string,ContactSupport>>={}){
 const template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks);
 const chains=familyContactChains(template).map(c=>{
  const root=point(record.landmarks[c.hip]!),joint=point(record.landmarks[c.knee]!),end=point(record.landmarks[c.end]!);
  const cross=(end.x-root.x)*(joint.y-root.y)-(end.y-root.y)*(joint.x-root.x);
  if(Math.abs(cross)<1e-12)throw Error('Contact: source bend direction missing '+c.id);
  const declaration=paintedSupports[c.end]??record.landmarks[c.end]!;
  const model:WeightedContactSupport='rest' in declaration?declaration:{rest:declaration,vertices:[{rest:declaration,barycentric:1,weights:[[c.end,1]]}]},support=model.rest;
  if(support.length!==2||support.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Contact: invalid painted support '+c.end);
  if(!model.vertices.length||model.vertices.length>3||Math.abs(model.vertices.reduce((s,v)=>s+v.barycentric,0)-1)>1e-8)throw Error('Contact: invalid support interpolation '+c.end);
  for(const v of model.vertices)if(v.rest.length!==2||v.rest.some(n=>!Number.isFinite(n)||n<0||n>1)||!Number.isFinite(v.barycentric)||v.barycentric< -1e-8||!v.weights.length||new Set(v.weights.map(([j])=>j)).size!==v.weights.length||v.weights.some(([j,w])=>!Object.hasOwn(record.landmarks,j)||!Number.isFinite(w)||w<=0)||Math.abs(v.weights.reduce((s,[,w])=>s+w,0)-1)>1e-8)throw Error('Contact: invalid support weights '+c.end);
  const endpointOnly=model.vertices.every(v=>v.barycentric===0||(v.weights.length===1&&v.weights[0]![0]===c.end&&v.weights[0]![1]===1));
  return {...c,root,joint,endPoint:end,support:point(support),model,endpointOnly,offset:{x:support[0]-end.x,y:support[1]-end.y},chain:createTwoBoneChain({root,joint,end,bend:cross<0?-1:1})};
 });
 if(Object.keys(paintedSupports).length&&(Object.keys(paintedSupports).length!==chains.length||chains.some(c=>!Object.hasOwn(paintedSupports,c.end))))throw Error('Contact: exact painted support inventory required');
 const scaleLength=measureMotionScale(template,record.landmarks).length;
 const stride=chains.length?Math.min(...chains.map(c=>c.chain.lengths.upper+c.chain.lengths.lower))*.04:0;
 const direction=template.id==='brachyuran'?Math.sign(record.landmarks.leg0NearRoot![0]-record.landmarks.leg0FarRoot![0]):1;
 const hasOffset=chains.some(c=>c.offset.x!==0||c.offset.y!==0||!c.endpointOnly);
 return {chains,scaleLength,stride,resolve(input:CreaturePoseV1,phase:ContactPhase){
  if(!Number.isFinite(phase.elapsedMs)||phase.elapsedMs<0||!Number.isFinite(phase.durationMs)||phase.durationMs<=0)throw Error('Contact: invalid phase');
  if(phase.travel!==undefined&&phase.travel!=='solver'&&phase.travel!=='stage')throw Error('Contact: invalid travel owner');
  if(phase.travel==='stage'&&phase.stageDisplacement!==undefined&&!Number.isFinite(phase.stageDisplacement))throw Error('Contact: invalid stage displacement');
  if(phase.travel==='stage')input={...input,root:{rotation:0,...input.root,dx:0}};
  const free=/:(flight|fly|swim|jet|hop|leap|climb)$/.test(phase.actionId)||phase.actionId==='melee:kick'||phase.realm==='aquatic'||phase.realm==='aerial'||phase.realm==='gas-giant';
  const stance=contactStanceForAction(template,phase.actionId),selected=free||stance==='none'?[]:chains.filter(c=>stance==='all'||c.id.startsWith('hind'));
  const gaitPolicy=template.contactStance?.gaits?.[phase.actionId],cycleAt=(phase.elapsedMs/phase.durationMs)%1;
  // Bounding lifts the forequarters during the authored upward spine stroke.
  // Other gait phases retain the established diagonal stance group. Lifted
  // limbs keep their authored keys rather than a second synthetic swing owner.
  const activeChains=!gaitPolicy?selected:gaitPolicy==='bounding'&&(input.spine?.rotation??0)<0?selected.filter(c=>c.id.startsWith('hind')):selected.filter(c=>!(c.group===1?cycleAt<.5:cycleAt>=.5));
  // A lifted leg keeps the authored pose and its original raw-clip guard.
  if(template.contactStance)for(const c of chains)if(!activeChains.includes(c))for(const j of [c.hip,c.knee,c.end,...c.terminal?[c.terminal]:[]]){const v=input[j];if(!v)continue;const l=template.limitsDeg[j]!,deg=v.rotation*180/Math.PI;if(deg<l.min-1e-7||deg>l.max+1e-7)throw Error('Contact: raw clip joint limit '+j+' '+phase.actionId+'@'+phase.elapsedMs+': '+deg);}
  if(!activeChains.length)return {pose:input,contacts:[],maxError:0};
  const gait=/^approach:(walk|trot|gallop|crawl|scuttle)$/.test(phase.actionId),weight=phase.weight??1;
  if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Contact: invalid blend weight');
  const pose:Record<string,{rotation:number;dx?:number;dy?:number}>=Object.fromEntries(Object.entries(input).map(([j,k])=>[j,{...k}]));
  // Preserve the existing shared leg-pivot owner; accommodation resolves reach
  // without transferring clip gait rotations into a second hip owner.
  for(const c of activeChains)if(template.legs.some(id=>c.hip===id+'Root'))pose[c.hip]={rotation:0};
  const progress=phase.elapsedMs/phase.durationMs,cycle=progress%1,completed=Math.floor(progress);
  const smooth=(v:number)=>v*v*(3-2*v);
  if(gait)pose.root={rotation:0,...pose.root,dx:phase.travel==='stage'?0:direction*stride*progress/program.bodyLength};
  const contacts=activeChains.map(c=>{
   const bodyPlanted=phase.travel==='stage'&&record.anatomy?.schema==='cf.anatomy-presence/v2'&&record.anatomy.folded?.includes(c.id)===true;
   const swing=!bodyPlanted&&gait&&!gaitPolicy&&(c.group===1?cycle<.5:cycle>=.5),at=swing?(c.group===1?cycle*2:(cycle-.5)*2):0;
   const step=c.group===1?(cycle<.5?smooth(cycle*2):1):(cycle<.5?0:smooth((cycle-.5)*2));
   const lift=c.chain.lengths.lower*.15*weight;
   // Stage translation is signed and supplied by the caller, never inferred
   // from elapsed time. Only stance targets recede; airborne keys keep their
   // authored swing. Use the same measured scale as the stage adapter.
   const target={x:c.endPoint.x+(gait&&phase.travel!=='stage'?direction*stride*(completed+step):0)-(swing?Math.sign(c.endPoint.x-c.root.x)*c.chain.lengths.lower*.10*Math.sin(Math.PI*at)**2*weight:0),y:c.endPoint.y-(swing?Math.sin(Math.PI*at)**2*lift:0)};
   if(!swing&&!bodyPlanted&&phase.travel==='stage'&&phase.stageDisplacement!==undefined)target.x-=phase.stageDisplacement*scaleLength;
   return {joint:c.end,target,endpointTarget:{...target},paintedTarget:{x:target.x+c.offset.x,y:target.y+c.offset.y},stance:!swing,...bodyPlanted?{space:'body' as const}:{}};
  });
  let compression=0,final=program.evaluate(pose);
  // Initial endpoint solve, then at most three fixed-point support corrections.
  // Every pass solves exactly to its declared endpoint target; no reach clamp.
  for(let pass=0;pass<=(hasOffset?3:0);pass++){
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
  }
  let maxError=0,maxPaintTargetErrorPx=0;
  for(let i=0;i<activeChains.length;i++){const c=activeChains[i]!,contact=contacts[i]!;
   for(const j of [c.knee,c.end,...c.terminal?[c.terminal]:[]]){const l=(template.contactLimitsDeg??template.limitsDeg)[j]!,deg=pose[j]!.rotation*180/Math.PI;if(deg<l.min-1e-7||deg>l.max+1e-7)throw Error('Contact: joint limit '+j+' '+phase.actionId+'@'+phase.elapsedMs+': '+deg);}
   const p=transformPoint(final[c.end]!,c.endPoint),paint=c.endpointOnly?transformPoint(final[c.end]!,c.support):predictContactSupport(c.model,final);
   maxError=Math.max(maxError,Math.hypot(p.x-contact.endpointTarget.x,p.y-contact.endpointTarget.y));
   maxPaintTargetErrorPx=Math.max(maxPaintTargetErrorPx,Math.hypot((paint.x-contact.paintedTarget.x)*record.geometry.width,(paint.y-contact.paintedTarget.y)*record.geometry.height));
  }
  if(maxError>1e-8)throw Error('Contact: unresolved endpoint');
  if(maxPaintTargetErrorPx>.25)throw Error('Contact: painted support iteration residual '+maxPaintTargetErrorPx);
  return {pose,contacts,maxError,compression,maxPaintTargetErrorPx};
 }};
}

/** Independent rendered support sample: positions are normalized source pixels.
 * A real footprint may be offset from the endpoint; preserve that rest offset. */
export function contactPaintDriftPx(current:readonly number[],source:readonly number[],target:readonly number[],rest:readonly number[],size:readonly number[]):number{
 if([current,source,target,rest,size].some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)))||size.some(v=>v<=0))throw Error('Contact paint: invalid sample');
 return Math.hypot((current[0]!-source[0]!-(target[0]!-rest[0]!))*size[0]!, (current[1]!-source[1]!-(target[1]!-rest[1]!))*size[1]!);
}
