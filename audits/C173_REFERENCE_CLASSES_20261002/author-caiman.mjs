import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='audits/C173_REFERENCE_CLASSES_20261002',id='01-caiman',packet=base+'/'+id,source='audits/C196_QUADRUPED_ORIGINALS_20261002/01-caiman';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(packet);
for(const file of ['master.png','subject-source.json'])fs.copyFileSync(source+'/'+file,packet+'/'+file,fs.constants.COPYFILE_EXCL);
fs.mkdirSync(packet+'/source-evidence');
for(const file of ['generation.json','request.json','prompt.txt'])if(fs.existsSync(source+'/'+file))fs.copyFileSync(source+'/'+file,packet+'/source-evidence/'+file,fs.constants.COPYFILE_EXCL);
const landmarksPx={root:[717,612],pelvis:[604,610],spine:[717,592],chest:[845,610],neck:[945,581],head:[1047,550],jaw:[1061,582],hindNearRoot:[589,596],hindNearKnee:[591,658],hindNearAnkle:[523,717],hindNearPaw:[552,750],hindFarRoot:[650,666],hindFarKnee:[639,702],hindFarAnkle:[665,721],hindFarPaw:[698,730],foreNearRoot:[850,628],foreNearKnee:[811,674],foreNearAnkle:[829,720],foreNearPaw:[849,750],foreFarRoot:[916,668],foreFarKnee:[945,703],foreFarAnkle:[965,723],foreFarPaw:[995,733],tail0:[555,612],tail1:[430,644],tail2:[287,675],tail3:[102,728]};
const rows=[
 ['root','root',[[712,607],[721,607],[721,616],[712,616]]],
 ['hind-near-paw','hindNearPaw',[[517,730],[550,723],[571,732],[589,737],[598,758],[577,762],[544,765],[526,750]]],
 ['hind-near-ankle','hindNearAnkle',[[502,701],[528,694],[551,713],[556,732],[530,744],[511,735],[498,717]]],
 ['hind-near-knee','hindNearKnee',[[555,641],[599,637],[620,657],[607,681],[577,700],[552,715],[528,708],[506,705],[517,683],[541,667]]],
 ['hind-near-root','hindNearRoot',[[558,574],[587,555],[612,564],[630,590],[635,624],[621,658],[601,677],[561,657],[551,634],[544,601]]],
 ['hind-far-paw','hindFarPaw',[[660,712],[692,715],[718,720],[733,729],[722,739],[702,741],[681,732],[664,730]]],
 ['hind-far-ankle','hindFarAnkle',[[629,699],[649,698],[674,712],[681,725],[660,730],[640,722],[626,714]]],
 ['hind-far-knee','hindFarKnee',[[627,680],[657,680],[654,700],[665,713],[643,720],[626,706]]],
 ['hind-far-root','hindFarRoot',[[626,659],[658,662],[678,670],[665,690],[650,701],[625,692]]],
 ['fore-near-paw','foreNearPaw',[[812,727],[845,731],[867,737],[886,752],[885,763],[863,759],[845,768],[827,760],[809,751],[793,755],[795,741]]],
 ['fore-near-ankle','foreNearAnkle',[[797,700],[823,696],[838,710],[847,735],[832,744],[812,735],[808,720]]],
 ['fore-near-knee','foreNearKnee',[[790,655],[823,642],[845,658],[829,682],[830,706],[816,720],[797,705],[783,678]]],
 ['fore-near-root','foreNearRoot',[[820,601],[850,588],[878,606],[884,635],[864,658],[832,677],[807,672],[797,655],[809,630]]],
 ['fore-far-paw','foreFarPaw',[[956,714],[978,712],[1000,720],[1024,736],[1018,744],[1000,739],[981,746],[962,734],[951,729]]],
 ['fore-far-ankle','foreFarAnkle',[[937,699],[956,701],[972,719],[970,733],[951,726],[940,715]]],
 ['fore-far-knee','foreFarKnee',[[917,674],[939,675],[955,698],[960,714],[944,721],[925,707],[913,692]]],
 ['fore-far-root','foreFarRoot',[[893,653],[920,647],[937,669],[940,685],[921,696],[906,681]]],
 ['jaw','jaw',[[981,574],[1007,573],[1040,578],[1070,583],[1110,579],[1167,565],[1172,579],[1159,592],[1114,600],[1065,606],[1022,604],[993,594]]],
 ['head','head',[[963,534],[995,509],[1025,506],[1057,516],[1073,532],[1109,543],[1150,540],[1169,549],[1174,567],[1154,579],[1107,583],[1064,591],[1021,583],[991,577],[973,554]]],
 ['neck','neck',[[895,549],[923,525],[954,516],[985,518],[1004,540],[989,568],[1004,597],[1031,607],[1000,629],[961,650],[924,660],[902,631],[891,597]]],
 ['tail-tip','tail3',[[73,707],[137,670],[175,650],[211,645],[226,699],[181,710],[138,720],[102,738],[79,747]]],
 ['tail-distal','tail2',[[171,650],[235,612],[315,596],[338,660],[341,686],[283,695],[214,702]]],
 ['tail-middle','tail1',[[311,596],[386,572],[461,558],[484,628],[490,662],[418,677],[337,687]]],
 ['tail-root','tail0',[[458,558],[515,536],[551,526],[573,560],[560,596],[554,650],[489,665]]],
 ['pelvis','pelvis',[[539,528],[600,508],[645,508],[670,548],[660,592],[639,632],[626,660],[580,660],[551,627],[553,588]]],
 ['chest','chest',[[789,551],[830,545],[868,551],[905,556],[921,596],[912,641],[900,670],[866,677],[845,649],[821,613],[792,601]]],
 ['spine','spine',[[0,0],[1254,0],[1254,1254],[0,1254]]]
];
const limits=['Far limb roots are placed at the visible emergence boundary beneath the torso, not at invented hidden proximal segments. Internal skeletal attachment location is not proven by the surface painting.','Four terminal feet are distinct; far toes reach approximately y739/744 and near toes y763/768. These perspective heights are preserved and do not assert four coplanar ground contacts.','Left and right painted margins are approximately 6.3% and 6.4%, below the requested 8% intake framing; no crop or rescale was applied.','Closed snout retains small light tooth-like marks along the seam; exact Caiman closed-mouth species anatomy awaits scoring.','No moving-paint, native performance, or quality acceptance.'];
const author={id:'c173-reference-caiman',family:'quadruped',landmarksPx,groundLineY:768/1254,materials:{surface:'scales'},remainderPart:'spine',parts:rows.map(([id,joint,polygonPx])=>({id,joint,layer:joint.includes('Far')?'far':'near',polygonPx})),coverage:{scope:'Independent source-specific reference candidate for a low sprawling reptile with four distinct visible distal limbs',declarations:'Full-size new C196 painting inspected before hand authoring; existing reference coordinates and labels were not transferred.',limitations:limits,qualityAccepted:false,nativeAcceptance:false}};
write(packet+'/authoring.json',author);
write(packet+'/presence.json',{schema:'cf.anatomy-presence/v2',absent:['external-ears'],hidden:[],folded:[]});
write(packet+'/observation.json',{schema:'cf.c173-reference-observation/v1',masterSha256:sha(packet+'/master.png'),source,sourceMasterSha256:sha(source+'/master.png'),imageSize:[1254,1254],fullSizeInspected:true,sourceCoordinatesTransferred:false,sourceLabelsTransferred:false,landmarksPx,sourceVisibleTerminalFeet:['hindNearPaw','hindFarPaw','foreNearPaw','foreFarPaw'],physicalCoplanarGroundClaim:false,limitations:limits,qualityAccepted:false});
write(packet+'/authoring-receipt.json',{schema:'cf.c173-source-authoring/v1',writerSha256:sha(import.meta.filename),masterSha256:sha(packet+'/master.png'),authoringSha256:sha(packet+'/authoring.json'),subjectSourceSha256:sha(packet+'/subject-source.json'),presenceSha256:sha(packet+'/presence.json'),sourceBytesUnchanged:sha(packet+'/master.png')===sha(source+'/master.png'),nativeRuns:0,qualityAccepted:false});
console.log(JSON.stringify({packet,parts:rows.length,sourceUnchanged:true}));
