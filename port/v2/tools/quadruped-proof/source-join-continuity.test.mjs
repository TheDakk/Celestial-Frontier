import test from 'node:test';import assert from 'node:assert/strict';
import {createSourceJoinProbe,assessSourceJoinContinuity} from './source-join-continuity.mjs';
function fixture(joints=['spine','hindNearKnee']){
 const width=joints.length*2,height=4,vertices=[],parts=[],skinParts=[],positions={};
 for(const[j,joint]of joints.entries()){
  const x=j*2,id='part'+j,first=vertices.length;vertices.push({x,y:0},{x:x+2,y:0},{x:x+2,y:height},{x,y:height});
  skinParts.push({id,vertices:[0,1,2,3].map(n=>({triangle:[first+n,first+n,first+n],barycentric:[1,0,0]})),indices:[0,1,2,0,2,3]});
  parts.push({id,joint,kind:'part',cutout:{x,y:0,width:2,height},frame:{x,y:0,width:2,height}});positions[id]=Float32Array.from([x/width,0,(x+2)/width,0,(x+2)/width,1,x/width,1]);
 }
 const rgba=new Uint8Array(width*height*4);for(let i=0;i<width*height;i++)rgba[i*4+3]=255;
 const record={recipeHash:'record',geometry:{width,height}},binding={recordRecipeHash:'record',bindingHash:'binding',atlasSha256:'atlas',atlasSize:{width,height},parts,paintSkin:{vertices,parts:skinParts}};
 return {record,binding,atlas:{rgba,width,height},positions};
}
test('resolves pelvis-rooted upper limb to torso and detects broken rendered attachment with unchanged rest',()=>{
 const f=fixture(),probe=createSourceJoinProbe(f);assert.equal(probe.joins.length,1);assert.equal(probe.joins[0].sourceEdges.length,4);assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'PASS');
 const separated={...f.positions,part1:f.positions.part1.map((v,i)=>v+(i%2?0:.125))};const bad=assessSourceJoinContinuity(probe,separated);
 assert.equal(bad.status,'FAIL');assert.equal(bad.maxGapPx,.5);assert.deepEqual(bad.joins[0].worst.source,[2,0]);
});
test('independent legs and non-nearest ancestral silhouette contacts remain explicitly excluded',()=>{
 const sibling=fixture(['spine','hindNearKnee','foreNearKnee']),a=createSourceJoinProbe(sibling);
 assert.equal(a.joins.length,1);assert.equal(a.excluded[0].reason,'independent sibling adjacency');
 const overlap=fixture(['spine','hindNearPaw','hindNearKnee']),b=createSourceJoinProbe(overlap);
 assert.equal(b.joins.length,1);assert.equal(b.joins[0].name,'part2--part1');assert.equal(b.excluded[0].reason,'non-nearest ancestral silhouette adjacency');
});
test('samples both piecewise-affine breakpoint inventories so a narrow gap cannot hide between pixel endpoints',()=>{
 const f=fixture(),skin=f.binding.paintSkin,p=skin.parts[1],index=skin.vertices.length;skin.vertices.push({x:2,y:1.125});p.vertices.push({triangle:[index,index,index],barycentric:[1,0,0]});p.indices=[0,1,4,1,2,4,2,3,4];
 f.positions.part1=Float32Array.from([...f.positions.part1,.5,1.125/4]);const probe=createSourceJoinProbe(f);
 assert(probe.joins[0].samples.some(s=>s.source[1]===1.125));assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'PASS');
 f.positions.part1[8]+=.1;const broken=assessSourceJoinContinuity(probe,f.positions);assert.equal(broken.status,'FAIL');assert(Math.abs(broken.maxGapPx-.4)<1e-6);assert.equal(broken.joins[0].worst.source[1],1.125);
});
test('refuses missing source coverage, overlapping ownership and nonfinite publication',()=>{
 const f=fixture(),empty=fixture();empty.atlas.rgba.fill(0);assert.throws(()=>createSourceJoinProbe(empty),/empty attachment inventory/);
 const overlap=fixture();overlap.binding.parts[1].cutout.x=1;assert.throws(()=>createSourceJoinProbe(overlap),/overlapping base ink/);
 const missing=fixture();missing.binding.paintSkin.parts[1].indices=[0,1,2];assert.throws(()=>createSourceJoinProbe(missing),/source attachment absent/);
 const probe=createSourceJoinProbe(f);f.positions.part1[0]=NaN;assert.throws(()=>assessSourceJoinContinuity(probe,f.positions),/published mesh/);
});
test('proximal body skin joins across bone siblings while distinct limbs stay independent',()=>{
 for(const [axial,upper]of [['neck','foreNearKnee'],['tail1','hindNearKnee']]){
  const f=fixture(['spine',axial,upper,'foreFarKnee']),probe=createSourceJoinProbe(f),join=probe.joins.find(j=>j.name==='part1--part2');
  assert.equal(join.rule,'proximal body-skin attachment');assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'PASS');
  f.positions.part2=f.positions.part2.map((v,i)=>v+(i%2?0:.05));const report=assessSourceJoinContinuity(probe,f.positions);
  assert.equal(report.status,'FAIL');assert(report.joins.find(j=>j.name===join.name).maxGapPx>.39);
  assert.equal(report.excluded.find(j=>j.name==='part2|part3').status,'OBSERVATION_ONLY');
 }
});

