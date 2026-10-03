/** Supplementary source-label authority. Never changes original rig pins, alpha or admission.
 * The four reviewed derived maps are independently reproduced from exact original pinned inputs before emission. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {getBattle2MasterPin} from '../../apps/game/src/battle2-master-pins.generated.ts';
import {pinRecordSha256} from './battle2-pin-contract.mjs';
import {finishConservation} from '../painted-creature/finish-conservation.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),file='port/v2/apps/game/src/battle2-master-pins.generated.ts';
const readRepo=p=>new Uint8Array(fs.readFileSync(path.join(root,p)));
const sha=b=>createHash('sha256').update(b).digest('hex'),same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const decode=async bytes=>{const {data,info}=await sharp(Buffer.from(bytes)).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {rgba:new Uint8Array(data),width:info.width,height:info.height};};
const need=(ok,why)=>{if(!ok)throw Error('finish labels evidence: '+why);};
export const DERIVED_LABEL_IDS=Object.freeze(['civet','eel','rat','salamander']);
const packet=id=>`audits/G5_DERIVED_LABELS_20260926/${id}/`;
const alphaPath=(pin,read)=>{for(const base of['port/v2/apps/game/public/battle2/','port/v2/apps/game/public/library/battle2/']){try{return {path:base+pin.alphaPath,bytes:read(base+pin.alphaPath)};}catch{}}throw Error('finish labels evidence: missing shipped alpha');};
/** Review reads are injectable only in this build tool for mutation controls. Runtime callers receive generated private pins only. */
export async function reviewDerivedOwnershipV1(id,{read=readRepo}={}){
 need(DERIVED_LABEL_IDS.includes(id),'unreviewed creature');const pin=getBattle2MasterPin(id);need(pin,'missing genuine pin');
 const labelsPath=packet(id)+'labels.png',receiptPath=packet(id)+'receipt.json',receiptBytes=read(receiptPath),receipt=JSON.parse(new TextDecoder().decode(receiptBytes));
 need(receipt.schema==='cf.derived-ownership-evidence/v1'&&receipt.creatureId===id,'receipt identity');
 need(receipt.generatorSha256===sha(read('audits/G5_DERIVED_LABELS_20260926/derive-labels.mjs')),'generator provenance');
 for(const k of['creatureId','masterPath','masterSha256','masterWidth','masterHeight','recordPath','recordSha256','recipeHash','alphaPath','alphaSha256','bindingSha256','atlasPath','atlasSha256'])need(receipt.pin?.[k]===pin[k],'receipt pin '+k);
 const record=JSON.parse(new TextDecoder().decode(read(pin.recordPath))),bindingBytes=read(pin.recordPath.replace(/record\.json$/,'binding.json')),binding=JSON.parse(new TextDecoder().decode(bindingBytes));
 const masterBytes=read(pin.masterPath),atlasBytes=read(pin.atlasPath),alphaBytes=alphaPath(pin,read).bytes,labelsBytes=read(labelsPath);
 need(await pinRecordSha256(record)===pin.recordSha256&&record.recipeHash===pin.recipeHash,'record pin');
 need(sha(bindingBytes)===pin.bindingSha256&&binding.recordRecipeHash===pin.recipeHash,'binding pin');
 need(sha(masterBytes)===pin.masterSha256,'master pin');need(sha(atlasBytes)===pin.atlasSha256,'atlas pin');need(sha(alphaBytes)===pin.alphaSha256,'alpha pin');
 const [master,atlas,alpha,labels]=await Promise.all([masterBytes,atlasBytes,alphaBytes,labelsBytes].map(decode)),w=pin.masterWidth,h=pin.masterHeight;
 need([master,alpha,labels].every(i=>i.width===w&&i.height===h)&&record.geometry.width===w&&record.geometry.height===h,'dimensions');
 need(atlas.width===binding.atlasSize.width&&atlas.height===binding.atlasSize.height,'atlas dimensions');
 need(receipt.dimensions?.width===w&&receipt.dimensions?.height===h,'receipt dimensions');
 const parts=binding.parts.filter(p=>p.kind==='part');need(parts.length>0&&parts.length<=255,'part count');
 const box=(b,W,H)=>b&&[b.x,b.y,b.width,b.height].every(Number.isInteger)&&b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&b.x+b.width<=W&&b.y+b.height<=H;
 const ids=new Set();for(const p of parts){need(typeof p.id==='string'&&!ids.has(p.id),'part identity');ids.add(p.id);need(p.layer==='far'||p.layer==='near','part layer');need(!p.rotated&&!p.frame.rotated&&p.frame.width===p.cutout.width&&p.frame.height===p.cutout.height&&box(p.frame,atlas.width,atlas.height)&&box(p.cutout,w,h),'native geometry');}
 const expected=new Uint8Array(w*h*4),overwrites={},map=parts.map((p,i)=>({label:i+1,id:p.id,joint:p.joint,layer:p.layer}));
 // Independent scan in binding index order within each depth layer. This does not execute the evidence generator.
 for(const layer of['far','near'])for(let index=0;index<parts.length;index++){const p=parts[index];if(p.layer!==layer)continue;for(let sy=0;sy<p.cutout.height;sy++)for(let sx=0;sx<p.cutout.width;sx++){
  if(atlas.rgba[((p.frame.y+sy)*atlas.width+p.frame.x+sx)*4+3]===0)continue;
  const j=((p.cutout.y+sy)*w+p.cutout.x+sx)*4,previous=expected[j];if(previous&&previous!==index+1){const pair=parts[previous-1].id+'→'+p.id;overwrites[pair]=(overwrites[pair]??0)+1;}expected[j]=index+1;expected[j+3]=255;
 }}
 need(same(expected,labels.rgba),'full-resolution ownership mismatch');
 need(sha(labelsBytes)===receipt.labels.pngSha256&&sha(expected)===receipt.labels.rgbaSha256,'labels receipt hash');
 need(JSON.stringify(map)===JSON.stringify(receipt.labels.map),'label map');
 const sorted=o=>JSON.stringify(Object.entries(o).sort(([a],[b])=>a.localeCompare(b)));
 need(sorted(overwrites)===sorted(receipt.labels.overwrites),'overwrites');
 let painted=0,unowned=0,outside=0,alphaMismatch=0;for(let i=0;i<w*h;i++){if(alpha.rgba[i*4+3]){painted++;if(!expected[i*4])unowned++;}else if(expected[i*4])outside++;if(master.rgba[i*4+3]!==alpha.rgba[i*4+3])alphaMismatch++;}
 need(painted===receipt.labels.paintedPixels&&unowned===receipt.labels.unownedPaintedPixels&&unowned===0,'coverage');need(outside===0,'ownership outside keyed paint');
 const conservation=finishConservation(master.rgba,master.rgba,expected,w,h);need(conservation.status==='PASS'&&conservation.parts.length>0,'identity conservation');
 const png=new Uint8Array(await sharp(Buffer.from(expected),{raw:{width:w,height:h,channels:4}}).png({compressionLevel:9}).toBuffer());need(same(png,labelsBytes),'PNG reproduction');
 return {id,labelsPath,labelsPngSha256:sha(labelsBytes),labelsRgbaSha256:sha(expected),receiptPath,receiptSha256:sha(receiptBytes),pixels:expected,png,width:w,height:h,labels:parts.length,painted,unowned,outside,overwrites,masterAlphaMismatchPixels:alphaMismatch,identityConservation:conservation.status};
}
export async function buildCreatureFinishSourcePinsV1(){
 const ids=[...fs.readFileSync(path.join(root,file),'utf8').matchAll(/creatureId: '([^']+)'/g)].map(m=>m[1]),rows=[];
 for(const id of ids){const p=getBattle2MasterPin(id);need(p,'missing pin '+id);const conventional=p.recordPath.replace(/record\.json$/,'labels.png');need(conventional!==p.recordPath,'record path');
  const derived=DERIVED_LABEL_IDS.includes(id)?await reviewDerivedOwnershipV1(id):null,labelsPath=derived?.labelsPath??conventional;
  rows.push({creatureId:id,recordSha256:p.recordSha256,bindingSha256:p.bindingSha256,atlasSha256:p.atlasSha256,labelsPath,labelsPngSha256:derived?.labelsPngSha256??sha(readRepo(labelsPath)),source:derived?'reviewed-derived-ownership':'fit-labels',...(derived?{receiptPath:derived.receiptPath,receiptSha256:derived.receiptSha256}:{})});
 }
 const source=`// GENERATED by tools/morph/creature-finish-source-pins.mjs.\n// Supplementary labels pins; full original rig admission is still mandatory.\n// Derived rows reproduce reviewed ownership from original pinned binding/atlas; no anatomy or alpha change.\nimport {isBattle2MasterPin, type Battle2MasterPinV1} from './battle2-master-pins.generated.js';\nconst PINS = ${JSON.stringify(rows,null,2)} as const;\nexport function creatureFinishLabelsPinV1(pin: Battle2MasterPinV1) {\n if (!isBattle2MasterPin(pin)) throw Error('finish labels: untrusted rig pin');\n const row=PINS.find(p=>p.creatureId===pin.creatureId);\n if (!row || row.recordSha256!==pin.recordSha256 || row.bindingSha256!==pin.bindingSha256 || row.atlasSha256!==pin.atlasSha256) throw Error('finish labels: stale or missing source pin');\n return Object.freeze({...row});\n}\n`;
 return {source,rows};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){const {source,rows}=await buildCreatureFinishSourcePinsV1(),out=path.join(root,'port/v2/apps/game/src/creature-finish-source-pins.generated.ts');if(process.argv.includes('--check'))need(fs.readFileSync(out,'utf8')===source,'registry drift');else fs.writeFileSync(out,source);console.log(JSON.stringify({labelsPins:rows.length,derived:rows.filter(r=>r.source==='reviewed-derived-ownership').length,mode:process.argv.includes('--check')?'check':'write'}));}
