/** Presentation only: one page-owned job, no gameplay writes or persistent cache.
 * Work fraction counts completed stages/steps, not elapsed-time percentage.
 * Only a successful publication calibrates a later identical same-page plan.
 * Otherwise ETA estimates denoising only and explicitly excludes final processing.
 * The key is the caller's full canonical request including model/backend/settings;
 * retain it exactly, never truncate it into an ambiguous calibration identity.
 */
export const MAX_LANDING_PROGRESS_KEY_LENGTH=1_048_576;
const labels=Object.freeze({text:'Preparing description',encode:'Preparing reference',
  denoise:'Painting the world',decode:'Finishing image'});
const validTime=value=>Number.isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER;
export function createLandingProgress() {
  let state='idle',key=null,steps=0,referenceCount=0,textDone=false,encoded=0,step=0,
    denoised=false,decoded=false,workerStage=null,workerPhase=null,stageLabel='Ready',started=0,lastAt=0,stepTimes=[],previous=null;
  const active=()=>state==='queued'||state==='running';
  const expectedStage=()=>!textDone?'text':encoded<referenceCount?'encode':!denoised?'denoise':!decoded?'decode':null;
  function snapshot() {
    let etaLabel='ETA estimating…';
    if(state==='complete')etaLabel='Ready to view';
    else if(!active())etaLabel='';
    else if(decoded||step===steps&&steps>0)etaLabel='ETA finishing image…';
    else if(previous?.key===key&&previous.steps===steps&&previous.referenceCount===referenceCount){
      const remaining=previous.elapsedMs-(lastAt-started);
      etaLabel=remaining>0?`ETA about ${Math.max(5,Math.ceil(remaining/5000)*5)}s`:'ETA taking longer than the last landing…';
    } else if(stepTimes.length>=2){
      const interval=(stepTimes.at(-1)-stepTimes[0])/(stepTimes.length-1);
      if(interval>0)etaLabel=`ETA about ${Math.max(5,Math.ceil(interval*(steps-step)/5000)*5)}s + final processing`;
    }
    const total=1+referenceCount+steps+1+1;
    return Object.freeze({state,key,stageLabel,etaLabel,
      progress:state==='complete'?1:active()?(Number(textDone)+encoded+step+Number(decoded))/total:0});
  }
  return Object.freeze({
    snapshot,
    begin(plan) {
      if(active())throw Error('Landing already queued');
      if(plan===null||typeof plan!=='object')throw Error('Invalid landing progress plan');
      const {key:nextKey,steps:nextSteps,referenceCount:nextReferences,nowMs}=plan;
      if(typeof nextKey!=='string'||!nextKey.length||nextKey.length>MAX_LANDING_PROGRESS_KEY_LENGTH
        ||!Number.isInteger(nextSteps)||nextSteps<1||nextSteps>16
        ||!Number.isInteger(nextReferences)||nextReferences<0||nextReferences>2||!validTime(nowMs))
        throw Error('Invalid landing progress plan');
      state='queued';key=nextKey;steps=nextSteps;referenceCount=nextReferences;
      textDone=false;encoded=0;step=0;denoised=false;decoded=false;workerStage=null;workerPhase=null;
      stageLabel='Queued';started=lastAt=nowMs;stepTimes=[];
      return snapshot();
    },
    observe(event) {
      // A retired job cannot be resurrected by late worker/cleanup messages.
      if(!active())return snapshot();
      if(event===null||typeof event!=='object')throw Error('Invalid landing progress event');
      const failure=event.phase==='failed'&&event.stage===undefined;
      const publication=event.phase==='complete'&&event.stage===undefined;
      const completion=event.type==='complete';
      const sample=event.phase==='step';
      const stageSignal=event.phase==='loading'||event.phase==='loaded'||event.phase==='profile-complete';
      // start/reference-prepared/worker-terminated and unknown telemetry are not
      // work outcomes. In particular retirement follows a completed stage and
      // must not be mistaken for a repeated stage start. No ETA clock advance.
      if(!failure&&!publication&&!completion&&!sample&&!stageSignal)return snapshot();
      if(!validTime(event.atMs)||event.atMs<lastAt)throw Error('Nonmonotonic landing progress');
      if(failure){
        if(event.canceled!==undefined&&typeof event.canceled!=='boolean')throw Error('Invalid landing cancellation flag');
        lastAt=event.atMs;state=event.canceled===true?'canceled':'failed';
        stageLabel=event.canceled===true?'Landing canceled':'Landing failed';return snapshot();
      }
      if(publication){
        // Denoise4/4 is not decoder output or successful PNG publication.
        if(!textDone||encoded!==referenceCount||!denoised||step!==steps||!decoded)
          throw Error('Landing completed before its stages');
        lastAt=event.atMs;state='complete';stageLabel='Landing complete';
        const elapsedMs=lastAt-started;
        previous=elapsedMs>0?{key,steps,referenceCount,elapsedMs}:null;
        return snapshot();
      }
      if(!Object.hasOwn(labels,event.stage)||event.stage!==expectedStage())
        throw Error('Out-of-order landing stage');
      if(completion&&event.phase!==undefined||!completion&&event.type!==undefined&&event.type!=='progress')
        throw Error('Conflicting landing event kind');
      if(event.phase==='loading'){
        if(workerStage!==null)throw Error('Duplicate landing worker loading');
      }else if(event.phase==='loaded'){
        if(workerStage!==event.stage||workerPhase!=='loading')throw Error('Landing loaded without loading');
      }else if(workerStage!==event.stage||workerPhase!=='loaded')
        throw Error('Landing outcome before worker loaded');
      if(sample&&(event.stage!=='denoise'||event.steps!==steps||event.step!==step+1||event.step>steps))
        throw Error('Out-of-order landing step');
      if(completion&&event.stage==='denoise'&&step!==steps)
        throw Error('Denoise completed before its steps');
      if(stageSignal&&event.stage==='denoise'&&step>0&&event.phase!=='profile-complete')
        throw Error('Denoise loading after its steps');
      if(event.phase==='profile-complete'&&event.stage==='denoise'&&step!==steps)
        throw Error('Denoise profile completed before its steps');
      // All refusal checks precede state/time writes: malformed evidence cannot
      // change a label, percentage, calibration sample or future time boundary.
      lastAt=event.atMs;state='running';stageLabel=labels[event.stage];
      if(event.phase==='loading'){workerStage=event.stage;workerPhase='loading';}
      else if(event.phase==='loaded')workerPhase='loaded';
      if(sample){step=event.step;stepTimes.push(lastAt);stageLabel=`Painting the world · step ${step} of ${steps}`;}
      if(completion){
        if(event.stage==='text')textDone=true;
        else if(event.stage==='encode')encoded++;
        else if(event.stage==='denoise')denoised=true;
        else decoded=true;
        workerStage=null;workerPhase=null;
      }
      return snapshot();
    },
  });
}
