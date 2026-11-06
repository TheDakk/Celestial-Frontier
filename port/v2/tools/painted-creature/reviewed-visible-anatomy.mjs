/** Exact-source manual placement of visible ears, complete tails, mandibles and faces; never absence or an inventory waiver. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,m)=>{if(!v)throw Error('Reviewed visible anatomy: '+m);};
export function admitVisibleAnatomy({masterBytes,subjectBytes,promptBytes,review,mask,width,height}){
 need(review?.schema==='cf.reviewed-visible-anatomy/v1','schema');
 for(const [key,bytes]of [['master',masterBytes],['subject',subjectBytes],['prompt',promptBytes]])need(review[key+'Sha256']===sha(bytes),'exact '+key+' hash');
 const subject=JSON.parse(subjectBytes),canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url))).filter(s=>s.name===review.name);
 need(subject.name===review.name&&canonical.length===1&&JSON.stringify(subject.species)===JSON.stringify(canonical[0])&&['quadruped','insect'].includes(subject.family),'canonical supported family');
 need(review.scope==='visible-placement-only-no-inventory-exemption'&&review.reviewer==='Codex'&&review.method==='Full-original visual inspection'&&review.observation?.trim(),'explicit source observation');
 need(width===1254&&height===1254&&mask.length===width*height,'source dimensions');
 need(review.anatomySha256===sha(JSON.stringify(review.anatomy)),'exact observed anatomy');
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>0&&n<1254);
 const on=p=>point(p)&&mask[Math.floor(p[1])*width+Math.floor(p[0])]===1;
 need(Array.isArray(review.anatomy)&&review.anatomy.length>0&&review.anatomy.length<=3,'one to three observed anatomical groups');
 const seen=new Set();for(const ear of review.anatomy){
 if(ear.kind){
  need(['tail','mandible','face'].includes(ear.kind)&&!seen.has(ear.kind),'unique supported complete group');seen.add(ear.kind);
  const tail=ear.kind==='tail',face=ear.kind==='face',keys=tail?['tail0','tail1','tail2','tail3']:face?['head','jaw']:['mandible'];
  need(tail||face?subject.family==='quadruped':subject.family==='insect','group matches canonical family');
  need(Object.keys(ear.landmarksPx).sort().join(',')===keys.join(','),'complete visible chain, no shortened actuator inventory');
  need(Object.values(ear.landmarksPx).every(on),'landmarks on actual source paint');
  need(keys.slice(1).every((k,i)=>Math.hypot(...ear.landmarksPx[k].map((v,j)=>v-ear.landmarksPx[keys[i]][j]))>=1.254),'distinct observed chain points');
  need(ear.regions.length===keys.length&&new Set(ear.regions.map(r=>r.joint)).size===keys.length&&ear.regions.every(r=>keys.includes(r.joint)&&Array.isArray(r.polygonPx)&&r.polygonPx.length>=3&&r.polygonPx.every(point)),'one observed region per existing actuator');
  continue;
 }
 need(subject.family==='quadruped','external ears only on quadruped');need(['near','far'].includes(ear.side)&&!seen.has(ear.side),'unique ear side');seen.add(ear.side);const prefix='ear'+(ear.side==='near'?'Near':'Far');need(Object.keys(ear.landmarksPx).sort().join(',')===[prefix+'Root',prefix+'Tip'].sort().join(','),'complete ear chain');need(Object.values(ear.landmarksPx).every(on),'landmarks on actual source paint');need(Math.hypot(...ear.landmarksPx[prefix+'Tip'].map((v,i)=>v-ear.landmarksPx[prefix+'Root'][i]))>=1.254,'distinct visible root and tip');need(ear.regions.length===2&&new Set(ear.regions.map(r=>r.joint)).size===2&&ear.regions.every(r=>Object.hasOwn(ear.landmarksPx,r.joint)&&Array.isArray(r.polygonPx)&&r.polygonPx.length>=3&&r.polygonPx.every(point)),'two observed ear regions');}
 return structuredClone(review.anatomy);
}
export function applyVisibleAnatomy(parts,landmarksPx,anatomy,remainderPart){
 if(!anatomy)return{parts,landmarksPx};const out=structuredClone(parts),lm=structuredClone(landmarksPx);
 for(const ear of anatomy)for(const r of ear.regions){const found=out.filter(p=>p.joint===r.joint);need(found.length===1&&found[0].id!==remainderPart&&Object.hasOwn(lm,r.joint),'existing visible owner only');found[0].polygonPx=structuredClone(r.polygonPx);lm[r.joint]=[...ear.landmarksPx[r.joint]];}
 return{parts:out,landmarksPx:lm};
}
