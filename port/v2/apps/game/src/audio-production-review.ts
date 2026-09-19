import {selectProductionPlan,mixProductionPreview} from './audio-production-mix.js';
import type {ProductionPlan} from './audio-production-plan.js';
import type { TameGreetingAudioOwner } from './tame-greeting-audio.js';
import { parsePilotPcm, pilotPcmVoice, PILOT_PCM_FILE_LIMIT } from './pilot-pcm.js';

export interface AudioProductionCue {
  id: string; group: string; kind: string; notes: string; previewUrl: string; recipeVersion?:number;
  previewSha256: string; previewBytes: number; requirements: string[];
  layers: {sourceId: string; sha256: string}[];
  sourceCredits?: {sourceId:string;creator:string;license:string;url:string}[];
}
export function validateAudioProductionCue(value: unknown): AudioProductionCue {
  const v = value as AudioProductionCue;
  if (!v || !/^[a-z0-9._-]{1,180}$/u.test(v.id) || !/^[a-z0-9-]+$/u.test(v.group)
    || (v.recipeVersion!==undefined&&(!Number.isInteger(v.recipeVersion)||v.recipeVersion<1||v.recipeVersion>4))
    || typeof v.kind !== 'string' || typeof v.notes !== 'string'
    || v.previewUrl !== `/__cf-audio-review/${v.id}.wav` || !/^[a-f0-9]{64}$/u.test(v.previewSha256)
    || !Number.isSafeInteger(v.previewBytes) || v.previewBytes < 44 || v.previewBytes > PILOT_PCM_FILE_LIMIT
    || (v.sourceCredits !== undefined && (!Array.isArray(v.sourceCredits) || v.sourceCredits.some(s => !s || [s.sourceId,s.creator,s.license,s.url].some(x => typeof x !== 'string'))))
    || !Array.isArray(v.requirements) || v.requirements.some(x => typeof x !== 'string')
    || !Array.isArray(v.layers) || (!v.layers.length && !((v.group === 'music-original' || v.group === 'coverage-score') && v.kind === 'synthetic_fictional')) || v.layers.some(x => !x || !/^[a-z0-9_]+$/u.test(x.sourceId) || !/^[a-f0-9]{64}$/u.test(x.sha256))) {
    throw new TypeError('Invalid production audio catalogue entry');
  }
  return v;
}
export async function readProductionAudio(response: Response, cue: AudioProductionCue, signal: AbortSignal): Promise<ArrayBuffer> {
  validateAudioProductionCue(cue);
  if (!response.ok || !response.body) throw new Error('Audio file unavailable');
  const reader = response.body.getReader(); const parts: Uint8Array[] = []; let size = 0, done = false;
  try {
    for (;;) {
      signal.throwIfAborted(); const next = await reader.read(); signal.throwIfAborted();
      if (next.done) { done = true; break; }
      size += next.value.byteLength;
      if (size > cue.previewBytes) throw new Error('Audio file exceeded its recorded size');
      parts.push(next.value);
    }
  } finally { if (!done) await reader.cancel().catch(() => {}); reader.releaseLock(); }
  if (size !== cue.previewBytes) throw new Error('Audio file was truncated');
  const bytes = new Uint8Array(size); let offset = 0;
  for (const p of parts) { bytes.set(p, offset); offset += p.length; }
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
  signal.throwIfAborted();
  if (hash !== cue.previewSha256) throw new Error('Audio file does not match its recorded hash');
  return bytes.buffer;
}

export function productionReviewCategory(cue: Pick<AudioProductionCue, 'group' | 'id'>): 'music' | 'ambience' | 'combat-gameplay' | 'ui' {
  if (cue.group.startsWith('music-') || cue.group==='coverage-score') return 'music';
  if (cue.group === 'authentic-recordings' || cue.group === 'ambience-weather' || cue.group === 'coverage-environment') return 'ambience';
  if (cue.group.startsWith('ability-') || /^v2\.ability\./u.test(cue.id) || /^(v2\.)?battle\./u.test(cue.id)) return 'combat-gameplay';
  return 'ui';
}

