/** Deterministic cut-out/compositor/mask operations. No inference or source edits. */
export function erodeAlpha(alpha,w,h,r=1){
  if(alpha.length!==w*h||!Number.isInteger(r)||r<0||r>32)throw Error('Alpha erosion shape');
  const a=new Uint8Array(alpha.length),out=new Uint8Array(alpha.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=255;for(let k=-r;k<=r;k++)v=Math.min(v,x+k<0||x+k>=w?0:alpha[y*w+x+k]);a[y*w+x]=v;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=255;for(let k=-r;k<=r;k++)v=Math.min(v,y+k<0||y+k>=h?0:a[(y+k)*w+x]);out[y*w+x]=v;}
  return out;
}
export const pinkExcess=(r,g,b)=>Math.max(0,Math.min(r,b)-g);
export function alphaBounds(alpha,w,h){
  let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(alpha[y*w+x]>16){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  if(!x1||!y1)throw Error('Empty alpha');return {x:x0,y:y0,width:x1-x0,height:y1-y0};
}
export function keyAndDespill(rgba,w,h,{terrainLayer=false}={}){
  if(rgba.length!==w*h*4)throw Error('Cutout byte shape');
  const original=new Uint8Array(w*h);let before=0;
  for(let i=0;i<original.length;i++){const [r,g,b]=rgba.subarray(i*4,i*4+3);original[i]=r>150&&b>150&&pinkExcess(r,g,b)>85?0:255;before+=original[i]>0;}
  if(terrainLayer&&original.subarray(0,w).filter(a=>a===0).length<w*.95)throw Error('Terrain requires a keyed upper field');
  const alpha=erodeAlpha(original,w,h,1),interior=erodeAlpha(alpha,w,h,3),out=new Uint8ClampedArray(rgba);let after=0,despilled=0,unresolved=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,p=i*4;out[p+3]=alpha[i];if(!alpha[i])continue;after++;
    const excess=pinkExcess(out[p],out[p+1],out[p+2]);if(interior[i]||excess<=8)continue;
    let nearest=null,distance=Infinity;
    for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){
      const nx=x+dx,ny=y+dy,d=dx*dx+dy*dy;if(nx<0||nx>=w||ny<0||ny>=h||d>=distance)continue;
      const j=ny*w+nx,q=j*4;if(interior[j]&&pinkExcess(rgba[q],rgba[q+1],rgba[q+2])<=8){nearest=q;distance=d;}
    }
    if(nearest===null){unresolved++;continue;}
    // Sample the specimen's clean inward neighbour, never an invented grey edge.
    const weight=Math.min(1,excess/24);
    for(let c=0;c<3;c++)out[p+c]=Math.round(out[p+c]*(1-weight)+rgba[nearest+c]*weight);
    despilled++;
  }
  const bounds=alphaBounds(alpha,w,h);
  if(!terrainLayer&&(bounds.width>w*.98||bounds.height>h*.98))throw Error('Cutout isolation lost');
  return {rgba:out,alpha,bounds,receipt:{erodedPixels:before-after,despilledPixels:despilled,unresolvedEdgePixels:unresolved}};
}
/** Premultiplied bilinear sampling prevents invisible magenta bleeding during scale. */
export function compositeLayer(base,W,H,source,sw,sh,bounds,box,flip=false){
  if(base.length!==W*H*4||source.length!==sw*sh*4)throw Error('Compositor byte shape');
  const alpha=new Uint8Array(W*H);
  for(let y=Math.max(0,Math.floor(box.y));y<Math.min(H,Math.ceil(box.y+box.height));y++)for(let x=Math.max(0,Math.floor(box.x));x<Math.min(W,Math.ceil(box.x+box.width));x++){
    let u=(x+.5-box.x)/box.width;if(flip)u=1-u;
    const sx=bounds.x+u*bounds.width-.5,sy=bounds.y+(y+.5-box.y)/box.height*bounds.height-.5,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
    let a=0;const rgb=[0,0,0];
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
      const xx=ix+dx,yy=iy+dy;if(xx<0||xx>=sw||yy<0||yy>=sh)continue;
      const p=(yy*sw+xx)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy)*source[p+3]/255;a+=weight;
      for(let c=0;c<3;c++)rgb[c]+=source[p+c]*weight;
    }
    const i=y*W+x,p=i*4;alpha[i]=Math.round(a*255);
    for(let c=0;c<3;c++)base[p+c]=Math.round(rgb[c]+base[p+c]*(1-a));base[p+3]=255;
  }
  return alpha;
}
export function subtractOcclusion(masks,alpha){for(const mask of masks)for(let i=0;i<mask.length;i++)mask[i]=Math.round(mask[i]*(1-alpha[i]/255));}
export function latentInteriorMask(masks,w,h,erosionPixels=4){
  if(w%16||h%16||!masks.length||masks.some(m=>m.length!==w*h))throw Error('Interior mask shape');
  const union=new Uint8Array(w*h);for(const mask of masks)for(let i=0;i<union.length;i++)union[i]=Math.max(union[i],mask[i]);
  const inner=erodeAlpha(union,w,h,erosionPixels),latent=new Float32Array(w*h/256);
  for(let y=0;y<h/16;y++)for(let x=0;x<w/16;x++){
    let sum=0;for(let dy=0;dy<16;dy++)for(let dx=0;dx<16;dx++)sum+=inner[(y*16+dy)*w+x*16+dx];
    latent[y*(w/16)+x]=sum/(256*255)>=.55?1:0;
  }
  if(!latent.some(v=>v===1)||latent.every(v=>v===1))throw Error('Empty or full protected latent mask');
  return {latent,inner,protectedTokens:latent.reduce((a,b)=>a+b,0)};
}
/** Compose one organism, optionally as two low runner instances of the same master. */
export function compositeOrganism(base,W,H,keyed,sw,sh,placement,boxFor){
  const placements=placement.mat??placement.runners??[placement],alpha=new Uint8Array(W*H),instances=[];
  for(const p of placements){
    const box=boxFor(p,keyed.bounds,W,H);
    if(p.heightScale!==undefined){const oldHeight=box.height;box.height*=p.heightScale;box.y+=oldHeight-box.height;}
    const layer=compositeLayer(base,W,H,keyed.rgba,sw,sh,keyed.bounds,box,p.flip);
    for(let i=0;i<alpha.length;i++)alpha[i]=Math.round(255-(255-alpha[i])*(1-layer[i]/255));
    instances.push(box);
  }
  const x=Math.min(...instances.map(b=>b.x)),y=Math.min(...instances.map(b=>b.y));
  return {alpha,box:{x,y,width:Math.max(...instances.map(b=>b.x+b.width))-x,height:Math.max(...instances.map(b=>b.y+b.height))-y},instances};
}
/** Next-sigma original latent follows the same sampled-noise trajectory. */
export function protectLatents(predicted,original,noise,mask,nextSigma){
  if(predicted.length!==original.length||noise.length!==original.length||mask.length*128!==original.length)throw Error('Protected latent shape');
  const out=predicted.slice();
  for(let i=0;i<out.length;i++){const m=mask[Math.floor(i/128)];if(m<0||m>1)throw Error('Protected weight');out[i]=(1-m)*out[i]+m*((1-nextSigma)*original[i]+nextSigma*noise[i]);}
  return out;
}
export function alphaToRgba(alpha){const out=new Uint8ClampedArray(alpha.length*4);for(let i=0;i<alpha.length;i++){out[i*4]=out[i*4+1]=out[i*4+2]=alpha[i];out[i*4+3]=255;}return out;}
