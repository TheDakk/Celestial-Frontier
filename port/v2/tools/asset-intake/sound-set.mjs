/** CONTRACTS section 1 source inventories. No generation, normalization or
 * implied listening/rights acceptance. Unspecified cue limits remain explicit. */
import {readBoundFile,wavFacts,sha256} from './contracts.mjs';
export const SOUND_THEMES=Object.freeze(['fire','frost','storm','tide','stone','venom','void','sand','chem','psionic','wild']);
export const BATTLE_SOURCES=Object.freeze(['turn-ready','cursor','confirm','cancel','approach-start','hitstop-thump','flash-sting','shake-rumble','damage-tick','miss-whiff','dodge-swish','faint-fall','victory-sting','defeat-sting','battle-start','battle-end']);
const need=(ok,why)=>{if(!ok)throw Error('Sound set: '+why);};
export function inspectLoop(bytes,sourceHash,sidecar){
 need(sidecar?.schema==='cf.audio-loop/v1','loop schema');
 const facts=wavFacts(bytes,sidecar.channels),{startFrame:start,endFrame:end,crossfadeFrames:fade}=sidecar;
 need(sidecar.schema==='cf.audio-loop/v1'&&sidecar.sourceSha256===sourceHash&&sha256(bytes)===sourceHash&&sidecar.sampleRate===48000,'loop source/rate binding');
 need([start,end,fade].every(Number.isSafeInteger)&&start>=0&&end<=facts.frames&&end-start>=2&&fade>0&&fade*2<end-start,'loop frame/crossfade range');
 let data;for(let p=12;p<bytes.length;){const n=bytes.readUInt32LE(p+4);if(bytes.toString('ascii',p,p+4)==='data'){data=bytes.subarray(p+8,p+8+n);break;}p+=8+n+n%2;}
 const value=(frame,ch)=>{let n=data.readUIntLE((frame*sidecar.channels+ch)*3,3);if(n>=0x800000)n-=0x1000000;return n/0x800000;};
 const channels=Array.from({length:sidecar.channels},(_,ch)=>({channel:ch,
  boundaryStep:value(start,ch)-value(end-1,ch),
  incomingStep:value(end-1,ch)-value(end-2,ch),outgoingStep:value(start+1,ch)-value(start,ch)}));
 return {startFrame:start,endFrame:end,crossfadeFrames:fade,durationSeconds:(end-start)/48000,channels,
  cleanLoopAccepted:false,scope:'Declared sample boundaries and raw discontinuity; no crossfade applied. Seeded runtime crossfade and listening remain pending.'};
}
export function inspectSoundSet(root,manifest){
 need(manifest?.schema==='cf.sound-source-intake/v1','schema');let names;
 if(manifest.kind==='ability'){need(SOUND_THEMES.includes(manifest.key),'theme key');names=['launch','travel','impact'].map(p=>manifest.key+'.'+p+'.wav');}
 else if(manifest.kind==='battle'){need(manifest.key===undefined,'battle has no family key');names=BATTLE_SOURCES.map(c=>c+'.wav');}
 else if(manifest.kind==='bed'){need(manifest.key==='temperate','first-source biome key');names=['bed.temperate.wav'];}
 else if(manifest.kind==='weather'){need(manifest.key==='rain','first-source weather key');names=['weather.rain.wav'];}
 else throw Error('Sound set: unsupported source kind');
 need(Array.isArray(manifest.masters)&&manifest.masters.length===names.length&&JSON.stringify(manifest.masters.map(r=>r.path).sort())===JSON.stringify([...names].sort()),'complete closed source inventory');
 const rows=[...manifest.masters].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0).map(row=>{
  need(row.rights&&['owner','license','source'].every(k=>typeof row.rights[k]==='string'&&row.rights[k].trim())&&row.rights.redistribution===true,'per-master redistribution rights');
  need(row.dry===true,'dry source declaration');
  const channels=manifest.kind==='bed'?2:manifest.kind==='weather'?row.channels:1;
  need(channels===1||channels===2,'explicit weather channels');
  const bytes=readBoundFile(root,row),facts=wavFacts(bytes,channels);
  const limited=manifest.kind==='ability'&&row.path.endsWith('.impact.wav')||manifest.kind==='battle'&&['cursor.wav','confirm.wav','cancel.wav','hitstop-thump.wav'].includes(row.path);
  if(limited)need(facts.durationSeconds<.6,'impact/UI must be under 600 ms');
  let loop=null;
  if(manifest.kind==='bed'||manifest.kind==='weather'){
   need(row.loop&&typeof row.loop.path==='string','hash-bound loop sidecar required');
   const sidecar=JSON.parse(readBoundFile(root,row.loop));need(sidecar.channels===channels,'loop channels');loop=inspectLoop(bytes,row.sha256,sidecar);
   if(manifest.kind==='bed')need(facts.durationSeconds>=24&&facts.durationSeconds<=40&&loop.durationSeconds>=24&&loop.durationSeconds<=40,'bed and loop must be 24 to 40 seconds');
  }
  return {path:row.path,sha256:row.sha256,bytes:bytes.length,rights:row.rights,...facts,loop,
   durationPolicy:limited?'under 600 ms':manifest.kind==='bed'?'24 to 40 seconds':'recorded; no additional duration limit invented'};
 });
 return {schema:'cf.sound-source-intake-report/v1',kind:manifest.kind,key:manifest.key??null,masters:rows,qualityAccepted:false,
  pending:['source rights review','dry/source/frozen-style listening','true peak and mix loudness','Opus export under an applicable profile','runtime wiring',...(manifest.kind==='bed'||manifest.kind==='weather'?['seeded crossfade loop rendering/listening']:[])]};
}
