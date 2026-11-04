/** Exact-source compact tail / present-occluded ear review. No score-derived exemptions. */
import {measureCompactTail} from './measured-compact-tail.mjs';
import fs from 'node:fs';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,m)=>{if(!v)throw Error('Reviewed representation: '+m);};
const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>0&&n<1254);
const polygon=p=>Array.isArray(p)&&p.length>=3&&p.every(point);
function admitIsopodReview(review,subject){
 need(['Isopod','Giant Isopod'].includes(subject.name)&&subject.family==='crustacean-small','isopod canonical family only');
 need(review.scope==='exact-master-only-no-visual-admission'&&review.review?.method==='Full-original visual inspection'&&['Dakk','TheDakk','Codex','Claude'].includes(review.review.reviewer)&&review.review.observation?.trim(),'explicit isopod visual review');
 const e=review.evidence;need(e&&Object.keys(e).length===3&&Object.keys(e).every(k=>['dimensions','occludedWalkingLegs','visibleWalkingLegs'].includes(k))&&JSON.stringify(e.dimensions)==='[1254,1254]','isopod evidence inventory');
 need(review.declarationSha256===sha(JSON.stringify(e)),'exact declaration hash');
 const hidden=e.occludedWalkingLegs,visible=e.visibleWalkingLegs;
 need(Array.isArray(hidden)&&hidden.length>0&&hidden.length<=7&&hidden.every(x=>/^leg[0-6]Far$/.test(x?.id)),'far walking chains only');
 need(Array.isArray(visible)&&visible.length>=7&&visible.every(x=>/^leg[0-6](Far|Near)$/.test(x?.id)),'visible walking chains');
 const ids=[...hidden,...visible].map(x=>x.id);need(ids.length===14&&new Set(ids).size===14&&Array.from({length:7},(_,i)=>'leg'+i+'Near').every(id=>visible.some(x=>x.id===id)),'seven biological pairs retained');
 for(const leg of hidden)need(Object.keys(leg).sort().join(',')==='decision,id,observation,occluder,occluderPolygonPx,ownerJoint,visibleRegions'&&leg.decision==='present-occluded'&&leg.occluder==='pereon'&&leg.ownerJoint==='pereon'+leg.id[3]&&leg.observation?.trim()&&polygon(leg.occluderPolygonPx)&&Array.isArray(leg.visibleRegions)&&leg.visibleRegions.length===0,'fully occluded far source chain');
 for(const leg of visible){
  const names=['Root','Knee','Foot'].map(s=>leg.id+s);
  need(Object.keys(leg).sort().join(',')==='id,landmarksPx,observation,regions'&&leg.observation?.trim()&&Object.keys(leg.landmarksPx??{}).sort().join(',')===names.sort().join(',')&&Object.values(leg.landmarksPx).every(point),'source-visible three-point chain');
  need(Array.isArray(leg.regions)&&leg.regions.length===2&&leg.regions.every(r=>Object.keys(r).sort().join(',')==='id,joint,layer,polygonPx'&&['Knee','Foot'].some(s=>r.joint===leg.id+s)&&r.layer===(leg.id.endsWith('Far')?'far':'near')&&polygon(r.polygonPx))&&new Set(leg.regions.map(r=>r.joint)).size===2,'whole visible two-span ownership');
 }
 return {schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],representation:{schema:'cf.source-representation/v1',reviewSha256:sha(JSON.stringify(review)),occludedWalkingLegs:hidden.map(x=>x.id)}};
}
function validateIsopodAuthor(author,review){
 need(author.family==='isopod','author isopod family');
 for(const leg of review.evidence.occludedWalkingLegs)for(const suffix of ['Root','Knee','Foot']){const j=leg.id+suffix;need(!(j in author.landmarksPx)&&!author.parts.some(p=>p.joint===j),'no invented occluded walking actuator');}
 for(const leg of review.evidence.visibleWalkingLegs){for(const[j,p]of Object.entries(leg.landmarksPx))need(JSON.stringify(author.landmarksPx[j])===JSON.stringify(p),'unchanged visible walking landmark '+j);for(const region of leg.regions)need(author.parts.some(p=>JSON.stringify(p)===JSON.stringify(region)),'every visible walking region retained');}
}
export function admitReviewedRepresentation({masterBytes,subjectBytes,promptBytes,review}){
 need(review?.schema==='cf.reviewed-source-representation/v1','explicit schema');
 for(const [key,bytes] of [['master',masterBytes],['subject',subjectBytes],['prompt',promptBytes]])need(review[key+'Sha256']===sha(bytes),'exact '+key+' hash');
 const subject=JSON.parse(subjectBytes),canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url))).filter(s=>s.name===review.name);
 need(canonical.length===1&&subject.name===review.name&&JSON.stringify(subject.species)===JSON.stringify(canonical[0]),'canonical subject');
 if(review.family==='isopod')return admitIsopodReview(review,subject);
 need(review.family==='quadruped'&&subject.family==='quadruped'&&canonical[0].posture==='quadruped','quadruped only');
 need(review.scope==='exact-master-only-no-visual-admission'&&['Full-original visual inspection','Measured compact-tail v1'].includes(review.review?.method)&&['Dakk','TheDakk','Codex','Claude'].includes(review.review.reviewer)&&review.review.observation?.trim(),'explicit visual review');
 const e=review.evidence;if(review.review.method==='Measured compact-tail v1')need(e?.compactTail&&!e.occludedEars,'measurement covers tail only');need(e&&Object.keys(e).every(k=>['dimensions','compactTail','occludedEars'].includes(k))&&JSON.stringify(e.dimensions)==='[1254,1254]','source evidence inventory');
 need(review.declarationSha256===sha(JSON.stringify(e)),'exact declaration hash');
 const representation={schema:'cf.source-representation/v1',reviewSha256:sha(JSON.stringify(review))};
 if(e.compactTail){const t=e.compactTail;need(Object.keys(t).every(k=>['terminal','visibility','observation','landmarksPx','regions'].includes(k))&&['tail1','tail2'].includes(t.terminal),'contiguous tail terminal');need(t.visibility==='entire-root-to-tip'&&t.observation?.trim(),'fully observed compact tail');const keys=Array.from({length:Number(t.terminal.slice(-1))+1},(_,i)=>'tail'+i);need(JSON.stringify(Object.keys(t.landmarksPx).sort())===JSON.stringify(keys)&&Object.values(t.landmarksPx).every(point),'observed root and terminal landmarks');need(keys.slice(1).every((k,i)=>Math.hypot(...t.landmarksPx[k].map((v,j)=>v-t.landmarksPx[keys[i]][j]))>=1.254),'distinct observed tail points');need(Array.isArray(t.regions)&&t.regions.length>0&&t.regions.every(r=>Object.keys(r).sort().join(',')==='joint,polygonPx'&&keys.includes(r.joint)&&polygon(r.polygonPx))&&keys.every(k=>t.regions.some(r=>r.joint===k)),'complete observed tail regions');representation.compactTail={terminal:t.terminal};}
 if(e.occludedEars){need(Array.isArray(e.occludedEars)&&e.occludedEars.length>0&&new Set(e.occludedEars.map(x=>x.side)).size===e.occludedEars.length,'unique occluded ear side');for(const ear of e.occludedEars){need(Object.keys(ear).every(k=>['side','decision','occluder','ownerJoint','observation','occluderPolygonPx','visibleRegions'].includes(k))&&['near','far'].includes(ear.side),'ear fields and side');need(ear.decision==='present-occluded'&&ear.occluder==='antler'&&ear.ownerJoint==='head'&&ear.observation?.trim(),'actual antler occlusion, co-moving head only');need(canonical[0].mustRead.some(x=>/antler/i.test(x)),'canonical antler evidence');need(polygon(ear.occluderPolygonPx)&&Array.isArray(ear.visibleRegions)&&ear.visibleRegions.every(polygon),'occluder and visible sliver evidence');}representation.occludedEars=e.occludedEars.map(x=>x.side);}
 need(representation.compactTail||representation.occludedEars,'nonempty decision');
 return {schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],representation};
}
/** Applied before coverage checks. Reviewed source polygons replace only the named anatomy.
 * Occluded ear pixels stay on the head owner with the antler; no hidden landmark is invented. */
