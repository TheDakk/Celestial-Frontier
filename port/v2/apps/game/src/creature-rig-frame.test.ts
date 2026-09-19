import {it,expect,vi}from'vitest';import {createCreatureRigFrameTarget}from'./creature-rig-frame.js';import type{CreatureRigV1}from'./creature-rig.js';
it('batches a complete producer frame into one application across all joint vocabularies',()=>{
 const applyPose=vi.fn(),target=createCreatureRigFrameTarget({applyPose}as unknown as CreatureRigV1);
 target.sample(()=>{for(const name of ['root','head','wingFarTip','pectoralNear','arm7Seg2','frond3'])target.setJoint(name,.2,name==='root'?.3:0,0);});
 expect(applyPose).toHaveBeenCalledTimes(1);expect(Object.keys(applyPose.mock.calls[0]![0])).toHaveLength(6);
 target.sample(()=>target.setJoint('root',0));expect(applyPose.mock.calls[1]![0]).toEqual({root:{rotation:0,dx:0,dy:0}});
 // The old immediate-per-joint pattern exceeds one application for the same frame.
 const old=vi.fn();for(const name of ['root','head','wingFarTip'])old({[name]:{rotation:.2}});expect(old.mock.calls.length).toBeGreaterThan(1);
});
it('failed sampling publishes nothing, failed application does not leak queued joints into the next frame',()=>{
 const applyPose=vi.fn(),target=createCreatureRigFrameTarget({applyPose}as unknown as CreatureRigV1);
 expect(()=>target.sample(()=>{target.setJoint('head',.2);target.setJoint('jaw',NaN);})).toThrow('Invalid');expect(applyPose).not.toHaveBeenCalled();
 applyPose.mockImplementationOnce(()=>{throw Error('bounds');});expect(()=>target.sample(()=>target.setJoint('head',.3))).toThrow('bounds');
 target.sample(()=>target.setJoint('jaw',.1));expect(applyPose.mock.calls.at(-1)![0]).toEqual({jaw:{rotation:.1,dx:0,dy:0}});
 target.reset();expect(applyPose.mock.calls.at(-1)![0]).toEqual({});target.dispose();expect(()=>target.flush()).toThrow('disposed');
});
