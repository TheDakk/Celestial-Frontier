/** Optional exact Float64 forward sweeps. Fixed private topology; one input/output
 * position copy per call. The owner retains the full JS fallback and active set. */
import {ORIENTATION_FORWARD_BYTES} from './orientation-forward-bytes.mjs';
const modules=new WeakMap(),need=(ok,why)=>{if(!ok)throw Error('Orientation forward Wasm: '+why);};
function forwardProjection(s){const{position:p,triangleDofs,triangleSigns,triangleFloors,triangleMovable}=s;let orientationPasses=0;
 for(let pass=0;pass<s.orientationIterations;pass++){
  let changed=0,progressed=false;for(let k=0;k<triangleDofs.length;k+=3){
   const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],triangle=k/3,sign=triangleSigns[triangle],movable=triangleMovable[triangle];
   const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]),constraint=area*sign-triangleFloors[triangle];
   if(constraint>=0)continue;changed++;
   const ax=p[b+1]-p[c+1],ay=p[c]-p[b],bx=p[c+1]-p[a+1],by=p[a]-p[c],cx=p[a+1]-p[b+1],cy=p[b]-p[a];
   const norm=(movable&1?ax*ax+ay*ay:0)+(movable&2?bx*bx+by*by:0)+(movable&4?cx*cx+cy*cy:0);if(norm<1e-20)continue;
   const scale=-constraint*sign/norm;
   if(movable&1){const x=p[a],y=p[a+1];p[a]+=scale*ax;p[a+1]+=scale*ay;if(!Object.is(x,p[a])||!Object.is(y,p[a+1]))progressed=true;}
   if(movable&2){const x=p[b],y=p[b+1];p[b]+=scale*bx;p[b+1]+=scale*by;if(!Object.is(x,p[b])||!Object.is(y,p[b+1]))progressed=true;}
   if(movable&4){const x=p[c],y=p[c+1];p[c]+=scale*cx;p[c+1]+=scale*cy;if(!Object.is(x,p[c])||!Object.is(y,p[c+1]))progressed=true;}
  }
  // Repeating a sweep that changed no Float64 coordinate is an exact no-op,
  // including signed zero. Keep the final orientation refusal: a stalled
  // contradictory contact pose still fails and never publishes its pixels.
  orientationPasses=pass+1;if(!changed||!progressed){s.orientationQueue.stalled=!progressed;break;}
 }
 return orientationPasses;
}

export function createWasmOrientationForward(c,runtime=globalThis.WebAssembly){
 need(c&&c.position instanceof Float64Array&&c.position.length>=6&&c.position.length<=80000&&c.position.length%2===0,'position budget');
 const length=c.position.length,{triangleDofs:d,triangleSigns:signs,triangleFloors:floors,triangleMovable:movable}=c;
 need(d instanceof Uint32Array&&d.length>=3&&d.length<=600000&&d.length%3===0&&signs instanceof Int8Array&&floors instanceof Float64Array&&movable instanceof Uint8Array&&signs.length===d.length/3&&floors.length===signs.length&&movable.length===signs.length,'topology buffers');
 const count=floors.length;
 for(let t=0;t<count;t++){const a=d[t*3],b=d[t*3+1],v=d[t*3+2];need(a%2===0&&b%2===0&&v%2===0&&a+1<length&&b+1<length&&v+1<length&&a!==b&&a!==v&&b!==v,'triangle indices');need((signs[t]===1||signs[t]===-1)&&Number.isFinite(floors[t])&&floors[t]>0&&movable[t]<=7,'triangle constraints');}
 // Private incidence is derived from the validated immutable topology.
 const vertices=length/2,degree=new Uint32Array(vertices);
 for(const dof of d)degree[dof/2]++;
 const starts=new Uint32Array(vertices+1);for(let v=0;v<vertices;v++)starts[v+1]=starts[v]+degree[v];
 const cursor=starts.slice(),incident=new Uint32Array(d.length);
 for(let t=0;t<count;t++)for(let corner=0;corner<3;corner++)incident[cursor[d[t*3+corner]/2]++]=t;
 if(!runtime||typeof runtime.Module!=='function'||typeof runtime.Instance!=='function'||typeof runtime.Memory!=='function')return null;
 try{
  let module=modules.get(runtime);if(!module){module=new runtime.Module(ORIENTATION_FORWARD_BYTES.slice());const im=runtime.Module.imports(module),ex=runtime.Module.exports(module);if(im.length!==1||im[0].module!=='env'||im[0].name!=='__linear_memory'||im[0].kind!=='memory'||ex.length!==1||ex[0].name!=='forward'||ex[0].kind!=='function')return null;modules.set(runtime,module);}
  let end=16;const reserve=n=>{const at=(end+7)&~7;end=at+n;return at;},pOffset=reserve(length*8),dOffset=reserve(d.byteLength),signOffset=reserve(signs.byteLength),floorOffset=reserve(floors.byteLength),movableOffset=reserve(movable.byteLength),startsOffset=reserve(starts.byteLength),incidentOffset=reserve(incident.byteLength),dirtyOffset=reserve(count),pages=Math.ceil(end/65536),memory=new runtime.Memory({initial:pages,maximum:pages}),buffer=memory.buffer;
  const p=new Float64Array(buffer,pOffset,length),fixedD=new Uint32Array(buffer,dOffset,d.length),fixedSigns=new Int8Array(buffer,signOffset,count),fixedFloors=new Float64Array(buffer,floorOffset,count),fixedMovable=new Uint8Array(buffer,movableOffset,count);
  fixedD.set(d);fixedSigns.set(signs);fixedFloors.set(floors);fixedMovable.set(movable);new Uint32Array(buffer,startsOffset,starts.length).set(starts);new Uint32Array(buffer,incidentOffset,incident.length).set(incident);
  const leaf=new runtime.Instance(module,{env:{__linear_memory:memory}}).exports.forward;if(typeof leaf!=='function')return null;
  let stalled=false;
  const run=(position,iterations)=>{
   need(position instanceof Float64Array&&position.length===length,'position buffer');need(Number.isInteger(iterations)&&iterations>=1&&iterations<=64,'sweep budget');
   p.set(position);const result=leaf(pOffset,dOffset,signOffset,floorOffset,movableOffset,count,iterations,startsOffset,incidentOffset,dirtyOffset),passes=result&127;
   need(Number.isInteger(result)&&result>=1&&result<=192&&passes>=1&&passes<=iterations,'invalid result');
   stalled=Boolean(result&128);position.set(p);return passes;
  };
  // Exercise the actual snapshotted topology once with a deterministic folded
  // non-identity pose. No pose cache or previous-frame result is retained.
  for(const reflection of [1,-1]){
   const probe=new Float64Array(length);for(let i=0;i<length;i++)probe[i]=((i*37)%101-50)/16*(i%2?reflection:1);
   const expected={position:probe.slice(),triangleDofs:fixedD,triangleSigns:fixedSigns,triangleFloors:fixedFloors,triangleMovable:fixedMovable,orientationIterations:3,orientationQueue:{stalled:false}},passes=forwardProjection(expected);
   if(run(probe,3)!==passes||stalled!==expected.orientationQueue.stalled)return null;
   for(let i=0;i<length;i++)if(!Object.is(probe[i],expected.position[i]))return null;
  }
  p.fill(0);stalled=false;
  return Object.freeze({kind:'wasm',run,get stalled(){return stalled;},byteLength:buffer.byteLength});
 }catch{return null;}
}
