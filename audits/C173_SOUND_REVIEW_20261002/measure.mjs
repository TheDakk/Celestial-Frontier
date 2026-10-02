import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {admitLoudnessV1,LOUDNESS_TARGETS_V1} from '../../port/v2/apps/game/src/soundkit/loudness.ts';
const source='audits/C132_SOUND_20261001/delivery.json', delivery=JSON.parse(fs.readFileSync(source));
const sha=b=>createHash('sha256').update(b).digest('hex'), results=[];
for(const cue of delivery.cues){
 const masters={};for(const [kind,file,hash] of [['wav',cue.wav,cue.wavSha256],['opus',cue.opus,cue.opusSha256]]){
  const bytes=fs.readFileSync(file);if(sha(bytes)!==hash)throw Error('Changed original cue '+cue.id+' '+kind);
  const pcm=execFileSync('/opt/homebrew/bin/ffmpeg',['-nostdin','-v','error','-i',file,'-f','f32le','-acodec','pcm_f32le','-ac','1','-ar','48000','pipe:1'],{maxBuffer:8*1024*1024});
  const samples=Float32Array.from({length:pcm.length/4},(_,i)=>pcm.readFloatLE(i*4));
  const gate=admitLoudnessV1(samples,48000,'combat');
  masters[kind]={path:file,sha256:hash,bytes:bytes.length,pcmSha256:sha(pcm),sampleCount:samples.length,admission:gate};
 }
 results.push({id:cue.id,sourceId:cue.sourceId,sourceKind:cue.sourceKind,license:cue.license,phase:cue.phase,masters,listeningAccepted:false,runtimeAdmitted:false});
}
const result={schema:'cf.c173-recorded-sound-measurement/v1',source:{path:source,sha256:sha(fs.readFileSync(source))},instrument:{path:'port/v2/apps/game/src/soundkit/loudness.ts',sha256:sha(fs.readFileSync('port/v2/apps/game/src/soundkit/loudness.ts'))},targets:LOUDNESS_TARGETS_V1.combat,cues:results.length,acceptedMasters:results.filter(r=>r.masters.wav.admission.ok).length,acceptedOpus:results.filter(r=>r.masters.opus.admission.ok).length,listeningStatus:'UNREVIEWED: no headphone or phone-speaker listening evidence',runtimeAdmitted:false,results};
fs.writeFileSync(new URL('measurement.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cues:result.cues,wavGate:result.acceptedMasters,opusGate:result.acceptedOpus,refused:results.filter(r=>!r.masters.wav.admission.ok||!r.masters.opus.admission.ok).map(r=>({id:r.id,wav:r.masters.wav.admission.reason,opus:r.masters.opus.admission.reason}))}));
