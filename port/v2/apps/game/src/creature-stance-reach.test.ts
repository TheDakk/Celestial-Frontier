import fs from 'node:fs';import path from 'node:path';import {it,expect} from 'vitest';
import {measureStanceReach} from './creature-stance-reach.js';import {createFamilyContactSolver,observedContactSupports} from './creature-rig-contact.js';
const root=path.resolve(import.meta.dirname,'../../../../..'),read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
it('Freshwater measured gait envelope admits positive cadence and retains the original reach refusal',()=>{
 const dir='audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/',r=read(dir+'record.json'),b=read(dir+'binding.json'),supports=observedContactSupports(r,b),m=measureStanceReach(r,supports);
 expect(m.forward).toBeGreaterThan(0);expect(m.forward).toBeLessThan(.07165014577259474);expect(m.samples).toBe(121);expect(m.limits.every(x=>x.refusal&&x.refusedAt>x.admitted)).toBe(true);
});
it('only explicitly folded stage contacts ride the body; solver mode remains exactly identical',()=>{
 const r=read('audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json'),folded={...r,anatomy:{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:['leg0Far']}},a=createFamilyContactSolver(r),b=createFamilyContactSolver(folded),phase={actionId:'idle',elapsedMs:0,durationMs:1000};
 expect(a.resolve({},phase)).toEqual(b.resolve({},phase));
 const moved=b.resolve({}, {...phase,travel:'stage',stageDisplacement:.01});
 const body=moved.contacts.find(c=>c.joint==='leg0FarFoot')!,ground=moved.contacts.find(c=>c.joint==='leg0NearFoot')!;
 expect(body.space).toBe('body');expect(body.target.x).toBe(r.landmarks.leg0FarFoot[0]);expect(ground.space).toBeUndefined();expect(ground.target.x).toBe(r.landmarks.leg0NearFoot[0]-.01*b.scaleLength);
 const ordinary=a.resolve({}, {...phase,travel:'stage',stageDisplacement:.01});expect(ordinary.contacts.find(c=>c.joint==='leg0FarFoot')!.target.x).not.toBe(body.target.x);
});
