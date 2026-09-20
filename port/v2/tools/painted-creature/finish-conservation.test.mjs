import assert from 'node:assert/strict';
import {test} from 'node:test';
import {alphaConservation,labelComponentCounts,boundaryGradient,bindingEquality,conservationReport,labelsFromRed,labelsFromColours,readPng,writePng} from './finish-conservation.mjs';
// 64×64 master: label 1 = left body (dark), label 2 = right leg (light), separated by a one-pixel step; two components for label 2.
const W=64,H=64;
function synth(){
  const data=new Uint8Array(W*H*4),labels=new Uint16Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const inBody=x>=8&&x<40&&y>=8&&y<56,inLegA=x>=40&&x<56&&y>=8&&y<28,inLegB=x>=40&&x<56&&y>=36&&y<56;
    if(!(inBody||inLegA||inLegB))continue;labels[i]=inBody?1:2;const v=inBody?60+((x*7+y*3)%20):200-((x*5+y*11)%20);data.set([v,v-10,v-20,255],i*4);}
  return {png:{width:W,height:H,data},labels};
}
test('alpha conservation: interior recolour passes; one alpha byte or one transparent pixel fails',()=>{
  const {png:m}=synth(),f={...m,data:m.data.slice()};for(let i=0;i<W*H;i++)if(m.data[i*4+3])f.data[i*4]=Math.min(255,f.data[i*4]+30);
  assert.equal(alphaConservation(m,f).status,'PASS');
  const a={...m,data:f.data.slice()};a.data[(20*W+20)*4+3]=254;assert.equal(alphaConservation(m,a).status,'FAIL');assert.equal(alphaConservation(m,a).differingAlphaBytes,1);
  const k={...m,data:f.data.slice()};k.data[(2*W+2)*4]=1;assert.equal(alphaConservation(m,k).status,'FAIL');assert.equal(alphaConservation(m,k).changedTransparentPixels,1);
});
test('component counts per label and the boundary-gradient gate both ways (blur across the label edge fails)',()=>{
  const {png:m,labels}=synth(),alpha=new Uint8Array(W*H);for(let i=0;i<W*H;i++)alpha[i]=m.data[i*4+3];
  const counts=labelComponentCounts(labels,alpha,W,H);assert.equal(counts.get(1),1);assert.equal(counts.get(2),2);
  const f={...m,data:m.data.slice()};for(let i=0;i<W*H;i++)if(m.data[i*4+3]){f.data[i*4]=Math.min(255,f.data[i*4]+15);}
  assert.ok(boundaryGradient(f,labels).meanStep/boundaryGradient(m,labels).meanStep>.95);
  const blurred={...m,data:m.data.slice()};for(let y=8;y<56;y++)for(let x=36;x<44;x++){const i=y*W+x;if(!m.data[i*4+3])continue;const v=130;blurred.data.set([v,v,v,255],i*4);}
  const report=conservationReport({master:m,finished:blurred,labels});
  assert.equal(report.gates.alpha.status,'PASS');assert.equal(report.gates.gradient.status,'FAIL');assert.equal(report.status,'FAIL');
  assert.equal(conservationReport({master:m,finished:f,labels}).status,'PASS');
});
test('binding equality ignores only atlasSha256 and bindingHash; any geometry byte fails',()=>{
  const a={schema:'x',atlasSha256:'1',bindingHash:'2',parts:[{id:'p',frame:{x:1,y:2,width:3,height:4}}],paintSkin:{vertices:[[1,2]]}};
  const b={...a,atlasSha256:'9',bindingHash:'8'};assert.equal(bindingEquality(a,b).status,'PASS');assert.equal(bindingEquality(a,b).atlasSha256Differs,true);
  const c={...b,paintSkin:{vertices:[[1,3]]}};assert.equal(bindingEquality(a,c).status,'FAIL');
});
test('label readers: red channel ids and distinct ownership colours; png round trip',()=>{
  const {png:m,labels}=synth();const red=new Uint8Array(W*H*4),col=new Uint8Array(W*H*4);
  for(let i=0;i<W*H;i++){if(!m.data[i*4+3])continue;red.set([labels[i],0,0,255],i*4);col.set(labels[i]===1?[10,20,30,255]:[200,100,50,255],i*4);}
  const r=readPng(writePng(W,H,red)),c=readPng(writePng(W,H,col));
  assert.deepEqual(Array.from(labelsFromRed(r)),Array.from(labels));
  const fromColours=labelsFromColours(c);for(let i=0;i<W*H;i++)assert.equal(fromColours[i]===0,labels[i]===0);
});
