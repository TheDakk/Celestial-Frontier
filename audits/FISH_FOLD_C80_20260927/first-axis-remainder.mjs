/** Explicit first-spine remainder variant. The source has a separate root owner;
 * only its spine0 remainder can be placed on the existing downstream spine. */
export function placeFirstAxisRemainder({rgba,labels,width,height,record,parts,remainder}){
 const need=(ok,msg)=>{if(!ok)throw Error('First-axis remainder: '+msg);};
 need(record.template.id==='fish','fish source required');
 need(Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&labels.length===width*height&&rgba.length===labels.length*4,'raster shape');
 const owner=j=>{const found=parts.map((p,i)=>({p,i})).filter(x=>x.p.joint===j);need(found.length===1,'unique owner '+j);return found[0].i+1;};
 need(owner('spine0')===remainder,'first-spine remainder identity');const root=owner('root');need(root!==remainder&&labels.some((n,i)=>n===root&&rgba[i*4+3]),'separate painted root owner');
 const points=['root',...Array.from({length:6},(_,i)=>'spine'+i)].map(j=>record.landmarks[j]);
 need(points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)),'complete finite axis');need(points.every((p,i)=>!i||p[0]<points[i-1][0]),'right-facing monotone axis');
 const bones=points.slice(1).map((p,i)=>({a:points[i],b:p,owner:owner('spine'+i)}));
 const distance=(x,y,{a,b})=>{const vx=b[0]-a[0],vy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));return(x-a[0]-t*vx)**2+(y-a[1]-t*vy)**2;};
 const output=Uint8Array.from(labels),counts={};let moved=0;
 for(let i=0;i<labels.length;i++){if(labels[i]!==remainder||!rgba[i*4+3])continue;const x=(i%width+.5)/width,y=(Math.floor(i/width)+.5)/height;if(x>=points[0][0]||x<points.at(-1)[0])continue;let selected=bones[0],min=Infinity;for(const bone of bones){const d=distance(x,y,bone);if(d<min){min=d;selected=bone;}}if(selected.owner!==remainder){output[i]=selected.owner;moved++;counts[selected.owner]=(counts[selected.owner]??0)+1;}}
 need(moved>0,'no first-axis remainder repair');return{labels:output,receipt:{moved,counts,separateRootOwner:root,originalRgbaChanged:false,nonRemainderChanges:0,axis:points,scope:'First-spine placement diagnostic; original root and all foreign ownership protected'}};
}