/** Developer-only, explicit gesture, existing audio owner. No gameplay actions/RNG. */
export function mountAudioProductionReview(owner: TameGreetingAudioOwner): () => void {
  const button = document.createElement('button'); button.textContent = 'Sound review';
  button.style.cssText = 'position:fixed;right:16px;bottom:80px;z-index:10000;min-height:44px;padding:12px';
  const dialog = document.createElement('dialog'); dialog.setAttribute('aria-label', 'Audio production review');
  dialog.style.cssText = 'width:min(680px,calc(100vw - 48px));max-height:80dvh;overflow:auto;background:#132235;color:#edf3fa;padding:20px;border:1px solid #789';
  const heading = document.createElement('h2'); heading.textContent = 'Audio production · listening candidates';
  const intro = document.createElement('p'); intro.textContent = 'These candidates are unapproved. Fictional voices do not establish authentic species coverage. Master Sound and volume apply. Voice candidates are explicit previews, independent of automatic creature greetings. Nothing plays until you choose Play.';
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Filter by animal, theme, material or event'; search.setAttribute('aria-label', 'Filter audio candidates');
  const select = document.createElement('select'); select.setAttribute('aria-label', 'Audio candidate');
  const recipes = document.createElement('select'); recipes.setAttribute('aria-label','Layered sound recipe');
  const recipePlay = document.createElement('button'); recipePlay.textContent='Play layered recipe';
  const details = document.createElement('pre'); details.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';
  const play = document.createElement('button'); play.textContent = 'Play selected';
  const stop = document.createElement('button'); stop.textContent = 'Stop all review audio';
  const close = document.createElement('button'); close.textContent = 'Close';
  const status = document.createElement('p'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  for (const control of [search,select,recipes,recipePlay,play,stop,close]) control.style.cssText='min-height:44px;max-width:100%;margin:6px 0;padding:8px';
  search.style.width='100%'; select.style.width='100%'; recipes.style.width='100%';
  dialog.append(heading,intro,search,select,recipes,details,play,recipePlay,stop,close,status); document.body.append(button,dialog);
  let examples:{id:string;label:string;plan:ProductionPlan}[]=[];
  let cues: AudioProductionCue[] = [], generation = 0, abort = new AbortController(), disposed = false;
  const halt = (): void => { generation++; abort.abort(); abort=new AbortController(); owner.cancelPilotPlayback(); status.textContent='Stopped.'; };
  const selection = (): AudioProductionCue | undefined => cues.find(c=>c.id===select.value);
  const describe = (): void => {
    halt(); const cue=selection(); play.disabled=!cue;
    details.textContent=cue ? `${cue.id}\n${cue.kind} · ${cue.group}\n${cue.notes}\nEvents: ${cue.requirements.join(', ')}\nSources: ${cue.layers.map(l=>l.sourceId).join(', ')}\nRecipe: production-v${cue.recipeVersion??1} · variant ${cue.id}\nSHA-256: ${cue.previewSha256}\nLicense/creator: ${cue.sourceCredits?.map(s=>s.creator+' · '+s.license).join('; ') ?? 'See audio-production/manifests/acquisition.json'}\nListening: not yet reviewed` : 'No candidates match.';
  };
  const filter = (): void => {
    select.replaceChildren(); const term=search.value.toLowerCase();
    for (const cue of cues.filter(c=>(c.id+' '+c.group+' '+c.requirements.join(' ')).toLowerCase().includes(term))) {
      const option=document.createElement('option'); option.value=cue.id; option.textContent=cue.id+' · '+cue.kind; select.append(option);
    }
    recipes.replaceChildren();
    for(const example of examples.filter(e=>(e.id+' '+e.label).toLowerCase().includes(term))){
      const option=document.createElement('option');option.value=example.id;option.textContent=example.label;recipes.append(option);
    }
    recipePlay.disabled=recipes.options.length===0;
    describe();
  };
  button.onclick=async () => {
    dialog.showModal(); status.textContent='Loading catalogue…'; const own=generation, signal=abort.signal;
    try {
      const response=await fetch('/__cf-audio-review/catalog.json',{credentials:'omit',signal});
      if (!response.ok) throw new Error('Run the local audio production job first.');
      const text=await response.text(); if (text.length>8_000_000) throw new Error('Catalogue size limit');
      const data=JSON.parse(text) as {schema?:string;outputs?:unknown[]};
      if (data.schema!=='cf.audio-audition/v1' || !Array.isArray(data.outputs) || data.outputs.length>5000) throw new Error('Invalid catalogue');
      if (disposed || own!==generation) return; cues=data.outputs.map(validateAudioProductionCue);
      const plansResponse=await fetch('/__cf-audio-review/plans.json',{credentials:'omit',signal});
      if(plansResponse.ok){
        const plansText=await plansResponse.text();if(plansText.length>8_000_000)throw new Error('Recipe catalogue size limit');
        const plans=JSON.parse(plansText) as {schema?:string;examples?:{id:string;label:string;plan:ProductionPlan}[]};
        if(plans.schema!=='cf.audio-production-review-plans/v2'||!Array.isArray(plans.examples)||plans.examples.length>5000)throw new Error('Invalid recipe catalogue');
        for(const e of plans.examples){if(typeof e.id!=='string'||typeof e.label!=='string')throw new Error('Invalid recipe entry');selectProductionPlan(e.plan,cues,0,true);}
        examples=plans.examples;
      }
      if(disposed||own!==generation)return;filter(); status.textContent=`${cues.length} rendered candidates. Choose one to listen.`;
    } catch(error) { if (!signal.aborted) status.textContent=String(error); }
  };
  play.onclick=async event => {
    if (!event.isTrusted) return; const cue=selection(); if (!cue) return;
    halt(); if (!owner.armNativePilotGesture()) { status.textContent='Audio is muted or the game is not ready.'; return; }
    const own=generation, signal=abort.signal; status.textContent='Loading selected audio…';
    try {
      const bytes=await readProductionAudio(await fetch(cue.previewUrl,{credentials:'omit',signal}),cue,signal);
      if (disposed || own!==generation) return;
      const pcm=parsePilotPcm(bytes);
      const key='cf-pilot-review-'+cue.previewSha256.replace(/[0-9a-f]/gu,c=>String.fromCharCode(97+parseInt(c,16)));
      const category=productionReviewCategory(cue);
      const result=await owner.playPilotVoice(pilotPcmVoice(key,category,pcm,{mono:false,reducedIntensity:false,gain:.7}));
      if (own===generation) status.textContent=result.kind==='started'?'Playing selected candidate.':'Audio did not start: '+result.reason;
    } catch(error) { if (!signal.aborted) status.textContent='Cannot play: '+String(error); }
  };
  const recipeSelection=()=>{const e=examples.find(x=>x.id===recipes.value);return e?selectProductionPlan(e.plan,cues,0,true):null;};
  recipes.onchange=()=>{
    halt();const selection=recipeSelection();play.disabled=true;
    details.textContent=selection?`${selection.plan.identity}\n${selection.plan.authenticity}\n${selection.plan.notes.join(' ')}\nLayers: ${selection.selected.map(s=>s.cue.id+' @ '+s.layer.gain+' gain, '+s.layer.delayMs+' ms').join(' / ')}\nMissing: ${selection.missing.join(', ')||'none'}\nReview preview only; no accepted assets replaced.`:'No recipe selected.';
    recipePlay.disabled=!selection||selection.missing.length>0||selection.selected.length===0;
  };
  recipePlay.onclick=async event=>{
    if(!event.isTrusted)return;const selection=recipeSelection();if(!selection)return;
    halt();if(!owner.armNativePilotGesture()){status.textContent='Audio is muted or the game is not ready.';return;}
    const own=generation,signal=abort.signal;status.textContent='Composing selected recipe…';
    try{
      const pcm=await mixProductionPreview(selection,async cue=>parsePilotPcm(await readProductionAudio(
        await fetch(cue.previewUrl,{credentials:'omit',signal}),cue,signal)),signal,8);
      if(disposed||own!==generation)return;
      const result=await owner.playPilotVoice(pilotPcmVoice('cf-pilot-layered-review',
        selection.plan.layers.some(l=>l.role==='music')?'music':selection.plan.layers.some(l=>l.role==='bed'||l.role==='weather')?'ambience':'combat-gameplay',pcm,{mono:false,reducedIntensity:false,gain:.7}));
      if(own===generation)status.textContent=result.kind==='started'?'Playing layered recipe.':'Audio did not start: '+result.reason;
    }catch(error){if(!signal.aborted)status.textContent='Cannot compose: '+String(error);}
  };
  search.oninput=filter; select.onchange=describe; stop.onclick=halt; close.onclick=()=>dialog.close(); dialog.onclose=halt;
  const visibility=():void=>{if(document.hidden)halt();}; document.addEventListener('visibilitychange',visibility);
  return () => { disposed=true;halt(); document.removeEventListener('visibilitychange',visibility);button.remove();dialog.remove(); };
}
