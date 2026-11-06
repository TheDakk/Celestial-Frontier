import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {keyAndDespill,pinkExcess,erodeAlpha} from '../../tools/local-image-generation/kit-contact-math.mjs';import {keyAndDespill as old} from './phase4-keyer-before.mjs';
const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),B='audits/C213_PROGRAM_20261004',rows=[];
for(const id of ['g2c114-17-tahr','g2c114-02-elephant']){
 const packet='audits/G1_AUTO_AUTHOR_20260926/auto-c213p3/'+id+'/packet',bytes=fs.readFileSync(packet+'/master.png'),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),input=new Uint8ClampedArray(data),a=old(input,info.width,info.height),b=keyAndDespill(input,info.width,info.height);
 const tally=r=>{const inside=erodeAlpha(r.alpha,info.width,info.height,3);let edge=0,interior=0;for(let i=0;i<r.alpha.length;i++)if(r.alpha[i]&&pinkExcess(...r.rgba.subarray(4*i,4*i+3))>8){if(inside[i])interior++;else edge++;}return{edge,interior,receipt:r.receipt};};
 let alphaChanges=0,interiorChanges=0;const inner=erodeAlpha(a.alpha,info.width,info.height,3);for(let i=0;i<a.alpha.length;i++){if(a.alpha[i]!==b.alpha[i])alphaChanges++;if(inner[i])for(let c=0;c<3;c++)if(a.rgba[i*4+c]!==b.rgba[i*4+c])interiorChanges++;}if(alphaChanges||interiorChanges)throw Error('Alpha/interior conservation');
 const out=B+'/phase4-fringe/'+id;fs.mkdirSync(out,{recursive:true});fs.cpSync(packet,out+'/packet',{recursive:true,errorOnExist:true,force:false});
 await sharp(Buffer.from(b.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(out+'/keyed-preview.png');
 rows.push({id,masterSha256:createHash('sha256').update(bytes).digest('hex'),before:tally(a),after:tally(b),alphaChanges,interiorChanges,sourceModified:false,packet:out+'/packet'});
}
fs.writeFileSync(B+'/phase4-fringe-measurements.json',JSON.stringify(rows,null,2)+'\n');console.log(rows);
