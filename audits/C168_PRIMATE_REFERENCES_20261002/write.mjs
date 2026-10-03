import fs from'node:fs';import{createHash}from'node:crypto';import{observations}from'./observations.mjs';
const base='audits/C168_PRIMATE_REFERENCES_20261002',sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
for(const[id,o]of Object.entries(observations)){
 const packet=base+'/'+id;fs.mkdirSync(packet,{recursive:false});
 for(const f of['master.png','subject-source.json','prompt.txt','visible-anatomy.json','visual-review.json'])fs.copyFileSync(o.source+'/'+f,packet+'/'+f,fs.constants.COPYFILE_EXCL);
 const parts=o.regions.map(([joint,polygonPx],i)=>({id:joint.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),joint,layer:joint.includes('Far')?'far':'near',polygonPx}));
 parts.push({id:'body',joint:'root',layer:'near',polygonPx:[[0,0],[1,0],[0,1]]});
 const author={id:'c168-reference-'+id,family:'primate',landmarksPx:o.points,groundLineY:o.ground/1254,materials:{surface:'fur'},remainderPart:'body',parts,coverage:{scope:'Exact original source anatomy manually observed; audit reference candidate only',sourceLabelsReused:false,sourceLandmarksReused:false,nativeAcceptance:false,qualityAccepted:false,declarations:o.notes.join(' '),limitations:o.notes}};
 fs.writeFileSync(packet+'/authoring.json',JSON.stringify(author,null,2)+'\n',{flag:'wx'});fs.writeFileSync(packet+'/presence.json',JSON.stringify({schema:'cf.anatomy-presence/v2',absent:o.absent,hidden:[],folded:[]},null,2)+'\n',{flag:'wx'});
 const row={id,name:o.name,packet,source:o.source,masterSha256:sha(fs.readFileSync(packet+'/master.png')),authoringSha256:sha(fs.readFileSync(packet+'/authoring.json')),observationSha256:sha(fs.readFileSync(base+'/observations.mjs')),method:'Independent manual source-pixel landmarks and explicit polygons. No donor authoring coordinates, labels, source pixels or reference-self transfer.',sourcePixelsChanged:0,qualityAccepted:false,nativeRun:false,limitations:o.notes};
 fs.writeFileSync(packet+'/manual-provenance.json',JSON.stringify(row,null,2)+'\n',{flag:'wx'});rows.push(row);
}
fs.writeFileSync(base+'/packets.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({manualCandidates:rows.length}));
