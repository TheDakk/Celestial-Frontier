import fs from'node:fs';import{createHash}from'node:crypto';
const B='audits/C202_CEPHALOPOD_REFERENCES_20261004',old=B+'/01-octopus-author02',out=B+'/01-octopus-author03';fs.mkdirSync(out,{recursive:true});for(const n of['master.png','subject-source.json','presence.json','source-observations.json'])fs.copyFileSync(old+'/'+n,out+'/'+n);const a=JSON.parse(fs.readFileSync(old+'/authoring.json'));a.id='c202-octopus-source04-author03';a.parts.pop();
for(const[joint,polygonPx]of[
 ['arm4Seg0',[[679,675],[721,680],[736,735],[753,779],[744,815],[719,822],[698,779],[681,739]]],
 ['arm4Seg1',[[713,796],[749,790],[772,829],[808,858],[827,888],[813,923],[781,898],[748,877],[724,842]]],
 ['arm3Seg0',[[600,689],[626,680],[638,721],[621,756],[624,785],[598,800],[582,772]]],
 ['arm3Seg1',[[668,752],[687,763],[671,805],[651,838],[624,858],[604,843],[638,801]]],
 ['arm0Seg1',[[373,422],[392,427],[414,474],[448,497],[437,526],[401,503],[381,463]]],
 ['arm0Seg0',[[427,493],[457,506],[509,516],[505,541],[463,535],[431,519]]],
 ['arm1Seg0',[[421,565],[450,567],[489,577],[523,583],[536,606],[501,618],[468,603],[428,591]]]
])a.parts.push({id:'final-'+joint.toLowerCase(),joint,layer:a.parts.find(p=>p.joint===joint).layer,polygonPx});
// Real central head/arm-crown paint provides the torso anchor; no arm edge is deliberately retained as torso.
a.parts.unshift({id:'body',joint:'root',layer:'near',polygonPx:[[651,520],[683,530],[694,561],[681,591],[658,599],[635,579],[641,550]]});a.coverage.contourCorrection+=' Final successor assigns the remaining lower-right sucker strip to its observed arm and gives the root the actual central arm-crown region; any D28 placement preserves every RGBA pixel.';
fs.writeFileSync(out+'/authoring.json',JSON.stringify(a,null,2)+'\n',{flag:'wx'});fs.writeFileSync(out+'/correction.json',JSON.stringify({schema:'cf.c202-contour-successor/v1',source:B+'/01-octopus-source04/master.png',sourceSha256:createHash('sha256').update(fs.readFileSync(out+'/master.png')).digest('hex'),predecessor:old,landmarksUnchanged:true,reason:'Source-observed remaining low-right arm sucker fringe and central crown root ownership; no pixel changes.'},null,2)+'\n',{flag:'wx'});console.log(out);
