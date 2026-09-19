const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const rng=seed=>()=>{seed+=0x6d2b79f5;let n=Math.imul(seed^seed>>>15,1|seed);n^=n+Math.imul(n^n>>>7,61|n);return((n^n>>>14)>>>0)/4294967296;};
export function compileClearing({seed,world,actors}){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||world.biome!=='temperate'||!world.cardHash||!world.solid||world.groundLineY!==.78)throw Error('Clearing: supported source/card/ground required');
 if(actors.length!==3||new Set(actors.map(a=>a.id)).size!==3||actors.some(a=>!a.physical.allowed.includes('ground')))throw Error('Clearing: three distinct ground-compatible actors required');
 const recipeSeed=hash(JSON.stringify([seed,world.key,world.cardHash,actors.map(a=>[a.id,a.recordHash])])),random=rng(recipeSeed);
 const scenery={farOffset:(random()-.5)*90,farScale:1.10+random()*.05,midOffset:(random()-.5)*40,trees:[{x:-.045+random()*.06,height:.63+random()*.10,flip:false},{x:.96+random()*.07,height:.56+random()*.12,flip:true}],shrubs:[{x:.035+random()*.03,height:.15+random()*.04},{x:.94+random()*.035,height:.15+random()*.04}],rain:Array.from({length:110},()=>({x:random(),y:random(),speed:.7+random()*.6,length:.008+random()*.007}))};
 const order=[0,1,2];for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const turns=order.map((actor,index)=>({actor,target:actor===2?(random()<.5?0:1):2,startMs:index*6000,damage:16+Math.floor(random()*13)}));
 return {schema:'cf.seeded-painted-clearing/v1',seed:recipeSeed,encounterSeed:seed,world,actors,scenery,turns,durationMs:18000,groundLineY:.78,template:'accepted Earth temperate v1',generation:'seeded composition of existing painted layers; no newly inferred biome painting'};
}
export const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
/** Absolute scene time; no frame accumulation or wall clock enters the recipe. */
export function encounterBeat(recipe,ms,cards){
 if(!Number.isFinite(ms)||ms<0)throw Error('Encounter time');
 const turn=recipe.turns[Math.min(2,Math.floor(ms/6000))],t=Math.min(5999,ms-turn.startMs),card=cards[turn.actor];
 if(!Number.isFinite(card.contactMs)||card.contactMs<=0||card.contactMs>=card.meleeMs)throw Error('Encounter contact phase required');
 const approachStart=900,attackStart=1350,impact=attackStart+card.contactMs,attackEnd=attackStart+card.meleeMs,returnEnd=attackEnd+450;
 const travel=t<attackStart?ease((t-approachStart)/450):t<attackEnd?1:1-ease((t-attackEnd)/450);
 return {turn,t,approachStart,attackStart,impact,attackEnd,returnEnd,travel,phase:t<approachStart?'ready':t<attackStart?'approach':t<attackEnd?'attack':t<returnEnd?'return':'settle'};
}
