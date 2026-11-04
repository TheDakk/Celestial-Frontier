/** Opt-in mathematical candidate planner for a rigid terminal painted support.
 * No family, contact-selection, root-accommodation, renderer or clock policy.
 * It enumerates zero-world-foot rotation and the two supplied terminal bounds;
 * a refusal means no admitted candidate, not global three-link infeasibility. */
import {createTwoBoneChain,KINEMATICS_LIMITS,type Point2} from '../../../tools/creature-animation/kinematics.js';
export interface TerminalJointLimit {readonly min:number;readonly max:number;}
export interface TerminalContactRest {
 readonly root:Point2;readonly joint:Point2;readonly end:Point2;readonly support:Point2;readonly bend:1|-1;
 readonly limits:Readonly<{knee:TerminalJointLimit;end:TerminalJointLimit;terminal:TerminalJointLimit}>;
}
export interface TerminalContactInput {readonly root:Point2;readonly target:Point2;readonly parentRotation:number;}
export interface TerminalContactCandidate {
 readonly mode:'preferred'|'terminal-min'|'terminal-max';
 readonly rotations:Readonly<{knee:number;end:number;terminal:number}>;
 readonly points:Readonly<{root:Point2;joint:Point2;end:Point2;support:Point2}>;
 readonly footRotation:number;readonly supportError:number;
 readonly lengthErrors:Readonly<{upper:number;lower:number;terminal:number}>;
}
export interface TerminalContactAttempt {readonly mode:TerminalContactCandidate['mode'];readonly branch:1|-1;readonly reason:string;}
export type TerminalContactResult =
 | (TerminalContactCandidate&{readonly status:'solved';readonly candidates:readonly TerminalContactCandidate[];readonly attempts:readonly TerminalContactAttempt[]})
 | {readonly status:'refused';readonly reason:'no-admitted-candidate';readonly candidates:readonly TerminalContactCandidate[];readonly attempts:readonly TerminalContactAttempt[]};
