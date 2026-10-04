import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
export function inspectCapturePcm(samples,sampleRate){
 if(!samples?.length||!Number.isFinite(sampleRate)||sampleRate<=0)throw Error('Capture audio: missing samples');
 let peak=0,sum=0,nonzero=0;for(const value of samples){if(!Number.isFinite(value))throw Error('Capture audio: nonfinite decoded sample');peak=Math.max(peak,Math.abs(value));sum+=value*value;if(Math.abs(value)>1e-6)nonzero++;}
 if(!nonzero||peak<1e-5)throw Error('Capture audio: decoded track is silent');
 const seconds=samples.length/sampleRate;if(seconds<9.9||seconds>11)throw Error('Capture audio: incomplete decoded timeline');
 return {status:'PASS',sampleRate,frames:samples.length,seconds,peak,rms:Math.sqrt(sum/samples.length),nonzeroSamples:nonzero,finite:true,scope:'Encoded audio track decode/content evidence; not C3 listening acceptance'};
}
export function inspectCaptureAudio(file){
 const bytes=execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','-ac','1','-ar','48000','pipe:1'],{maxBuffer:8*1024*1024});
 if(bytes.length%4)throw Error('Capture audio: partial PCM frame');const values=new Float32Array(bytes.length/4);for(let i=0;i<values.length;i++)values[i]=bytes.readFloatLE(i*4);
 return inspectCapturePcm(values,48000);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(process.argv.length!==3)throw Error('Usage: capture-audio.mjs CAPTURE.webm');console.log(JSON.stringify(inspectCaptureAudio(process.argv[2]),null,2));}
