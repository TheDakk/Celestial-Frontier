/** Automatic ownership correction within the two upper foreleg surfaces only.
 * Use the existing rig segment geometry; preserve every original paint byte,
 * all other owners, and pixels proximal to either shoulder. No new landmark. */
export function separateUpperForelegs({labels, width, height, parts, landmarks}) {
  const need=(ok,msg)=>{if(!ok)throw Error('Foreleg partition: '+msg);};
  need(labels.length===width*height,'dimensions');
  const joints=['foreNearRoot','foreFarRoot'], ends=['foreNearKnee','foreFarKnee'];
  const owners=joints.map(j=>{const rows=parts.map((p,i)=>({p,i})).filter(({p})=>p.joint===j);need(rows.length===1,'unique upper foreleg owner');return rows[0].i+1;});
  const bones=joints.map((j,i)=>{const a=landmarks[j],b=landmarks[ends[i]];need(a?.length===2&&b?.length===2,'joint geometry');const x=a[0]*width,y=a[1]*height,dx=(b[0]-a[0])*width,dy=(b[1]-a[1])*height,l2=dx*dx+dy*dy;need(l2>1,'nonzero limb');return {x,y,dx,dy,l2};});
  const out=Uint8Array.from(labels),counts=[0,0];
  const distance=(x,y,b)=>{const t=((x-b.x)*b.dx+(y-b.y)*b.dy)/b.l2,q=Math.max(0,Math.min(1,t));return {t,d2:(x-b.x-q*b.dx)**2+(y-b.y-q*b.dy)**2};};
  for(let i=0;i<labels.length;i++){
    const from=owners.indexOf(labels[i]);if(from<0)continue;
    const x=i%width+.5,y=Math.floor(i/width)+.5,d=bones.map(b=>distance(x,y,b));
    if(d.some(v=>v.t<0))continue;
    const to=1-from;if(d[to].d2+1e-8<d[from].d2){out[i]=owners[to];counts[from]++;}
  }
  return {labels:out,receipt:{schema:'cf.upper-foreleg-partition/v1',method:'nearest observed upper-foreleg segment below both shoulders; only existing two upper owners',owners,joints,changedPixels:counts.reduce((a,b)=>a+b,0),nearToFar:counts[0],farToNear:counts[1],otherOwnersChanged:0}};
}
