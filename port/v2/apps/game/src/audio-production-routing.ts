/** Audio-only variant choice. Call with a settled event counter, never the world RNG. */
export interface ProductionAudioRoute {
  readonly id: string;
  readonly requirements: readonly string[];
  readonly approved: boolean;
}
function hash(text: string): number {
  let value=2166136261;
  for(let i=0;i<text.length;i++) {value^=text.charCodeAt(i);value=Math.imul(value,16777619);}
  return value>>>0;
}
export function chooseProductionAudio(
  routes: readonly ProductionAudioRoute[], requirement: string, identity: string,
  eventCounter: number, previousId: string | null, audition = false,
): ProductionAudioRoute | null {
  if (!identity || !requirement || !Number.isSafeInteger(eventCounter) || eventCounter<0) throw new TypeError('Invalid settled audio identity');
  const pool=routes.filter(r=>(audition || r.approved) && r.requirements.includes(requirement))
    .slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  if(new Set(pool.map(r=>r.id)).size!==pool.length)throw new TypeError('Duplicate audio route identity');
  if(!pool.length)return null;
  const choices=pool.length>1?pool.filter(r=>r.id!==previousId):pool;
  return choices[hash(JSON.stringify(['cf-audio-production-v1',identity,requirement,eventCounter]))%choices.length] ?? null;
}