export function applyReviewedRepresentation({parts,landmarksPx,review,remainderPart}){
 const e=review.evidence;let out=structuredClone(parts),lm=structuredClone(landmarksPx);const replace=new Set();
 if(review.family==='isopod'){for(const leg of e.occludedWalkingLegs)for(const suffix of ['Root','Knee','Foot'])replace.add(leg.id+suffix);need(!out.some(p=>p.id===remainderPart&&replace.has(p.joint)),'remainder cannot be replaced');out=out.filter(p=>!replace.has(p.joint));for(const j of replace)delete lm[j];return {parts:out,landmarksPx:lm};}
 if(e.compactTail)for(let i=0;i<4;i++)replace.add('tail'+i);
 for(const ear of e.occludedEars??[]){const side=ear.side==='near'?'Near':'Far';replace.add('ear'+side+'Root');replace.add('ear'+side+'Tip');}
 need(!out.some(p=>p.id===remainderPart&&replace.has(p.joint)),'remainder cannot be replaced');out=out.filter(p=>!replace.has(p.joint));for(const j of replace)delete lm[j];
 const added=[];if(e.compactTail){Object.assign(lm,e.compactTail.landmarksPx);e.compactTail.regions.forEach((r,i)=>added.push({id:'reviewed-tail-'+i,joint:r.joint,layer:'near',polygonPx:r.polygonPx}));}
 for(const ear of e.occludedEars??[]){need(lm.head,'observed head owner required');ear.visibleRegions.forEach((p,i)=>added.push({id:'reviewed-ear-'+ear.side+'-'+i,joint:'head',layer:ear.side,polygonPx:p}));}
 out=[...added,...out];need(new Set(out.map(p=>p.id)).size===out.length,'unique region ids');return {parts:out,landmarksPx:lm};
}
export function validateRepresentationAuthor(author,review){
 if(review.family==='isopod')return validateIsopodAuthor(author,review);
 const e=review.evidence;
 if(e.compactTail){for(const [j,p] of Object.entries(e.compactTail.landmarksPx))need(JSON.stringify(author.landmarksPx[j])===JSON.stringify(p),'unchanged observed landmark '+j);for(let i=Number(e.compactTail.terminal.slice(-1))+1;i<4;i++)need(!('tail'+i in author.landmarksPx)&&!author.parts.some(p=>p.joint==='tail'+i),'no unrepresented tail actuator');e.compactTail.regions.forEach((r,i)=>{const p=author.parts.find(p=>p.id==='reviewed-tail-'+i);need(p&&p.joint===r.joint&&JSON.stringify(p.polygonPx)===JSON.stringify(r.polygonPx),'exact tail region');});}
 for(const ear of e.occludedEars??[]){const side=ear.side==='near'?'Near':'Far';for(const j of ['ear'+side+'Root','ear'+side+'Tip'])need(!(j in author.landmarksPx)&&!author.parts.some(p=>p.joint===j),'no invented occluded ear actuator');ear.visibleRegions.forEach((r,i)=>{const p=author.parts.find(p=>p.id==='reviewed-ear-'+ear.side+'-'+i);need(p&&p.joint==='head'&&JSON.stringify(p.polygonPx)===JSON.stringify(r),'visible ear sliver retained');});}
}
export function validateRepresentationPixels(rgba,width,height,review,subject){
 need(width===1254&&height===1254&&rgba.length===width*height*4,'exact source dimensions');
 if(review.review.method==='Measured compact-tail v1'){const mask=Uint8Array.from({length:width*height},(_,i)=>rgba[i*4+3]>=128?1:0);need(JSON.stringify(measureCompactTail(mask,width,height,subject))===JSON.stringify(review.evidence.compactTail),'source measurement replay');}
 const on=p=>rgba[4*(Math.floor(p[1])*width+Math.floor(p[0]))+3]>0;
 if(review.family==='isopod'){for(const leg of review.evidence.visibleWalkingLegs)for(const p of Object.values(leg.landmarksPx))need(on(p),'visible walking landmark on source alpha');return;}
 for(const p of Object.values(review.evidence.compactTail?.landmarksPx??{}))need(on(p),'observed tail landmark on source alpha');
}
