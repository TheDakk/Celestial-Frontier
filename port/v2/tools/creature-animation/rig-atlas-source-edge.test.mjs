import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {packRigAtlas} from './rig-atlas.mjs';
import {exactAtlasGutters} from './atlas-source-edge-gutters.mjs';
const req=createRequire(import.meta.url),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const edgeAlpha of [0,64,255])test(`actual packed extrusion preserves exact source edge RGBA at alpha ${edgeAlpha}`,()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-source-edge-'));
 try{
  const source=new PNG({width:5,height:5});
  for(let y=0;y<5;y++)for(let x=0;x<5;x++)source.data.set(x===0||y===0||x===4||y===4?[200,80,30,edgeAlpha]:[30,170,240,255],(y*5+x)*4);
  const bytes=PNG.sync.write(source),sourceFile=path.join(root,'source.png');fs.writeFileSync(sourceFile,bytes);
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({creatureId:'edge-fixture',parts:[{name:'edge.png',path:'source.png',sha256:hash(bytes)}]}));
  packRigAtlas(path.join(root,'manifest.json'),path.join(root,'atlas'));
  const packed=PNG.sync.read(fs.readFileSync(path.join(root,'atlas/edge-fixture.png'))),frame=JSON.parse(fs.readFileSync(path.join(root,'atlas/edge-fixture.json'))).frames['edge.png'].frame;
  // Use actual accepted inner texels as the source: transparent hidden RGB is immaterial.
  const pixel=(x,y)=>[...packed.data.subarray(((frame.y+y)*packed.width+frame.x+x)*4,((frame.y+y)*packed.width+frame.x+x)*4+4)];
  for(let y=-1;y<=5;y++)for(let x=-1;x<=5;x++)if(x<0||y<0||x===5||y===5)
   assert.deepEqual(pixel(x,y),pixel(Math.max(0,Math.min(4,x)),Math.max(0,Math.min(4,y))),`gutter ${x},${y} must copy exact nearest source edge`);
  for(let y=0;y<5;y++)for(let x=0;x<5;x++)assert.equal(pixel(x,y)[3],source.data[(y*5+x)*4+3],'inner source alpha changed');
  assert.equal(hash(fs.readFileSync(sourceFile)),hash(bytes),'source master changed');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

const options={extrude:1,scale:1,allowRotation:false,allowTrim:false};
const frame={frame:{x:2,y:2,w:5,h:5},rotated:false,trimmed:false,sourceSize:{w:5,h:5},spriteSourceSize:{x:0,y:0,w:5,h:5}};
test('padding copies only edge texels and leaves the source and non-gutter bytes exact',()=>{
 const rgba=Buffer.alloc(9*9*4,88);for(let y=2;y<7;y++)for(let x=2;x<7;x++)rgba.set([200,80,30,x===2?64:255],(y*9+x)*4);
 const before=Buffer.from(rgba),a=exactAtlasGutters(rgba,9,9,{part:frame},options);assert.deepEqual(rgba,before);assert.equal(a.ringTexels,24);
 for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(!(x>=1&&x<=7&&y>=1&&y<=7&&(x===1||x===7||y===1||y===7)))assert.deepEqual(a.rgba.subarray((y*9+x)*4,(y*9+x)*4+4),before.subarray((y*9+x)*4,(y*9+x)*4+4));
 assert.deepEqual(exactAtlasGutters(a.rgba,9,9,{part:frame},options).rgba,a.rgba);
 assert.deepEqual([...a.rgba.subarray((3*9+1)*4,(3*9+1)*4+4)],[200,80,30,64]);
});
test('unsafe atlas layouts and unsupported packing modes refuse without input mutation',()=>{
 const rgba=Buffer.alloc(9*9*4),before=Buffer.from(rgba),bad=structuredClone(frame);bad.frame.x=0;
 for(const run of [()=>exactAtlasGutters(rgba,9,9,{part:bad},options),()=>exactAtlasGutters(rgba,9,9,{a:frame,b:frame},options),()=>exactAtlasGutters(rgba,9,9,{part:frame},{...options,extrude:0}),()=>exactAtlasGutters(rgba,9,9,{part:frame},{...options,scale:2}),()=>exactAtlasGutters(rgba,9,9,{part:{...frame,rotated:true}},options),()=>exactAtlasGutters(rgba,9,9,{part:{...frame,trimmed:true}},options),()=>exactAtlasGutters(rgba,8,9,{part:frame},options)]){assert.throws(run);assert.deepEqual(rgba,before);}
});
