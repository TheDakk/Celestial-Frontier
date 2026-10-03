import test from 'node:test';import assert from 'node:assert/strict';import {traceRegion} from './leaf-growth.mjs';
test('empty source region refuses instead of tracing the unvisited background as whole-canvas paint',()=>{
 const empty=new Uint8Array(16*16);assert.equal(traceRegion(empty,16,16),null);assert.ok(empty.every(x=>x===0));
 const region=empty.slice();for(let y=4;y<11;y++)for(let x=3;x<10;x++)region[y*16+x]=1;const contour=traceRegion(region,16,16);assert.ok(contour&&contour.length>=3);assert.ok(contour.every(([x,y])=>x>=3&&x<=10&&y>=4&&y<=11));
 region.fill(0);assert.equal(traceRegion(region,16,16),null,'erasing the measured source removes the contour');
});
