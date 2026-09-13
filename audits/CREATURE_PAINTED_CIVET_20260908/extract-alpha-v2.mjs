import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)), out=path.join(dir,'alpha-v2');
if(fs.existsSync(out)) throw Error('Immutable alpha output already exists');
fs.mkdirSync(out);
const magick='/opt/homebrew/bin/magick';
const source=path.join(dir,'civet-first-opaque.png');
const run=args=>execFileSync(magick,args,{encoding:'utf8',timeout:60000,maxBuffer:2000000});
// Nick explicitly authorized ImageMagick alpha extraction on 2026-09-08.
// The synthetic checkerboard is neutral/cool; the retained Civet is warm.
// A bounded warm-excess key finds its edge. Flood-filled enclosed holes restore
// opaque interior ink (including eyes/nose) without drawing anatomy or texture.
const edge=path.join(out,'warm-edge.png'), filled=path.join(out,'solid-interior.png');
run([source,'-colorspace','sRGB','-fx','max(0,min(1,(r-b-0.015)*18))','-colorspace','Gray',edge]);
run([edge,'-threshold','45%','-morphology','Close','Disk:1','-fill','gray50','-draw','color 0,0 floodfill',
 '-fill','white','-opaque','black','-fill','black','-opaque','gray50',filled]);
// The first extraction filled checkerboard cells between whiskers. Restrict
// enclosed-hole restoration to the body/nose envelope; fine whiskers use only
// the chroma edge. Keep a connected foreground mask to discard isolated specks.
const envelope=path.join(out,'interior-envelope.png');
run(['-size','1536x1024','xc:black','-fill','white','-draw',
 'polygon 0,0 1370,0 1370,306 1420,317 1454,317 1458,333 1449,350 1410,367 1370,374 1370,1023 0,1023',envelope]);
run([filled,envelope,'-compose','Multiply','-composite',filled]);
const rough=path.join(out,'rough-matte.png');
run([edge,filled,'-compose','Lighten','-composite',rough]);
const clean=path.join(out,'component-mask.png');
run([rough,'-threshold','8%','-define','connected-components:area-threshold=20',
 '-define','connected-components:mean-color=true','-connected-components','8',
 '-threshold','8%','-morphology','Dilate','Disk:1',clean]);
const matte=path.join(out,'matte.png');
run([rough,clean,'-compose','Multiply','-composite',matte]);
const master=path.join(out,'civet-painted-v1.png');
run([source,matte,'-alpha','off','-compose','CopyOpacity','-composite',master]);
const derivative=path.join(out,'civet-painted-v1.webp');
run([master,'-define','webp:lossless=true','-define','webp:exact=true',derivative]);
for(const [name,color] of [['dark','#101820'],['light','#faf4e6']]) {
 run([master,'-background',color,'-alpha','remove','-alpha','off',path.join(out,'edge-review-'+name+'.png')]);
}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files={};for(const name of fs.readdirSync(out)) {
 const file=path.join(out,name);files[name]={bytes:fs.statSync(file).size,sha256:sha(file),identity:run(['identify','-format','%wx%h %[channels] opaque=%[opaque]',file])};
}
fs.writeFileSync(path.join(out,'extraction.json'),JSON.stringify({schema:'cf-civet-alpha-extraction/v1',authority:'Nick: Use ImageMagick for alpha extraction',at:new Date().toISOString(),source:{path:'civet-first-opaque.png',sha256:sha(source)},tool:run(['-version']).split('\n')[0],files,limits:'Heuristic matte extraction from opaque generated pixels; dark/light visual edge review required. No claim of original alpha recovery or identical antialias colors.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(files,null,2));
