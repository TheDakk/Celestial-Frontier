import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createRequire}from'node:module';import{ownerRaster}from'../../port/v2/tools/anatomy-verify/limb-separation.mjs';import{projectContactEndpoints}from'./project-contact.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('./contact-ownership.json',import.meta.url))),root=new URL('../../',import.meta.url),read=r=>JSON.parse(fs.readFileSync(new URL(r.packet+'/authoring.json',root))),require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
test('candidate changes only mismatched contract endpoints; every new point has independently measured own-part alpha',async()=>{
 for(const r of rows){const a=read(r),saved=JSON.stringify(a),result=projectContactEndpoints(a,r.points),{data,info}=await sharp(new URL(r.master,root).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true}),owners=ownerRaster(a.parts,info.width,info.height),rem=a.parts.findIndex(p=>p.id===a.remainderPart);
 assert.equal(JSON.stringify(a),saved);assert.deepEqual(result.authoring.parts,a.parts);const allowed=new Set(result.moves.map(x=>x.joint));for(const [joint,point]of Object.entries(a.landmarksPx))if(!allowed.has(joint))assert.deepEqual(result.authoring.landmarksPx[joint],point);
 for(const m of result.moves){const p=result.authoring.landmarksPx[m.joint],i=Math.floor(p[1])*info.width+Math.floor(p[0]),owner=owners[i]<0?rem:owners[i];assert.ok(data[i*4+3]>0);assert.equal(a.parts[owner].id,m.toOwner);assert.equal(r.points.find(x=>x.joint===m.joint).role,'end');}
 }
});
test('already owned Mongoose geometry is byte-identical and does not authorize another red run',()=>{
 const r=rows.find(r=>r.id==='08-mongoose'),a=read(r),result=projectContactEndpoints(a,r.points);assert.equal(JSON.stringify(result.authoring),JSON.stringify(a));assert.deepEqual(result.moves,[]);
});
test('erased owner and stale observations refuse instead of manufacturing support',()=>{
 const r=rows.find(r=>r.id==='sparrow'),a=read(r),p=r.points.find(p=>p.role==='end'&&p.actualPart!==p.expectedPart);assert.throws(()=>projectContactEndpoints(a,[{...p,ownedPixels:0,nearestOwnedPixel:null}]),/no observed paint/);assert.throws(()=>projectContactEndpoints(a,[{...p,point:[0,0]}]),/stale endpoint/);
});
