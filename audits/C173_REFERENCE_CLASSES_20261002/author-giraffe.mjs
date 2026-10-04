import fs from'node:fs';import{createHash}from'node:crypto';
const base='audits/C173_REFERENCE_CLASSES_20261002',packet=base+'/02-giraffe',source='audits/C196_QUADRUPED_ORIGINALS_20261002/14-giraffe',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(packet);for(const f of['master.png','subject-source.json'])fs.copyFileSync(source+'/'+f,packet+'/'+f,fs.constants.COPYFILE_EXCL);fs.mkdirSync(packet+'/source-evidence');for(const f of['generation.json','request.json','prompt.txt'])if(fs.existsSync(source+'/'+f))fs.copyFileSync(source+'/'+f,packet+'/source-evidence/'+f,fs.constants.COPYFILE_EXCL);
const landmarksPx={root:[592,679],pelvis:[520,686],spine:[592,658],chest:[686,657],neck:[807,316],head:[847,281],jaw:[878,315],hindNearRoot:[538,712],hindNearKnee:[520,853],hindNearAnkle:[560,979],hindNearPaw:[578,1008],hindFarRoot:[492,749],hindFarKnee:[457,851],hindFarAnkle:[423,975],hindFarPaw:[434,1008],foreNearRoot:[689,706],foreNearKnee:[731,864],foreNearAnkle:[766,978],foreNearPaw:[784,1006],foreFarRoot:[667,746],foreFarKnee:[657,868],foreFarAnkle:[634,972],foreFarPaw:[645,1001],tail0:[485,675],tail1:[456,735],tail2:[430,778],tail3:[405,851],earFarRoot:[859,262],earFarTip:[876,240],earNearRoot:[811,266],earNearTip:[784,240]};
const rows=[
 ['root','root',[[588,675],[597,675],[597,684],[588,684]]],
 ['hind-near-hoof','hindNearPaw',[[559,996],[582,992],[603,1023],[554,1025]]],
 ['hind-far-hoof','hindFarPaw',[[414,996],[437,991],[456,1020],[410,1020]]],
 ['fore-near-hoof','foreNearPaw',[[762,995],[783,991],[807,1020],[759,1021]]],
 ['fore-far-hoof','foreFarPaw',[[624,992],[649,987],[667,1016],[623,1018]]],
 ['hind-near-ankle','hindNearAnkle',[[546,951],[566,951],[571,978],[584,997],[560,1006],[551,985]]],
 ['hind-far-ankle','hindFarAnkle',[[419,944],[437,948],[432,977],[437,993],[413,1004],[410,981]]],
 ['fore-near-ankle','foreNearAnkle',[[750,950],[771,948],[777,974],[785,996],[764,1006],[755,980]]],
 ['fore-far-ankle','foreFarAnkle',[[626,946],[645,949],[641,974],[650,992],[625,1003],[619,976]]],
 ['hind-near-knee','hindNearKnee',[[500,828],[534,825],[537,864],[543,902],[566,958],[548,978],[529,929],[514,888],[498,857]]],
 ['hind-far-knee','hindFarKnee',[[446,826],[477,821],[477,851],[459,881],[442,920],[434,958],[417,959],[429,906],[440,873],[441,849]]],
 ['fore-near-knee','foreNearKnee',[[710,832],[739,830],[748,871],[751,901],[772,958],[751,969],[733,914],[720,882]]],
 ['fore-far-knee','foreFarKnee',[[645,830],[673,832],[670,872],[654,916],[644,957],[624,956],[635,904]]],
 ['hind-near-root','hindNearRoot',[[516,639],[541,637],[564,663],[571,708],[565,759],[548,805],[536,850],[504,869],[496,850],[507,813],[511,777],[492,745],[480,701],[493,664]]],
 ['hind-far-root','hindFarRoot',[[473,724],[500,726],[516,756],[508,795],[489,822],[473,853],[446,859],[442,839],[460,815],[476,785],[479,756]]],
 ['fore-near-root','foreNearRoot',[[648,623],[683,617],[712,635],[738,656],[745,678],[728,714],[719,739],[729,791],[741,841],[715,861],[701,829],[689,784],[670,744],[652,713],[643,678]]],
 ['fore-far-root','foreFarRoot',[[655,714],[680,716],[683,749],[678,793],[673,844],[648,856],[643,841],[650,797],[654,756]]],
 ['ear-near-tip','earNearTip',[[775,232],[799,236],[815,253],[817,263],[805,266],[791,255]]],
 ['ear-near-root','earNearRoot',[[798,252],[816,253],[826,268],[821,279],[806,273]]],
 ['ear-far-tip','earFarTip',[[862,241],[885,232],[881,251],[869,262],[856,257]]],
 ['ear-far-root','earFarRoot',[[852,251],[867,253],[872,266],[863,276],[854,268]]],
 ['jaw','jaw',[[839,295],[864,298],[887,308],[907,316],[905,334],[887,335],[876,325],[854,318],[837,311]]],
 ['head','head',[[804,265],[805,244],[807,231],[807,218],[820,210],[831,225],[832,239],[838,244],[833,225],[830,218],[841,209],[851,220],[852,240],[862,251],[871,272],[888,293],[899,306],[906,321],[891,325],[868,313],[844,310],[824,303],[812,288]]],
 ['tail-tuft','tail3',[[409,777],[439,767],[443,796],[435,830],[425,871],[417,889],[396,915],[392,891],[384,862],[385,835],[393,801]]],
 ['tail-lower','tail2',[[441,742],[456,744],[446,776],[437,794],[422,790],[430,769]]],
 ['tail-middle','tail1',[[466,699],[480,707],[467,738],[450,766],[439,759],[449,734]]],
 ['tail-root','tail0',[[481,663],[501,665],[496,689],[482,718],[466,722],[464,708],[472,682]]],
 ['neck','neck',[[637,543],[674,515],[709,478],[733,428],[754,377],[775,318],[792,281],[810,269],[824,279],[834,304],[820,326],[809,368],[799,414],[785,464],[780,500],[762,544],[744,579],[728,615],[725,638],[702,653],[678,643],[651,622],[622,599],[612,576]]],
 ['chest','chest',[[620,581],[651,597],[681,622],[697,649],[675,692],[660,726],[645,745],[617,747],[594,733],[601,700],[618,669],[618,630]]],
 ['pelvis','pelvis',[[482,655],[501,631],[542,617],[570,624],[584,647],[570,675],[555,697],[526,713],[500,711],[483,692]]],
 ['spine','spine',[[0,0],[1254,0],[1254,1254],[0,1254]]]
];
const limitations=['Slight three-quarter head and chest view; far foreleg proximal attachment is occluded, so its root is the visible emergence, not an invented shoulder centre.','Both actual ears and both ossicones are visible. Ossicones remain head paint; they are not substituted for ears or given invented independent bones.','Four hooves are distinct at their observed perspective heights; the authoring does not warp them into a common plane.','Long neck has a coarse shared quadruped neck owner; suitability for large-amplitude choreography and bending needs finished moving-paint/native scoring.','No native or quality acceptance.'];
write(packet+'/authoring.json',{id:'c173-reference-giraffe',family:'quadruped',landmarksPx,groundLineY:1021/1254,materials:{surface:'fur'},remainderPart:'spine',parts:rows.map(([id,joint,polygonPx])=>({id,joint,layer:joint.includes('Far')?'far':'near',polygonPx})),coverage:{scope:'Independently observed long-necked hoofed quadruped reference candidate',sourceLabelsReused:false,sourceLandmarksReused:false,limitations,qualityAccepted:false,nativeAcceptance:false}});
write(packet+'/presence.json',{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]});
write(packet+'/observation.json',{schema:'cf.c173-reference-observation/v1',source,masterSha256:sha(packet+'/master.png'),sourceBytesUnchanged:sha(packet+'/master.png')===sha(source+'/master.png'),imageSize:[1254,1254],fullSizeInspected:true,landmarksPx,sourceCoordinatesTransferred:false,sourceLabelsTransferred:false,physicalCoplanarGroundClaim:false,limitations,qualityAccepted:false});
write(packet+'/authoring-receipt.json',{schema:'cf.c173-source-authoring/v1',writerSha256:sha(import.meta.filename),masterSha256:sha(packet+'/master.png'),authoringSha256:sha(packet+'/authoring.json'),presenceSha256:sha(packet+'/presence.json'),sourceBytesUnchanged:true,nativeRuns:0});console.log(JSON.stringify({packet,parts:rows.length}));
