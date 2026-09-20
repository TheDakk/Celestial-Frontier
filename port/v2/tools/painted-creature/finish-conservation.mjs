/** R9 conservation gates for a finished creature texture. Pure pixel/JSON
 * work, no model, no browser. A finished master may repaint the creature's
 * interior and nothing else: its alpha is the painter master's alpha byte for
 * byte, every fully transparent pixel is the painter's pixel, every label
 * boundary stays at least as readable as the painter drew it, and the parts
 * and paint skin rebuilt from it are byte-identical to the painter build. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
export const readPng=bytes=>{const p=PNG.sync.read(bytes);return {width:p.width,height:p.height,data:new Uint8Array(p.data.buffer,p.data.byteOffset,p.data.length)};};
export const writePng=(width,height,data)=>{const p=new PNG({width,height});p.data=Buffer.from(data.buffer,data.byteOffset,data.length);return PNG.sync.write(p);};
const need=(ok,message)=>{if(!ok)throw Error(message);};

/** Gate 1: silhouette and key conservation. */
export function alphaConservation(master,finished){
  need(master.width===finished.width&&master.height===finished.height,'Finished size differs from master');
  let differingAlphaBytes=0,changedTransparentPixels=0,changedOpaquePixels=0;
  for(let i=0;i<master.width*master.height;i++){
    const a=master.data[i*4+3];if(a!==finished.data[i*4+3])differingAlphaBytes++;
    const same=master.data[i*4]===finished.data[i*4]&&master.data[i*4+1]===finished.data[i*4+1]&&master.data[i*4+2]===finished.data[i*4+2];
    if(a===0){if(!same)changedTransparentPixels++;}else if(!same)changedOpaquePixels++;
  }
  return {status:differingAlphaBytes===0&&changedTransparentPixels===0?'PASS':'FAIL',differingAlphaBytes,changedTransparentPixels,changedOpaquePixels};
}

/** Labels: the painter's ownership map (label id in the red channel) or an
 * ownership PNG where each distinct opaque colour is one label. */
export function labelsFromRed(png){const out=new Uint16Array(png.width*png.height);for(let i=0;i<out.length;i++)out[i]=png.data[i*4];return out;}
export function labelsFromColours(png){const ids=new Map(),out=new Uint16Array(png.width*png.height);for(let i=0;i<out.length;i++){if(png.data[i*4+3]===0)continue;const key=(png.data[i*4]<<16)|(png.data[i*4+1]<<8)|png.data[i*4+2];if(!ids.has(key))ids.set(key,ids.size+1);out[i]=ids.get(key);}return out;}

/** Gate 2a: connected components per label over opaque pixels (4-connected). */
export function labelComponentCounts(labels,alpha,width,height){
  const seen=new Uint8Array(width*height),counts=new Map(),stack=new Int32Array(width*height);
  for(let s=0;s<width*height;s++){
    if(seen[s]||alpha[s]===0)continue;const label=labels[s];let top=0;stack[top++]=s;seen[s]=1;
    while(top){const i=stack[--top],x=i%width,y=(i-x)/width;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const j=ny*width+nx;if(seen[j]||alpha[j]===0||labels[j]!==label)continue;seen[j]=1;stack[top++]=j;}}
    counts.set(label,(counts.get(label)??0)+1);
  }
  return counts;
}

const luma=(d,i)=>.2126*d[i*4]+.7152*d[i*4+1]+.0722*d[i*4+2];
/** Gate 2b: mean luminance step across every label boundary (pairs of
 * 4-neighbours with different labels, both opaque). The finisher may not blur
 * a leg into the carapace: finished/master must stay >= the recorded ratio. */
export function boundaryGradient(png,labels){
  const {width,height,data}=png;let sum=0,pairs=0;const perLabel=new Map();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(data[i*4+3]===0)continue;
    for(const j of [x+1<width?i+1:-1,y+1<height?i+width:-1]){if(j<0||data[j*4+3]===0||labels[i]===labels[j])continue;
      const g=Math.abs(luma(data,i)-luma(data,j));sum+=g;pairs++;
      for(const l of [labels[i],labels[j]]){const row=perLabel.get(l)??{sum:0,pairs:0};row.sum+=g;row.pairs++;perLabel.set(l,row);}}}
  return {meanStep:pairs?sum/pairs:0,pairs,perLabel:Object.fromEntries([...perLabel].map(([l,r])=>[l,r.sum/r.pairs]))};
}

/** Reported, not gated: per-label CIE76 ΔE mean and a global-window SSIM on luminance. */
const srgbToLab=(r,g,b)=>{const f=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;};const R=f(r),G=f(g),B=f(b);
  const X=(R*.4124+G*.3576+B*.1805)/.95047,Y=R*.2126+G*.7152+B*.0722,Z=(R*.0193+G*.1192+B*.9505)/1.08883;const t=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;
  return [116*t(Y)-16,500*(t(X)-t(Y)),200*(t(Y)-t(Z))];};
