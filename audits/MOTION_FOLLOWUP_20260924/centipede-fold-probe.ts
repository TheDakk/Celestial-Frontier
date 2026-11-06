import fs from 'node:fs';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
const p='audits/ARCHETYPE_FINISH_20260923/12-myriapod/fit-11/',read=(f:string)=>JSON.parse(fs.readFileSync(f,'utf8'));
const record=read(p+'record.json'),binding=read(p+'binding.json'),skin=binding.paintSkin;
const failing=read('audits/MOTION_FOLLOWUP_20260924/centipede-local-motion-01.json').observations[0].firstRefusal;
const solver=createFamilyContactSolver(record,{}),program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,1254,1254),results:any[]=[];
for(const factor of [1,.75,.5,0]){
 const pose=structuredClone(failing.pose);pose.root.dy*=factor;
 const resolved=solver.resolve(pose,{...failing.context,realm:'terrestrial'}),target=new Float32Array(skin.vertices.length*2),field=target.slice(),scratch=createArapScratch(skin.vertices,skin.triangles,1254,1254,skin.solver);
 applyCompiledSkinField(compiled,program.evaluate(resolved.pose),target);let error=null;try{solveArapSkin(scratch,target,field);}catch(e){error=String(e);}
 const folds:any[]=[];
 const area=(i:number,j:number,k:number,values:any)=>{const ax=values(i,0),ay=values(i,1),bx=values(j,0),by=values(j,1),cx=values(k,0),cy=values(k,1);return(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);};
 for(let t=0;t<skin.triangles.length;t+=3){const ids=skin.triangles.slice(t,t+3);const before=area(...ids as [number,number,number],(i:number,d:number)=>skin.vertices[i][d?'y':'x']);const after=area(...ids as [number,number,number],(i:number,d:number)=>scratch.position[i*2+d]);if(before*after<=0)folds.push({triangle:t/3,vertices:ids.map((i:number)=>({id:i,...skin.vertices[i]})),before,after});}
 results.push({factor,error,folds,stats:scratch.stats});
}
fs.writeFileSync(process.argv[2]!,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.map(r=>({factor:r.factor,error:r.error,folds:r.folds.map((f:any)=>({triangle:f.triangle,weights:f.vertices.map((v:any)=>v.weights)}))}))));
