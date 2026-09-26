// Adapted from ARCHETYPE_REPAIRS_20260922/08-radial/review-sheet.mjs.
// Full source canvases are retained: no trim, crop, or anatomical registration.
// Usage: node review-sheet.mjs --packet DIR --fit DIR --native DIR --output FILE.png
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const root='/Users/nick/Projects/celestial-frontier-openai-mac';
const req=createRequire(root+'/port/v2/package.json');
const sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){
  const key=args[i];
  if(!['--packet','--fit','--native','--output'].includes(key)||!args[i+1]||Object.hasOwn(options,key))throw Error('Expected explicit --packet DIR --fit DIR --native DIR --output FILE.png');
  options[key]=path.resolve(args[i+1]);
}
if(Object.keys(options).length!==4)throw Error('All four explicit paths are required');
const packet=options['--packet'],fit=options['--fit'],native=options['--native'],output=options['--output'];
if(fs.existsSync(output))throw Error('Refusing to overwrite retained review sheet: '+output);
const readJson=file=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
const subject=readJson(path.join(packet,'subject-source.json'));
if(!subject?.name||!subject?.family)throw Error('Source subject identity is required');
const master=path.join(packet,'master.png'),record=readJson(path.join(fit,'record.json'));
const refusal=readJson(path.join(fit,'refusal.json'));
const report=readJson(path.join(native,'report.json'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const firstLine=value=>String(value??'').split('\n')[0];
const fitReason=refusal?firstLine(refusal.error):'No admitted fit result is available at the explicit path';
const text=(title,body='',caption='')=>Buffer.from(`<svg width="780" height="440"><rect width="100%" height="100%" fill="#18252b"/><text x="20" y="34" fill="#eadbb6" font-family="Arial" font-size="21">${escape(title)}</text>${body?'<text x="24" y="112" fill="#c8d5d7" font-family="Arial" font-size="17">'+(String(body).match(/.{1,68}(?:\s|$)|.{1,68}/g)??[]).slice(0,9).map((line,i)=>'<tspan x="24" dy="'+(i?27:0)+'">'+escape(line)+'</tspan>').join('')+'</text>':''}<text x="20" y="426" fill="#a8bdc3" font-family="Arial" font-size="14">${escape(String(caption).slice(0,96))}</text></svg>`);
const placeholder=(title,reason)=>sharp(text(title,reason)).png().toBuffer();
const imageTile=async(input,title,caption='')=>{
  const {data,info}=await sharp(input).resize(738,356,{fit:'inside'}).png().toBuffer({resolveWithObject:true});
  return sharp(text(title,'',caption)).composite([{input:data,left:Math.floor((780-info.width)/2),top:52+Math.floor((356-info.height)/2)}]).png().toBuffer();
};
const tiles=[];
tiles.push(fs.existsSync(master)?await imageTile(master,'MASTER — '+subject.name,'Complete source canvas; no trimming'):await placeholder('MASTER UNAVAILABLE','No master.png at the explicit packet path'));

const labels=path.join(fit,'labels.png');
if(fs.existsSync(labels)){
  const {data,info}=await sharp(labels).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4){const k=data[i];data[i]=(k*71)%256;data[i+1]=(k*127)%256;data[i+2]=(k*191)%256;data[i+3]=k?255:0;}
  const colored=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  tiles.push(await imageTile(colored,'AUTHORED LABELS','Retained ownership labels; display colors only'));
}else tiles.push(await placeholder('LABELS UNAVAILABLE',fitReason));

const author=readJson(path.join(packet,'authoring.json'));
if(fs.existsSync(master)&&(record?.landmarks||author?.landmarksPx)){
  const metadata=await sharp(master).metadata(),width=metadata.width,height=metadata.height;
  if(!width||!height)throw Error('Master dimensions unavailable');
  if(record&&(record.geometry.width!==width||record.geometry.height!==height))throw Error('Record/master dimensions disagree');
  const points=record?.landmarks?Object.fromEntries(Object.entries(record.landmarks).map(([j,p])=>[j,[p[0]*width,p[1]*height]])):author.landmarksPx;
  for(const p of Object.values(points))if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))throw Error('Invalid retained landmark');
  let overlay=`<svg width="${width}" height="${height}">`;
  for(const [child,parent]of subject.contract?.graph??[]){
    const a=points[child],b=points[parent];if(!a||!b)continue;
    overlay+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#00ffff" stroke-width="3"/>`;
  }
  for(const [joint,p]of Object.entries(points))overlay+=`<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#ffff00"/><text x="${p[0]+8}" y="${p[1]-8}" font-family="Arial" font-size="16" fill="white" stroke="black" stroke-width=".5">${escape(joint)}</text>`;
  overlay+='</svg>';
  const fitted=await sharp(master).composite([{input:Buffer.from(overlay)}]).png().toBuffer();
  const bindingAvailable=fs.existsSync(path.join(fit,'binding.json'));
  const title=record&&bindingAvailable?'FIT — retained record landmarks':'AUTHORED LANDMARKS — fit incomplete';
  const caption=record&&bindingAvailable?'Landmark overlay; static/rest qualification remains in its report':fitReason;
  tiles.push(await imageTile(fitted,title,caption));
}else tiles.push(await placeholder('FIT UNAVAILABLE',fitReason));

const selected=report?.stills?.find(s=>s.name==='approach-50'&&s.turn===0)??report?.stills?.find(s=>s.name==='approach-50');
const still=selected?.file?path.resolve(native,selected.file):null;
const nativeReason=report?firstLine(report.error??report.status??'Native report has no status'):'No native report at the explicit path; film and CPU are unmeasured';
if(still&&fs.existsSync(still)){
  const filmAvailable=fs.existsSync(path.join(native,'battle-10s.webm'));
  tiles.push(await imageTile(still,'NATIVE BATTLE2 STILL',`${nativeReason}; ${filmAvailable?'retained film available':'film file unavailable'}; turn ${selected.turn}, ${selected.ms} ms`));
}else tiles.push(await placeholder('NATIVE STILL UNAVAILABLE',nativeReason+(still?'; referenced still file is missing':'')));

const heading=Buffer.from(`<svg width="1600" height="980"><rect width="100%" height="100%" fill="#0d151a"/><text x="25" y="40" font-family="Arial" font-size="26" fill="#eddfbb">${escape(subject.name)} · ${escape(subject.family)} · retained art and proof evidence</text></svg>`);
const composite=tiles.map((input,i)=>({input,left:20+(i%2)*790,top:70+Math.floor(i/2)*450}));
await sharp(heading).composite(composite).png().toFile(output);
console.log(JSON.stringify({output,packet,fit,native,masterCanvas:'preserved without trim',nativeStatus:report?.status??null}));
