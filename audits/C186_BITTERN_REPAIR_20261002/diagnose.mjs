import fs from 'node:fs';import assert from 'node:assert/strict';
import {record,bindings,card,at,local} from './context.mjs';
const {createPaintPublication}=await import('./diagnostic-publication.mjs');
const b=bindings.painter,pub=createPaintPublication(record,b,card.realm),sample=at(local);let error;
try{pub.publish(sample.pose,sample.context);}catch(e){error=e.message;}assert.equal(error,'ARAP skin: unresolved folded triangles: 3');
const {scratch:s}=pub.debug(),skin=b.paintSkin,rows=[];
for(let k=0;k<s.triangles.length;k+=3){const ids=Array.from(s.triangles.slice(k,k+3)),[a,c,d]=ids.map(i=>i*2),p=s.position,ratio=((p[c]-p[a])*(p[d+1]-p[a+1])-(p[c+1]-p[a+1])*(p[d]-p[a]))/s.areas[k/3];if(ratio>0)continue;
rows.push({triangle:k/3,ids,ratio,vertices:ids.map(i=>({index:i,...skin.vertices[i],pinned:!!s.pins[i],target:[s.target[i*2],s.target[i*2+1]],posed:[p[i*2],p[i*2+1]]})),parts:skin.parts.filter(part=>part.vertices.some(v=>v.triangle.some(i=>ids.includes(i)))).map(part=>({id:part.id,joint:b.parts.find(x=>x.id===part.id)?.joint}))});}
fs.writeFileSync('audits/C186_BITTERN_REPAIR_20261002/diagnosis.json',JSON.stringify({status:'ORIGINAL_REFUSAL_REPRODUCED',error,geometry:record.geometry,landmarks:record.landmarks,rows,solver:skin.solver},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
