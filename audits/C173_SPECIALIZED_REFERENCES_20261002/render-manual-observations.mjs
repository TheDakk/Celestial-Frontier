import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
import{intakeAuthoredPixels}from'../../port/v2/tools/creature-animation/authored-intake.mjs';
const base='audits/C173_SPECIALIZED_REFERENCES_20261002',req=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const id of['01-shrimp-hold','02-brittle-star','03-fiddler-crab-hold','05-standing-vampire-bat-hold']){
 const p=base+'/'+id,ob=JSON.parse(fs.readFileSync(p+'/observation.json')),author=fs.existsSync(p+'/authoring.json')?JSON.parse(fs.readFileSync(p+'/authoring.json')):null;
 const raw=await sharp(p+'/master.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(raw.info.width,1254);assert.equal(raw.info.height,1254);const keyed=intakeAuthoredPixels(new Uint8ClampedArray(raw.data),1254,1254);
 const points=author?.landmarksPx??ob.observedSourcePoints,regions=author?author.parts.filter(v=>v.id!==author.remainderPart).map(v=>({id:v.id,points:v.polygonPx})):ob.visibleRegions;
 const palette=['#ffff44','#33ccff','#66ee88','#dd88ff','#ff9955'];
 const polygons=regions.map((v,i)=>`<polygon points="${v.points.map(v=>v.join(',')).join(' ')}" fill="${palette[i%palette.length]}" fill-opacity=".13" stroke="#ffffff" stroke-width="1.5"/>`).join('');
 const dots=Object.entries(points).map(([label,[x,y]])=>`<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="black"/><text x="${x+6}" y="${y-6}" fill="white" stroke="black" stroke-width="2" paint-order="stroke" font-size="12">${label}</text>`).join('');
 const preview=await sharp(keyed.rgba,{raw:{width:1254,height:1254,channels:4}}).composite([{input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254">${polygons}${dots}</svg>`)}]).png().toBuffer();
 fs.writeFileSync(p+'/observation-preview.png',preview,{flag:'wx'});fs.writeFileSync(p+'/preview-receipt.json',JSON.stringify({schema:'cf.c173-diagnostic-preview/v1',masterSha256:sha(p+'/master.png'),observationSha256:sha(p+'/observation.json'),authoringSha256:author?sha(p+'/authoring.json'):null,previewSha256:sha(p+'/observation-preview.png'),width:1254,height:1254,originalChanged:false,diagnosticOverlayOnly:true,compiledFitAcceptance:false,qualityAccepted:false},null,2)+'\n',{flag:'wx'});console.log(p+'/observation-preview.png');
}
