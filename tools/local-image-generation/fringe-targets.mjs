import {erodeAlpha,pinkExcess} from './kit-contact-math.mjs';
const inBox=(x,y,b)=>x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1;
/** Intake-only conservative classification, not a species/material classifier.
 * Pale low-chroma paint and red-dominant dark umber are protected even when
 * min(red,blue)-green trips the historical keyer diagnostic. */
export function fringeColourClass(r,g,b,x,y,sheenRects=[]){
 if(sheenRects.some(box=>inBox(x,y,box)))return 'excludedSheen';
 const high=Math.max(r,g,b),low=Math.min(r,g,b);
 if(low>=120&&(high-low)/Math.max(1,high)<=.20)return 'excludedPale';
 if(high<=160&&r>b*1.5&&r>g)return 'excludedUmber';
 return pinkExcess(r,g,b)>8?'pinkBand':'notPink';
}
export function selectFringeTargets(rgba,w,h,{rectangles=[],sheenRects=[]}={}){
 if(rgba.length!==w*h*4)throw Error('Fringe selection shape');
 for(const b of [...rectangles,...sheenRects])if(![b.x0,b.x1,b.y0,b.y1].every(Number.isInteger)||b.x0<0||b.y0<0||b.x1>=w||b.y1>=h||b.x1<b.x0||b.y1<b.y0)throw Error('Fringe rectangle');
 const alpha=Uint8Array.from({length:w*h},(_,i)=>rgba[i*4+3]),interior=erodeAlpha(alpha,w,h,3);
 const split={pinkBand:[],excludedSheen:[],excludedPale:[],excludedUmber:[]},targets=[],perRectangle=rectangles.map(()=>0);
 for(let i=0;i<w*h;i++){
  const p=i*4;if(!alpha[i]||interior[i]||pinkExcess(rgba[p],rgba[p+1],rgba[p+2])<=8)continue;
  const x=i%w,y=Math.floor(i/w),kind=fringeColourClass(rgba[p],rgba[p+1],rgba[p+2],x,y,sheenRects);split[kind].push(i);
  if(kind!=='pinkBand')continue;
  const boxes=rectangles.map((b,k)=>inBox(x,y,b)?k:-1).filter(k=>k>=0);if(boxes.length){targets.push(i);for(const k of boxes)perRectangle[k]++;}
 }
 return {targets,split,counts:Object.fromEntries(Object.entries(split).map(([k,v])=>[k,v.length])),perRectangle};
}
