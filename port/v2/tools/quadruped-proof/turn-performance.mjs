/** The proof consumes the pinned producer without modifying any creature curve.
 * Pure explicit-time turn sampling is shared by gates and the filmed frame owner. */
export function createTurnPoseSampler(createGsapPlayer){
 const players=new Map();let disposed=false;
 const clipPose=(clip,ms)=>{
  if(disposed)throw Error('Turn pose sampler disposed');
  if(clip.source!=='timeline')return {};
  let entry=players.get(clip);
  if(!entry){const pose={};entry={pose,player:createGsapPlayer(clip.timeline,{setJoint(name,rotation,dx,dy){pose[name]={rotation,dx,dy};}},{now:()=>{throw Error('Proof sampler must not read a clock');}})};players.set(clip,entry);}
  entry.player.seek(ms);return entry.pose;
 };
 const add=(a,b)=>{const out={};for(const source of [a,b])for(const[n,v]of Object.entries(source)){const old=out[n]??{rotation:0,dx:0,dy:0};out[n]={rotation:old.rotation+v.rotation,dx:old.dx+(v.dx??0),dy:old.dy+(v.dy??0)};}return out;};
 const sample=(plan,ms,target=false,idleOverride)=>{
   if(disposed||!Number.isFinite(ms)||ms<0)throw Error('Invalid turn sample');
   const b=plan.beats,c=plan.clips,ic=ms<b.impactAt?ms:ms<b.hitstopEnd?b.impactAt:ms-(b.hitstopEnd-b.impactAt);
   const idle=idleOverride?clipPose(idleOverride.clip,idleOverride.ms):clipPose(target?c.target.idle:c.attacker.idle,ic);
   if(target){let pose=idle;if(c.target.reaction&&ms>=b.reactionStart)pose=add(pose,clipPose(c.target.reaction,ms-b.reactionStart));return pose;}
   let pose=idle;
   if(ms>=b.commandEnd&&ms<b.actionStart)pose=add(pose,clipPose(c.attacker.approach,(ms-b.commandEnd)/(b.actionStart-b.commandEnd)*c.attacker.approach.timeline.durationMs));
   else if(ms>=b.actionStart&&ms<b.actionEnd)pose=add(pose,clipPose(c.attacker.action,ic-b.actionStart));
   else if(ms>=b.actionEnd&&ms<b.returnEnd)pose=add(pose,clipPose(c.attacker.approach,(ms-b.actionEnd)/(b.returnEnd-b.actionEnd)*c.attacker.approach.timeline.durationMs));
   else if(ms>=b.returnEnd&&plan.targetFaints)pose=add(pose,clipPose(c.attacker.after,ms-b.returnEnd));
   return pose;
 };
 return {
  sample,
  /** One subject keeps its own seeded idle across the two proof roles. Both
   * hitstop intervals pause this explicit clock; a role change never resets it. */
  sampleSequence(plans,ms,side='left'){
   if(!['left','right'].includes(side))throw Error('Invalid subject side');
   const frame=turnSequenceFrame(plans,ms);let held=0;
   for(let i=0;i<=frame.index;i++){const b=plans[i].beats,local=ms-i*5000;held+=Math.max(0,Math.min(local-b.impactAt,b.hitstopEnd-b.impactAt));}
   return sample(frame.plan,frame.localMs,side==='right'?!frame.target:frame.target,{clip:side==='right'?plans[0].clips.target.idle:plans[0].clips.attacker.idle,ms:ms-held});
  },
  dispose(){if(disposed)return;disposed=true;for(const entry of players.values())entry.player.stop();players.clear();},
 };
}

/** Eight named observations plus a dense scan use the same current motion as
 * the film. No archived pose can stand in for the current producer. */
export function turnPoseTimes(plans){
 const p=plans[0],q=plans[1],stride=f=>p.beats.commandEnd+(p.beats.actionStart-p.beats.commandEnd)*f*p.clips.attacker.approach.timeline.bodyMs/p.clips.attacker.approach.timeline.durationMs;
 return {rest:null,idle:500,anticipation:p.beats.actionStart+60,strike:p.beats.impactAt,'impact-hold':p.beats.hitstopEnd+170,'hit-recoil':7400,'hit-peak':5000+q.beats.reactionStart+q.clips.target.reaction.timeline.bodyMs*.35,'approach-quarter':stride(.25),'approach-three-quarter':stride(.75),'return-end':p.beats.returnEnd};
}

/** The existing ten-second proof consists of two fixed five-second turn roles.
 * This does not retime compiler clips or a battle's authoritative turn plan. */
export function turnSequenceFrame(plans,ms){
 if(!Array.isArray(plans)||plans.length!==2||!Number.isFinite(ms)||ms<0||ms>10000)throw Error('Invalid turn sequence');
 for(const p of plans){const b=p?.beats;if(!b||![b.impactAt,b.hitstopEnd].every(Number.isFinite)||b.impactAt<0||b.hitstopEnd<b.impactAt||b.hitstopEnd>5000)throw Error('Invalid turn hitstop');}
 const index=ms>=5000?1:0;return{index,plan:plans[index],localMs:ms-index*5000,target:index===1};
}
