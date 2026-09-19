import test from 'node:test';import assert from 'node:assert/strict';
import {rigidUnderlapSupport} from './underlap-support.mjs';
const I=[1,0,0,1,0,0];
function fixture(){const rgba=new Uint8Array(8*8*4);rgba[(3*8+3)*4+3]=255;return{width:20,height:20,cutout:{x:6,y:6,width:8,height:8},rgba,ancestorMatrix:I,target:[9,9]};}
test('complete descendant support distinguishes a missing band from absent source ink',()=>{
 const args=fixture();assert.equal(rigidUnderlapSupport(args).status,'SOURCE_INK_POSSIBLE');
 // Removing a permitted band's source pixel is fixable by copying that pixel.
 const empty={...args,rgba:new Uint8Array(args.rgba.length)};
 assert.equal(rigidUnderlapSupport(empty).status,'NO_SOURCE_INK');
 assert.equal(rigidUnderlapSupport({...args,target:[16,16]}).maximumAlpha,0);
 // A changed source invalidates the impossibility witness, even for alpha 1.
 const changed=args.rgba.slice();changed[(7*8+7)*4+3]=1;
 assert.equal(rigidUnderlapSupport({...args,rgba:changed,target:[14,14]}).status,'SOURCE_INK_POSSIBLE');
});
test('inverse mapping follows translation and rotation rather than the rest image coordinate',()=>{
 const args=fixture();const shifted=rigidUnderlapSupport({...args,ancestorMatrix:[1,0,0,1,.2,0],target:[13,9]});
 assert.deepEqual(shifted.source,[9.5,9.5]);assert.equal(shifted.maximumAlpha,255);
 assert.equal(rigidUnderlapSupport({...args,target:[13,9]}).maximumAlpha,0,'old rest-coordinate lookup fails this control');
 const rotated=rigidUnderlapSupport({...args,ancestorMatrix:[0,1,-1,0,1,0],target:[10,9]});
 assert.deepEqual(rotated.source,[9.5,9.5]);assert.equal(rotated.maximumAlpha,255);
});
test('invalid matrices, geometry, data and targets refuse instead of reporting no ink',()=>{
 const args=fixture();assert.throws(()=>rigidUnderlapSupport({...args,ancestorMatrix:[0,0,0,0,0,0]}),/singular/);
 assert.throws(()=>rigidUnderlapSupport({...args,ancestorMatrix:[.5,0,0,.5,0,0]}),/native-size/);
 assert.throws(()=>rigidUnderlapSupport({...args,rgba:new Uint8Array(4)}),/pixels/);
 assert.throws(()=>rigidUnderlapSupport({...args,cutout:{x:19,y:0,width:8,height:8}}),/cutout/);
 assert.throws(()=>rigidUnderlapSupport({...args,target:[-1,9]}),/target/);
});
