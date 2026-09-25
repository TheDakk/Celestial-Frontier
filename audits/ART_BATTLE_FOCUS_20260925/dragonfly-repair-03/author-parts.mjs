/** Manual observation coordinates on coordinate-review.png; no inferred anatomy. */
import fs from 'node:fs';const d=import.meta.dirname;
const landmarksPx={root:[878,741],thorax:[876,739],head:[999,728],mandible:[1040,777],abdomen:[710,761],legFrontFarKnee:[1002,819],legFrontFarFoot:[1051,875],legFrontNearKnee:[1002,880],legFrontNearFoot:[1040,938],legMidFarKnee:[914,850],legMidFarFoot:[963,935],legMidNearKnee:[840,859],legMidNearFoot:[833,1008],legHindFarKnee:[792,839],legHindFarFoot:[748,931],legHindNearKnee:[754,835],legHindNearFoot:[654,965],antennaFar:[1091,681],antennaNear:[1088,714],wingFar:[1037,447],wingNear:[462,524]};
const parts=[],id=j=>j.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),part=(joint,polygonPx,layer='near')=>parts.push({id:id(joint),joint,layer,polygonPx});
// Thin antennae are separate from the head; no limb comes from a background pixel.
part('antennaFar',[[1046,704],[1099,671],[1104,688],[1059,716]],'far');part('antennaNear',[[1057,706],[1101,707],[1103,725],[1064,725]],'near');
part('mandible',[[1015,772],[1073,754],[1083,790],[1020,806]]);
// Lower leg owners first, exact visible tarsi included in generous alpha-clipped strips.
part('legFrontFarFoot',[[996,810],[1014,819],[1069,871],[1066,893],[1041,888],[1025,861],[1007,839]],'far');
part('legFrontNearFoot',[[993,870],[1014,877],[1056,927],[1056,955],[1027,954],[1017,923],[1000,899]]);
part('legMidFarFoot',[[902,843],[922,842],[949,891],[978,927],[976,951],[951,949],[936,917],[915,883]],'far');
part('legMidNearFoot',[[829,850],[851,851],[869,936],[850,982],[847,1029],[821,1029],[820,1004],[844,941]]);
part('legHindFarFoot',[[780,832],[805,834],[793,906],[768,929],[761,954],[738,950],[735,929],[767,899]],'far');
part('legHindNearFoot',[[743,827],[766,835],[710,923],[670,966],[671,989],[644,987],[640,961],[684,919]]);
part('legFrontFarKnee',[[931,786],[950,786],[1015,811],[1013,830],[986,829],[950,814]],'far');
part('legFrontNearKnee',[[918,787],[940,787],[956,836],[1014,869],[1010,890],[990,889],[935,856]]);
part('legMidFarKnee',[[906,790],[927,790],[926,850],[902,856]],'far');
part('legMidNearKnee',[[877,788],[902,804],[851,866],[826,861]]);
part('legHindFarKnee',[[842,791],[865,808],[802,849],[780,848]],'far');
part('legHindNearKnee',[[831,789],[855,810],[764,847],[742,845]]);
part('wingFar',[[808,642],[797,602],[836,497],[1078,266],[1176,256],[1177,358],[999,544],[1127,444],[1205,445],[1209,505],[1140,581],[922,670],[858,670]],'far');
part('wingNear',[[794,675],[673,538],[360,290],[191,267],[190,344],[337,505],[544,618],[224,540],[97,535],[91,588],[353,747],[628,749],[776,710]],'near');
part('head',[[956,666],[1030,660],[1076,704],[1074,774],[1021,798],[947,781],[942,729]]);
part('abdomen',[[762,698],[769,775],[719,794],[55,878],[49,817],[711,737]]);
part('root',[[870,733],[885,733],[885,748],[870,748]]);
part('thorax',[[765,651],[970,651],[972,803],[766,805]]);
const a={id:'dragonfly',family:'insect',landmarksPx,groundLineY:1012/1254,materials:{surface:'chitinous shell and transparent net-veined wings'},remainderPart:'thorax',parts,coverage:{scope:'One manually observed Dragonfly master, six explicit leg chains and four visible wings paired under the existing near/far wing owners; no hidden or folded anatomy.',notes:'No generated-family coverage is claimed before integration. Fine leg/antenna source pixels are retained.'}};
fs.writeFileSync(d+'/authoring.json',JSON.stringify(a,null,2)+'\n');fs.writeFileSync(d+'/presence.json',JSON.stringify({schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]},null,2)+'\n');console.log({parts:parts.length,landmarks:Object.keys(landmarksPx).length});
