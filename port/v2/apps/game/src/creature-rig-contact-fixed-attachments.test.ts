import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {measureFamilyBounds} from '../../../tools/creature-animation/family-record.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,predictContactSupport} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
const root=new URL('../../../../../',import.meta.url),base=JSON.parse(fs.readFileSync(new URL('port/v2/tools/creature-animation/test-fixtures/family-records.json',root),'utf8')).records.myriapod;
function fixture(){
 const r=structuredClone(base);r.anatomy={schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{walkingLegPairs:14,ultimateLegPairs:1}};
 r.landmarks={root:[.08,.5],head:[.86,.5],mandible:[.9,.52],antennaFar:[.94,.42],antennaNear:[.94,.47],ultimateFar:[.02,.42],ultimateNear:[.02,.58]};r.geometry.fixedAttachments={head:[.81,.5],ultimateFar:[.09,.46],ultimateNear:[.09,.54]};
 for(let i=0;i<14;i++)for(const side of ['Far','Near']){const id='leg'+i+side,x=.15+i*.043,sign=side==='Far'?-1:1;r.geometry.fixedAttachments[id+'Knee']=[x,.5+sign*.025];r.landmarks[id+'Knee']=[x+.035,.5+sign*.095];r.landmarks[id+'Foot']=[x+.015,.5+sign*.18];}
 return r;
}
it('63-joint compact card, geometry admission and contact chains agree on all 28 real upper-leg sockets',()=>{
 const record=fixture(),template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks),card=compileBodyCard(record),bounds=measureFamilyBounds(template,record.landmarks),solver=createFamilyContactSolver(record);
 expect(program.jointNames).toHaveLength(63);expect(solver.chains).toHaveLength(28);expect(solver.chains.some(c=>c.id.startsWith('ultimate'))).toBe(false);
 for(const c of solver.chains){const socket=record.geometry.fixedAttachments[c.knee],part=card.parts.find(p=>p.joint===c.knee)!;expect(c.root).toEqual({x:socket[0],y:socket[1]});expect(program.pivot(c.knee)).toEqual(c.root);expect(part.pivot).toEqual(socket);expect(part.boneLength).toBe(bounds.boneLengths[c.knee]);expect(part.boneLength).toBe(c.chain.lengths.upper);const dx=c.endPoint.x-c.root.x,dy=c.endPoint.y-c.root.y,slack=(Math.sqrt(Math.max(0,(c.chain.lengths.upper+c.chain.lengths.lower)**2-dx*dx))-dy)/card.bodyLength;expect(card.bounds.legSlack[c.id]).toBe(slack);}
 expect(card.parts.find(p=>p.joint==='head')!.pivot).toEqual(record.geometry.fixedAttachments.head);
});
it('all actual walking endpoints stay planted with unchanged lengths and limits under inherited trunk displacement',()=>{
 const record=fixture(),before=JSON.stringify(record),template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks),solver=createFamilyContactSolver(record),input={root:{rotation:.005,dx:.001,dy:0}},solved=solver.resolve(input,{actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'}),m=program.evaluate(solved.pose);
 expect(solved.contacts).toHaveLength(28);expect(solved.contacts.every(c=>c.stance)).toBe(true);expect(solved.compression).toBeLessThanOrEqual(solver.scaleLength*.08);expect(solved.maxError).toBeLessThanOrEqual(1e-8);
 for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,h=transformPoint(m[c.hip]!,c.root),k=transformPoint(m[c.knee]!,c.joint),e=transformPoint(m[c.end]!,c.endPoint),p=predictContactSupport(c.model,m);expect(Math.hypot(k.x-h.x,k.y-h.y)).toBeCloseTo(c.chain.lengths.upper,13);expect(Math.hypot(e.x-k.x,e.y-k.y)).toBeCloseTo(c.chain.lengths.lower,13);expect(Math.hypot(e.x-contact.endpointTarget.x,e.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);expect(Math.hypot((p.x-contact.paintedTarget.x)*record.geometry.width,(p.y-contact.paintedTarget.y)*record.geometry.height)).toBeLessThanOrEqual(.25);for(const joint of [c.knee,c.end]){const l=template.limitsDeg[joint]!,angle=solved.pose[joint]!.rotation*180/Math.PI;expect(angle).toBeGreaterThanOrEqual(l.min-1e-7);expect(angle).toBeLessThanOrEqual(l.max+1e-7);}}
 expect(JSON.stringify(record)).toBe(before);expect(input).toEqual({root:{rotation:.005,dx:.001,dy:0}});
});
it('missing sockets, impossible reach and original local joint limits still refuse',()=>{
 const record=fixture(),solver=createFamilyContactSolver(record),phase={actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'};
 expect(()=>solver.resolve({root:{rotation:0,dx:99}},phase)).toThrow(/reach/);
 const missing=structuredClone(record);delete missing.geometry.fixedAttachments.leg0NearKnee;expect(()=>createFamilyContactSolver(missing)).toThrow(/socket inventory/);expect(()=>compileBodyCard(missing)).toThrow(/socket inventory/);
 const template=familyContractForRecord(record),spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...template,contactLimitsDeg:{...template.limitsDeg,leg0NearFoot:{min:0,max:0}}});
 try{expect(()=>createFamilyContactSolver(record).resolve({root:{rotation:.005,dx:.001,dy:0}},phase)).toThrow(/joint limit leg0NearFoot/);}finally{spy.mockRestore();}
});
