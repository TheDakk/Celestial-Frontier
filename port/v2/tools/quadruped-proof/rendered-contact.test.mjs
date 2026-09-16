import test from 'node:test';import assert from 'node:assert/strict';
import {createRenderedContactProbe,assessRenderedContacts} from './rendered-contact.mjs';
const identity=[1,0,0,1,0,0];
function fixture(){
 const vertices=[{x:1,y:1},{x:5,y:1},{x:5,y:5},{x:1,y:5}],part={id:'paw',vertices:vertices.map((_,i)=>({triangle:[i,i,i],barycentric:[1,0,0]})),indices:[0,1,2,0,2,3]};
 const record={recipeHash:'record',geometry:{width:10,height:10,groundLineY:.9},landmarks:{foreNearPaw:[.3,.4]}},binding={recordRecipeHash:'record',bindingHash:'binding',atlasSha256:'atlas',atlasSize:{width:4,height:4},paintSkin:{vertices,parts:[part]},parts:[{id:'paw',joint:'foreNearPaw',kind:'part',cutout:{x:1,y:1,width:4,height:4},frame:{x:0,y:0,width:4,height:4}}]};
 const rgba=new Uint8Array(4*4*4);for(let i=0;i<16;i++)rgba[i*4+3]=255;
 return {record,binding,atlas:{width:4,height:4,rgba},positions:Float64Array.from(vertices.flatMap(v=>[v.x/10,v.y/10]))};
}
test('samples actual lowest alpha and retains perspective offsets rather than flattening paws',()=>{
 const f=fixture();f.atlas.rgba[(3*4+0)*4+3]=0;f.atlas.rgba[(3*4+1)*4+3]=1;const probe=createRenderedContactProbe(f);
 assert.equal(probe.feet[0].samples.length,4);assert.deepEqual(probe.feet[0].samples[0].source,[1.5,3.5]);assert.equal(probe.feet[0].samples[1].sourceAlpha,1);
 assert.equal(probe.feet[0].samples[0].perspectiveOffsetPx,-5.5);
 const result=assessRenderedContacts(probe,{positionsByPart:{paw:f.positions},matrices:{foreNearPaw:identity},planted:true});
 assert(result.maxRenderedRestDisplacementPx<1e-12);assert.equal(result.maxBoneErrorPx,0);
});
test('negative control exposes drifting painted contact with a perfectly fixed skeleton',()=>{
 const f=fixture(),probe=createRenderedContactProbe(f),drift=f.positions.slice();for(let i=1;i<drift.length;i+=2)drift[i]+=.2;
 const result=assessRenderedContacts(probe,{positionsByPart:{paw:drift},matrices:{foreNearPaw:identity},planted:true});
 assert.equal(result.maxBoneErrorPx,0);assert(Math.abs(result.maxRenderedRestDisplacementPx-2)<1e-12);assert(Math.abs(result.maxRenderedPawTransformErrorPx-2)<1e-12);
 assert(result.feet[0].maxVerticalDriftPx>1.99);assert.equal(result.feet[0].maxHorizontalDriftPx,0);
});
test('airborne rigid translation separates intended motion from skin-following error',()=>{
 const f=fixture(),probe=createRenderedContactProbe(f),moving=f.positions.map((v,i)=>v+(i%2?-.1:.2));
 const result=assessRenderedContacts(probe,{positionsByPart:new Map([['paw',moving]]),matrices:{foreNearPaw:[1,0,0,1,.2,-.1]},planted:false});
 assert(Math.abs(result.maxBoneErrorPx-Math.sqrt(5))<1e-12);assert(result.maxRenderedPawTransformErrorPx<1e-12);assert(result.maxRenderedRestDisplacementPx>2);
});
test('refuses missing source ink, uncovered painted contour, wrong binding and malformed published buffers',()=>{
 const f=fixture();assert.throws(()=>createRenderedContactProbe({...f,record:{...f.record,recipeHash:'wrong'}}),/binding/);
 const empty=fixture();empty.atlas.rgba.fill(0);assert.throws(()=>createRenderedContactProbe(empty),/empty painted paw/);
 const missing=fixture();missing.binding.paintSkin.parts[0].indices=[0,1,2];assert.throws(()=>createRenderedContactProbe(missing),/missing from mesh/);
 const probe=createRenderedContactProbe(f);assert.throws(()=>assessRenderedContacts(probe,{positionsByPart:{paw:[0,0]},matrices:{foreNearPaw:identity},planted:true}),/published mesh/);
 assert.throws(()=>assessRenderedContacts(probe,{positionsByPart:{paw:f.positions},matrices:{},planted:true}),/paw matrix/);
});
