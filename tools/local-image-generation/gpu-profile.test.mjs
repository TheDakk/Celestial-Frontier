import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNativeProfile,createNativeProfileCapture,parseProofOptions,EXPECTED_ORT_VERSION,MAX_PROFILE_BYTES,MAX_PROFILE_EVENTS,MAX_PROFILE_GROUPS,MAX_PROFILE_EXAMPLES} from './gpu-profile.mjs';
const opts={ortVersion:EXPECTED_ORT_VERSION};
const event=(cat,name,dur,args={},extra={})=>({cat,name,dur,args,pid:cat==='Api'?-1:8,tid:cat==='Api'?-1:9,ts:100,ph:'X',...extra});
const fixture=()=>[
  event('Session','session_initialization',10000),
  event('Node','MatMulNBits_kernel_time',1300,{provider:'WebGpuExecutionProvider',op_name:'MatMulNBits'}),
  event('Node','Shape_kernel_time',7,{provider:'CPUExecutionProvider',op_name:'Shape'}),
  event('Api','node_linear_1_Q4&MatMulNBits&MatMulNBits',1100,{cache_key:'q8:shapeA',shapes:'[1, 2304, 128]'}),
  event('Api','node_linear_2_Q4&MatMulNBits&MatMulNBits',900,{cache_key:'q8:shapeA',shapes:'[1, 2304, 128]'}),
];
const parse=rows=>parseNativeProfile(JSON.stringify(rows),opts);

