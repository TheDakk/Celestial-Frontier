/** Diagnostic placement of chest-labelled nape paint using the two observed torso bones. */
export function placeChestNape({labels,width,height,parts,landmarks}){
 const need=(x,m)=>{if(!x)throw Error('Chest nape: '+m);};
 need(labels.length===width*height,'raster shape');
 const owner=j=>{const rows=parts.map((p,i)=>({p,i})).filter(x=>x.p.joint===j);need(rows.length===1,'unique '+j+' owner');return rows[0].i+1;};
 const chest=owner('chest'),neck=owner('neck'),spine=landmarks.spine,c=landmarks.chest,n=landmarks.neck;
 need([spine,c,n].every(p=>p?.length===2&&p.every(Number.isFinite)),'finite observed joints');
 const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],l=x*x+y*y;need(l>1e-12,'nonzero bone');const t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/l));return(p[0]-a[0]-t*x)**2+(p[1]-a[1]-t*y)**2;};
 const output=Uint8Array.from(labels);let moved=0,chestPaint=0;
 for(let i=0;i<labels.length;i++)if(labels[i]===chest){chestPaint++;const p=[(i%width+.5)/width,(Math.floor(i/width)+.5)/height];if(p[1]<c[1]&&distance(p,c,n)<distance(p,spine,c)){output[i]=neck;moved++;}}
 need(moved>0&&moved<chestPaint,'nonempty preserved chest and repaired nape');
 return{labels:output,receipt:{schema:'cf.chest-nape-placement/v1',changedPixels:moved,chestPaint,movedShare:moved/chestPaint,sourceBones:{spine,chest:c,neck:n},nonChestChanges:0,rule:'Only chest-labelled paint above the chest joint and nearer the chest-to-neck segment than the spine-to-chest segment; other owners and source RGBA unchanged'}};
}
