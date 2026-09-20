import fs from 'node:fs';import {it,expect,vi} from 'vitest';import {Texture,TextureSource} from 'pixi.js';
import {sealFamilyRecord} from '../../../tools/creature-animation/family-record.mjs';import {familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {inferHiddenLandmarks} from '../../../tools/creature-animation/hidden-anatomy.mjs';import {hashBytes,hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {loadCreatureRigV1} from './creature-rig.js';import {createFamilyContactSolver} from './creature-rig-contact.js';
const source=JSON.parse(fs.readFileSync(new URL('../../../../../audits/ANATOMY_COMPLETION_20260917/crab-masks-05/coconut-crab-record.json',import.meta.url),'utf8'));
it('hidden limbs are present but render no parts or contacts; forged hidden paint refuses before decode',async()=>{
 const raw=structuredClone(source),bytes=new Uint8Array([1,2,3]);raw.anatomy={schema:'cf.anatomy-presence/v2',absent:[],hidden:['leg3Far','leg3Near']};raw.landmarks=inferHiddenLandmarks(familyContractForRecord(raw),raw.landmarks);raw.geometry.cutoutAssetHash=await hashBytes(bytes);
 const record=await sealFamilyRecord(raw),template=familyContractForRecord(record),alpha=new Uint8Array(record.geometry.width*record.geometry.height).fill(255);
 const body={schema:'cf.creature-parts/v1' as const,recordRecipeHash:record.recipeHash,atlasSha256:await hashBytes(bytes),atlasSize:{width:4,height:4},parts:[{id:'body',joint:'root',kind:'part' as const,layer:'near' as const,frame:{x:0,y:0,width:4,height:4},cutout:{x:0,y:0,width:4,height:4}}]};
 const decode=vi.fn(()=>Promise.resolve(new Texture({source:new TextureSource(body.atlasSize)}))),binding={...body,bindingHash:await hashJSON(body)},rig=await loadCreatureRigV1(record,binding,bytes,alpha,bytes,decode);
 try{rig.applyPose({});const before=rig.parts.map(p=>[p.display.x,p.display.y,p.display.rotation]);rig.applyPose({leg3FarKnee:{rotation:.2},leg3NearFoot:{rotation:.2}});expect(rig.parts.map(p=>[p.display.x,p.display.y,p.display.rotation])).toEqual(before);expect(template.hiddenJoints).toHaveLength(6);expect(createFamilyContactSolver(record).chains).toHaveLength(6);}finally{rig.dispose();}
 const bad={...body,parts:[{...body.parts[0]!,joint:'leg3FarFoot'}]};decode.mockClear();await expect(loadCreatureRigV1(record,{...bad,bindingHash:await hashJSON(bad)},bytes,alpha,bytes,decode)).rejects.toThrow('paint assigned to hidden joint');expect(decode).not.toHaveBeenCalled();
});
it('measured brachyuran contact limits admit P1 loading and reject an excessive planted fold without changing raw limits',()=>{
 const record=JSON.parse(fs.readFileSync(new URL('../../../../../audits/VISION_P1_COCONUT_20260920/hidden-01/fit-02/record.json',import.meta.url),'utf8')),t=familyContractForRecord(record),solver=createFamilyContactSolver(record);
 expect(t.contactLimitsDeg?.leg2NearKnee).toEqual({min:-30,max:30});expect(t.contactLimitsDeg?.leg2NearFoot).toEqual({min:-65,max:65});expect(t.limitsDeg.leg2NearKnee).toEqual({min:-35,max:35});expect(t.limitsDeg.leg2NearFoot).toEqual({min:-35,max:35});
 const r=record.landmarks.root,c=record.landmarks.carapace,bodyPx=Math.hypot(c[0]-r[0],c[1]-r[1])*record.geometry.height,phase={actionId:'faint',elapsedMs:260,durationMs:520};
 expect(()=>solver.resolve({root:{rotation:0,dy:46/bodyPx}},phase)).not.toThrow();expect(()=>solver.resolve({root:{rotation:0,dy:72/bodyPx}},phase)).toThrow('Contact: joint limit');
});
