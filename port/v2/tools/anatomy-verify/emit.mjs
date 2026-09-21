/** IC-2 output — what Codex's writers read, written by the compiler: `labels.png` (red channel = part index + 1) and
 * `declaration.json` (`cf.painter-part-intake/v1`: parts [{id, joint, layer}] in the same order/vocabulary as the
 * accepted crab fits). Parts come from the compiler's geodesic labels (labels.mjs): body; per named leg `-upper`
 * (joint = Knee) and `-lower` (joint = terminal) split at the knee fraction; per claw `-arm` / `-palm` / `-finger`
 * split at the wrist and at the fork's separation along the claw's own ridge; eyes are NOT emitted (the compiler
 * does not name eyes yet — declared here as a gap, never filled by hand). Also writes `compare.json`: IoU per part
 * against Codex's labels.png when one exists (comparison only). Usage: node emit.mjs <outDir> [subject…]. Not a gate. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')+'/';
const {readPng,writePng}=await import('./png.mjs');
const {SUBJECTS,declarationOf}=await import('./score.mjs');const {assignLegs}=await import('./assign.mjs');const {labelParts}=await import('./labels.mjs');const {templateRest}=await import('./template-rest.mjs');
const sha=b=>createHash('sha256').update(b).digest('hex');
export function emitSubject(id,template,master,rec,presence,outDir){
  const png=readPng(fs.readFileSync(master));const decl=declarationOf(rec,presence);const T=templateRest(template);
  const res=assignLegs(png.data,png.width,png.height,null,{template,declaredHidden:decl.hidden,declaredFolded:decl.folded});
  const lab=labelParts(res,template);const {W,H,scale,box}=res.working;
  // part list in Codex's order: body, legs (Far then Near, rear→front, upper then lower), claws (far, near: arm/palm/finger)
  const parts=[{id:'body',joint:T.contract.bodyAxis[0],layer:'near'}];const partOf=new Map();
  for(const side of ['Far','Near'])for(const sl of T.slots[side]){if(!res.assigned[sl.terminal])continue;const lower=sl.id.toLowerCase();const interior=sl.chain.slice(1,-1);const knee=interior[0]??sl.chain[1];
    parts.push({id:lower+'-upper',joint:knee,layer:side.toLowerCase()});partOf.set(sl.id+'-upper',parts.length);parts.push({id:lower+'-lower',joint:sl.terminal,layer:side.toLowerCase()});partOf.set(sl.id+'-lower',parts.length);}
  const clawSides=[...new Set(res.clawPaths.map(c=>c.side).filter(Boolean))];for(const side of ['Far','Near']){if(!clawSides.includes(side))continue;const s=side.toLowerCase();for(const seg of ['arm','palm','finger'])parts.push({id:`claw-${s}-${seg}`,joint:seg==='arm'?`claw${side}Elbow`:seg==='palm'?`claw${side}Palm`:`claw${side}DactylRoot`,layer:'near'});}
  // master-resolution label map: nearest working pixel; claw regions split by the source path index (arm: before the wrist, palm: wrist → fork separation, finger: after)
  const out=new Uint8Array(png.width*png.height*4);const idx=new Map(parts.map((p,i)=>[p.id,i+1]));
  const clawSplit=new Map();for(const c of res.clawPaths){if(!c.side||!c.fullPath)continue;const wristI=c.wrist?c.fullPath.findIndex(([x,y])=>Math.hypot(x-((c.wrist[0]-box.x)*scale+2),y-((c.wrist[1]-box.y)*scale+2))<2):-1;const sepI=c.path?c.fullPath.length-c.path.length:c.fullPath.length;clawSplit.set(c.side,{wristI:wristI<0?0:wristI,sepI});}
  for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const o=(y*png.width+x)*4;if(png.data[o+3]<128)continue;const wx=Math.min(W-1,Math.max(0,Math.round((x-box.x)*scale+2))),wy=Math.min(H-1,Math.max(0,Math.round((y-box.y)*scale+2)));const l=lab.labels[wy*W+wx];const name=lab.partIds[l];let pid=idx.get('body')??1;
    if(name&&name!=='body'){if(name.startsWith('claw')){const side=name.slice(4);const sp=clawSplit.get(side);const si=lab.srcIdx?lab.srcIdx[wy*W+wx]:0;const seg=!sp?'arm':si<sp.wristI?'arm':si<sp.sepI?'palm':'finger';pid=idx.get(`claw-${side.toLowerCase()}-${seg}`)??pid;}
      else{const m=name.match(/^(leg\d(?:Far|Near)|(?:hind|fore)(?:Far|Near))-(upper|lower)$/);if(m)pid=partOf.get(m[1]+'-'+m[2])??pid;}}
    out[o]=pid;out[o+1]=pid;out[o+2]=pid;out[o+3]=255;}
  fs.mkdirSync(outDir,{recursive:true});const labelsPng=writePng(png.width,png.height,out);fs.writeFileSync(path.join(outDir,'labels.png'),labelsPng);
  const declaration={schema:'cf.painter-part-intake/v1',source:'intake-compiler (anatomy-verify emit.mjs)',recordRecipeHash:null,cutoutSha256:sha(fs.readFileSync(master)),labelsFile:'labels.png',labelsSha256:sha(labelsPng),parts,gaps:['eyes not named by the compiler (eye-far/eye-near absent)',...(res.hidden.length?['hidden: '+res.hidden.join(',')]:[]),...(decl.folded.length?['folded: '+decl.folded.join(',')]:[])]};
  declaration.declarationHash=sha(JSON.stringify({parts,labelsSha256:declaration.labelsSha256}));fs.writeFileSync(path.join(outDir,'declaration.json'),JSON.stringify(declaration,null,1));
  // compare with Codex's map when present
  let compare=null;if(rec){const dir=path.dirname(rec);const lf=dir+'/labels.png',df=dir+'/declaration.json';if(fs.existsSync(lf)&&fs.existsSync(df)){const lp=readPng(fs.readFileSync(lf));const cd=JSON.parse(fs.readFileSync(df,'utf8'));const inter=new Map(),ua=new Map(),ub=new Map();
    for(let i=0;i<png.width*png.height;i++){const a=out[i*4]?parts[out[i*4]-1].id:null;const b=lp.data[i*4]?cd.parts[lp.data[i*4]-1]?.id:null;if(a)ua.set(a,(ua.get(a)||0)+1);if(b)ub.set(b,(ub.get(b)||0)+1);if(a&&a===b)inter.set(a,(inter.get(a)||0)+1);}
    compare={};for(const n of new Set([...ua.keys(),...ub.keys()])){const I=inter.get(n)||0,U=(ua.get(n)||0)+(ub.get(n)||0)-I;compare[n]={iou:U?+(I/U).toFixed(3):0,compiler:ua.get(n)||0,codex:ub.get(n)||0};}
    fs.writeFileSync(path.join(outDir,'compare.json'),JSON.stringify({codexDeclaration:df,perPart:compare},null,1));}}
  return {id,parts:parts.length,compare};}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){const out=process.argv[2]??(root+'audits/INTAKE_COMPILER_20260921/compiled-01');const want=process.argv.slice(3);
  for(const [id,template,master,rec,presence] of SUBJECTS){if(want.length&&!want.includes(id))continue;if(template!=='brachyuran')continue; // quadruped part scheme: Codex's civet parts list not in this lane yet
    const r=emitSubject(id,template,master,rec,presence,path.join(out,id));const c=r.compare||{};const legs=Object.entries(c).filter(([k])=>/^leg/.test(k)).map(([,v])=>v.iou);const mean=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'-';
    console.log(id.padEnd(16),'parts',r.parts,'| body',c.body?.iou??'-','legs mean',mean(legs),'claws',Object.entries(c).filter(([k])=>/^claw/.test(k)).map(([k,v])=>k.replace('claw-','')+':'+v.iou).join(' '));}}
