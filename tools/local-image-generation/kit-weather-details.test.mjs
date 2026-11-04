import {test} from 'node:test';import assert from 'node:assert/strict';import {applyWeatherDetails} from './kit-weather-details.mjs';import {applyKitWeather} from './kit-weather-math.mjs';
const card='  Light: day; diffuse cloud-filtered light\n  Atmosphere: weather rain, water liquid; pigment earth';
test('new weather levers preserve E when disabled, input/alpha and replay; clear weather refuses wet detail',()=>{
 const w=40,h=30,source=new Uint8ClampedArray(w*h*4).fill(140);for(let p=3;p<source.length;p+=4)source[p]=255;
 const alpha=new Uint8Array(w*h);for(let y=12;y<26;y++)for(let x=8;x<25;x++)alpha[y*w+x]=255;const organisms=[{name:'Civet',alpha}],original=source.slice(),before=alpha.slice(),none={sheen:false,wetContrast:false,foregroundRain:false},all={sheen:true,wetContrast:true,foregroundRain:true};
 const run=(levers,c=card)=>applyWeatherDetails(source,w,h,organisms,133,c,levers);
 assert.deepEqual(run(none).rgba,applyKitWeather(source,w,h,organisms,133,card,{dropletCount:3,specularStrength:3,precipitationDensity:2}).rgba);
 const result=run(all);assert.deepEqual(result,run(all));assert.notDeepEqual(result.rgba,run(none).rgba);assert.deepEqual(source,original);assert.deepEqual(alpha,before);for(let p=3;p<source.length;p+=4)assert.equal(result.rgba[p],source[p]);
 for(const lever of ['sheen','wetContrast','foregroundRain'])assert.notDeepEqual(run({...none,[lever]:true}).rgba,run(none).rgba);
 const clear=card.replace('weather rain','weather clear');assert.deepEqual(run(all,clear).rgba,run(none,clear).rgba);
 assert.throws(()=>run({...all,unknown:true}),/levers/);
});
