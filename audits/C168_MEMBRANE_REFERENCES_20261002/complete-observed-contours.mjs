import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const b='audits/C168_MEMBRANE_REFERENCES_20261002',old=b+'/spread-bat',next=b+'/spread-bat-contours',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert(!fs.existsSync(next));fs.mkdirSync(next);
for(const f of['master.png','prompt.txt','subject-source.json','presence.json','observation.json'])fs.copyFileSync(old+'/'+f,next+'/'+f,fs.constants.COPYFILE_EXCL);
const a=JSON.parse(fs.readFileSync(old+'/authoring.json')),tail=a.parts.pop();assert.equal(tail.id,'spine');
const added=[
 ['far-patagium-upper','wingFarWrist',[[545,470],[564,474],[579,531],[586,566],[550,575],[536,551]]],
 ['far-patagium-lower','wingFarElbow',[[547,548],[579,550],[599,587],[629,609],[646,614],[660,603],[676,633],[651,653],[616,639],[577,615],[544,581]]],
 ['near-distal-rim','wingNearTip',[[828,675],[869,699],[918,738],[968,807],[994,873],[997,946],[943,961],[894,915],[811,882],[791,839],[809,804],[820,751],[818,707]]],
 ['near-proximal-web-edge','wingNearElbow',[[606,765],[690,765],[739,781],[745,818],[714,839],[658,842],[613,830]]],
 ['near-distal-web-edge','wingNearWrist',[[729,775],[821,770],[835,832],[809,865],[781,862],[748,830]]],
 ['throat-fur','neck',[[694,657],[761,660],[777,681],[770,699],[717,711],[686,710]]],
 ['far-ear-rim','earFarTip',[[706,580],[760,534],[778,525],[777,594],[764,629],[728,650],[710,632]]],
 ['near-ear-rim','earNearTip',[[640,507],[699,506],[718,548],[731,598],[709,651],[659,639]]],
 ['far-web-scallop-edge','wingFarElbow',[[409,569],[440,573],[462,605],[475,663],[469,710],[444,700],[434,651],[410,612]]],
 ['pelvic-fur-edge','pelvis',[[513,684],[557,680],[574,707],[570,731],[527,738],[508,717]]]
];
a.parts.push(...added.map(([id,joint,polygonPx])=>({id,joint,layer:joint.includes('Far')?'far':'near',polygonPx})),tail);
a.coverage.contourSuccessor='One bounded source-observed completion after full-size ownership review: only previously unclaimed remainder pixels can enter existing anatomical owners. Joint positions and previous priority polygons are unchanged.';
fs.writeFileSync(next+'/authoring.json',JSON.stringify(a,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(next+'/contour-provenance.json',JSON.stringify({schema:'cf.c168-contour-completion/v1',predecessor:old,predecessorAuthoringSha256:sha(old+'/authoring.json'),masterSha256:sha(next+'/master.png'),authoringSha256:sha(next+'/authoring.json'),basis:[old+'/ownership-preview-01.png',old+'/remainder-components-01.json'],observations:'Upper far patagium follows observed wrist and elbow; lower near web and distal rim follow their existing wing owners; throat/ear/fur contours follow source paint. Large wing patches were incorrectly left to the body remainder. These are manual contour decisions, not the automatic island mover.',addedParts:added.map(([id,joint])=>({id,joint})),landmarksChanged:false,previousPriorityRegionsChanged:false,sourcePixelsChanged:false,qualityAccepted:false,nativeAcceptance:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({successor:next,addedRegions:added.length}));