test('Native microseconds and host/GPU overlap remain separate, with actual CPU provider',()=>{
 const s=parse(fixture());assert.equal(s.unit,'microseconds');assert.equal(s.eventCount,5);
 assert.equal(s.nodeSpans.durationUs,1307);assert.equal(s.gpuDispatches.durationUs,2000);
 assert.equal(s.gpuDispatches.groups[0].count,2);assert.equal(s.gpuDispatches.groups[0].maxDurationUs,1100);
 assert.equal(s.nodeSpans.groups.find(x=>x.provider==='CPUExecutionProvider').durationUs,7);
 assert.equal(s.dropped,0);assert.equal(s.invalid,0);
});
test('Same program with different tensor dimensions is a distinct bounded group',()=>{
 const rows=fixture();rows.push(event('Api','node_linear_3_Q4&MatMulNBits&MatMulNBits',10,{cache_key:'B',shapes:'[1, 4096, 128]'}));
 assert.equal(parse(rows).gpuDispatches.groups.length,2);
});
test('More unique graph nodes than the unchanged group cap aggregate by actual op/program/shape',()=>{
 const rows=fixture().filter(x=>x.cat!=='Api'),dispatches=MAX_PROFILE_GROUPS+17;
 for(let i=0;i<dispatches;i++)rows.push(event('Api',`node_linear_${i}_Q4&MatMulNBits&MatMulNBits`,2,
   {cache_key:`weights-${i}`,shapes:'inputs[0] = {1,512,2560} outputs[0] = {1,512,9728} '}));
 const s=parse(rows),g=s.gpuDispatches.groups;
 assert.equal(g.length,1);assert.equal(g[0].opType,'MatMulNBits');assert.equal(g[0].programName,'MatMulNBits');
 assert.equal(g[0].count,dispatches);assert.equal(g[0].durationUs,2*dispatches);
 assert.equal(g[0].examples.length,MAX_PROFILE_EXAMPLES);
 assert.equal(g[0].examples[0].name,'node_linear_0_Q4&MatMulNBits&MatMulNBits');
 assert.equal(g[0].examples[2].cacheKey,'weights-2');
 assert.equal(s.eventCount,dispatches+3);assert.equal(s.dropped,0);
 // A real excess of distinct kernels/shapes still trips the same outcome ruler.
 for(let i=3;i<rows.length;i++)rows[i].args.shapes=`inputs[0] = {1,${i},2560} outputs[0] = {1,${i},9728} `;
 assert.throws(()=>parse(rows),/group limit/);
});
test('Different ops and programs stay distinct even when their node label and shapes agree',()=>{
 const rows=fixture();rows.push(event('Api','node_linear_1_Q4&MatMulNBits&MatMulNBitsTile',1,{cache_key:'tile',shapes:rows[3].args.shapes}));
 rows.push(event('Api','node_linear_1_Q4&MatMul&MatMulNBits',1,{cache_key:'other-op',shapes:rows[3].args.shapes}));
 assert.equal(parse(rows).gpuDispatches.groups.length,3);
});
test('Malformed native name contract cannot silently merge into a generic program group',()=>{
 for(const name of ['MatMulNBits','node&MatMulNBits','node&&MatMulNBits','&MatMulNBits&MatMulNBits','node&MatMulNBits&','node&extra&MatMulNBits&MatMulNBits']){
  const rows=fixture();rows[3].name=name;assert.throws(()=>parse(rows),/Invalid native GPU name/);
 }
});
test('Native stdout requires exact complete framing; partial end cannot pass',()=>{
 const c=createNativeProfileCapture(opts);c.begin();c.pushLine('[');
 const rows=fixture();rows.forEach((row,i)=>c.pushLine(JSON.stringify(row)+(i<rows.length-1?',':'')));
 assert.throws(()=>c.finish(),/Incomplete/);assert.equal(c.state,'capturing');
 assert.equal(c.pushLine(']'),true);const result=c.finish();assert.equal(result.state,'complete');
 assert.deepEqual(JSON.parse(result.rawJson),rows);assert.equal(result.summary.eventCount,5);
 assert.throws(()=>c.begin(),/already/);
});
test('Single multiline stdout message also retains complete actual bytes',()=>{
 const raw=JSON.stringify(fixture(),null,2)+'\n',c=createNativeProfileCapture(opts);c.begin();c.pushLine(raw);
 assert.equal(c.finish().rawJson,raw);
});
test('Missing GPU, missing Nodes, empty/zero GPU cannot become zero-cost success',()=>{
 const rows=fixture();for(const mutated of [[],rows.filter(x=>x.cat!=='Api'),rows.filter(x=>x.cat!=='Node'),rows.map(x=>({...x,dur:x.cat==='Api'?0:x.dur}))])assert.throws(()=>parse(mutated));
});
test('Malformed timestamps, JSEP fields, metadata and stale versions fail closed',()=>{
 for(const patch of [{dur:-1},{dur:NaN},{ts:Infinity},{dur:.5},{ph:'B'},{cat:'GPU'},{pid:-2},{args:{}},{name:''}]){
   const rows=fixture();rows[3]={...rows[3],...patch};assert.throws(()=>parse(rows));
 }
 assert.throws(()=>parseNativeProfile(JSON.stringify(fixture()),{ortVersion:'1.28.0'}),/exact/);
 assert.throws(()=>parse([{version:1,startTime:0,endTime:1000}]),/Invalid/);
 const rows=fixture();delete rows[1].args.provider;assert.throws(()=>parse(rows),/missing provider/);
});
test('Byte/event/group capacities reject a complete trace instead of truncating its admission',()=>{
 const raw=JSON.stringify(fixture());
 for(const cap of [{maxBytes:20},{maxEvents:4},{maxGroups:1}])assert.throws(()=>parseNativeProfile(raw,{...opts,...cap}),/limit/);
 for(const cap of [{maxBytes:MAX_PROFILE_BYTES+1},{maxEvents:MAX_PROFILE_EVENTS+1},{maxGroups:0},{maxBytes:1.5}])assert.throws(()=>createNativeProfileCapture({...opts,...cap}),/Invalid/);
 const c=createNativeProfileCapture({...opts,maxBytes:10});c.begin();c.pushLine('[');c.pushLine('0123456789');
 assert.equal(c.state,'failed');assert.equal(c.snapshot().dropped,1);assert.throws(()=>c.finish(),/capacity/);
});
test('Interleaved, malformed, trailing or interrupted stdout stays a retained failure',()=>{
 for(const lines of [['noise'],['[','not json',']']]){
  const c=createNativeProfileCapture(opts);c.begin();for(const line of lines)c.pushLine(line);
  assert.equal(c.state,'failed');assert.throws(()=>c.finish());assert.ok(c.snapshot().rawJson.length);
 }
 const c=createNativeProfileCapture(opts);c.begin();c.pushLine(JSON.stringify(fixture()));c.pushLine('extra');
 assert.throws(()=>c.finish(),/outside/);
 const partial=createNativeProfileCapture(opts);partial.begin();partial.pushLine('[');partial.fail('Deadline; no observed end');
 assert.throws(()=>partial.finish(),/Deadline/);assert.equal(partial.snapshot().rawJson,'[\n');
});
test('CLI profile is explicit; accepted reference variants retain their own meaning',()=>{
 assert.deepEqual(parseProofOptions(['out']),{output:'out',referenceEnabled:true,identityReference:false,identityOnly:false,preflight:false,profile:false,q8Block32:false,width:768,height:432});
 for(const extra of [[],['--identity-reference'],['--identity-only'],['--without-reference']])assert.equal(parseProofOptions(['out','--profile',...extra]).profile,true);
 assert.equal(parseProofOptions(['out','--preflight']).profile,false);
});
test('CLI rejects profile-only preflight, contradictory conditioning, duplicates and unknown flags',()=>{
 for(const args of [[],['a','b'],['a','--profile','--preflight'],['a','--profile','--profile'],['a','--without-reference','--identity-reference'],['a','--profiles']])assert.throws(()=>parseProofOptions(args));
});


