/** Convert canonical backward-pointing bird-wing rotations into the authored
 * image plane. This changes coordinate basis, never clip timing or anatomy. */
export function poseProjectionSigns(record){
 if(record.projection===undefined)return {};
 if(record.projection==='source-pincers')return Object.fromEntries(pincerBasis(record).map(([j,angle])=>[j,angle<0?1:-1]));
 if(record.projection!=='frontal-wings'||record.template.id!=='biped-bird')throw Error('Pose projection: unsupported source view');
 const signs={};for(const side of['Near','Far']){const a=record.landmarks['wing'+side+'Root'],b=record.landmarks['wing'+side+'Tip'];if(!a||!b||Math.abs(b[0]-a[0])<.04)throw Error('Pose projection: wing has no lateral span');const sign=b[0]>a[0]?-1:1;signs['wing'+side+'Root']=sign;signs['wing'+side+'Tip']=sign;}
 if(signs.wingNearRoot===signs.wingFarRoot)throw Error('Pose projection: frontal wings must oppose');return signs;
}
export function projectTemplateLimits(template,record){const signs=poseProjectionSigns(record),project=limits=>Object.fromEntries(Object.entries(limits).map(([j,l])=>[j,signs[j]===-1?{min:-l.max,max:-l.min}:l]));return {...template,limitsDeg:project(template.limitsDeg),...(template.contactLimitsDeg?{contactLimitsDeg:project(template.contactLimitsDeg)}:{})};}

/** Normalized pincer closure uses the actual painted gape, not a fixed degree
 * swing that can drive a thin finger through its opposing fixed finger. */
function pincerBasis(record){
 if(record.template.id!=='brachyuran')throw Error('Pose projection: pincer source family');
 return ['Far','Near'].map(side=>{
  const prefix='claw'+side,p=record.landmarks[prefix+'Palm'],f=record.landmarks[prefix+'FixedTip'],d=record.landmarks[prefix+'DactylTip'];
  if(!p||!f||!d||[...p,...f,...d].some(v=>!Number.isFinite(v)))throw Error('Pose projection: missing pincer geometry');
  const fx=f[0]-p[0],fy=f[1]-p[1],dx=d[0]-p[0],dy=d[1]-p[1],angle=Math.atan2(dx*fy-dy*fx,dx*fx+dy*fy)*180/Math.PI;
  if(Math.hypot(fx,fy)<1e-6||Math.hypot(dx,dy)<1e-6||Math.abs(angle)<1e-4||Math.abs(angle)>35)throw Error('Pose projection: unsupported painted gape');
  return [prefix+'DactylRoot',angle];
 });
}
export function poseProjectionScales(record){return record.projection==='source-pincers'?Object.fromEntries(pincerBasis(record).map(([j,angle])=>[j,Math.abs(angle)/25])):{};}
