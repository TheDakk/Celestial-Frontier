/** Complete battle observation, independent of the recorder's stop condition.
 * Retains the existing 750ms media padding and 57fps encoded-frame floor.
 * This is capture integrity, not a claim of uninterrupted 60fps or visual quality. */
import {requireFullRowMedia} from '../animation-completion/review-schedule.mjs';
import {inspectEncodedFrames} from '../quadruped-proof/motion-proof-contract.mjs';
const need=(ok,why)=>{if(!ok)throw Error('Battle capture: '+why);};
export function battleCaptureDuration(totalMs){need(Number.isFinite(totalMs)&&totalMs>0,'invalid planned duration');return Math.max(10000,totalMs);}
const windows=b=>[
 ['ready',0,b.readyEnd],['command',b.readyEnd,b.commandEnd],['approach',b.commandEnd,b.actionStart],
 ['action',b.actionStart,b.impactAt],['hitstop',b.impactAt,b.hitstopEnd],['impact',b.hitstopEnd,b.actionEnd],
 ['return',b.actionEnd,b.returnEnd],['idle',b.returnEnd,b.end],
].filter(([,a,b])=>b>a);
export function requireBattleCaptureTimeline(gates,capture){
 const target=battleCaptureDuration(gates?.totalMs),turns=gates?.turns,frames=capture?.frameSamples;
 need(Array.isArray(turns)&&turns.length>0,'missing turn plan');
 let at=0;const schedule=turns.map((t,i)=>{
  need(t?.turn===i&&t.offsetMs===at&&t.beats&&Number.isFinite(t.beats.end)&&t.beats.end>0,'invalid ordered turn plan');
  const intervals=windows(t.beats);let last=0;for(const[phase,start,end]of intervals){need(typeof phase==='string'&&Number.isFinite(start)&&Number.isFinite(end)&&start===last&&end>start,'invalid phase plan');last=end;}
  need(last===t.beats.end,'incomplete phase plan');at+=t.beats.end;return intervals;
 });
 need(at===gates.totalMs,'planned duration differs');
 need(capture.plannedDurationMs===target,'capture used another stop time');
 need(Array.isArray(frames)&&frames.length>=Math.ceil(target/1000*57)+1&&capture.frames===frames.length,'missing live frames');
 need(frames[0].ms===0&&frames.at(-1).ms>=target&&frames.at(-1).ms<=target+750,'incomplete live endpoints');
 need(capture.durationMs===frames.at(-1).ms,'live duration differs');
 const seen=schedule.map(row=>row.map(()=>0));let previous=-1;
 for(const f of frames){
  need(Number.isFinite(f.ms)&&f.ms>previous&&Number.isFinite(f.cpuMs)&&f.cpuMs>=0,'invalid live sample');previous=f.ms;
  let i=0;while(i+1<turns.length&&f.ms>=turns[i+1].offsetMs)i++;
  const local=Math.min(f.ms-turns[i].offsetMs,turns[i].beats.end-1e-6);
  need(f.turn===i&&Number.isFinite(f.localMs)&&Math.abs(f.localMs-local)<1e-7,'sample skipped/reordered a turn');
  const phaseIndex=schedule[i].findIndex(([,start,end])=>local>=start&&local<end);
  need(phaseIndex>=0&&f.phase===schedule[i][phaseIndex][0],'sample phase differs');seen[i][phaseIndex]++;
 }
 need(seen.every(row=>row.every(n=>n>0)),'missing live turn phase');
 return {schema:'cf.battle-capture-timeline/v1',plannedDurationMs:target,totalScriptMs:gates.totalMs,
  firstMs:frames[0].ms,lastMs:frames.at(-1).ms,frames:frames.length,
  turns:seen.map((counts,i)=>({turn:i,phases:schedule[i].map(([phase,start,end],j)=>({phase,start,end,samples:counts[j]}))}))};
}
export function requireBattleCaptureMedia(media,plannedDurationMs){
 const duration=requireFullRowMedia(Number(media?.format?.duration),plannedDurationMs),encoded=inspectEncodedFrames(media?.streams??[]);
 need(encoded.frames>=Math.ceil(plannedDurationMs/1000*57),'encoded full script lost frames');
 return {...encoded,durationSeconds:duration,minimumFrames:Math.ceil(plannedDurationMs/1000*57)};
}
