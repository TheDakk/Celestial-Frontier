/** Loop copies of declared candidate masters; never edits originals or marks listening accepted. */
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {renderDeclaredLoop} from '../asset-intake/audio-loop.mjs';
import {wavFacts,sha256} from '../asset-intake/contracts.mjs';
import {measureAudio} from '../asset-intake/audio-export.mjs';
const name=process.argv[2]??'loop-candidates';if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid loop output name');
const root=path.resolve(import.meta.dirname,'../../../..'),base=path.join(root,'audio-production'),out=path.join(base,'masters',name);
if(fs.existsSync(out))throw Error('Existing loop candidates refused');fs.mkdirSync(out,{recursive:true});
const catalog=JSON.parse(fs.readFileSync(path.join(base,'audition/catalog.json')));
const candidates=catalog.outputs.filter(c=>c.group==='ambience-weather'||c.id.includes('.sustain.'));
const report={schema:'cf.audio-production-loops/v1',outputs:[],failures:[],qualityAccepted:false};
for(const row of candidates){
 try{
  const bytes=fs.readFileSync(path.join(base,row.master)),facts=wavFacts(bytes,row.channels);
  if(sha256(bytes)!==row.masterSha256)throw Error('Master hash changed');
  const crossfadeFrames=Math.min(12000,Math.floor(facts.frames/8));
  const sidecar={schema:'cf.audio-loop/v1',sourceSha256:sha256(bytes),sampleRate:48000,channels:row.channels,startFrame:0,endFrame:facts.frames,crossfadeFrames};
  const loop=renderDeclaredLoop(bytes,sidecar,133);
  const file=path.join(out,row.id+'.loop.wav'),opus=path.join(out,row.id+'.loop.opus');
  fs.writeFileSync(file,loop.wav,{flag:'wx'});
  const result=spawnSync('ffmpeg',['-nostdin','-v','error','-n','-i',file,'-c:a','libopus','-b:a',row.channels===1?'96k':'160k',opus],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr);
  const wavMeasurement=measureAudio(loop.wav,'wav',loop.receipt.output.durationSeconds);
  const opusBytes=fs.readFileSync(opus),opusMeasurement=measureAudio(opusBytes,'ogg',loop.receipt.output.durationSeconds);
  if(wavMeasurement.truePeakDbTP> -1||opusMeasurement.truePeakDbTP> -1)throw Error('Loop peak ceiling');
  const unchanged=sha256(fs.readFileSync(path.join(base,row.master)))===row.masterSha256;if(!unchanged)throw Error('Original changed');
  report.outputs.push({id:row.id,sidecar,...loop.receipt,wav:path.relative(base,file),opus:path.relative(base,opus),opusSha256:sha256(opusBytes),wavMeasurement,opusMeasurement,sourceUnchanged:unchanged});
 }catch(error){report.failures.push({id:row.id,error:String(error.stack??error)});break;}
}
fs.writeFileSync(path.join(base,'reports',name+'.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({loops:report.outputs.length,failures:report.failures.length}));if(report.failures.length)process.exitCode=1;
