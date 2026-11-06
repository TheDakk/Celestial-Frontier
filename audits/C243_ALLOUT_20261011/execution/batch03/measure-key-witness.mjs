/** Candidate diagnosis only: can a residual magenta pixel reach the original key
 * through a short colour-contaminated corridor inside the existing 6px search? */
import fs from 'node:fs';import {createRequire} from 'node:module';
import {keyAndDespill,erodeAlpha,pinkExcess} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
const req=createRequire(new URL('../../../../port/v2/package.json',import.meta.url)),{PNG}=req('pngjs');
const rows=JSON.parse(fs.readFileSync(new URL('./fringe-before.json',import.meta.url))).rows,out=[];
for(const row of rows){const p=PNG.sync.read(fs.readFileSync(row.file)),w=p.width,h=p.height,rgba=new Uint8ClampedArray(p.data),k=keyAndDespill(rgba,w,h),inner=erodeAlpha(k.alpha,w,h,3);let residual=0,witnessed=0;const unresolved=[];
for(let i=0;i<w*h;i++){const q=i*4,[r,g,b]=k.rgba.subarray(q,q+3);if(!inner[i]||!(r>170&&b>150&&g<110&&r-g>90))continue;residual++;const x=i%w,y=Math.floor(i/w),queue=[i],seen=new Set(queue);let found=false;
for(let at=0;at<queue.length&&!found;at++){const n=queue[at],xx=n%w,yy=Math.floor(n/w);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const X=xx+dx,Y=yy+dy,j=Y*w+X;if(X<0||Y<0||X>=w||Y>=h||Math.abs(X-x)>6||Math.abs(Y-y)>6||seen.has(j))continue;seen.add(j);const [R,G,B]=rgba.subarray(j*4,j*4+3),ex=pinkExcess(R,G,B);if(R>150&&B>150&&ex>85){found=true;break;}if(ex>8)queue.push(j);}}
if(found)witnessed++;else if(unresolved.length<10)unresolved.push({x,y,rgb:[r,g,b]});}
out.push({name:row.name,residualInterior:residual,shortKeyCorridorWitness:witnessed,unresolved});}
fs.writeFileSync(process.argv[2],JSON.stringify({scope:'Read-only hypothesis measurement; no keyer output changed',rows:out},null,2)+'\n',{flag:'wx'});console.log(out);
