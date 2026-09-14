import test from 'node:test';import assert from 'node:assert/strict';
import {applyPaintSkin,applyPaintPart,assertPaintPartShape,validatePaintSkin}from'./paint-skin.mjs';
const parts=[{id:'head',kind:'part',cutout:{x:0,y:0,width:20,height:20}},{id:'jaw',kind:'part',cutout:{x:0,y:0,width:20,height:20}}];
const data=()=>({schema:'cf.paint-skin/v1',vertices:[{x:2,y:2,weights:[['head',1]]},{x:18,y:2,weights:[['head',.5],['jaw',.5]]},{x:2,y:18,weights:[['jaw',1]]}],parts:['head','jaw'].map(id=>({id,vertices:[{triangle:[0,1,2],barycentric:[1,0,0]},{triangle:[0,1,2],barycentric:[0,1,0]},{triangle:[0,1,2],barycentric:[0,0,1]}],indices:[0,1,2]}))});
test('both source parts share exact deformation; rest reconstructs authored positions without patches',()=>{
 const s=data(),I=[1,0,0,1,0,0],field=new Float32Array(6),a=field.slice(),b=field.slice();validatePaintSkin(s,parts,20,20,['head','jaw']);
 applyPaintSkin(s,{head:I,jaw:I},20,20,field);for(let i=0;i<3;i++){assert.ok(Math.abs(field[i*2]*20-s.vertices[i].x)<1e-6);assert.ok(Math.abs(field[i*2+1]*20-s.vertices[i].y)<1e-6);}
 applyPaintSkin(s,{head:I,jaw:[1,0,0,1,.1,0]},20,20,field);for(const [part,out]of [[s.parts[0],a],[s.parts[1],b]])applyPaintPart(part,field,out);assert.deepEqual(a,b);
 const broken=b.slice();broken[2]+=.1;assert.notDeepEqual(a,broken); // independent rigid child breaks the shared join
 assert.throws(()=>applyPaintSkin(s,{head:I,jaw:[Infinity,0,0,1,0,0]},20,20,field),/matrix/);
});
test('foreign joints, missing source ownership, extrapolated UVs and corrupt indices refuse',()=>{
 for(const edit of [s=>s.vertices[0].weights=[['invented-fin',1]],s=>s.parts.pop(),s=>s.parts[0].vertices[0].barycentric=[2,-1,0],s=>s.parts[0].indices[0]=900,s=>s.vertices[0].weights=[['head',.4]]]){const s=data();edit(s);assert.throws(()=>validatePaintSkin(s,parts,20,20,['head','jaw']),/Paint skin/);}
});

test('a foldover fails on the actual posed triangle, while rest and rigid translation pass',()=>{
 const s=data(),field=new Float32Array(6),out=field.slice(),I=[1,0,0,1,0,0];applyPaintSkin(s,{head:I,jaw:I},20,20,field);applyPaintPart(s.parts[0],field,out);
 assert.doesNotThrow(()=>assertPaintPartShape(s.parts[0],s,out,20,20));for(let i=0;i<out.length;i+=2)out[i]+=.2;assert.doesNotThrow(()=>assertPaintPartShape(s.parts[0],s,out,20,20));
 [out[2],out[4]]=[out[4],out[2]];[out[3],out[5]]=[out[5],out[3]];assert.throws(()=>assertPaintPartShape(s.parts[0],s,out,20,20),/folded triangle/);
});
