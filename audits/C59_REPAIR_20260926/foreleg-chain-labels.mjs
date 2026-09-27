/** Separate existing near/far foreleg ink by the complete observed bone chains.
 * Distal cuts may steal neighbouring leg ink as well as the upper cut. Never
 * change torso/tail/hindleg owners, source pixels, landmarks, or rig limits. */
export function separateUpperForelegs({labels,width,height,parts,landmarks}) {
 const need=(ok,msg)=>{if(!ok)throw Error('Foreleg chains: '+msg);};need(labels.length===width*height,'dimensions');
 const chains=['Near','Far'].map(side=>['Root','Knee','Ankle','Paw'].map(s=>'fore'+side+s));
 const bones=chains.flatMap(chain=>chain.map((j,k)=>{
  const owners=parts.map((p,i)=>({p,i})).filter(({p})=>p.joint===j);need(owners.length===1,'unique limb owner');
  const a=landmarks[j],b=landmarks[chain[Math.min(k+1,3)]];need(a?.length===2&&b?.length===2,'joint geometry');
  return {joint:j,owner:owners[0].i+1,x:a[0]*width,y:a[1]*height,dx:(b[0]-a[0])*width,dy:(b[1]-a[1])*height};
 }));
 for(const b of bones)b.l2=b.dx*b.dx+b.dy*b.dy;
 const roots=[bones[0],bones[4]];need(roots.every(b=>b.l2>1),'upper limb geometry');
 const distance=(x,y,b)=>{const t=b.l2?Math.max(0,Math.min(1,((x-b.x)*b.dx+(y-b.y)*b.dy)/b.l2)):0;return (x-b.x-t*b.dx)**2+(y-b.y-t*b.dy)**2;};
 const owners=new Set(bones.map(b=>b.owner)),out=Uint8Array.from(labels),transfers={};
 for(let i=0;i<labels.length;i++){
  if(!owners.has(labels[i]))continue;const x=i%width+.5,y=Math.floor(i/width)+.5;
  if(roots.some(b=>(x-b.x)*b.dx+(y-b.y)*b.dy<0))continue;
  const from=bones.find(b=>b.owner===labels[i]);let best=from,d=distance(x,y,from);
  for(const b of bones){const q=distance(x,y,b);if(q+1e-8<d){best=b;d=q;}}
  if(best.owner!==labels[i]){out[i]=best.owner;const k=from.joint+'→'+best.joint;transfers[k]=(transfers[k]??0)+1;}
 }
 return {labels:out,receipt:{schema:'cf.foreleg-chain-partition/v1',method:'nearest existing foreleg-chain segment below both shoulders; only existing foreleg owners',changedPixels:Object.values(transfers).reduce((a,b)=>a+b,0),transfers,otherOwnersChanged:0}};
}
