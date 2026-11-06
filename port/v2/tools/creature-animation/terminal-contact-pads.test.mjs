import test from 'node:test';
import assert from 'node:assert/strict';
import {familyContract,familyContactChains} from './family-contracts.mjs';
import {validateTerminalContactPads} from './terminal-contact-pads.mjs';

const chains=familyContactChains(familyContract('hopper'));
const authored={foreNearAnkle:[1002.5,756.5],foreFarAnkle:[1175.5,709.5],hindNearAnkle:[95.5,999.5],hindFarAnkle:[85.5,789.5]};
function fixture(){
 const points=Object.fromEntries(Object.entries(authored).map(([joint,xy])=>[joint,xy.map(v=>v/1254)]));
 const record={geometry:{width:1254,height:1254,contactPads:{schema:'cf.terminal-pad-support/v1',kind:'adhesive',points}}};
 const alpha=new Uint8Array(1254*1254);
 for(const [x,y]of Object.values(authored))alpha[Math.floor(y)*1254+Math.floor(x)]=1;
 return {record,alpha};
}

test('absence preserves the legacy result without inspecting new-model arguments',()=>{
 for(const record of [undefined,null,{}, {geometry:{}}, {geometry:{width:0,height:NaN}}])assert.equal(validateTerminalContactPads(record,null,new Uint8Array(0)),undefined);
 const {record}=fixture();record.geometry.contactPads=undefined;
 assert.throws(()=>validateTerminalContactPads(record,chains),/declaration object/);
});

test('the actual hopper inventory accepts explicit positive-alpha anchors without inference or mutation',()=>{
 const {record,alpha}=fixture(),before=structuredClone(record),bytes=alpha.slice();
 assert.deepEqual(chains.map(c=>c.end).sort(),Object.keys(authored).sort());
 const parsed=validateTerminalContactPads(record,chains,alpha);
 assert.deepEqual(parsed,record.geometry.contactPads);assert.notEqual(parsed,record.geometry.contactPads);
 assert.deepEqual(record,before);assert.deepEqual(alpha,bytes);
 assert(Object.isFrozen(parsed)&&Object.isFrozen(parsed.points));
 for(const point of Object.values(parsed.points))assert(Object.isFrozen(point));
 assert.throws(()=>{parsed.points.foreNearAnkle[0]=0;},TypeError);
 assert.deepEqual(validateTerminalContactPads(record,chains),parsed,'sealing without alpha uses the same complete declaration');
});

test('the exact declared pixel must contain paint; neighboring paint cannot admit a transparent point',()=>{
 const {record,alpha}=fixture(),[x,y]=authored.foreNearAnkle,index=Math.floor(y)*1254+Math.floor(x);
 alpha[index]=0;alpha[index+1]=255;
 assert.throws(()=>validateTerminalContactPads(record,chains,alpha),/outside painted alpha: foreNearAnkle/);
 alpha[index]=1;assert(validateTerminalContactPads(record,chains,alpha));
 assert.throws(()=>validateTerminalContactPads(record,chains,new Uint8Array(alpha.length-1)),/alpha dimensions or type/);
 assert.throws(()=>validateTerminalContactPads(record,chains,new Uint8ClampedArray(alpha.length)),/alpha dimensions or type/);
});

test('closed source boundaries choose their own edge pixel and do not search inward',()=>{
 const {record}=fixture();record.geometry.width=2;record.geometry.height=2;
 const corners=[[0,0],[1,0],[0,1],[1,1]];chains.forEach((chain,i)=>record.geometry.contactPads.points[chain.end]=corners[i]);
 const alpha=new Uint8Array([1,1,1,1]);assert(validateTerminalContactPads(record,chains,alpha));
 alpha[3]=0;assert.throws(()=>validateTerminalContactPads(record,chains,alpha),/outside painted alpha/);
});

test('unknown schemas, malformed payloads and non-exact contact inventories fail closed',()=>{
 const mutations=[
  r=>r.geometry.contactPads=null,r=>r.geometry.contactPads=[],
  r=>r.geometry.contactPads.schema='cf.terminal-pad-support/v2',
  r=>r.geometry.contactPads.kind='ground',r=>r.geometry.contactPads.extra=true,
  r=>r.geometry.contactPads.points=[],r=>r.geometry.contactPads.points=null,
  r=>delete r.geometry.contactPads.points.foreNearAnkle,
  r=>r.geometry.contactPads.points.foreNearPaw=[.5,.5],
  r=>r.geometry.contactPads.points[Symbol('hidden')]=[.5,.5],
 ];
 for(const mutate of mutations){const {record}=fixture();mutate(record);assert.throws(()=>validateTerminalContactPads(record,chains),/Terminal contact pads:/);}
 for(const invalidChains of [[],null,[...chains,chains[0]],chains.map(c=>({...c,terminal:null})),chains.map(c=>({...c,terminal:c.end}))]){
  const {record}=fixture();assert.throws(()=>validateTerminalContactPads(record,invalidChains),/Terminal contact pads:/);
 }
});

test('invalid numbers, sparse coordinates and unusable source dimensions cannot be admitted',()=>{
 const badPoints=[[NaN,.5],[Infinity,.5],[-Infinity,.5],[-.001,.5],[1.001,.5],[.5],new Array(2),['0.5',.5],null,{0:.5,1:.5,length:2}];
 for(const point of badPoints){const {record}=fixture();record.geometry.contactPads.points.foreNearAnkle=point;assert.throws(()=>validateTerminalContactPads(record,chains),/Terminal contact pads:/);}
 for(const value of [0,-1,1.5,NaN,Infinity,'1254',Number.MAX_SAFE_INTEGER]){
  const {record}=fixture();record.geometry.width=value;assert.throws(()=>validateTerminalContactPads(record,chains),/source dimensions/);
 }
});
