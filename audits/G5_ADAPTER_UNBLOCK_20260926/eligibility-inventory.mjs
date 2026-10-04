/** Read-only source eligibility inventory: no model, image edits, gate changes or native retry. */
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
import {rolldown} from '../../port/v2/node_modules/rolldown/dist/index.mjs';
import {padCreatureFinishCanvas,creatureFinishMask} from '../../tools/local-image-generation/creature-finish-math.mjs';
import {pinRecordSha256} from '../../port/v2/tools/morph/battle2-pin-contract.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../..'),require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex');
const pinFile=path.join(root,'port/v2/apps/game/src/battle2-master-pins.generated.ts'),labelsFile=path.join(root,'port/v2/apps/game/src/creature-finish-source-pins.generated.ts');
const pinText=await fs.readFile(pinFile,'utf8'),ids=[...pinText.matchAll(/creatureId: '([^']+)'/g)].map(m=>m[1]);
const code=`export {getBattle2MasterPin} from ${JSON.stringify(pinFile)};export {creatureFinishLabelsPinV1} from ${JSON.stringify(labelsFile)};`;
const b=await rolldown({input:'virtual:eligibility',platform:'node',plugins:[{name:'entry',resolveId(id){if(id==='virtual:eligibility')return id;},load(id){if(id==='virtual:eligibility')return code;}}]});let api;try{const result=await b.generate({format:'es'});api=await import('data:text/javascript;base64,'+Buffer.from(result.output[0].code).toString('base64'));}finally{await b.close();}
const rows=[];
for(const id of ids){const pin=api.getBattle2MasterPin(id);let labelPin;try{labelPin=api.creatureFinishLabelsPinV1(pin);}catch(error){rows.push({id,status:'NO_LABELS_PIN',reason:String(error)});continue;}
 const masterBytes=await fs.readFile(path.join(root,pin.masterPath)),labelsBytes=await fs.readFile(path.join(root,labelPin.labelsPath)),record=JSON.parse(await fs.readFile(path.join(root,pin.recordPath)));
 if(sha(masterBytes)!==pin.masterSha256||sha(labelsBytes)!==labelPin.labelsPngSha256||await pinRecordSha256(record)!==pin.recordSha256)throw Error('Pinned source changed '+id);
 const m=await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),labels=await sharp(labelsBytes).ensureAlpha().raw().toBuffer(),w=m.info.width,h=m.info.height;
 if(w!==pin.masterWidth||h!==pin.masterHeight||labels.length!==m.data.length)throw Error('Pinned dimensions changed '+id);
 let painted=0,opaque=0,labeled=0,originalEligiblePixels=0;const alphaCounts={};
 for(let i=0;i<w*h;i++){const a=m.data[i*4+3];alphaCounts[a]=(alphaCounts[a]??0)+1;if(a)painted++;if(a===255)opaque++;if(labels[i*4])labeled++;}
 // Diagnostic enumeration of the unchanged four-pixel/same-owner/alpha255 predicate on original dimensions.
 for(let y=4;y<h-4;y++)for(let x=4;x<w-4;x++){const i=y*w+x,l=labels[i*4];if(!l||m.data[i*4+3]!==255)continue;let inner=true;for(let dy=-4;dy<=4&&inner;dy++)for(let dx=-4;dx<=4;dx++){const j=(y+dy)*w+x+dx;if(m.data[j*4+3]!==255||labels[j*4]!==l){inner=false;break;}}if(inner)originalEligiblePixels++;}
 const row={id,masterPath:pin.masterPath,masterSha256:pin.masterSha256,recordPath:pin.recordPath,recordSha256:pin.recordSha256,labelsPath:labelPin.labelsPath,labelsPngSha256:labelPin.labelsPngSha256,width:w,height:h,painted,opaque,labeled,originalEligiblePixels,topAlphaCounts:Object.entries(alphaCounts).sort((a,b)=>b[1]-a[1]).slice(0,12)};
 try{const old=creatureFinishMask(m.data,labels,w,h);row.originalMask={status:'PASS',editablePixels:old.editable.reduce((a,b)=>a+b,0)};}catch(e){row.originalMask={status:'REFUSE',reason:String(e)};}
 const work=padCreatureFinishCanvas(m.data,labels,w,h);row.workWidth=work.width;row.workHeight=work.height;
 try{const mask=creatureFinishMask(work.master,work.labels,work.width,work.height),editable=mask.editable.reduce((a,b)=>a+b,0);if(editable!==originalEligiblePixels)throw Error('Padding changed editable pixel count');row.paddedMask={status:'PASS',editablePixels:editable,editableTokens:mask.latent.reduce((a,b)=>a+(b===0?1:0),0)};row.status='ELIGIBLE';}catch(e){row.paddedMask={status:'REFUSE',reason:String(e)};row.status='REFUSE';}
 rows.push(row);console.log(JSON.stringify({id,status:row.status,opaque,originalEligiblePixels,paddedMask:row.paddedMask}));
}
const eligible1254=rows.filter(r=>r.width===1254&&r.height===1254&&r.status==='ELIGIBLE');const preferred=['wolf','salmon'].map(id=>eligible1254.find(r=>r.id===id)).find(Boolean)??eligible1254[0];
const report={schema:'cf.g5-source-eligibility/v1',head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),pinsSha256:sha(Buffer.from(pinText)),labelsPinsSha256:sha(await fs.readFile(labelsFile)),total:rows.length,labelsPresent:rows.filter(r=>r.status!=='NO_LABELS_PIN').length,eligible:rows.filter(r=>r.status==='ELIGIBLE').length,eligible1254:eligible1254.map(r=>r.id),recommendedDistinctCase:preferred?.id??null,scope:'Original source bytes unchanged; existing mask criteria unchanged; read-only preflight, not a native inference',rows};
await fs.writeFile(path.join(dir,'eligibility-inventory.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
await fs.writeFile(path.join(dir,'native-bfe76a6b-refused/source-stats.json'),JSON.stringify(rows.find(r=>r.id==='cougar'),null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({total:report.total,labelsPresent:report.labelsPresent,eligible:report.eligible,eligible1254:report.eligible1254,recommendedDistinctCase:report.recommendedDistinctCase}));
