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
 for(const joint of ['jaw','head','neck'])parts.push({id:joint,joint,polygonPx:o.body[joint]});
 for(let i=0;i<4;i++)landmarksPx['tail'+i]=o.tail.j[i];
 for(let i=3;i>=0;i--)parts.push({id:'tail'+i,joint:'tail'+i,polygonPx:o.tail.p[3-i]});
 for(const joint of ['chest','pelvis','root'])parts.push({id:joint,joint,polygonPx:o.body[joint]});
 parts.push({id:'spine',joint:'spine',polygonPx:[[0,0],[1253,0],[1253,1253],[0,1253]]});
 for(const part of parts){part.id=part.id.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());part.layer??='near';}
 const authoring={id:'c136-reference-'+row.id,family:'quadruped',landmarksPx,groundLineY:o.ground/1254,materials:{surface:o.material},remainderPart:'spine',parts,coverage:{declarations:'Independent manually observed source-specific landmarks and priority polygons. No reference-coordinate or automatic author transfer.',sourceFacing:'right',limitations:o.notes,visualAcceptance:'CANDIDATE_UNMEASURED: unchanged intake/static/native and reference-pool controls required.'}};
 fs.writeFileSync(row.packet+'/authoring.json',JSON.stringify(authoring,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(row.packet+'/presence.json',JSON.stringify({schema:'cf.anatomy-presence/v2',absent:['external-ears'],hidden:[],folded:[]},null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(row.packet+'/manual-provenance.json',JSON.stringify({schema:'cf.c132-manual-reference/v1',masterSha256:row.masterSha256,authoringSha256:sha(fs.readFileSync(row.packet+'/authoring.json')),observationSource:'audits/C136_SPRAWLER_REFERENCES_20261002/manual-observations.mjs',observationSha256:sha(fs.readFileSync(base+'/manual-observations.mjs')),sourcePacket:row.sourcePacket,origin:'Independent manual observations on the existing original; no coordinates read from any other authoring or fit.',limitations:o.notes,admission:'UNMEASURED. Existing original acceptance or refusal does not transfer to this new partition.'},null,2)+'\n',{flag:'wx'});
 refs.push({id:'c136-sprawler-'+row.id,family:row.family,packet:row.packet});
}
fs.writeFileSync(base+'/reference-packets.json',JSON.stringify(refs,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({manualCandidatePackets:refs.length,partsPerPacket:27,admission:'UNMEASURED'}));
