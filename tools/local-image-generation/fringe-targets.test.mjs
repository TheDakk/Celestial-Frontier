import {test} from 'node:test';import assert from 'node:assert/strict';
import {fringeColourClass,selectFringeTargets} from './fringe-targets.mjs';import {despillUnresolvedEdges} from './edge-despill.mjs';
test('pink selection protects the cited sheen, pale paint and umber and confines the explicit pass',()=>{
 assert.equal(fringeColourClass(198,189,200,740,333,[{x0:705,x1:760,y0:318,y1:340}]),'excludedSheen');
 assert.equal(fringeColourClass(75,16,26,545,438),'excludedUmber');assert.equal(fringeColourClass(250,214,229,0,0),'excludedPale');
 assert.equal(fringeColourClass(214,58,139,0,0),'pinkBand');
 const w=48,h=24,raw=new Uint8ClampedArray(w*h*4);for(let y=5;y<19;y++)for(let x=4;x<44;x++)raw.set([85,70,25,255],(y*w+x)*4);
 const samples=[[8,[214,58,139,255]],[14,[198,189,200,255]],[20,[75,16,26,255]],[26,[250,214,229,255]],[38,[214,58,139,255]]];for(const [x,c]of samples)raw.set(c,(5*w+x)*4);
 const before=raw.slice(),selection=selectFringeTargets(raw,w,h,{rectangles:[{x0:4,x1:30,y0:4,y1:8}],sheenRects:[{x0:13,x1:15,y0:4,y1:8}]});
 assert.deepEqual(selection.counts,{pinkBand:2,excludedSheen:1,excludedPale:1,excludedUmber:1});assert.deepEqual(selection.targets,[5*w+8]);
 const result=despillUnresolvedEdges(raw,w,h,8,selection.targets);assert.equal(result.receipt.corrected.length,1);
 assert.deepEqual(raw,before);for(let i=0;i<w*h;i++){assert.equal(result.rgba[i*4+3],raw[i*4+3]);if(!selection.targets.includes(i))assert.deepEqual(result.rgba.slice(i*4,i*4+4),raw.slice(i*4,i*4+4));}
 // Unguarded historical selection incorrectly calls protected paint contaminated.
 assert.ok(despillUnresolvedEdges(raw,w,h,8).receipt.corrected.length>1);
 assert.throws(()=>selectFringeTargets(raw,w,h,{rectangles:[{x0:-1,x1:2,y0:0,y1:1}]}),/rectangle/);
});
