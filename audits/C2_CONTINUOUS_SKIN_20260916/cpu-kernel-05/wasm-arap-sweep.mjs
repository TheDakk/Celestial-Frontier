/** One optional memory-only sweep leaf. The JS solver remains the fallback. */
import{ARAP_SWEEP_BYTES}from'./arap-sweep-bytes.mjs';
const modules=new WeakMap(),need=(ok,why)=>{if(!ok)throw Error('ARAP Wasm sweep: '+why);};
function referenceSweep(rows,neighbours,reciprocals,position,rhs){for(let direction=0;direction<2;direction++)for(let step=0;step<reciprocals.length;step++){const row=direction?reciprocals.length-1-step:step,base=row*11,ii=rows[base],degree=rows[base+1],start=rows[base+2];let x=rhs[ii],y=rhs[ii+1];for(let k=0;k<degree;k++){const j=neighbours[start+k];x+=position[j];y+=position[j+1];}position[ii]=x*reciprocals[row];position[ii+1]=y*reciprocals[row];}}
/** Source arrays are snapshotted. Memory is fixed, never shared or grown; the
 * solver reads/writes these Float64 views directly, with no per-pass copy.
 * Runtime injection exists for capability/failure tests, not asset tuning. */
export function createWasmArapSweep(positionLength,rows,neighbours,reciprocals,runtime=globalThis.WebAssembly){
 need(Number.isInteger(positionLength)&&positionLength>=6&&positionLength<=80000&&positionLength%2===0,'position budget');
 need(rows instanceof Uint32Array&&rows.length%11===0&&rows.length<=440000&&neighbours instanceof Uint32Array&&neighbours.length<=1200000&&reciprocals instanceof Float64Array&&reciprocals.length===rows.length/11,'topology buffers');
 let previous=-1;for(let row=0;row<reciprocals.length;row++){const base=row*11,ii=rows[base],degree=rows[base+1],start=rows[base+2];need(ii>previous&&ii%2===0&&ii+1<positionLength&&degree>=2&&start+degree<=neighbours.length,'row');previous=ii;need(Number.isFinite(reciprocals[row])&&reciprocals[row]>0&&reciprocals[row]<=.5,'reciprocal');for(let k=0;k<degree;k++){const j=neighbours[start+k];need(j%2===0&&j+1<positionLength,'neighbor');if(k<8)need(rows[base+3+k]===j,'compiled neighbor');}}
 if(!runtime||typeof runtime.Module!=='function'||typeof runtime.Instance!=='function'||typeof runtime.Memory!=='function')return null;
 try{let module=modules.get(runtime);if(!module){module=new runtime.Module(ARAP_SWEEP_BYTES.slice());const im=runtime.Module.imports(module),ex=runtime.Module.exports(module);if(im.length!==1||im[0].module!=='env'||im[0].name!=='__linear_memory'||im[0].kind!=='memory'||ex.length!==1||ex[0].name!=='sweep'||ex[0].kind!=='function')return null;modules.set(runtime,module);}
  let end=16;const reserve=bytes=>{const at=(end+7)&~7;end=at+bytes;return at;},positionOffset=reserve(positionLength*8),rhsOffset=reserve(positionLength*8),rowsOffset=reserve(rows.byteLength),neighboursOffset=reserve(neighbours.byteLength),reciprocalsOffset=reserve(reciprocals.byteLength),pages=Math.ceil(end/65536),memory=new runtime.Memory({initial:pages,maximum:pages}),buffer=memory.buffer;
  const position=new Float64Array(buffer,positionOffset,positionLength),rhs=new Float64Array(buffer,rhsOffset,positionLength),fixedRows=new Uint32Array(buffer,rowsOffset,rows.length),fixedNeighbours=new Uint32Array(buffer,neighboursOffset,neighbours.length),fixedReciprocals=new Float64Array(buffer,reciprocalsOffset,reciprocals.length);fixedRows.set(rows);fixedNeighbours.set(neighbours);fixedReciprocals.set(reciprocals);
  const rowCount=reciprocals.length,instance=new runtime.Instance(module,{env:{__linear_memory:memory}}),leaf=instance.exports.sweep;if(typeof leaf!=='function')return null;const run=sweeps=>{need(Number.isInteger(sweeps)&&sweeps>=1&&sweeps<=32,'sweep budget');leaf(rowCount,sweeps,rowsOffset,neighboursOffset,reciprocalsOffset,positionOffset,rhsOffset);};
  // Admission is an exact semantic check on this topology, not benchmark
  // warmup. A broken/unsupported module falls back before any rig is exposed.
  for(let i=0;i<positionLength;i++){position[i]=(i%17-8)/16;rhs[i]=(i%13-6)/32;}const expected=position.slice();referenceSweep(rows,neighbours,reciprocals,expected,rhs);run(1);for(let i=0;i<positionLength;i++)if(!Object.is(expected[i],position[i]))return null;position.fill(0);rhs.fill(0);
  return Object.freeze({kind:'wasm',position,rhs,byteLength:buffer.byteLength,run});
 }catch{return null;}
}
