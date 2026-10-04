import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {createSourceJoinProbe} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
const B='audits/C202_PRIMATE_REFERENCES_20261004',id=process.argv[2];
assert.match(id,/^[0-9]{2}-[a-z-]+$/);
const dir=B+'/'+id,fit=dir+'/fit01',J=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs');
const release=acquireWorkspaceLock('C202 observed source boundary attribution');
try{
 const record=J(fit+'/record.json'),binding=J(fit+'/pre-split-binding.json'),manifest=J(fit+'/parts/manifest.json'),atlasPath=fit+'/parts/atlas/'+manifest.creatureId+'.png',atlas=PNG.sync.read(fs.readFileSync(atlasPath));
 const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.width,height:atlas.height}});
 const summarize=row=>({name:row.name,reason:row.reason??row.rule,sourceEdges:Array.isArray(row.sourceEdges)?row.sourceEdges.length:row.sourceEdges,sourceBounds:[Math.min(...row.samples.map(s=>s.source[0])),Math.min(...row.samples.map(s=>s.source[1])),Math.max(...row.samples.map(s=>s.source[0])),Math.max(...row.samples.map(s=>s.source[1]))]});
 const result={schema:'cf.c202-source-boundary-inventory/v1',scope:'Actual unchanged positive-alpha adjacency; an excluded boundary is not automatically an observed anatomical join',inputs:[fit+'/record.json',fit+'/pre-split-binding.json',atlasPath].map(path=>({path,sha256:sha(fs.readFileSync(path))})),joins:probe.joins.map(summarize),excluded:probe.excluded.map(summarize)};
 fs.writeFileSync(dir+'/source-boundaries.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result.excluded));
}finally{release();}
