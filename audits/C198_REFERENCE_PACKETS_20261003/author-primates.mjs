/** Source-observed controls and priority contours. No donor fit or masks are read. */
import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const B='audits/C198_REFERENCE_PACKETS_20261003',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const P=(id,joint,p,layer='near')=>({id,joint,polygonPx:p,layer});
const cases=[{
 id:'01-gorilla',source:'audits/C198_CREATURE_SUPPLY_B_20261003/01-gorilla',absent:['tail'],ground:1000,
 joints:{root:[572,631],pelvis:[446,625],spine:[589,539],chest:[729,492],neck:[776,471],head:[843,381],jaw:[872,468],armNearShoulder:[628,449],armNearElbow:[661,699],armNearHand:[701,976],armFarShoulder:[854,541],armFarElbow:[915,712],armFarHand:[944,966],legNearHip:[381,607],legNearKnee:[348,765],legNearFoot:[330,939],legFarHip:[548,750],legFarKnee:[536,836],legFarFoot:[564,934]},
 parts:[
 P('near-hand','armNearHand',[[643,932],[671,923],[739,932],[768,955],[774,982],[751,1003],[647,1003],[638,977]]),
 P('far-hand','armFarHand',[[904,930],[971,927],[988,948],[994,977],[973,993],[914,990],[888,977],[886,960]],'far'),
 P('near-foot','legNearFoot',[[250,895],[281,890],[328,906],[351,923],[395,931],[403,944],[384,960],[315,960],[272,945],[253,921]]),
 P('far-foot','legFarFoot',[[493,904],[552,902],[594,915],[629,927],[644,939],[632,952],[555,954],[491,944]],'far'),
 P('near-forearm','armNearElbow',[[605,652],[650,648],[718,674],[757,718],[770,768],[763,828],[769,885],[759,944],[738,961],[667,947],[643,918],[633,852],[619,783],[602,731]]),
 P('far-forearm','armFarElbow',[[861,663],[915,654],[963,682],[982,744],[982,816],[1007,891],[988,944],[928,959],[906,937],[895,881],[885,822],[866,760],[849,704]],'far'),
 P('near-leg','legNearKnee',[[313,566],[379,550],[422,571],[451,617],[459,671],[435,725],[398,778],[366,837],[305,911],[270,925],[247,889],[259,837],[290,762],[312,707]]),
 P('far-leg','legFarKnee',[[546,715],[592,735],[616,771],[606,841],[604,912],[563,935],[493,928],[497,875],[520,807],[530,759]],'far'),
 P('near-upper-arm','armNearShoulder',[[543,389],[600,372],[666,380],[717,419],[746,472],[757,526],[742,589],[725,655],[702,712],[648,706],[597,683],[563,641],[545,577],[530,504]]),
 P('far-upper-arm','armFarShoulder',[[843,493],[890,502],[922,548],[938,607],[957,665],[922,700],[872,696],[843,655],[825,589]],'far'),
 P('jaw','jaw',[[833,432],[873,438],[918,446],[926,469],[905,497],[867,505],[837,477]]),
 P('head','head',[[736,270],[770,233],[805,225],[840,245],[868,287],[895,317],[919,354],[919,396],[905,443],[861,463],[816,446],[779,409],[754,356]]),
 P('neck','neck',[[689,305],[738,287],[769,342],[793,396],[837,446],[844,492],[806,536],[761,538],[719,491],[686,425]]),
 P('chest','chest',[[715,474],[765,482],[817,503],[844,539],[833,587],[795,626],[755,641],[720,600]]),
 P('pelvis','pelvis',[[383,443],[445,443],[494,475],[518,539],[510,605],[495,670],[456,706],[402,662],[371,599]]),
 P('body','root',[[0,0],[1,0],[0,1]])],
 holds:['The far hind chain is authored only from its visible lower-belly emergence; hidden anatomical hip depth is not claimed.','Four knuckle/foot endpoints are distinct, with different projected support heights. Static checks must judge their actual rest geometry.','Fur and source proportions still require scoring; knuckle controls cannot establish biological joint depth.']
},{
 id:'02-capuchin',source:'audits/C198_CREATURE_SUPPLY_B_20261003/02-capuchin',absent:[],ground:954,
 joints:{root:[642,546],pelvis:[557,579],spine:[663,472],chest:[778,560],neck:[809,482],head:[889,447],jaw:[925,519],armNearShoulder:[760,589],armNearElbow:[680,737],armNearHand:[769,920],armFarShoulder:[862,603],armFarElbow:[863,736],armFarHand:[941,898],legNearHip:[522,621],legNearKnee:[466,730],legNearFoot:[461,882],legFarHip:[606,652],legFarKnee:[632,766],legFarFoot:[658,875],tail0:[496,558],tail1:[272,505],tail2:[327,339]},
 parts:[
 P('near-hand','armNearHand',[[717,887],[750,880],[785,892],[807,910],[818,935],[804,952],[759,958],[724,943],[712,916]]),
 P('far-hand','armFarHand',[[893,866],[920,860],[950,871],[982,892],[1003,905],[999,920],[969,921],[934,909],[902,903]],'far'),
 P('near-foot','legNearFoot',[[399,849],[435,842],[462,855],[488,860],[516,877],[512,890],[493,907],[454,912],[417,890]]),
 P('far-foot','legFarFoot',[[587,835],[614,831],[641,845],[673,848],[708,866],[725,881],[709,895],[660,895],[619,880],[589,867]],'far'),
 P('near-forearm','armNearElbow',[[645,672],[690,669],[715,705],[717,757],[735,803],[751,855],[781,889],[759,919],[722,919],[694,885],[674,835],[649,787],[621,738]]),
 P('far-forearm','armFarElbow',[[815,666],[860,661],[891,693],[900,743],[910,802],[927,850],[947,878],[923,903],[895,890],[874,854],[851,809],[836,762],[814,719]],'far'),
 P('near-leg','legNearKnee',[[478,571],[531,566],[566,607],[565,656],[537,708],[502,758],[472,803],[429,850],[437,877],[411,887],[390,861],[380,825],[399,779],[423,736],[460,690]]),
 P('far-leg','legFarKnee',[[588,636],[632,631],[657,665],[662,704],[651,749],[626,795],[613,833],[636,856],[610,875],[582,860],[585,813],[606,762],[599,719]],'far'),
 P('near-upper-arm','armNearShoulder',[[720,479],[769,487],[806,523],[817,564],[794,613],[756,650],[716,709],[681,721],[646,690],[659,642],[691,588]]),
 P('far-upper-arm','armFarShoulder',[[834,553],[868,550],[893,579],[912,618],[909,660],[885,700],[850,698],[819,658],[812,608]],'far'),
 P('tail2','tail2',[[254,376],[273,338],[302,310],[345,294],[392,296],[425,313],[445,342],[447,371],[437,403],[424,427],[410,430],[394,419],[406,388],[408,365],[393,348],[367,343],[338,351],[314,368],[302,394]]),
 P('tail1','tail1',[[253,370],[302,390],[282,429],[278,469],[286,502],[309,527],[326,577],[285,573],[250,548],[229,516],[219,471],[228,422]]),
 P('tail0','tail0',[[290,525],[331,542],[381,548],[433,541],[491,523],[512,551],[502,585],[457,612],[407,627],[359,618],[319,599],[286,572]]),
 P('jaw','jaw',[[883,504],[916,504],[948,501],[960,515],[949,538],[923,548],[893,536]]),
 P('head','head',[[804,392],[832,370],[866,357],[902,354],[927,366],[946,389],[958,428],[958,465],[950,504],[922,523],[887,518],[851,496],[823,461],[803,425]]),
 P('neck','neck',[[771,416],[805,392],[835,431],[856,470],[891,510],[903,548],[878,578],[837,578],[794,553],[769,515]]),
 P('chest','chest',[[741,530],[782,535],[823,564],[832,612],[806,646],[767,653],[729,616],[712,575]]),
 P('pelvis','pelvis',[[516,491],[563,465],[602,468],[628,505],[630,553],[614,596],[580,641],[544,649],[511,611],[494,555]]),
 P('body','root',[[0,0],[1,0],[0,1]])],
 holds:['Separate hands and feet are visible; the far hip/shoulder controls mark painted emergence rather than unseen anatomical roots.','The tail is an open curl, with three coarse observed control frames; no claim of an anatomically segmented tail.','Different projected support levels and dense fur overlaps remain source limitations to be checked, not flattened in authoring.']
}];
for(const c of cases){const out=B+'/'+c.id;assert(!fs.existsSync(out));fs.mkdirSync(out);for(const f of ['master.png','subject-source.json'])fs.copyFileSync(c.source+'/'+f,out+'/'+f);
 const a={id:'c198-reference-'+c.id,family:'primate',habitat:{realm:'land',source:'Canonical primate source; four actual visible hand/foot endpoints.'},landmarksPx:c.joints,groundLineY:c.ground/1254,materials:{surface:'fur'},parts:c.parts,remainderPart:'body',coverage:{scope:'One independently observed source painting, no donor coordinates or masks.',controlFrameLimit:'Root, pelvis, spine and chest are source-local control frames inside visible tissue, not observed skeletal bones.',qualityAccepted:false}};
 for(const[name,value]of Object.entries({'authoring.json':a,'presence.json':{schema:'cf.anatomy-presence/v2',absent:c.absent,hidden:[],folded:[]},'source-observations.json':{schema:'cf.c198-independent-reference/v1',source:c.source+'/master.png',sourceSha256:sha(c.source+'/master.png'),authoringMethod:'Independent full-size source observation; no other authoring files loaded.',mandatoryContacts:4,holds:c.holds,sourcePixelsChanged:0,qualityAccepted:false,native:false}}))fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 console.log(out);
}
