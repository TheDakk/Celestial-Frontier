import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {inspectSoundSet,inspectLoop,BATTLE_SOURCES,SOUND_THEMES} from './sound-set.mjs';import {sha256} from './contracts.mjs';
function wav(frames=4800,channels=1){const b=Buffer.alloc(44+frames*channels*3);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(144000*channels,28);b.writeUInt16LE(3*channels,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);for(let n=0;n<frames*channels;n++)b.writeIntLE(1000+(n%17)*10,44+n*3,3);return b;}
const rights={owner:'private synthetic test',license:'test-only',source:'generated test fixture, not C3',redistribution:true};
function fixture(run){const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-sound-intake-'));try{const put=(name,bytes)=>{fs.writeFileSync(path.join(root,name),bytes);return{path:name,sha256:sha256(bytes),rights,dry:true};};run(root,put);}finally{fs.rmSync(root,{recursive:true,force:true});}}
test('all closed ability/battle inventories pass; missing, extra, renamed, wet and unlicensed cues refuse',()=>fixture((root,put)=>{
 for(const key of SOUND_THEMES){const manifest={schema:'cf.sound-source-intake/v1',kind:'ability',key,masters:['launch','travel','impact'].map(p=>put(key+'.'+p+'.wav',wav()))};assert.equal(inspectSoundSet(root,manifest).masters.length,3);}
 const m={schema:'cf.sound-source-intake/v1',kind:'battle',masters:BATTLE_SOURCES.map(n=>put(n+'.wav',wav()))};const r=inspectSoundSet(root,m);assert.equal(r.masters.length,16);assert.equal(r.qualityAccepted,false);
 for(const mutate of [x=>x.masters.pop(),x=>x.masters.push(x.masters[0]),x=>x.masters[0].path='invented.wav',x=>x.masters[0].dry=false,x=>x.masters[0].rights.redistribution=false,x=>x.masters[0].sha256='0'.repeat(64)]){const bad=structuredClone(m);mutate(bad);assert.throws(()=>inspectSoundSet(root,bad));}
 const impact={schema:'cf.sound-source-intake/v1',kind:'ability',key:'wild',masters:['launch','travel','impact'].map(p=>put('wild.'+p+'.wav',wav(p==='impact'?28800:4800)))};assert.throws(()=>inspectSoundSet(root,impact),/600 ms/);
}));
test('bed inventory binds a stereo source and exact loop sidecar; malformed or stale loops refuse',()=>fixture((root,put)=>{
 const source=wav(24*48000,2),master=put('bed.temperate.wav',source),sidecar={schema:'cf.audio-loop/v1',sourceSha256:master.sha256,sampleRate:48000,channels:2,startFrame:0,endFrame:24*48000,crossfadeFrames:4800};
 master.loop=put('bed.temperate.loop.json',Buffer.from(JSON.stringify(sidecar)));const m={schema:'cf.sound-source-intake/v1',kind:'bed',key:'temperate',masters:[master]},r=inspectSoundSet(root,m);
 assert.equal(r.masters[0].loop.durationSeconds,24);assert.equal(r.masters[0].loop.cleanLoopAccepted,false);assert.equal(sha256(fs.readFileSync(path.join(root,master.path))),master.sha256);
 for(const patch of [{endFrame:24*48000+1},{startFrame:-1},{crossfadeFrames:0},{crossfadeFrames:12*48000},{sourceSha256:'0'.repeat(64)},{sampleRate:44100}])assert.throws(()=>inspectLoop(source,master.sha256,{...sidecar,...patch}));
 fs.writeFileSync(path.join(root,master.loop.path),'{}');assert.throws(()=>inspectSoundSet(root,m),/source hash/);
 const mono=put('bed.temperate.wav',wav(24*48000));assert.throws(()=>inspectSoundSet(root,{...m,masters:[{...mono,loop:master.loop}]}),/stereo/);
}));
test('loop discontinuity is measured per channel without claiming it is inaudible',()=>{
 const b=wav(100,2),sidecar={schema:'cf.audio-loop/v1',sourceSha256:sha256(b),sampleRate:48000,channels:2,startFrame:0,endFrame:100,crossfadeFrames:5};
 const r=inspectLoop(b,sha256(b),sidecar);assert.equal(r.channels.length,2);assert.equal(r.channels[0].boundaryStep,(1000-(1000+(198%17)*10))/0x800000);assert.equal(r.cleanLoopAccepted,false);
});
