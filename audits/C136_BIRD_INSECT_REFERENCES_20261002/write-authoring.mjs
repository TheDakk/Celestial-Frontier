import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {observations} from './manual-observations.mjs';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),sha=b=>createHash('sha256').update(b).digest('hex'),refs=[],holds=[];
for(const row of rows){
 const o=observations[row.id];if(!o)throw Error('Exact independent manual observation required');
 const ordered=[...o.parts.filter(([joint])=>joint==='root'),...o.parts.filter(([joint])=>joint!=='root')];
 const parts=ordered.map(([joint,polygonPx])=>({id:joint.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),joint,layer:joint.includes('Far')?'far':'near',polygonPx}));
 parts.push({id:o.remainder,joint:o.remainder,layer:'near',polygonPx:[[0,0],[1253,0],[1253,1253],[0,1253]]});
 const authoring={id:'c136-reference-'+row.id,family:row.family,landmarksPx:o.points,groundLineY:o.ground/1254,materials:{surface:o.material},remainderPart:o.remainder,parts,coverage:{declarations:'Independent source-specific full-size pixel observations. No prior authoring, rig or reference coordinates were read or transferred.',sourceFacing:'right',limitations:o.notes,unresolvedJoints:o.unresolved??[],visualAcceptance:o.unresolved?.length?'INCOMPLETE_HOLD: no complete intake or reference-pool admission.':'CANDIDATE_UNMEASURED: unchanged intake, static, native and reference-pool controls required.'}};
 fs.writeFileSync(row.packet+'/authoring.json',JSON.stringify(authoring,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(row.packet+'/presence.json',JSON.stringify({schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(row.packet+'/manual-provenance.json',JSON.stringify({schema:'cf.c132-manual-reference/v1',masterSha256:sha(fs.readFileSync(row.master)),authoringSha256:sha(fs.readFileSync(row.packet+'/authoring.json')),observationSource:'audits/C136_BIRD_INSECT_REFERENCES_20261002/manual-observations.mjs',observationSha256:sha(fs.readFileSync(base+'/manual-observations.mjs')),sourcePacket:row.sourcePacket,origin:'Independent manual full-size observation; no coordinates read from another authoring, fit or reference.',limitations:o.notes,admission:authoring.coverage.visualAcceptance},null,2)+'\n',{flag:'wx'});
 (o.unresolved?.length?holds:refs).push({id:'c136-bird-insect-'+row.id,family:row.family,packet:row.packet,...(o.unresolved?{unresolved:o.unresolved}:{} )});
}
fs.writeFileSync(base+'/reference-packets.json',JSON.stringify(refs,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/incomplete-holds.json',JSON.stringify(holds,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({completeCandidatePackets:refs.length,incompleteHolds:holds.length,admission:'UNMEASURED'}));
