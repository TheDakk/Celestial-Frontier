import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from '../../port/v2/node_modules/sharp/dist/index.cjs';
import {paintMask} from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
import {countVisibleAnatomy} from '../../port/v2/tools/anatomy-verify/limb-counter.mjs';

const root=path.resolve(import.meta.dirname, '../..');
const rows=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'pilot.json'),'utf8'));
const summary=[], tiles=[];
for (const [i,row] of rows.entries()) {
  const dir=path.join(root,row.packet), bytes=await fs.readFile(path.join(dir,'master.png'));
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {mask,keyed}=paintMask(data,info.width,info.height);
  const {label,...count}=countVisibleAnatomy(mask,info.width,info.height);
  const record={id:row.id,name:row.name,family:row.family,width:info.width,height:info.height,
    masterSha256:crypto.createHash('sha256').update(bytes).digest('hex'),keyed,observed:count,
    limitation:'Geometric appendage counts are observations, not semantic anatomy or G1 admission. No hand authoring or expected-count substitution.'};
  await fs.writeFile(path.join(dir,'visible-anatomy.json'),JSON.stringify(record,null,2)+'\n');
  summary.push({id:row.id,name:row.name,family:row.family,width:info.width,height:info.height,
    masterSha256:record.masterSha256,keyed,byClass:count.byClass,groundContacts:count.ground?.length,
    detached:count.detached});
  const tile=await sharp(bytes).resize(350,310,{fit:'contain',background:'#eee9df'}).png().toBuffer();
  const left=(i%5)*360,top=Math.floor(i/5)*345;
  tiles.push({input:tile,left:left+5,top:top+30});
  const svg=Buffer.from(`<svg width="360" height="30"><rect width="360" height="30" fill="#eee9df"/><text x="10" y="22" font-family="sans-serif" font-size="18" fill="#222">${row.id} · ${row.family}</text></svg>`);
  tiles.push({input:svg,left,top});
}
await sharp({create:{width:1800,height:1380,channels:3,background:'#eee9df'}}).composite(tiles).png().toFile(path.join(import.meta.dirname,'review-sheet.png'));
await fs.writeFile(path.join(import.meta.dirname,'observations.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({masters:summary.length,dimensions:[...new Set(summary.map(r=>`${r.width}x${r.height}`))],unmodified:true,handAuthoring:false}));
