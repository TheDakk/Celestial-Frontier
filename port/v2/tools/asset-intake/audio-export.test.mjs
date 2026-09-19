import test from 'node:test';import assert from 'node:assert/strict';
import {exportAudioBytes,parseLoudness,requireAudioPeaks} from './audio-export.mjs';import {wavFacts} from './contracts.mjs';
import {spawnSync} from 'node:child_process';
// Codec integration is exercised where the approved authoring tools are installed.
// A present but broken tool still fails; only ENOENT is an explicit skip.
const missingCodecTools=['ffmpeg','ffprobe'].filter(tool=>spawnSync(tool,['-version']).error?.code==='ENOENT');
const codecTest={skip:missingCodecTools.length?'Authoring tools unavailable: '+missingCodecTools.join(', '):false};
function fixture({frames=24000,channels=1,intersample=false}={}){
 const b=Buffer.alloc(44+frames*3*channels);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(144000*channels,28);b.writeUInt16LE(3*channels,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);
 for(let i=0;i<frames;i++)for(let c=0;c<channels;c++){const sample=intersample?.8*[1,1,-1,-1][i%4]:.12*Math.sin(2*Math.PI*(440+c*220)*i/48000)*Math.min(1,i/240,(frames-1-i)/240);b.writeIntLE(Math.round(sample*0x7fffff),44+(i*channels+c)*3,3);}return b;
}
test('real codec export is deterministic, preserves decoded duration and source bytes, and measures both peaks',codecTest,()=>{
 const input=fixture(),copy=Buffer.from(input),a=exportAudioBytes(input,'creature'),b=exportAudioBytes(input,'creature');
 assert.deepEqual(a.opus,b.opus);assert.deepEqual(a.receipt,b.receipt);assert.deepEqual(input,copy);assert.equal(a.receipt.encoded.frames,24000);assert.ok(a.receipt.encoded.bytes<30000);assert.equal(a.receipt.qualityAccepted,false);assert.equal(a.receipt.encodedMeasurement.shortTermLufs,null);
});
test('sample-safe intersample clipping is rejected by real true-peak measurement',codecTest,()=>{
 const input=fixture({intersample:true});assert.ok(wavFacts(input).samplePeakDb<-1);
 assert.throws(()=>exportAudioBytes(input,'creature'),/source exceeds -1 dBTP/);
});
test('missing metrics, false encoded peak, wrong channels, duration and unsupported profiles refuse',()=>{
 assert.throws(()=>parseLoudness('',.5),/missing/);assert.throws(()=>parseLoudness('{"input_i":"NaN","input_tp":"-20"}',.5),/invalid/);
 assert.throws(()=>requireAudioPeaks({truePeakDbTP:-3},{truePeakDbTP:-.1}),/Opus exceeds/);
 assert.throws(()=>requireAudioPeaks({truePeakDbTP:-3},{}),/Opus exceeds/);
 assert.throws(()=>exportAudioBytes(fixture({channels:2}),'creature'),/mono/);
 assert.throws(()=>exportAudioBytes(fixture({frames:96000}),'creature'),/duration/);
 assert.throws(()=>exportAudioBytes(fixture(),'unknown'),/profile/);
});

