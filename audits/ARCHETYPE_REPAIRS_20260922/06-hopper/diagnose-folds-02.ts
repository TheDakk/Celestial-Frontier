/** Read-only inspection of recorded failed poses. Does not publish geometry or certify a fit. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {familyContractForRecord} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../../port/v2/tools/creature-animation/arap-skin.mjs';

const root='/Users/nick/Projects/celestial-frontier-openai-mac';
const base=path.join(root,'audits/ARCHETYPE_REPAIRS_20260922/06-hopper');
const output=path.join(base,'fold-diagnosis-02.json');
if(fs.existsSync(output))throw Error('New diagnosis output required');
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const inputs=new Map<string,string>();
const read=(relative:string)=>{const file=path.join(base,relative),bytes=fs.readFileSync(file);inputs.set(file,hash(bytes));return JSON.parse(bytes.toString());};
const record=read('fit-02/record.json'),binding=read('fit-02/binding.json'),report=read('static-02.json');
const skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height;
const program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks);
const compiled=createCompiledSkinField(skin,w,h),pins=new Set<number>(skin.solver.pins);
const triangleOwners=new Map<string,Set<string>>(),vertexOwners=new Map<number,Set<string>>();
const key=(v:number[])=>v.slice().sort((a,b)=>a-b).join(',');
for(const part of skin.parts){
 for(let k=0;k<part.fieldTriangles.length;k+=3){const tri=part.fieldTriangles.slice(k,k+3),id=key(tri);if(!triangleOwners.has(id))triangleOwners.set(id,new Set());triangleOwners.get(id)!.add(part.id);}
 for(const v of part.vertices)for(const id of v.triangle){if(!vertexOwners.has(id))vertexOwners.set(id,new Set());vertexOwners.get(id)!.add(part.id);}
}
const area=(xy:ArrayLike<number>,a:number,b:number,c:number)=>(xy[b*2]-xy[a*2])*(xy[c*2+1]-xy[a*2+1])-(xy[b*2+1]-xy[a*2+1])*(xy[c*2]-xy[a*2]);
const rows=[...report.rows,...report.presentation?[report.presentation]:[]].filter(row=>row.firstRefusal?.error?.startsWith('RecoverablePoseError: ARAP skin:'));
const findings=[];
for(const row of rows){
 const refusal=row.firstRefusal;
 if(!refusal.error.startsWith('RecoverablePoseError: ARAP skin:'))throw Error('Only stored ARAP failures are supported: '+row.id);
 const scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver);
 const target=new Float32Array(skin.vertices.length*2),published=new Float32Array(target.length).fill(123);
 applyCompiledSkinField(compiled,program.evaluate(refusal.pose),target);
 let error:string|null=null;try{solveArapSkin(scratch,target,published);}catch(e){error=String(e);}
 const folded=[];
 for(let k=0;k<skin.triangles.length;k+=3){
  const tri=skin.triangles.slice(k,k+3),ratio=area(scratch.position,...tri)/scratch.areas[k/3];
  if(Number.isFinite(ratio)&&ratio>0)continue;
  let nearby=new Set<number>(tri);for(let round=0;round<2;round++){const next=new Set(nearby);for(const i of nearby)for(let j=scratch.starts[i];j<scratch.starts[i+1];j++)next.add(scratch.neighbours[j]);nearby=next;}
  folded.push({triangle:k/3,indices:tri,parts:[...(triangleOwners.get(key(tri))??[])],ratio,
   vertices:tri.map((i:number)=>({index:i,restPx:[skin.vertices[i].x,skin.vertices[i].y],targetPx:[target[i*2]*w,target[i*2+1]*h],privateFailedPx:[scratch.position[i*2],scratch.position[i*2+1]],pinned:pins.has(i),weights:skin.vertices[i].weights,parts:[...(vertexOwners.get(i)??[])]})),
   nearbyPins:[...nearby].filter(i=>pins.has(i)).sort((a,b)=>a-b).map(i=>({index:i,restPx:[skin.vertices[i].x,skin.vertices[i].y],weights:skin.vertices[i].weights,parts:[...(vertexOwners.get(i)??[])]}))});
 }
 const partCounts:Record<string,number>={};for(const f of folded)for(const p of f.parts)partCounts[p]=(partCounts[p]??0)+1;
 findings.push({row:row.id,recordedMs:refusal.ms,recordedError:refusal.error.split('\n')[0],replayedError:error,stats:{...scratch.stats},outputUnpublished:published.every(v=>v===123),partCounts,folded});
}
const receipt={schema:'cf.failed-pose-fold-diagnosis/v1',scope:'One targeted diagnostic of stored failed poses; private rejected ARAP scratch only, no published fit/acceptance claim',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,findings,inputs:[...inputs].map(([file,sha256])=>({file,sha256,unchanged:hash(fs.readFileSync(file))===sha256}))};
if(receipt.inputs.some(input=>!input.unchanged))throw Error('Input changed during diagnosis');
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,findings:findings.map(({folded,...f})=>({...f,foldedCount:folded.length}))},null,2));
