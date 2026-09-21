import fs from 'node:fs';import assert from 'node:assert/strict';
import {diagnosticCard} from '../../../port/v2/tools/animation-completion/r1c-diagnostic-card.mjs';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.ts';
const r=JSON.parse(fs.readFileSync('audits/ANATOMY_COMPLETION_20260917/cranberry-07/record.json')),normal=compileBodyCard(r,r.genome),valid={purpose:'R1c-20260919',order:'rows-first',scale:'declared'};
assert.deepEqual(diagnosticCard(r,r.genome,valid),normal);
for(const bad of [undefined,{}, {...valid,purpose:'production'},{...valid,order:'warm'}, {...valid,scale:'clamped'}])assert.throws(()=>diagnosticCard(r,r.genome,bad),/diagnostic-only/);
assert.notDeepEqual(diagnosticCard(r,r.genome,{...valid,scale:'legacy-body-axis'}).amplitudeProfile,normal.amplitudeProfile);
assert.deepEqual(compileBodyCard({...r,diagnostic:{...valid,scale:'legacy-body-axis'}},r.genome),normal);
console.log('PASS: declared identity, legacy diagnostic changes profile, shipped compiler ignores flags, five refusal controls.');
