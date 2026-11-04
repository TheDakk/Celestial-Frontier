import{writeObservedPacket}from'./write-observed-packet.mjs';
const base='audits/C186_SPECIALIZED_REFERENCES_20261002',writer=base+'/author-brittle-star.mjs';
const points={root:[622,650],centre:[634,630],bell:[628,548],arm0Seg0:[614,478],arm0Seg1:[669,343],arm0Seg2:[637,200],arm1Seg0:[799,567],arm1Seg1:[959,593],arm1Seg2:[1036,516],arm2Seg0:[769,786],arm2Seg1:[790,930],arm2Seg2:[885,981],arm3Seg0:[522,808],arm3Seg1:[367,895],arm3Seg2:[383,987],arm4Seg0:[432,595],arm4Seg1:[330,479],arm4Seg2:[217,508]};
const r=(joint,polygonPx)=>({id:joint,joint,layer:'near',polygonPx});
const parts=[r('root',[[618,646],[626,646],[626,654],[618,654]]),
 r('arm0Seg2',[[613,178],[671,206],[710,245],[726,291],[710,326],[666,323],[661,288],[648,249]]),
 r('arm0Seg1',[[662,306],[718,308],[718,350],[685,389],[647,439],[582,421],[591,388],[626,350]]),
 r('arm0Seg0',[[581,406],[652,420],[658,472],[675,528],[663,556],[603,566],[581,526],[565,477],[563,439]]),
 r('arm1Seg2',[[945,566],[985,568],[1013,544],[1036,497],[1053,501],[1053,545],[1036,581],[1006,612],[963,623],[941,610]]),
 r('arm1Seg1',[[826,522],[885,526],[934,548],[972,566],[970,620],[919,621],[874,594],[826,594]]),
 r('arm1Seg0',[[714,563],[757,544],[803,521],[842,522],[850,591],[808,608],[762,625],[719,633]]),
 r('arm2Seg2',[[757,906],[817,915],[814,953],[839,966],[886,968],[901,983],[879,996],[833,996],[791,982],[765,958]]),
 r('arm2Seg1',[[736,777],[783,764],[816,799],[828,839],[815,884],[820,924],[765,932],[760,889],[768,853],[756,827]]),
 r('arm2Seg0',[[675,692],[716,680],[755,716],[783,748],[802,785],[758,819],[723,787],[684,759],[657,724]]),
 r('arm3Seg2',[[344,884],[391,891],[380,922],[376,956],[399,989],[386,1005],[358,979],[345,944],[334,916]]),
 r('arm3Seg1',[[504,796],[548,838],[518,861],[472,879],[431,892],[387,915],[350,891],[369,864],[405,847],[451,830]]),
 r('arm3Seg0',[[554,678],[607,708],[579,749],[569,790],[545,835],[505,851],[480,817],[509,776],[524,727]]),
 r('arm4Seg2',[[206,492],[226,463],[264,444],[299,445],[321,455],[313,494],[282,483],[251,484],[223,521],[207,521]]),
 r('arm4Seg1',[[301,451],[338,460],[367,491],[398,535],[387,573],[347,558],[325,523],[302,492]]),
 r('arm4Seg0',[[373,528],[408,552],[451,569],[492,573],[538,581],[543,631],[502,640],[460,630],[414,623],[385,600],[358,572]]),
 r('bell',[[613,541],[638,541],[650,551],[643,567],[619,570],[606,555]]),r('centre',[[0,0],[1254,0],[1254,1254],[0,1254]])];
const limitations=['The five arms and central disc were independently observed on this new painting. No geometry or ownership labels were transferred from the refused long-armed source.','Legacy bell names the upper visible disc rim, not an invented organ. Centre-to-rim is measured on paint; neither disc size nor ratio limit is altered.','Three controls per real arm approximate its connected ossicle chain. Marginal spines stay with the enclosing arm; no hidden underside or tube feet are invented.','The naturally short-armed representative is bound to the source packet primary taxonomy citation. Decorative disc markings and material finish still need identity/style review.','Dorsal view does not establish coplanar support tips. groundLineY is the observed bottom envelope only; mechanical results and native support remain separate.'];
console.log(writeObservedPacket({id:'07-brittle-star',source:'audits/C186_CREATURE_SUPPLY_20261002/05-brittle-star',masterSha256:'c245d4c0050bfb4c649ebfd33e583b88e0aea3b6a6f49c680fbef04aaba70722',writer,presence:{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{arms:5}},author:{id:'c186-specialized-brittle-star',family:'radial',landmarksPx:points,groundLineY:989/1254,materials:{surface:'plated'},remainderPart:'centre',parts,coverage:{scope:'Independent short-armed five-arm Brittle Star original-source authoring',limitations,qualityAccepted:false,nativeAcceptance:false}},observations:{fullSizeInspected:true,visibleAnatomy:['bounded central disc','five complete arm roots','five connected noncrossing arm chains','five terminal tips'],biologicalArms:5,walkingLegs:0,limitations}}));
