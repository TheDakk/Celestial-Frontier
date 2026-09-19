import {readFileSync} from 'node:fs';import {expect,it} from 'vitest';
import {createQuadrupedContactSolver,poseMatrices} from './creature-rig-contact.js';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
const root=new URL('../../../../../',import.meta.url),record=JSON.parse(readFileSync(new URL('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',root),'utf8'));
const displacement=(pose:Parameters<typeof poseMatrices>[1])=>{const m=poseMatrices(record,pose);return ['hindFar','foreFar','hindNear','foreNear'].map(id=>{const p=record.landmarks[id+'Paw'],q=transformPoint(m[id+'Paw']!,{x:p[0],y:p[1]});return Math.hypot(q.x-p[0],q.y-p[1]);});};
it('holds authored paw positions through body movement, with an unconstrained negative control',()=>{
 const solver=createQuadrupedContactSolver(record),pose={root:{rotation:0,dx:-.025,dy:.015},spine:{rotation:.02},head:{rotation:.1},earNearTip:{rotation:.2}};
 expect(Math.max(...displacement(pose))).toBeGreaterThan(.001);
 const result=solver.resolve(pose,true);expect(Math.max(...displacement(result.pose))).toBeLessThan(1e-8);
 expect(result.pose.head).toEqual(pose.head);expect(result.pose.earNearTip).toEqual(pose.earNearTip);
 expect(solver.resolve(pose,false).pose).toBe(pose);expect(pose.root.dy).toBe(.015);
 expect(Math.max(...displacement(solver.resolve({},true).pose))).toBeLessThan(1e-8);
});
it('refuses impossible contacts and wrong families instead of sliding the paw',()=>{
 const solver=createQuadrupedContactSolver(record);
 expect(()=>solver.resolve({root:{rotation:0,dx:8}},true)).toThrow('horizontal reach');
 expect(()=>solver.resolve({root:{rotation:0,dy:-8}},true)).toThrow('compression bound');
 expect(()=>createQuadrupedContactSolver({...record,template:{id:'serpent',version:1}})).toThrow('quadruped');
});
