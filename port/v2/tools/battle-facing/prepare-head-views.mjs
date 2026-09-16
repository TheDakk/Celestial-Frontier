/** Source-only turnaround intake. Original sheet/master bytes remain immutable. */
import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';
import{hashBytes,hashJSON}from'../creature-animation/quadruped-template.mjs';
import{keyAndDespill}from'../../../../tools/local-image-generation/kit-contact-math.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const out=path.resolve(process.argv[2]);if(fs.existsSync(out))throw Error('New output required');fs.mkdirSync(out,{recursive:true});
const source='audits/CIVET_ANIMATION_PROOF_20260912/civet-turnaround-01.png',bytes=fs.readFileSync(source),png=PNG.sync.read(bytes),keyed=keyAndDespill(png.data,png.width,png.height),record=JSON.parse(fs.readFileSync('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'));
const inside=(x,y,poly)=>{let odd=false;for(let i=0,k=poly.length-1;i<poly.length;k=i++){const a=poly[i],b=poly[k];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])odd=!odd;}return odd;};
const views=[];
for(const spec of [
 {id:'profile',polygon:[[362,192],[552,190],[594,290],[617,391],[622,477],[585,548],[533,550],[470,494],[428,435],[362,414]],sourcePivot:[528,410],targetPivot:[.81,.492],scale:1.5,reflectX:true,eye:[453,328],nose:[381,379]},
 {id:'front',polygon:[[82,195],[300,193],[313,321],[290,403],[249,451],[149,451],[96,412],[73,300]],sourcePivot:[198,421],targetPivot:[.828,.398],scale:1.08,reflectX:false,eye:[195,336],nose:[198,381]}
]){
 const cut=new PNG({width:png.width,height:png.height});let count=0;
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++)if(inside(x+.5,y+.5,spec.polygon)){const i=(y*png.width+x)*4;cut.data.set(keyed.rgba.subarray(i,i+4),i);if(spec.id==='profile'&&y>510)cut.data[i+3]=Math.round(cut.data[i+3]*Math.max(0,(550-y)/40));if(cut.data[i+3])count++;}
 const data=PNG.sync.write(cut),file=spec.id+'.png';fs.writeFileSync(path.join(out,file),data);
 const map=p=>[spec.targetPivot[0]+(p[0]-spec.sourcePivot[0])*spec.scale*(spec.reflectX?-1:1)/record.geometry.width,spec.targetPivot[1]+(p[1]-spec.sourcePivot[1])*spec.scale/record.geometry.height];
 views.push({...spec,file,sha256:await hashBytes(data),width:png.width,height:png.height,paintedPixels:count,neckBlend:{top:400,bottom:540},details:spec.id==='profile'?[{joint:'earFarTip',pivot:[450,281],bounds:[380,150,490,310],feather:40,rotationSign:1,direction:-1,extent:65},{joint:'earNearTip',pivot:[514,307],bounds:[442,150,590,340],feather:40,rotationSign:1,direction:-1,extent:72},{joint:'jaw',pivot:[480,384],bounds:[300,365,560,570],feather:40,rotationSign:1,direction:1,extent:60}]:[],gaze:{origin:map(spec.eye),forward:map(spec.nose)},yawRadians:spec.id==='profile'?0:Math.PI/2});
}
const body={schema:'cf.authored-head-views/v1',recordRecipeHash:record.recipeHash,source,sourceSha256:await hashBytes(bytes),replaces:['head','jaw','ear-far','ear-near'],joint:'head',attachments:Array.from({length:17},(_,i)=>{const t=i/16;return{id:'throat-'+String(i).padStart(2,'0'),from:{surface:'profile',point:[(435-23*t)/png.width,(389-t)/png.height]},to:{surface:'neck',point:[.91+.022*t,.48+.01*t]},radiusPx:1};}),views,scope:'Existing turnaround intake only. Profile reflection is side-view facing, not fabricated hidden anatomy. Source-to-record alignment awaits visual review.'};
fs.writeFileSync(path.join(out,'views.json'),JSON.stringify({...body,bindingHash:await hashJSON(body)},null,2)+'\n');console.log(JSON.stringify(views.map(v=>({id:v.id,paintedPixels:v.paintedPixels,gaze:v.gaze})),null,2));
