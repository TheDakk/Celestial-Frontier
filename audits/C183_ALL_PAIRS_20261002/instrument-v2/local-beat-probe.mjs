/** Diagnostic-only semantic seeking. Live capture must keep its ordinary clock. */
const need=(value,why)=>{if(!value)throw Error('Exact local probe: '+why);};
export function probeTurnAtLocalTime({stage,setClock,turn,turnIndex,expectedPlan,localMs,expectedActionId,read,restore}){
 need(Number.isSafeInteger(turnIndex)&&turnIndex>=0,'turn index');
 need(Number.isFinite(localMs)&&localMs>=0&&localMs<expectedPlan.beats.end,'requested local time');
 need(typeof read==='function'&&typeof restore==='function','read and restore callbacks');
 let result;
 try {
  setClock(0);const actualPlan=stage.play(turn);
  need(actualPlan.attacker.side===expectedPlan.attacker.side,'attacker changed');
  need(Object.keys(actualPlan.beats).length===Object.keys(expectedPlan.beats).length&&Object.entries(expectedPlan.beats).every(([key,value])=>actualPlan.beats[key]===value),'turn timing changed');
  need(actualPlan.attack?.verb===expectedPlan.attack?.verb&&actualPlan.attack?.contactJoint===expectedPlan.attack?.contactJoint,'attack changed');
  setClock(localMs);const frame=stage.tick(),sample=frame?.sample;
  need(sample&&sample.ms===localMs,'sampled local time differs');
  if(expectedActionId!==undefined)need(sample.attacker?.context?.actionId===expectedActionId,'sampled action differs');
  result={schema:'cf.c183-exact-local-probe/v1',turn:turnIndex,clockOriginMs:0,requestedLocalMs:localMs,sampledLocalMs:sample.ms,phase:sample.phase,attackerAction:sample.attacker?.context?.actionId??null,targetAction:sample.target?.context?.actionId??null,value:read(frame,actualPlan)};
 } finally {
  // Direct play above bypasses the film segment cache. The caller must clear
  // that cache and enter turn zero through the ordinary global stageAt path.
  const reset=restore();
  need(reset?.turn===0&&reset?.sampledLocalMs===0&&reset?.clockMs===0&&reset?.segment===0,'ordinary clock/segment restoration failed');
  if(result)result.restoration={...reset};
 }
 return result;
}
/** Shared validator, exact time and action; never an epsilon or copied anchor. */
export function requireExactBeatProbe(probe,turn,index,beat,contact){
 need(beat==='actionStart'||beat==='impactAt','named beat');
 need(probe?.schema==='cf.c183-exact-local-probe/v1'&&probe.turn===index,'missing exact launch probe');
 need(probe.clockOriginMs===0&&probe.requestedLocalMs===turn.beats[beat]&&probe.sampledLocalMs===turn.beats[beat],'launch beat differs');
 need(probe.attackerAction==='melee:'+turn.attack.verb&&(beat!=='actionStart'||probe.phase==='action'),'launch action differs');
 need(probe.restoration?.turn===0&&probe.restoration?.sampledLocalMs===0&&probe.restoration?.clockMs===0&&probe.restoration?.segment===0,'launch restoration missing');
 need(probe.value&&Number.isFinite(probe.value.x)&&Number.isFinite(probe.value.y)&&contact&&probe.value.x===contact.x&&probe.value.y===contact.y,'independent contact observation differs');
}

export const requireExactLaunchProbe=(probe,turn,index)=>requireExactBeatProbe(probe,turn,index,'actionStart',turn.contactAtLaunch);