test('Explicit larger output changes only the bounded dimensions; arbitrary sizes are refused',()=>{
 const normal=parseProofOptions(['out','--identity-reference']);
 const larger=parseProofOptions(['out','--identity-reference','--resolution=1024x576']);
 assert.deepEqual(larger,{...normal,width:1024,height:576});
 for(const flag of ['--resolution=0x0','--resolution=16384x16384','--resolution=1024x577'])assert.throws(()=>parseProofOptions(['out',flag]));
});


test('Q8 derivative is explicit, can be profiled, and cannot bypass model verification via preflight',()=>{
 assert.equal(parseProofOptions(['out']).q8Block32,false);
 assert.equal(parseProofOptions(['out','--q8-block32','--profile']).q8Block32,true);
 assert.throws(()=>parseProofOptions(['out','--q8-block32','--preflight']),/verified inference/);
});


test('Identity-only conditioning is explicit, exclusive, and preserves qualified dimensions',()=>{
 const normal=parseProofOptions(['out','--identity-only']);
 assert.deepEqual(normal,{output:'out',referenceEnabled:true,identityReference:false,identityOnly:true,
   preflight:false,profile:false,q8Block32:false,width:768,height:432});
 assert.deepEqual(parseProofOptions(['out','--identity-only','--resolution=1024x576']),{...normal,width:1024,height:576});
 assert.equal(parseProofOptions(['out','--identity-only','--preflight']).identityOnly,true);
 assert.equal(parseProofOptions(['out','--identity-only','--q8-block32','--profile']).identityOnly,true);
 for(const other of ['--identity-reference','--without-reference']){
  assert.throws(()=>parseProofOptions(['out','--identity-only',other]),/mutually exclusive/);
  assert.throws(()=>parseProofOptions(['out',other,'--identity-only']),/mutually exclusive/);
 }
 assert.throws(()=>parseProofOptions(['out','--identity-only','--identity-only']),/Usage/);
 assert.throws(()=>parseProofOptions(['out','--identity-only','--resolution=1024x577']),/Usage/);
});