test('retained actual Civet strike: continuous C03 passes; branch-split C06 and incomplete-socket C07 fail',async()=>{
 const [{readFileSync},{createRequire},{fileURLToPath},{createCompiledSkinField,applyCompiledSkinField},{createArapScratch,solveArapSkin},{applyPaintPart},{GRAPH},{composeAffine,rotationAround,IDENTITY_AFFINE}]=await Promise.all([
  import('node:fs'),import('node:module'),import('node:url'),import('../creature-animation/compiled-skin-field.mjs'),import('../creature-animation/arap-skin.mjs'),import('../creature-animation/paint-skin.mjs'),import('../creature-animation/quadruped-template.mjs'),import('../creature-animation/kinematics.ts')]);
 const root=fileURLToPath(new URL('../../../../',import.meta.url)),read=p=>JSON.parse(readFileSync(root+p)),require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
 const record=read('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'),pose=read('audits/C2_CONTINUOUS_SKIN_20260916/native-03/report.json').skinGates.rows.find(r=>r.id==='civet').poses.strike.pose;
 const png=PNG.sync.read(readFileSync(root+'audits/C2_DEFORMING_SEAMS_20260914/candidate-02/civet-ink/atlas/civet.png')),atlas={rgba:png.data,width:png.width,height:png.height},matrices={},length=Math.hypot(...record.landmarks.chest.map((n,i)=>n-record.landmarks.pelvis[i]));
 for(const [joint,parent]of [['root',null],...GRAPH]){const p=record.landmarks[parent??'root'],v=pose[joint],local=v?rotationAround({x:p[0],y:p[1]},v.rotation??0,{x:(v.dx??0)*length,y:(v.dy??0)*length}):IDENTITY_AFFINE;matrices[joint]=parent?composeAffine(matrices[parent],local):local;}
 for(const [candidate,expected]of [['03','PASS'],['06','FAIL'],['07','FAIL']]){
  const binding=read('audits/C2_CONTINUOUS_SKIN_20260916/candidate-'+candidate+'/civet.binding.json'),skin=binding.paintSkin,probe=createSourceJoinProbe({record,binding,atlas}),target=new Float64Array(skin.vertices.length*2),field=new Float64Array(target.length),positions={};
  applyCompiledSkinField(createCompiledSkinField(skin,record.geometry.width,record.geometry.height),matrices,target);
  solveArapSkin(createArapScratch(skin.vertices,skin.triangles,record.geometry.width,record.geometry.height,skin.solver),target,field);
  for(const part of skin.parts){positions[part.id]=new Float32Array(part.vertices.length*2);applyPaintPart(part,field,positions[part.id]);}
  const report=assessSourceJoinContinuity(probe,positions);assert.equal(report.status,expected,'candidate '+candidate);
  if(candidate==='03')assert(report.maxGapPx<.0002);
  if(candidate==='06')assert(report.joins.find(j=>j.name==='torso--hind-far-upper').maxGapPx>90);
  if(candidate==='07'){assert(report.joins.filter(j=>j.rule==='nearest anatomical attachment').every(j=>!j.violations));assert(report.joins.find(j=>j.name==='neck--fore-far-upper').maxGapPx>25);}
 }
});

// A real family graph must drive the decoder guard too, not the quadruped graph.
test('fish spine and fin attachments use the declared graph; foreign joints and absent remainder refuse',()=>{
 const f=fixture(['spine2','dorsal']);f.record.template={id:'fish',version:1};f.binding.sourceJoinTopology={remainderPartId:'part0'};
 const probe=createSourceJoinProbe(f);assert.equal(probe.joins.length,1);assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'PASS');
 f.positions.part1[0]+=.125;assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'FAIL');
 const missing=structuredClone(f);delete missing.binding.sourceJoinTopology;assert.throws(()=>createSourceJoinProbe(missing),/explicit family remainder/);
 const wrong=structuredClone(f);wrong.binding.parts[1].joint='hindNearKnee';assert.throws(()=>createSourceJoinProbe(wrong),/unique known source owners/);
});

test('bin-edge rounding keeps present source coverage; true missing coverage and displaced publication still fail',()=>{
 const f=fixture();f.record.geometry={width:64,height:64};f.atlas={width:64,height:64,rgba:new Uint8Array(64*64*4).fill(255)};f.binding.atlasSize={width:64,height:64};
 for(const p of f.binding.parts)for(const box of[p.cutout,p.frame])for(const k of['x','y','width','height'])box[k]*=16;
 for(const v of f.binding.paintSkin.vertices){v.x*=16;v.y*=16;}
 // The bear's reconstructed edge fell in bin 15 while its exact source edge
 // queried bin 16. Keep that numerical error; do not snap source geometry.
 f.binding.paintSkin.vertices[1].x-=1e-12;f.binding.paintSkin.vertices[2].x-=1e-12;
 const probe=createSourceJoinProbe(f);assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'PASS');
 const missing=structuredClone(f);missing.binding.paintSkin.parts[0].indices=[0,2,3];assert.throws(()=>createSourceJoinProbe(missing),/source attachment absent/);
 f.positions.part1=f.positions.part1.map((v,i)=>v+(i%2?0:.01));assert.equal(assessSourceJoinContinuity(probe,f.positions).status,'FAIL');
});
