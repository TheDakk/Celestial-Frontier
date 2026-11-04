/** Inclusive animation cost: producer sampling, contact solve and publication.
 * The callback performs one complete update; no phase is timed elsewhere and
 * subtracted. Rendering, effects and proof-only measurements remain frame work. */
const readClock=()=>performance.now();
export function measureCreatureUpdate(update,now=readClock){
 const start=now(),result=update(),end=now(),updateMs=end-start;
 if(!Number.isFinite(start)||!Number.isFinite(end)||updateMs<0)throw Error('Invalid creature update clock');
 return {result,updateMs};
}
