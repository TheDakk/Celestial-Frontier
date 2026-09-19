import {it,expect} from 'vitest';import {createCreatureRigAim,type CreatureAimGeometry} from './creature-rig-aim.js';import type{CreatureRigRecordV1}from'./creature-rig.js';
function fixture(){
 const record:CreatureRigRecordV1={recipeHash:'fixture',template:{id:'fixture',version:1},geometry:{width:384,height:384,groundLineY:.8,cutoutAssetHash:'fixture'},landmarks:{root:[.2,.5],neck:[.4,.5],head:[.6,.5],tail:[.1,.5]}};
 const geometry:CreatureAimGeometry={recordRecipeHash:'fixture',graph:[['neck','root'],['head','neck'],['tail','root']],chain:['neck','head'],origin:[.6,.5],forward:[.8,.5],bodyLength:.4,limits:{neck:{min:-.4,max:.4},head:{min:-.5,max:.5}},yaw:{centre:0,halfRange:0}};
 return{record,geometry};
}
it('looks above and below using actual chain pivots, without changing body/appendage action or input',()=>{
 const {record,geometry}=fixture(),aim=createCreatureRigAim(record,geometry),pose={root:{rotation:0,dx:.1},tail:{rotation:.2}},copy=structuredClone(pose);
 const up=aim.resolve(pose,{x:.9,y:.3,yawRadians:0}),down=aim.resolve(pose,{x:.9,y:.7,yawRadians:0});
 expect(up.status).toBe('aimed');expect(down.status).toBe('aimed');expect(up.pose.head!.rotation).toBeLessThan(0);expect(down.pose.head!.rotation).toBeGreaterThan(0);expect(up.pose.root).toEqual(pose.root);expect(up.pose.tail).toEqual(pose.tail);expect(pose).toEqual(copy);
 expect(aim.resolve(pose,{x:.9,y:.3,yawRadians:0})).toEqual(up);
});
it('does not turn a single-view portrait into an unseen head side; limited head reach requests body turn',()=>{
 const {record,geometry}=fixture(),aim=createCreatureRigAim(record,geometry),pose={};
 const back=aim.resolve(pose,{x:.8,y:.5,yawRadians:Math.PI});expect(back.status).toBe('needs-view');expect(back.pose).toBe(pose);
 const beyond=aim.resolve(pose,{x:.1,y:.5,yawRadians:0});expect(beyond.status).toBe('needs-body-turn');expect(beyond.limitedJoints.length).toBeGreaterThan(0);expect(Math.abs(beyond.pose.head!.rotation)).toBeLessThanOrEqual(.5);
});
it('refuses mismatched ownership, absent gaze data, foreign/cyclic chain and malformed targets',()=>{
 const {record,geometry}=fixture();
 for(const mutate of [(g:CreatureAimGeometry)=>({...g,recordRecipeHash:'wrong'}),(g:CreatureAimGeometry)=>({...g,chain:['tail','head']}),(g:CreatureAimGeometry)=>({...g,forward:g.origin}),(g:CreatureAimGeometry)=>({...g,graph:[['head','neck'],['neck','root'],['tail','root']] as const})])expect(()=>createCreatureRigAim(record,mutate(geometry))).toThrow();
 expect(()=>createCreatureRigAim(record,geometry).resolve({foreign:{rotation:0}},{x:1,y:0,yawRadians:0})).toThrow('input pose');
 expect(()=>createCreatureRigAim(record,geometry).resolve({},{x:NaN,y:0,yawRadians:0})).toThrow('target');
 expect(()=>createCreatureRigAim(record,geometry).resolve({head:{rotation:.6}},{x:1,y:.5,yawRadians:Math.PI})).toThrow('input joint limit');
 expect(()=>createCreatureRigAim({...record,landmarks:{...record.landmarks,head:[NaN,.5]}},geometry)).toThrow('record landmarks');
});
