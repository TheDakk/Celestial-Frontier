import assert from 'node:assert/strict';
import {test} from 'node:test';
import {latentCreatureMask,latentInteriorMask,protectLatents,creatureWorkPlan,upscaleBilinearRgba,upscaleNearestMask,downscaleBoxRgb} from './kit-contact-math.mjs';
import {admitCreatureFinishJob,CREATURE_FINISH_SCHEMA} from './kit-engine-math.mjs';

const disc=(w,h,cx,cy,r)=>{const a=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((x-cx)**2+(y-cy)**2<=r*r)a[y*w+x]=255;return a;};

test('creature mask: interior editable (0), band and outside protected (1); opposite polarity to the landfall interior mask',()=>{
  const w=128,h=128,alpha=disc(w,h,64,64,40),m=latentCreatureMask(alpha,w,h,4);
  assert.equal(m.latent.length,64);assert.equal(m.editableTokens+m.protectedTokens,64);
  assert.equal(m.latent[4*8+4],0,'centre cell editable');assert.equal(m.latent[0],1,'corner protected');
  assert.ok(m.editableTokens>0&&m.editableTokens<64);
  const landfall=latentInteriorMask([alpha],w,h,4);
  assert.equal(landfall.latent[4*8+4],1,'landfall interior is protected');assert.equal(landfall.latent[0],0);
  for(let i=0;i<64;i++)assert.equal(m.latent[i],1-landfall.latent[i],'exact polarity mirror at cell '+i);
});
test('creature mask: a wider band shrinks the editable interior; edge-only alpha yields no editable cell and refuses',()=>{
  const w=128,h=128,alpha=disc(w,h,64,64,40);
  assert.ok(latentCreatureMask(alpha,w,h,12).editableTokens<latentCreatureMask(alpha,w,h,4).editableTokens);
  assert.throws(()=>latentCreatureMask(disc(w,h,64,64,6),w,h,4),/Empty or full/);
  const full=new Uint8Array(w*h).fill(255);assert.throws(()=>latentCreatureMask(full,w,h,1),/Empty or full/);
  assert.throws(()=>latentCreatureMask(alpha,120,128,4),/16-aligned/);assert.throws(()=>latentCreatureMask(alpha,w,h,0),/band width/);
});
test('protectLatents at the final sigma returns protected cells to the original latent exactly, editable cells keep the prediction',()=>{
  const original=new Float32Array(2*128).fill(.25),predicted=new Float32Array(2*128).fill(-.75),noise=new Float32Array(2*128).fill(9);
  const out=protectLatents(predicted,original,noise,new Float32Array([1,0]),0);
  assert.equal(out[0],.25);assert.equal(out[127],.25);assert.equal(out[128],-.75);
});
const good=()=>({schema:CREATURE_FINISH_SCHEMA,experiment:CREATURE_FINISH_SCHEMA,finisherStrength:.35,finisherSteps:1,steps:1,textTokenCeiling:512,qualityAccepted:false,
  width:880,height:880,seed:1431434066,interiorErosionPixels:4,backgroundGrey:128,solidAlpha:250,marginPixels:32,workCanvasMax:1024,finisherPrompt:'x'.repeat(120),creatureId:'crab',
  recordRecipeHash:'a'.repeat(64),cutoutAssetHash:'b'.repeat(64),master:{url:'/inputs/crab.rgba',sha256:'c'.repeat(64),width:880,height:880}});
test('creature finish admission: accepted settings exact; every loosening refused',()=>{
  assert.equal(admitCreatureFinishJob(good()).creatureId,'crab');
  for(const [key,value,re] of [['finisherStrength',.36,/experiment refused/],['finisherStrength',.3,/experiment refused/],['finisherSteps',2,/experiment refused/],['steps',4,/experiment refused/],['textTokenCeiling',1024,/experiment refused/],['qualityAccepted',true,/experiment refused/],
    ['width',881,/dimensions/],['height',0,/dimensions/],['seed',-1,/dimensions/],['interiorErosionPixels',0,/mask settings/],['interiorErosionPixels',9,/mask settings/],['backgroundGrey',256,/mask settings/],['solidAlpha',0,/mask settings/],['marginPixels',129,/mask settings/],['workCanvasMax',1000,/mask settings/],
    ['finisherPrompt','short',/prompt missing/],['creatureId','Crab!',/identity refused/],['recordRecipeHash','zz',/identity refused/],['experiment','cf.kit-contact.v1',/schema refused/]]){
    assert.throws(()=>admitCreatureFinishJob({...good(),[key]:value}),re,key+'='+value);
  }
  assert.throws(()=>admitCreatureFinishJob({...good(),master:{...good().master,width:864}}),/pre-fit mismatch/);
  assert.throws(()=>admitCreatureFinishJob({...good(),master:{...good().master,url:'/model/x.rgba'}}),/reference refused/);
  assert.throws(()=>admitCreatureFinishJob({...good(),triptych:{url:'/inputs/t.rgba',sha256:'d'.repeat(64),width:1000,height:576}}),/reference refused/);
  assert.equal(admitCreatureFinishJob({...good(),triptych:{url:'/inputs/t.rgba',sha256:'d'.repeat(64),width:1024,height:576}}).triptych.width,1024);
});

test('work plan crops the silhouette with margin, picks an integer scale up to 4 and a 16-aligned canvas; resampling round-trips a flat crop exactly',()=>{
  const w=880,h=880,alpha=new Uint8Array(w*h);for(let y=400;y<555;y++)for(let x=300;x<554;x++)alpha[y*w+x]=255;
  const plan=creatureWorkPlan(alpha,w,h,{marginPixels:32,workCanvasMax:1024});
  assert.deepEqual(plan.crop,{x:268,y:368,width:318,height:219});assert.equal(plan.scale,3);assert.equal(plan.width,960);assert.equal(plan.height,672);
  assert.equal(creatureWorkPlan(alpha,w,h,{marginPixels:32,workCanvasMax:256}).scale,1);
  const src=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)src.set([10,200,30,255],i*4);
  const up=upscaleBilinearRgba(src,w,h,plan.crop,plan.scale,plan.width,plan.height,[0,0,0,255]);assert.deepEqual(Array.from(up.subarray(0,4)),[10,200,30,255]);assert.deepEqual(Array.from(up.subarray((plan.height-1)*plan.width*4+(plan.width-1)*4)),[0,0,0,255]);
  const down=downscaleBoxRgb(up,plan.width,plan.crop,plan.scale);assert.deepEqual(Array.from(down.subarray(0,4)),[10,200,30,255]);assert.equal(down.length,plan.crop.width*plan.crop.height*4);
  const m=upscaleNearestMask(alpha,w,plan.crop,plan.scale,plan.width,plan.height);assert.equal(m[(32*3)*plan.width+32*3],255);assert.equal(m[0],0);
});
