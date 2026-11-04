/** Read-only support bound for a rigid, ancestor-attached descendant-ink band.
 * The complete descendant image is a superset of every permitted band. If even
 * its conservative sampling footprint has no ink, changing band depth cannot
 * cover this target. Positive support is NOT proof of adequate band coverage. */
export function rigidUnderlapSupport({width,height,cutout,rgba,ancestorMatrix,target}) {
 const need=(ok,why)=>{if(!ok)throw Error('Underlap support: '+why);};
 need([width,height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=8192),'canvas');
 need(cutout&&['x','y','width','height'].every(k=>Number.isSafeInteger(cutout[k]))
  &&cutout.x>=0&&cutout.y>=0&&cutout.width>0&&cutout.height>0
  &&cutout.x+cutout.width<=width&&cutout.y+cutout.height<=height,'cutout');
 need(rgba instanceof Uint8Array&&rgba.length===cutout.width*cutout.height*4,'pixels');
 need(Array.isArray(target)&&target.length===2&&target.every(Number.isSafeInteger)
  &&target[0]>=0&&target[0]<width&&target[1]>=0&&target[1]<height,'target');
 need(Array.isArray(ancestorMatrix)&&ancestorMatrix.length===6&&ancestorMatrix.every(Number.isFinite),'matrix');
 const [a,b,c,d,tx,ty]=ancestorMatrix,det=a*d-b*c;
 need(Math.abs(det)>1e-12,'singular matrix');
 const pxB=b*height/width,pxC=c*width/height;
 need(Math.abs(a*a+pxB*pxB-1)<1e-9&&Math.abs(pxC*pxC+d*d-1)<1e-9
  &&Math.abs(a*pxC+pxB*d)<1e-9,'native-size rigid transform required; no scale/MIP assumption');
 const x=(target[0]+.5)/width-tx,y=(target[1]+.5)/height-ty;
 const source=[(d*x-c*y)/det*width,(-b*x+a*y)/det*height];
 need(source.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6),'unbounded inverse');
 const sx=Math.floor(source[0]),sy=Math.floor(source[1]),samples=[];
 // Nearest and bilinear samples at native 1:1 extraction fit within this 3x3
 // envelope, including either rounding direction. This is not a minified/MIP bound.
 for(let yy=sy-1;yy<=sy+1;yy++)for(let xx=sx-1;xx<=sx+1;xx++){
  const cx=xx-cutout.x,cy=yy-cutout.y;
  samples.push({x:xx,y:yy,alpha:cx<0||cy<0||cx>=cutout.width||cy>=cutout.height?0:rgba[(cy*cutout.width+cx)*4+3]});
 }
 const maximumAlpha=Math.max(...samples.map(p=>p.alpha));
 return {target,source,samples,maximumAlpha,
  status:maximumAlpha===0?'NO_SOURCE_INK':'SOURCE_INK_POSSIBLE',
  scope:'Rigid ancestor transform, complete descendant source, native-size nearest/linear sampling; possible support does not prove closure'};
}
