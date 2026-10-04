import assert from 'node:assert/strict';import {test} from 'node:test';
import {registerOrganism,admitsBoxOverlap} from './kit-contact-review.mjs';
test('box observer measures image displacement; shifted and blank controls cannot pass',()=>{
  const W=128,H=96,alpha=new Uint8Array(W*H),a=new Uint8ClampedArray(W*H*4),shifted=new Uint8ClampedArray(a.length),box={x:32,y:24,width:48,height:40};
  for(let y=24;y<64;y++)for(let x=32;x<80;x++){const i=y*W+x;alpha[i]=255;const v=(x*19+y*43+x*y*7)%220+20;a.set([v,v,v,255],i*4);shifted.set([v,v,v,255],(y*W+x+12)*4);}
  const same=registerOrganism(a,a,alpha,W,H,box);assert.ok(admitsBoxOverlap(same));assert.equal(same.dx,0);assert.equal(same.iou,1);
  const moved=registerOrganism(a,shifted,alpha,W,H,box);assert.equal(moved.dx,12);assert.equal(moved.scale,1);assert.ok(!admitsBoxOverlap(moved));assert.ok(moved.iou<.9);
  assert.throws(()=>registerOrganism(a,new Uint8ClampedArray(a.length),alpha,W,H,box),/No reliable/);
  assert.ok(!admitsBoxOverlap({...same,iou:.899}));
});
