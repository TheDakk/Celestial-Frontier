/* How wide is the voice vocabulary now? CF1802-20 folded four more genes in;
   CF1805-03 fixed all five moduli. Run the build's own voiceOf over the corpus. */
import M from '/root/cf/harness/model9.mjs';
const {voiceOf, makeGenome, _VOICE_KEYS} = M;
const r3=v=>Math.round(v*1000)/1000;
const key=v=>`${v.kind}|${r3(v.f0)}|${r3(v.rich)}|${r3(v.nz)}|${r3(v.vib)}|${v.vibD}|${r3(v.dur)}|${v.sweep}`;
const N=200000, seen=new Map(); let ceil=0, floor=0;
for(let i=0;i<N;i++){
  const g=makeGenome((i*2654435761)>>>0,'fauna',0.5);
  const v=voiceOf(g); const k=key(v);
  seen.set(k,(seen.get(k)||0)+1);
  if(v.f0>=5999.9) ceil++; if(v.f0<=60.001) floor++;
}
console.log(`corpus            ${N} procedural fauna`);
console.log(`distinct voices   ${seen.size}   (v1.8.2 measured 533 of 20,000)`);
console.log(`collision rate    ${((1-seen.size/N)*100).toFixed(2)}% share a voice with another`);
const top=[...seen.values()].sort((a,b)=>b-a)[0];
console.log(`most common       ${top}x  (${(top/N*100).toFixed(3)}%)`);
console.log(`f0 at 6000 ceiling ${ceil} (${(ceil/N*100).toFixed(2)}%)   at 60 floor ${floor} (${(floor/N*100).toFixed(2)}%)`);
// birthday: chance a collection of n shares a voice
const p=[...seen.values()].map(c=>c/N);
const coll=n=>{ let s=0; for(const q of p) s+=q*q; return 1-Math.exp(-n*(n-1)/2*s); };
console.log('\nchance a collection contains an exact duplicate voice:');
for(const n of [10,25,50,100,250]) console.log(`   ${String(n).padStart(3)} creatures  ${(coll(n)*100).toFixed(1)}%`);