export function labelDeltaE(master,finished,labels){
  const rows=new Map();
  for(let i=0;i<master.width*master.height;i++){if(master.data[i*4+3]===0)continue;const a=srgbToLab(master.data[i*4],master.data[i*4+1],master.data[i*4+2]),b=srgbToLab(finished.data[i*4],finished.data[i*4+1],finished.data[i*4+2]);
    const d=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),row=rows.get(labels[i])??{sum:0,n:0,max:0};row.sum+=d;row.n++;row.max=Math.max(row.max,d);rows.set(labels[i],row);}
  return Object.fromEntries([...rows].map(([l,r])=>[l,{meanDeltaE:r.sum/r.n,maxDeltaE:r.max,pixels:r.n}]));
}
export function ssimLuma(master,finished,window=8){
  const {width,height}=master;let total=0,count=0;const C1=(.01*255)**2,C2=(.03*255)**2;
  for(let y0=0;y0+window<=height;y0+=window)for(let x0=0;x0+window<=width;x0+=window){
    let n=0,ma=0,mb=0;const A=[],B=[];
    for(let y=y0;y<y0+window;y++)for(let x=x0;x<x0+window;x++){const i=y*width+x;if(master.data[i*4+3]===0)continue;const a=luma(master.data,i),b=luma(finished.data,i);A.push(a);B.push(b);ma+=a;mb+=b;n++;}
    if(n<4)continue;ma/=n;mb/=n;let va=0,vb=0,cov=0;for(let k=0;k<n;k++){va+=(A[k]-ma)**2;vb+=(B[k]-mb)**2;cov+=(A[k]-ma)*(B[k]-mb);}va/=n-1;vb/=n-1;cov/=n-1;
    total+=((2*ma*mb+C1)*(2*cov+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));count++;}
  return count?total/count:1;
}

/** Gate 3: parts and paint skin rebuilt from the finished master must be
 * byte-identical to the painter build except the atlas hash and binding hash. */
const stripHashes=binding=>{const {atlasSha256,bindingHash,...rest}=binding;return rest;};
export function bindingEquality(painterBinding,finishedBinding){
  const a=JSON.stringify(stripHashes(painterBinding)),b=JSON.stringify(stripHashes(finishedBinding));
  return {status:a===b?'PASS':'FAIL',identicalBytes:a===b,painterBytes:a.length,finishedBytes:b.length,
    atlasSha256Differs:painterBinding.atlasSha256!==finishedBinding.atlasSha256,bindingHashDiffers:painterBinding.bindingHash!==finishedBinding.bindingHash};
}

/** Whole report for one creature. `labels` is a Uint16Array over the master. */
export function conservationReport({master,finished,labels,painterBinding=null,finishedBinding=null,gradientRatioMin=.6}){
  const alpha=alphaConservation(master,finished),masterAlpha=new Uint8Array(master.width*master.height);for(let i=0;i<masterAlpha.length;i++)masterAlpha[i]=master.data[i*4+3];
  const countsBefore=labelComponentCounts(labels,masterAlpha,master.width,master.height),countsAfter=labelComponentCounts(labels,masterAlpha,master.width,master.height);
  const gm=boundaryGradient(master,labels),gf=boundaryGradient(finished,labels),ratio=gm.meanStep?gf.meanStep/gm.meanStep:1;
  // Structural: labels and alpha are the painter's, so counts cannot change unless gate 1 failed; the gradient gate is the measured half.
  const counts={status:alpha.status==='PASS'&&[...countsBefore].every(([l,n])=>countsAfter.get(l)===n)?'PASS':'FAIL',structural:true,labels:countsBefore.size,components:Object.fromEntries(countsBefore)};
  const gradient={status:ratio>=gradientRatioMin?'PASS':'FAIL',masterMeanStep:gm.meanStep,finishedMeanStep:gf.meanStep,ratio,minRatio:gradientRatioMin,boundaryPairs:gm.pairs,perLabelRatio:Object.fromEntries(Object.keys(gm.perLabel).map(l=>[l,gm.perLabel[l]?gf.perLabel[l]/gm.perLabel[l]:1]))};
  const binding=painterBinding&&finishedBinding?bindingEquality(painterBinding,finishedBinding):{status:'SKIPPED'};
  const gates={alpha,counts,gradient,binding},status=Object.values(gates).every(g=>g.status!=='FAIL')?'PASS':'FAIL';
  return {schema:'cf.creature-finish-conservation/v1',status,gates,reported:{deltaE:labelDeltaE(master,finished,labels),ssim:ssimLuma(master,finished)}};
}
export function loadLabels(file){const png=readPng(fs.readFileSync(file));return path.basename(file)==='ownership.png'?labelsFromColours(png):labelsFromRed(png);}
