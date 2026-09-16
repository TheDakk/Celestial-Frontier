/** Deterministic presentation time. Hitstop affects every body channel; ambient
 * water/weather and UI may use elapsed time. Neither clock feeds game content. */
export interface PresentationHold {readonly atMs:number;readonly durationMs:number;}
export function bodyPresentationMs(elapsedMs:number,holds:readonly PresentationHold[]):number{
 if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw Error('Presentation time: elapsed');let removed=0,end=-Infinity;
 for(const hold of holds){if(!Number.isFinite(hold.atMs)||!Number.isFinite(hold.durationMs)||hold.atMs<0||hold.durationMs<0||hold.atMs<end)throw Error('Presentation time: ordered non-overlapping holds');end=hold.atMs+hold.durationMs;removed+=Math.max(0,Math.min(hold.durationMs,elapsedMs-hold.atMs));}
 return elapsedMs-removed;
}
