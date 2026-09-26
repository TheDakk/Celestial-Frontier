/** Review-only new-lever ladder over rain E. Not a compiler default. */
import {applyKitWeather,readCompositorSystemCard} from './kit-weather-math.mjs';
const E=Object.freeze({dropletCount:3,specularStrength:3,precipitationDensity:2});
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function applyWeatherDetails(source,w,h,organisms,seed,card,levers){
 if(Object.keys(levers).sort().join(',')!=='foregroundRain,sheen,wetContrast'||Object.values(levers).some(v=>typeof v!=='boolean'))throw Error('Weather detail levers');
 const baseline=applyKitWeather(source,w,h,organisms,seed,card,E),out=baseline.rgba.slice(),light=readCompositorSystemCard(card);
 const active=baseline.receipt.kind==='rain'&&light.waterState==='liquid',illumination=light.timeOfDay==='night'?.36:light.timeOfDay==='dusk'?.66:1;
 let sheenPixels=0,compressedPixels=0,foregroundStrokes=0;
 if(active)for(const organism of organisms){
  const fur=['Civet','Platypus'].includes(organism.name),flora=['Persimmon',"Devil's Club",'Cranberry'].includes(organism.name);if(!fur&&!flora)continue;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,p=i*4,a=organism.alpha[i]/255;if(!a)continue;
   if(fur&&levers.wetContrast){for(let c=0;c<3;c++){const v=out[p+c]/255;const wet=Math.max(0,Math.min(1,(v-.32)*1.18+.24));out[p+c]=Math.round(out[p+c]*(1-a)+wet*255*a);}compressedPixels++;}
   if(levers.sheen){
    let edge=-1;for(let d=0;d<8;d++){const yy=y-d;if(yy<0||organism.alpha[yy*w+x]<48){edge=d;break;}}
    if(edge>=1){const softness=Math.exp(-(((edge-3)/2.7)**2)),opacity=.18*softness*a*illumination;
     for(let c=0;c<3;c++)out[p+c]=Math.round(out[p+c]*(1-opacity)+[178,197,207][c]*opacity);sheenPixels++;}
   }
  }
 }
 if(active&&levers.foregroundRain){
  // Same density as E's whole-frame sky pass; foreground is one uninterrupted
  // layer across plate and organisms. Separate seed leaves E's strokes intact.
  const random=rng(seed^0x46524752),start=Math.floor(h*.38),density=baseline.receipt.wholeFrameDensity;
  foregroundStrokes=Math.round(w*(h-start)*density);
  for(let n=0;n<foregroundStrokes;n++){const x=Math.floor(random()*w),y=start+Math.floor(random()*(h-start)),length=10+Math.floor(random()*14),strength=(.16+random()*.10)*illumination;
   for(let k=0;k<length;k++){const xx=x+Math.floor(k*.24),yy=y+k;if(xx>=w||yy>=h)continue;const p=(yy*w+xx)*4,opacity=strength*Math.sin(Math.PI*(k+.5)/length);for(let c=0;c<3;c++)out[p+c]=Math.round(out[p+c]*(1-opacity)+[192,211,225][c]*opacity);}
  }
 }
 return {rgba:out,receipt:{schema:'cf.weather-details-review/v1',seed,levers,baseline:E,sheenPixels,compressedPixels,foregroundStrokes,foregroundDensity:baseline.receipt.wholeFrameDensity,qualityAccepted:false,geometryChanged:false,modelRuns:0}};
}
