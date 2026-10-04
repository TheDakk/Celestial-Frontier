import fs from'node:fs';import{createHash}from'node:crypto';
const B='audits/C202_ARTHROPOD_REFERENCES_20261004',P=(id,joint,polygonPx,layer='near')=>({id,joint,polygonPx,layer});
const cases=[{id:'03-beetle-dorsal',name:'Beetle',ground:979,
 joints:{root:[641,610],thorax:[732,606],head:[868,606],mandible:[941,619],abdomen:[430,606],legFrontFarKnee:[798,447],legFrontFarFoot:[993,326],legMidFarKnee:[657,406],legMidFarFoot:[550,255],legHindFarKnee:[427,399],legHindFarFoot:[214,329],legFrontNearKnee:[801,770],legFrontNearFoot:[997,917],legMidNearKnee:[650,792],legMidNearFoot:[542,970],legHindNearKnee:[421,800],legHindNearFoot:[205,902],antennaFar:[1128,407],antennaNear:[1137,802],wingFar:[458,538],wingNear:[459,678]},
 parts:[
 P('front-far-lower','legFrontFarFoot',[[789,437],[814,428],[870,387],[917,364],[971,311],[995,307],[1014,324],[1013,348],[992,355],[980,337],[944,376],[905,411],[855,438],[805,459]],'far'),
 P('middle-far-lower','legMidFarFoot',[[639,412],[626,386],[589,347],[565,313],[533,280],[521,258],[531,244],[555,237],[572,250],[568,268],[585,299],[614,331],[641,367],[670,402]],'far'),
 P('hind-far-lower','legHindFarFoot',[[424,411],[396,404],[348,398],[302,388],[257,365],[215,345],[195,341],[190,325],[201,309],[224,305],[232,325],[261,337],[305,349],[352,375],[407,385],[438,392]],'far'),
 P('front-near-lower','legFrontNearFoot',[[790,760],[816,767],[867,803],[911,831],[951,866],[990,899],[1008,899],[1018,913],[1006,934],[990,936],[984,919],[958,894],[920,872],[875,840],[839,810],[797,785]]),
 P('middle-near-lower','legMidNearFoot',[[638,781],[664,790],[656,820],[632,855],[603,901],[573,946],[563,970],[550,988],[525,985],[512,972],[527,960],[541,962],[552,935],[580,892],[609,850],[637,813]]),
 P('hind-near-lower','legHindNearFoot',[[413,788],[435,801],[417,815],[377,830],[340,850],[295,872],[252,896],[222,919],[203,927],[187,913],[185,895],[199,877],[215,880],[218,897],[249,875],[286,850],[336,824],[380,807]]),
 P('front-far-upper','legFrontFarKnee',[[747,500],[759,476],[778,446],[793,433],[810,437],[817,451],[799,479],[783,503]],'far'),
 P('middle-far-upper','legMidFarKnee',[[638,529],[632,490],[634,447],[639,409],[650,394],[666,398],[679,425],[682,464],[674,500],[660,530]],'far'),
 P('hind-far-upper','legHindFarKnee',[[493,481],[466,469],[444,448],[426,426],[412,405],[417,390],[431,387],[453,402],[477,423],[496,455]],'far'),
 P('front-near-upper','legFrontNearKnee',[[751,699],[778,699],[792,722],[811,750],[817,772],[803,786],[787,777],[767,749]]),
 P('middle-near-upper','legMidNearKnee',[[639,691],[664,691],[676,727],[672,764],[664,795],[653,806],[637,799],[626,777],[632,728]]),
 P('hind-near-upper','legHindNearKnee',[[464,740],[499,739],[476,770],[451,791],[429,813],[411,813],[400,799],[407,785],[439,756]]),
 P('antenna-far','antennaFar',[[898,553],[910,525],[935,495],[962,471],[987,449],[1014,431],[1035,421],[1056,411],[1083,400],[1109,399],[1136,398],[1143,408],[1123,416],[1091,415],[1062,423],[1037,436],[1017,447],[993,465],[970,487],[944,514],[920,551]],'far'),
 P('antenna-near','antennaNear',[[901,666],[921,661],[948,688],[972,710],[1000,735],[1027,756],[1058,774],[1086,786],[1120,794],[1146,798],[1150,807],[1133,811],[1106,804],[1079,795],[1050,783],[1019,767],[990,745],[962,720],[934,694]]),
 P('mandible','mandible',[[920,567],[947,565],[977,570],[1004,586],[1012,607],[992,599],[970,584],[949,593],[962,613],[950,634],[972,647],[993,642],[1013,632],[1009,653],[990,669],[960,676],[934,665],[915,644],[913,604]]),
 P('head','head',[[792,548],[816,535],[836,530],[849,521],[870,523],[895,539],[916,550],[933,565],[938,596],[935,626],[930,651],[909,675],[885,687],[864,686],[842,678],[823,660],[800,647]]),
 P('elytral-suture','abdomen',[[201,598],[251,593],[319,592],[402,591],[494,590],[571,592],[629,593],[646,601],[646,614],[577,611],[500,612],[410,612],[321,612],[248,616],[204,619]]),
 P('elytral-posterior-rim','abdomen',[[197,583],[217,582],[214,604],[216,627],[230,648],[219,653],[205,637],[196,613]]),
 P('far-elytron','wingFar',[[204,582],[226,550],[261,522],[303,497],[352,479],[413,467],[471,462],[532,467],[588,476],[626,492],[644,518],[648,558],[640,588],[614,600],[545,600],[475,599],[390,601],[310,601],[244,608],[204,609]],'far'),
 P('near-elytron','wingNear',[[207,614],[263,612],[332,613],[412,613],[493,614],[562,613],[624,610],[645,622],[650,658],[637,694],[616,720],[576,738],[522,750],[460,756],[397,749],[339,738],[291,720],[250,696],[221,666],[206,636]]),
 P('thorax','thorax',[[654,494],[687,490],[726,494],[770,493],[801,505],[813,533],[804,562],[800,608],[801,651],[813,688],[806,704],[781,715],[734,711],[688,709],[654,701],[657,650],[655,594]]),
 P('body','root',[[0,0],[1,0],[0,1]])],
 note:'Direct dorsal source shows six distinct complete leg paths and two antennae. Near/far denote lower/upper image flanks, not a fabricated side-view. Leg controls mark visible knees/feet; thorax/root/abdomen are internal control frames. Elytral suture and exposed perimeter belong to the rigid body control, while two continuous hardened forewing covers have separate owners; this does not claim unseen soft abdomen or hindwing anatomy. Dorsal projection and large contact-height spread remain strict static/native review concerns.'},
{id:'05-grasshopper-framed',name:'Grasshopper',ground:869,
 joints:{root:[636,630],thorax:[760,629],head:[841,632],mandible:[881,634],abdomen:[508,632],legFrontFarKnee:[811,500],legFrontFarFoot:[874,430],legMidFarKnee:[674,480],legMidFarFoot:[603,385],legHindFarKnee:[468,458],legHindFarFoot:[377,392],legFrontNearKnee:[816,750],legFrontNearFoot:[887,823],legMidNearKnee:[679,772],legMidNearFoot:[609,861],legHindNearKnee:[468,788],legHindNearFoot:[359,858],antennaFar:[989,532],antennaNear:[990,726],wingFar:[534,596],wingNear:[535,665]},
 parts:[
 P('front-far-lower','legFrontFarFoot',[[802,501],[807,484],[828,465],[845,447],[863,421],[875,420],[884,430],[879,442],[867,441],[852,462],[832,483],[817,508]],'far'),
 P('middle-far-lower','legMidFarFoot',[[667,486],[653,469],[635,447],[614,422],[601,400],[594,388],[593,379],[604,373],[614,381],[615,393],[627,415],[647,436],[662,460],[683,477]],'far'),
 P('hind-far-lower','legHindFarFoot',[[461,465],[445,459],[429,449],[410,438],[393,425],[382,413],[368,401],[362,391],[371,383],[382,383],[389,395],[399,411],[419,423],[440,438],[471,449]],'far'),
 P('front-near-lower','legFrontNearFoot',[[807,747],[823,750],[840,770],[858,786],[873,803],[889,814],[897,822],[887,834],[878,834],[876,822],[862,810],[849,796],[832,782],[812,763]]),
 P('middle-near-lower','legMidNearFoot',[[669,764],[686,771],[677,791],[660,812],[643,833],[625,852],[622,870],[610,878],[600,868],[600,856],[611,849],[627,830],[644,807],[661,784]]),
 P('hind-near-lower','legHindNearFoot',[[459,780],[477,787],[465,804],[441,816],[416,832],[391,848],[373,862],[362,875],[351,872],[345,861],[353,850],[362,847],[382,832],[405,820],[430,802],[452,792]]),
 P('front-far-upper','legFrontFarKnee',[[791,578],[792,552],[797,521],[800,500],[813,492],[824,501],[820,524],[813,552],[809,578]],'far'),
 P('middle-far-upper','legMidFarKnee',[[699,567],[689,541],[680,516],[667,490],[664,478],[676,470],[686,480],[699,504],[710,532],[717,556]],'far'),
 P('hind-far-upper','legHindFarKnee',[[599,566],[574,550],[546,532],[522,511],[497,489],[474,475],[457,466],[456,452],[468,442],[485,450],[509,464],[539,479],[566,496],[587,517],[609,548]],'far'),
 P('front-near-upper','legFrontNearKnee',[[791,685],[808,684],[814,711],[823,741],[826,753],[815,760],[804,749],[797,721]]),
 P('middle-near-upper','legMidNearKnee',[[698,698],[717,697],[712,719],[700,747],[688,774],[676,783],[666,774],[673,751],[685,724]]),
 P('hind-near-upper','legHindNearKnee',[[600,691],[623,699],[604,726],[578,744],[550,761],[518,779],[491,792],[472,804],[457,797],[454,785],[469,775],[493,765],[519,747],[545,730],[571,713]]),
 P('antenna-far','antennaFar',[[872,614],[884,605],[905,590],[925,575],[947,559],[970,541],[988,527],[995,528],[993,536],[975,549],[954,567],[931,582],[910,598],[889,615],[877,622]],'far'),
 P('antenna-near','antennaNear',[[873,641],[886,644],[906,660],[928,676],[950,691],[970,710],[993,725],[992,732],[985,731],[968,717],[946,701],[924,684],[904,669],[882,653],[873,650]]),
 P('mouth','mandible',[[871,618],[882,619],[891,627],[895,634],[889,642],[881,647],[872,644],[875,636]]),
 P('head','head',[[809,589],[825,581],[838,576],[852,578],[862,590],[872,608],[878,622],[878,639],[872,655],[862,670],[849,682],[835,684],[819,676],[811,665]]),
 P('abdomen-rim','abdomen',[[268,622],[286,607],[312,599],[331,591],[328,611],[326,630],[329,650],[340,670],[347,688],[326,682],[308,671],[292,663],[277,650],[264,639]]),
 P('abdomen-dorsal-rim','abdomen',[[326,584],[356,572],[389,566],[424,560],[460,556],[500,553],[542,553],[583,555],[620,559],[655,562],[698,571],[710,580],[683,579],[638,575],[597,573],[552,570],[507,569],[461,571],[419,575],[378,580],[345,590]],'far'),
 P('abdomen-ventral-rim','abdomen',[[334,672],[367,681],[404,687],[445,691],[488,695],[532,699],[575,701],[614,702],[650,700],[683,696],[706,689],[710,698],[687,707],[650,711],[612,711],[570,710],[529,708],[487,704],[444,701],[403,697],[366,691],[342,686]]),
 P('far-tegmen','wingFar',[[324,595],[352,583],[394,576],[442,571],[492,569],[546,568],[598,570],[648,572],[695,574],[721,581],[713,594],[686,610],[647,620],[593,626],[535,629],[477,631],[421,631],[372,628],[334,620],[322,610]],'far'),
 P('near-tegmen','wingNear',[[327,635],[365,633],[411,634],[464,635],[517,636],[573,637],[623,641],[669,647],[698,654],[716,666],[721,682],[696,691],[652,700],[602,702],[548,699],[492,696],[443,691],[398,686],[361,677],[335,667],[324,651]]),
 P('thorax','thorax',[[731,574],[755,573],[782,576],[807,583],[817,604],[814,632],[817,663],[808,686],[785,695],[756,695],[731,688],[711,674],[704,650],[704,622],[712,595]]),
 P('body','root',[[0,0],[1,0],[0,1]])],
 note:'Six continuously visible leg paths are separately observed in the dorsal original, including actual powerful hind femora and both distal chains; two antennae and two tegmina are visible. The tiny front mouth edge is observed at the head margin, not an invented ventral jaw. Axial joints are internal control frames. Large dorsal contact-height differences remain unchanged; static/native gates must judge them. Hidden hindwings are not separately painted or claimed absent.'}
];
for(const c of cases){const d=B+'/'+c.id,source=fs.readFileSync(d+'/master.png'),g=JSON.parse(fs.readFileSync(d+'/generation.json'));if(createHash('sha256').update(source).digest('hex')!==g.masterSha256)throw Error('Source changed');
 const a={id:'c202-'+c.id,family:'insect',habitat:{realm:'land',source:'Canonical terrestrial insect; direct dorsal projection retained'},landmarksPx:c.joints,groundLineY:c.ground/1254,materials:{surface:'chitin'},parts:c.parts,remainderPart:'body',coverage:{qualityAccepted:false,scope:'Independent source-observed insect reference candidate',axialFrames:'Body control frames lie inside painted tissue; no unseen skeletal coordinates claimed'}};
 for(const[f,v]of Object.entries({'authoring.json':a,'presence.json':{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},'source-observations.json':{schema:'cf.c202-independent-source-authoring/v1',masterSha256:g.masterSha256,fullSizeInspected:true,observedWalkingChains:6,observedAntennae:2,method:'Manual source-specific landmarks and priority polygons; no donor coordinates or masks read',note:c.note,sourcePixelsChanged:0,qualityAccepted:false,native:false}}))fs.writeFileSync(d+'/'+f,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({id:c.id,parts:c.parts.length,joints:Object.keys(c.joints).length,sourceUnchanged:true}));
}

