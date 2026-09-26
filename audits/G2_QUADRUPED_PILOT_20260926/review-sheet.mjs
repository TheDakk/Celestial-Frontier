import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const base=import.meta.dirname,r=JSON.parse(fs.readFileSync(base+'/master-measurements.json'));if(r.count!==20)throw Error('All20 measured masters required');
const args=['montage','-font','/System/Library/Fonts/Supplemental/Arial.ttf','-pointsize','20','-fill','#e4e9ed','-background','#202a33'];
for(const row of r.rows)args.push('-label',`${row.id}\nIC4 legs ${row.observedVisibleLegs}/4 | ${row.verifierVerdict}`,path.join(base,row.id,'master.png'));
args.push('-tile','4x5','-geometry','400x330+12+12',base+'/review-sheet.png');execFileSync('magick',args);
console.log('20 masters; counts are verifier estimates, not rig acceptance.');
