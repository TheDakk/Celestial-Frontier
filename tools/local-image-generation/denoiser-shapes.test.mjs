import test from 'node:test';
import assert from 'node:assert/strict';
import {denoiserShapeSessionOptions} from './denoiser-shapes.mjs';
const embedding=new Uint16Array(512*7680);
const reference=(width=480,height=320)=>({width,height,data:new Float32Array((height/16)*(width/16)*128)});
const job=(change={})=>({stage:'denoise',fixedDenoiserShapes:true,width:1024,height:576,
  embedding,references:[reference()],...change});

test('No opt-in returns no additional session options and does not tighten the existing path',()=>{
  for(const stage of ['text','encode','denoise','decode']){
    for(const flag of [undefined,false])assert.deepEqual(denoiserShapeSessionOptions({stage,fixedDenoiserShapes:flag}),{});
  }
  const untouched=denoiserShapeSessionOptions({stage:'denoise',fixedDenoiserShapes:false,width:13,references:null});
  assert.deepEqual(untouched,{});assert.equal(Object.isFrozen(untouched),true);
});

test('Opt-in supplies exact model symbolic names and counts output plus identity-reference tokens',()=>{
  const options=denoiserShapeSessionOptions(job());
  assert.deepEqual(options,{freeDimensionOverrides:{batch:1,image_sequence:2904,text_sequence:512}});
  assert.equal(Object.isFrozen(options),true);assert.equal(Object.isFrozen(options.freeDimensionOverrides),true);
  assert.equal(Reflect.set(options.freeDimensionOverrides,'batch',2),false);
});

test('Qualified resolutions and zero, one or two references produce the corresponding actual sequence',()=>{
  assert.deepEqual(denoiserShapeSessionOptions(job({references:[]})).freeDimensionOverrides,
    {batch:1,image_sequence:2304,text_sequence:512});
  assert.equal(denoiserShapeSessionOptions(job({references:undefined})).freeDimensionOverrides.image_sequence,2304);
  assert.equal(denoiserShapeSessionOptions(job({references:[reference(512,288)]})).freeDimensionOverrides.image_sequence,2880);
  assert.equal(denoiserShapeSessionOptions(job({references:[reference(512,288),reference()]})).freeDimensionOverrides.image_sequence,3480);
  const small=job({width:768,height:432,references:[reference(512,288),reference()]});
  assert.equal(denoiserShapeSessionOptions(small).freeDimensionOverrides.image_sequence,2472);
  // Removing a reference changes only the declared total, not text padding or
  // output resolution. A ruler counting output tokens alone cannot pass here.
  assert.notEqual(denoiserShapeSessionOptions(small).freeDimensionOverrides.image_sequence,1296);
  assert.equal(denoiserShapeSessionOptions({...small,references:[]}).freeDimensionOverrides.image_sequence,1296);
});

test('Unsupported flags/stages/output dimensions fail before any session can be constructed',()=>{
  for(const flag of [null,'true',1,{},[]])assert.throws(()=>denoiserShapeSessionOptions(job({fixedDenoiserShapes:flag})),/boolean/);
  for(const stage of ['text','encode','decode','unknown'])assert.throws(()=>denoiserShapeSessionOptions(job({stage})),/only to denoise/);
  for(const dimensions of [{width:0},{height:577},{width:768,height:576},{width:1024.5},{height:Infinity}])
    assert.throws(()=>denoiserShapeSessionOptions(job(dimensions)),/dimensions/);
  assert.throws(()=>denoiserShapeSessionOptions(null),/Invalid/);
});

test('The fixed batch-one, 512-token embedding requires exact float16-bit storage and length',()=>{
  for(const value of [null,[],new Float32Array(512*7680),new Uint16Array(512*7680-1),new Uint16Array(2*512*7680)])
    assert.throws(()=>denoiserShapeSessionOptions(job({embedding:value})),/batch1 x512 x7680 float16 bits/);
  assert.equal(denoiserShapeSessionOptions(job({embedding})).freeDimensionOverrides.text_sequence,512);
});

test('Reference shape/type/truncation contradictions are refused; restored encoded data is accepted',()=>{
  const good=reference();
  for(const references of [null,{},[good,good,good],[null],[{...good,width:481}],[{...good,height:288}],
    [{...good,data:[]}],[{...good,data:new Uint16Array(good.data.length)}],
    [{...good,data:new Float32Array(good.data.length-128)}],[{...good,data:new Float32Array(good.data.length+128)}]])
    assert.throws(()=>denoiserShapeSessionOptions(job({references})),/reference/);
  assert.equal(denoiserShapeSessionOptions(job({references:[good]})).freeDimensionOverrides.image_sequence,2904);
});

test('Specialization does not modify or replace any numerical generation input',()=>{
  const ref=reference();ref.data[0]=0.25;ref.data[ref.data.length-1]=-0.5;
  embedding[0]=0x3c00;embedding[embedding.length-1]=0xbc00;
  const source=job({references:[ref],steps:4,seed:133});
  const result=denoiserShapeSessionOptions(source);
  assert.deepEqual(Object.keys(result),['freeDimensionOverrides']);
  assert.equal(source.embedding,embedding);assert.equal(source.references[0],ref);
  assert.equal(source.embedding[0],0x3c00);assert.equal(source.embedding[source.embedding.length-1],0xbc00);
  assert.equal(ref.data[0],0.25);assert.equal(ref.data[ref.data.length-1],-0.5);
  assert.equal(source.steps,4);assert.equal(source.seed,133);assert.equal(source.width,1024);assert.equal(source.height,576);
  assert.equal(Object.hasOwn(source,'freeDimensionOverrides'),false);
});
