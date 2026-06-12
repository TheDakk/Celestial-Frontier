// One-off sanity check for the v1.3 deep-spectrum rarity expansion.
// Proves over a large seed sweep that the new rarityRoll never DOWNGRADES
// a tier relative to the v1.2 thresholds, and reports observed frequencies
// of the new tiers. (Same PRNG/hash as the game.)
'use strict';
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashInt(seed,x,y){
  let h = seed|0;
  h = Math.imul(h ^ (x|0), 374761393);
  h = Math.imul(h ^ (y|0), 668265263);
  h ^= h>>>15; h = Math.imul(h, 2246822519); h ^= h>>>13;
  return h>>>0;
}
function rollOld(seed, salt){
  const r=mulberry32((hashInt(seed>>>0, salt|0, 0x9a))>>>0)();
  if(r>0.99976) return 7; if(r>0.992) return 6; if(r>0.972) return 5;
  if(r>0.93) return 4; if(r>0.84) return 3; if(r>0.66) return 2;
  if(r>0.40) return 1; return 0;
}
function rollNew(seed, salt){
  const r=mulberry32((hashInt(seed>>>0, salt|0, 0x9a))>>>0)();
  if(r>0.99999997) return 14; if(r>0.99999991) return 13; if(r>0.9999997) return 12;
  if(r>0.999999) return 11; if(r>0.999996) return 10; if(r>0.999985) return 9;
  if(r>0.99994) return 8; if(r>0.99976) return 7; if(r>0.992) return 6;
  if(r>0.972) return 5; if(r>0.93) return 4; if(r>0.84) return 3;
  if(r>0.66) return 2; if(r>0.40) return 1; return 0;
}
const N=30_000_000, SALTS=[1, 0x10F];
const counts=new Array(15).fill(0);
let downgrades=0, upgrades=0;
for(const salt of SALTS){
  for(let s=1; s<=N; s++){
    const o=rollOld(s,salt), n=rollNew(s,salt);
    counts[n]++;
    if(n<o) downgrades++;
    if(n>o) upgrades++;
  }
}
const total=N*SALTS.length;
console.log('seeds checked:', total.toLocaleString());
console.log('downgrades:', downgrades, downgrades===0 ? '(PASS — no creature loses its grade)' : '(FAIL!)');
console.log('upgrades (old Uniques climbing into the deep spectrum):', upgrades);
const NAMES=['Common','Uncommon','Notable','Rare','Exotic','Legendary','Anomalous','Unique','Mythic','Celestial','Primordial','Transcendent','Empyrean','Eternal','Singular'];
for(let t=7;t<=14;t++) console.log(`  t${t} ${NAMES[t].padEnd(13)} ${counts[t].toString().padStart(7)}  (~1 in ${Math.round(total/Math.max(1,counts[t])).toLocaleString()})`);
process.exit(downgrades===0?0:1);
