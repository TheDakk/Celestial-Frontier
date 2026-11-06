import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{references}from'./reference-observations.mjs';
const base='audits/C163_REFERENCE_REPAIR_20261002',sha=b=>createHash('sha256').update(b).digest('hex');
function capsule(a,b,ra,rb){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);assert(len>0);const nx=-dy/len,ny=dx/len;return[[a[0]+nx*ra,a[1]+ny*ra],[b[0]+nx*rb,b[1]+ny*rb],[b[0]-nx*rb,b[1]-ny*rb],[a[0]-nx*ra,a[1]-ny*ra]];}
const box=(p,r)=>[[p[0]-r,p[1]-r],[p[0]+r,p[1]-r],[p[0]+r,p[1]+r],[p[0]-r,p[1]+r]];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const manifest=[];
for(const[id,o]of Object.entries(references)){
 const packet=base+'/manual-references/'+id;assert(!fs.existsSync(packet));fs.mkdirSync(packet,{recursive:true});
 for(const f of ['master.png','subject-source.json','prompt.txt'])fs.copyFileSync(o.source+'/'+f,packet+'/'+f,fs.constants.COPYFILE_EXCL);
 const parts=[],add=(joint,polygonPx,label=joint)=>parts.push({id:label.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),joint,layer:joint.includes('Far')?'far':'near',polygonPx});
 add('root',box(o.points.root,7));
 for(const chain of ['hindNear','foreNear','hindFar','foreFar']){
  const names=['Root','Knee','Ankle','Paw'].map(s=>chain+s),p=names.map(n=>o.points[n]),r=o.limbs[chain],a=mix(p[0],p[1],.28),b=mix(p[1],p[2],.55),c=mix(p[2],p[3],.4);
  add(names[3],capsule(c,p[3],r[2],r[3]));add(names[2],[...capsule(b,p[2],r[1]*.75,r[2]).slice(0,2),...capsule(p[2],c,r[2],r[2]).slice(1,4),...capsule(b,p[2],r[1]*.75,r[2]).slice(3)]);
  add(names[1],[...capsule(a,p[1],r[0]*.8,r[1]).slice(0,2),...capsule(p[1],b,r[1],r[1]*.75).slice(1,4),...capsule(a,p[1],r[0]*.8,r[1]).slice(3)]);add(names[0],capsule(p[0],a,r[0],r[0]*.8));
 }
 for(const j of ['earNearTip','earNearRoot','earFarTip','earFarRoot'])add(j,o.ears[j]);
 for(let i=3;i>=0;i--){const j='tail'+i,p=o.points[j],r=o.tailWidths[i];add(j,i===3?box(p,r):capsule(p,o.points['tail'+(i+1)],r,o.tailWidths[i+1]));}
 for(const[j,polygon]of Object.entries(o.core))add(j.startsWith('head')?'head':j,polygon,j);
 add('spine',[[0,0],[1253,0],[1253,1253],[0,1253]]);
 const author={id:'c163-reference-'+id,family:'quadruped',landmarksPx:o.points,groundLineY:o.ground/1254,materials:{surface:o.material},remainderPart:'spine',parts,coverage:{declarations:'Source-specific point and contour observations with explicit local capsule partitions. No reference-coordinate transfer. Occluded attachment centres are interpretations, not all-visible assertions.',limitations:o.notes,nativeAcceptance:false,visualAcceptance:'CANDIDATE_UNMEASURED'}};
 fs.writeFileSync(packet+'/authoring.json',JSON.stringify(author,null,2)+'\n',{flag:'wx'});fs.writeFileSync(packet+'/presence.json',JSON.stringify({schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(packet+'/manual-provenance.json',JSON.stringify({schema:'cf.c163-manual-reference/v1',sourcePacket:o.source,masterSha256:sha(fs.readFileSync(packet+'/master.png')),authoringSha256:sha(fs.readFileSync(packet+'/authoring.json')),observationSource:base+'/reference-observations.mjs',observationSha256:sha(fs.readFileSync(base+'/reference-observations.mjs')),writerSha256:sha(fs.readFileSync(import.meta.filename)),method:'Independent source-pixel landmarks and core contours; explicit radii generate lower-limb/tail capsule regions. No source pixels altered and no donor authoring transferred.',limitations:o.notes,qualityAccepted:false},null,2)+'\n',{flag:'wx'});
 manifest.push({id:author.id,name:o.name,family:author.family,packet,qualityAccepted:false});
}
fs.writeFileSync(base+'/manual-reference-packets.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({manualCandidates:manifest.length}));
