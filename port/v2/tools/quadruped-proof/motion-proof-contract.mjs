const requireValue=(ok,message)=>{if(!ok)throw Error('Motion capture: '+message);};
export const percentile=(values,fraction)=>{const a=values.slice().sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*fraction))];};
/** A 60 Hz target is assessed from live rAF intervals, separately from CPU cost
 * and encoded media. 5% frame-count allowance cannot hide a 30 Hz recording. */
export function inspectFramePacing(deltas,creatureUpdates,frameCpu){
 requireValue(deltas.length>=570&&deltas.every(n=>Number.isFinite(n)&&n>0),'missing live frame intervals');
 requireValue(creatureUpdates.length===deltas.length+1&&frameCpu.length===creatureUpdates.length&&[...creatureUpdates,...frameCpu].every(n=>Number.isFinite(n)&&n>=0),'CPU samples');
 const elapsed=deltas.reduce((a,b)=>a+b,0),fps=deltas.length*1000/elapsed;
 const result={targetFps:60,fps,intervalP95Ms:percentile(deltas,.95),intervalMaxMs:Math.max(...deltas),creatureUpdateP95Ms:percentile(creatureUpdates,.95),timingScope:'producer sampling + contact solve + rig publication',frameCpuP95Ms:percentile(frameCpu,.95),frameCpuMaxMs:Math.max(...frameCpu),elapsedMs:elapsed,frames:creatureUpdates.length};
 requireValue(fps>=57&&result.intervalP95Ms<=25&&result.intervalMaxMs<=100,'60 Hz pacing budget');
 requireValue(result.creatureUpdateP95Ms<2,'2 ms creature update budget');return result;
}
export function inspectEncodedFrames(streams){
 const video=streams.filter(s=>s.codec_type==='video');requireValue(video.length===1,'exactly one encoded video stream');
 const count=Number(video[0].nb_read_frames);requireValue(Number.isInteger(count)&&count>=570,'encoded video lost frames');
 return {frames:count,width:video[0].width,height:video[0].height};
}
export function createMotionObservation(joints){
 const ranges=Object.fromEntries(joints.map(j=>[j,{min:Infinity,max:-Infinity}])),phases={},roles=new Set();let firstMs=null,lastMs=null,samples=0;
 return {
  observe({ms,phase,role,pose}){requireValue(Number.isFinite(ms)&&ms>=0&&ms<=10000,'timeline sample');firstMs??=ms;lastMs=ms;samples++;phases[phase]=(phases[phase]??0)+1;roles.add(role);
   for(const[j,r]of Object.entries(ranges)){const v=pose[j]?.rotation??0;requireValue(Number.isFinite(v),'joint rotation');r.min=Math.min(r.min,v);r.max=Math.max(r.max,v);}
  },
  finish(){
   requireValue(firstMs===0&&lastMs===10000&&samples>=571,'complete timeline endpoints');
   for(const phase of ['ready','command','approach','action','hitstop','impact','return','idle'])requireValue(phases[phase]>0,'missing phase '+phase);
   requireValue(roles.has('attacker')&&roles.has('target'),'both turn roles');
   for(const j of ['head','jaw','tail0','earFarTip','earNearTip'])requireValue(ranges[j]&&ranges[j].max-ranges[j].min>1e-5,'unmoving appendage '+j);
   return {firstMs,lastMs,samples,phases,roles:[...roles],jointRanges:ranges};
  },
 };
}
