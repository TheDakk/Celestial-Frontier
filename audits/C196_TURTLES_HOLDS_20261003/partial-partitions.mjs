/** Source-only partial partitions: these are explicitly not complete rig records. */
import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{createRequire}from'node:module';
import{intakeAuthoredPixels}from'../../port/v2/tools/creature-animation/authored-intake.mjs';
import{familyContract}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
const B='audits/C196_TURTLES_HOLDS_20261003',sha=b=>createHash('sha256').update(b).digest('hex'),require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs');
const region=(name,material,polygonPx)=>({name,material,polygonPx});
const rows=[
 {id:'03-box-turtle-partial',sourceId:'08-box-turtle',name:'Box Turtle',regions:[
  region('exposed-head-neck','scaled',[[815,588],[867,539],[918,493],[974,469],[1040,470],[1065,494],[1057,534],[1028,561],[979,600],[925,637],[871,681],[827,694],[800,651]]),
  region('near-forelimb','scaled',[[773,647],[808,632],[845,650],[864,691],[861,737],[877,783],[922,824],[916,871],[789,867],[770,826],[774,776],[764,720]]),
  region('near-hindlimb','scaled',[[307,691],[343,674],[389,692],[411,721],[392,753],[359,792],[372,826],[375,868],[253,873],[234,832],[260,786],[278,733]]),
  region('visible-far-hind-foot','scaled',[[423,757],[494,758],[501,790],[539,814],[548,848],[423,842],[413,805]]),
  region('exposed-tail','scaled',[[203,735],[230,703],[260,679],[304,673],[318,700],[282,721],[248,730]]),
  region('visible-shell','plated',[[263,658],[286,596],[319,529],[365,475],[425,435],[488,407],[550,402],[628,414],[696,444],[758,485],[807,544],[846,575],[824,624],[788,668],[782,721],[745,756],[646,773],[519,774],[410,759],[343,724]])
 ],holds:['Only three distinct foot endpoints are visible; the far forelimb is occluded. A complete quadruped record would require unobserved anatomy.','Near head is slightly three-quarter; no unseen opposite-side eye or limb is declared.']},
 {id:'04-pond-turtle-partial',sourceId:'09-pond-turtle',name:'Pond Turtle',regions:[
  region('exposed-head-neck','scaled',[[831,558],[876,541],[924,510],[975,484],[1015,468],[1099,467],[1110,497],[1095,533],[1055,571],[1005,606],[927,642],[853,658],[813,620]]),
  region('near-forelimb','scaled',[[779,643],[809,630],[841,649],[859,690],[863,743],[897,767],[945,785],[952,822],[839,833],[806,805],[790,770],[777,718]]),
  region('near-hindlimb','scaled',[[363,657],[404,665],[425,696],[411,730],[365,762],[407,791],[430,823],[365,837],[277,820],[269,788],[299,747],[322,699]]),
  region('visible-far-hind-foot','scaled',[[477,721],[536,722],[548,752],[590,766],[610,796],[524,802],[477,784],[465,754]]),
  region('exposed-tail','scaled',[[140,675],[192,660],[251,644],[307,630],[347,646],[329,674],[268,683],[203,687]]),
  region('visible-shell','plated',[[275,618],[310,566],[370,518],[450,477],[528,451],[608,435],[678,446],[748,469],[813,510],[859,537],[902,543],[885,581],[849,618],[807,648],[787,692],[738,723],[650,740],[555,733],[445,713],[357,679],[294,656]])
 ],holds:['Only three distinct feet are visible. The far forelimb is occluded by the neck/near limb/shell.','Visible neck/tail scales support scaled overrides; that proposal does not validate walking or shell rigidity.']},
 {id:'05-snapping-turtle-partial',sourceId:'10-snapping-turtle',name:'Snapping Turtle',regions:[
  region('exposed-head-neck','scaled',[[867,494],[921,489],[982,465],[1045,458],[1110,461],[1146,476],[1163,505],[1149,538],[1120,554],[1108,573],[1124,598],[1094,625],[1031,642],[968,655],[902,625],[857,580]]),
  region('near-forelimb','scaled',[[796,588],[853,596],[904,628],[925,673],[935,732],[974,770],[1017,797],[1020,843],[882,849],[861,813],[854,764],[838,718],[805,679],[779,628]]),
  region('near-hindlimb','scaled',[[429,637],[490,632],[542,654],[552,686],[524,724],[476,753],[503,778],[526,815],[422,834],[379,813],[370,783],[392,728]]),
  region('visible-far-hind-foot','scaled',[[586,692],[647,694],[655,733],[694,757],[717,800],[618,801],[578,774],[568,736]]),
  region('exposed-tail','scaled',[[86,744],[114,707],[180,662],[257,630],[323,608],[368,600],[407,639],[407,683],[351,703],[285,719],[217,730],[153,735]]),
  region('visible-shell','plated',[[345,594],[381,544],[426,486],[491,434],[548,404],[613,402],[619,373],[658,388],[699,371],[747,389],[788,410],[817,405],[858,443],[906,461],[919,498],[899,545],[875,588],[828,619],[763,659],[704,691],[624,707],[555,694],[477,670],[404,635]])
 ],holds:['Three walking feet are unambiguous; no fourth hidden forelimb is invented.','The source has exaggerated shell ridges, tail spines and a strongly hooked open beak; biological/style scoring remains held.','The head-neck polygon is a visible scaled-surface region, not a resolved jaw articulation or complete skull fit.']},
 {id:'06-turtle-partial',sourceId:'12-turtle',name:'Turtle',regions:[
  region('exposed-head-neck','scaled',[[829,546],[878,543],[924,511],[973,480],[1019,468],[1096,468],[1105,496],[1096,531],[1062,569],[1018,609],[951,642],[864,664],[817,620]]),
  region('near-forelimb','scaled',[[768,652],[807,637],[852,659],[879,700],[889,752],[936,784],[967,809],[975,844],[848,854],[814,825],[799,787],[784,742],[756,697]]),
  region('near-hindlimb','scaled',[[277,684],[325,665],[365,690],[379,721],[347,754],[307,780],[329,806],[331,845],[228,852],[194,815],[197,781],[228,736]]),
  region('visible-far-hind-foot','scaled',[[408,729],[472,729],[477,761],[513,785],[541,814],[442,821],[410,799],[395,768]]),
  region('exposed-tail','scaled',[[158,675],[207,656],[254,638],[294,644],[294,674],[248,685],[204,683]]),
  region('visible-shell','plated',[[220,619],[250,568],[306,512],[374,463],[455,429],[544,411],[616,416],[686,435],[757,475],[816,519],[862,537],[902,540],[885,578],[851,620],[811,655],[788,703],[752,730],[672,751],[577,747],[473,729],[368,710],[286,670]])
 ],holds:['Three distinct feet are visible; the far forelimb is occluded. Full mandatory contact/limb authoring is held.','Generic Turtle identity is the exact canonical source subject, not a renamed Pond Turtle or a profile-wide material mapping.']},
];
const beaks={
 '03-box-turtle-partial':[[[1027,480],[1056,479],[1064,503],[1059,533],[1043,550],[1023,535],[1035,514]]],
 '04-pond-turtle-partial':[[[1076,475],[1100,469],[1106,500],[1095,529],[1078,546],[1062,535],[1078,513]]],
 '05-snapping-turtle-partial':[[[1121,468],[1143,481],[1161,505],[1156,554],[1148,564],[1132,532],[1104,525],[1107,492]],[[1075,562],[1102,547],[1139,568],[1144,590],[1108,624],[1091,631],[1097,611],[1075,593]]],
 '06-turtle-partial':[[[1075,474],[1097,468],[1107,492],[1098,522],[1084,545],[1068,543],[1078,517]]]
};
for(const r of rows)r.regions.unshift(...beaks[r.id].map((p,i)=>region('visible-keratin-beak-'+i,'plated',p)));
const inside=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
for(const r of rows){
 const out=`${B}/${r.id}`;assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});const source=`audits/C186_CREATURE_SUPPLY_20261002/${r.sourceId}/master.png`,identity=`audits/C186_CREATURE_SUPPLY_20261002/${r.sourceId}/subject-source.json`,bytes=fs.readFileSync(source),png=PNG.sync.read(bytes),key=intakeAuthoredPixels(new Uint8ClampedArray(png.data),png.width,png.height).rgba;assert.equal(png.width,1254);assert.equal(png.height,1254);
 fs.writeFileSync(out+'/master.png',bytes);fs.copyFileSync(identity,out+'/subject-source.json');
 const preview=new PNG({width:png.width,height:png.height}),labels=new PNG({width:png.width,height:png.height}),counts=new Array(r.regions.length+1).fill(0);let sourcePixels=0;
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const i=y*png.width+x;if(!key[i*4+3])continue;sourcePixels++;const k=r.regions.findIndex(p=>inside(x+.5,y+.5,p.polygonPx))+1;counts[k]++;labels.data.set([k,k,k,255],i*4);const color=k===0?[150,150,150]:r.regions[k-1].material==='plated'?[63,133,209]:[218,152,56];preview.data.set([...color,255],i*4);}
 fs.writeFileSync(out+'/ownership-preview.png',PNG.sync.write(preview));fs.writeFileSync(out+'/partial-labels.png',PNG.sync.write(labels));
 const observedJoints=['neck','head',...['hindNear','hindFar','foreNear'].flatMap(p=>['Root','Knee','Ankle','Paw'].map(s=>p+s)),...['tail0','tail1','tail2','tail3']];assert(observedJoints.every(j=>familyContract('quadruped').joints.includes(j)));
 const record={schema:'cf.c196-source-partial-partition/v1',name:r.name,source,sourceSha256:sha(bytes),subjectSource:identity,subjectSourceSha256:sha(fs.readFileSync(identity)),status:'PARTIAL_SOURCE_PARTITION_NOT_A_FIT',regions:r.regions,pixelCounts:r.regions.map((v,i)=>({region:v.name,material:v.material,pixels:counts[i+1]})),unassignedSourcePixels:counts[0],totalVisibleKeyedPixels:sourcePixels,unassignedPreviewColor:'gray; never silently assigned to shell',proposedRecordMaterials:{surface:'plated',joints:Object.fromEntries(observedJoints.map(j=>[j,'scaled']))},proposalScope:'Only a source-bound material/region proposal. No joint landmarks or complete record are supplied for the concealed fourth limb; do not pass this object directly to rig intake.',externalEars:'anatomically absent external pinnae; no ear controls proposed',held:r.holds,originalBytesPreserved:true,sourcePixelsChanged:0,qualityAccepted:false,independentReferenceEligible:false,native:false};
 fs.writeFileSync(out+'/source-partition.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({id:r.id,visiblePixels:sourcePixels,unassigned:counts[0],status:record.status}));
}
