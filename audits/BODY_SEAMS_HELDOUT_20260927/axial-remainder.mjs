/** Diagnostic author repair: place only root remainder along an observed fish axis. */
export function placeAxialRemainder({rgba,labels,width,height,record,parts,remainder}){
 const need=(ok,msg)=>{if(!ok)throw Error('Axial remainder: '+msg);};
 need(record.template.id==='fish','fish source required');
 need(Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&labels.length===width*height&&rgba.length===labels.length*4,'raster shape');
 const owner=j=>{const found=parts.map((p,i)=>({p,i})).filter(x=>x.p.joint===j);need(found.length===1,'unique owner '+j);return found[0].i+1;};
 need(owner('root')===remainder,'root remainder identity');
 const points=['root',...Array.from({length:6},(_,i)=>'spine'+i)].map(j=>record.landmarks[j]);
 need(points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)),'complete finite axis');
 need(points.every((p,i)=>!i||p[0]<points[i-1][0]),'right-facing monotone axis');
 const bones=points.slice(1).map((p,i)=>({a:points[i],b:p,owner:owner('spine'+i)}));
 const distance=(x,y,{a,b})=>{const vx=b[0]-a[0],vy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));return(x-a[0]-t*vx)**2+(y-a[1]-t*vy)**2;};
 let anchor=-1,best=Infinity;
 for(let i=0;i<labels.length;i++)if(labels[i]===remainder&&rgba[i*4+3]){const d=((i%width+.5)/width-points[0][0])**2+((Math.floor(i/width)+.5)/height-points[0][1])**2;if(d<best){best=d;anchor=i;}}
 need(anchor>=0,'visible root remainder');
 const output=Uint8Array.from(labels),ax=anchor%width,ay=Math.floor(anchor/width);let moved=0,protectedOwners=0;const counts={};
 for(let i=0;i<labels.length;i++){
  if(labels[i]!==remainder){protectedOwners++;continue;}
  if(!rgba[i*4+3])continue;
  const px=i%width,py=Math.floor(i/width),x=(px+.5)/width,y=(py+.5)/height;
  if(x>=points[0][0]||x<points.at(-1)[0]||Math.abs(px-ax)<=8&&Math.abs(py-ay)<=8)continue;
  let selected=bones[0],min=Infinity;for(const bone of bones){const d=distance(x,y,bone);if(d<min){min=d;selected=bone;}}
  output[i]=selected.owner;moved++;counts[selected.owner]=(counts[selected.owner]??0)+1;
 }
 need(moved>0,'no axial remainder repair');
 return{labels:output,receipt:{moved,protectedOwners,counts,anchor:[ax,ay],rootAnchorRadiusPx:8,originalRgbaChanged:false,nonRemainderChanges:0,axis:points,scope:'Diagnostic placement, not anatomy or visual admission'}};
}
