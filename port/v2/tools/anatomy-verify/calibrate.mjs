/** Track T1 calibration runner: runs the tip detector over the known masters (five painter crabs, the keyed Civet,
 * Codex's painted P1 coconut crab read by absolute path) and prints counts vs expectation. Retained results are in
 * README.md. Usage: node calibrate.mjs [fillMax] [unused] [debug] [overlayDir]. Not a gate. */
import fs from 'node:fs';
import path from 'node:path';import {fileURLToPath} from 'node:url';const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')+'/';
const {readPng,writePng}=await import('./png.mjs');
const {alphaOf,detectTips,classifyTips}=await import(root+'port/v2/tools/anatomy-verify/tips.mjs');
const S=(process.argv[5]??'/tmp')+'/';
const subjects=[['crab','brachyuran',root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/crab-master.png',null],['coconut-crab','brachyuran',root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/coconut-crab-master.png',null],['freshwater-crab','brachyuran',root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/freshwater-crab-master.png',null],['mud-crab','brachyuran',root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/mud-crab-master.png',null],['vent-crab','brachyuran',root+'audits/ANATOMY_COMPLETION_20260917/crab-masks-05/vent-crab-master.png',null],['civet','quadruped',root+'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',null],['P1-coconut','brachyuran','/Users/nick/Projects/celestial-frontier-openai-mac/audits/VISION_P1_COCONUT_20260920/generation-01/coconut-crab-master.png',6]];
const wr=Number(process.argv[2]??14),fm=Number(process.argv[3]??.22);
for(const [id,t,file,visible] of subjects){const png=readPng(fs.readFileSync(file));const {alpha,keyed}=alphaOf(png.data,png.width,png.height);
  const det=detectTips(alpha,png.width,png.height,{fillMax:fm,solidAlpha:keyed?128:250}),cls=classifyTips(det,t,{visibleFeet:visible});
  console.log(id.padEnd(14),'keyed',keyed,'tips',det.tips.length,JSON.stringify(cls.counts),cls.verdict,cls.reasons.join(';'),'| feet R/len',cls.classes.feet.map(t=>t.R+'/'+t.length).join(' '),'| other',cls.classes.other.map(t=>t.R+'/'+t.length+'@'+t.dir.x+','+t.dir.y).join(' '));
  if(process.argv[4]==='debug'){const {width:W,height:H}=det.working;const img=new Uint8Array(W*H*4);const d=(await import(root+'port/v2/tools/anatomy-verify/skeleton.mjs')).downscaleMask(alpha,png.width,png.height,{solidAlpha:keyed?128:250,longest:512});for(let i=0;i<W*H;i++)img.set(d.mask[i]?[90,90,90,255]:[20,20,20,255],i*4);
    const col={feet:[255,60,60],claws:[255,200,40],eyes:[80,160,255],other:[200,80,255]};for(const [k,arr] of Object.entries(cls.classes))for(const tp of arr)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=tp.x+dx,y=tp.y+dy;if(x>=0&&y>=0&&x<W&&y<H)img.set([...col[k],255],(y*W+x)*4);}
    fs.writeFileSync(S+'tips-'+id+'.png',writePng(W,H,img));}}
