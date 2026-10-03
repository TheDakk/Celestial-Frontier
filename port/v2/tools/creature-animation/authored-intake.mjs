import {alphaBounds,keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';

/** Preserve real delivered alpha. Keying transparent RGB resurrects invisible pixels.
 * This admits diagnostic geometry only, never grants kit/visual acceptance. */
export function intakeAuthoredPixels(rgba,width,height){
 if(rgba.length!==width*height*4)throw Error('Authored intake byte shape');
 let transparent=0,visible=0;
 for(let i=3;i<rgba.length;i+=4){if(rgba[i]===0)transparent++;if(rgba[i]>16)visible++;}
 if(!visible)throw Error('Authored intake is blank');
 if(!transparent)return keyAndDespill(rgba,width,height);
 const alpha=Uint8Array.from({length:width*height},(_,i)=>rgba[i*4+3]),bounds=alphaBounds(alpha,width,height);
 if(bounds.width>width*.98||bounds.height>height*.98)throw Error('Authored alpha isolation lost');
 // A partly transparent export containing an opaque key field needs explicit repair.
 for(let x=0;x<width;x++)for(const y of[0,height-1])if(alpha[y*width+x]>16)throw Error('Authored alpha has opaque border');
 for(let y=0;y<height;y++)for(const x of[0,width-1])if(alpha[y*width+x]>16)throw Error('Authored alpha has opaque border');
 return {rgba:new Uint8ClampedArray(rgba),alpha,bounds,receipt:{mode:'delivered alpha preserved byte-for-byte',erodedPixels:0,despilledPixels:0,kitAcceptance:false}};
}
