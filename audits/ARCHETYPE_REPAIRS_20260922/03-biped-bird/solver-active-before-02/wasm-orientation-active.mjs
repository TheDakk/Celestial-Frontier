/** Optional exact active-set leaf. Fixed private topology, original incident
 * update order (including duplicates), and transactional mutable-state copies. */
import {ORIENTATION_ACTIVE_BYTES} from './orientation-active-bytes.mjs';
import {runOrientationActiveReference} from './orientation-active-reference.mjs';
const modules=new WeakMap(),need=(ok,why)=>{if(!ok)throw Error('Orientation active Wasm: '+why);};
const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
export function createWasmOrientationActive(c,runtime=globalThis.WebAssembly){
 need(c&&c.position instanceof Float64Array&&c.position.length>=6&&c.position.length<=80000&&c.position.length%2===0,'position budget');
 const length=c.position.length,{triangleDofs:d,triangleSigns:signs,triangleFloors:floors,triangleMovable:movable,orientationQueue:q}=c;
 need(d instanceof Uint32Array&&d.length>=3&&d.length<=600000&&d.length%3===0&&signs instanceof Int8Array&&floors instanceof Float64Array&&movable instanceof Uint8Array&&signs.length===d.length/3&&floors.length===signs.length&&movable.length===signs.length,'topology buffers');
 const count=floors.length,vertices=length/2;
 need(q&&q.starts instanceof Uint32Array&&q.starts.length===vertices+1&&q.incident instanceof Uint32Array&&q.incident.length===d.length,'incidence buffers');
 const degree=new Uint32Array(vertices);
 for(let t=0;t<count;t++){const a=d[t*3],b=d[t*3+1],v=d[t*3+2];need(a%2===0&&b%2===0&&v%2===0&&a+1<length&&b+1<length&&v+1<length&&a!==b&&a!==v&&b!==v,'triangle indices');need((signs[t]===1||signs[t]===-1)&&Number.isFinite(floors[t])&&floors[t]>0&&movable[t]<=7,'triangle constraints');degree[a/2]++;degree[b/2]++;degree[v/2]++;}
 need(q.starts[0]===0,'incidence origin');for(let v=0;v<vertices;v++)need(q.starts[v+1]===q.starts[v]+degree[v],'incidence offsets');
 const cursor=q.starts.slice();for(let t=0;t<count;t++)for(let corner=0;corner<3;corner++)need(q.incident[cursor[d[t*3+corner]/2]++]===t,'incident traversal order');
 const queueBuffers=queue=>need(queue&&queue.heap instanceof Uint32Array&&queue.location instanceof Int32Array&&queue.priority instanceof Float64Array&&queue.heap.length===count&&queue.location.length===count&&queue.priority.length===count,'queue buffers');
 queueBuffers(q);
 if(!runtime||typeof runtime.Module!=='function'||typeof runtime.Instance!=='function'||typeof runtime.Memory!=='function')return null;
 try{
  let module=modules.get(runtime);if(!module){module=new runtime.Module(ORIENTATION_ACTIVE_BYTES.slice());const im=runtime.Module.imports(module),ex=runtime.Module.exports(module);if(im.length!==1||im[0].module!=='env'||im[0].name!=='__linear_memory'||im[0].kind!=='memory'||ex.length!==1||ex[0].name!=='active'||ex[0].kind!=='function')return null;modules.set(runtime,module);}
  let end=16;const reserve=n=>{const at=(end+7)&~7;end=at+n;return at;};
  const pOffset=reserve(length*8),dOffset=reserve(d.byteLength),signOffset=reserve(signs.byteLength),floorOffset=reserve(floors.byteLength),movableOffset=reserve(movable.byteLength),startsOffset=reserve(q.starts.byteLength),incidentOffset=reserve(q.incident.byteLength),heapOffset=reserve(count*4),locationOffset=reserve(count*4),priorityOffset=reserve(count*8),stateOffset=reserve(12),pages=Math.ceil(end/65536),memory=new runtime.Memory({initial:pages,maximum:pages}),buffer=memory.buffer;
  const p=new Float64Array(buffer,pOffset,length),fixedD=new Uint32Array(buffer,dOffset,d.length),fixedSigns=new Int8Array(buffer,signOffset,count),fixedFloors=new Float64Array(buffer,floorOffset,count),fixedMovable=new Uint8Array(buffer,movableOffset,count),starts=new Uint32Array(buffer,startsOffset,q.starts.length),incident=new Uint32Array(buffer,incidentOffset,q.incident.length),heap=new Uint32Array(buffer,heapOffset,count),location=new Int32Array(buffer,locationOffset,count),priority=new Float64Array(buffer,priorityOffset,count),state=new Uint32Array(buffer,stateOffset,3);
  fixedD.set(d);fixedSigns.set(signs);fixedFloors.set(floors);fixedMovable.set(movable);starts.set(q.starts);incident.set(q.incident);
  const leaf=new runtime.Instance(module,{env:{__linear_memory:memory}}).exports.active;if(typeof leaf!=='function')return null;
  const run=(position,queue,iterations)=>{
   need(position instanceof Float64Array&&position.length===length,'position buffer');queueBuffers(queue);need(Number.isInteger(iterations)&&iterations>=1&&iterations<=64,'sweep budget');
   // This leaf owns the whole active stage, entered after the owner's reset and
   // forward pass. Stale inactive heap/priority bytes deliberately remain inputs.
   need(queue.size===0&&queue.visits===0&&queue.projections===0&&queue.location.every(x=>x===-1),'active stage must start from reset queue');
   p.set(position);heap.set(queue.heap);location.set(queue.location);priority.set(queue.priority);state[0]=queue.size;state[1]=queue.projections;state[2]=queue.visits;
   const result=leaf(pOffset,dOffset,signOffset,floorOffset,movableOffset,startsOffset,incidentOffset,heapOffset,locationOffset,priorityOffset,stateOffset,count,iterations);
   need(Number.isInteger(result)&&result>=0&&result<=iterations&&state[0]<=count&&state[2]<=count*iterations&&state[1]<=state[2]&&result===Math.ceil(state[2]/count),'invalid result');
   for(let i=0;i<state[0];i++)need(heap[i]<count&&location[heap[i]]===i,'invalid heap');
   for(let t=0;t<count;t++)need(location[t]===-1||(location[t]>=0&&location[t]<state[0]&&heap[location[t]]===t),'invalid location');
   // A trap or rejected result above leaves every caller byte/scalar untouched.
   position.set(p);queue.heap.set(heap);queue.location.set(location);queue.priority.set(priority);queue.size=state[0];queue.projections=state[1];queue.visits=state[2];return result;
  };
  for(const reflection of [1,-1]){
   const probe=new Float64Array(length);for(let i=0;i<length;i++)probe[i]=((i*37)%101-50)/16*(i%2?reflection:1);
   const probeQueue=()=>({starts,incident,heap:Uint32Array.from({length:count},(_,i)=>count+i),location:new Int32Array(count).fill(-1),priority:Float64Array.from({length:count},(_,i)=>i%2?-0:i),size:0,projections:0,visits:0,stalled:false});
   const expected={position:probe.slice(),triangleDofs:fixedD,triangleSigns:fixedSigns,triangleFloors:fixedFloors,triangleMovable:fixedMovable,orientationIterations:2,orientationQueue:probeQueue()},actual=probeQueue(),wanted=runOrientationActiveReference(expected);
   if(run(probe,actual,2)!==wanted||!equal(probe,expected.position))return null;
   for(const key of ['heap','location','priority'])if(!equal(actual[key],expected.orientationQueue[key]))return null;
   for(const key of ['size','projections','visits','stalled'])if(!Object.is(actual[key],expected.orientationQueue[key]))return null;
  }
  return Object.freeze({kind:'wasm',run,byteLength:buffer.byteLength});
 }catch{return null;}
}
