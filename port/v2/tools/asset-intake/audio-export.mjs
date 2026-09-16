/** Offline C3 technical export. Immutable input bytes, no auto-normalization or acceptance.
 * Both source and lossy output are measured. Short cues cannot establish the kit's
 * short-term mix loudness in isolation; that remains a playback/listening gate. */
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {sha256,wavFacts,readBoundFile,inspectVoiceSet} from './contracts.mjs';
import {inspectSoundSet} from './sound-set.mjs';
import {renderDeclaredLoop} from './audio-loop.mjs';
const need=(ok,why)=>{if(!ok)throw Error('Audio export: '+why);};
export const AUDIO_PROFILES=Object.freeze({
 cue:Object.freeze({channels:1,bitrate:64000,maximumSeconds:null,maximumBytes:30000}),
 creature:Object.freeze({channels:1,bitrate:64000,maximumSeconds:2,maximumBytes:30000}),
 impact:Object.freeze({channels:1,bitrate:64000,maximumSeconds:.6,maximumBytes:30000}),
 ui:Object.freeze({channels:1,bitrate:64000,maximumSeconds:.6,maximumBytes:30000}),
 bed:Object.freeze({channels:2,bitrate:96000,minimumSeconds:24,maximumSeconds:40,maximumBytes:400000}),
});
const command=(bin,args,input)=>{
 const p=spawnSync(bin,args,{input,timeout:60000,maxBuffer:32*1024*1024,env:{...process.env,LC_ALL:'C'}});
 need(!p.error&&p.status===0,`${path.basename(bin)} failed: ${p.error?.message??p.stderr?.toString().slice(-1200)}`);return p;
};
export function parseLoudness(stderr,durationSeconds){
 const matches=[...stderr.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)];need(matches.length===1,'missing or ambiguous loudness result');
 const raw=JSON.parse(matches[0][0]);
 const number=(key,optional=false)=>{const value=Number(raw[key]);if(!Number.isFinite(value)){need(optional&&['-inf','inf'].includes(raw[key]),'invalid '+key);return null;}return value;};
 const truePeakDbTP=number('input_tp'),integratedLufs=number('input_i',true);
 return {truePeakDbTP,integratedLufs:durationSeconds>=.4?integratedLufs:null,
  shortTermLufs:null,shortTermReason:'Kit short-term cue loudness requires a playback/mix observation; integrated LUFS is not substituted.',
  instrument:'FFmpeg loudnorm input measurements',raw};
}
export function measureAudio(bytes,format,durationSeconds,ffmpeg='ffmpeg'){
 const args=['-nostdin','-hide_banner','-v','info','-f',format,'-i','pipe:0','-map','0:a:0','-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-'];
 return parseLoudness(command(ffmpeg,args,bytes).stderr.toString(),durationSeconds);
}
export function requireAudioPeaks(source,encoded){
 for(const [label,value]of [['source',source],['Opus',encoded]])need(value&&Number.isFinite(value.truePeakDbTP)&&value.truePeakDbTP<=-1,label+' exceeds -1 dBTP');
}
export function exportAudioBytes(source,profileName,{ffmpeg='ffmpeg',ffprobe='ffprobe'}={}){
 const profile=AUDIO_PROFILES[profileName];need(profile,'unknown technical profile');
 const facts=wavFacts(source,profile.channels),duration=facts.durationSeconds;
 need(profile.maximumSeconds===null||duration<profile.maximumSeconds||(profileName==='bed'&&duration===40),'source duration exceeds profile');
 need(!profile.minimumSeconds||duration>=profile.minimumSeconds,'bed shorter than 24 seconds');
 const toolVersion=command(ffmpeg,['-version']).stdout.toString().split('\n')[0];
 const sourceMeasurement=measureAudio(source,'wav',duration,ffmpeg);requireAudioPeaks(sourceMeasurement,sourceMeasurement);
 const options=['-nostdin','-hide_banner','-v','error','-fflags','+bitexact','-f','wav','-i','pipe:0',
  '-map','0:a:0','-map_metadata','-1','-vn','-ac',String(profile.channels),'-ar','48000','-c:a','libopus',
  '-application','audio','-b:a',String(profile.bitrate),'-vbr',profileName==='bed'?'constrained':'on','-compression_level','10','-threads','1',
  '-flags:a','+bitexact','-fflags','+bitexact','-serial_offset','0','-f','opus','pipe:1'];
 const opus=command(ffmpeg,options,source).stdout;need(opus.length>0&&opus.length<profile.maximumBytes,`Opus byte budget exceeded: ${opus.length} bytes; must be below ${profile.maximumBytes}`);
 const probe=JSON.parse(command(ffprobe,['-v','error','-f','ogg','-i','pipe:0','-count_packets','-show_streams','-of','json'],opus).stdout.toString());
 need(probe.streams?.length===1,'single audio stream required');const stream=probe.streams[0];
 need(stream.codec_name==='opus'&&stream.codec_type==='audio'&&stream.channels===profile.channels&&Number(stream.sample_rate)===48000,'encoded codec/channel/rate mismatch');
 need(Number.isSafeInteger(Number(stream.nb_read_packets))&&Number(stream.nb_read_packets)>0,'probe did not read the complete packet stream');
 const decoded=command(ffmpeg,['-nostdin','-hide_banner','-v','error','-f','ogg','-i','pipe:0','-map','0:a:0','-ac',String(profile.channels),'-ar','48000','-c:a','pcm_s24le','-f','s24le','pipe:1'],opus).stdout;
 need(decoded.length===facts.frames*3*profile.channels,'Opus decoded frame count changed');
 const encodedMeasurement=measureAudio(opus,'ogg',duration,ffmpeg);requireAudioPeaks(sourceMeasurement,encodedMeasurement);
 const recipe={schema:'cf.audio-export-recipe/v1',sourceSha256:sha256(source),profile:profileName,policy:profile,ffmpeg:toolVersion,encoderArguments:options};
 return {opus,receipt:{schema:'cf.audio-export/v1',recipe,recipeHash:sha256(Buffer.from(JSON.stringify(recipe))),source:facts,sourceMeasurement,encodedMeasurement,
  encoded:{sha256:sha256(opus),bytes:opus.length,frames:facts.frames,channels:profile.channels,codec:'opus',packetsRead:Number(stream.nb_read_packets)},
  qualityAccepted:false,pending:['rights and dry-source review','short-term cue mix loudness / bed target','headphone and phone-speaker listening','derived voice comparison and arena wiring']}};
}
export function exportVoiceSet(manifestFile,output,options={}){
 const root=path.dirname(path.resolve(manifestFile)),manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes);
 const intake=inspectVoiceSet(root,manifest);need(!fs.existsSync(output),'new output directory required; never overwrite an accepted export');
 const results=[];
 for(const row of [...manifest.masters].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)){
  const source=readBoundFile(root,row),profile=['land-thud'].some(c=>row.path.endsWith('.'+c+'.wav'))||row.path.includes('.footfall-set.')?'impact':'creature';
  const result=exportAudioBytes(source,profile,options);results.push({name:row.path.replace(/\.wav$/,'.opus'),...result});
 }
 // Re-prove every master before publishing any output. The input and output never share names.
 for(const row of manifest.masters)readBoundFile(root,row);
 need(fs.readFileSync(manifestFile).equals(manifestBytes),'source manifest changed during export');
 fs.mkdirSync(output);try{
  for(const r of results)fs.writeFileSync(path.join(output,r.name),r.opus,{flag:'wx'});
  const report={schema:'cf.voice-export-set/v1',status:'TECHNICAL_READY_FOR_REVIEW',archetype:manifest.archetype,
   sourceManifestSha256:sha256(manifestBytes),intake,outputs:results.map(({name,receipt})=>({name,...receipt})),qualityAccepted:false};
  fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
 }catch(error){fs.rmSync(output,{recursive:true,force:true});throw error;}
}

