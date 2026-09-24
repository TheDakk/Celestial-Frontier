/** Instrumented-run oracle only. Never imported by the product. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {projectOrientations as referenceProjectOrientations} from '../solver-before/orientation-projector.mjs';

const reportFile=process.env.CF_EAGLE_S2_PARITY_REPORT;
assert(reportFile,'Explicit new orientation parity report path required');
assert(!fs.existsSync(reportFile),'New orientation parity report required');
const receipt={schema:'cf.orientation-boundary-parity/v1',status:'RUNNING',scope:'Every actual non-rigid S2 orientation invocation: retained pre-change JavaScript versus current implementation on identical pre-position and queue state. Exact Float64 bytes, Object.is coordinates, every queue field, returned pass count, refusal and immutable triangle inputs. Kernel-present counts report availability at entry, not proof of invocation. Instrumented timing is not CPU evidence.',calls:0,completedCalls:0,refusalPairs:0,coordinateComparisons:0,kernelPresentCalls:0,forwardKernelPresentCalls:0,activeKernelPresentCalls:0,negativeControls:[],failure:null};
const fail=message=>{throw Error('Orientation parity mismatch: '+message);};
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
const cloneQueue=q=>Object.fromEntries(Object.entries(q).map(([key,value])=>{
  if(ArrayBuffer.isView(value)&&!(value instanceof DataView))return[key,value.slice()];
  assert(value===null||['number','boolean','string','undefined'].includes(typeof value),'Queue must contain only typed arrays/scalars: '+key);
  return[key,value];
}));
function compareArray(actual,expected,label){
  if(actual.constructor!==expected.constructor||actual.length!==expected.length)fail(label+' shape/type');
  for(let i=0;i<actual.length;i++)if(!Object.is(actual[i],expected[i]))fail(label+' coordinate '+i);
  if(!bytes(actual).equals(bytes(expected)))fail(label+' byte representation');
}
function compareQueue(actual,expected){
  const keys=Object.keys(expected).sort();
  if(JSON.stringify(Object.keys(actual).sort())!==JSON.stringify(keys))fail('queue keys');
  for(const key of keys){
    const a=actual[key],b=expected[key];
    if(ArrayBuffer.isView(b))compareArray(a,b,'queue.'+key);
    else if(!Object.is(a,b))fail('queue.'+key);
  }
}
const refusal=error=>error?{name:error.name,message:error.message,code:error.code??null}:null;
function compareOutcome(actual,expected){
  compareArray(actual.position,expected.position,'position');
  compareQueue(actual.queue,expected.queue);
  if(!Object.is(actual.passes,expected.passes))fail('returned pass count');
  if(JSON.stringify(actual.refusal)!==JSON.stringify(expected.refusal))fail('refusal');
}
function comparatorControls(){
  const original={position:new Float64Array([1,-0,3,4]),queue:{starts:new Uint32Array([0,1]),incident:new Uint32Array([0]),heap:new Uint32Array([0]),location:new Int32Array([0]),priority:new Float64Array([.75]),size:1,projections:1,visits:1,stalled:false},passes:64,refusal:null};
  const clone=()=>({position:original.position.slice(),queue:cloneQueue(original.queue),passes:original.passes,refusal:original.refusal});
  compareOutcome(clone(),original);
  receipt.negativeControls.push({id:'identical-control',status:'PASS'});
  const controls=[
    ['one-bit-position',v=>{new Uint8Array(v.position.buffer)[0]^=1;}],
    ['one-bit-queue-priority',v=>{new Uint8Array(v.queue.priority.buffer)[0]^=1;}],
    ['one-bit-queue-visits',v=>{v.queue.visits^=1;}],
    ['one-bit-pass-count',v=>{v.passes^=1;}],
    ['signed-zero-position',v=>{v.position[1]=0;}],
    ['refusal-mismatch',v=>{v.refusal={name:'Error',message:'seeded refusal',code:null};}],
  ];
  for(const[id,mutate]of controls){const changed=clone();mutate(changed);assert.throws(()=>compareOutcome(changed,original),/Orientation parity mismatch/,'Comparator must reject '+id);receipt.negativeControls.push({id,status:'REJECTED_AS_REQUIRED'});}
  compareOutcome(clone(),original);
  receipt.negativeControls.push({id:'recovery-control',status:'PASS'});
}

process.on('exit',code=>{
  if(!receipt.failure&&code===0&&receipt.calls>0&&receipt.completedCalls===receipt.calls&&receipt.negativeControls.length===8)receipt.status='PASS_EXACT';
  else{receipt.status='FAIL';process.exitCode=process.exitCode||1;}
  fs.writeFileSync(reportFile,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
});
try{comparatorControls();}catch(error){receipt.failure={stage:'comparator-controls',message:String(error.stack??error)};throw error;}

export function verifyOrientationBoundary(currentProjectOrientations,s){
  receipt.calls++;
  if(s.orientationKernel){receipt.kernelPresentCalls++;receipt.forwardKernelPresentCalls++;}
  if(s.orientationActiveKernel)receipt.activeKernelPresentCalls++;
  const immutableNames=['triangleDofs','triangleSigns','triangleFloors','triangleMovable'];
  const immutable=Object.fromEntries(immutableNames.map(key=>[key,s[key].slice()]));
  const reference={...s,...immutable,position:s.position.slice(),orientationQueue:cloneQueue(s.orientationQueue)};
  let referencePasses,currentPasses,referenceError,currentError;
  try{referencePasses=referenceProjectOrientations(reference);}catch(error){referenceError=error;}
  try{currentPasses=currentProjectOrientations(s);}catch(error){currentError=error;}
  try{
    compareOutcome({position:s.position,queue:s.orientationQueue,passes:currentPasses,refusal:refusal(currentError)},{position:reference.position,queue:reference.orientationQueue,passes:referencePasses,refusal:refusal(referenceError)});
    for(const key of immutableNames)compareArray(s[key],immutable[key],'immutable '+key);
    receipt.coordinateComparisons+=s.position.length;
    receipt.completedCalls++;
    if(currentError)receipt.refusalPairs++;
  }catch(error){receipt.failure={stage:'orientation-boundary',call:receipt.calls,message:String(error.stack??error)};throw error;}
  if(currentError)throw currentError;
  return currentPasses;
}
