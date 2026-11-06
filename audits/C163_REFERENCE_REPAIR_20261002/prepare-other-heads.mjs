import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{headRegions}from'./other-head-regions.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),root=path.resolve(import.meta.dirname,'../..');
for(const [id,additions]of Object.entries(headRegions)){
 const original=path.join(import.meta.dirname,'other-heads',id,'original'),candidate=path.join(import.meta.dirname,'other-heads',id,'candidate');
 assert(!fs.existsSync(candidate));fs.mkdirSync(candidate);
 for(const name of ['master.png','subject-source.json','presence.json'])fs.copyFileSync(path.join(original,name),path.join(candidate,name),fs.constants.COPYFILE_EXCL);
 const bytes=fs.readFileSync(path.join(original,'authoring.json')),author=JSON.parse(bytes),last=author.parts.at(-1);
 assert.equal(last.id,author.remainderPart,'new regions only before final remainder');
 const repaired={...author,parts:[...author.parts.slice(0,-1),...additions.map(({reason,...region})=>region),last],coverage:{...author.coverage,sourceCoordinateProvenance:'Existing automatic transferred landmarks and polygons retained. Independently reviewed source-space contour additions are inserted after every original non-remainder owner.',repairScope:'Only source-bound remainder paint in the recorded contour additions may change owner; no deleted, moved or newly synthesized source pixels.',nativeAcceptance:false}};
 fs.writeFileSync(path.join(candidate,'authoring.json'),JSON.stringify(repaired,null,2)+'\n',{flag:'wx'});
 const receipt={schema:'cf.c163-reviewed-authoring-regions/v1',id,sourceAuthoring:{path:path.relative(root,path.join(original,'authoring.json')),sha256:sha(bytes)},candidateAuthoringSha256:sha(fs.readFileSync(path.join(candidate,'authoring.json'))),sourceMasterSha256:sha(fs.readFileSync(path.join(original,'master.png'))),additions,landmarksChanged:false,existingPolygonsChanged:false,sourcePixelsChanged:false,repairCapUnchanged:0.05,qualityAccepted:false,remaining:'Exact ownership conservation, deterministic replay, unchanged intake/static and actual moving-paint/native review still required.'};
 fs.writeFileSync(path.join(candidate,'reviewed-regions.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
}
