import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {admitKitEngineJob} from './kit-engine-math.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const m=/^--([a-z-]+)=(.+)$/.exec(a);if(!m)throw Error('Expected named argument');return [m[1],m[2]];}));
for(const k of Object.keys(args))if(!['output','width','height','pass-size','steps','seed','strength','finisher-strength'].includes(k))throw Error('Unknown option '+k);
if(!args.output)throw Error('--output=NEW_DIRECTORY required');
const output=path.resolve(args.output);await fs.mkdir(output);await fs.mkdir(path.join(output,'inputs'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const settings={width:Number(args.width??1024),height:Number(args.height??576),passSize:Number(args['pass-size']??384),steps:Number(args.steps??4),seed:Number(args.seed??133),strength:Number(args.strength??.20),finisherStrength:Number(args['finisher-strength']??.08)};
for(const k of ['width','height','passSize'])if(!Number.isSafeInteger(settings[k])||settings[k]<128||settings[k]>2048||settings[k]%16)throw Error('Invalid preparation geometry');
// Canonical authoring build owns its own short checkout lease; no game/pack build.
const compilerDir=path.join(output,'compiler');
execFileSync(process.execPath,[path.join(root,'port/v2/tools/landfall-snapshot/kit-export.mjs'),compilerDir],{cwd:root,stdio:'pipe'});
const release=acquireWorkspaceLock('offline pre-fit of approved-v4 engine inputs');
const files=[];
try{
  const old=path.join(root,'audits/ART_KIT_ENGINE_FIRST_20260912');
  const intake=JSON.parse(await fs.readFile(path.join(old,'capture-intake.json'),'utf8'));
  async function fit(key,source,width,height,cutout,expected){
    const original=await fs.readFile(source);if(sha(original)!==expected)throw Error('Source image changed: '+key);
    const png=path.join(output,'inputs',key+'.png'),raw=path.join(output,'inputs',key+'.rgba');
    const opts=cutout?['-fuzz','7%','-transparent','#ff00ff','-trim','+repage','-resize',`${Math.floor(width*.80)}x${Math.floor(height*.80)}`,'-background','#ff00ff','-gravity','center','-extent',`${width}x${height}`,'-alpha','remove','-alpha','off']:['-resize',`${width}x${height}!`];
    execFileSync('magick',[source,...opts,'-colorspace','sRGB','-depth','8',png]);
    execFileSync('magick',[png,'-depth','8','rgba:'+raw]);
    const bytes=await fs.readFile(raw),pngBytes=await fs.readFile(png);if(bytes.length!==width*height*4)throw Error('Raw fitted byte size');
    const row={url:'/inputs/'+key+'.rgba',sha256:sha(bytes),width,height};
    files.push({key,...row,bytes:bytes.length,png:path.relative(output,png),pngSha256:sha(pngBytes),source:path.relative(root,source),sourceSha256:sha(original),operation:cutout?'7% magenta key; trim; fit into 80% envelope; flat magenta pad; RGBA8':'offline resample to fixed encoder geometry; RGBA8'});return row;
  }
  const residents={};for(const key of ['civet','persimmon','platypus','frog','devils-club','cranberry']){
    const source=path.join(old,'masters',key+'.png');residents[key]=await fit(key,source,settings.passSize,settings.passSize,true,intake.images.find(r=>r.key===key).masterSha256);
  }
  const plate=await fit('earth-temperate',path.join(old,'masters/earth-temperate.png'),settings.width,settings.height,false,intake.images.find(r=>r.key==='earth-temperate').masterSha256);
  const atlas=await fit('atlas',path.join(root,'audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png'),512,336,false,'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62');
  const triptych=await fit('triptych',path.join(root,'audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png'),512,224,false,'68f03f0233ec2ca89ddf39238cfaf1a30b83027a58beaea9fbb1735273720a38');
  const {compileCanonicalEarthKitEngine}=await import(pathToFileURL(path.join(compilerDir,'kit-compiler.mjs')).href);
  const recipe=compileCanonicalEarthKitEngine(await fs.readFile(path.join(root,'ART_KIT.md'),'utf8'),{plate,atlas,triptych,residents},settings);admitKitEngineJob(recipe);
  const bytes=JSON.stringify(recipe,null,2)+'\n';await fs.writeFile(path.join(output,'recipe.json'),bytes,{flag:'wx'});
  await fs.writeFile(path.join(output,'prepared-manifest.json'),JSON.stringify({schema:'cf.kit-engine-prepared.v4',recipeSha256:sha(bytes),settings,files,magickVersion:execFileSync('magick',['-version'],{encoding:'utf8'}).split('\n')[0],qualityAccepted:false},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:'PASS',output,files:files.length,recipeSha256:sha(bytes),settings}));
}finally{release();}
