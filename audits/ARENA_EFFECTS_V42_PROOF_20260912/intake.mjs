import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { keyAndDespill } from '../../tools/local-image-generation/kit-contact-math.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const req=createRequire(path.join(root,'port/v2/package.json'));const sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const names=['arena-far','arena-mid','arena-near','wild-launch','wild-travel','wild-impact'];
const rows=[];fs.mkdirSync(path.join(out,'keyed'),{recursive:true});
for(const name of names){
 const bytes=fs.readFileSync(path.join(out,name+'.png'));const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const row={name,masterSha256:sha(bytes),width:info.width,height:info.height,qualityAccepted:false,meetsRuntimeFloor:name.startsWith('arena')?info.width>=1024&&info.height>=576:info.width>=384&&info.height>=384};
 if(name!=='arena-far'){
  const keyed=keyAndDespill(new Uint8ClampedArray(data),info.width,info.height,{terrainLayer:name.startsWith('arena')});
  row.bounds=keyed.bounds;row.keyer=keyed.receipt;
  row.keyPixels=keyed.alpha.filter(v=>v===0).length;
  if(name.startsWith('arena'))row.standAlphas=[1/3,2/3].map(x=>keyed.alpha[Math.round(.78*info.height)*info.width+Math.round(x*info.width)]);
  const png=await sharp(Buffer.from(keyed.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  fs.writeFileSync(path.join(out,'keyed',name+'.png'),png);row.keyedSha256=sha(png);
 }
 rows.push(row);
}
const composite=await sharp(path.join(out,'arena-far.png')).composite(['arena-mid','arena-near'].map(name=>({input:path.join(out,'keyed',name+'.png')}))).png().toBuffer();
fs.writeFileSync(path.join(out,'arena-composed-review.png'),composite);
const effectRows=rows.filter(r=>r.name.startsWith('wild'));
// These per-phase anchors describe the painted pixels, not fictitious compliance with requested bounds.
const measured={launch:{origin:[.18,.66],contact:[.82,.43]},travel:{origin:[.15,.62],contact:[.96,.62]},impact:{origin:[.22,.52],contact:[.80,.55]}};
const anchor={schema:'cf.effect-sequence-anchors/v1',sequenceId:'wild-maw-proof-v1',theme:'wild',abilityId:'maw',abilityName:'Savage Maw',canvasSize:{width:1254,height:1254},coordinateSpace:'normalized full canvas; top-left origin',phaseOrder:['launch','travel','impact'],direction:'left-to-right',originAnchor:[.20,.55],contactAnchor:[.80,.55],groundRegistration:'Map selected impact anchor to the arena recipe ground line y=0.78 for a ground strike; no creature target staged yet.',phases:effectRows.map(row=>({phase:row.name.slice(5),image:row.name+'.png',keyedImage:'keyed/'+row.name+'.png',imageSha256:row.masterSha256,canvasSize:{width:row.width,height:row.height},originAnchor:measured[row.name.slice(5)].origin,contactAnchor:measured[row.name.slice(5)].contact,alphaBoundsPixels:row.bounds,anchorMethod:'visual placement on the delivered master; bounds measured from keyed pixels',qualityAccepted:false})),layoutDeviation:'Generator enlarged/repositioned phases versus requested anchors. Per-phase anchors are recorded for review; common-canvas registration is not claimed verified.',qualityAccepted:false};
fs.writeFileSync(path.join(out,'wild-anchors.json'),JSON.stringify(anchor,null,2)+'\n');
const recipe=JSON.parse(fs.readFileSync(path.join(out,'arena-recipe.json')));recipe.canvasSize={width:rows[0].width,height:rows[0].height};recipe.plates=rows.filter(r=>r.name.startsWith('arena')).map(row=>({image:row.name+'.png',sha256:row.masterSha256,kind:row.name==='arena-far'?'scene':'key-painted terrain',groundLineNormalized:.78}));fs.writeFileSync(path.join(out,'arena-recipe.json'),JSON.stringify(recipe,null,2)+'\n');
fs.writeFileSync(path.join(out,'intake.json'),JSON.stringify({schema:'cf.arena-effects-intake/v1',images:rows,groundLineNormalized:.78,nearLowerBandDeviation:'requested lower tenth; delivered approximately lower fifth, with exact alpha bounds recorded',originalMastersOptimized:false,extractedMasks:false,composite:'arena-composed-review.png',qualityAccepted:false},null,2)+'\n');
console.log(JSON.stringify(rows,null,2));
