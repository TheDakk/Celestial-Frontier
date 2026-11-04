/** Independently observed source-pixel fish authoring; no prior coordinates reused. */
import fs from 'node:fs';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const B='audits/C198_SOURCE_HOLDS_20261003/02-tiger-shark-v4',S='audits/C192_SOURCE_HOLD_REPAIRS_20261002/06-tiger-shark-v4';
assert(!fs.existsSync(B));fs.mkdirSync(B,{recursive:true});
for(const p of ['master.png','subject-source.json'])fs.copyFileSync(S+'/'+p,B+'/'+p);
const part=(id,joint,polygonPx,layer='near')=>({id,joint,polygonPx,layer});
const author={id:'c198-tiger-shark-v4-source',family:'fish',habitat:{realm:'water',source:'Canonical Tiger Shark aquatic source; no walking/contact claim.'},groundLineY:812/1254,materials:{surface:'scales'},
 landmarksPx:{root:[890,651],head:[1034,644],jaw:[1012,686],spine0:[845,644],spine1:[744,643],spine2:[637,645],spine3:[533,641],spine4:[427,631],spine5:[319,626],caudal:[261,621],dorsal:[690,508],pectoralFar:[851,751],pectoralNear:[825,715]},
 parts:[
  part('near-pectoral','pectoralNear',[[798,687],[832,684],[857,699],[850,724],[824,753],[790,775],[748,797],[698,813],[716,786],[747,747],[767,718]]),
  part('far-pectoral','pectoralFar',[[818,731],[868,728],[865,751],[849,780],[833,798],[821,780],[811,754]],'far'),
  part('jaw','jaw',[[953,669],[981,675],[1012,675],[1042,670],[1065,674],[1050,693],[1023,705],[990,706],[963,696]]),
  part('dorsal','dorsal',[[618,561],[638,540],[651,508],[654,479],[653,451],[671,454],[696,469],[721,493],[741,523],[760,543],[748,557],[684,565]]),
  part('caudal','caudal',[[320,606],[296,576],[264,543],[226,504],[180,468],[133,447],[153,470],[165,495],[178,491],[190,500],[186,519],[202,549],[218,578],[237,606],[256,636],[256,658],[245,686],[237,711],[263,705],[290,687],[313,660],[333,642],[333,616]]),
  part('head','head',[[892,582],[938,589],[987,602],[1037,616],[1095,632],[1092,650],[1076,668],[1046,679],[1008,670],[970,678],[951,705],[909,716],[890,692]]),
  part('spine5','spine5',[[314,600],[375,599],[381,663],[317,649]]),
  part('spine4','spine4',[[373,598],[449,585],[468,591],[474,679],[446,676],[412,677],[386,690],[380,681],[389,662],[380,654]]),
  part('second-dorsal','spine4',[[399,602],[412,584],[418,558],[434,562],[451,580],[475,590],[475,604]]),
  part('spine3','spine3',[[466,587],[563,568],[581,708],[537,702],[506,692],[472,681]]),
  part('rear-ventral-fin','spine3',[[464,682],[493,680],[540,691],[555,701],[527,718],[477,736],[486,714],[475,706]]),
  part('spine2','spine2',[[555,569],[658,554],[670,731],[623,730],[575,713]]),
  part('spine1','spine1',[[652,554],[752,547],[771,732],[718,739],[663,732]]),
  part('spine0','spine0',[[747,546],[839,560],[862,707],[840,730],[767,738]]),
  part('body','root',[[0,0],[1,0],[0,1]])
 ],remainderPart:'body',coverage:{scope:'Independent source-observed reference candidate; no transfer from old Tiger Shark masks.',axisControls:'Spine points are control frames along the observed body centerline, not claims about visible internal bones.',remainingHold:'The source tail notch, glossy treatment and both visible fin interpretations require full-size scoring. Extra ventral and second dorsal silhouettes follow observed paint and share existing body-segment controls; no new fin joint is invented.',nativeAcceptance:false}};
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const[name,value]of Object.entries({'authoring.json':author,'presence.json':{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},'correction.json':{schema:'cf.c198-independent-source-authoring/v1',source:S+'/master.png',sourceSha256:sha(S+'/master.png'),generatorProvenance:S,sourcePixelsChanged:0,sourceLandmarksReused:false,sourceLabelsReused:false,observations:['Full source shows the long upper caudal lobe and concave subterminal notch, shorter lower lobe, two pectoral surfaces, dorsal fin and actual jaw.','The prior v4 source edit changed pixels beyond its tail; every coordinate/region here is newly observed on the v4 bytes, never rebound from the predecessor.'],independentReferenceEligible:false,qualityAccepted:false,native:false}}))fs.writeFileSync(B+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(B);
