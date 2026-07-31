/* Build the 1,000-session test plan.
   Balanced across personas and device classes, with a deep tier that plays long
   enough to reach mid-game, and a broad tier that covers onboarding + first loop. */
import { PERSONAS, DEVICES } from './bot9.mjs';
import fs from 'fs';

const N = +(process.argv[2] || 1440);
const DEEP = +(process.argv[3] || 144);

// device weighting roughly mirrors real web traffic: phones lead, then desktop, then tablet
const CLASS_MIX = { phone:0.52, desktop:0.34, tablet:0.14 };
const byClass = c => DEVICES.filter(d=>d[2]===c);

function mulberry(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rnd = mulberry(20260726);
const pick = a => a[Math.floor(rnd()*a.length)];
const pickClass = () => { const r=rnd(); let acc=0;
  for(const [c,p] of Object.entries(CLASS_MIX)){ acc+=p; if(r<acc) return c; } return 'phone'; };

/* the archetypes whose systems only exist past the first hour */
const VETERAN_PERSONAS = new Set(['miner','breeder','economist','hardcore','collector','min-maxer','idler','completionist']);
const plan = [];
for (let i=0;i<N;i++){
  const deep = i < DEEP;
  // round-robin personas so every persona gets equal representation
  const persona = PERSONAS[i % PERSONAS.length].id;
  const cls = deep ? ['phone','tablet','desktop'][i % 3] : pickClass();
  const dev = pick(byClass(cls));
  plan.push({
    id: (deep?'D':'B') + String(i).padStart(4,'0'),
    seed: 100000 + i*7919,
    persona,
    device: dev[0],
    tier: deep ? 'deep' : 'broad',
    budgetMs: deep ? 95000 : 13000,
    maxActions: deep ? 260 : 45,
    reducedMotion: (i % 17 === 0),          // ~6% run with prefers-reduced-motion
    playerName: 'Tester'+i,
    /* round 8: half of every system-heavy persona's DEEP sessions start mid-game,
       so the late loops get exercised; the other half still walks in cold, and
       the onboarding personas always start cold. */
    seedSave: (deep && VETERAN_PERSONAS.has(persona) && (Math.floor(i/PERSONAS.length) % 2 === 0))
      ? '/root/cf/v9out/veteran-save.json' : undefined,
  });
}
fs.writeFileSync(process.argv[4] || '../out/plan.json', JSON.stringify(plan));

const cnt = (k,v) => plan.filter(p=>p[k]===v).length;
console.log(`plan: ${plan.length} sessions — deep ${cnt('tier','deep')}, broad ${cnt('tier','broad')}`);
const devClass = id => DEVICES.find(d=>d[0]===id)[2];
for (const c of ['phone','tablet','desktop'])
  console.log(`  ${c.padEnd(8)} ${plan.filter(p=>devClass(p.device)===c).length}`);
console.log('  personas:', PERSONAS.map(p=>`${p.id}=${cnt('persona',p.id)}`).join(' '));
const estMs = plan.reduce((a,p)=>a+p.budgetMs+6000,0);
console.log(`  est. serial time ${(estMs/3600000).toFixed(2)}h  → at 2 workers ≈ ${(estMs/2/3600000).toFixed(2)}h`);
