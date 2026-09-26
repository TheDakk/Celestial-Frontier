/** Deterministic crossfade derivative of a declared PCM loop. Originals stay intact.
 * The selected region loses one overlap length; this is recorded, never padded silently. */
import {inspectLoop} from './sound-set.mjs';
import {sha256,wavFacts} from './contracts.mjs';
export function renderDeclaredLoop(source,sidecar,seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Loop seed must be uint32');
 const before=sha256(source),facts=wavFacts(source,sidecar?.channels),inspection=inspectLoop(source,before,sidecar);
 let data;for(let p=12;p<source.length;){const size=source.readUInt32LE(p+4);if(source.toString('ascii',p,p+4)==='data'){data=source.subarray(p+8,p+8+size);break;}p+=8+size+size%2;}
 const {startFrame:start,endFrame:end,crossfadeFrames:fade}=sidecar,n=end-start,frames=n-fade,channels=facts.format.channels;
 if(fade<2)throw Error('Rendered loop crossfade needs at least two frames');
 const pcm=Buffer.alloc(frames*channels*3);
 const sample=(frame,ch)=>data.readIntLE((frame*channels+ch)*3,3);
 // Keep the unoverlapped middle, then join tail -> head. Convex smoothstep mixing
 // avoids the correlated-source gain increase of equal-power overlaps.
 for(let i=0;i<frames;i++)for(let ch=0;ch<channels;ch++){
  let value;if(i<n-2*fade)value=sample(start+fade+i,ch);
  else{const j=i-(n-2*fade),t=j/(fade-1),w=t*t*(3-2*t);value=Math.round((1-w)*sample(end-fade+j,ch)+w*sample(start+j,ch));}
  pcm.writeIntLE(value,(i*channels+ch)*3,3);
 }
 let mixed=seed>>>0;mixed=Math.imul(mixed^(mixed>>>16),0x7feb352d);mixed=Math.imul(mixed^(mixed>>>15),0x846ca68b);mixed=(mixed^(mixed>>>16))>>>0;
 const offset=mixed%frames,bytesPerFrame=channels*3,rotated=Buffer.concat([pcm.subarray(offset*bytesPerFrame),pcm.subarray(0,offset*bytesPerFrame)]);
 const wav=Buffer.alloc(44+rotated.length+(rotated.length%2));wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(channels,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(48000*bytesPerFrame,28);wav.writeUInt16LE(bytesPerFrame,32);wav.writeUInt16LE(24,34);wav.write('data',36);wav.writeUInt32LE(rotated.length,40);rotated.copy(wav,44);
 if(sha256(source)!==before)throw Error('Loop source changed');
 const recipe={schema:'cf.audio-loop-render/v1',sourceSha256:before,sidecarSha256:sha256(Buffer.from(JSON.stringify(sidecar))),seed,phaseOffsetFrames:offset,overlapFrames:fade,outputFrames:frames,method:'smoothstep-convex-tail-head-v1'};
 return {wav,receipt:{recipe,recipeHash:sha256(Buffer.from(JSON.stringify(recipe))),inspection,output:{...wavFacts(wav,channels),sha256:sha256(wav)},qualityAccepted:false,pending:['source and loop listening','mix and codec true peak','runtime playback policy']}};
}
