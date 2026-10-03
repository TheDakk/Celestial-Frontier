import{writeObservedPacket}from'./write-observed-packet.mjs';
// Coordinates are manually observed on this exact original, not another fit.
const base='audits/C173_SPECIALIZED_REFERENCES_20261002',writer=base+'/author-brittle-star.mjs';
const points={root:[608,637],centre:[621,620],bell:[638,557],
 arm0Seg0:[675,499],arm0Seg1:[603,337],arm0Seg2:[782,220],
 arm1Seg0:[777,648],arm1Seg1:[979,547],arm1Seg2:[1143,730],
 arm2Seg0:[670,765],arm2Seg1:[863,834],arm2Seg2:[870,1048],
 arm3Seg0:[478,749],arm3Seg1:[456,902],arm3Seg2:[279,992],
 arm4Seg0:[431,523],arm4Seg1:[241,568],arm4Seg2:[218,400]};
const region=(joint,polygonPx)=>({id:joint,joint,layer:'near',polygonPx});
const parts=[
 region('root',[[604,633],[612,633],[612,641],[604,641]]),
 region('arm0Seg2',[[570,283],[578,247],[625,204],[688,184],[750,188],[800,208],[800,235],[733,229],[683,244],[643,275],[626,295]]),
 region('arm0Seg1',[[577,278],[628,278],[638,320],[625,354],[642,391],[679,424],[687,452],[649,468],[608,426],[581,389],[568,350],[570,310]]),
 region('arm0Seg0',[[621,441],[659,418],[699,457],[718,491],[715,528],[691,570],[669,592],[641,579],[648,548],[659,513],[651,477]]),
 region('arm1Seg2',[[1025,521],[1072,540],[1113,576],[1144,620],[1161,680],[1157,741],[1130,746],[1123,689],[1110,640],[1084,605],[1052,585],[1015,574]]),
 region('arm1Seg1',[[839,591],[891,553],[946,527],[1000,519],[1037,526],[1048,567],[1000,574],[964,572],[924,589],[876,622],[858,653],[826,628]]),
 region('arm1Seg0',[[665,604],[731,617],[794,617],[848,588],[878,628],[828,674],[764,687],[708,678],[671,663]]),
 region('arm2Seg2',[[889,888],[928,890],[947,940],[940,986],[911,1029],[875,1063],[854,1057],[879,1021],[901,980],[905,941]]),
 region('arm2Seg1',[[718,775],[782,777],[834,786],[881,813],[917,859],[932,899],[908,928],[884,910],[863,875],[826,850],[780,842],[738,838],[712,824]]),
 region('arm2Seg0',[[601,671],[653,674],[660,714],[677,752],[716,777],[754,781],[751,835],[704,829],[663,806],[637,776],[619,738],[611,705]]),
 region('arm3Seg2',[[420,927],[457,953],[422,980],[368,1002],[310,1011],[271,1003],[268,981],[308,978],[355,965],[398,948]]),
 region('arm3Seg1',[[444,783],[498,788],[495,836],[487,883],[465,932],[445,957],[413,934],[432,895],[441,850]]),
 region('arm3Seg0',[[553,631],[583,664],[555,693],[518,727],[503,772],[496,812],[441,813],[441,765],[465,713],[505,675]]),
 region('arm4Seg2',[[227,384],[235,408],[201,432],[181,466],[180,491],[193,514],[165,535],[144,501],[146,456],[170,420],[200,397]]),
 region('arm4Seg1',[[164,506],[194,521],[225,541],[258,549],[309,538],[360,519],[387,558],[329,583],[281,593],[239,593],[204,582],[179,564],[155,539]]),
 region('arm4Seg0',[[356,521],[397,503],[446,496],[490,509],[533,529],[575,553],[596,574],[572,603],[535,583],[495,561],[455,548],[418,547],[373,568]]),
 region('bell',[[622,551],[645,552],[657,565],[650,583],[628,589],[613,579],[612,565]]),
 region('centre',[[0,0],[1254,0],[1254,1254],[0,1254]])
];
const limitations=[
 'Five complete painted arms are explicitly declared. The default six-arm inventory is not used; zero walking legs does not mean zero radial arms.',
 'The centre landmark is the observed central disc. Legacy template name bell denotes an observed upper disc-rim control, not a biological jellyfish bell or invented organ.',
 'Three controls per arm represent continuous source curves, not the many biological arm ossicles. Visible marginal spines stay owned by the enclosing arm region.',
 'The naturally small disc and long curved arms may exceed the unchanged arm/bell ratio guard. The disc is not enlarged, its centre is not displaced and no limit is changed to force intake.',
 'Only dorsal paint is observed; no mouth, eyes, underside, tube feet or hidden structures are invented.',
 'groundLineY is the bottom painted envelope, not a claim that the flat dorsal view shows five coplanar planted tips. Static and native support behavior remain unmeasured at authoring.'
];
console.log(writeObservedPacket({id:'02-brittle-star',source:'audits/C196_INVERTEBRATE_ORIGINALS_20261002/02-brittle-star',masterSha256:'9dac116f20058c3fd4135e6ebfc14d213d419104e8af801c8e65ba3443cc7090',writer,
 presence:{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{arms:5}},
 author:{id:'c173-specialized-brittle-star',family:'radial',landmarksPx:points,groundLineY:1055/1254,materials:{surface:'plate'},remainderPart:'centre',parts,coverage:{scope:'Independent five-armed dorsal Brittle Star reference candidate',limitations,qualityAccepted:false,nativeAcceptance:false}},
 observations:{fullSizeInspected:true,visibleAnatomy:['central disc','five uninterrupted noncrossing arms','all five terminal tips','marginal arm spines'],biologicalArms:5,walkingLegs:0,legacyBellControlMeaning:'visible central-disc rim only',limitations}}));
