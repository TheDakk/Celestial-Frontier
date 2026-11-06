import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {erodeAlpha,pinkExcess} from '../../tools/local-image-generation/kit-contact-math.mjs';
import {despillUnresolvedEdges} from '../../tools/local-image-generation/edge-despill.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..'),old=path.join(root,'audits/ARENA_EFFECTS_V42_PROOF_20260912');
const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const hash=b=>createHash('sha256').update(b).digest('hex');
const metadata=JSON.parse(fs.readFileSync(path.join(old,'intake.json'))),mid=metadata.images.find(x=>x.name==='arena-mid');
const bytes=fs.readFileSync(path.join(old,'keyed/arena-mid.png'));if(hash(bytes)!==mid.keyedSha256)throw Error('Keyed input hash changed');
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Reconstruct the exact original190 no-neighbour cases, rather than all residual pink pixels.
const original=await sharp(path.join(old,'arena-mid.png')).ensureAlpha().raw().toBuffer();
const mask=new Uint8Array(info.width*info.height);for(let i=0;i<mask.length;i++){const p=i*4;mask[i]=original[p]>150&&original[p+2]>150&&pinkExcess(original[p],original[p+1],original[p+2])>85?0:255;}
const eroded=erodeAlpha(mask,info.width,info.height,1),inside=erodeAlpha(eroded,info.width,info.height,3),targets=[];
for(let i=0;i<mask.length;i++){
 const p=i*4;if(!eroded[i]||inside[i]||pinkExcess(original[p],original[p+1],original[p+2])<=8)continue;
 const x=i%info.width,y=Math.floor(i/info.width);let found=false;
 for(let dy=-6;dy<=6&&!found;dy++)for(let dx=-6;dx<=6;dx++){
  const xx=x+dx,yy=y+dy;if(xx<0||xx>=info.width||yy<0||yy>=info.height)continue;
  const j=yy*info.width+xx,q=j*4;if(inside[j]&&pinkExcess(original[q],original[q+1],original[q+2])<=8){found=true;break;}
 }
 if(!found)targets.push(i);
}
if(targets.length!==190)throw Error('Original unresolved set no longer matches190');
const result=despillUnresolvedEdges(data,info.width,info.height,32,targets);
if(result.receipt.targets!==190)throw Error(`Expected190 unresolved targets, found${result.receipt.targets}; no output written`);
let changedPixels=0;for(let i=0;i<data.length;i+=4){if(result.rgba[i+3]!==data[i+3])throw Error('Alpha changed');if(result.rgba[i]!==data[i]||result.rgba[i+1]!==data[i+1]||result.rgba[i+2]!==data[i+2])changedPixels++;}
const png=await sharp(Buffer.from(result.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();fs.writeFileSync(path.join(out,'arena-mid-despilled.png'),png,{flag:'wx'});
const combined=await sharp(path.join(old,'arena-far.png')).composite([{input:png},{input:path.join(old,'keyed/arena-near.png')}]).png().toBuffer();fs.writeFileSync(path.join(out,'arena-template-v1.png'),combined,{flag:'wx'});
const receipt={...result.receipt,inputSha256:hash(bytes),outputSha256:hash(png),compositeSha256:hash(combined),changedPixels,mastersUnchanged:metadata.images.slice(0,3).every(row=>hash(fs.readFileSync(path.join(old,row.name+'.png')))===row.masterSha256),noRepaint:true};
fs.writeFileSync(path.join(out,'despill-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...receipt,corrected:receipt.corrected.length},null,2));
