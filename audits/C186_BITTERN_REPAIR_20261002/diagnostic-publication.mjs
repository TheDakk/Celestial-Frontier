/** Audit-only copy of the existing publication order; no runtime admission shortcut. */
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
import {applyPaintPart,paintPartAreas,assertPaintPartShape} from '../../port/v2/tools/creature-animation/paint-skin.mjs';
import {compileRigidParentFrames,applyRigidParentFrames} from '../../port/v2/tools/creature-animation/rigid-parent-frame.mjs';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
export function createPaintPublication(record,binding,realm){
 const skin=binding.paintSkin,{width:w,height:h}=record.geometry,definition=familyContractForRecord(record);
 if(!skin||binding.recordRecipeHash!==record.recipeHash)throw Error('Source-bound skin required');
 if(record.geometry.contactPads||binding.seamBridges)throw Error('This audit owner requires ordinary paint-skin publication');
 const supports=observedContactSupports(record,binding),contact=createFamilyContactSolver(record,supports),skeleton=createSkeletonPoseProgram(definition,record.landmarks),compiled=createCompiledSkinField(skin,w,h),scratch=skin.solver?createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver):null,groups=compileRigidParentFrames(skin,binding.parts,definition,w,h),target=new Float32Array(skin.vertices.length*2),field=target.slice();
 const parts=skin.parts.map(p=>({p,areas:paintPartAreas(p,skin)})),positions=Object.fromEntries(parts.map(({p})=>[p.id,new Float32Array(p.vertices.length*2)]));
 return {debug:()=>({scratch,target,field}),rigidParents:groups.map(g=>({id:g.id,parentPart:g.parentPart,parentJoint:g.parentJoint})),publish(pose,phase){
  const solved=contact.resolve(pose,{...phase,realm,travel:'stage'}),matrices=skeleton.evaluate(solved.pose);
  applyCompiledSkinField(compiled,matrices,target);if(scratch)solveArapSkin(scratch,target,field);else field.set(target);
  for(const {p} of parts)applyPaintPart(p,field,positions[p.id]);applyRigidParentFrames(groups,matrices,positions);
  for(const {p,areas} of parts)assertPaintPartShape(p,skin,positions[p.id],w,h,areas);
  const extrema=parts.map(({p})=>{let vertex=0;for(let i=1;i<p.vertices.length;i++)if(positions[p.id][2*i+1]>positions[p.id][2*vertex+1])vertex=i;return {part:p.id,vertex,x:positions[p.id][2*vertex],y:positions[p.id][2*vertex+1],source:p.vertices[vertex],faces:Array.from({length:p.indices.length/3},(_,i)=>i).filter(i=>p.indices.slice(i*3,i*3+3).includes(vertex)),clearancePx:(record.geometry.groundLineY-positions[p.id][2*vertex+1])*h};});
  const publishedContacts=solved.contacts.map(c=>{const surface=supports[c.joint].surface,p=positions[surface.partId];let x=0,y=0;if('vertexIndex' in surface){x=p[surface.vertexIndex*2];y=p[surface.vertexIndex*2+1];}else for(let k=0;k<3;k++){x+=p[surface.triangle[k]*2]*surface.barycentric[k];y+=p[surface.triangle[k]*2+1]*surface.barycentric[k];}return {joint:c.joint,driftPx:Math.hypot((x-c.paintedTarget.x)*w,(y-c.paintedTarget.y)*h)};});
  return {positions,extrema,publishedContacts,contactError:solved.maxError,paintTargetError:solved.maxPaintTargetErrorPx??null,resolved:solved.pose};
 }};
}
