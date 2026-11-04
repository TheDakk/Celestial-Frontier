/** Read-only source diagnostic. Count the existing triage predicate before any fix. */
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {keyAndDespill,erodeAlpha,pinkExcess} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
const req=createRequire(new URL('../../../../port/v2/package.json',import.meta.url)),{PNG}=req('pngjs');
const sources=[
 ['Moth','audits/G2_C92_20260927/19-moth/master.png'],
 ['Bee','audits/INSECT_REFERENCES_C86_20260927/04-bee-six-legs/master.png'],
 ['Water Beetle','audits/G2_C114_20260927/23-water-beetle/master.png'],
 ['Yak','audits/C243_ALLOUT_20261011/execution/batch01/c243b01r1c1-13-yak/master.png']
];
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Fresh report required');
const magenta=(r,g,b)=>r>170&&b>150&&g<110&&r-g>90,rows=[];
for(const[name,file]of sources){
 const bytes=fs.readFileSync(file),p=PNG.sync.read(bytes),w=p.width,h=p.height,rgba=new Uint8ClampedArray(p.data),keyed=keyAndDespill(rgba,w,h),inner=erodeAlpha(keyed.alpha,w,h,3);
 let magentaVisible=0,magentaInterior=0,magentaEdge=0,pinkInterior=0;const samples=[];
 for(let i=0;i<w*h;i++){
  if(!keyed.alpha[i])continue;const q=i*4,[r,g,b]=keyed.rgba.subarray(q,q+3);
  if(inner[i]&&pinkExcess(r,g,b)>8)pinkInterior++;
  if(!magenta(r,g,b))continue;magentaVisible++;if(inner[i])magentaInterior++;else magentaEdge++;
  if(samples.length<40)samples.push({x:i%w,y:Math.floor(i/w),source:[...rgba.subarray(q,q+3)],keyed:[r,g,b],interior:!!inner[i]});
 }
 rows.push({name,file,sourceSha256:createHash('sha256').update(bytes).digest('hex'),keyedReceipt:keyed.receipt,magentaVisible,magentaInterior,magentaEdge,pinkInterior,samples});
 console.log(JSON.stringify({name,magentaVisible,magentaInterior,magentaEdge}));
}
fs.writeFileSync(out,JSON.stringify({scope:'Read-only source-keyer diagnosis; no native/admission claim; existing triage colour predicate unchanged',rows},null,2)+'\n',{flag:'wx'});
