import {readFileSync} from 'node:fs';
import {it,expect,vi} from 'vitest';
import {Texture,TextureSource} from 'pixi.js';
import {FAMILY_CONTRACTS} from '../../../tools/creature-animation/family-contracts.mjs';
import {sealFamilyRecord} from '../../../tools/creature-animation/family-record.mjs';
import {hashBytes,hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {loadCreatureRigV1,type CreaturePartsBindingV1} from './creature-rig.js';
const {records}=JSON.parse(readFileSync(new URL('../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8'));
const bytes=new Uint8Array([1,2,3]);
for(const template of FAMILY_CONTRACTS)it(template.id+': actual Pixi admission and every joint move in its own hierarchy',async()=>{
 const input=structuredClone(records[template.id]);input.geometry.cutoutAssetHash=await hashBytes(bytes);input.clipSetId=template.clipSetId;
 const record=await sealFamilyRecord(input),alpha=new Uint8Array(record.geometry.width*record.geometry.height).fill(255);
 const body={schema:'cf.creature-parts/v1' as const,recordRecipeHash:record.recipeHash,atlasSha256:await hashBytes(bytes),atlasSize:{width:template.joints.length*4,height:4},
  parts:template.joints.map((joint,i)=>({id:'part-'+i,joint,kind:'part' as const,layer:i%2?'near' as const:'far' as const,
   frame:{x:i*4,y:0,width:4,height:4},cutout:{x:0,y:0,width:4,height:4}}))};
 const binding:CreaturePartsBindingV1={...body,bindingHash:await hashJSON(body)},decode=vi.fn(()=>Promise.resolve(new Texture({source:new TextureSource(body.atlasSize)})));
 const rig=await loadCreatureRigV1(record,binding,bytes,alpha,bytes,decode);
 const snapshot=()=>rig.parts.map(p=>[p.display.x,p.display.y,p.display.rotation]);
 try{
  rig.applyPose({});const rest=snapshot();expect(rest.every(v=>v.every(n=>n===0))).toBe(true);
  const [a,b]=template.bodyAxis,A=record.landmarks[a],B=record.landmarks[b],L=Math.hypot(A[0]-B[0],A[1]-B[1]);
  rig.applyPose({root:{rotation:0,dx:.25,dy:-.1}});
  for(const p of rig.parts){expect(p.display.x).toBeCloseTo(L*.25,12);expect(p.display.y).toBeCloseTo(-L*.1,12);}
  for(const joint of template.joints){rig.applyPose({[joint]:{rotation:.1}});expect(rig.parts.find(p=>body.parts.find(q=>q.id===p.id)!.joint===joint)!.display.rotation).toBeCloseTo(.1,12);}
  rig.applyPose({});expect(snapshot()).toEqual(rest);
  const before=snapshot();expect(()=>rig.applyPose({foreign:{rotation:1}})).toThrow('unknown pose joint');expect(snapshot()).toEqual(before);
 }finally{rig.dispose();}
 const bad={...body,parts:body.parts.map((p,i)=>i===0?{...p,joint:'foreign'}:p)};decode.mockClear();
 await expect(loadCreatureRigV1(record,{...bad,bindingHash:await hashJSON(bad)},bytes,alpha,bytes,decode)).rejects.toThrow('unknown part joint');expect(decode).not.toHaveBeenCalled();
});
