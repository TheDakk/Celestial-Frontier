#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs');
import {applyWeatherDetails} from './kit-weather-details.mjs';import {applyKitWeather} from './kit-weather-math.mjs';
const [destination]=process.argv.slice(2);if(!destination||process.argv.length!==3||fs.existsSync(destination))throw Error('Supply a NEW output directory');
const out=path.resolve(destination),base=path.resolve('audits/ART_KIT_WEATHER_MAT_20260912'),run=base+'/native-01',W=1024,H=576;
const sha=b=>createHash('sha256').update(b).digest('hex'),raw=p=>new Uint8ClampedArray(execFileSync('magick',[p,'-depth','8','rgba:-'],{maxBuffer:16e6}));
const sourceFile=run+'/finisher-before-weather.png',baselineFile=path.resolve('audits/ART_KIT_WEATHER_LADDER_20260912/E.png'),triptychFile=path.resolve('audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png');
const source=raw(sourceFile),recipe=JSON.parse(fs.readFileSync(base+'/prepared/recipe.json')),result=JSON.parse(fs.readFileSync(run+'/result.json'));
const masks=result.details.boxes.map((b,i)=>{const bytes=raw(run+`/organism-${String(i+1).padStart(2,'0')}-mask.png`);return {name:b.name,alpha:Uint8Array.from({length:W*H},(_,j)=>bytes[j*4])};});
const baseline=applyKitWeather(source,W,H,masks,133,recipe.compositorSystemCard,{dropletCount:3,specularStrength:3,precipitationDensity:2});assert.deepEqual(baseline.rgba,raw(baselineFile));
const sourceHash=sha(source),maskHashes=masks.map(m=>sha(m.alpha));fs.mkdirSync(out);
const variants=[['S',true,false,false],['V',false,true,false],['P',false,false,true],['SV',true,true,false],['SP',true,false,true],['SVP',true,true,true]];
const manifest={schema:'cf.weather-details-ladder/v1',source:sourceFile,sourceSha256:sha(fs.readFileSync(sourceFile)),baselineSha256:sha(fs.readFileSync(baselineFile)),modelRuns:0,compilerDefaultChanged:false,variants:[],controls:{baselineEExact:true,sourceAndMasksUnchanged:true,replayExact:true,alphaUnchanged:true}};
const tiles=[],font='/System/Library/Fonts/Supplemental/Arial.ttf';
function tile(file,label,id){const dest=out+'/tile-'+id+'.png';execFileSync('magick',['-size','1024x40','xc:#111916','-font',font,'-pointsize','19','-fill','#eef1ec','-gravity','West','-annotate','+12+0',label,file,'-append',dest]);tiles.push(dest);}
tile(baselineFile,'Accepted E — current compiler default','E');
execFileSync('magick',[triptychFile,'-resize','1024x576','-background','#111916','-gravity','center','-extent','1024x576',out+'/triptych-fit.png']);tile(out+'/triptych-fit.png','Living Worlds triptych — direction reference','triptych');
for(const [id,sheen,wetContrast,foregroundRain] of variants){const levers={sheen,wetContrast,foregroundRain},painting=applyWeatherDetails(source,W,H,masks,133,recipe.compositorSystemCard,levers);assert.deepEqual(painting,applyWeatherDetails(source,W,H,masks,133,recipe.compositorSystemCard,levers));assert.equal(sha(source),sourceHash);assert.deepEqual(masks.map(m=>sha(m.alpha)),maskHashes);for(let p=3;p<source.length;p+=4)assert.equal(painting.rgba[p],source[p]);assert.notDeepEqual(painting.rgba,baseline.rgba);
 const file=out+'/'+id+'.png';const png=PNG.sync.write({width:W,height:H,data:Buffer.from(painting.rgba)});assert.deepEqual(png,PNG.sync.write({width:W,height:H,data:Buffer.from(painting.rgba)}));fs.writeFileSync(file,png,{flag:'wx'});manifest.variants.push({id,file:path.basename(file),sha256:sha(fs.readFileSync(file)),...painting.receipt});tile(file,id+' — '+[sheen&&'soft sky-facing sheen',wetContrast&&'wet fur contrast',foregroundRain&&'foreground rain'].filter(Boolean).join(' + '),id);
}
execFileSync('magick',['montage','-font',font,...tiles,'-tile','2x4','-geometry','+0+0',out+'/review-sheet.png']);fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({output:out,variants:variants.length,modelRuns:0}));
