import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const base=path.resolve('audits/CIVET_PAINTED_PARTS_20260908');
const output=path.join(base,'alpha-first'); assert(!fs.existsSync(output)); fs.mkdirSync(output);
const original=path.join(base,'atlas-corrected-original.png');
const commands=[];
function run(args){const p=spawnSync('magick',args,{encoding:'utf8'});commands.push({args,exit:p.status,stdout:p.stdout,stderr:p.stderr});assert.equal(p.status,0,p.stderr);return p.stdout;}
const smooth='max(0,min(1,(min(r,b)-g-0.15)/0.70))';
run([original,'-alpha','off','-colorspace','sRGB','-fx',`1-(${smooth})*(${smooth})*(3-2*(${smooth}))`,path.join(output,'matte.png')]);
run([original,path.join(output,'matte.png'),'-alpha','off','-compose','CopyOpacity','-composite','-channel','R','-fx','(min(r,b)-g)>0.05 ? min(r,g+0.26) : r','-channel','B','-fx','(min(r,b)-g)>0.05 ? min(b,g) : b','+channel',path.join(output,'atlas-alpha.png')]);
const alpha=path.join(output,'atlas-alpha.png');
const regions=[{name:'body',rect:'1125x570+0+170'},{name:'hind-upper',rect:'205x320+1123+160'},{name:'fore-upper',rect:'195x320+1328+160'},{name:'hind-lower',rect:'205x330+1100+490'},{name:'fore-lower',rect:'210x330+1315+490'}];
for(const r of regions)run([alpha,'-crop',r.rect,'+repage','-trim','+repage','-define','webp:lossless=true',path.join(output,r.name+'.webp')]);
const files=fs.readdirSync(output).sort().map(name=>{const b=fs.readFileSync(path.join(output,name));return {path:name,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});
fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({schema:'cf-civet-alpha-extraction/v1',authority:'Nick explicitly authorized ImageMagick alpha extraction',status:'AWAITING_VISUAL_REVIEW',method:'Saturated-magenta difference matte with smooth transition; suppress only magenta excess at extracted edges, then extract five nonoverlapping regions. RGB treatment is key-color removal within alpha extraction, not a source recolor.',regions,commands,files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,files}));
