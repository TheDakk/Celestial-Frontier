import assert from'node:assert/strict';import fs from'node:fs';import{observeFraming}from'./framing.mjs';
const mask=new Uint8Array(10000);mask[8*100+8]=mask[91*100+91]=1;
assert.equal(observeFraming(mask,100,100).status,'PASS_FRAMING_ONLY');
for(const [x,y]of [[7,50],[92,50],[50,7],[50,92]]){const bad=Uint8Array.from(mask);bad[y*100+x]=1;assert.equal(observeFraming(bad,100,100).status,'REFUSE');}
assert.equal(observeFraming(new Uint8Array(10000),100,100).status,'REFUSE');assert.throws(()=>observeFraming(mask,99,100),/raster shape/);
fs.writeFileSync(new URL('./framing-controls.json',import.meta.url),JSON.stringify({positive:'Exact eight-pixel margin in a 100-square mask',negative:['one pixel inside each of four protected margins','empty paint','wrong dimensions'],status:'PASS'},null,2)+'\n',{flag:'wx'});
