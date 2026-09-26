import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {readPng} from '../../port/v2/tools/anatomy-verify/png.mjs';
import {assignLegs} from '../../port/v2/tools/anatomy-verify/assign.mjs';
import {verdict} from '../../port/v2/tools/anatomy-verify/ic4.mjs';
import {writeDerivedMasks} from '../../port/v2/tools/painted-creature/derive-marking-masks.mjs';
const base=import.meta.dirname,root=path.resolve(base,'../..'),sha=x=>createHash('sha256').update(x).digest('hex'),rows=[];
for(const row of JSON.parse(fs.readFileSync(base+'/pilot.json'))){
 const dir=path.join(base,row.id),file=dir+'/master.png';if(!fs.existsSync(file))continue;
 const bytes=fs.readFileSync(file),p=readPng(bytes),source=JSON.parse(fs.readFileSync(dir+'/subject-source.json')),req=JSON.parse(fs.readFileSync(dir+'/request.json'));
 if(sha(fs.readFileSync(dir+'/prompt.txt'))!==req.promptSha256)throw Error('Prompt drift '+row.id);
 const res=assignLegs(p.data,p.width,p.height,null,{template:'quadruped',declaredHidden:[],declaredFolded:[],declaredAbsent:[]});res.unusedAllowance=0;
 const v=verdict(res,'quadruped',[]),assigned=Object.entries(res.assigned).map(([slot,a])=>({slot,kind:a.kind,master:a.master})),observedVisibleLegs=assigned.filter(a=>/^(fore|hind)(Near|Far)Paw$/.test(a.slot)&&a.kind!=='loop').length;
 let alphaZero=0,alphaPartial=0;for(let i=3;i<p.data.length;i+=4){alphaZero+=p.data[i]===0;alphaPartial+=p.data[i]>0&&p.data[i]<255;}
 const report={schema:'cf.g2-master-observation/v1',id:row.id,masterSha256:sha(bytes),bytes:bytes.length,width:p.width,height:p.height,formatValid:p.width===1254&&p.height===1254,requestedVisibleLegs:4,observedVisibleLegs,assigned,unusedStrong:v.unusedStrong,verifierVerdict:v.verdict,reasons:v.reasons,scope:'existing IC4 strict graph verifier; visible-leg estimates, not a trusted full anatomy/placement certificate; G1 mutation leaks remain open',alpha:{zero:alphaZero,partial:alphaPartial},authoringCreated:false,qualityAccepted:false,verifierSources:Object.fromEntries(['assign.mjs','ic4.mjs','template-rest.mjs','ridge.mjs','tips.mjs'].map(f=>[f,sha(fs.readFileSync(root+'/port/v2/tools/anatomy-verify/'+f))]))};
 fs.writeFileSync(dir+'/visible-anatomy.json',JSON.stringify(report,null,2)+'\n');
 if(!fs.existsSync(dir+'/derived-masks'))writeDerivedMasks(file,dir+'/derived-masks',source.genome.seed);
 const masks=JSON.parse(fs.readFileSync(dir+'/derived-masks/manifest.json'));rows.push({...report,maskBytes:masks.rows.reduce((n,r)=>n+r.bytes,0)});console.log(JSON.stringify({id:row.id,count:observedVisibleLegs,verdict:v.verdict,reasons:v.reasons,masks:masks.rows.length}));
}
fs.writeFileSync(base+'/master-measurements.json',JSON.stringify({status:rows.length===20?'COMPLETE':'PARTIAL',count:rows.length,rows},null,2)+'\n');
