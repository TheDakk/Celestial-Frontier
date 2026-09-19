import test from 'node:test';import assert from 'node:assert/strict';
import {renderDeclaredLoop} from './audio-loop.mjs';import {sha256,wavFacts} from './contracts.mjs';
function fixture(){const frames=1000,b=Buffer.alloc(44+frames*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(288000,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(frames*6,40);for(let i=0;i<frames;i++){b.writeIntLE(i*100,44+i*6,3);b.writeIntLE(-i*50,47+i*6,3);}return b;}
test('loop derivative joins the exact declared samples, preserves channels and source; seed changes phase only',()=>{
 const b=fixture(),original=Buffer.from(b),side={schema:'cf.audio-loop/v1',sourceSha256:sha256(b),sampleRate:48000,channels:2,startFrame:100,endFrame:900,crossfadeFrames:100};
 const a=renderDeclaredLoop(b,side,0),again=renderDeclaredLoop(b,side,0),other=renderDeclaredLoop(b,side,133);
 assert.deepEqual(a,again);assert.deepEqual(b,original);assert.equal(a.receipt.output.frames,700);assert.equal(a.receipt.qualityAccepted,false);
 const get=(i,c=0)=>a.wav.readIntLE(44+(i*2+c)*3,3);
 assert.equal(get(0),20000);assert.equal(get(599),79900);assert.equal(get(600),80000);assert.equal(get(699),19900);assert.equal(get(600,1),-40000);
 assert.equal(get(0)-get(699),100); // old hard cut would jump -79900
 assert.notEqual(10000-89900,get(0)-get(699));
 assert.notEqual(other.receipt.recipe.phaseOffsetFrames,0);const offset=other.receipt.recipe.phaseOffsetFrames;
 for(let i=0;i<700;i++)for(let c=0;c<2;c++)assert.equal(other.wav.readIntLE(44+(i*2+c)*3,3),get((i+offset)%700,c));
 for(const mutate of [s=>s.sourceSha256='0'.repeat(64),s=>s.endFrame=1001,s=>s.crossfadeFrames=400,s=>s.crossfadeFrames=1,s=>s.channels=1]){const x=structuredClone(side);mutate(x);assert.throws(()=>renderDeclaredLoop(b,x,0));}
 for(const seed of [-1,NaN,1.1,2**32])assert.throws(()=>renderDeclaredLoop(b,side,seed));
});
test('odd mono PCM frame count retains RIFF padding; the old unpadded output refuses',()=>{
 const b=Buffer.alloc(44+3000);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(144000,28);b.writeUInt16LE(3,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(3000,40);
 for(let i=0;i<1000;i++)b.writeIntLE(10000+i,44+i*3,3);
 const output=renderDeclaredLoop(b,{schema:'cf.audio-loop/v1',sourceSha256:sha256(b),sampleRate:48000,channels:1,startFrame:0,endFrame:1000,crossfadeFrames:101},133);
 assert.equal(wavFacts(output.wav).frames,899);assert.equal(output.wav.length,44+899*3+1);
 const old=Buffer.from(output.wav.subarray(0,-1));old.writeUInt32LE(old.length-8,4);assert.throws(()=>wavFacts(old),/truncated chunk/);
});
