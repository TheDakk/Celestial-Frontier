/** Independent source observation of both exposed Snow Petrel wings. */
import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const B='audits/C198_SOURCE_HOLDS_20261003/03-snow-petrel-open',S='audits/C198_CREATURE_SUPPLY_C_20261003/12-snow-petrel';
assert(!fs.existsSync(B));fs.mkdirSync(B,{recursive:true});for(const p of['master.png','subject-source.json'])fs.copyFileSync(S+'/'+p,B+'/'+p);
const P=(id,joint,polygonPx,layer='near')=>({id,joint,polygonPx,layer});
const a={id:'c198-snow-petrel-observed-wings',family:'biped-bird',habitat:{realm:'land',source:'Standing source with two distinct actual foot supports; flight capability is not declared from the painting.'},groundLineY:933/1254,materials:{surface:'feathers'},
 landmarksPx:{root:[658,673],pelvis:[569,727],spine:[698,640],chest:[813,622],neck0:[826,549],neck1:[859,488],head:[901,438],beak:[985,483],legNearKnee:[608,825],legNearAnkle:[590,898],legNearFoot:[635,918],legFarKnee:[735,811],legFarAnkle:[768,885],legFarFoot:[811,900],wingNearRoot:[670,564],wingNearTip:[364,554],wingFarRoot:[719,515],wingFarTip:[745,408],tailFan:[374,758]},
 parts:[
 P('near-foot','legNearFoot',[[568,883],[591,881],[617,897],[652,902],[682,911],[690,924],[665,937],[631,935],[595,925],[565,930],[558,916]]),
 P('far-foot','legFarFoot',[[738,872],[762,868],[782,882],[812,885],[849,890],[857,904],[837,919],[802,918],[771,907],[741,906],[727,890]],'far'),
 P('near-shin','legNearAnkle',[[593,816],[618,818],[615,848],[608,877],[603,901],[584,915],[573,900],[582,864]]),
 P('far-shin','legFarAnkle',[[720,806],[742,798],[751,828],[761,852],[780,880],[767,896],[745,890],[733,862]],'far'),
 P('near-thigh','legNearKnee',[[590,746],[636,742],[651,766],[637,797],[618,835],[592,837],[584,807],[574,783]]),
 P('far-thigh','legFarKnee',[[703,757],[744,750],[756,769],[748,799],[739,821],[718,828],[706,804]],'far'),
 P('near-wing-root','wingNearRoot',[[564,429],[594,430],[620,444],[641,478],[663,511],[701,535],[717,557],[709,587],[679,614],[659,646],[632,651],[603,625],[589,587],[581,548],[568,512],[547,479]]),
 P('near-wing-flight','wingNearTip',[[251,600],[272,576],[298,554],[330,524],[372,492],[418,462],[466,441],[508,429],[550,424],[570,438],[574,471],[590,516],[608,558],[625,603],[629,638],[609,660],[583,644],[554,618],[532,608],[503,583],[481,597],[462,601],[445,588],[422,597],[397,586],[376,594],[348,589],[321,600],[296,591],[277,602]]),
 P('far-wing-tip','wingFarTip',[[628,458],[647,434],[679,410],[715,384],[750,366],[777,363],[793,369],[799,380],[788,403],[774,428],[766,455],[769,481],[781,504],[751,522],[710,511],[673,489]],'far'),
 P('far-wing-root','wingFarRoot',[[674,488],[716,481],[759,492],[784,509],[765,534],[728,542],[690,530],[672,511]],'far'),
 P('tail','tailFan',[[485,688],[537,691],[574,707],[566,740],[546,756],[493,767],[450,776],[415,791],[376,796],[355,797],[336,785],[306,783],[268,784],[263,773],[287,755],[322,736],[359,719],[402,705],[448,692]]),
 P('beak','beak',[[951,446],[980,451],[999,470],[1017,484],[1018,501],[1005,520],[998,495],[980,486],[948,479]]),
 P('head','head',[[827,443],[845,415],[879,396],[911,392],[937,400],[955,419],[966,447],[954,477],[929,499],[898,496],[860,478]]),
 P('upper-neck','neck1',[[820,464],[854,465],[885,489],[911,512],[903,537],[875,549],[846,534],[816,506]]),
 P('lower-neck','neck0',[[782,510],[817,495],[851,518],[873,548],[899,569],[884,601],[849,614],[810,590],[776,551]]),
 P('chest','chest',[[784,558],[840,569],[875,599],[894,624],[880,665],[850,697],[812,718],[766,708],[744,672],[750,619]]),
 P('pelvis','pelvis',[[538,693],[580,669],[622,685],[659,712],[656,747],[623,779],[586,781],[555,756],[529,725]]),
 P('body','root',[[0,0],[1,0],[0,1]])],remainderPart:'body',coverage:{scope:'Independent source-pixel authoring of new C198 painting. No old masks rebound.',visibleFarWing:'Only the emergent painted far-wing base and its visible edge-on distal fan are represented; no unseen wing surface is synthesized.',controlFrames:'Axial body controls lie within visible body tissue and do not claim internal skeletal visibility.',qualityAccepted:false}};
for(const[name,v]of Object.entries({'authoring.json':a,'presence.json':{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},'correction.json':{schema:'cf.c198-independent-source-authoring/v1',source:S+'/master.png',sourceSha256:createHash('sha256').update(fs.readFileSync(S+'/master.png')).digest('hex'),sourcePixelsChanged:0,priorNegative:'audits/C192_SOURCE_HOLD_REPAIRS_20261002/05b-snow-petrel-leg/review-01/faint-0p9.png',scope:'New source exposes a separate far-wing emerging base. Every source point and priority polygon is authored on these new exact bytes. No prior masks or coordinates reused.',qualityAccepted:false,native:false}}))fs.writeFileSync(B+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
console.log(B);
