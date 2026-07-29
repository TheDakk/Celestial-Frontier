import M from './voicemodel.mjs';
const {voiceOf, makeGenome, crossGenome, _VOICE, _VOICE_KEYS, FA_BEHAVIOR, FA_TEMPER, FA_SIZE, _earthArt} = M;
const r3 = v => Math.round(v*1000)/1000;
const key = v => `${v.kind}|${r3(v.f0)}|${r3(v.rich)}|${r3(v.nz)}|${v.vib}|${v.vibD}|${r3(v.dur)}|${v.sweep}`;

// ---------- 1. procedural corpus ----------
const N = 20000, fam = {}, kinds = {}, f0s = [], keys = new Map();
for (let i = 0; i < N; i++) {
  const g = makeGenome((i*2654435761)>>>0, 'fauna', 0.5);
  const v = voiceOf(g);
  const famName = _VOICE_KEYS[(M.hashInt((g.seed>>>0),0x5F0C,0x2D)>>>4)%_VOICE_KEYS.length];
  fam[famName]=(fam[famName]||0)+1; kinds[v.kind]=(kinds[v.kind]||0)+1; f0s.push(v.f0);
  const k = key(v); keys.set(k,(keys.get(k)||0)+1);
}
f0s.sort((a,b)=>a-b);
console.log(`=== 1. ${N} procedural fauna ===`);
console.log('families used :', Object.keys(fam).length, '/', _VOICE_KEYS.length,
  Object.keys(_VOICE_KEYS).length===Object.keys(fam).length?'':'');
const exp = N/_VOICE_KEYS.length;
console.log('family spread :', Object.entries(fam).sort((a,b)=>b[1]-a[1])
  .map(([k,v])=>`${k}:${v}`).join(' '));
console.log(`               expected ${exp.toFixed(0)} each; min ${Math.min(...Object.values(fam))} max ${Math.max(...Object.values(fam))}`);
console.log('kinds         :', Object.entries(kinds).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(' '));
console.log(`f0 range      : ${f0s[0].toFixed(0)}Hz .. ${f0s[f0s.length-1].toFixed(0)}Hz  (median ${f0s[N>>1].toFixed(0)}Hz)`);
console.log(`  at floor(60): ${f0s.filter(x=>x<=60.001).length}   at ceiling(6000): ${f0s.filter(x=>x>=5999.9).length}`);
const dupes=[...keys.values()].filter(c=>c>1).reduce((a,b)=>a+b-1,0);
console.log(`distinct voices: ${keys.size} of ${N}  → ${((1-keys.size/N)*100).toFixed(1)}% of creatures share a voice with another (${dupes} collisions)`);
const top=[...keys.entries()].sort((a,b)=>b[1]-a[1])[0];
console.log(`most common voice occurs ${top[1]}× (${(top[1]/N*100).toFixed(2)}%)`);

// ---------- 2. the reviewer's four named claims ----------
console.log('\n=== 2. "A wolf roars, a sparrow chirps, a whale sings, a rattlesnake hisses" ===');
for (const nm of ['Wolf','Sparrow','Blue Whale','Rattlesnake','Tiger','Bat','Cobra','Bullfrog','Honeybee','Octopus','Tarantula','Sea Turtle','Chimpanzee']) {
  const rec=_earthArt(nm); const g={seed:12345,size:2,behavior:1,_earthName:nm};
  const v=voiceOf(g);
  console.log(`  ${nm.padEnd(13)} rig=${String(rec&&rec.rig).padEnd(10)} kind=${v.kind.padEnd(6)} f0=${v.f0.toFixed(0).padStart(5)}Hz nz=${v.nz.toFixed(2)} dur=${v.dur.toFixed(2)}s`);
}

// ---------- 3. does the tilt track the temperament the card shows? ----------
console.log('\n=== 3. "temperament tilts the character" — which gene actually drives it? ===');
console.log(`  voiceOf reads  g.behavior % 5     (FA_BEHAVIOR has ${FA_BEHAVIOR.length} entries)`);
console.log(`  the card shows FA_TEMPER[g.temper % ${FA_TEMPER.length}]  — voiceOf never reads g.temper`);
const tilt = {};
for (let b=0;b<FA_BEHAVIOR.length;b++){ const t=(b%5)/4; (tilt[t]=tilt[t]||[]).push(b); }
for (const [t,bs] of Object.entries(tilt))
  console.log(`   bold=${t}: behaviours ${bs.join(',')}  → "${bs.map(b=>FA_BEHAVIOR[b].slice(0,26)).join('" / "')}"`);
// how much does bold actually move the sound?
const gb = b => voiceOf({seed:777,size:2,behavior:b});
const lo=gb(0), hi=gb(4);
console.log(`  audible span: f0 ${lo.f0.toFixed(0)}→${hi.f0.toFixed(0)}Hz (${((hi.f0/lo.f0-1)*100).toFixed(0)}%), dur ${lo.dur.toFixed(2)}→${hi.dur.toFixed(2)}s`);
// is a placid creature ever bolder-sounding than an aggressive one?
let mism=0, tot=0;
for(let i=0;i<5000;i++){ const g=makeGenome((i*40503)>>>0,'fauna',0.5);
  const tempAggr = /aggress|territorial|hostile|predator/i.test(FA_TEMPER[(g.temper||0)%FA_TEMPER.length]);
  const bold=((+g.behavior||0)%5)/4; tot++;
  if(tempAggr && bold<0.5) mism++; }
console.log(`  of ${tot} creatures, ${mism} read as aggressive on the card but carry a below-median voice tilt`);

// ---------- 4. size ----------
console.log('\n=== 4. does pitch track the size the card shows? ===');
for(let s=0;s<8;s++){ const v=voiceOf({seed:777,size:s,behavior:2});
  console.log(`  size gene ${s} → card says "${FA_SIZE[s%FA_SIZE.length]}"  f0=${v.f0.toFixed(0)}Hz`); }

// ---------- 5. breeding drift ----------
console.log('\n=== 5. breeding: does the voice drift alien over generations? ===');
const earth={...makeGenome(1001,'fauna',0.5), _earthName:'Wolf', gen:0};
let line={...earth};
console.log(`  gen0  anchor=1.00 (pure Earth)   kind=${voiceOf(line).kind}  f0=${voiceOf(line).f0.toFixed(0)}Hz`);
for(let gen=1;gen<=6;gen++){
  const wild=makeGenome((5000+gen*7919)>>>0,'fauna',0.5);
  line=crossGenome(line,wild);
  const v=voiceOf(line);
  const anchor=line._anchorVal;
  const alienFam=_VOICE_KEYS[(M.hashInt((line.seed>>>0),0x5F0C,0x2D)>>>4)%_VOICE_KEYS.length];
  console.log(`  gen${gen}  anchor=${anchor==null?'—':anchor.toFixed(2)}  blend t=${anchor==null?'—':(1-anchor).toFixed(2)}  kind=${v.kind.padEnd(6)} f0=${v.f0.toFixed(0).padStart(5)}Hz   (alien half would be ${_VOICE[alienFam].kind})`);
}
console.log('\n  Earth × Earth (both anchored):');
let l2={...earth}; const e2={...makeGenome(2002,'fauna',0.5),_earthName:'Tiger',gen:0};
for(let gen=1;gen<=4;gen++){ l2=crossGenome(l2,{...e2,seed:e2.seed+gen});
  console.log(`  gen${gen}  anchor=${l2._anchorVal.toFixed(2)}  kind=${voiceOf(l2).kind}  f0=${voiceOf(l2).f0.toFixed(0)}Hz`); }
