import {turnSequenceFrame} from './turn-performance.mjs';
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const finitePose=pose=>{
 if(!pose||typeof pose!=='object'||Array.isArray(pose))throw Error('Invalid turn contact pose');
 for(const key of Object.values(pose))if(!key||![key.rotation,key.dx??0,key.dy??0].every(Number.isFinite))throw Error('Nonfinite turn contact pose');
 return pose;
};

/** Stateless support transitions for the current proof's two-turn sequence.
 * The existing solver admits each grounded boundary under its unchanged bound.
 * Its correction fades over the existing approach/return window; an airborne
 * pose is never forced through a grounded solve or a weakened contact limit.
 * Plan snapshots prevent later caller edits from invalidating cached boundaries.
 */
export function createTurnContactSampler({plans:inputPlans,motionSampler,solver}){
 const plans=structuredClone(inputPlans);turnSequenceFrame(plans,0);
 if(typeof motionSampler?.sampleSequence!=='function'||typeof solver?.resolve!=='function')throw Error('Turn contact owners required');
 const beats=plans[0].beats;
 if(![beats.commandEnd,beats.actionStart,beats.actionEnd,beats.returnEnd].every(Number.isFinite)
  ||beats.commandEnd<0||beats.commandEnd>=beats.actionStart||beats.actionStart>=beats.actionEnd||beats.actionEnd>=beats.returnEnd||beats.returnEnd>=5000)throw Error('Invalid support windows');
 const sample=ms=>finitePose(structuredClone(motionSampler.sampleSequence(plans,ms)));
 const boundary=ms=>{
  const raw=sample(ms),solved=solver.resolve(raw,true);finitePose(solved.pose);
  if(!Number.isFinite(solved.compression)||solved.compression<0)throw Error('Invalid contact compression');
  const delta={};for(const name of new Set([...Object.keys(raw),...Object.keys(solved.pose)])){
   const a=raw[name],b=solved.pose[name];delta[name]={rotation:(b?.rotation??0)-(a?.rotation??0),dx:(b?.dx??0)-(a?.dx??0),dy:(b?.dy??0)-(a?.dy??0)};
  }
  return {delta,compression:solved.compression};
 };
 const release=boundary(beats.commandEnd),landing=boundary(beats.returnEnd);
 return {
  sample,
  resolve(ms,sampledPose){
   const frame=turnSequenceFrame(plans,ms),raw=sampledPose===undefined?sample(ms):finitePose(structuredClone(sampledPose)),t=frame.localMs;
   if(frame.target||t<=beats.commandEnd||t>=beats.returnEnd){
    const solved=solver.resolve(raw,true);finitePose(solved.pose);
    return {...solved,raw,planted:true,supportWeight:1,role:frame.target?'target':'attacker',localMs:t};
   }
   let supportWeight=0,correction;
   if(t<beats.actionStart){supportWeight=1-smooth((t-beats.commandEnd)/(beats.actionStart-beats.commandEnd));correction=release;}
   else if(t>=beats.actionEnd){supportWeight=smooth((t-beats.actionEnd)/(beats.returnEnd-beats.actionEnd));correction=landing;}
   let pose=raw;
   if(supportWeight>0){pose={};for(const name of new Set([...Object.keys(raw),...Object.keys(correction.delta)])){
    const a=raw[name],d=correction.delta[name];pose[name]={rotation:(a?.rotation??0)+(d?.rotation??0)*supportWeight,dx:(a?.dx??0)+(d?.dx??0)*supportWeight,dy:(a?.dy??0)+(d?.dy??0)*supportWeight};
   }}
   finitePose(pose);
   return {pose,raw,compression:(correction?.compression??0)*supportWeight,planted:false,supportWeight,role:'attacker',localMs:t};
  },
 };
}
