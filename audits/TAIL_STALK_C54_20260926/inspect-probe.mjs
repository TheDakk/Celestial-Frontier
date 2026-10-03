import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';import{createSourceJoinProbe}from'../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
const req=createRequire(process.cwd()+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),dir=process.argv[2];
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n))),record=read('record.json'),binding=read('pre-split-binding.json'),m=read('parts/manifest.json'),a=await sharp(path.join(dir,'parts/atlas',m.creatureId+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const p=createSourceJoinProbe({record,binding,atlas:{rgba:a.data,width:a.info.width,height:a.info.height}});
fs.writeFileSync(process.argv[3],JSON.stringify(p,null,1));console.log(JSON.stringify({joins:p.joins.map(x=>[x.name,x.sourceEdges.length]),excluded:p.excluded.map(x=>[x.name,x.sourceEdges]),parts:binding.parts.map(x=>[x.id,x.joint])},null,2));
