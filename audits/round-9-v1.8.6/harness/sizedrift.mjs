import M from '/root/cf/harness/model9.mjs';
const {makeGenome,crossGenome,FA_SIZE}=M;
const CAP=FA_SIZE.length-1;
for (const GENS of [5,10,20]){
  let over=0, tot=0, mx=0;
  for(let line=0;line<500;line++){
    let a=makeGenome((900000+line*7919)>>>0,'fauna',0.5);
    for(let gen=1;gen<=GENS;gen++) a=crossGenome(a, makeGenome((950000+line*31+gen*997)>>>0,'fauna',0.5));
    tot++; const s=a.size|0; if(s>CAP) over++; if(s>mx) mx=s;
  }
  console.log(`gen ${String(GENS).padStart(2)}:  size>${CAP} in ${String(over).padStart(3)}/${tot}  (${(over/tot*100).toFixed(1)}%)   max ${mx}`);
}
console.log('\nwhat one reload does to a creature that legitimately drifted:');
for(const s of [6,7,9,11,12]){
  const w=((s%6)+6)%6;
  console.log(`  stored size ${String(s).padStart(2)}  in-session "${FA_SIZE[w].padEnd(9)}" vit +${String(w*4).padStart(2)} agi -${String(w*2).padStart(2)}` +
              `   →  after load (clamped to 5) "${FA_SIZE[5]}" vit +20 agi -10`);
}
