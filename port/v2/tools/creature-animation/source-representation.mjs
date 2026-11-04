/** Explicit source representation, distinct from biological absence. No inferred exemptions. */
const need=(ok,m)=>{if(!ok)throw Error('Source representation: '+m);};
export function representationRemoved(template,anatomy){
 const r=anatomy?.representation;if(r===undefined)return [];
 if(template.id==='isopod'){
  need(anatomy.schema==='cf.anatomy-presence/v2'&&r&&r.schema==='cf.source-representation/v1'&&/^[a-f0-9]{64}$/.test(r.reviewSha256),'isopod reviewed v2 representation');
  need(Object.keys(r).length===3&&Object.keys(r).every(k=>['schema','reviewSha256','occludedWalkingLegs'].includes(k)),'isopod exact representation');
  const ids=r.occludedWalkingLegs;
  need(Array.isArray(ids)&&ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>/^leg[0-6]Far$/.test(id)&&template.legs.includes(id)),'only existing far walking chains may be occluded');
  need(ids.every(id=>!anatomy.absent.includes(id)&&!(anatomy.hidden??[]).includes(id)&&!(anatomy.folded??[]).includes(id)),'occluded is not absent hidden or folded');
  return ids.flatMap(id=>['Root','Knee','Foot'].map(j=>id+j));
 }
 need(anatomy.schema==='cf.anatomy-presence/v2'&&template.id==='quadruped','quadruped v2 only');
 need(r&&Object.keys(r).every(k=>['schema','reviewSha256','compactTail','occludedEars'].includes(k))&&r.schema==='cf.source-representation/v1'&&/^[a-f0-9]{64}$/.test(r.reviewSha256),'exact reviewed representation');
 const removed=[];
 if(r.compactTail!==undefined){need(r.compactTail&&Object.keys(r.compactTail).length===1&&['tail1','tail2'].includes(r.compactTail.terminal),'contiguous tail terminal');need(!anatomy.absent.includes('tail'),'compact is not absent');const end=Number(r.compactTail.terminal.slice(-1));for(let i=end+1;i<=3;i++)removed.push('tail'+i);}
 if(r.occludedEars!==undefined){need(Array.isArray(r.occludedEars)&&r.occludedEars.length>0&&new Set(r.occludedEars).size===r.occludedEars.length&&r.occludedEars.every(s=>['near','far'].includes(s)),'explicit ear side');need(!anatomy.absent.includes('external-ears'),'occluded is not absent');for(const side of r.occludedEars){const n=side==='near'?'Near':'Far';removed.push('ear'+n+'Root','ear'+n+'Tip');}}
 need(removed.length>0,'nonempty representation');need(!(anatomy.hidden??[]).some(j=>removed.includes(j))&&!(anatomy.folded??[]).some(j=>removed.includes(j)),'disjoint declarations');return removed;
}
/** Preserve distal authored angular contribution at the actual observed terminal. Ordinary limits still apply. */
export function representedPose(joints,anatomy){
 const t=anatomy?.representation?.compactTail?.terminal;if(!t)return joints;
 need(['tail1','tail2'].includes(t),'contiguous tail terminal');const out={...joints};for(let i=Number(t.slice(-1))+1;i<=3;i++){out[t]=(out[t]??0)+(out['tail'+i]??0);delete out['tail'+i];}return out;
}
