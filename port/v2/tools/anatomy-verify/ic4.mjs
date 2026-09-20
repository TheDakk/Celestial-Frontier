/** IC-4 — the intake compiler's admission check with both-way controls (PROGRAM §6). For every subject: compile the
 * master under its template with the species' DECLARED hidden set (declaration is an input; presence is never
 * inferred), then verdict: ADMIT iff every declared-visible leg slot is filled, every declared-hidden slot is empty,
 * and no strong (endpoint) leg candidate is left unused. Mutants per subject, built from Codex's label map (comparison
 * material, never a compiler input): ERASED (one visible leg's pixels removed), DUPLICATED (one leg's pixels copied
 * beside it), WRONG-TEMPLATE (compiled under the other family's template). Every mutant must REFUSE. Usage:
 * node ic4.mjs [json]. Landmark accuracy is score.mjs's business; this file is the verdict and its controls. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')+'/';
const {readPng}=await import(root+'port/v2/tools/painted-creature/finish-conservation.mjs');
const {assignLegs}=await import('./assign.mjs');const {templateRest}=await import('./template-rest.mjs');const {SUBJECTS,truthOf,scoreSubject}=await import('./score.mjs');
export function verdict(res,template,declaredHidden){const T=templateRest(template);const reasons=[];
  for(const side of ['Far','Near'])for(const sl of T.slots[side]){const filled=!!res.assigned[sl.terminal],hid=declaredHidden.includes(sl.id);if(hid&&filled)reasons.push(`declared hidden ${sl.id} was found`);if(!hid&&!filled)reasons.push(`visible ${sl.id} not found`);}
  const unusedStrong=res.pool.filter(c=>c.kind==='end'&&!c.fork&&!c.used&&!c.claw).length;if(unusedStrong>res.unusedAllowance)reasons.push(`${unusedStrong} unused endpoint leg candidates`);
  return {verdict:reasons.length?'REFUSE':'ADMIT',reasons,unusedStrong};}
const legPartIds=(decl,legId)=>{const key=legId.toLowerCase();return decl.parts.map((p,i)=>({p,i})).filter(({p})=>p.id.startsWith(key+'-')).map(({i})=>i+1);};
export function mutate(png,labels,ids,mode,shift){const out=new Uint8Array(png.data);const W=png.width,H=png.height;
  for(let i=0;i<W*H;i++){if(!ids.includes(labels[i]))continue;if(mode==='erase'){out[i*4+3]=0;out[i*4]=255;out[i*4+1]=0;out[i*4+2]=255;}
    else{const x=i%W+shift[0],y=Math.floor(i/W)+shift[1];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;for(let k=0;k<4;k++)out[j*4+k]=png.data[i*4+k];}}
  return {width:W,height:H,data:out};}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const rows=[];const run=(id,template,png,declHidden,tag)=>{const opts=process.env.ASSIGN_OPTS?JSON.parse(process.env.ASSIGN_OPTS):{};const res=assignLegs(png.data,png.width,png.height,null,{template,...opts});res.unusedAllowance=Number(process.env.IC4_UNUSED??0);const v=verdict(res,template,declHidden);rows.push({id,tag,template,...v,hidden:res.hidden});console.log(id.padEnd(16),tag.padEnd(10),template.padEnd(11),v.verdict.padEnd(7),'unusedStrong',v.unusedStrong,'hidden',JSON.stringify(res.hidden),v.reasons.join('; '));return res;};
  for(const [id,template,master,rec] of SUBJECTS){const png=readPng(fs.readFileSync(master));const record=JSON.parse(fs.readFileSync(rec,'utf8'));const declHidden=record.anatomy?.hidden??[];
    run(id,template,png,declHidden,'positive');
    const other=template==='brachyuran'?'quadruped':'brachyuran';run(id,other,png,[],'wrong-tmpl');
    const dir=path.dirname(rec);const declFile=dir+'/declaration.json',labelFile=dir+'/labels.png';if(!fs.existsSync(declFile)||!fs.existsSync(labelFile))continue;
    const decl=JSON.parse(fs.readFileSync(declFile,'utf8'));const lp=readPng(fs.readFileSync(labelFile));const labels=new Uint16Array(lp.width*lp.height);for(let i=0;i<labels.length;i++)labels[i]=lp.data[i*4];
    const T=templateRest(template);const visibleLegs=[...T.slots.Far,...T.slots.Near].map(s=>s.id).filter(l=>!declHidden.includes(l));
    for(const leg of [visibleLegs[0],visibleLegs[visibleLegs.length-1]]){const ids=legPartIds(decl,leg);if(!ids.length){console.log('  no label parts for',leg);continue;}
      run(id,template,mutate(png,labels,ids,'erase'),declHidden,'erase:'+leg);
      run(id,template,mutate(png,labels,ids,'dup',[Math.round(png.width*Number(process.env.IC4_DUP_SHIFT??0.15)),Math.round(png.height*0.03)]),declHidden,'dup:'+leg);}}
  if(process.argv[2]==='json')fs.writeFileSync(process.env.IC4_OUT??'/dev/stdout',JSON.stringify(rows,null,1));
}
