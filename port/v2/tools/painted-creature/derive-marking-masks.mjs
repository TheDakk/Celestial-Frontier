/** Deterministic derived masks. Source RGBA/geometry is never modified. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
export const PATTERNS=Object.freeze(['striped','spotted','banded','mottled','marbled','eye-spotted']);
const sha=x=>createHash('sha256').update(x).digest('hex');
export function assessMarkingMask(mask,source){
 if(mask.width!==source.width||mask.height!==source.height||mask.data.length!==source.data.length)throw Error('Mask dimensions');
 let outsideAlphaPixels=0,alphaExceedsKeyedPixels=0,nonWhiteRgbPixels=0,nonzeroAlphaPixels=0;
 for(let i=0;i<mask.data.length;i+=4){const a=mask.data[i+3],limit=source.data[i+3];outsideAlphaPixels+=a>0&&limit===0;alphaExceedsKeyedPixels+=a>limit;nonzeroAlphaPixels+=a>0;nonWhiteRgbPixels+=mask.data[i]!==255||mask.data[i+1]!==255||mask.data[i+2]!==255;}
 return {status:outsideAlphaPixels||alphaExceedsKeyedPixels||nonWhiteRgbPixels||!nonzeroAlphaPixels?'FAIL':'PASS',outsideAlphaPixels,alphaExceedsKeyedPixels,nonWhiteRgbPixels,nonzeroAlphaPixels};
}
export function deriveMarkingMask(source,pattern,seed=0){
 if(!PATTERNS.includes(pattern)||!Number.isSafeInteger(seed))throw Error('Pattern/seed');
 const out=new PNG({width:source.width,height:source.height});let x0=source.width,y0=source.height,x1=-1,y1=-1;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(source.data[(y*source.width+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1<x0)throw Error('Empty source');let mixed=seed>>>0;mixed=Math.imul(mixed^(mixed>>>16),0x7feb352d);mixed=Math.imul(mixed^(mixed>>>15),0x846ca68b);const phase=((mixed^(mixed>>>16))>>>0)/4294967296*Math.PI*2;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
  const u=(x-x0)/(x1-x0+1),v=(y-y0)/(y1-y0+1),sx=Math.sin(u*37+Math.sin(v*13+phase)*1.3+phase),sy=Math.sin(v*29+Math.sin(u*9)*1.2+phase);
  const gx=u*11+.22*Math.sin(v*17+phase),gy=v*9+.22*Math.sin(u*13+phase),dx=gx-Math.floor(gx)-.5,dy=gy-Math.floor(gy)-.5,d=Math.hypot(dx,dy);
  const val=pattern==='striped'?sx>.35:pattern==='banded'?sy>.45:pattern==='spotted'?d<.22:pattern==='eye-spotted'?d>.19&&d<.31:pattern==='mottled'?Math.sin(u*31+phase)*Math.sin(v*23)+.45*Math.sin((u+v)*61)>.22:Math.sin(u*22+3*Math.sin(v*12+Math.sin(u*15))+phase)>.38;
  const i=(y*source.width+x)*4;out.data.set([255,255,255,val?source.data[i+3]:0],i);
 }
 if(assessMarkingMask(out,source).status!=='PASS')throw Error('Derived conservation');return out;
}
export function writeDerivedMasks(sourceFile,out,seed){
 if(fs.existsSync(out))throw Error('New output directory required');const bytes=fs.readFileSync(sourceFile),source=PNG.sync.read(bytes);
 // Input must already be keyed RGBA; opaque magenta would conserve the wrong silhouette.
 if(!source.data.some((v,i)=>i%4===3&&v===0))throw Error('Keyed alpha source required');
 fs.mkdirSync(out,{recursive:true});const rows=[];
 for(const pattern of PATTERNS){const mask=deriveMarkingMask(source,pattern,seed),file=pattern+'.png',b=PNG.sync.write(mask);fs.writeFileSync(path.join(out,file),b,{flag:'wx'});const report=assessMarkingMask(PNG.sync.read(b),source);if(report.status!=='PASS')throw Error('Encoded mask conservation');rows.push({pattern,file,sha256:sha(b),bytes:b.length,...report});}
 const report={schema:'cf.derived-marking-masks/v1',status:'PASS',source:path.resolve(sourceFile),sourceSha256:sha(bytes),width:source.width,height:source.height,seed,algorithmSha256:sha(fs.readFileSync(import.meta.filename)),space:'master',plain:null,iridescent:{mode:'emissive',mask:null},scope:'candidate masks bound to source alpha; no rig or anatomical-material exclusion claim; not wired until admitted',rows};
 if(sha(fs.readFileSync(sourceFile))!==report.sourceSha256)throw Error('Source changed');fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){if(process.argv.length!==5)throw Error('Usage: KEYED_PNG NEW_OUTPUT SEED');const r=writeDerivedMasks(process.argv[2],path.resolve(process.argv[3]),Number(process.argv[4]));console.log(JSON.stringify({status:r.status,masks:r.rows.length,bytes:r.rows.reduce((n,x)=>n+x.bytes,0)}));}
