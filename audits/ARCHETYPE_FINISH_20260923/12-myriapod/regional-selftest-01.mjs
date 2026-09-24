/** One packet-local compiler selftest. Synthetic geometry, not a real intake or film. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {registerHooks} from 'node:module';
import {execFileSync} from 'node:child_process';

const root='/Users/nick/Projects/celestial-frontier-openai-mac',packet=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(packet,'regional-selftest-01'),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert(!fs.existsSync(out),'Fresh selftest output required');fs.mkdirSync(out);
const sources=new Map(),remember=file=>{if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return;const bytes=fs.readFileSync(file),hash=sha(bytes),old=sources.get(file);assert(!old||old.sha256===hash,'Source changed during selftest: '+file);if(!old){const copy=path.join(out,'sources',path.relative(root,file));fs.mkdirSync(path.dirname(copy),{recursive:true});fs.writeFileSync(copy,bytes,{flag:'wx'});sources.set(file,{path:file,sha256:hash,retained:path.relative(out,copy)});}};
for(const name of ['intake-01.mjs','regional-influences.mjs','regional-authoring-schema.md','regional-selftest-01.mjs'])remember(path.join(packet,name));
const hook=registerHooks({load(url,context,nextLoad){const result=nextLoad(url,context);if(url.startsWith('file:'))remember(fileURLToPath(url));return result;}});
const report={schema:'cf.packet-regional-selftest/v1',status:'RUNNING',command:[process.execPath,fileURLToPath(import.meta.url)],node:process.version,sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),scope:'Synthetic 32-texture-part, 63-joint compiler controls; actual skeleton/ARAP/part interpolation. No real painting intake, raster conservation, static battery, contact admission, browser, film or CPU acceptance.',cases:[]};
const json=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
try{
  const {compileRegionalInfluences}=await import('./regional-influences.mjs');
  const {familyContract,familyContractForRecord}=await import('../../../port/v2/tools/creature-animation/family-contracts.mjs');
  const {sealFamilyRecord}=await import('../../../port/v2/tools/creature-animation/family-record.mjs');
  const {hashJSON}=await import('../../../port/v2/tools/creature-animation/quadruped-template.mjs');
  const {createSkeletonPoseProgram}=await import('../../../port/v2/tools/creature-animation/skeleton-pose.mjs');
  const {applyPaintSkin,applyPaintPart,assertPaintPartShape}=await import('../../../port/v2/tools/creature-animation/paint-skin.mjs');
  const {createArapScratch,solveArapSkin}=await import('../../../port/v2/tools/creature-animation/arap-skin.mjs');
  const width=256,height=256,parts=[],vertices=[],fields=[],triangles=[],pins=[],regions=[],rgba=new Uint8Array(width*height*4),landmarks={},fixedAttachments={},ownerForJoint=new Map();
  const norm=p=>[p[0]/width,p[1]/height];
  function part(id,joint,kind){
    const index=parts.length,x=(index%8)*32,y=Math.floor(index/8)*32,first=vertices.length,points=[];
    if(kind==='head'){for(const dy of [4,12,20])for(const dx of [4,12,20])points.push([x+dx,y+dy]);}
    else points.push([x+4,y+4],[x+20,y+4],[x+4,y+20],[x+20,y+20]);
    const local=[];
    if(kind==='head'){for(let r=0;r<2;r++)for(let c=0;c<2;c++){const a=r*3+c;local.push(a,a+1,a+3,a+1,a+4,a+3);}}
    else local.push(0,1,2,1,3,2);
    vertices.push(...points.map(([x,y])=>({x,y,weights:[[joint,1]]})));
    const field={id,vertices:points.map((_,i)=>{const k=local.findIndex(v=>v===i),tri=local.slice(Math.floor(k/3)*3,Math.floor(k/3)*3+3);return{triangle:tri.map(v=>first+v),barycentric:tri.map(v=>Number(v===i))};}),indices:local,fieldTriangles:local.map(i=>first+i)};
    fields.push(field);triangles.push(...field.fieldTriangles);
    const box={x,y,width:24,height:24};parts.push({id,joint,kind:'part',layer:'near',cutout:box,frame:{...box}});
    for(let py=y;py<y+24;py++)for(let px=x;px<x+24;px++)rgba.set([90,130,170,255],(py*width+px)*4);
    ownerForJoint.set(joint,id);return{x,y,first,points,field};
  }
  const body=part('body','root','quad');landmarks.root=norm([12,12]);pins.push(...body.points.map((_,i)=>body.first+i));
  const head=part('head','head','head');landmarks.head=norm([head.x+12,head.y+12]);fixedAttachments.head=norm([head.x+2,head.y+12]);
  for(const [joint,i]of [['mandible',6],['antennaFar',2],['antennaNear',8]]){const [x,y]=head.points[i];landmarks[joint]=norm([x,y]);ownerForJoint.set(joint,'head');regions.push({id:'head-'+joint.toLowerCase(),partId:'head',joint,polygonPx:[[x-2,y-2],[x+2,y-2],[x+2,y+2],[x-2,y+2]],pin:true});}
  for(let n=0;n<14;n++)for(const side of ['Far','Near']){
    const stem='leg'+n+side,id='leg'+n+'-'+side.toLowerCase(),knee=stem+'Knee',foot=stem+'Foot',p=part(id,foot,'quad');
    landmarks[knee]=norm([p.x+12,p.y+12]);landmarks[foot]=norm(p.points[3]);fixedAttachments[knee]=norm([p.x+12,p.y+2]);ownerForJoint.set(knee,id);
    pins.push(p.first+3);regions.push({id:id+'-proximal',partId:id,joint:knee,polygonPx:[[p.x+2,p.y+2],[p.x+22,p.y+2],[p.x+22,p.y+6],[p.x+2,p.y+6]],pin:true});
  }
  for(const side of ['Far','Near']){const joint='ultimate'+side,p=part('ultimate-'+side.toLowerCase(),joint,'quad');landmarks[joint]=norm(p.points[3]);fixedAttachments[joint]=norm([p.x+2,p.y+2]);}
  const family=familyContract('myriapod');
  const record=await sealFamilyRecord({kind:'myriapod',template:{id:'myriapod',version:family.version},clipSetId:family.clipSetId,identity:{speciesVisualKey:'synthetic-regional-selftest',seed:1,ownerId:'packet-selftest',earthName:'Synthetic compiler fixture'},anatomy:{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{walkingLegPairs:14,ultimateLegPairs:1}},geometry:{width,height,cutoutAssetHash:sha(rgba),groundLineY:1,depthLayers:[{id:'far',order:0},{id:'near',order:1}],fixedAttachments},landmarks,materials:{surface:'chitin'}});
  const skin={schema:'cf.paint-skin/v1',vertices,triangles,parts:fields,solver:{iterations:4,globalIterations:4,targetWeight:.35,pins:pins.sort((a,b)=>a-b)}};
  const bodyBinding={schema:'cf.creature-parts/v1',recordRecipeHash:record.recipeHash,atlasSha256:sha(rgba),atlasSize:{width,height},parts,paintSkin:skin,sourceJoinTopology:{remainderPartId:'body'}};
  const binding={...bodyBinding,bindingHash:await hashJSON(bodyBinding)},atlas={rgba,width,height},input={binding,record,atlas,regions};
  const reseal=async value=>{const{bindingHash,...body}=value;return{...body,bindingHash:await hashJSON(body)};};
  const run=async(name,fn)=>{const details=await fn();report.cases.push({name,status:'PASS',...details});console.log('PASS '+name);};
  let compiled;
  await run('compile 32 texture owners and preserve standard seals, source geometry, pins and all 63 influences',async()=>{
    const original=structuredClone({binding,record,regions});compiled=await compileRegionalInfluences(input);
    assert.equal(parts.length,32);assert.equal(familyContractForRecord(record).joints.length,63);assert.equal(Object.keys(fixedAttachments).length,31);
    assert.deepEqual({binding,record,regions},original);assert.deepEqual(compiled.binding.parts,binding.parts);assert.deepEqual(compiled.binding.paintSkin.parts,binding.paintSkin.parts);assert.deepEqual(compiled.binding.paintSkin.triangles,binding.paintSkin.triangles);
    assert.deepEqual(compiled.binding.paintSkin.vertices.map(({weights,...v})=>v),binding.paintSkin.vertices.map(({weights,...v})=>v));
    for(const i of pins){assert(compiled.binding.paintSkin.solver.pins.includes(i));assert.deepEqual(compiled.binding.paintSkin.vertices[i].weights,binding.paintSkin.vertices[i].weights);}
    const {bindingHash,...body}=compiled.binding;assert.equal(await hashJSON(body),bindingHash);assert.notEqual(bindingHash,binding.bindingHash);
    assert.equal(compiled.receipt.sourceGeometryHashBefore,compiled.receipt.sourceGeometryHashAfter);assert.equal(compiled.receipt.regions.length,31);
    json('synthetic-record.json',record);json('synthetic-input-binding.json',binding);json('synthetic-regions.json',regions);json('synthetic-output-binding.json',compiled.binding);json('compiler-receipt.json',compiled.receipt);
    return{parts:parts.length,joints:63,regions:regions.length,vertices:vertices.length,triangles:triangles.length/3,inheritedPins:pins.length,additionalPins:compiled.receipt.additionalPins,bindingHash:compiled.binding.bindingHash};
  });
  const program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks);
  function renderer(binding){const s=binding.paintSkin,scratch=createArapScratch(s.vertices,s.triangles,width,height,s.solver),target=new Float64Array(s.vertices.length*2),field=new Float32Array(target.length);return pose=>{applyPaintSkin(s,program.evaluate(pose),width,height,target);solveArapSkin(scratch,target,field);const published=new Map();for(const part of s.parts){const positions=new Float32Array(part.vertices.length*2);applyPaintPart(part,field,positions);assertPaintPartShape(part,s,positions,width,height);published.set(part.id,positions);}return{published,field:field.slice(),target:target.slice()};};}
  function movement(render,joint){const rest=render({}),posed=render({[joint]:{rotation:.025}}),id=ownerForJoint.get(joint),a=rest.published.get(id),b=posed.published.get(id);let max=0;for(let i=0;i<a.length;i+=2)max=Math.max(max,Math.hypot((b[i]-a[i])*width,(b[i+1]-a[i+1])*height));assert(max>0,'no published owned mesh motion for '+joint);return{joint,partId:id,maxPublishedMotionPx:max};}
  await run('real skeleton, ARAP and part interpolation move every declared joint; exact rest is retained',async()=>{
    const render=renderer(compiled.binding),rest=render({});for(let i=0;i<vertices.length;i++){assert.equal(rest.field[i*2],vertices[i].x/width);assert.equal(rest.field[i*2+1],vertices[i].y/height);}
    const rows=program.jointNames.map(j=>movement(render,j));json('joint-motion.json',rows);return{jointPoses:rows.length,zeroMotion:rows.filter(r=>r.maxPublishedMotionPx===0).length,restCoordinateChanges:0};
  });
  await run('proximal Knee shape remains independent of Foot rotation while inherited Foot contact pin follows Foot',async()=>{
    const render=renderer(compiled.binding),rest=render({}),posed=render({leg0FarFoot:{rotation:.025}}),region=compiled.receipt.regions.find(r=>r.joint==='leg0FarKnee');
    for(const i of region.vertexIndices){assert.equal(posed.field[i*2],rest.field[i*2]);assert.equal(posed.field[i*2+1],rest.field[i*2+1]);}
    const owner=fields.find(p=>p.id==='leg0-far'),end=owner.vertices[3].triangle[owner.vertices[3].barycentric.indexOf(1)];
    assert.notDeepEqual(Array.from(posed.field.slice(end*2,end*2+2)),Array.from(rest.field.slice(end*2,end*2+2)));
    assert.equal(posed.field[end*2],Math.fround(posed.target[end*2]));assert.equal(posed.field[end*2+1],Math.fround(posed.target[end*2+1]));
    return{proximalPins:region.vertexIndices.length,footPin:end};
  });
  await run('motion oracle rejects erased secondary influence and a frozen walking part',async()=>{
    const erased=structuredClone(compiled.binding);for(const v of erased.paintSkin.vertices){const weights=new Map();for(const[j,n]of v.weights){const owner=j==='antennaFar'?'head':j;weights.set(owner,(weights.get(owner)??0)+n);}v.weights=[...weights];}
    assert.throws(()=>movement(renderer(erased),'antennaFar'),/no published owned mesh motion/);
    const frozen=structuredClone(compiled.binding),part=frozen.paintSkin.parts.find(p=>p.id==='leg0-far');for(const i of new Set(part.vertices.flatMap(v=>v.triangle)))frozen.paintSkin.vertices[i].weights=[['root',1]];
    assert.throws(()=>movement(renderer(frozen),'leg0FarFoot'),/no published owned mesh motion/);
    return{detectedMutants:['erased antennaFar influence','root-frozen leg0-far']};
  });
  await run('unknown joint refuses before output',async()=>{const changed=structuredClone(regions);changed[0].joint='inventedJoint';await assert.rejects(compileRegionalInfluences({...input,regions:changed}),/unknown region joint/);});
  await run('conflicting regional and inherited pins refuse rather than overwriting locks',async()=>{
    const changed=structuredClone(binding),r=regions.find(r=>r.joint==='leg0FarKnee'),i=compiled.receipt.regions.find(row=>row.id===r.id).vertexIndices[0];
    changed.paintSkin.vertices[i].weights=[['root',1]];changed.paintSkin.solver.pins.push(i);changed.paintSkin.solver.pins.sort((a,b)=>a-b);
    await assert.rejects(compileRegionalInfluences({...input,binding:await reseal(changed)}),/conflicts with preserved pin/);
    await assert.rejects(compileRegionalInfluences({...input,regions:[...regions,{...r,id:'conflicting-proximal-foot',joint:'leg0FarFoot'}]}),/conflicting regional joints/);
  });
  await run('no owned paint and paint without a selected support each refuse',async()=>{
    const changed=structuredClone(regions);changed[0].polygonPx=[[200,200],[205,200],[205,205],[200,205]];
    await assert.rejects(compileRegionalInfluences({...input,regions:changed}),/contains no positive-alpha paint/);
    changed[0].polygonPx=[[head.x+7,head.y+7],[head.x+9,head.y+7],[head.x+9,head.y+9],[head.x+7,head.y+9]];
    await assert.rejects(compileRegionalInfluences({...input,regions:changed}),/selects no existing field supports/);
  });
  await run('stale record and binding seals refuse',async()=>{
    await assert.rejects(compileRegionalInfluences({...input,record:{...record,materials:{surface:'changed'}}}),/input record hash/);
    const changed=structuredClone(binding);changed.paintSkin.vertices[0].x+=1;await assert.rejects(compileRegionalInfluences({...input,binding:changed}),/input binding hash/);
  });
  await run('unlocked seed survives diffusion and produces published secondary motion',async()=>{
    const soft=regions.map(r=>({...r,pin:false})),result=await compileRegionalInfluences({...input,regions:soft});
    assert.equal(result.receipt.additionalPins,0);assert.deepEqual(result.binding.paintSkin.solver.pins,pins);
    const row=movement(renderer(result.binding),'antennaFar');return{additionalPins:0,...row};
  });
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;console.error(report.error);}
finally{
  hook.deregister();report.finishedAt=new Date().toISOString();report.sources=[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path)).map(s=>({...s,afterSha256:fs.existsSync(s.path)?sha(fs.readFileSync(s.path)):null}));
  if(report.sources.some(s=>s.sha256!==s.afterSha256)){report.status='FAIL';report.sourceDrift=true;process.exitCode=1;}
  json('report.json',report);console.log(JSON.stringify({status:report.status,passedCases:report.cases.length,sourceFiles:report.sources.length,out}));
}
