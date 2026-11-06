import {chooseProductionAudio} from './audio-production-routing.js';
import type {AudioProductionCue} from './audio-production-review.js';
import type {ProductionPlan,ProductionLayer} from './audio-production-plan.js';
import type {PilotPcm} from './pilot-pcm.js';

export interface ProductionPlanSelection {
  readonly plan:ProductionPlan;
  readonly selected:readonly {layer:ProductionLayer;cue:AudioProductionCue}[];
  readonly missing:readonly string[];
}
/** Candidate mixing is explicit audition authority; normal playback cannot opt in implicitly. */
export function selectProductionPlan(plan:ProductionPlan,cues:readonly AudioProductionCue[],counter:number,
  audition=false,previous:Readonly<Record<string,string>>={}):ProductionPlanSelection {
  if(!plan||plan.schema!=='cf.audio-production-plan/v2'||!plan.identity||plan.identity.length>8192||plan.layers.length>4)
    throw new TypeError('Invalid bounded production plan');
  const selected:{layer:ProductionLayer;cue:AudioProductionCue}[]=[],missing:string[]=[];
  for(const l of plan.layers){
    if(!l.requirement||![l.gain,l.rate,l.delayMs].every(Number.isFinite)||l.gain<0||l.gain>.5||l.rate<.5||l.rate>2||l.delayMs<0||l.delayMs>8000)
      throw new TypeError('Invalid production layer');
    if(l.gainCurve!==undefined){
      if(!Array.isArray(l.gainCurve)||l.gainCurve.length<2||l.gainCurve.length>8)throw new TypeError('Invalid gain curve');
      let previous=-1;for(const knot of l.gainCurve){if(!Array.isArray(knot)||knot.length!==2||!knot.every(Number.isFinite)||knot[0]!<0||knot[0]!<=previous||knot[0]!>24000||knot[1]!<0||knot[1]!>1)throw new TypeError('Invalid gain curve knot');previous=knot[0]!;}
    }
    const matches=cues.filter(c=>c.requirements.includes(l.requirement));
    // Version 2 jobs supersede only candidate directions, never accepted runtime assets.
    const version=Math.max(1,...matches.map(c=>c.recipeVersion??1));
    const latest=matches.filter(c=>(c.recipeVersion??1)===version);
    const chosen=chooseProductionAudio(latest.map(c=>({id:c.id,requirements:c.requirements,approved:false})),
      l.requirement,plan.identity,counter,previous[l.requirement]??null,audition);
    const cue=chosen?latest.find(c=>c.id===chosen.id):undefined;
    if(cue)selected.push({layer:l,cue});else missing.push(l.requirement);
  }
  return {plan,selected,missing};
}

/** At most one input PCM retained at a time; output is at most 24 s stereo (9.216 MB).
 * Preview-only linear resampling changes speed and pitch together. No AudioContext is created.
 * Loop crossfade blends copies, never edits source buffers; this is not loop listening approval. */
export async function mixProductionPreview(selection:ProductionPlanSelection,load:(cue:AudioProductionCue)=>Promise<PilotPcm>,
  signal:AbortSignal,durationSeconds=8):Promise<PilotPcm> {
  if(selection.missing.length)throw new Error('Missing plan layers: '+selection.missing.join(', '));
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0||durationSeconds>24)throw new RangeError('Preview duration');
  if(selection.selected.length>4)throw new RangeError('Preview layer budget');
  const frames=Math.round(48000*durationSeconds),channels=[new Float32Array(frames),new Float32Array(frames)];
  for(const {layer,cue} of selection.selected){
    signal.throwIfAborted();const pcm=await load(cue);signal.throwIfAborted();
    if(pcm.sampleRate!==48000||!Number.isSafeInteger(pcm.frames)||pcm.frames<2||pcm.frames>48000*24
      ||!Array.isArray(pcm.channels)||pcm.channels.length<1||pcm.channels.length>2||pcm.channels.some(c=>c.length!==pcm.frames))
      throw new TypeError('Invalid source PCM');
    const start=Math.round(layer.delayMs*48),crossfade=Math.min(4800,Math.floor(pcm.frames/8)),period=pcm.frames-crossfade;
    const sample=(buffer:Float32Array,x:number):number=>{const lo=Math.floor(x),t=x-lo;return (buffer[lo]??0)*(1-t)+(buffer[Math.min(lo+1,pcm.frames-1)]??0)*t;};
    for(let f=start;f<frames;f++){
      const elapsed=(f-start)*layer.rate;
      if(!layer.loop&&elapsed>=pcm.frames)break;
      const pos=layer.loop?elapsed%period:elapsed;
      let envelope=1;
      if(layer.gainCurve){const ms=f/48,knots=layer.gainCurve;envelope=knots[knots.length-1]![1];
        if(ms<knots[0]![0])envelope=knots[0]![1];
        for(let i=1;i<knots.length;i++){const a=knots[i-1]!,b=knots[i]!;if(ms>=a[0]&&ms<b[0]){envelope=a[1]+(b[1]-a[1])*(ms-a[0])/(b[0]-a[0]);break;}}
      }
      const fade=Math.min(1,(f-start)/240,(frames-f)/960)*envelope;
      for(let c=0;c<2;c++){
        const buffer=pcm.channels[Math.min(c,pcm.channels.length-1)]!;
        let value=sample(buffer,pos);
        if(layer.loop&&pos<crossfade&&elapsed>=period){const t=pos/crossfade;value=value*t+sample(buffer,period+pos)*(1-t);}
        if(!Number.isFinite(value))throw new TypeError('Nonfinite source audio');
        channels[c]![f]!+=value*layer.gain*fade;
      }
    }
  }
  signal.throwIfAborted();let peak=0;
  for(const c of channels)for(const v of c)peak=Math.max(peak,Math.abs(v));
  // Do not clamp samples and hide clipping; refuse an excessive recipe for revision.
  if(peak>.89)throw new RangeError('Preview mix exceeds headroom; revise layers');
  return {sampleRate:48000,frames,channels,durationMs:frames/48,decodedBytes:frames*2*4};
}
