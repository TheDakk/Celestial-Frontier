/** Replayable stage travel persists through action changes. The stage owns the
 * world displacement; a caller subtracts any existing local gait translation
 * when placing the rig so that displacement is never counted twice. */
export interface StageTravelSegment {readonly startMs:number;readonly endMs:number;readonly distance:number;}
export function createStageTravel(segments:readonly StageTravelSegment[]){
 let end=-Infinity;for(const s of segments){if(![s.startMs,s.endMs,s.distance].every(Number.isFinite)||s.startMs<0||s.endMs<=s.startMs||s.startMs<end)throw Error('Stage travel: invalid ordered interval');end=s.endMs;}
 const path=segments.map(s=>({...s}));return (ms:number)=>{if(!Number.isFinite(ms)||ms<0)throw Error('Stage travel: invalid time');let distance=0;for(const s of path){if(ms>=s.endMs)distance+=s.distance;else if(ms>s.startMs)distance+=s.distance*(ms-s.startMs)/(s.endMs-s.startMs);}return distance;};
}
export function assessRootContinuity(samples:readonly {ms:number;x:number;y:number}[],stride:number){if(samples.length<2||!Number.isFinite(stride)||stride<=0)throw Error('Root continuity: missing samples/stride');let maximumStep=0,worst=0;for(let i=0;i<samples.length;i++){const a=samples[i]!;if(![a.ms,a.x,a.y].every(Number.isFinite)||i&&a.ms<=samples[i-1]!.ms)throw Error('Root continuity: invalid ordered samples');if(i){const b=samples[i-1]!,step=Math.hypot(a.x-b.x,a.y-b.y);if(step>maximumStep){maximumStep=step;worst=i;}}}return{status:maximumStep<=stride?'PASS' as const:'FAIL' as const,maximumStep,stride,worst};}

/** Six-subject 60Hz native ledger, September20: measured non-gait maximum
 * 0.016002263414634146 motion-scale units; +10%, rounded UP to 1e-6.
 * Source: audits/VISION_P1_CONSOLIDATED_20260920/root-ledger-01/ledger.json.
 * Scale is the body card's anatomical span, so source resolution adds no slack. */
export const BRACHYURAN_NON_GAIT_STEP_PER_SCALE = 0.017603;
export interface RootContinuitySample {readonly ms:number;readonly x:number;readonly y:number;readonly action?:string;}
export function assessTemplateRootContinuity(samples:readonly RootContinuitySample[],stride:number,templateId:string,scaleLength:number){
 const original=assessRootContinuity(samples,stride);
 if(templateId!=='brachyuran')return original;
 if(!Number.isFinite(scaleLength)||scaleLength<=0||samples.some(s=>typeof s.action!=='string'||!s.action))throw Error('Root continuity: missing action/scale');
 const nonGaitStep=BRACHYURAN_NON_GAIT_STEP_PER_SCALE*scaleLength;
 const gait=(id:string)=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
 let worstViolation:null|{index:number;ms:number;action:string;fromAction:string;step:number;bound:number;kind:'gait'|'non-gait'}=null;
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1]!,b=samples[i]!,kind=gait(a.action!)||gait(b.action!)?'gait':'non-gait',bound=kind==='gait'?stride:nonGaitStep,step=Math.hypot(b.x-a.x,b.y-a.y);
  // The stricter gait guard owns both sides of a locomotion transition.
  if(step>bound&&(!worstViolation||step/bound>worstViolation.step/worstViolation.bound))worstViolation={index:i,ms:b.ms,action:b.action!,fromAction:a.action!,step,bound,kind};
 }
 return{...original,status:worstViolation?'FAIL' as const:'PASS' as const,nonGaitStep,scaleLength,worstViolation};
}

/** Arena composition owns target distance. Whole gait cycles own approach time.
 * Stage displacement is signed BODY LENGTHS since the current half-cycle's
 * planting boundary; it is not pixels or total travel since approach began. */
export function createStrideCadence(input:{targetDistancePx:number;bodyLengthPx:number;gaitDurationMs:number;stanceReachBodyLengths:number}){
 const {targetDistancePx,bodyLengthPx,gaitDurationMs,stanceReachBodyLengths}=input;
 if(![targetDistancePx,bodyLengthPx,gaitDurationMs,stanceReachBodyLengths].every(Number.isFinite)||bodyLengthPx<=0||gaitDurationMs<=0||stanceReachBodyLengths<=0)throw Error('Stride cadence: invalid distance/scale/duration');
 const distanceBodies=targetDistancePx/bodyLengthPx,cycles=Math.ceil(Math.abs(distanceBodies)/(2*stanceReachBodyLengths)),durationMs=cycles*gaitDurationMs,perCycle=cycles?distanceBodies/cycles:0;
 return Object.freeze({cycles,durationMs,gaitDurationMs,targetDistancePx,bodyLengthPx,perCycleBodyLengths:perCycle,maxStanceTravelBodyLengths:Math.abs(perCycle)/2,
  sample(ms:number){
   if(!Number.isFinite(ms)||ms<0)throw Error('Stride cadence: invalid time');
   if(!cycles)return{worldDisplacementPx:0,stageDisplacement:0,gaitMs:0,stanceWindow:0,done:true};
   const at=Math.min(ms,durationMs),progress=at/gaitDurationMs,done=at===durationMs;
   const cycle=done?cycles-1:Math.floor(progress),within=done?1:progress-cycle,half=within>=.5?1:0;
   return{worldDisplacementPx:targetDistancePx*(at/durationMs),stageDisplacement:perCycle*(within-half*.5),gaitMs:within*gaitDurationMs,stanceWindow:cycle*2+half,done};
  }
 });
}
