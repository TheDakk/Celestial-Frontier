import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {compileLibraryMaster} from '../../port/v2/tools/painted-creature/compile-library-master.mjs';
const B=path.relative(process.cwd(),import.meta.dirname),sha=b=>createHash('sha256').update(b).digest('hex');
const rows=[
{id:'01-beetle-source',name:'Beetle',view:'A true dorsal three-quarter natural ground-beetle view, camera high enough to see BOTH sides of the thorax. Head RIGHT, abdomen LEFT. This explicitly overrides strict side-profile layout below, solely for source observability. Exactly three genuine walking legs on EACH side, six total, spread modestly apart so all six actual thoracic emergence points, femora, knees, tibiae, tarsi and tips are continuously visible without crossing, overlap, body occlusion or invented paths. Keep the six actual leg endpoints separated. Two complete segmented antennae attached at the head, visible mouth/mandibles, actual hard closed elytra separated by a clear median seam. The two elytra are real hardened forewings; do not expose invented flight wings or delete real appendages. No flying/display pose. Natural grounded stance; do not pose leg ends as an anatomical diagram detached from the body.'},
{id:'02-grasshopper-source',name:'Grasshopper',view:'An elevated dorsal three-quarter view of a natural adult grasshopper, camera high enough to see BOTH flanks and all six actual thoracic leg emergence points. Head RIGHT, full abdomen LEFT. This explicitly overrides strict side-profile layout below solely for source observability. Three real legs on EACH flank: modest slender front and middle pairs, and the real powerful angled hind pair with massive femora, spiny tibiae and natural tarsi. Offset the paired hind limbs so neither femur hides a front or middle leg or its own tibia; all six entire leg paths and tips visible, no crossings, overlap, missing segments or extra legs. Two short stout antennae, slanted face and actual chewing mouth edge/mandibles readable. Two real folded forewing/tegmen surfaces with natural separate margins and visible thoracic attachments; do not invent or delete hidden hindwings. Quiet natural standing posture, no flight, props or diagram labels.'}
];
for(const row of rows){
 const packet=B+'/'+row.id;await compileLibraryMaster(row.name,packet);
 const q=JSON.parse(fs.readFileSync(packet+'/request.json')),canonical=fs.readFileSync(packet+'/prompt.txt','utf8');
 const composition='REFERENCE SOURCE PAINTING: one complete real animal on native 1254 x 1254 pure magenta; entire silhouette including all fine antenna/tarsal tips centered inside the middle 65 percent with at least 15 percent blank margin on every side. No floor, shadow, scenery, text, props, cutaway, detached limbs or stylized anatomy. Sole supplied image is the approved style reference, not an anatomical donor.';
 const prompt=composition+'\n'+row.view+'\n\n'+canonical+'\n\n'+row.view+'\n'+composition+'\n';
 fs.writeFileSync(packet+'/prompt.canonical.txt',canonical,{flag:'wx'});fs.writeFileSync(packet+'/prompt.txt.tmp',prompt,{flag:'wx'});fs.renameSync(packet+'/prompt.txt.tmp',packet+'/prompt.txt');
 fs.writeFileSync(packet+'/request.json.tmp',JSON.stringify({...q,basePromptSha256:q.promptSha256,promptSha256:sha(prompt),purpose:'SOURCE_OBSERVABILITY_SUCCESSOR_FOR_INDEPENDENT_MANUAL_REFERENCE',sourceCorrection:row.view,compositionCheck:composition,auditCompilerExtension:false,admission:false,batchCompilerSha256:sha(fs.readFileSync(import.meta.filename))},null,2)+'\n',{flag:'wx'});fs.renameSync(packet+'/request.json.tmp',packet+'/request.json');
}
fs.writeFileSync(B+'/source-roster.json',JSON.stringify(rows.map(r=>({...r,packet:B+'/'+r.id})),null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sources:rows.length,pipeline:'UNCHANGED_CANONICAL_COMPILER_WITH_EXPLICIT_VIEW_OVERRIDE'}));