test('complete voice export preserves source hashes and refuses existing output or changed manifest before publication',codecTest,async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const {exportVoiceSet}=await import('./audio-export.mjs'),{VOICE_CUES,sha256}=await import('./contracts.mjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-voice-export-test-'));
 try{
  const names=[...VOICE_CUES.map(c=>'quadruped.'+c+'.wav'),...Array.from({length:4},(_,i)=>'quadruped.footfall-set.'+(i+1)+'.wav')];
  const manifest={schema:'cf.voice-source-intake/v1',archetype:'quadruped',masters:names.map(name=>{
   const data=fixture({frames:name.includes('footfall')?9600:24000});fs.writeFileSync(path.join(root,name),data);
   return {path:name,sha256:sha256(data),dry:true,rights:{owner:'synthetic fixture, not C3',license:'test-only',source:'private codec test',redistribution:true}};
  })};
  const file=path.join(root,'sources.json'),output=path.join(root,'encoded');fs.writeFileSync(file,JSON.stringify(manifest));
  const result=exportVoiceSet(file,output);assert.equal(result.outputs.length,12);assert.equal(result.qualityAccepted,false);assert.ok(fs.existsSync(path.join(output,'receipt.json')));
  assert.throws(()=>exportVoiceSet(file,output),/new output/);
  for(const row of manifest.masters)assert.equal(sha256(fs.readFileSync(path.join(root,row.path))),row.sha256);
  const defaultFs=fs.default,read=defaultFs.readFileSync;let reads=0;
  defaultFs.readFileSync=function(p,...args){if(p===file&&++reads===2)return Buffer.from(JSON.stringify({...manifest,archetype:'changed-during-export'}));return read.call(this,p,...args);};
  try{assert.throws(()=>exportVoiceSet(file,path.join(root,'refused')),/manifest changed/);assert.equal(fs.existsSync(path.join(root,'refused')),false);}finally{defaultFs.readFileSync=read;}
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('theme, battle and overlapped bed exports preserve source/sidecar bytes and fit exact budgets',codecTest,async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const {exportSoundSet}=await import('./audio-export.mjs'),{sha256}=await import('./contracts.mjs'),{BATTLE_SOURCES}=await import('./sound-set.mjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-set-export-'));
 const put=(name,data)=>{fs.writeFileSync(path.join(root,name),data);return{path:name,sha256:sha256(data)};};
 const rights={owner:'private synthetic test fixture',license:'test-only',source:'codec test, not C3 media',redistribution:true};
 try{
  for(const kind of ['ability','battle','bed']){
   const names=kind==='ability'?['wild.launch.wav','wild.travel.wav','wild.impact.wav']:kind==='battle'?BATTLE_SOURCES.map(n=>n+'.wav'):['bed.temperate.wav'];
   const masters=names.map(name=>{const bound=put(name,fixture({frames:kind==='bed'?25*48000:24000,channels:kind==='bed'?2:1}));
    return {...bound,dry:true,rights,...(kind==='bed'?{loop:put('bed-loop.json',Buffer.from(JSON.stringify({schema:'cf.audio-loop/v1',sourceSha256:bound.sha256,sampleRate:48000,channels:2,startFrame:0,endFrame:25*48000,crossfadeFrames:4800})))}:{})};});
   const manifest={schema:'cf.sound-source-intake/v1',kind,...(kind==='battle'?{}:{key:kind==='ability'?'wild':'temperate'}),masters};
   const file=path.join(root,kind+'.json');fs.writeFileSync(file,JSON.stringify(manifest));
   const out=path.join(root,kind+'-opus'),r=exportSoundSet(file,out,{seed:133});assert.equal(r.outputs.length,names.length);assert.equal(r.qualityAccepted,false);assert.throws(()=>exportSoundSet(file,out),/new output/);
   for(const row of masters){assert.equal(sha256(fs.readFileSync(path.join(root,row.path))),row.sha256);if(row.loop)assert.equal(sha256(fs.readFileSync(path.join(root,row.loop.path))),row.loop.sha256);}
   if(kind==='bed'){
    assert.equal(r.outputs[0].receipt.encoded.frames,24.9*48000);assert.equal(r.outputs[0].loop.recipe.phaseOffsetFrames>=0,true);assert.ok(r.outputs[0].originalMeasurement.truePeakDbTP<=-1);
    const second=exportSoundSet(file,path.join(root,'bed-repeat'),{seed:133});assert.deepEqual(r,second);
    assert.deepEqual(fs.readFileSync(path.join(out,'bed.temperate.opus')),fs.readFileSync(path.join(root,'bed-repeat/bed.temperate.opus')));
    // Both source and declared loop can pass the intake's 24-second minimum,
    // while the overlap would shorten the delivered loop below it. Refuse, no pad.
    const source=put('bed.temperate.wav',fixture({frames:24*48000,channels:2}));manifest.masters=[{...masters[0],...source,loop:put('short-loop.json',Buffer.from(JSON.stringify({schema:'cf.audio-loop/v1',sourceSha256:source.sha256,sampleRate:48000,channels:2,startFrame:0,endFrame:24*48000,crossfadeFrames:4800})))}];
    fs.writeFileSync(file,JSON.stringify(manifest));assert.throws(()=>exportSoundSet(file,path.join(root,'too-short')),/shorter than 24/);assert.equal(fs.existsSync(path.join(root,'too-short')),false);
   }
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
