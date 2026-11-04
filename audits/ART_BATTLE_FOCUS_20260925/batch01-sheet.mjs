import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,req=createRequire(path.resolve(base,'../../port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const rows=[['01-jellyfish','ANATOMY OPEN: tentacle count / separation'],['02-dragonfly','ANATOMY OPEN: sixth visible leg'],['03-sturgeon','FACING OPEN: outward-facing film'],['04-wall-lizard','MOTION OPEN: contact / fold refusals'],['05-cougar','MOTION OPEN: contact / fold refusals'],['06-impala','MOTION OPEN: faint / walk contact'],['07-marmot','MOTION OPEN: faint / gallop contact'],['08-bass','CANDIDATE PASS: wiring / picker pending'],['09-cattle','MOTION + CAPTURE OPEN: not admitted'],['10-tang','CANDIDATE PASS: wiring / picker pending']];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;'),composite=[],inputs={};
for(let i=0;i<rows.length;i++){
 const [id,status]=rows[i],d=path.join(base,id),sheet=path.join(d,'review-sheet.png'),file=fs.existsSync(sheet)?sheet:path.join(d,'master.png');
 inputs[path.relative(base,file)]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const tile=await sharp({create:{width:800,height:550,channels:4,background:'#132027'}}).png().toBuffer(),pic=await sharp(file).trim().resize(780,475,{fit:'inside'}).png().toBuffer();
 const title=Buffer.from(`<svg width="800" height="550"><text x="15" y="25" font-size="18" font-family="Arial" fill="white">${escape(id+' | '+status)}</text></svg>`);
 const rendered=await sharp(tile).composite([{input:pic,gravity:'south'},{input:title}]).png().toBuffer();composite.push({input:rendered,left:(i%2)*810,top:80+Math.floor(i/2)*560});
}
const title=Buffer.from('<svg width="1610" height="2890"><rect width="100%" height="100%" fill="#0d151a"/><text x="20" y="36" font-size="26" font-family="Arial" fill="#eddfbb">C15 — FIRST TEN PAINTINGS / REVIEW + OPEN REPAIRS</text><text x="20" y="64" font-size="17" font-family="Arial" fill="white">Two candidate passes; eight open repairs. No new integrated coverage or whole-library phone PASS yet.</text></svg>');
await sharp(title).composite(composite).png().toFile(path.join(base,'batch01-review-sheet.png'));
fs.writeFileSync(path.join(base,'batch01-sheet-receipt.json'),JSON.stringify({inputs,rows,scope:'Thumbnails only; all master, rig and native evidence retains its original bytes in each item packet.',helperSha256:createHash('sha256').update(fs.readFileSync(import.meta.filename)).digest('hex'),outputSha256:createHash('sha256').update(fs.readFileSync(path.join(base,'batch01-review-sheet.png'))).digest('hex')},null,2)+'\n');
