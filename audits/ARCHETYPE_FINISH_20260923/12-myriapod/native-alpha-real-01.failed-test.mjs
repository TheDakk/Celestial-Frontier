import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import test from 'node:test';import {createRequire} from 'node:module';import{createHash}from'node:crypto';
import {positiveAlphaBox} from '../../../port/v2/tools/battle2-proof/positive-alpha-box.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),require=createRequire(path.join(root,'port/v2/package.json')),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs'),sha=b=>createHash('sha256').update(b).digest('hex');
test('retained fit11 key includes its positive-alpha fringe without modifying source bytes',()=>{
 const file=path.join(import.meta.dirname,'fit-11/parts/keyed.png'),bytes=fs.readFileSync(file),im=PNG.sync.read(bytes),box=positiveAlphaBox(im.data,im.width,im.height),before=sha(im.data);
 assert.deepEqual([im.width,im.height],[1254,1254]);assert.deepEqual(box,{x:39,y:50,width:1189,height:1148});
 let positive=0,above8=0;const old=im.data.slice();for(let i=3;i<old.length;i+=4){if(old[i]>0)positive++;if(old[i]>8)above8++;else old[i]=0;}
 assert.equal(positive,178726);assert.equal(above8,140406);assert.equal(positive-above8,38320);assert.deepEqual(positiveAlphaBox(old,im.width,im.height),{x:41,y:413,width:1185,height:460});assert.equal(sha(im.data),before);assert.equal(sha(fs.readFileSync(file)),sha(bytes));
 const receipt={schema:'cf.native-positive-alpha-sizing/v1',status:'PASS_SIZING_INPUT_ONLY',file,sha256:sha(bytes),width:im.width,height:im.height,positiveAlphaPixels:positive,priorAbove8Pixels:above8,priorExcludedPositivePixels:positive-above8,box,priorBox:positiveAlphaBox(old,im.width,im.height),pixelsUnchanged:true,scope:'Rest-size helper qualification only; no browser, publication, CPU or native containment claim.'};
 fs.writeFileSync(path.join(import.meta.dirname,'native-alpha-real-01.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
});
