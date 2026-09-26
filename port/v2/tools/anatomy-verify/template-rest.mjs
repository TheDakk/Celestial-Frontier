/** Template descriptor for the intake compiler, built from the family CONTRACT (graph, legs, body axis) plus the
 * template's rest proportions measured once from a declared reference fit (record + master): body radius = the
 * reference mask's maximum distance-transform value; every limb length and thickness is stored as a RATIO of it, so
 * the compiler never carries a working-pixel constant. The reference is a template-level input (the family's rest
 * proof), never the subject being compiled; see README slice 18 for the one recorded circularity (Civet). The only
 * per-template hand facts are painting conventions of the master format: `view` (front/side) and `facing`. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')+'/';
const {familyContract,familyContactChains}=await import(root+'port/v2/tools/creature-animation/family-contracts.mjs');
const {readPng}=await import('./png.mjs');
import {alphaOf,detectTips} from './tips.mjs';
/** Painting conventions of the master format per template, plus the rest reference. Side view: legs are stations
 * along the body axis (rear → front), each with two depths (Far above/behind, Near below/in front). Front view: legs
 * are ordered along the outline per side about the body centre. */
export const TEMPLATE_CONVENTIONS={
  brachyuran:{view:'front',facing:'front',reference:{record:root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/crab-record.json',master:root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/crab-master.png'}},
  quadruped:{view:'side',facing:'right',reference:{record:root+'port/v2/tools/creature-animation/test-fixtures/family-records.json#quadruped',master:root+'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png'}},
};
const loadRecord=spec=>{const [file,key]=spec.split('#');const j=JSON.parse(fs.readFileSync(file,'utf8'));return key?j.records[key]:j;};
/** Slots from the contract: leg ids grouped by side (Far/Near) and, in order rear → front, by station. A leg id is
 * `<station><Side>` (leg0Far, hindNear …); the station order is the contract's leg order per side. */
export function legSlots(contract){const chains=familyContactChains(contract);const sides={Far:[],Near:[]};
  for(const c of chains){const side=/Far$/.test(c.id)?'Far':/Near$/.test(c.id)?'Near':null;if(!side)throw Error('leg without a side: '+c.id);sides[side].push({id:c.id,station:c.id.slice(0,-side.length),terminal:c.terminal??c.end,chain:[c.hip,c.knee,c.end,...(c.terminal?[c.terminal]:[])]});}
  return sides;}
/** Non-leg appendages from the contract graph: every maximal chain hanging off a non-leg joint that ends in a leaf,
 * grouped by its attachment joint. A group with two leaves under one intermediate joint (claw palm → fixed + dactyl)
 * is a FORK; a single short chain whose terminal is thicker than its stalk is a KNOB (eyes, ears); the rest are
 * CHAINS (tails, antennae). Side comes from the joint name (Far/Near) when present. */
export function appendages(contract){const legIds=new Set(contract.legs);const parents=new Map(contract.graph);const children=new Map();for(const [j,p] of contract.graph){if(!children.has(p))children.set(p,[]);children.get(p).push(j);}
  const axisSet=new Set(contract.bodyAxis);const isLegJoint=j=>[...legIds].some(id=>j.startsWith(id));const leaves=[...parents.keys()].filter(j=>!children.has(j)&&!isLegJoint(j));
  const out=[];for(const leaf of leaves){const chain=[leaf];let j=leaf;while(parents.has(j)&&(children.get(parents.get(j))?.length===1)&&!axisSet.has(parents.get(j))&&parents.get(j)!=='root'){j=parents.get(j);chain.unshift(j);}const attach=parents.get(chain[0]);
    out.push({leaf,chain,attach,side:/Far/.test(leaf)?'Far':/Near/.test(leaf)?'Near':null});}
  // group by attach joint: a joint with ≥2 leaf chains under it (and itself hanging off the body) is a fork's palm
  const byAttach=new Map();for(const a of out){if(!byAttach.has(a.attach))byAttach.set(a.attach,[]);byAttach.get(a.attach).push(a);}
  const classes=[];for(const [attach,list] of byAttach){if(list.length>=2&&parents.has(attach)&&!axisSet.has(attach)){let stem=[attach];let j=attach;while(parents.has(j)&&children.get(parents.get(j))?.length===1&&!axisSet.has(parents.get(j))&&parents.get(j)!=='root'){j=parents.get(j);stem.unshift(j);}
      classes.push({kind:'fork',id:attach,side:list[0].side,stem,fingers:list.map(l=>l.chain),attach:parents.get(stem[0])});}
    else for(const a of list)classes.push({kind:'chain',id:a.leaf,side:a.side,chain:a.chain,attach});}
  return classes;}
const cache=new Map();
/** Rest ratios of a template measured on its reference: body radius (master px), leg length / body radius (mean over
 * visible legs, polyline along the contract chain), terminal thickness / body radius, mid-terminal-segment thickness
 * / body radius, proximal (hip→knee midpoint) thickness / body radius, body axis length / body radius. Deterministic; cached per template id. */
