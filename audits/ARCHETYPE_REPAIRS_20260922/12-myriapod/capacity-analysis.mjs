/** One fresh capacity probe of proposed representations; no painted intake or shared edits. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {familyContract,familyContactChains} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {MAX_SKELETON_JOINTS,createSkeletonPoseProgram} from '../../../port/v2/tools/creature-animation/skeleton-pose.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=import.meta.dirname,out=path.join(base,'capacity-analysis.json');
if(fs.existsSync(out))throw Error('Fresh capacity output required');
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map();
const observe=file=>{if(sources.has(file))return;const bytes=fs.readFileSync(file);sources.set(file,sha(bytes));const text=bytes.toString();for(const match of text.matchAll(/(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?['"](\.[^'"]+)['"]/g)){let dep=path.resolve(path.dirname(file),match[1]);if(!fs.existsSync(dep)&&dep.endsWith('.js')&&fs.existsSync(dep.slice(0,-3)+'.ts'))dep=dep.slice(0,-3)+'.ts';if(fs.existsSync(dep)&&fs.statSync(dep).isFile())observe(dep);}};
for(const file of ['port/v2/tools/creature-animation/family-contracts.mjs','port/v2/tools/creature-animation/skeleton-pose.mjs'])observe(path.join(root,file));
const ownerAnchors={
 'port/v2/tools/creature-animation/repeated-anatomy.mjs':['export function appendageCounts','unsupported repeated topology','export function expandRepeatedAnatomy'],
 'port/v2/tools/creature-animation/anatomy-inventory.mjs':['export function resolveAnatomyInventory','const folded='],
 'port/v2/tools/creature-animation/family-contracts.mjs':['export function familyContactChains','Contact contract: unsupported leg'],
 'port/v2/tools/creature-animation/skeleton-pose.mjs':['export const MAX_SKELETON_JOINTS','export function createSkeletonPoseProgram'],
 'port/v2/tools/creature-animation/part-masks.mjs':["'part budget'","'painter part budget'"],
 'port/v2/tools/creature-animation/kinematics.ts':['export function createTwoBoneChain','target outside two-bone reach'],
 'port/v2/apps/game/src/creature-rig-contact.ts':['export function observedContactSupports','export function createFamilyContactSolver','chain:createTwoBoneChain','compression+shift>scaleLength*.08'],
 'port/v2/apps/game/src/motion/family-templates.ts':['const myriaPairs','const MYRIAPOD = build'],
 'port/v2/apps/game/src/motion/family-actions.ts':['const myA =','const MYRIAPOD = fauna','const counts=appendageCounts'],
 'port/v2/tools/creature-animation/split-observed-surfaces.mjs':['function observedContactPins','contactEndpoints'],
 'port/v2/apps/game/src/battle2/parts-rig.ts':["const contactMode: PartsContactMode",'const family = contactMode']
};
const owners=[];
for(const [relative,anchors]of Object.entries(ownerAnchors)){const file=path.join(root,relative),bytes=fs.readFileSync(file);sources.set(file,sha(bytes));const lines=bytes.toString().split('\n');owners.push({path:file,anchors:anchors.map(text=>{const line=lines.findIndex(l=>l.includes(text));assert(line>=0,'Owner anchor '+text);return{text,line:line+1};})});}
const self=path.join(base,'capacity-analysis.mjs');sources.set(self,sha(fs.readFileSync(self)));
const current=familyContract('myriapod'),pairCount=15,oldLegs=new Set(current.legs.flatMap(id=>[id+'Knee',id+'Foot']));
const coreGraph=current.graph.filter(([joint])=>!oldLegs.has(joint));
const coreJoints=['root',...coreGraph.map(([joint])=>joint)];assert.equal(coreJoints.length,13);assert.equal(current.joints.length,29);assert.equal(familyContactChains(current).length,8);
const makeCandidate=jointCountPerLeg=>{
 const candidate=structuredClone(current);candidate.graph=structuredClone(coreGraph);candidate.legs=[];
 candidate.limitsDeg=Object.fromEntries(Object.entries(current.limitsDeg).filter(([joint])=>!oldLegs.has(joint)));
 candidate.bounds=current.bounds.filter(b=>!b.id.startsWith('leg/body:')).map(b=>structuredClone(b));
 const basis=current.bounds.find(b=>b.id==='leg/body:legAFar');assert(basis);
 for(let pair=0;pair<pairCount;pair++)for(const side of ['Far','Near']){
  const id='leg'+pair+side,parent='seg'+Math.floor(pair*8/pairCount),bones=jointCountPerLeg===2?[id+'Knee',id+'Foot']:[id+'Foot'];candidate.legs.push(id);
  for(let i=0;i<bones.length;i++){candidate.graph.push([bones[i],i?bones[i-1]:parent]);candidate.limitsDeg[bones[i]]=structuredClone(current.limitsDeg[bones[i].endsWith('Knee')?'legAFarKnee':'legAFarFoot']);}
  candidate.bounds.push({...structuredClone(basis),id:'leg/body:'+id,bones});
 }
 candidate.joints=['root',...candidate.graph.map(([joint])=>joint)];return candidate;
};
const twoJoint=makeCandidate(2),compact=makeCandidate(1);assert.equal(twoJoint.joints.length,73);assert.equal(compact.joints.length,43);
assert.equal(familyContactChains(twoJoint).length,30,'Expanded two-joint graph preserves contact descriptor shape');
let twoJointRefusal=null;try{createSkeletonPoseProgram(twoJoint,{});}catch(error){twoJointRefusal=String(error);}assert.equal(twoJointRefusal,'Error: Skeleton pose: joint budget');
let compactRefusal=null;try{familyContactChains(compact);}catch(error){compactRefusal=String(error);}assert.equal(compactRefusal,'Error: Contact contract: unsupported leg leg0Far');
const partSource=fs.readFileSync(path.join(root,'port/v2/tools/creature-animation/part-masks.mjs'),'utf8');assert(partSource.includes("declaration.parts.length<=32,'painter part budget'"));const partBudget=32,proposedParts=pairCount*2+2;
const receipt={schema:'cf.myriapod-proposed-capacity-analysis/v1',status:'REFUSED_WITH_UNCHANGED_GATES',scope:'Fresh proposed 15-pair graph capacity probes only. No call to appendageCounts, no repeat of original unsupported-topology attempt, no painted record/landmarks/parts admission, static battery, native film, or art judgement.',pairCountPremise:{requestedMinimumCapacity:pairCount,exactPaintedCountCertified:false,explanation:'Parent-requested lower-bound capacity case, not a new full image census. More pairs cannot reduce required graph or part counts.'},current:{jointCount:current.joints.length,legCount:current.legs.length,legPairs:current.legs.length/2,coreJointCount:coreJoints.length,coreJoints},unchangedLimits:{jointBudget:MAX_SKELETON_JOINTS,partBudget,compressionFraction:.08,existingTwoBoneContact:true},twoJoint:{candidate:twoJoint,joints:twoJoint.joints.length,contactChains:30,maximumPairsWithinJointBudget:Math.floor((MAX_SKELETON_JOINTS-coreJoints.length)/4),refusal:twoJointRefusal,owner:'createSkeletonPoseProgram'},compact:{candidate:compact,joints:compact.joints.length,proposedParts,numericJointBudgetFits:compact.joints.length<=MAX_SKELETON_JOINTS,numericPartBudgetFits:proposedParts<=partBudget,refusal:compactRefusal,owner:'familyContactChains'},finding:'Keeping the existing 13 core joints and independent two-joint planted contacts requires 73 joints at 15 pairs, exceeding64. A 43-joint,32-part compact proposal passes only arithmetic budgets and is rejected by the unchanged two-bone contact descriptor. A one-link contact model would be new behavior beyond count-only representation; dropping stance, sharing trunk joints as fictitious knees, or hiding extra joints outside the count is not demonstrated as a legal admission.',owners,sources:[...sources].map(([file,sha256])=>({path:file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}))};
assert(receipt.sources.every(s=>s.unchanged));fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:receipt.status,current:receipt.current,jointBudget:MAX_SKELETON_JOINTS,partBudget,twoJoint:{joints:twoJoint.joints.length,refusal:twoJointRefusal},compact:{joints:compact.joints.length,parts:proposedParts,refusal:compactRefusal},sourceFiles:receipt.sources.length},null,2));
