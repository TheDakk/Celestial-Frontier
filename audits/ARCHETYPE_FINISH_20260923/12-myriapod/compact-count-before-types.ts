import fs from 'node:fs';
import {expect,it} from 'vitest';
import {appendageCounts,expandRepeatedAnatomy} from '../../../../tools/creature-animation/repeated-anatomy.mjs';
import {resolveAnatomyInventory,type AnatomyPresence} from '../../../../tools/creature-animation/anatomy-inventory.mjs';
import {familyContract,familyContractForRecord,familyContactChains,FAMILY_CONTRACTS} from '../../../../tools/creature-animation/family-contracts.mjs';
import {resolveFixedAttachments} from '../../../../tools/creature-animation/fixed-attachments.mjs';
import {resolveTemplate,isMotionFallback} from './templates.js';
import {actionsFor} from './family-actions.js';
import {compileBodyCard} from './body-card.js';
import {buildTimeline} from './timeline.js';
import {compileAnatomyAttack} from '../anatomy-attacks.js';
import {emitPainterTopology,observePainterTopology,type PainterTopology} from '../../../../packages/art/src/painter-topology.js';
import type {ArtContext2D} from '../../../../packages/art/src/speciescanvas.js';

const base=JSON.parse(fs.readFileSync(new URL('../../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records.myriapod;
const presence=(pairs=14):AnatomyPresence=>({schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{walkingLegPairs:pairs,ultimateLegPairs:1}});
function fixture(){
 const r=structuredClone(base);r.anatomy=presence();r.recipeHash='synthetic-compact-count-control';
 r.landmarks={root:[.08,.5],head:[.86,.5],mandible:[.9,.52],antennaFar:[.94,.42],antennaNear:[.94,.47],ultimateFar:[.02,.42],ultimateNear:[.02,.58]};r.geometry.fixedAttachments={head:[.81,.5],ultimateFar:[.09,.46],ultimateNear:[.09,.54]};
 for(let i=0;i<14;i++)for(const side of ['Far','Near']){const id='leg'+i+side,x=.15+i*.043,sign=side==='Far'?-1:1;r.geometry.fixedAttachments[id+'Knee']=[x,.5+sign*.025];r.landmarks[id+'Knee']=[x+.035,.5+sign*.095];r.landmarks[id+'Foot']=[x+.015,.5+sign*.18];}
 return r;
}
it('declares 63 joints, 31 fixed sockets, 28 walking contacts and a 32-part whole-limb layout without fake knees',()=>{
 const r=fixture(),t=familyContractForRecord(r),chains=familyContactChains(t),parents=new Map(t.graph);
 expect(t.anatomyModel).toBe('myriapod-rigid-trunk-v1');expect(t.joints).toHaveLength(63);expect(new Set(t.joints).size).toBe(63);expect(t.graph).toHaveLength(62);expect(Object.keys(t.fixedPivots!)).toHaveLength(31);
 expect(t.bodyAxis).toEqual(['root','head']);expect(chains).toHaveLength(28);expect(t.joints.some(j=>/^seg/.test(j))).toBe(false);
 for(const c of chains){expect(parents.get(c.knee)).toBe('root');expect(parents.get(c.end)).toBe(c.knee);expect(c.end).toBe(c.id+'Foot');expect(c.terminal).toBeNull();expect(t.fixedPivots![c.knee]).toEqual(r.geometry.fixedAttachments[c.knee]);}
 expect(chains.filter(c=>c.group===0)).toHaveLength(14);expect(chains.filter(c=>c.group===1)).toHaveLength(14);
 expect(chains.some(c=>c.id.startsWith('ultimate'))).toBe(false);
 // This is the proposed texture-part definition, not qualification of painted masks.
 const textureParts=['body','head',...chains.map(c=>c.id),'ultimateFar','ultimateNear'];expect(textureParts).toHaveLength(32);expect(new Set(textureParts).size).toBe(32);
});
it('rejects malformed, ambiguous, unsupported and over-budget counted anatomy',()=>{
 const invalid=[null,[],{},14,{walkingLegPairs:14},{walkingLegPairs:14,ultimateLegPairs:1,arms:2},{legPairs:15},
  ...[0,-1,1.5,NaN,Infinity,'14',true].map(walkingLegPairs=>({walkingLegPairs,ultimateLegPairs:1})),
  ...[0,2,1.5,'1',null].map(ultimateLegPairs=>({walkingLegPairs:14,ultimateLegPairs}))];
 for(const appendages of invalid){const a={...presence(),appendages}as AnatomyPresence;expect(()=>appendageCounts('myriapod',a)).toThrow('Anatomy inventory');expect(()=>resolveAnatomyInventory(familyContract('myriapod'),a)).toThrow('Anatomy inventory');}
 expect(()=>resolveAnatomyInventory(familyContract('myriapod'),presence(15))).toThrow('64-joint budget exceeded: 67');
 expect(()=>resolveAnatomyInventory(familyContract('myriapod'),{...presence(),schema:'cf.anatomy-presence/v1'})).toThrow('invalid presence');
 expect(()=>resolveAnatomyInventory(familyContract('insect'),presence())).toThrow('unsupported repeated topology insect');
});
it('copies original numerical bounds and joint limits into both intake and motion definitions',()=>{
 const old=familyContract('myriapod'),t=resolveAnatomyInventory(old,presence()),motion=resolveTemplate('myriapod');if(isMotionFallback(motion))throw Error('fixture');const m=resolveAnatomyInventory(motion,presence());
 expect(m.graph).toEqual(t.graph);expect(m.limitsDeg).toEqual(t.limitsDeg);
 for(const id of ['body','bone-min','bone-max']){const a=old.bounds.find(b=>b.id===id)!,b=t.bounds.find(b=>b.id===id)!;expect([b.min,b.max]).toEqual([a.min,a.max]);}
 for(const leg of t.legs){for(const suffix of ['Knee','Foot'])expect(t.limitsDeg[leg+suffix]).toEqual(old.limitsDeg['legAFar'+suffix]);const bound=t.bounds.find(b=>b.id==='leg/body:'+leg)!;expect([bound.min,bound.max]).toEqual([.05,1.5]);}
 expect(t.bounds.map(({id,min,max})=>({id,min,max}))).toEqual(m.proportions.map(({id,min,max})=>({id,min,max})));
 for(const j of ['root','head','mandible','antennaFar','antennaNear'])expect(t.limitsDeg[j]).toEqual(old.limitsDeg[j]);
 for(const j of ['ultimateFar','ultimateNear'])expect(t.limitsDeg[j]).toEqual(old.limitsDeg.legAFarFoot);
});
it('all supported pair counts animate only admitted joints and retain every real leg in the phase inventory',()=>{
 for(let count=1;count<=14;count++){
  const a=presence(count),t=resolveAnatomyInventory(familyContract('myriapod'),a),library=actionsFor('myriapod',a)!,active=new Set<string>();
  expect(t.joints).toHaveLength(4*count+7);expect(t.legs).toHaveLength(2*count);expect(Object.keys(library)).not.toContain('melee:sting');
  for(const [id,action]of Object.entries(library)){expect(action.id).toBe(id);let prior=0;for(const pose of action.poses){expect(pose.t).toBeGreaterThanOrEqual(prior);expect(pose.t).toBeLessThanOrEqual(1);prior=pose.t;expect(Number.isFinite(pose.root.dx)&&Number.isFinite(pose.root.dy)).toBe(true);for(const [joint,angle]of Object.entries(pose.joints)){expect(t.joints,id+'/'+joint).toContain(joint);const limit=t.limitsDeg[joint]!;expect(Number.isFinite(angle)&&angle>=limit.min&&angle<=limit.max,id+'/'+joint).toBe(true);if(angle!==0)active.add(joint);}}}
  for(const leg of t.legs)for(const suffix of ['Knee','Foot'])expect(active.has(leg+suffix)).toBe(true);
  for(const j of ['head','mandible','antennaFar','antennaNear','ultimateFar','ultimateNear'])expect(active.has(j)).toBe(true);
  const gait=library['approach:crawl']!,chains=familyContactChains(t);for(const c of chains){expect(Math.sign(gait.poses[0]!.joints[c.knee]!)).toBe(c.group===1?1:-1);expect(Math.sign(gait.poses[2]!.joints[c.knee]!)).toBe(c.group===1?-1:1);}
 }
});
it('folded declarations resolve indexed legs and reject missing, hidden or nonwalking substitutes',()=>{
 const t=familyContract('myriapod');expect(resolveAnatomyInventory(t,{...presence(),folded:['leg13Near']}).legs).toContain('leg13Near');
 for(const folded of [['leg14Near'],['legAFar'],['ultimateFar'],['leg0Near','leg0Near']])expect(()=>resolveAnatomyInventory(t,{...presence(),folded})).toThrow('folded');
 expect(()=>resolveAnatomyInventory(t,{...presence(),hidden:['leg0Near'],folded:['leg0Near']})).toThrow('folded is neither hidden nor absent');
});
it('count-aware painter observations refuse a dropped, duplicated, renamed or surplus painted leg',()=>{
 const t=resolveAnatomyInventory(familyContract('myriapod'),presence()),ids=[...t.legs,'ultimateFar','ultimateNear'],context={}as ArtContext2D;
 const value:PainterTopology={schema:'cf.painter-topology/v1',ownerId:'synthetic-compact-control',family:'myriapod',coordinateSize:100,materials:{surface:'chitin',paletteSource:'test'},anatomy:presence(),unresolved:[],features:[{id:'body',kind:'body',points:[[10,50],[90,50]],layer:'near'},{id:'head',kind:'head',points:[[90,50]],layer:'near'},...ids.map(id=>({id,kind:'leg'as const,points:[[20,50],[30,65],[40,70]]as const,layer:id.endsWith('Far')?'far'as const:'near'as const}))]};
 const capture=(v:PainterTopology)=>observePainterTopology(context,()=>emitPainterTopology(context,v));expect(capture(value)).toEqual(value);
 const variants=[value.features.slice(0,-1),[...value.features,{...value.features[2]!,id:'invented'}],[...value.features.slice(0,-1),{...value.features.at(-1)!,id:'wrongUltimate'}],[...value.features.slice(0,-1),value.features[2]!]];
 for(const features of variants)expect(()=>capture({...value,features})).toThrow('Painter topology:');expect(observePainterTopology(context,()=>{})).toBeNull();
});
it('compiled compact timelines retain the full graph and attacks use actual head/mandible instead of absent trunk waves',()=>{
 const card=compileBodyCard(fixture()),joints=['root',...card.parts.map(p=>p.joint)],declaration={recordHash:card.recipeHash!,source:'synthetic count control',weapons:['body','bite','sting']as const};
 for(const action of Object.keys(actionsFor('myriapod',card.anatomy)!)){const timeline=buildTimeline(card,action,31);expect(Object.keys(timeline.tracks).sort()).toEqual([...joints].sort());expect(timeline.clamped).toEqual([]);}
 expect(compileAnatomyAttack(card,'ground',0,'body',declaration).contactJoint).toBe('head');expect(compileAnatomyAttack(card,'ground',0,'mandible',declaration).contactJoint).toBe('mandible');expect(()=>compileAnatomyAttack(card,'ground',0,'sting',declaration)).toThrow('no admitted move');
 expect(()=>compileAnatomyAttack({...card,parts:card.parts.filter(p=>p.joint!=='head')},'ground',0,'body',declaration)).toThrow('no admitted move');
});
it('legacy contracts and action objects bypass count and socket expansion unchanged',()=>{
 for(const t of FAMILY_CONTRACTS){for(const a of [undefined,{schema:'cf.anatomy-presence/v1'as const,absent:[]},{schema:'cf.anatomy-presence/v2'as const,absent:[],hidden:[],folded:[]}]){expect(expandRepeatedAnatomy(t,a)).toBe(t);expect(resolveAnatomyInventory(t,a)).toBe(t);expect(resolveFixedAttachments(t,{geometry:{}})).toBe(t);expect(actionsFor(t.id,a)).toBe(actionsFor(t.id));}}
 expect(familyContract('myriapod').joints).toHaveLength(29);expect(actionsFor('myriapod')!['melee:sting']).toBeDefined();
});
