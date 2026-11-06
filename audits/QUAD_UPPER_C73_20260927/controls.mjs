import assert from'node:assert/strict';import fs from'node:fs';import{placeUpperAxis}from'./upper-axis.mjs';
const parts=['root','spine','chest','neck','head','foot','tail'].map(id=>({id,joint:id})),landmarks={pelvis:[.1,.5],spine:[.3,.5],chest:[.5,.5],neck:[.7,.3],head:[.9,.2]},labels=new Uint8Array(10000).fill(1);
for(const [id,x,y]of [[2,20,50],[3,48,50],[4,65,35],[5,88,20],[6,55,80],[7,5,50]])labels[y*100+x]=id;
labels[20*100+88]=4;labels[20*100+89]=5;labels[40*100+60]=3;const saved=labels.slice(),result=placeUpperAxis({labels,width:100,height:100,parts,landmarks});
assert.ok(result.receipt.moved>0);assert.deepEqual(labels,saved);assert.equal(result.labels[20*100+88],5);assert.equal(result.labels[40*100+60],4);
for(let i=0;i<labels.length;i++)if(![3,4].includes(labels[i]))assert.equal(result.labels[i],labels[i]);
for(const bad of [{...landmarks,head:[.2,.2]},{...landmarks,head:[NaN,.2]}])assert.throws(()=>placeUpperAxis({labels,width:100,height:100,parts,landmarks:bad}));
assert.throws(()=>placeUpperAxis({labels,width:100,height:100,parts:[...parts,{id:'duplicate',joint:'neck'}],landmarks}));
fs.writeFileSync(new URL('./controls.json',import.meta.url),JSON.stringify({positive:'known nearest axis owner, preserved foreign labels/input',negative:['reversed axis','nonfinite joint','duplicate owner'],status:'PASS'},null,2)+'\n',{flag:'wx'});
