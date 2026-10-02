import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {observations} from './manual-observations.mjs';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),sha=b=>createHash('sha256').update(b).digest('hex'),refs=[];
for(const row of rows){
 const o=observations[row.id],landmarksPx={...o.core},parts=[];
 if(!o)throw Error('Exact manual source observation required');
 for(const [chain,l] of Object.entries(o.limbs)){
  ['Root','Knee','Ankle','Paw'].forEach((suffix,i)=>landmarksPx[chain+suffix]=l.j[i]);
  ['Paw','Ankle','Knee','Root'].forEach((suffix,i)=>parts.push({id:chain+suffix,joint:chain+suffix,layer:chain.endsWith('Far')?'far':'near',polygonPx:l.p[i]}));
 }
 for(const side of ['Near','Far']){
  const lower=side.toLowerCase();landmarksPx['ear'+side+'Root']=o.ears[lower][0];landmarksPx['ear'+side+'Tip']=o.ears[lower][1];
  for(const segment of ['Tip','Root'])parts.push({id:'ear'+side+segment,joint:'ear'+side+segment,layer:lower,polygonPx:o.ears.polys[lower+segment]});
 }
 for(const joint of ['jaw','head','neck'])parts.push({id:joint,joint,polygonPx:o.body[joint]});
 for(let i=0;i<4;i++)landmarksPx['tail'+i]=o.tail.j[i];
 for(let i=3;i>=0;i--)parts.push({id:'tail'+i,joint:'tail'+i,polygonPx:o.tail.p[3-i]});
 for(const joint of ['chest','pelvis','root'])parts.push({id:joint,joint,polygonPx:o.body[joint]});
 parts.push({id:'spine',joint:'spine',polygonPx:[[0,0],[1253,0],[1253,1253],[0,1253]]});
 for(const part of parts){part.id=part.id.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());part.layer??='near';}
 const authoring={id:'c132-reference-'+row.name.toLowerCase(),family:'quadruped',landmarksPx,groundLineY:o.ground/1254,materials:{surface:o.material},remainderPart:'spine',parts,coverage:{declarations:'Manually observed source-specific 1254-square landmark coordinates and priority polygons; no existing authoring packet or automatic transfer used.',sourceFacing:'right',limitations:o.notes,visualAcceptance:'UNMEASURED: no intake, static, native, automatic-reference-pool or Dakk admission.'}};
 const source=fs.readFileSync(row.master),masterSha256=sha(source);
 fs.writeFileSync(row.packet+'/authoring.json',JSON.stringify(authoring,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(row.packet+'/presence.json',JSON.stringify({schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(row.packet+'/manual-provenance.json',JSON.stringify({schema:'cf.c132-manual-reference/v1',masterSha256,authoringSha256:sha(fs.readFileSync(row.packet+'/authoring.json')),observationSource:'audits/C132_REFERENCES_20261001/manual-observations.mjs',observationSha256:sha(fs.readFileSync(base+'/manual-observations.mjs')),origin:'Independent manual observations on this exact edited painting; no reference-coordinate transfer.',limitations:o.notes,admission:'UNMEASURED; unchanged intake/static/native and positive/mutation reference controls required before pool addition.'},null,2)+'\n',{flag:'wx'});
 refs.push({id:'c132-'+row.id,family:row.family,packet:row.packet});
}
fs.writeFileSync(base+'/reference-packets.json',JSON.stringify(refs,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({manualCandidatePackets:refs.length,admission:'UNMEASURED'}));
