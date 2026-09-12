import {test} from 'node:test';import assert from 'node:assert/strict';
import {applyKitWeather,readCompositorSystemCard} from './kit-weather-math.mjs';
const card=(weather='rain',water='liquid',time='day')=>`SYSTEM CARD\n  Light: ${time}; ${weather}; diffuse cloud-filtered light\n  Atmosphere: weather ${weather}, water ${water}; pigments from source`;
function fixture(){const w=128,h=128,rgba=new Uint8ClampedArray(w*h*4),alpha=new Uint8Array(w*h);for(let i=0;i<w*h;i++){rgba.set([120,100,70,255],i*4);const x=i%w,y=Math.floor(i/w);if(x>=32&&x<96&&y>=32&&y<96)alpha[i]=255;}return {w,h,rgba,organisms:[{name:'Civet',alpha}]};}
test('weather is repeatable by recipe seed, darkens/desaturates fur, preserves inputs/alpha, and covers the entire frame',()=>{
 const f=fixture(),before=f.rgba.slice(),m=f.organisms[0].alpha.slice();const run=seed=>applyKitWeather(f.rgba,f.w,f.h,f.organisms,seed,card());const a=run(133),b=run(133);
 assert.deepEqual(a.rgba,b.rgba);assert.notDeepEqual(a.rgba,run(134).rgba);assert.deepEqual(f.rgba,before);assert.deepEqual(f.organisms[0].alpha,m);
 const oracle=out=>{const p=(64*f.w+64)*4;assert.ok(out[p]<before[p]);assert.ok(out[p]-out[p+2]<before[p]-before[p+2]);assert.ok(out.some((v,i)=>i%4!==3&&!m[Math.floor(i/4)]&&v!==before[i]));};
 oracle(a.rgba);assert.throws(()=>oracle(before));
 for(let i=3;i<a.rgba.length;i+=4)assert.equal(a.rgba[i],before[i]);
 assert.equal(a.receipt.precipitationStrokes,Math.round(f.w*f.h*.0018));assert.ok(a.receipt.droplets>0);assert.equal(a.receipt.geometryChanged,false);
});
test('system-card weather, water, time and light control effects; missing/ambiguous cards fail',()=>{
 const f=fixture(),run=c=>applyKitWeather(f.rgba,f.w,f.h,f.organisms,133,c);
 assert.equal(run(card('rain','frozen')).receipt.wetPixels,0);assert.equal(run(card()).receipt.wetPixels,64*64);
 assert.equal(run(card('snow')).receipt.kind,'snow');assert.equal(run(card('dust')).receipt.kind,'dust');assert.deepEqual(run(card('clear')).rgba,f.rgba);
 assert.notDeepEqual(run(card()).rgba,run(card('rain','liquid','night')).rgba);
 assert.throws(()=>readCompositorSystemCard(card()+'\n  Light: day; diffuse cloud-filtered light'),/ambiguity/);
 assert.throws(()=>readCompositorSystemCard(card().replace('diffuse cloud-filtered light','invented sun')),/Unsupported/);
});

test('weather recipe keeps the accepted finisher and five placements; mat is16% wide and remains one organism',async()=>{
 const fs=await import('node:fs/promises'),{admitKitEngineJob,placementBox}=await import('./kit-engine-math.mjs'),{keyAndDespill,compositeOrganism}=await import('./kit-contact-math.mjs');
 const directory=new URL('../../audits/ART_KIT_WEATHER_MAT_20260912/prepared/',import.meta.url),job=JSON.parse(await fs.readFile(new URL('recipe.json',directory),'utf8'));
 const old=JSON.parse(await fs.readFile(new URL('../../audits/ART_KIT_CONTACT_REVISION_20260912/prepared/recipe.json',import.meta.url),'utf8'));
 admitKitEngineJob(job);assert.equal(job.finisherPrompt,old.finisherPrompt);assert.equal(job.finisherStrength,.35);assert.equal(job.interiorErosionPixels??4,4);assert.equal(job.passes.length,6);
 for(let i=0;i<5;i++)assert.deepEqual(job.passes[i],old.passes[i]);
 const p=job.passes[5],raw=new Uint8ClampedArray(await fs.readFile(new URL('inputs/cranberry.rgba',directory))),keyed=keyAndDespill(raw,384,384);
 const result=compositeOrganism(new Uint8ClampedArray(1024*576*4),1024,576,keyed,384,384,p.placement,placementBox);
 assert.ok(Math.abs(result.box.width/1024-.16)<1e-10);assert.ok(Math.abs((result.box.x+result.box.width/2)/1024-.34)<1e-10);assert.ok(Math.abs((result.box.y+result.box.height)/576-.9)<1e-10);
 assert.equal(result.instances.length,2);assert.ok(result.instances[0].x+result.instances[0].width>result.instances[1].x);
 assert.throws(()=>admitKitEngineJob({...job,interiorErosionPixels:8}));assert.throws(()=>admitKitEngineJob({...job,compositorSystemCard:undefined}));
 const wrong=structuredClone(job);wrong.passes[0].placement.mat=p.placement.mat;assert.throws(()=>admitKitEngineJob(wrong),/Unexpected/);
});
