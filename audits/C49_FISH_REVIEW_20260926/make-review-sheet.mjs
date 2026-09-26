import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from '../../port/v2/node_modules/sharp/dist/index.cjs';
const root=path.resolve(import.meta.dirname,'../..'), tiles=[], sources=[];
for (const [i,[id,name]] of [['07-perch','Perch'],['08-cod','Cod'],['09-carp','Carp']].entries()) {
 const file=`audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish/pairs/${id}-final/native/turn1-hit-reaction-50.png`;
 const bytes=await fs.readFile(path.join(root,file));
 sources.push({name,path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 tiles.push({input:await sharp(bytes).resize(768,432).png().toBuffer(),left:0,top:i*474+42});
 tiles.push({input:Buffer.from(`<svg width="768" height="42"><rect width="768" height="42" fill="#eee9df"/><text x="16" y="27" font-family="sans-serif" font-size="20">${name} — automatic candidate · awaiting visual approval</text></svg>`),left:0,top:i*474});
}
await sharp({create:{width:768,height:1422,channels:3,background:'#eee9df'}}).composite(tiles).png().toFile(path.join(import.meta.dirname,'nick-review.png'));
await fs.writeFile(path.join(import.meta.dirname,'nick-review-sources.json'),JSON.stringify({note:'Display-only resized complete frames; original evidence bytes untouched. Films sampled separately; these stills are not an animation acceptance certificate.',sources},null,2)+'\n');
