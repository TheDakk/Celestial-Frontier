/** Existing read-only cue plans and labelled synthesis only. Creature voices
 * without an admitted source set remain explicit skipped events. */
export function createProofTurnAudio({plans,owner,seed,buildTurnCuePlan,TurnCuePlayer,createTurnCueSink,synthesizeBattleCue}){
 const cuePlans=plans.map(p=>buildTurnCuePlan(p)),cache=new Map();
 const synthesize=(cueId,cueSeed,options={})=>{const key=cueId+':'+(options.amount??0);if(!cache.has(key))cache.set(key,synthesizeBattleCue(cueId,cueSeed,options));return cache.get(key);};
 // Compile existing placeholder buffers outside the filmed frame loop.
 for(const p of cuePlans)for(const c of p.cues)if(!c.cueId.startsWith('creature:'))synthesize(c.cueId,seed,c.amount===undefined?{}:{amount:c.amount});
 const sinks=cuePlans.map(()=>createTurnCueSink({runtime:owner.decorativeVoicePort(),seed,synthesize,creatureVoice:()=>null,gain:.45}));
 let now=0,disposed=false;
 const players=cuePlans.map((p,i)=>new TurnCuePlayer(p,sinks[i],()=>now-i*5000));
 return {
  tick(ms){if(disposed)throw Error('Proof audio disposed');now=ms;for(const player of players)player.tick();},
  snapshot(){return {label:'Existing placeholder battle/ability synthesis — not accepted C3 recordings',creatureVoices:'No source set supplied; attack-vocal and hurt explicitly skipped',victory:plans.some(p=>p.targetFaints)?'Scheduled by the outcome plan':'Not applicable: neither proof turn declares a victory',cachedBuffers:cache.size,turns:cuePlans.map((p,i)=>({offsetMs:i*5000,planned:p.cues,droppedByMix:p.dropped,results:[...sinks[i].log],droppedLate:[...players[i].droppedLate]}))};},
  dispose(){if(disposed)return;disposed=true;for(const p of players)p.dispose();cache.clear();},
 };
}
