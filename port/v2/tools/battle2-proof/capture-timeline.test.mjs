import test from 'node:test';import assert from 'node:assert/strict';
import {battleCaptureDuration,requireBattleCaptureTimeline,requireBattleCaptureMedia} from './capture-timeline.mjs';
const beats={readyEnd:600,commandEnd:900,actionStart:1800,impactAt:2000,hitstopEnd:2070,actionEnd:3000,returnEnd:3400,end:4000};
function fixture(){
 const gates={totalMs:16000,turns:Array.from({length:4},(_,turn)=>({turn,offsetMs:turn*4000,beats:{...beats}}))};
 const frameSamples=Array.from({length:961},(_,i)=>{const ms=i*1000/60,turn=Math.min(3,Math.floor(ms/4000)),localMs=Math.min(ms-turn*4000,3999.999999),ends=[600,900,1800,2000,2070,3000,3400,4000],names=['ready','command','approach','action','hitstop','impact','return','idle'];return{ms,turn,localMs,phase:names[ends.findIndex(end=>localMs<end)],cpuMs:4};});
 return{gates,capture:{plannedDurationMs:16000,frames:frameSamples.length,durationMs:16000,frameSamples}};
}
test('observes every phase of every turn through final recovery; preserves ten-second minimum',()=>{
 const {gates,capture}=fixture(),r=requireBattleCaptureTimeline(gates,capture);assert.equal(r.turns.length,4);assert(r.turns.every(t=>t.phases.every(p=>p.samples>0)));assert.equal(r.lastMs,16000);assert.equal(battleCaptureDuration(7000),10000);assert.equal(battleCaptureDuration(16000),16000);for(const n of[0,-1,NaN,Infinity])assert.throws(()=>battleCaptureDuration(n),/planned duration/);
});
test('old ten-second truncation, omitted/reordered turns, erased phases and invented endpoints refuse',()=>{
 const {gates,capture}=fixture();
 for(const mutate of[
  c=>{c.plannedDurationMs=10000;},
  c=>{c.frameSamples=c.frameSamples.filter(f=>f.ms<=10000);c.frames=c.frameSamples.length;c.durationMs=10000;},
  c=>{c.frameSamples.at(-1).ms=15999;c.durationMs=15999;},
  c=>{c.frameSamples[300].turn=2;},
  c=>{c.frameSamples[300].localMs=0;},
  c=>{c.frameSamples[300].phase='idle';},
  c=>{c.frameSamples[300].ms=c.frameSamples[299].ms;},
  c=>{c.frameSamples=c.frameSamples.filter(f=>!(f.turn===3&&f.phase==='hitstop'));c.frames=c.frameSamples.length;},
  c=>{c.frames++;},
  c=>{c.frameSamples[0].ms=1;},
 ]){const bad=structuredClone(capture);mutate(bad);assert.throws(()=>requireBattleCaptureTimeline(gates,bad),/Battle capture/);}
 const wrong=structuredClone(gates);wrong.turns[2].offsetMs++;assert.throws(()=>requireBattleCaptureTimeline(wrong,capture),/ordered turn/);
 const wrongTotal={...gates,totalMs:17000};assert.throws(()=>requireBattleCaptureTimeline(wrongTotal,capture),/planned duration differs/);
});
test('independent encoded duration and proportional frame floor reject old ten-second media and stalled capture',()=>{
 const media={format:{duration:'16.1'},streams:[{codec_type:'video',nb_read_frames:'962',width:1024,height:576}]};
 const ok=requireBattleCaptureMedia(media,16000);assert.equal(ok.minimumFrames,912);assert.equal(ok.frames,962);
 for(const duration of ['10','15.999','16.751','NaN'])assert.throws(()=>requireBattleCaptureMedia({...media,format:{duration}},16000),/complete row/);
 assert.throws(()=>requireBattleCaptureMedia({...media,streams:[{...media.streams[0],nb_read_frames:'606'}]},16000),/full script lost frames/);
 assert.throws(()=>requireBattleCaptureMedia({...media,streams:[{...media.streams[0],nb_read_frames:'480'}]},16000),/lost frames/);
 assert.equal(requireBattleCaptureMedia({...media,format:{duration:'10.1'},streams:[{...media.streams[0],nb_read_frames:'606'}]},10000).minimumFrames,570);
});
