import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import{createHash}from'node:crypto';
import{createOpaqueSeamSamplingGuard}from'../../port/v2/tools/creature-animation/seam-sampling-guard.mjs';
import{createSourceJoinProbe}from'../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),out=[];
for(const id of['g2c54-05-tiger','g2c54-09-ocelot','g2c56-08-fisher']){
 const dir=path.resolve('audits/C59_REPAIR_20260926/'+id+'-side/fit'),read=n=>JSON.parse(fs.readFileSync(dir+'/'+n)),record=read('record.json'),binding=read('binding.json'),manifest=read('parts/manifest.json'),bytes=fs.readFileSync(dir+'/parts/atlas/'+manifest.creatureId+'.png'),a=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),atlas={rgba:a.data,width:a.info.width,height:a.info.height};
 const probe=createSourceJoinProbe({record,binding,atlas}),plan=createOpaqueSeamSamplingGuard({record,binding,atlas}),alpha={opaque:0,nearOpaque:0,translucent:0};
 for(let i=3;i<a.data.length;i+=4){const x=a.data[i];if(x===255)alpha.opaque++;else if(x>=250)alpha.nearOpaque++;else if(x)alpha.translucent++;}
 out.push({id,recordHash:record.recipeHash,bindingHash:binding.bindingHash,atlasSha256:createHash('sha256').update(bytes).digest('hex'),alpha,guard:plan.receipt,joins:probe.joins.map(j=>({name:j.name,edges:j.sourceEdges.length,guardedOpaqueEdges:plan.receipt.joins.find(x=>x.name===j.name)?.opaqueEdges})),excluded:probe.excluded.map(j=>({name:j.name,edges:j.sourceEdges.length}))});
}
fs.writeFileSync(new URL('./sampling-diagnosis.json',import.meta.url),JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out.map(r=>({id:r.id,alpha:r.alpha,guarded:r.guard.opaqueEdges,joins:r.joins.filter(j=>j.name.includes('fore')||j.name.includes('chest'))}))));
