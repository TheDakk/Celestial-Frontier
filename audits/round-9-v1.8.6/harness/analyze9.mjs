/* Round 8 rollup: health, per-archetype system reach, and the saw-vs-did
   reachability split that the new verbs exist to measure. */
import fs from 'fs';
const rows=[...new Map(fs.readFileSync(process.argv[2]||'/root/cf/v9out/fleet.jsonl','utf8')
  .trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(_){return null}})
  .filter(Boolean).map(r=>[r.id,r])).values()];
const deep=rows.filter(r=>r.tier==='deep'), broad=rows.filter(r=>r.tier==='broad');
const num=(rs,k)=>{const a=rs.map(x=>x[k]).filter(v=>typeof v==='number'&&v>0).sort((p,q)=>p-q);
  return a.length?{n:a.length,p10:a[Math.floor(a.length*.1)],median:a[a.length>>1],p90:a[Math.floor(a.length*.9)]}:null;};
const agg=(rs,k)=>{const o={};for(const r of rs)for(const [a,b] of Object.entries(r[k]||{}))o[a]=(o[a]||0)+b;return o;};

console.log('=== v1.8.5 ROUND 8 — '+rows.length+' sessions ('+deep.length+' deep, '+broad.length+' broad) ===\n');
console.log('HEALTH');
console.log('  completed            '+rows.filter(r=>r.ok).length+' / '+rows.length);
console.log('  fatal                '+rows.filter(r=>r.fatal).length);
console.log('  uncaught errors      '+rows.filter(r=>r.errors&&r.errors.length).length);
console.log('  unhandled rejections '+rows.filter(r=>r.rejections&&r.rejections.length).length);
console.log('  storage failures     '+rows.filter(r=>r.storageFail).length);
console.log('  stuck overlays       '+rows.filter(r=>r.stuckOverlay).length);
const rq=rows.filter(r=>r.rageQuit);
console.log('  rage quits           '+rq.length+'  ('+(rq.length/rows.length*1000).toFixed(1)+' per 1000)');
if(rq.length){
  const bp={}; for(const r of rq) bp[r.persona]=(bp[r.persona]||0)+1;
  console.log('    by archetype       '+JSON.stringify(bp));
  console.log('    skipped training   '+rq.filter(r=>r.tutorial==='skipped').length+' / '+rq.length);
}
const f=num(rows,'fps'), b=num(rows,'bootMs');
if(f) console.log('  fps                  median '+f.median+'  p10 '+f.p10);
if(b) console.log('  boot                 median '+b.median+'ms  p90 '+b.p90+'ms');

console.log('\nSYSTEM REACH — deep tier, all archetypes');
const D=agg(deep,'did'), S=agg(deep,'saw'), G=agg(deep,'goalFail');
const VERBS=['mine','harvest','scavenge','tame','conquer','craft','breed','feed','charter','sheet','idle','backout'];
console.log('  verb        saw    did   reach   top failure');
for(const v of VERBS){
  const s=S[v]||0, d=D[v]||0;
  const fails=Object.entries(G).filter(([k])=>k.startsWith(v+':')).sort((a,b)=>b[1]-a[1]);
  const top=fails.length?fails[0][0].split(':').slice(1).join(':')+' ×'+fails[0][1]:'—';
  console.log('  '+v.padEnd(11)+String(s).padStart(4)+String(d).padStart(7)+
    (s?(' '+Math.round(d/s*100)+'%').padStart(8):'       —')+'   '+top);
}

console.log('\nPER-ARCHETYPE — deep sessions, verbs completed');
const byP={};
for(const r of deep){ byP[r.persona]=byP[r.persona]||{n:0,seeded:0,did:{},acts:0,codex:0,ess:0};
  const o=byP[r.persona]; o.n++; if(r.seeded) o.seeded++; o.acts+=r.actions||0;
  o.codex+=(r.progress&&r.progress.codex)||0; o.ess+=(r.progress&&r.progress.essence)||0;
  for(const [k,v] of Object.entries(r.did||{})) o.did[k]=(o.did[k]||0)+v; }
console.log('  archetype        n  seed  acts/s  Δcodex  Δ☄   systems touched');
for(const [p,o] of Object.entries(byP).sort((a,b)=>Object.keys(b[1].did).length-Object.keys(a[1].did).length)){
  const sys=Object.entries(o.did).sort((x,y)=>y[1]-x[1]).map(([k,v])=>k+':'+v).join(' ');
  console.log('  '+p.padEnd(16)+String(o.n).padStart(2)+String(o.seeded).padStart(6)+
    (o.acts/o.n).toFixed(0).padStart(8)+String(o.codex).padStart(8)+String(o.ess).padStart(6)+'   '+(sys||'(none)'));
}

console.log('\nFRICTION');
const fr={}; for(const r of rows) for(const x of (r.frictionEvents||[])) {
  const k=x.split(':').slice(0,2).join(':'); fr[k]=(fr[k]||0)+1; }
const fe=Object.entries(fr).sort((a,b)=>b[1]-a[1]);
if(!fe.length) console.log('  none recorded');
for(const [k,v] of fe.slice(0,14)) console.log('  '+k.padEnd(40)+v);

console.log('\nTRAINING');
const took=rows.filter(r=>r.tutorial==='took');
const st={}; for(const r of took) if(r.tutorialStall) st[r.tutorialStall.step]=(st[r.tutorialStall.step]||0)+1;
console.log('  took '+took.length+' · skipped '+rows.filter(r=>r.tutorial==='skipped').length+
  ' ('+Math.round(rows.filter(r=>r.tutorial==='skipped').length/rows.length*100)+'%)');
console.log('  stalls by step  '+JSON.stringify(st));
const mx={}; for(const r of took) mx[r.tutorialSteps]=(mx[r.tutorialSteps]||0)+1;
console.log('  max step reached '+JSON.stringify(mx));

console.log('\nDEVICE COVERAGE');
const dv={}; for(const r of rows) dv[r.device]=(dv[r.device]||0)+1;
console.log('  '+Object.keys(dv).length+' profiles, '+Math.min(...Object.values(dv))+'–'+Math.max(...Object.values(dv))+' sessions each');