const wrap=(x:number)=>{const a=Math.atan2(Math.sin(x),Math.cos(x));return a===0?0:a;};
const minus=(a:Point2,b:Point2):Point2=>({x:a.x-b.x,y:a.y-b.y});
const plus=(a:Point2,b:Point2):Point2=>({x:a.x+b.x,y:a.y+b.y});
const rotate=(v:Point2,a:number):Point2=>({x:Math.cos(a)*v.x-Math.sin(a)*v.y,y:Math.sin(a)*v.x+Math.cos(a)*v.y});
const angle=(v:Point2)=>Math.atan2(v.y,v.x),length=(v:Point2)=>Math.hypot(v.x,v.y);
const cross=(a:Point2,b:Point2)=>a.x*b.y-a.y*b.x;
const copyPoint=(p:Point2):Point2=>{
 if(!p||![p.x,p.y].every(Number.isFinite)||Math.max(Math.abs(p.x),Math.abs(p.y))>KINEMATICS_LIMITS.maxCoordinate)throw Error('Terminal contact: invalid point');
 return Object.freeze({x:p.x,y:p.y});
};
export function createTerminalContactSolver(input:TerminalContactRest){
 const root=copyPoint(input.root),joint=copyPoint(input.joint),end=copyPoint(input.end),support=copyPoint(input.support),bend=input.bend;
 const chain=createTwoBoneChain({root,joint,end,bend}),upper=minus(joint,root),lower=minus(end,joint),foot=minus(support,end);
 const lengths={upper:length(upper),lower:length(lower),terminal:length(foot)};
 if(lengths.terminal<KINEMATICS_LIMITS.minSegment)throw Error('Terminal contact: degenerate terminal support');
 const limits=Object.fromEntries(['knee','end','terminal'].map(name=>{
  const l=input.limits[name as keyof TerminalContactRest['limits']];
  if(!l||![l.min,l.max].every(Number.isFinite)||l.min>l.max)throw Error('Terminal contact: invalid joint limit '+name);
  return [name,Object.freeze({min:l.min,max:l.max})];
 })) as unknown as TerminalContactRest['limits'];
 // A fixed terminal angle turns lower leg plus rigid foot into one effective
 // vector. Canonical virtual triangles carry only those exact lengths; both
 // analytic bend branches are considered, then the anatomical branch is checked.
 const boundaries=(['terminal-min','terminal-max'] as const).map((mode,i)=>{
  const terminal=i===0?limits.terminal.min:limits.terminal.max,effective=plus(lower,rotate(foot,terminal)),span=length(effective);
  if(span<KINEMATICS_LIMITS.minSegment)return {mode,terminal,effective,solvers:[]};
  return {mode,terminal,effective,solvers:([1,-1] as const).map(branch=>{
   const x=-branch*lengths.upper;
   return {branch,chain:createTwoBoneChain({root:{x:0,y:0},joint:{x,y:0},end:{x,y:span},bend:branch})};
  })};
 });
 return Object.freeze({solve(sample:TerminalContactInput):TerminalContactResult{
  const h=copyPoint(sample.root),target=copyPoint(sample.target),parent=sample.parentRotation;
  if(!Number.isFinite(parent))throw Error('Terminal contact: invalid parent rotation');
  const candidates:TerminalContactCandidate[]=[],attempts:TerminalContactAttempt[]=[];
  const accept=(mode:TerminalContactCandidate['mode'],branch:1|-1,knee:number,ankle:number,terminal:number)=>{
   const rotations={knee,end:ankle,terminal};
   for(const name of ['knee','end','terminal'] as const){const value=rotations[name],l=limits[name];if(!Number.isFinite(value)||value<l.min||value>l.max){attempts.push({mode,branch,reason:'joint limit '+name});return;}}
   const worldUpper=parent+knee,worldLower=worldUpper+ankle,worldFoot=worldLower+terminal;
   const atRest=h.x===root.x&&h.y===root.y&&knee===0&&ankle===0&&terminal===0&&parent===0;
   const k=atRest?joint:plus(h,rotate(upper,worldUpper)),a=atRest?end:plus(k,rotate(lower,worldLower)),p=atRest?support:plus(a,rotate(foot,worldFoot));
   const side=cross(minus(a,h),minus(k,h));
   if(side!==0&&Math.sign(side)!==bend){attempts.push({mode,branch,reason:'anatomical bend branch'});return;}
   const supportError=length(minus(p,target)),lengthErrors={upper:Math.abs(length(minus(k,h))-lengths.upper),lower:Math.abs(length(minus(a,k))-lengths.lower),terminal:Math.abs(length(minus(p,a))-lengths.terminal)};
   // Roundoff check, not a contact tolerance: the caller still owns its exact
   // published-paint gate and every support/ground-clearance requirement.
   const roundoff=128*Number.EPSILON*Math.max(1,...[h,k,a,p,target].flatMap(q=>[Math.abs(q.x),Math.abs(q.y)]),...Object.values(lengths));
   if(!Number.isFinite(supportError)||supportError>roundoff||Object.values(lengthErrors).some(e=>!Number.isFinite(e)||e>roundoff)){attempts.push({mode,branch,reason:'analytic reconstruction roundoff'});return;}
   candidates.push(Object.freeze({mode,rotations:Object.freeze(rotations),points:Object.freeze({root:h,joint:copyPoint(k),end:copyPoint(a),support:copyPoint(p)}),footRotation:wrap(worldFoot),supportError,lengthErrors:Object.freeze(lengthErrors)}));
  };
  try{
   const pose=chain.solve(h,minus(target,foot)),worldUpper=angle(minus(pose.joint,h))-angle(upper),worldLower=angle(minus(pose.end,pose.joint))-angle(lower);
   accept('preferred',bend,wrap(worldUpper-parent),wrap(worldLower-worldUpper),wrap(-worldLower));
  }catch(error){attempts.push({mode:'preferred',branch:bend,reason:String(error)});}
  for(const boundary of boundaries){
   if(!boundary.solvers.length){attempts.push({mode:boundary.mode,branch:bend,reason:'degenerate effective support vector'});continue;}
   for(const alternative of boundary.solvers){try{
    const pose=alternative.chain.solve(h,target),worldUpper=angle(minus(pose.joint,h))-angle(upper),worldLower=angle(minus(target,pose.joint))-angle(boundary.effective);
    accept(boundary.mode,alternative.branch,wrap(worldUpper-parent),wrap(worldLower-worldUpper),boundary.terminal);
   }catch(error){attempts.push({mode:boundary.mode,branch:alternative.branch,reason:String(error)});}}
  }
  const rank={'preferred':0,'terminal-min':1,'terminal-max':2};
  candidates.sort((a,b)=>a.mode==='preferred'?-1:b.mode==='preferred'?1:Math.abs(a.footRotation)-Math.abs(b.footRotation)||rank[a.mode]-rank[b.mode]);
  const all=Object.freeze(candidates),diagnostics=Object.freeze(attempts),first=all[0];
  return first?Object.freeze({...first,status:'solved' as const,candidates:all,attempts:diagnostics}):Object.freeze({status:'refused' as const,reason:'no-admitted-candidate' as const,candidates:all,attempts:diagnostics});
 }});
}
