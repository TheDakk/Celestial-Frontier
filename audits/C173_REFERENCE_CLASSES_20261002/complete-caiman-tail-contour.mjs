import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const base='audits/C173_REFERENCE_CLASSES_20261002',old=base+'/01-caiman',next=base+'/01-caiman-tail-contour',read=p=>fs.readFileSync(p),sha=p=>createHash('sha256').update(read(p)).digest('hex'),j=p=>JSON.parse(read(p));
const diagnosis=j(old+'/remainder-diagnosis.json');assert.equal(diagnosis.components[1].pixels,1475);assert.deepEqual(diagnosis.components[1].bounds,[179,663,488,710]);
fs.mkdirSync(next);for(const f of['master.png','subject-source.json','presence.json'])fs.copyFileSync(old+'/'+f,next+'/'+f,fs.constants.COPYFILE_EXCL);
const author=j(old+'/authoring.json'),contours=[
 {id:'tail-tip-lower-rim',joint:'tail3',layer:'near',polygonPx:[[165,690],[226,690],[227,720],[162,729]]},
 {id:'tail-distal-lower-rim',joint:'tail2',layer:'near',polygonPx:[[226,680],[340,676],[340,711],[226,720]]},
 {id:'tail-middle-lower-rim',joint:'tail1',layer:'near',polygonPx:[[340,667],[489,651],[492,681],[340,711]]}
];author.parts.splice(author.parts.length-1,0,...contours);author.id='c173-reference-caiman-tail-contour';author.coverage.contourSuccessor='Only the observed ventral tail fringe at x179–488/y663–710, formerly disconnected body remainder, is assigned to existing adjacent tail owners. All pre-existing priority polygons, landmarks, source pixels and contact heights remain unchanged.';
fs.writeFileSync(next+'/authoring.json',JSON.stringify(author,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(next+'/contour-receipt.json',JSON.stringify({schema:'cf.c173-contour-successor/v1',predecessor:old,predecessorAuthoringSha256:sha(old+'/authoring.json'),masterSha256:sha(next+'/master.png'),sourceMasterUnchanged:sha(old+'/master.png')===sha(next+'/master.png'),diagnosisSha256:sha(old+'/remainder-diagnosis.json'),writerSha256:sha(import.meta.filename),addedContours:contours,limitation:'Other small remainder fringes remain; no automatic island placement and no quality/native acceptance.',capUnchanged:.05},null,2)+'\n',{flag:'wx'});
