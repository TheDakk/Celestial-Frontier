/** Declared, present but unpainted anatomy. Never infer presence from missing data.
 * First supported class: the final brachyuran walking pair. */
const need=(ok,message)=>{if(!ok)throw Error('Hidden anatomy: '+message);};
export function resolveHiddenPresence(template,anatomy){
 if(anatomy?.hidden===undefined)return template;
 need(anatomy.schema==='cf.anatomy-presence/v2'&&Array.isArray(anatomy.hidden),'v2 hidden list required');
 const hidden=anatomy.hidden;
 need(new Set(hidden).size===hidden.length,'duplicate declaration');
 need(hidden.every(id=>template.id==='brachyuran'&&['leg3Far','leg3Near'].includes(id)),'unsupported hidden chain');
 need(hidden.every(id=>!anatomy.absent.includes(id)),'hidden is not absent');
 if(!hidden.length)return template;
 const hiddenJoints=hidden.flatMap(id=>['Root','Knee','Foot'].map(j=>id+j));
 need(hiddenJoints.every(j=>template.joints.includes(j)),'hidden joint inventory');
 return Object.freeze({...template,hiddenChains:Object.freeze([...hidden]),hiddenJoints:Object.freeze(hiddenJoints)});
}
/** Explicit offline inference only; no admission-time filling of missing joints.
 * Mirror pair 2 about the template body axis through the extrapolated pair-3 root.
 * Root spacing is pair2 - pair1; upper/lower rest lengths stay 1:1 with pair2.
 * The complete result remains subject to ordinary normalized/bone bounds. */
export function inferHiddenLandmarks(template,landmarks){
 const result=structuredClone(landmarks);
 if(!template.hiddenChains?.length)return result;
 const a=landmarks[template.bodyAxis[0]],b=landmarks[template.bodyAxis[1]];
 need(a&&b,'body axis required');const length=Math.hypot(b[0]-a[0],b[1]-a[1]);need(length>1e-6,'body axis degenerate');
 const u=[(b[0]-a[0])/length,(b[1]-a[1])/length];
 for(const id of template.hiddenChains){
  const side=id.slice(4),prior='leg2'+side,previous='leg1'+side,r=landmarks[prior+'Root'],p=landmarks[previous+'Root'];
  need(r&&p&&landmarks[prior+'Knee']&&landmarks[prior+'Foot'],'visible pair 1 and 2 required');
  const root=[2*r[0]-p[0],2*r[1]-p[1]];result[id+'Root']=root;
  for(const joint of ['Knee','Foot']){const v=landmarks[prior+joint].map((n,i)=>n-r[i]),dot=v[0]*u[0]+v[1]*u[1];result[id+joint]=v.map((n,i)=>root[i]+2*dot*u[i]-n);}
 }
 return result;
}
export function checkHiddenLandmarks(template,landmarks){
 if(!template.hiddenJoints?.length)return;
 const expected=inferHiddenLandmarks(template,landmarks);
 for(const j of template.hiddenJoints)need(Array.isArray(landmarks[j])&&landmarks[j].length===2&&landmarks[j].every((v,i)=>Math.abs(v-expected[j][i])<=1e-12),'declared inference differs: '+j);
}
/** The intake/loader call this before admitting part ownership. Hidden parts are
 * represented by no part/atlas entry, not a nonempty transparent placeholder. */
export function requireVisiblePaintOwner(template,joint){
 need(!template.hiddenJoints?.includes(joint),'paint assigned to hidden joint '+joint);
}
