/** Snapshot interpolation and orientation inputs once; source topology and
 * thresholds remain those of applyPaintPart/assertPaintPartShape. Per-call
 * fields are always read again. Nothing is published until the full part passes. */
import {paintPartAreas} from './paint-skin.mjs';
const states=new WeakMap();
const fail=message=>{throw Error('Compiled paint part: '+message);};

export function createCompiledPaintPart(part,skin,width,height){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)fail('dimensions');
 if(!skin?.vertices?.length||!part?.vertices?.length||!part.indices?.length||part.indices.length%3)fail('source topology');
 const vertexCount=part.vertices.length,fieldLength=skin.vertices.length*2,groups=[[],[],[]],referenced=new Set();
 for(let i=0;i<vertexCount;i++){
  const v=part.vertices[i];if(!Array.isArray(v.triangle)||v.triangle.length!==3||!Array.isArray(v.barycentric)||v.barycentric.length!==3)fail('source interpolation');
  const entries=[];let sum=0;
  for(let k=0;k<3;k++){
   const index=v.triangle[k],weight=v.barycentric[k];
   if(!Number.isInteger(index)||index<0||index>=skin.vertices.length||!Number.isFinite(weight)||weight< -1e-8||weight>1+1e-8)fail('source interpolation');
   referenced.add(index*2);sum+=weight;if(weight!==0)entries.push([index*2,weight]);
  }
  if(!entries.length||Math.abs(sum-1)>1e-8)fail('interpolation sum');
  groups[entries.length-1].push({output:i*2,entries});
 }
 const compiled=groups.map((rows,group)=>{
  const count=group+1,outputs=new Uint32Array(rows.length),indices=new Uint32Array(rows.length*count),weights=new Float64Array(indices.length);
  rows.forEach((row,i)=>{outputs[i]=row.output;row.entries.forEach(([index,weight],k)=>{indices[i*count+k]=index;weights[i*count+k]=weight;});});
  return {count,outputs,indices,weights};
 });
 const triangles=new Uint32Array(part.indices.length);
 for(let i=0;i<triangles.length;i++){const index=part.indices[i];if(!Number.isInteger(index)||index<0||index>=vertexCount)fail('triangle index');triangles[i]=index*2;}
 const areas=paintPartAreas(part,skin);
 for(const area of areas)if(!Number.isFinite(area)||area===0)fail('degenerate source triangle');
 const state=Object.freeze({vertexCount,triangleCount:triangles.length/3,fieldLength});
 states.set(state,{id:String(part.id),width,height,compiled,referenced:Uint32Array.from(referenced),triangles,areas,scratch32:new Float32Array(vertexCount*2),scratch64:new Float64Array(vertexCount*2)});
 return state;
}

export function applyCompiledPaintPart(state,field,output){
 const data=states.get(state);if(!data)fail('unknown compiled state');
 if(!(field instanceof Float32Array||field instanceof Float64Array)||field.length!==state.fieldLength)fail('field buffer');
 if(!(output instanceof Float32Array||output instanceof Float64Array)||output.length!==state.vertexCount*2)fail('position buffer');
 // Include even zero-weight source references: the reference path reads them,
 // so a NaN cannot disappear solely because this compilation removes * 0.
 for(const index of data.referenced)if(!Number.isFinite(field[index])||!Number.isFinite(field[index+1]))fail('nonfinite field');
 const pending=output instanceof Float32Array?data.scratch32:data.scratch64;
 for(const group of data.compiled){
  const {count,outputs,indices,weights}=group;
  for(let i=0;i<outputs.length;i++){
   const offset=i*count,o=outputs[i],a=indices[offset];let x=0+field[a]*weights[offset],y=0+field[a+1]*weights[offset];
   if(count>1){const b=indices[offset+1];x+=field[b]*weights[offset+1];y+=field[b+1]*weights[offset+1];}
   if(count>2){const c=indices[offset+2];x+=field[c]*weights[offset+2];y+=field[c+1]*weights[offset+2];}
   pending[o]=x;pending[o+1]=y;
   if(!Number.isFinite(pending[o])||!Number.isFinite(pending[o+1]))fail('nonfinite interpolation');
  }
 }
 const {triangles,areas,width,height}=data;
 for(let i=0;i<triangles.length;i+=3){
  const a=triangles[i],b=triangles[i+1],c=triangles[i+2];
  const posed=((pending[b]-pending[a])*(pending[c+1]-pending[a+1])-(pending[b+1]-pending[a+1])*(pending[c]-pending[a]))*width*height;
  if(!Number.isFinite(posed)||posed/areas[i/3]<=0)throw Error('Paint skin folded triangle: '+data.id+' '+i/3);
 }
 output.set(pending);
}
