/** Exact paint occupancy observation only. No intake, skeleton, skin or contact gate. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from '../../port/v2/node_modules/sharp/dist/index.cjs';
import {paintMask} from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),sha=b=>createHash('sha256').update(b).digest('hex');
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const summary=[];
for(const row of rows){
 const master=fs.readFileSync(row.master),authorBytes=fs.readFileSync(row.packet+'/authoring.json'),author=JSON.parse(authorBytes);
 const {data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{mask}=paintMask(data,info.width,info.height);
 const counts=author.parts.map(()=>0),fallback=author.parts.findIndex(p=>p.id===author.remainderPart);
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){if(!mask[y*info.width+x])continue;let k=author.parts.findIndex(p=>inside(x+.5,y+.5,p.polygonPx));if(k<0)k=fallback;counts[k]++;}
 const record={id:row.id,masterSha256:sha(master),authoringSha256:sha(authorBytes),scope:'Observed keyed raster occupancy of manual priority polygons; not intake or anatomy/skin/contact/native validation.',parts:author.parts.map((p,i)=>({id:p.id,joint:p.joint,pixels:counts[i]})),empty:author.parts.filter((p,i)=>!counts[i]).map(p=>p.id)};
 fs.writeFileSync(row.packet+'/priority-observation.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});summary.push({id:row.id,parts:counts.length,painted:counts.reduce((a,b)=>a+b,0),minimumPixels:Math.min(...counts),empty:record.empty});
}
fs.writeFileSync(base+'/priority-summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(summary);