/** Non-voice source sets share the protected codec/export path. No cue length is
 * silently changed to fit a budget. Bed overlaps produce a measured derivative. */
export function exportSoundSet(manifestFile,output,{seed=0,...options}={}){
 const root=path.dirname(path.resolve(manifestFile)),manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes),intake=inspectSoundSet(root,manifest);
 need(['ability','battle','bed'].includes(manifest.kind),'weather export has no approved technical profile');
 need(Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff,'uint32 seed');
 need(!fs.existsSync(output),'new output directory required; never overwrite an accepted export');
 const results=[];
 for(const row of [...manifest.masters].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)){
  const source=readBoundFile(root,row);let input=source,loop=null,sidecarBytes=null;
  let profile=(manifest.kind==='ability'&&row.path.endsWith('.impact.wav'))||(manifest.kind==='battle'&&['cursor.wav','confirm.wav','cancel.wav','hitstop-thump.wav'].includes(row.path))?'impact':'cue';
  if(manifest.kind==='bed'){
   sidecarBytes=readBoundFile(root,row.loop);loop=renderDeclaredLoop(source,JSON.parse(sidecarBytes),seed);input=loop.wav;profile='bed';
  }
  const exported=exportAudioBytes(input,profile,options);
  const originalMeasurement=loop?measureAudio(source,'wav',wavFacts(source,2).durationSeconds,options.ffmpeg):exported.receipt.sourceMeasurement;
  requireAudioPeaks(originalMeasurement,exported.receipt.encodedMeasurement);
  results.push({originalMeasurement,name:row.path.replace(/\.wav$/,'.opus'),sourceSha256:row.sha256,opus:exported.opus,receipt:exported.receipt,loop:loop?.receipt??null,sidecarSha256:sidecarBytes?sha256(sidecarBytes):null});
 }
 for(const row of manifest.masters){readBoundFile(root,row);if(row.loop)readBoundFile(root,row.loop);}
 need(fs.readFileSync(manifestFile).equals(manifestBytes),'source manifest changed during export');
 fs.mkdirSync(output);try{
  for(const r of results)fs.writeFileSync(path.join(output,r.name),r.opus,{flag:'wx'});
  const report={schema:'cf.sound-export-set/v1',status:'TECHNICAL_READY_FOR_REVIEW',kind:manifest.kind,key:manifest.key??null,seed,
   sourceManifestSha256:sha256(manifestBytes),intake,outputs:results.map(({opus,...row})=>row),qualityAccepted:false};
  fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
 }catch(error){fs.rmSync(output,{recursive:true,force:true});throw error;}
}
