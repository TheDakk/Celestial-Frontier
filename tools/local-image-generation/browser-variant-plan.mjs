/** Small, deterministic browser patch plan for the already verified block32 variant.
 * Reads graph metadata only. Never reads weight shards, downloads or changes model bytes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseFields} from '../local-image-repack/protobuf.mjs';
import {inspectModel,makePlan,validateDerivedGraph,sha256} from '../local-image-repack/model.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const parent=JSON.parse(await fs.readFile(path.join(directory,'../local-image-repack/parent-contract.json'),'utf8'));
const pin=JSON.parse(await fs.readFile(path.join(directory,'q8-block32-manifest.json'),'utf8'));
const manifestBytes=await fs.readFile(path.join(directory,'model-manifest.json'));
const sourceManifestSha256=sha256(manifestBytes);
const need=(condition,message)=>{if(!condition)throw Error(message);};
const filePin=({path,bytes,sha256})=>({path,bytes,sha256});

/** Replace only changed top-level GraphProto fields, plus its outer length prefix.
 * The browser needs no protobuf parser. Exact old/new graph digests remain mandatory. */
export function graphSplices(original,derived){
  const a=parseFields(original),b=parseFields(derived),patches=[];
  need(a.length===b.length,'Changed model field count');
  for(let i=0;i<a.length;i++){
    const old=a[i],next=b[i];
    need(old.number===next.number&&old.wire===next.wire,'Changed model field order');
    if(old.raw.equals(next.raw))continue;
    need(old.number===7&&old.wire===2,'Changed non-graph model field');
    const headerLength=old.payload.byteOffset-old.raw.byteOffset;
    const newHeaderLength=next.payload.byteOffset-next.raw.byteOffset;
    patches.push({offset:old.raw.byteOffset-original.byteOffset,remove:headerLength,
      hex:next.raw.subarray(0,newHeaderLength).toString('hex')});
    const children=parseFields(old.payload),replacements=parseFields(next.payload);
    need(children.length===replacements.length,'Changed graph field count');
    for(let j=0;j<children.length;j++){
      const x=children[j],y=replacements[j];
      need(x.number===y.number&&x.wire===y.wire,'Changed graph field order');
      if(!x.raw.equals(y.raw))patches.push({offset:x.raw.byteOffset-original.byteOffset,remove:x.raw.length,hex:y.raw.toString('hex')});
    }
  }
  let at=0;const parts=[];
  for(const patch of patches){need(patch.offset>=at,'Overlapping graph patch');parts.push(original.subarray(at,patch.offset),Buffer.from(patch.hex,'hex'));at=patch.offset+patch.remove;}
  parts.push(original.subarray(at));need(Buffer.concat(parts).equals(derived),'Graph patch reconstruction differs');
  return patches;
}

export function buildBrowserVariantPlan(original,derived){
  need(Buffer.isBuffer(original)&&Buffer.isBuffer(derived),'Graph Buffers required');
  const inspected=inspectModel(original),conversion=makePlan(inspected);
  validateDerivedGraph(inspected,derived,conversion);
  need(derived.length===pin.files[0].bytes&&sha256(derived)===pin.files[0].sha256,'Unpinned derived graph');
  need(conversion.totalBytes===pin.files[1].bytes&&conversion.tensors.length===206,'Unpinned derived data geometry');
  const plan={schema:'cf.local-model-variant-plan.v1',variant:pin.variant,
    parent:{modelId:parent.modelId,revision:parent.revision,sourceManifestSha256,
      graph:filePin(parent.files.find(row=>row.path===parent.graph)),shards:parent.files.filter(row=>row.role==='weights').map(filePin)},
    files:pin.files.map(filePin),patches:graphSplices(original,derived),
    ranges:conversion.tensors.map(row=>({source:row.source.location,offset:row.source.offset,length:row.source.length,
      width:row.width,outputOffset:row.output.offset})),qualityAccepted:false,deviceQualified:false};
  const planJson=JSON.stringify(plan);need(Buffer.byteLength(planJson)<=524288,'Browser variant plan exceeds512KiB');
  return {plan,planJson,planSha256:sha256(planJson),planBytes:Buffer.byteLength(planJson),
    literalBytes:plan.patches.reduce((sum,row)=>sum+row.hex.length/2,0)};
}

async function main(args){
  const options={};for(const arg of args){const m=/^--(parent-graph|derived-graph|output)=(.+)$/.exec(arg);need(m&&!options[m[1]],'Expected unique --parent-graph, --derived-graph and --output');options[m[1]]=m[2];}
  need(Object.keys(options).length===3,'All three explicit paths required');
  const source=await fs.readFile(options['parent-graph']),derived=await fs.readFile(options['derived-graph']);
  const result=buildBrowserVariantPlan(source,derived);
  await fs.writeFile(options.output,result.planJson,{flag:'wx'});
  const readback=await fs.readFile(options.output);need(sha256(readback)===result.planSha256,'Plan readback differs');
  process.stdout.write(JSON.stringify({status:'PLAN_VERIFIED',output:path.resolve(options.output),planSha256:result.planSha256,
    planBytes:result.planBytes,literalBytes:result.literalBytes,patches:result.plan.patches.length,ranges:result.plan.ranges.length})+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main(process.argv.slice(2));
