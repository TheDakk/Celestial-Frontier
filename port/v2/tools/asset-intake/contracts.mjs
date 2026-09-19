/** Intake facts only; quality acceptance remains Nick's. No source writes. */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error('Intake: '+why);};
export function readBoundFile(root,row){
 need(typeof row.path==='string'&&!path.isAbsolute(row.path)&&!row.path.split(/[\\/]/).includes('..'),'relative file path');
 const base=fs.realpathSync(root),file=fs.realpathSync(path.join(base,row.path));
 need(file.startsWith(base+path.sep),'file escapes source root');
 const bytes=fs.readFileSync(file);need(/^[a-f0-9]{64}$/.test(row.sha256)&&sha256(bytes)===row.sha256,'source hash: '+row.path);return bytes;
}
export function pngFacts(bytes){
 need(bytes.length>=33&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR'&&bytes.readUInt32BE(8)===13,'PNG header');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);need(width>0&&height>0&&width*height<=64*1024*1024,'PNG dimensions / intake budget');
 const decoded=PNG.sync.read(bytes,{checkCRC:true});need(decoded.width===width&&decoded.height===height,'PNG decode dimensions');return {width,height};
}
export function inspectMaster(bytes,kind){
 need(['cutout','plate'].includes(kind),'unknown runtime class');const size=pngFacts(bytes);
 const minimum=kind==='cutout'?{width:384,height:384}:{width:1024,height:576};
 need(size.width>=minimum.width&&size.height>=minimum.height,'master below runtime input size');
 return {...size,minimum,sha256:sha256(bytes),bytes:bytes.length,qualityAccepted:false};
}
export function wavFacts(bytes,channels=1){
 need(channels===1||channels===2,'mono or stereo channel policy');
 need(bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE'&&bytes.readUInt32LE(4)+8===bytes.length,'RIFF length/header');
 let format=null,data=null;
 for(let p=12;p<bytes.length;){need(p+8<=bytes.length,'truncated chunk header');const id=bytes.toString('ascii',p,p+4),n=bytes.readUInt32LE(p+4),end=p+8+n;need(end+(n%2)<=bytes.length,'truncated chunk');
  if(id==='fmt '){need(!format&&n>=16,'duplicate/short format');format={pcm:bytes.readUInt16LE(p+8),channels:bytes.readUInt16LE(p+10),rate:bytes.readUInt32LE(p+12),byteRate:bytes.readUInt32LE(p+16),align:bytes.readUInt16LE(p+20),bits:bytes.readUInt16LE(p+22)};
   // FFmpeg's valid 24-bit WAVE_FORMAT_EXTENSIBLE output carries a PCM subtype.
   // Normalize only that exact subtype after checking precision and speaker layout.
   if(format.pcm===0xfffe){need(n>=40&&bytes.readUInt16LE(p+24)===22&&bytes.readUInt16LE(p+26)===24,'extensible precision/header');
    const mask=bytes.readUInt32LE(p+28);need(mask===0||mask===(channels===1?4:3),'extensible channel layout');
    need(bytes.subarray(p+32,p+48).equals(Buffer.from('0100000000001000800000aa00389b71','hex')),'extensible PCM subtype');format.pcm=1;}
  }
  if(id==='data'){need(data===null,'duplicate audio data');data=bytes.subarray(p+8,end);}p=end+n%2;
 }
 need(format&&data&&data.length>0,'missing format/data');need(format.pcm===1&&format.channels===channels&&format.rate===48000&&format.bits===24&&format.align===3*channels&&format.byteRate===144000*channels,'48 kHz 24-bit '+(channels===1?'mono':'stereo')+' PCM required');need(data.length%(3*channels)===0,'partial PCM frame');
 let peak=0;for(let i=0;i<data.length;i+=3){let n=data.readUIntLE(i,3);if(n>=0x800000)n-=0x1000000;peak=Math.max(peak,Math.abs(n)/0x800000);}
 need(peak>0,'silent master');need(peak<=10**(-1/20),'sample clipping/headroom');
 return {frames:data.length/(3*channels),durationSeconds:data.length/(144000*channels),samplePeakDb:20*Math.log10(peak),format};
}
export const VOICE_CUES=Object.freeze(['call','alert','attack-vocal','hurt','faint','victory','breath-idle','land-thud']);
export const ARCHETYPES=Object.freeze(['quadruped','hopper','biped-bird','fish','insect','arachnid','serpent','myriapod','radial','cephalopod','flyer-membrane','primate']);
export function inspectVoiceSet(root,manifest){
 need(manifest.schema==='cf.voice-source-intake/v1'&&ARCHETYPES.includes(manifest.archetype),'voice source schema/archetype');
 need(Array.isArray(manifest.masters),'source inventory');const prefix=manifest.archetype+'.',names=manifest.masters.map(r=>r.path);
 const steps=names.filter(n=>new RegExp('^'+manifest.archetype+'\\.footfall-set\\.[1-6]\\.wav$').test(n));
 const expected=[...VOICE_CUES.map(c=>prefix+c+'.wav'),...Array.from({length:steps.length},(_,i)=>prefix+'footfall-set.'+(i+1)+'.wav')].sort();
 need(steps.length>=4&&steps.length<=6&&JSON.stringify([...names].sort())===JSON.stringify(expected),'eight cues and four to six consecutive footfalls required');
 const rows=manifest.masters.map(row=>{
  need(typeof row.rights?.owner==='string'&&row.rights.owner.trim()&&typeof row.rights?.license==='string'&&row.rights.license.trim()&&typeof row.rights?.source==='string'&&row.rights.source.trim()&&row.rights.redistribution===true,'per-master redistribution rights');
  need(row.dry===true,'dry source declaration');const bytes=readBoundFile(root,row),facts=wavFacts(bytes);
  need(facts.durationSeconds<(row.path.includes('.footfall-set.')?.3:2),'cue too long');
  // Sample peak is not true peak, and declarations do not prove sound or rights.
  return {path:row.path,sha256:row.sha256,bytes:bytes.length,...facts,rights:row.rights};
 });
 return {schema:'cf.voice-source-intake-report/v1',archetype:manifest.archetype,masters:rows,qualityAccepted:false,pending:['independent true-peak/loudness measurement','rights review','dry-source listening','Civet/fox/procedural derivation listening','Opus export and arena wiring']};
}