export function templateRest(id){
  if(cache.has(id))return cache.get(id);const conv=TEMPLATE_CONVENTIONS[id];if(!conv)throw Error('no conventions for template '+id);
  const contract=familyContract(id),slots=legSlots(contract),record=loadRecord(conv.reference.record),png=readPng(fs.readFileSync(conv.reference.master));
  const {alpha}=alphaOf(png.data,png.width,png.height),det=detectTips(alpha,png.width,png.height,{solidAlpha:128}),{dt,working:{width:W,height:H,scale,box}}=det;
  const toW=p=>[(p[0]-box.x)*scale+2,(p[1]-box.y)*scale+2];const dtAt=p=>{const [x,y]=toW(p).map(Math.round);return x>=0&&y>=0&&x<W&&y<H?dt[y*W+x]/scale:0;};
  let maxDt=0;for(let i=0;i<W*H;i++)if(dt[i]>maxDt)maxDt=dt[i];const bodyRadius=maxDt/scale;
  const {width:w,height:h}=record.geometry,lm=k=>record.landmarks[k]&&[record.landmarks[k][0]*w,record.landmarks[k][1]*h];const hidden=new Set(record.anatomy?.hidden??[]);
  const lens=[],termT=[],midT=[],proxT=[];
  for(const side of ['Far','Near'])for(const s of slots[side]){if(hidden.has(s.id))continue;const pts=s.chain.map(lm);if(pts.some(p=>!p))continue;let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);lens.push(L);s.restLength=+(L/bodyRadius).toFixed(3);{let acc=0;const fr=[];for(let i=1;i<pts.length-1;i++){acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);fr.push(+(acc/L).toFixed(3));}s.jointFractions=fr;} // interior joints (knee, ankle…) as fractions of the chain's rest length from the root
    termT.push(dtAt(pts[pts.length-1]));const a=pts[pts.length-2],b=pts[pts.length-1];midT.push(dtAt([(a[0]+b[0])/2,(a[1]+b[1])/2]));proxT.push(dtAt([(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2]));}
  const mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
  // rest ratios of the non-leg appendage classes: chain length (attach → leaf polyline) / R and terminal thickness / R
  const app=appendages(contract).map(c=>{const pts=(c.kind==='fork'?[c.attach,...c.stem,...c.fingers[0]]:[c.attach,...c.chain]).map(lm);if(pts.some(p=>!p))return {...c,length:null};let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
    const tip=pts[pts.length-1],stalk=pts[Math.max(0,pts.length-2)];return {...c,length:+(L/bodyRadius).toFixed(3),tipThickness:+(dtAt(tip)/bodyRadius).toFixed(3),stalkThickness:+(dtAt([(tip[0]+stalk[0])/2,(tip[1]+stalk[1])/2])/bodyRadius).toFixed(3)};});const [ax0,ax1]=contract.bodyAxis.map(lm);const axisLen=ax0&&ax1?Math.hypot(ax1[0]-ax0[0],ax1[1]-ax0[1]):0;
  // rest ORDER geometry per slot: the hip landmark's angle about the axis midpoint (front view) and its coordinate
  // along the axis in body radii (side view); a slot whose hip is hidden in the reference gets the mirror of its twin
  const mid=ax0&&ax1?[(ax0[0]+ax1[0])/2,(ax0[1]+ax1[1])/2]:[w/2,h/2];
  for(const side of ['Far','Near'])for(const s of slots[side]){const hip=lm(s.chain[0]);if(hip&&!hidden.has(s.id)){s.restAngle=+Math.atan2(hip[1]-mid[1],hip[0]-mid[0]).toFixed(3);s.restU=+(((hip[0]-mid[0])*(ax1[0]-ax0[0])+(hip[1]-mid[1])*(ax1[1]-ax0[1]))/(axisLen||1)/bodyRadius).toFixed(3);}}
  for(const side of ['Far','Near'])for(const s of slots[side]){if(s.restLength===undefined){const twin=slots[side==='Far'?'Near':'Far'].find(t=>t.station===s.station);if(twin&&twin.restLength!==undefined){s.restLength=twin.restLength;s.jointFractions=twin.jointFractions;}}if(s.restAngle!==undefined)continue;const twin=slots[side==='Far'?'Near':'Far'].find(t=>t.station===s.station);if(twin&&twin.restAngle!==undefined){s.restAngle=+(Math.PI-twin.restAngle).toFixed(3);if(s.restAngle>Math.PI)s.restAngle-=2*Math.PI;s.restU=twin.restU;}}
  const rest={id,view:conv.view,facing:conv.facing,bodyRadius:+bodyRadius.toFixed(1),legLength:+(mean(lens)/bodyRadius).toFixed(3),terminalThickness:+(mean(termT)/bodyRadius).toFixed(3),legThickness:+(mean(midT)/bodyRadius).toFixed(3),proximalThickness:+(mean(proxT)/bodyRadius).toFixed(3),axisLength:+(axisLen/bodyRadius).toFixed(3),legsPerSide:slots.Far.length,slots,appendages:app,contract};
  cache.set(id,rest);return rest;}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){for(const id of Object.keys(TEMPLATE_CONVENTIONS)){const r=templateRest(id);console.log(id,JSON.stringify({view:r.view,facing:r.facing,bodyRadius:r.bodyRadius,legLength:r.legLength,terminalThickness:r.terminalThickness,legThickness:r.legThickness,proximalThickness:r.proximalThickness,axisLength:r.axisLength,legsPerSide:r.legsPerSide,stations:r.slots.Far.map(s=>s.station),restAngles:{Far:r.slots.Far.map(s=>s.restAngle),Near:r.slots.Near.map(s=>s.restAngle)},restU:r.slots.Far.map(s=>s.restU),restLengths:{Far:r.slots.Far.map(s=>s.restLength),Near:r.slots.Near.map(s=>s.restLength)}}));for(const a of r.appendages)console.log('   ',a.kind,a.id,a.side,'attach',a.attach,'len',a.length,'tip',a.tipThickness,'stalk',a.stalkThickness);}}
