import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const base='audits/C192_SPECIALIZED_REFERENCES_20261002',read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const pin=p=>({path:p,sha256:sha(read(p)),bytes:read(p).length}),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const choices=[
 {id:'10-snail-contours',fit:'d28/fit',status:'DIAGNOSTIC_CANDIDATE',note:'The inspected final cast poses have continuous eye stalks and no prior root fleck. Glossy bead-like eyes and rounded mouth remain an art/anatomy review concern. No native stage-grounding or whole-film claim.',images:['master.png','motion-d28-cast-50-left.png','motion-d28-cast-50-right.png'],review:'Independent effects agent concurs after full-size master and both cast stills; no contour rework requested. Body above red software guide does not establish stage grounding.'},
 {id:'08-prawn-opaque',fit:'d28/fit',status:'HELD_VISUAL',note:'Small detached flecks around thin distal legs/antennae persist in reviewed cast. Five walking endpoints on each side were authored from this dorsal source; no invisible side-view roots were invented. A dorsal swim projection does not prove a shared land stance.',images:['master.png','joint-preview-01.png','ownership-preview-01.png','motion-d28-cast-50-left.png']},
 {id:'09-shrimp-opaque',fit:'d28/fit',status:'HELD_VISUAL',note:'Reviewed swim has tiny distal detached flecks and a clear lower rear leg/body cut opening. Source conservation and static endpoint probes cannot override this painted discontinuity.',images:['master.png','joint-preview-01.png','ownership-preview-01.png','motion-d28-approach-swim-50-left.png']},
 {id:'11-mussel-dorsal',fit:'fit01',status:'HELD_VISUAL',note:'Provisional observed anterior external hinge interpretation. Cast visibly separates continuous shell/mantle boundaries and small flecks. First real bivalve source/clip integration finding: intentional D31 valve opening/clapping needs adequate painted boundary coverage; unchanged numeric/static probes pass. Not a qualified bivalve film.',images:['master.png','joint-preview-01.png','ownership-preview-01.png','motion-cast-50-left.png','motion-cast-50-right.png','motion-faint-100-right.png'],review:'Parent independently reviewed cast-left and agrees with broad splits distinct from tiny islands.',islandPlacement:{applied:false,movablePixels:153,remainderPixels:131367,nextStep:'Explicit unattempted Claude-side diagnostic, not a demonstrated repair for broad continuous boundary openings.'}}
];
let actions=0,samples=0,poses=0,stills=0;
const fits=choices.map(q=>{
 const dir=base+'/'+q.id,d28=q.fit==='d28/fit',record=json(dir+'/'+q.fit+'/record.json'),stat=json(dir+'/'+(d28?'static-d28.json':'static-01.json')),pub=json(dir+'/'+(d28?'publication-d28.json':'publication-review.json'));
 assert.equal(stat.status,'PASS_STATIC');assert(stat.rows.every(r=>r.status==='PASS'));assert(pub.rows.every(r=>r.status==='PASS'));
 actions+=stat.rows.length;samples+=stat.rows.reduce((s,r)=>s+r.samples,0);poses+=pub.rows.length;stills+=pub.rows.reduce((s,r)=>s+r.files.length,0);
 for(const row of pub.rows)for(const f of row.files)assert.equal(sha(read(f.path)),f.sha256);
 return {...q,fit:dir+'/'+q.fit,recordRecipeHash:record.recipeHash,sourceSha256:record.geometry.cutoutAssetHash,staticReport:pin(dir+'/'+(d28?'static-d28.json':'static-01.json')),publicationReport:pin(dir+'/'+(d28?'publication-d28.json':'publication-review.json')),fullSizeInspectedFiles:q.images.map(n=>pin(dir+'/'+n)),qualityAccepted:false,nativeRuns:0};
});
assert.deepEqual([actions,samples,poses,stills],[43,5203,24,48]);
const held=[
 {id:'01-mussel-source',status:'HELD_SOURCE',reason:'Anterior convergence exists, but no defensible external dorsal hinge path; parent full-size concurrence.'},
 {id:'02-prawn-dorsal',status:'REFUSED_INTAKE',reason:'Fine far antenna is removed in part by unchanged one-pixel erosion; observed endpoint is outside keyed-paint allowance. Original refusal retained, not snapped to unrelated shaft.'},
 {id:'03-shrimp-dorsal',status:'REFUSED_INTAKE',reason:'Fine far antenna is removed in part by unchanged keyer erosion; observed endpoint refuses. Original refusal retained.'},
 {id:'04-snail-mouth',status:'REJECTED_OWNERSHIP_PREDECESSOR',reason:'Cast stalk spikes and tiny detached root region; exact source preserved by selected folder 10 successor.'},
 {id:'05-clam-hinge',status:'HELD_SOURCE',reason:'Rear rim reads as ambiguous extra shell surface; external dorsal hinge not proven; parent full-size concurrence.'},
 {id:'06-marmoset-source',status:'HELD_SOURCE',reason:'Distal support alignment improved but far upper limb roots remain covered by fur/trunk. No observed complete four-chain fit.'},
 {id:'07-standing-bat-source',status:'HELD_SOURCE',reason:'Far wing root/finger fold chains remain occluded; supports unequal. One thumb claw per wing retained, no hidden chains invented.'}
].map(q=>({...q,master:pin(base+'/'+q.id+'/master.png'),generation:pin(base+'/'+q.id+'/generation.json'),fullSizeSourceInspected:true,qualityAccepted:false,nativeRuns:0}));
write(base+'/visual-review.json',{schema:'cf.c192-specialized-visual-review/v1',scope:'Full-size human/model inspection of specifically named source-coordinate software diagnostic files; not every static sample or native screen.',selected:fits,retained:held,totalSelected:{actions,samples,softwarePoses:poses,softwareStills:stills},sourceNotes:'Original PNGs are byte-retained. Established keying/despill/erosion affects the derived keyed mask. Conservation is exact against that unchanged keyed output, not a claim of zero effect on hairline original features.',D28Default:.5,qualityAccepted:false,nativeRuns:0});
const inputs=[];
for(const q of json(base+'/source-jobs.json')){
 const source=q.source+'/master.png';assert.equal(sha(read(source)),json(base+'/'+q.id+'/generation.json').inputMasterSha256);inputs.push(pin(source));
}
write(base+'/source-input-recheck.json',{schema:'cf.c192-input-recheck/v1',inputs,unchanged:true});
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>{const f=p+'/'+e.name;assert(!e.isSymbolicLink());return e.isDirectory()?walk(f):[f];});
const paths=walk(base).sort();
let textFiles=0;
for(const p of paths)if(/\.(?:json|mjs|md|txt|log)$/.test(p)){
 const txt=read(p).toString();assert(!txt.includes(os.homedir()),'privacy: expanded home path in '+p);
 assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(txt),'privacy: email in '+p);textFiles++;
}
const files=paths.map(pin),totalBytes=files.reduce((s,f)=>s+f.bytes,0);
write(base+'/delivery.json',{schema:'cf.c192-specialized-delivery/v1',workspace:'~/Projects/celestial-frontier-openai-mac',state:'FROZEN_DIAGNOSTIC_DELIVERY_WITH_VISUAL_HOLDS',selected:fits.map(({id,fit,status,recordRecipeHash,sourceSha256})=>({id,fit,status,recordRecipeHash,sourceSha256})),generatedOriginals:10,reusedSourceSuccessors:1,totalSelected:{actions,samples,softwarePoses:poses,softwareStills:stills},privacy:{expandedHomePaths:0,emailRecords:0,checkedTextFiles:textFiles},files,fileCount:files.length,totalBytes,inventoryExcludes:['delivery.json'],productionChanges:0,poolChanges:0,nativeRuns:0,qualityAccepted:false});
console.log(JSON.stringify({deliverySha256:sha(read(base+'/delivery.json')),files:files.length,bytes:totalBytes,actions,samples,poses,stills,cpu:'TERMINAL'}));
