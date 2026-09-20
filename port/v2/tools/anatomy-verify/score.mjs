/** IC-4 scoring runner (the "runner pattern" the README slices cite, now committed). Runs the compiler's registration
 * over the five painted crabs (Codex's frozen delivery set) AND the keyed Civet through the identical code and scores
 * each against the hand-authored record landmarks — comparison truth only, never an input. Prints, per subject:
 * visible foot positions within `tol` master px of ANY pool candidate, named slots within `tol` px of the landmark
 * of that name, and hidden-set equality with the record's declaration. Usage: node score.mjs [tol] [json]. Not a gate. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')+'/',codex='/Users/nick/Projects/celestial-frontier-openai-mac/';
const {readPng}=await import(root+'port/v2/tools/painted-creature/finish-conservation.mjs');
const {assignLegs,TEMPLATES}=await import('./assign.mjs');
export const SUBJECTS=[
  ['coconut-crab','brachyuran',codex+'audits/VISION_P1_COCONUT_20260920/generation-01/coconut-crab-master.png',codex+'audits/VISION_P1_COCONUT_20260920/hidden-01/fit-04/record.json'],
  ['crab','brachyuran',codex+'audits/VISION_P1_FOUR_CRABS_20260920/crab/generation-01/crab-master.png',codex+'audits/VISION_P1_FOUR_CRABS_20260920/intake-02/crab-fit-01/record.json'],
  ['freshwater-crab','brachyuran',codex+'audits/VISION_P1_FOUR_CRABS_20260920/freshwater-crab/generation-01/freshwater-crab-master.png',codex+'audits/VISION_P1_FOUR_CRABS_20260920/intake-02/freshwater-crab-fit-03/record.json'],
  ['mud-crab','brachyuran',codex+'audits/VISION_P1_FOUR_CRABS_20260920/mud-crab/generation-01/mud-crab-master.png',codex+'audits/VISION_P1_FOUR_CRABS_20260920/intake-02/mud-crab-fit-01/record.json'],
  ['vent-crab','brachyuran',codex+'audits/VISION_P1_FOUR_CRABS_20260920/vent-crab/generation-01/vent-crab-master.png',codex+'audits/VISION_P1_FOUR_CRABS_20260920/intake-01/vent-crab-fit-01/record.json'],
  ['civet','quadruped',root+'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',root+'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/record.json'],
];
export function truthOf(record){const {width:w,height:h}=record.geometry,lm=record.landmarks;const px={};for(const [k,v] of Object.entries(lm))px[k]=[v[0]*w,v[1]*h];return {px,hidden:record.anatomy?.hidden??[],absent:record.anatomy?.absent??[]};}
export function scoreSubject(res,truth,template,tol){
  const t=TEMPLATES[template],footNames=[];for(const side of ['Far','Near'])for(let k=0;k<t.legsPerSide;k++)footNames.push(t.slotName(k,side));
  const legOf=n=>n.replace(/Foot$|Paw$/,'');const visible=footNames.filter(n=>!truth.hidden.includes(legOf(n))&&truth.px[n]);
  const pool=res.pool.map(c=>c.tip);const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const pos=visible.filter(n=>pool.some(p=>dist(p,truth.px[n])<=tol));
  const assigned=Object.keys(res.assigned),named=assigned.filter(n=>truth.px[n]&&dist(res.assigned[n].master,truth.px[n])<=tol);
  const hiddenOk=[...res.hidden].sort().join(',')===[...truth.hidden].sort().join(',');
  const perName=visible.map(n=>{const a=res.assigned[n];return n+':'+(a?Math.round(dist(a.master,truth.px[n])):'-')});
  // interior joints (knees, ankles) of correctly named legs, and inferred landmarks of declared-hidden slots
  const jointErr=[],hiddenErr=[];for(const side of ['Far','Near'])for(const sl of t.rest.slots[side]){if(named.includes(sl.terminal))for(const j of sl.chain.slice(1,-1)){if(res.joints[j]&&truth.px[j])jointErr.push(Math.round(dist(res.joints[j],truth.px[j])));}
    if(truth.hidden.includes(sl.id)&&res.inferred[sl.terminal]&&truth.px[sl.terminal])hiddenErr.push(Math.round(dist(res.inferred[sl.terminal],truth.px[sl.terminal])));}
  return {jointErr,hiddenErr,visible:visible.length,pos:pos.length,assigned:assigned.length,named:named.length,hiddenOk,hidden:res.hidden,truthHidden:truth.hidden,perName,wrongNamed:assigned.filter(n=>!named.includes(n))};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const tol=Number(process.argv[2]??25),json=process.argv[3]==='json';const tot={visible:0,pos:0,assigned:0,named:0,hiddenOk:0};const out={};
  for(const [id,template,master,rec] of SUBJECTS){const png=readPng(fs.readFileSync(master));const truth=truthOf(JSON.parse(fs.readFileSync(rec,'utf8')));
    const opts=process.env.ASSIGN_OPTS?JSON.parse(process.env.ASSIGN_OPTS):{};const res=assignLegs(png.data,png.width,png.height,null,{template,...opts});const s=scoreSubject(res,truth,template,tol);out[id]=s;
    for(const k of ['visible','pos','assigned','named'])tot[k]+=s[k];tot.hiddenOk+=s.hiddenOk?1:0;
    console.log(id.padEnd(16),`pos ${s.pos}/${s.visible}`.padEnd(10),`named ${s.named}/${s.assigned}`.padEnd(12),'hidden',s.hiddenOk?'OK ':'NO ',JSON.stringify(s.hidden),'truth',JSON.stringify(s.truthHidden),'| pool',res.pool.length,'|',s.perName.join(' '),'| joints',s.jointErr.join(','),'| hidden',s.hiddenErr.join(','));}
  console.log('TOTAL'.padEnd(16),`pos ${tot.pos}/${tot.visible}`.padEnd(10),`named ${tot.named}/${tot.assigned}`.padEnd(12),'hidden exact',tot.hiddenOk+'/'+SUBJECTS.length);
  if(json)fs.writeFileSync(process.env.SCORE_OUT??'/dev/stdout',JSON.stringify(out,null,1));
}
