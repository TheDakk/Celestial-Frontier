import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendageOwnerGroup as group,matchNamedAppendages as match} from './limb-counter.mjs';
test('real named chains retain four/six independent limb owners',()=>{
 assert.equal(group('hindFarKnee'),'hindFar');assert.equal(group('hindNearFoot'),'hindNear');
 assert.equal(group('legHindFarFoot'),'legHindFar');assert.equal(group('armNearHand'),'armNear');
 for(const j of ['root','body','pelvis','spine','marker','remainder'])assert.equal(group(j),null);
 assert.equal(group('tail3'),'tail');assert.equal(group('jaw'),'head');
});
test('split reference component can assign two distinct real limbs',()=>assert.deepEqual(match([{k:0},{k:1}],[{id:'hindNear',edges:[0,1]},{id:'hindFar',edges:[0]}]),[{group:'hindFar',target:0},{group:'hindNear',target:1}]));
test('one chain cannot pay for two limbs or a duplicated fifth leg',()=>{
 assert.equal(match([{k:0},{k:1}],[{id:'hindNear',edges:[0,1]}]),null);
 assert.equal(match([0,1,2,3,4].map(k=>({k})),['foreNear','foreFar','hindNear','hindFar'].map(id=>({id,edges:[0,1,2,3,4]}))),null);
});
test('new appendage cannot steal the only owner of an already assigned one',()=>assert.equal(match([{k:0},{k:1}],[{id:'head',edges:[0,1]},{id:'tail',edges:[]}]),null));
test('unknown owner/absent tail cannot supply any matching edge',()=>assert.equal(match([{k:2}],[]),null));

// Outcome controls exercise the same inventory entry point as autoAuthor.
const {inventoryCheck}=await import('./limb-counter.mjs');
function fixture(extra=false){
 const n=extra?5:4,W=n*4,H=8,label=new Int32Array(W*H).fill(-1),appendages=[];
 for(let k=0;k<n;k++){appendages.push({k,frac:.1,class:'limb-down',attach:{relX:.2+k*.1,relY:1}});for(let y=0;y<H;y++)for(let x=k*4;x<k*4+3;x++)label[y*W+x]=k;}
 const names=['hindFar','hindNear','foreFar','foreNear'];
 const parts=names.map((joint,k)=>({id:joint,joint:joint+'Knee',polygonPx:[[k*4,0],[k*4+3,0],[k*4+3,H],[k*4,H]]}));
 const T={W,H,scale:1,label,appendages,ground:[],detached:[],params:{minDetachedFrac:.01}};
 const inventory=[{owners:names.slice(0,2),names:['leg'],frac:.2},{owners:names.slice(2),names:['leg'],frac:.2}];
 return{T,parts,inventory};
}
test('inventory recovers four painted legs from two joined reference components',()=>{
 const {T,parts,inventory}=fixture();
 const old=inventoryCheck(T,T,inventory,0,parts),fixed=inventoryCheck(T,T,inventory,0,parts,{referenceOwnerParts:parts});
 assert.equal(old.reasons.filter(r=>r.includes('unassigned')).length,2);
 assert.deepEqual(fixed.reasons,[]);assert.equal(fixed.namedAssignment.length,4);
});
test('inventory rejects a fifth leg even with a full-body remainder covering it',()=>{
 const {T,parts,inventory}=fixture(true),body={id:'body',joint:'root',polygonPx:[[0,0],[T.W,0],[T.W,T.H],[0,T.H]]};
 const r=inventoryCheck(T,T,inventory,0,[...parts,body],{referenceOwnerParts:[...parts,body],remainderPart:'body'});
 assert.ok(r.reasons.some(r=>r.includes('unassigned')));assert.equal(r.namedAssignment,undefined);
});
test('inventory rejects shifted owners instead of stealing a previous assignment',()=>{
 const {T,parts,inventory}=fixture();parts[1].polygonPx=parts[0].polygonPx;
 const r=inventoryCheck(T,T,inventory,0,parts,{referenceOwnerParts:parts});
 assert.ok(r.reasons.some(r=>r.includes('unassigned')));assert.equal(r.namedAssignment,undefined);
});
