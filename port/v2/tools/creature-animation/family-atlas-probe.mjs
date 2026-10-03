/** Complete offline intake/atlas path for every contracted family. Calibration
 * stripes are deliberately synthetic: no species or painted coverage claim. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {FAMILY_CONTRACTS} from './family-contracts.mjs';import {sealFamilyRecord} from './family-record.mjs';
import {hashBytes,hashJSON} from './quadruped-template.mjs';import {buildAuthoredParts} from './build-authored-parts.mjs';
import {verifyPartsDirectory} from './verify-parts.mjs';import {cutPainterParts} from './part-masks.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Usage: family-atlas-probe.mjs NEW_OUTPUT_DIRECTORY');
const {records}=JSON.parse(fs.readFileSync(new URL('./test-fixtures/family-records.json',import.meta.url)));
const report={schema:'cf.family-atlas-proof/v1',status:'RUNNING',scope:'Synthetic calibration stripes for the real painter-label intake and pinned packer; NOT art, painter observation or animation acceptance.',families:[]};
fs.mkdirSync(output,{recursive:true});
const json=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
try{
 for(const t of FAMILY_CONTRACTS){
  const dir=path.join(output,t.id);fs.mkdirSync(dir);const w=128,h=128,rgba=new Uint8ClampedArray(w*h*4),labels=new Uint8Array(w*h),labelRGBA=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=Math.floor(x*t.joints.length/w);labels[i]=k+1;rgba.set([(k*47+11)%256,(k*31+49)%256,(k*71+29)%256,255],i*4);labelRGBA.set([k+1,k+1,k+1,255],i*4);}
  const master=PNG.sync.write({width:w,height:h,data:Buffer.from(rgba)}),labelBytes=PNG.sync.write({width:w,height:h,data:Buffer.from(labelRGBA)});
  fs.writeFileSync(path.join(dir,'calibration.png'),master);fs.writeFileSync(path.join(dir,'labels.png'),labelBytes);
  const input=structuredClone(records[t.id]);input.geometry={...input.geometry,width:w,height:h,cutoutAssetHash:await hashBytes(master)};input.clipSetId=t.clipSetId;
  const record=await sealFamilyRecord(input);json(path.join(dir,'record.json'),record);
  const body={schema:'cf.painter-part-intake/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,labelsFile:'labels.png',labelsSha256:await hashBytes(labelBytes),parts:t.joints.map((joint,i)=>({id:'part-'+String(i).padStart(2,'0'),joint,layer:i%2?'near':'far'}))};
  const declaration={...body,declarationHash:await hashJSON(body)};json(path.join(dir,'declaration.json'),declaration);
  const args={id:t.id,recordFile:path.join(dir,'record.json'),masterFile:path.join(dir,'calibration.png'),declarationFile:path.join(dir,'declaration.json')};
  const a=await buildAuthoredParts({...args,output:path.join(dir,'pack-01')}),b=await buildAuthoredParts({...args,output:path.join(dir,'pack-02')});assert.deepEqual(a,b);
  const first=await verifyPartsDirectory(path.join(dir,'pack-01')),second=await verifyPartsDirectory(path.join(dir,'pack-02'));
  assert.equal(first.binding.atlasSha256,second.binding.atlasSha256,'nondeterministic PNG');assert.deepEqual(first.binding,second.binding,'nondeterministic metadata');
  const missing=labels.slice();missing[0]=0;await assert.rejects(cutPainterParts(record,master,rgba,missing,declaration),/missing\/unknown ownership/);
  const foreign={...body,parts:body.parts.map((p,i)=>i? p:{...p,joint:'foreign'})};await assert.rejects(cutPainterParts(record,master,rgba,labels,{...foreign,declarationHash:await hashJSON(foreign)}),/painter part identity/);
  report.families.push({id:t.id,...a,atlasSha256:first.binding.atlasSha256,deterministicRepack:true,negativeControls:['missing visible label','foreign family joint'],runtimeRecord:'calibration only'});
 }
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{json(path.join(output,'report.json'),report);}
console.log(JSON.stringify({status:report.status,families:report.families.length,error:report.error}));
