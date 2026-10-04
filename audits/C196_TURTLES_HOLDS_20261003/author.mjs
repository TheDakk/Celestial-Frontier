/** Independently observed turtle plate/skin authoring and one scoped Serval ear contour. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const B='audits/C196_TURTLES_HOLDS_20261003';
const sha=b=>createHash('sha256').update(b).digest('hex');
const J=p=>JSON.parse(fs.readFileSync(p));
function packet(id,source,identity,author,presence,correction){
 const p=`${B}/${id}`;assert(!fs.existsSync(p));fs.mkdirSync(p,{recursive:true});
 const bytes=fs.readFileSync(source);fs.writeFileSync(`${p}/master.png`,bytes,{flag:'wx'});
 fs.copyFileSync(identity,`${p}/subject-source.json`);
 for(const [name,value]of Object.entries({'authoring.json':author,'presence.json':presence,'correction.json':{...correction,source,sourceSha256:sha(bytes),sourceIdentity:identity,sourceIdentitySha256:sha(fs.readFileSync(identity)),sourcePixelsChanged:0,qualityAccepted:false,independentReferenceEligible:false,native:false}}))fs.writeFileSync(`${p}/${name}`,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
}
const part=(id,joint,layer,polygonPx)=>({id,joint,layer,polygonPx});
const landmarksPx={
 root:[607,588],pelvis:[375,645],spine:[586,606],chest:[755,628],neck:[870,600],head:[1016,519],jaw:[1080,536],
 hindNearRoot:[321,673],hindNearKnee:[279,752],hindNearAnkle:[239,839],hindNearPaw:[278,884],
 hindFarRoot:[472,755],hindFarKnee:[451,790],hindFarAnkle:[453,839],hindFarPaw:[485,858],
 foreNearRoot:[788,652],foreNearKnee:[803,753],foreNearAnkle:[765,855],foreNearPaw:[800,893],
 foreFarRoot:[875,688],foreFarKnee:[915,773],foreFarAnkle:[930,838],foreFarPaw:[960,866],
 tail0:[249,663],tail1:[216,681],tail2:[182,694],tail3:[157,704],
};
const scaled=Object.keys(landmarksPx).filter(k=>/^(neck|head|hind|fore|tail)/.test(k));
const parts=[
 part('near-hind-paw','hindNearPaw','near',[[191,850],[241,841],[302,852],[338,872],[339,906],[211,914],[187,883]]),
 part('near-hind-ankle','hindNearAnkle','near',[[204,816],[255,793],[298,817],[305,861],[252,873],[190,858]]),
 part('near-hind-shin','hindNearKnee','near',[[219,756],[256,723],[330,722],[327,762],[283,827],[241,846],[198,830]]),
 part('near-hind-emergence','hindNearRoot','near',[[249,640],[308,640],[363,665],[383,706],[354,754],[305,780],[231,774],[231,727]]),
 part('near-front-paw','foreNearPaw','near',[[714,860],[766,842],[824,850],[865,880],[866,922],[715,922],[701,890]]),
 part('near-front-ankle','foreNearAnkle','near',[[723,812],[775,797],[831,818],[829,866],[775,883],[713,864]]),
 part('near-front-shin','foreNearKnee','near',[[737,738],[758,699],[827,711],[858,751],[847,814],[819,846],[724,829]]),
 part('near-front-emergence','foreNearRoot','near',[[736,657],[766,628],[805,635],[841,661],[866,708],[851,754],[797,786],[745,753],[716,708]]),
 part('far-hind-paw','hindFarPaw','far',[[411,834],[450,822],[506,831],[537,859],[535,884],[416,884],[399,858]]),
 part('far-hind-ankle','hindFarAnkle','far',[[411,806],[458,802],[491,821],[494,847],[454,856],[409,840]]),
 part('far-hind-shin','hindFarKnee','far',[[416,772],[441,753],[495,755],[500,793],[481,824],[414,819],[401,794]]),
 part('far-hind-emergence','hindFarRoot','far',[[423,741],[502,741],[510,774],[477,791],[420,781]]),
 part('far-front-paw','foreFarPaw','far',[[876,839],[912,823],[963,832],[994,858],[1000,891],[879,895],[864,862]]),
 part('far-front-ankle','foreFarAnkle','far',[[886,807],[928,798],[955,820],[970,851],[925,866],[879,849]]),
 part('far-front-shin','foreFarKnee','far',[[860,728],[898,722],[928,757],[952,809],[946,836],[900,835],[869,802],[845,762]]),
 part('far-front-emergence','foreFarRoot','far',[[841,666],[874,666],[907,703],[919,747],[900,773],[859,748],[828,708]]),
 part('beak','jaw','near',[[1067,478],[1106,480],[1115,513],[1108,545],[1088,559],[1065,537],[1061,508]]),
 part('head','head','near',[[965,480],[1008,464],[1071,469],[1085,490],[1076,528],[1087,552],[1038,585],[999,571],[960,544],[945,511]]),
 part('neck','neck','near',[[811,553],[851,560],[893,542],[940,495],[973,482],[987,533],[1017,571],[977,607],[930,635],[878,659],[834,651],[802,617]]),
 part('tail-tip','tail3','far',[[174,685],[189,704],[149,713],[147,700]]),
 part('tail-distal','tail2','far',[[196,673],[209,695],[185,707],[168,695]]),
 part('tail-middle','tail1','far',[[222,660],[239,683],[208,699],[188,682]]),
 part('tail-base','tail0','far',[[235,641],[264,639],[279,665],[269,691],[232,693],[215,668]]),
 // A source-local plate owner, not a flexible torso divided along donor mammal joints.
 part('carapace','root','near',[[199,638],[226,584],[272,517],[301,450],[360,405],[430,347],[485,326],[527,335],[583,323],[631,337],[670,369],[710,390],[756,444],[806,480],[855,492],[880,510],[873,541],[846,580],[821,622],[785,651],[738,685],[712,723],[658,749],[550,768],[442,751],[390,726],[338,686],[274,660]]),
 part('plate-remainder','root','near',[[0,0],[1254,0],[1254,1254],[0,1254]]),
];
packet('01-tortoise','audits/C186_CREATURE_SUPPLY_20261002/07-tortoise/master.png','audits/C186_CREATURE_SUPPLY_20261002/07-tortoise/subject-source.json',{
 id:'c196-tortoise-observed',family:'quadruped',habitat:{realm:'land',source:'Canonical Tortoise ground capability; the painting shows four distinct feet.'},landmarksPx,groundLineY:910/1254,
 materials:{surface:'plated',joints:Object.fromEntries(scaled.map(j=>[j,'scaled']))},parts,remainderPart:'plate-remainder',
 coverage:{scope:'One independently observed source partition; no family-wide or native acceptance',declarations:'External pinnae are anatomically absent. Four visible feet, exposed neck and short tail are independently authored. Interior pelvis/spine/chest points are source-local control frames within the visible plate, not claims to see concealed bones.',remainingHolds:'Far proximal limb emergence is partly occluded by shell/near limbs. The observed lower chains are authored; no hidden anatomy or shell rigidity is inferred from material tags.'}
},{schema:'cf.anatomy-presence/v2',absent:['external-ears'],hidden:[],folded:[]},{schema:'cf.c196-source-observed-authoring/v1',id:'01-tortoise',type:'new independently observed source landmarks and polygons',previousFailure:'audits/G1_AUTO_AUTHOR_20260926/auto-g2c233/07-tortoise/packet/authoring.json',findings:['The transferred authoring had external-ear controls on the head and tail controls on the shell. The painting has no external pinnae, and its visible short tail lies at x155–264/y648–705.','The plated material is restricted by observed scaled neck/head/limb/tail overrides. Beak remains plated. The shell/root partition must demonstrate rigidity and attached emergence during actual publication; material tags alone do not establish either.'],changedJoints:Object.keys(landmarksPx),landmarkOrigin:'manual full-size painting inspection; no donor coordinates',limitsChanged:false});

const prior='audits/C192_SOURCE_HOLD_REPAIRS_20261002/02-serval-tail-neck',s=J(`${prior}/authoring.json`);
s.id='c196-serval-ear-base';
const target=s.parts.filter(p=>p.id==='ear-near-root');assert.equal(target.length,1);
target[0].polygonPx=[[843,325],[918,321],[932,351],[937,371],[890,400],[835,402],[825,379],[829,350]];
s.coverage={...s.coverage,scope:'One source-observed near-ear base contour successor; unchanged C192/G1 authoring is inherited',visualAcceptance:'none'};
packet('02-serval-ear-base',`${prior}/master.png`,`${prior}/subject-source.json`,s,J(`${prior}/presence.json`),{
 schema:'cf.c196-source-observed-correction/v1',id:'02-serval-ear-base',priorAuthoring:`${prior}/authoring.json`,priorAuthoringSha256:sha(fs.readFileSync(`${prior}/authoring.json`)),changedJoints:[],changedParts:['ear-near-root'],addedParts:[],limitsChanged:false,
 findings:['The near-ear outer base is visibly curved through x825–843/y325–402. The inherited polygon starts farther right and leaves part of the actual pinna base owned by the neck/nape.','Only the observed near-ear root contour expands to the visible outer edge. Its landmark and the other ear, neck and body polygons remain unchanged. The retained C242 full-size faint is the negative visual comparison.']
});
console.log('Authored two immutable source packets; no runtime changes.');
