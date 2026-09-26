import {describe,it,expect} from 'vitest';
import {compileProductionEnvironment,compileProductionMusic} from './audio-production-plan.js';
import {selectProductionPlan,mixProductionPreview} from './audio-production-mix.js';
import type {AudioProductionCue} from './audio-production-review.js';
const plan=compileProductionEnvironment({worldKey:'133',seed:133,biome:'temperate',weather:'rain',medium:'air',timeOfDay:'day'});
const cues:AudioProductionCue[]=plan.layers.map((l,i)=>({id:'v2.environment.'+i,group:'coverage-environment',kind:'designed',notes:'test',previewUrl:'/__cf-audio-review/v2.environment.'+i+'.wav',previewSha256:'a'.repeat(64),previewBytes:44,requirements:[l.requirement],layers:[{sourceId:'source',sha256:'b'.repeat(64)}]}));
const pcm=()=>({sampleRate:48000 as const,frames:4800,channels:[Float32Array.from({length:4800},(_,i)=>Math.sin(i*.1)*.2)],durationMs:100,decodedBytes:19200});
describe('bounded multi-layer audition',()=>{
 it('refuses implicit promotion and missing layers; selection replays independently of bank order',()=>{
   expect(selectProductionPlan(plan,cues,0).missing).toHaveLength(2);
   const selection=selectProductionPlan(plan,cues,0,true);expect(selection.missing).toEqual([]);
   expect(selectProductionPlan(plan,cues.slice().reverse(),0,true)).toEqual(selection);
   expect(selectProductionPlan(plan,cues.slice(1),0,true).missing).toHaveLength(1);
 });
 it('mixes real nonzero cycles within a bounded allocation without changing originals',async()=>{
   const source=pcm(),before=source.channels[0]!.slice(),selection=selectProductionPlan(plan,cues,0,true);
   const out=await mixProductionPreview(selection,async()=>source,new AbortController().signal,1);
   expect(out.frames).toBe(48000);expect(out.decodedBytes).toBe(384000);
   expect(out.channels[0]!.some(v=>Math.abs(v)>.01)).toBe(true);expect(source.channels[0]).toEqual(before);
   for(let f=9000;f<out.frames-2000;f++)expect(Math.abs(out.channels[0]![f]!-out.channels[0]![f-1]!)).toBeLessThan(.02);
   await expect(mixProductionPreview({...selection,missing:['lost']},async()=>source,new AbortController().signal)).rejects.toThrow('Missing');
 });
 it('auditions complementary music fades and refuses an unordered curve',async()=>{
   const music=compileProductionMusic('calm','battle');
   const bank=music.layers.map((l,i)=>({...cues[0]!,id:'v3.music.'+i,recipeVersion:3,requirements:[l.requirement]}));
   const selected=selectProductionPlan(music,bank,0,true);
   const output=await mixProductionPreview(selected,async cue=>({...pcm(),channels:[new Float32Array(4800).fill(cue.id.endsWith('0')?.2:-.2)]}),new AbortController().signal,8);
   expect(output.channels[0]![48000]).toBeCloseTo(.06);expect(output.channels[0]![6*48000]).toBeCloseTo(-.06);
   expect(Math.abs(output.channels[0]![Math.round(3.75*48000)]!)).toBeLessThan(.001);
   expect(()=>selectProductionPlan({...music,layers:[{...music.layers[0]!,gainCurve:[[100,1],[50,0]]}]},bank,0,true)).toThrow('curve');
 });
 it('cancels before starting another source and refuses duration/headroom corruption',async()=>{
   const abort=new AbortController(),selection=selectProductionPlan(plan,cues,0,true);let count=0;
   await expect(mixProductionPreview(selection,async()=>{count++;abort.abort();return pcm();},abort.signal)).rejects.toThrow();
   expect(count).toBe(1);
   await expect(mixProductionPreview(selection,async()=>pcm(),new AbortController().signal,25)).rejects.toThrow('duration');
   await expect(mixProductionPreview(selection,async()=>({...pcm(),channels:[new Float32Array(4800).fill(20)]}),new AbortController().signal,1)).rejects.toThrow('headroom');
 });
});
