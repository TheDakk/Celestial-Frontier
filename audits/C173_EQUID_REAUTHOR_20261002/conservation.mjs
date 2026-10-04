// Deferred CPU check. This measures the new authorings; it never repairs pixels.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {authoredRegionOwners} from '../../port/v2/tools/creature-animation/authored-region-owners.mjs';
import {placeRemainderIslands,MAX_SHARE} from '../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url));
const {PNG}=require('pngjs');
const base='audits/C173_EQUID_REAUTHOR_20261002';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
function replay(author,key,w,h){
  const owners=authoredRegionOwners(author.parts,author.remainderPart);
  const polygons=author.parts.map(p=>p.polygonPx.map(([x,y])=>[x/w,y/h]));
  const rem=author.parts.findIndex(p=>p.id===author.remainderPart),labels=new Uint8Array(w*h);
  for(let i=0;i<labels.length;i++)if(key[i*4+3]){
    const found=polygons.findIndex(p=>inside((i%w+.5)/w,(Math.floor(i/w)+.5)/h,p));
    labels[i]=owners.ownerIndex[found<0?rem:found]+1;
  }
  return{labels,parts:owners.ownerParts};
}
function compiled(fit,parts){
  const own=PNG.sync.read(read(fit+'/parts/ownership.png'));
  const colors=new Map(parts.map((_,i)=>{const k=i+1;return[`${(k*83)%200+35},${(k*137)%200+35},${(k*47)%200+35}`,k];}));
  return Uint8Array.from({length:own.width*own.height},(_,i)=>{
    if(!own.data[i*4+3])return 0;
    const value=colors.get(`${own.data[i*4]},${own.data[i*4+1]},${own.data[i*4+2]}`);
    assert(value,'unknown compiled owner color');return value;
  });
}
function cap(labels,w,h,remainder,parts){
  try{const c=placeRemainderIslands(labels,w,h,remainder);return{status:'PASS',remainderPixels:c.remainderPixels,movedPixelsIfPlacementWereRequested:c.moved,
    islands:c.islands.map(s=>({...s,to:s.to===null?null:parts[s.to-1].joint,border:Object.fromEntries(Object.entries(s.border).map(([k,v])=>[parts[Number(k)-1].joint,v]))})),placementApplied:false};}
  catch(error){return{status:'REFUSED',reason:String(error.message),placementApplied:false};}
}
assert.equal(MAX_SHARE,.05);
// A 2-pixel disconnected component among 22 remainder pixels exceeds 5%.
const capControl=new Uint8Array(80);for(let i=0;i<20;i++)capControl[i]=1;capControl[70]=capControl[71]=1;
assert.throws(()=>placeRemainderIslands(capControl,10,8,1),/structural, not a sliver/);
const rows=[];
for(const input of json(base+'/inputs.json').rows){
  const dir=base+'/'+input.id,row={id:input.id,status:'RUNNING',qualityAccepted:false,nativeAcceptance:false};
  try{
    for(const pin of input.inputs)assert.equal(sha(read(pin.path)),pin.sha256,'frozen source input changed');
    const a=json(input.originalPacket+'/authoring.json'),b=json(input.packet+'/authoring.json'),edit=json(dir+'/authoring-delta.json');
    assert.equal(sha(read(input.originalPacket+'/master.png')),sha(read(input.packet+'/master.png')));
    for(const name of ['subject-source.json','presence.json'])assert.deepEqual(read(input.originalPacket+'/'+name),read(input.packet+'/'+name));
    assert.equal(a.groundLineY,b.groundLineY);
    for(const [joint,point] of Object.entries(a.landmarksPx))if(!Object.hasOwn(edit.earLandmarks,joint))assert.deepEqual(point,b.landmarksPx[joint]);
    const key=PNG.sync.read(read(input.originalFit+'/parts/keyed.png')),candidateKey=PNG.sync.read(read(input.fit+'/parts/keyed.png'));
    assert.equal(key.width,1254);assert.equal(key.height,1254);assert.equal(candidateKey.width,key.width);assert.equal(candidateKey.height,key.height);
    assert.deepEqual(key.data,candidateKey.data,'exact keyed RGBA');
    const {width:w,height:h}=key,original=replay(a,key.data,w,h),candidate=replay(b,key.data,w,h);
    assert.deepEqual(original.labels,compiled(input.originalFit,original.parts),'original independent priority replay');
    assert.deepEqual(candidate.labels,compiled(input.fit,candidate.parts),'candidate independent priority replay');
    assert.deepEqual(candidate.labels,replay(b,key.data,w,h).labels,'deterministic replay');
    assert.deepEqual(original.parts.map(p=>[p.id,p.joint,p.layer]).sort(),candidate.parts.map(p=>[p.id,p.joint,p.layer]).sort());
    const rawCandidateLabels=candidate.labels;
    const map=candidate.parts.map(p=>original.parts.findIndex(q=>q.joint===p.joint)+1);
    const after=Uint8Array.from(rawCandidateLabels,v=>v?map[v-1]:0);
    const scope=edit.parts.flatMap(p=>[p.original,p.candidate]);
    scope.push(a.parts.find(p=>p.id==='root').polygonPx);
    const inScope=i=>scope.some(p=>inside(i%w+.5,Math.floor(i/w)+.5,p));
    function compare(labels){
      const transitions={},outside=[],tailTheft=[];
      for(let i=0;i<labels.length;i++){
        assert.equal(Boolean(original.labels[i]),Boolean(labels[i]),'paint deletion/addition');
        if(original.labels[i]===labels[i])continue;
        if(!inScope(i))outside.push([i%w,Math.floor(i/w)]);
        const from=original.parts[original.labels[i]-1].joint,to=original.parts[labels[i]-1].joint;
        if(from.startsWith('tail'))tailTheft.push([i%w,Math.floor(i/w),from,to]);
        const k=from+' -> '+to;transitions[k]=(transitions[k]??0)+1;
      }
      assert.equal(outside.length,0,'ownership changed outside recorded contour scope');
      return{transitions,priorTailOwnerPixelsChanged:tailTheft.length,firstPriorTailOwnerChanges:tailTheft.slice(0,20)};
    }
    const changes=compare(after);
    const outside=original.labels.findIndex((value,i)=>value&&!inScope(i));
    assert(outside>=0,'negative control needs actual positive paint outside the edited contours');
    const theft=Uint8Array.from(after);theft[outside]=theft[outside]===1?2:1;
    assert.throws(()=>compare(theft),/outside recorded contour scope/);
    const deletion=Uint8Array.from(after);deletion[outside]=0;assert.throws(()=>compare(deletion),/paint deletion/);
    const originalRemainder=original.parts.findIndex(p=>p.id===a.remainderPart)+1,candidateRemainder=candidate.parts.findIndex(p=>p.id===b.remainderPart)+1;
    const originalCap=cap(original.labels,w,h,originalRemainder,original.parts),candidateCap=cap(rawCandidateLabels,w,h,candidateRemainder,candidate.parts);
    const ownerAt=(labels,parts,x,y)=>parts[labels[y*w+x]-1]?.joint??null;
    const attributed=input.id==='wild-pony'?[[871,353],[882,341]].map(([x,y])=>({sourcePixel:[x,y],original:ownerAt(original.labels,original.parts,x,y),candidate:ownerAt(after,original.parts,x,y)})):[];
    Object.assign(row,{status:candidateCap.status==='PASS'&&changes.priorTailOwnerPixelsChanged===0?'MECHANICAL_PASS':'HELD',
      sourceMasterSha256:sha(read(input.packet+'/master.png')),sourceRgbaChangedChannels:0,keyedRgbaChangedChannels:0,paintPixelsRemoved:0,paintPixelsAdded:0,
      unchangedNonEarLandmarks:true,unchangedGround:true,unchangedAnatomicalOwnerInventory:true,independentReplay:true,compiledLabelsEqual:true,
      ...changes,sourceAttributedPonyPixels:attributed,unchangedD28Cap:MAX_SHARE,originalCap,candidateCap,
      controls:['exact original and candidate compiled-label replay','deterministic replay','exact original/keyed RGBA conservation','unreviewed ownership theft refuses','paint deletion refuses','synthetic island over 5% refuses'],
      scope:'Mechanical evidence only. Placement is not applied. Full-size ownership and actual published moving paint still require review.'});
  }catch(error){Object.assign(row,{status:'REFUSED',reason:String(error.stack??error).replaceAll(/\/Users\/[^/\s"\\]+/g,'~')});}
  rows.push(row);write(dir+'/conservation.json',row);console.log(JSON.stringify({id:row.id,status:row.status,reason:row.reason??null}));
}
write(base+'/conservation.json',{schema:'cf.c173-equid-conservation/v1',rows,qualityAccepted:false,nativeAcceptance:false});
if(rows.some(r=>r.status==='REFUSED'))process.exitCode=1;
