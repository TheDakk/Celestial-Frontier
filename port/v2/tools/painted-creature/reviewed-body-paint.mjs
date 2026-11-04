/** Exact-source manual body-surface ownership; never a missing-appendage waiver. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,m)=>{if(!v)throw Error('Reviewed body paint: '+m);};
const allowed={torso:{feature:/barrel|low-slung|stocky|shoulders|arched|hunched/i,joints:['spine','chest','pelvis']},paddle:{feature:/paddle tail/i,joints:['tail0','tail1','tail2','tail3']},hump:{feature:/hump/i,joints:['spine','chest','pelvis']},armour:{feature:/armou?r|shell|scales/i,joints:['spine','chest','pelvis']},spines:{feature:/spines|quills/i,joints:['spine','chest','pelvis']},pouch:{feature:/throat pouch/i,joints:['beak'],family:'biped-bird'},crest:{feature:/crest/i,joints:['head'],family:'biped-bird'},streamer:{feature:/streaming tail plumes/i,joints:['tailFan'],family:'biped-bird'}};
export function admitBodyPaint({masterBytes,subjectBytes,review}){
 need(review?.schema==='cf.reviewed-body-paint/v1','schema');
 need(review.masterSha256===sha(masterBytes)&&review.subjectSha256===sha(subjectBytes),'exact source hashes');
 const subject=JSON.parse(subjectBytes),canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url))).filter(s=>s.name===subject.name);
 need(canonical.length===1&&JSON.stringify(canonical[0])===JSON.stringify(subject.species)&&subject.name===review.name&&['quadruped','biped-bird'].includes(subject.family),'canonical supported family');
 need(review.reviewer==='Codex'&&review.method==='Full-original visual inspection'&&review.observation?.trim(),'manual source observation');
 need(review.scope==='body-surface-only-no-inventory-exemption','scope');
 need(Array.isArray(review.regions)&&review.regions.length===1,'one source body region');
 need(review.regionsSha256===sha(JSON.stringify(review.regions)),'exact observed regions');
 for(const r of review.regions){const rule=allowed[r.kind];need(rule&&rule.joints.includes(r.joint)&&subject.family===(rule.family??'quadruped'),'supported anatomical body owner');need(subject.species.mustRead.includes(r.canonicalFeature)&&rule.feature.test(r.canonicalFeature),'independent named anatomy');need(/^reviewed-body-[a-z-]+$/.test(r.id),'named source region');need(Array.isArray(r.polygonPx)&&r.polygonPx.length>=3&&r.polygonPx.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>0&&n<1254)),'bounded observed polygon');}
 return structuredClone(review.regions);
}
export function applyBodyPaint(parts,remainderPart,regions){
 if(!regions?.length)return parts;
 need(parts.filter(p=>p.id===remainderPart).length===1,'one unchanged remainder');
 need(parts.at(-1).id===remainderPart,'remainder must already have last priority');
 need(regions.every(r=>parts.some(p=>p.joint===r.joint)),'existing body joint only');
 need(regions.every(r=>!parts.some(p=>p.id===r.id)),'unique owner names');
 const added=regions.map(r=>({id:r.id,joint:r.joint,layer:'near',polygonPx:r.polygonPx}));
 // All existing anatomy retains its original priority; only remainder paint can move.
 return [...parts.filter(p=>p.id!==remainderPart),...added,parts.find(p=>p.id===remainderPart)];
}
