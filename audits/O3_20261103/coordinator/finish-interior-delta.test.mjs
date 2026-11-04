import assert from 'node:assert/strict';
import {test} from 'node:test';
import {proposedInteriorDeltaFeather as feather} from '../w3-static/lancelet-finish-boundary-repair-r01/PROPOSAL-ONLY-interior-delta-feather.mjs';
function fixture(){
 const width=24,height=24,n=width*height,master=new Uint8Array(n*4),finished=new Uint8Array(n*4),editable=new Uint8Array(n),selected=new Uint8Array(n);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;master.set([80+x,100+y,120,255],i*4);editable[i]=+(x>=4&&x<20&&y>=4&&y<20);selected[i]=1;
  finished.set([80+x+20*editable[i],100+y+12*editable[i],120+8*editable[i],255],i*4);
 }
 return {width,height,master,finished,editable,selected};
}
const pixel=(a,x,y)=>Array.from(a.subarray((y*24+x)*4,(y*24+x)*4+4));
test('source-relative edge transition and deep nonzero AI are both real outcomes',()=>{
 const f=fixture(),before=f.master.slice(),ai=f.finished.slice(),out=feather(f);
 assert.deepEqual(pixel(out,4,12),pixel(f.master,4,12));
 assert.notDeepEqual(pixel(f.finished,4,12),pixel(f.master,4,12)); // old abrupt negative
 assert.deepEqual(pixel(out,8,12),pixel(f.finished,8,12));
 assert.notDeepEqual(pixel(out,8,12),pixel(f.master,8,12)); // zero-AI negative
 assert.equal(out[(12*24+9)*4]-out[(12*24+8)*4],1); // source gradient retained
 assert.deepEqual(f.master,before);assert.deepEqual(f.finished,ai);
});
test('alpha, protected and unselected owner pixels remain exact',()=>{
 const f=fixture();for(let y=0;y<24;y++)for(let x=12;x<24;x++)f.selected[y*24+x]=0;
 const out=feather(f);
 for(let i=0;i<f.editable.length;i++){
  assert.equal(out[i*4+3],f.master[i*4+3]);
  if(!f.editable[i])assert.deepEqual(out.slice(i*4,i*4+4),f.master.slice(i*4,i*4+4));
  if(!f.selected[i])assert.deepEqual(out.slice(i*4,i*4+4),f.finished.slice(i*4,i*4+4));
 }
 assert.deepEqual(feather({...f,selected:new Uint8Array(24*24)}),f.finished);
});
test('invalid source alpha, protected RGB, mask and shape are rejected; valid restored',()=>{
 const f=fixture();const alpha=f.finished.slice();alpha[3]=0;assert.throws(()=>feather({...f,finished:alpha}),/alpha/);
 const protectedRgb=f.finished.slice();protectedRgb[0]++;assert.throws(()=>feather({...f,finished:protectedRgb}),/protected/);
 const bad=f.editable.slice();bad[0]=2;assert.throws(()=>feather({...f,editable:bad}),/mask/);
 assert.throws(()=>feather({...f,width:23}),/shape/);
 assert.deepEqual(pixel(feather(f),4,12),pixel(f.master,4,12));
});
