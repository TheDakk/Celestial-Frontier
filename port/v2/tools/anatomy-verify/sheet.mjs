/** Review sheet — what the compiler names on each subject, for a person to look at (PROGRAM §5: "a person looks
 * only at the sheet"). Per subject, one PNG at the working scale ×2: mask grey, ridge graph (body red / limb green),
 * every pool candidate (cyan endpoint, magenta loop, white resting tip, orange interior), assigned feet as filled
 * squares with their slot letters, inferred hidden joints hollow, claw ridges and wrists, the spine axis, and — for
 * comparison only — the record's landmarks as blue rings. Usage: node sheet.mjs <outDir> [subject…]. Not a gate. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')+'/';
const {readPng,writePng}=await import(root+'port/v2/tools/painted-creature/finish-conservation.mjs');
const {SUBJECTS,truthOf,scoreSubject,declarationOf}=await import('./score.mjs');const {assignLegs}=await import('./assign.mjs');const {labelParts}=await import('./labels.mjs');
const GLYPH={0:[' ### ','#   #','#   #','#   #',' ### '],1:['  #  ',' ##  ','  #  ','  #  ',' ### '],2:[' ### ','#   #','   # ','  #  ','#####'],3:['#### ','    #',' ### ','    #','#### '],F:['#####','#    ','#### ','#    ','#    '],N:['#   #','##  #','# # #','#  ##','#   #'],T:['#####','  #  ','  #  ','  #  ','  #  '],H:['#   #','#   #','#####','#   #','#   #']};
export function renderSheet(id,template,master,rec,outFile,presence){
  const png=readPng(fs.readFileSync(master));const truth=rec?truthOf(JSON.parse(fs.readFileSync(rec,'utf8'))):null;const decl=declarationOf(rec,presence);const declaredHidden=decl.hidden;
  const opts=process.env.ASSIGN_OPTS?JSON.parse(process.env.ASSIGN_OPTS):{};const res=assignLegs(png.data,png.width,png.height,null,{template,declaredHidden,declaredFolded:decl.folded,...opts});
  const {W,H,scale,box,mask}=res.working;const toW=p=>[(p[0]-box.x)*scale+2,(p[1]-box.y)*scale+2];const Z=2;const img=new Uint8Array(W*Z*H*Z*4);
  const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;for(let dy=0;dy<Z;dy++)for(let dx=0;dx<Z;dx++)img.set([...c,255],((y*Z+dy)*W*Z+x*Z+dx)*4);};
  const lab=labelParts(res,template);for(let i=0;i<W*H;i++){const l=lab.labels[i];const h=l*47%360;const c=mask[i]?(l?[70+40*Math.cos(h/57.3),70+40*Math.cos((h+120)/57.3),70+40*Math.cos((h+240)/57.3)]:[60,60,60]):[12,12,12];put(i%W,Math.floor(i/W),c.map(Math.round));}
  for(const p of res.bodyRidge)put(p[0],p[1],[220,70,70]);
  for(const c of res.clawPaths){for(const p of c.fullPath??[])put(p[0],p[1],[255,180,60]);if(c.wrist){const w=toW(c.wrist);for(let d=-3;d<=3;d++){put(w[0]+d,w[1],[255,255,255]);put(w[0],w[1]+d,[255,255,255]);}}}
  for(const [name,a] of Object.entries(res.assigned)){if(!a.path)continue;for(const p of a.path)put(p[0],p[1],[80,200,90]);}
  const ring=(p,r,c)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.abs(Math.hypot(dx,dy)-r)<0.7)put(p[0]+dx,p[1]+dy,c);};const box5=(p,r,c)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)put(p[0]+dx,p[1]+dy,c);};
  const text=(p,str,c)=>{let ox=0;for(const ch of str){const g=GLYPH[ch];if(!g){ox+=6;continue;}for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(g[y][x]==='#')put(p[0]+ox+x,p[1]+y,c);ox+=6;}};
  for(const c of res.pool){const p=toW(c.tip);const col=c.kind==='end'?[0,220,220]:c.kind==='loop'?[230,90,230]:c.kind==='touch'?[240,240,240]:[255,150,40];ring(p,4,col);}
  if(truth)for(const [k,v] of Object.entries(truth.px)){if(!/Foot$|Paw$|Knee$|Ankle$/.test(k))continue;ring(toW(v),/Foot$|Paw$/.test(k)?6:3,[90,150,255]);}
  for(const [name,a] of Object.entries(res.assigned)){const p=toW(a.master);const short=name.replace(/^leg/,'').replace(/Foot$|Paw$/,'').replace(/Far$/,'F').replace(/Near$/,'N').replace(/^hind/,'H').replace(/^fore/,'F').replace(/^tail\d?$/,'T');box5(p,3,[255,255,60]);text([p[0]+6,p[1]-2],short.slice(0,3),[255,255,120]);}
  for(const [j,p] of Object.entries(res.joints)){if(!/Knee$|Ankle$/.test(j))continue;box5(toW(p),2,[255,200,0]);}
  for(const [j,p] of Object.entries(res.inferred)){if(!/Foot$|Paw$/.test(j))continue;ring(toW(p),5,[255,255,60]);}
  const c0=toW(res.centre);for(let t=-40;t<=40;t++)put(c0[0]+res.axis[0]*t,c0[1]+res.axis[1]*t,[255,255,255]);
  fs.mkdirSync(path.dirname(outFile),{recursive:true});fs.writeFileSync(outFile,writePng(W*Z,H*Z,img));
  const s=truth?scoreSubject(res,truth,template,25):null;return {id,file:outFile,score:s?{pos:s.pos+'/'+s.visible,named:s.named+'/'+s.assigned,hiddenOk:s.hiddenOk}:null,hidden:res.hidden};}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){const out=process.argv[2]??(root+'audits/INTAKE_COMPILER_20260921/sheet-01');const want=process.argv.slice(3);const rows=[];
  for(const [id,template,master,rec,presence] of SUBJECTS){if(want.length&&!want.includes(id))continue;const r=renderSheet(id,template,master,rec,path.join(out,id+'.png'),presence);rows.push(r);console.log(id.padEnd(16),JSON.stringify(r.score),'hidden',JSON.stringify(r.hidden));}
  fs.writeFileSync(path.join(out,'sheet-summary.json'),JSON.stringify({generated:new Date().toISOString().slice(0,10),legend:'cyan ring endpoint candidate · magenta loop · white resting tip · orange interior · yellow square + label = assigned slot (F/N side, digit station; H/F hind/fore; T tail) · yellow ring = inferred hidden · amber squares = knees/ankles · blue rings = record landmarks (comparison only) · red = body ridge · green = leg ridges · orange = claw ridges · white cross = wrist · white line = spine axis',rows},null,1));}
