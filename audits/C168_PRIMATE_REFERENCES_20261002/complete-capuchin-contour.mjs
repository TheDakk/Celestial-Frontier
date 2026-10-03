import fs from'node:fs';import{createHash}from'node:crypto';
const base='audits/C168_PRIMATE_REFERENCES_20261002',old=base+'/capuchin-repaint',out=base+'/capuchin-contours',sha=b=>createHash('sha256').update(b).digest('hex');
fs.mkdirSync(out);
for(const file of['master.png','subject-source.json','prompt.txt','presence.json','generation.json','request.json','visible-anatomy.json'])fs.copyFileSync(old+'/'+file,out+'/'+file,fs.constants.COPYFILE_EXCL);
const before=JSON.parse(fs.readFileSync(old+'/authoring.json')),author=structuredClone(before),additions=[
 {id:'far-arm-inner-upper-contour',joint:'armFarElbow',layer:'far',polygonPx:[[835,698],[857,698],[885,786],[875,809],[859,779],[851,749],[841,731]]},
 {id:'far-arm-inner-lower-contour',joint:'armFarHand',layer:'far',polygonPx:[[867,781],[889,795],[946,865],[945,875],[927,862],[909,842],[892,825],[878,820],[869,802]]}
];
if(author.parts.at(-1).id!=='body')throw Error('Explicit remainder position changed');author.id='c168-reference-capuchin-contours';author.parts.splice(author.parts.length-1,0,...additions);
author.coverage.contourCompletion='One manually observed inner far-arm contour, exact refused 1430-pixel component at x840–941/y703–868. Proximal fringe follows armFarElbow; distal fringe follows armFarHand. New regions are after all prior anatomical owners and before body, so only previously body-owned pixels can move. No landmark, contact, paint, motion or limit change.';
fs.writeFileSync(out+'/authoring.json',JSON.stringify(author,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(out+'/manual-provenance.json',JSON.stringify({schema:'cf.c168-targeted-contour/v1',predecessor:old,masterSha256:sha(fs.readFileSync(out+'/master.png')),predecessorAuthoringSha256:sha(fs.readFileSync(old+'/authoring.json')),authoringSha256:sha(fs.readFileSync(out+'/authoring.json')),diagnosis:base+'/capuchin-contour-diagnosis.json',observedComponentPixels:1430,observedComponentBox:{x0:840,y0:703,x1:941,y1:868},attribution:'Visible inner contour of the far arm; proximal section belongs to elbow-driven upper arm and distal section to hand-driven forearm.',additions,sourcePixelsChanged:0,landmarksChanged:false,priorNonBodyOwnersMayChange:false,automaticIslandPlacement:false,qualityAccepted:false,nativeRuns:0},null,2)+'\n',{flag:'wx'});
