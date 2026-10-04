import fs from 'node:fs';const d=import.meta.dirname,parts=[];const part=(id,joint,polygonPx,layer='near')=>parts.push({id,joint,polygonPx,layer});
const landmarksPx={root:[930,637],head:[1050,632],jaw:[1088,674],spine0:[854,633],spine1:[730,635],spine2:[600,644],spine3:[472,644],spine4:[356,638],spine5:[240,630],caudal:[127,626],dorsal:[343,558],pectoralNear:[873,751],pectoralFar:[930,748]};
part('near-pectoral','pectoralNear',[[954,674],[941,702],[879,764],[842,795],[821,800],[821,741],[835,697],[922,676]]);
part('far-pectoral','pectoralFar',[[957,692],[972,704],[962,747],[938,777],[908,786],[906,752],[926,723]],'far');
part('dorsal','dorsal',[[286,607],[325,503],[343,506],[426,587],[430,612]]);
part('jaw','jaw',[[1082,670],[1129,666],[1248,655],[1253,740],[1092,738],[1076,687]]);
part('head','head',[[958,480],[1253,480],[1253,770],[961,770]]);
part('caudal','caudal',[[0,390],[228,390],[228,635],[199,656],[192,676],[0,770]]);
part('root','root',[[923,628],[939,628],[939,644],[923,644]]);
// Observed axial skin regions own the small posterior fins, without inventing
// extra fin joints absent from this family contract.
for(const [id,joint,x0,x1]of [['tail-peduncle','spine5',190,299],['rear-body','spine4',299,414],['pelvic-body','spine3',414,535],['mid-body','spine2',535,665],['front-body','spine1',665,790]])part(id,joint,[[x0,480],[x1,480],[x1,830],[x0,830]]);
part('body','spine0',[[790,480],[966,480],[966,816],[790,816]]);
const a={id:'sturgeon',family:'fish',landmarksPx,groundLineY:.82,materials:{surface:'plain steel-grey painted sturgeon scales and bony scutes; no pigment markings'},remainderPart:'body',parts,coverage:{scope:'Manual observation of right-facing generation04, all visible fins/barbels retained. Prior left-facing records and bindings remain unchanged.',notes:'Thirteen existing fish joints; small pelvic/anal painted areas follow their observed axial region. No source pixels excluded.'}};fs.writeFileSync(d+'/authoring.json',JSON.stringify(a,null,2)+'\n');console.log({parts:parts.length});
