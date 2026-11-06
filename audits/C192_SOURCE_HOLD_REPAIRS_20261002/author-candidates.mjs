/** Audit-only source observations. Changed points are observed on these paintings;
 * unedited authoring remains inherited automatic transfer, not independent reference evidence. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='audits/C192_SOURCE_HOLD_REPAIRS_20261002',sibling=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac');
const sha=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p));
const cases=[
 {id:'01-wild-ass',prior:'auto-g2c107/24-wild-ass/fallback-1',sourceHash:'d03e96b63e1a5ad90a4032be5f0b09fd00c4c924b8a844493397348c0efd7916',
  observations:['The forward-slanting front limb is continuous painted tissue. Its carpal bend is at approximately x786/y754, below the transferred knee x760/y700.5. The distal fetlock is x825/y841 and the hoof is x850/y869.',
   'The former root polygon reaches below the knee-owner cut and leaves a separate root-owned triangular piece near x746/y676. Root, knee, ankle and hoof envelopes are redrawn on the actual continuous limb; no pixel is removed.',
   'Only the visible front chain is corrected. The layer/joint names are inherited and do not make unobserved anatomy claims. Other geometry remains automatic transfer.'],
  joints:{foreFarRoot:[749,641],foreFarKnee:[786,754],foreFarAnkle:[825,839],foreFarPaw:[850,868]},
  parts:{
   'fore-far-paw':[[818,840],[837,845],[851,852],[866,863],[875,880],[835,884],[820,870]],
   'fore-far-ankle':[[774,748],[798,742],[808,775],[817,804],[832,829],[839,851],[822,861],[808,840],[799,813],[788,790]],
   'fore-far-knee':[[711,647],[741,635],[764,650],[776,680],[788,716],[802,748],[792,768],[773,763],[759,737],[744,710],[728,690]],
   'fore-far-root':[[719,580],[754,571],[786,580],[791,617],[775,648],[757,670],[738,672],[722,651],[708,624]]}},
 {id:'02-serval-tail-neck',prior:'auto-g2c233/16-serval',sourceHash:'4f0a211523567bc60438b5fa24d1ed2bb2df4484c4bff52bc616723dabf39735',
  observations:['The actual tail is a short left-pointing brush at x267–362/y529–591. Transferred tail1/2/3 points and masks ran down the hind leg to y823; they do not describe this source.',
   'Four tail points and priority masks now follow the visible short brush only. Hind-leg paint formerly claimed by tail is released to unchanged limb owners or the declared body remainder; it is neither erased nor re-painted.',
   'The source neck silhouette behind the ears is traced separately, so its contiguous nape cannot be assigned to the ear merely by the longest-border D28 rule. Existing ear/head priority remains.',
   'Unchanged automatic limb masks may still need independently observed corrections; static and full-size posed review remain required.'],
  joints:{tail0:[353,550],tail1:[329,555],tail2:[305,561],tail3:[278,561]},
  parts:{
   tail3:[[291,532],[294,588],[277,590],[263,578],[264,549],[279,535]],
   tail2:[[311,531],[313,590],[289,590],[281,584],[284,537]],
   tail1:[[336,529],[339,585],[309,592],[302,581],[304,536]],
   tail0:[[361,523],[369,558],[359,579],[334,587],[326,574],[325,536]]},
  priority:['tail3','tail2','tail1','tail0'],
   extra:[{id:'neck-observed-nape',joint:'neck',layer:'near',polygonPx:[[715,474],[767,455],[796,435],[815,407],[830,382],[845,369],[861,376],[872,393],[859,424],[880,462],[874,494],[853,523],[822,540],[783,530],[749,507]]}]},
 {id:'03-horse-front-chain',prior:'auto-g2c114/13-horse/fallback-1',sourceHash:'1f28692f8699ecdc7a87010bdccde8223629d9715fe15f53f9f6d1f6db719a41',
  observations:['All three exact captured faint folds are localized to fore-far-ankle/fore-far-knee triangles at source x861–900/y841–861. The inherited ankle point y848.7 lies on the lower cannon segment, above the visible fetlock near y886.',
   'The visible forward-slanting front chain bends at the dark carpal joint near x850/y777 and the white fetlock near x884/y886. Root emergence and distal hoof are traced on the same source limb. Four landmarks and four masks change; no pose, solver or contact limit changes.',
   'The source has four complete distal hooves. Other inherited anatomy, including ears and tail, has not become independently authored evidence.'],
  joints:{foreFarRoot:[801,649],foreFarKnee:[850,777],foreFarAnkle:[884,886],foreFarPaw:[914,925]},
  parts:{
   'fore-far-paw':[[878,900],[900,898],[918,908],[936,925],[948,943],[917,946],[892,936],[879,919]],
   'fore-far-ankle':[[836,764],[864,760],[875,795],[884,831],[894,864],[906,891],[908,907],[888,920],[873,905],[864,880],[857,850],[846,815]],
   'fore-far-knee':[[764,646],[790,632],[817,640],[834,674],[847,715],[864,752],[867,781],[845,790],[826,769],[811,744],[796,713],[777,686]],
   'fore-far-root':[[770,577],[808,572],[839,591],[842,620],[832,649],[814,668],[790,671],[769,653],[755,620]]}},
 {id:'04-rhea-legs',prior:'auto-g2c197/rhea',sourceHash:'1e1a1a15c937a0646cba6ad93b89f62bddebdbc036f58840f428700add32a216',
  observations:['Both painted legs and three-toed feet are visible and separate. The right limb bends near x609/y775; the transferred knee x618.3/y845.3 lies on its long lower segment. The transferred far-thigh polygon is a narrow loop that omits the actual upper painted limb.',
   'Both visible leg chains are traced from their feather emergence to their own toes. No additional limb or concealed hip joint is invented. The recorded extra limb-down paint is the omitted actual leg, not evidence of a third leg.',
   'The inherited far-wing interpretation remains unresolved: the painting does not separately expose a complete far wing. Unedited wing and tail masks remain automatic transfer and this packet is not an independent whole-family reference.'],
  joints:{legNearKnee:[526,772],legNearAnkle:[491,938],legNearFoot:[521,963],legFarKnee:[610,775],legFarAnkle:[641,945],legFarFoot:[678,969]},
  parts:{
   'near-foot':[[471,923],[497,927],[509,944],[540,949],[561,955],[568,969],[542,977],[520,980],[492,970],[476,956]],
   'near-shin':[[506,767],[538,773],[528,803],[519,844],[509,888],[502,927],[497,948],[477,949],[472,933],[481,902],[492,855],[503,807]],
   'near-thigh':[[540,679],[595,686],[591,710],[565,744],[548,773],[537,791],[512,794],[504,780],[510,757],[526,726]],
   'far-foot':[[621,933],[647,933],[658,948],[690,953],[718,963],[728,978],[700,987],[674,989],[645,977],[623,960]],
   'far-shin':[[591,769],[625,764],[631,804],[638,847],[646,889],[654,932],[651,953],[629,962],[617,944],[615,918],[607,872],[599,824]],
   'far-thigh':[[591,641],[626,637],[645,659],[643,685],[633,720],[628,750],[627,782],[601,795],[587,782],[586,757],[594,718]]}},
 {id:'05-snow-petrel-wing',prior:'auto-g2c197/snow-petrel',sourceHash:'10a09e9b3436e465c8e32f366031a6ed12d7d310278744e83537456a1d015d37',
  observations:['The visible folded near wing forms a rounded shoulder near x789/y570 and a continuous feather fan tapering left to x364/y631. The transferred root x696.7/y541.3 lies well left of that shoulder and its mask claims the upper back instead.',
   'Near-wing root and flight envelopes follow the actual visible folded feather surface. The shoulder root is set on the visible hinge; the distal point lies within the tapered left-pointing primaries. Pixels and appearance remain exact.',
   'Far-wing visibility remains an inherited unresolved interpretation. This correction does not assert unseen articulation, confer whole-family reference eligibility or demonstrate flight from a folded reference.'],
  joints:{wingNearRoot:[785,568],wingNearTip:[458,624]},
  parts:{
   'near-wing-root':[[691,532],[727,526],[764,531],[794,545],[807,563],[807,588],[794,610],[776,633],[753,652],[727,665],[696,673],[664,674],[637,659],[630,620],[646,579]],
   'near-wing-flight':[[359,624],[386,609],[423,600],[462,586],[500,568],[539,550],[582,534],[624,530],[658,529],[696,532],[667,566],[646,599],[638,630],[644,654],[620,670],[582,673],[541,664],[494,654],[444,648],[398,645],[365,638]]}}
];
for(const c of cases.filter(c=>process.argv.length===2||process.argv.slice(2).includes(c.id))){
 const out=`${base}/${c.id}`,rel=`audits/G1_AUTO_AUTHOR_20260926/${c.prior}/packet`,p=path.join(sibling,rel);
 assert(!fs.existsSync(out),'immutable new packet');const old=json(`${rel}/authoring.json`),author=structuredClone(old),master=fs.readFileSync(path.join(p,'master.png'));assert.equal(sha(master),c.sourceHash);
 Object.assign(author.landmarksPx,c.joints);for(const [id,polygonPx]of Object.entries(c.parts)){const targets=author.parts.filter(p=>p.id===id);assert.equal(targets.length,1);targets[0].polygonPx=polygonPx;}
 if(c.priority){const selected=c.priority.map(id=>author.parts.find(p=>p.id===id));author.parts=[...selected,...author.parts.filter(p=>!c.priority.includes(p.id))];}
 if(c.extra)author.parts.splice(author.parts.findIndex(p=>p.id===author.remainderPart),0,...c.extra);
 author.coverage={...author.coverage,declarations:'C192 bounded source-observed correction; all unedited geometry remains inherited automatic transfer. See correction.json.',visualAcceptance:'none — audit candidate'};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(`${out}/master.png`,master,{flag:'wx'});
 for(const name of ['presence.json','subject-source.json'])fs.copyFileSync(`${rel}/${name}`,`${out}/${name}`,fs.constants.COPYFILE_EXCL);
 fs.writeFileSync(`${out}/original-authoring.json`,JSON.stringify(old,null,2)+'\n',{flag:'wx'});fs.writeFileSync(`${out}/authoring.json`,JSON.stringify(author,null,2)+'\n',{flag:'wx'});
 const receipt={schema:'cf.c192-source-observed-correction/v1',id:c.id,source:`~/Projects/celestial-frontier-anthropic-mac/${rel}/master.png`,sourceSha256:c.sourceHash,priorAuthoring:`${rel}/authoring.json`,priorAuthoringSha256:sha(fs.readFileSync(`${rel}/authoring.json`)),changedJoints:Object.keys(c.joints),changedParts:Object.keys(c.parts),addedParts:c.extra?.map(p=>p.id)??[],priorityChanges:c.priority??[],findings:c.observations,sourcePixelsChanged:0,presenceChanged:false,limitsChanged:false,qualityAccepted:false,independentReferenceEligible:false,native:false};
 fs.writeFileSync(`${out}/correction.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(c.id);
}
