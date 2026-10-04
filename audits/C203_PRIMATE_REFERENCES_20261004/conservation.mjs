import fs from'node:fs';import assert from'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{acquireWorkspaceLock}from'../../port/v2/tools/workspacelock.mjs';
const {PNG}=createRequire(process.cwd()+'/port/v2/package.json')('pngjs'),B='audits/C203_PRIMATE_REFERENCES_20261004',J=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const release=acquireWorkspaceLock('C203 exact source ownership/conservation controls');
function read(packet,duplicate=false){const record=J(packet+'/fit01/record.json'),binding=J(packet+'/fit01/binding.json'),m=J(packet+'/fit01/parts/manifest.json'),atlas=PNG.sync.read(fs.readFileSync(packet+'/fit01/parts/atlas/'+m.creatureId+'.png')),w=record.geometry.width,h=record.geometry.height,rgba=Buffer.alloc(w*h*4),owner=Array(w*h).fill(null);
 if(duplicate)binding.parts.push(structuredClone(binding.parts[0]));
 for(const part of binding.parts)for(let y=0;y<part.cutout.height;y++)for(let x=0;x<part.cutout.width;x++){const a=((part.frame.y+y)*atlas.width+part.frame.x+x)*4;if(!atlas.data[a+3])continue;const i=(part.cutout.y+y)*w+part.cutout.x+x;assert.equal(owner[i],null,'base source pixel has one owner');owner[i]=part.joint;rgba.set(atlas.data.subarray(a,a+4),i*4);}
 return{record,binding,rgba,owner};}
try{const rows=[];for(const [old,current]of [['17-gorilla-observed-joins','03-gorilla-observed-joins'],['15-howler-observed-joins','04-howler-observed-joins']]){
 const source='audits/C202_PRIMATE_REFERENCES_20261004/'+old,candidate=B+'/'+current,a=read(source),b=read(candidate),map={armNearShoulder:'armNearElbow',armFarShoulder:'armFarElbow',armNearElbow:'armNearHand',armFarElbow:'armFarHand'},counts={};
 assert.deepEqual(a.rgba,b.rgba,'all actual keyed source RGBA preserved');assert.deepEqual(a.record.landmarks,b.record.landmarks);assert.deepEqual(a.record.geometry,b.record.geometry);assert.deepEqual(a.record.materials,b.record.materials);assert.deepEqual(a.record.anatomy,b.record.anatomy);
 for(let i=0;i<a.owner.length;i++){assert.equal(b.owner[i],map[a.owner[i]]??a.owner[i],'only named anatomical arm owners may move');if(a.owner[i]!==b.owner[i]){const k=a.owner[i]+' -> '+b.owner[i];counts[k]=(counts[k]??0)+1;}}
 assert.equal(sha(fs.readFileSync(source+'/master.png')),sha(fs.readFileSync(candidate+'/master.png')));
 assert.throws(()=>read(candidate,true),/base source pixel has one owner/);
 // A one-pixel reassignment outside the arm must be caught by this oracle.
 const index=a.owner.findIndex(v=>v==='head');assert(index>=0);const changed=b.owner.slice();changed[index]='root';assert.throws(()=>assert.equal(changed[index],map[a.owner[index]]??a.owner[index]));
 const mutant=Buffer.from(b.rgba),visible=b.owner.findIndex(Boolean);mutant[visible*4]^=1;assert.notDeepEqual(mutant,a.rgba);
 rows.push({source,candidate,sourceOriginalSha256:sha(fs.readFileSync(source+'/master.png')),keyedRGBAHash:sha(a.rgba),changedRGBAChannels:0,landmarksGeometryMaterialsPresenceUnchanged:true,anatomicalOwnerChanges:counts,allNonArmOwnersUnchanged:true,controls:['wrong head owner rejected','one visible RGB channel mutation rejected','duplicate source paint rejected'],d28AutomaticRepairApplied:false,qualification:false});
 }
 fs.writeFileSync(B+'/conservation.json',JSON.stringify({schema:'cf.c203-primate-source-conservation/v1',status:'PASS_SOURCE_CONTROLS',rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
}finally{release();}
