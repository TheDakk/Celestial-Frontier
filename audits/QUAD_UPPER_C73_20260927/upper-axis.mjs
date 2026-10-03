/** Diagnostic upper chest/neck ownership only. No face, limb, tail or source-pixel edit. */
export function placeUpperAxis({labels,width,height,parts,landmarks}){
 const need=(x,m)=>{if(!x)throw Error('Upper axis: '+m);};
 need(labels.length===width*height,'raster shape');
 const joints=['spine','chest','neck','head'],points=['pelvis',...joints].map(j=>landmarks[j]);
 need(points.every(p=>p?.length===2&&p.every(Number.isFinite)),'finite axis');
 need(points.every((p,i)=>!i||p[0]>points[i-1][0]),'rightward axis');
 const ids=joints.map(j=>{const all=parts.map((p,i)=>({p,i})).filter(x=>x.p.joint===j);need(all.length===1,'unique '+j);return all[0].i+1;});
 const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],l=x*x+y*y;need(l>1e-12,'nonzero bone');const t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/l));return(p[0]-a[0]-t*x)**2+(p[1]-a[1]-t*y)**2;};
 const output=Uint8Array.from(labels),changes={};let moved=0;
 for(let i=0;i<labels.length;i++)if(labels[i]===ids[1]||labels[i]===ids[2]){
  const p=[(i%width+.5)/width,(Math.floor(i/width)+.5)/height];if(p[1]>=landmarks.chest[1])continue;
  const ds=ids.map((_,j)=>distance(p,points[j],points[j+1])),j=ds.indexOf(Math.min(...ds));
  if(ids[j]!==labels[i]){output[i]=ids[j];moved++;const key=parts[labels[i]-1].id+'->'+parts[ids[j]-1].id;changes[key]=(changes[key]??0)+1;}
 }
 for(const id of ids)need(output.some(x=>x===id),'preserved '+parts[id-1].id);
 need(moved>0,'nonempty correction');
 return{labels:output,receipt:{schema:'cf.upper-axis-placement/v1',moved,changes,sourceJoints:points,conservation:'Only chest/neck-labelled paint above chest; source RGBA, landmarks, face/limbs/tail and other owners unchanged',status:'DIAGNOSTIC_NOT_ACCEPTED'}};
}
