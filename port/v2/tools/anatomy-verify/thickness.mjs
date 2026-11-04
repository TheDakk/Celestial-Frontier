/** Track T1 slice 5 — exact Euclidean distance transform (Felzenszwalb–Huttenlocher, separable) on the working
 * mask, giving every solid pixel its distance to the background. Tip thickness = the largest DT value within one
 * window radius behind a tip; a merged tip (two limbs planted on one point) reads about twice a single limb's
 * thickness for that subject. Body thickness = the DT maximum. Deterministic float work. */
export function distanceTransform(mask,W,H){
  const INF=1e20,f=new Float64Array(Math.max(W,H)),d=new Float64Array(Math.max(W,H)),v=new Int32Array(Math.max(W,H)),z=new Float64Array(Math.max(W,H)+1);
  const dt1=(n)=>{let k=0;v[0]=0;z[0]=-INF;z[1]=INF;for(let q=1;q<n;q++){let s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);while(s<=z[k]){k--;s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);}k++;v[k]=q;z[k]=s;z[k+1]=INF;}k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])*(q-v[k])+f[v[k]];}};
  const out=new Float64Array(W*H);
  for(let x=0;x<W;x++){for(let y=0;y<H;y++)f[y]=mask[y*W+x]?INF:0;dt1(H);for(let y=0;y<H;y++)out[y*W+x]=d[y];}
  for(let y=0;y<H;y++){for(let x=0;x<W;x++)f[x]=out[y*W+x];dt1(W);for(let x=0;x<W;x++)out[y*W+x]=Math.sqrt(d[x]);}
  return out;
}
/** Thickness behind each tip: max DT within radius r of the point r back along the tip's inward direction. */
export function tipThickness(dt,W,H,tip,r){
  const cx=Math.round(tip.x-tip.dir.x*r),cy=Math.round(tip.y-tip.dir.y*r);let best=0;
  for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<0||y<0||x>=W||y>=H)continue;if(dt[y*W+x]>best)best=dt[y*W+x];}
  return best;
}
