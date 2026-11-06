import test from'node:test';import assert from'node:assert/strict';import{resolveImpactFocus}from'./impact-focus.mjs';
test('impact exposure follows the struck side and leaves the attacker neutral',()=>{
 assert.deepEqual(resolveImpactFocus({flash:1,targetSide:'right',outcome:'hit'}),{sceneAlpha:.1,leftBrightness:1,rightBrightness:1.45});
 assert.deepEqual(resolveImpactFocus({flash:1,targetSide:'left',outcome:'hit'}),{sceneAlpha:.1,leftBrightness:1.45,rightBrightness:1});
 for(const targetSide of ['left','right'])for(const flash of [0,.1,.5,1]){const r=resolveImpactFocus({flash,targetSide,outcome:'hit'});assert.equal(r[targetSide==='left'?'rightBrightness':'leftBrightness'],1);assert.ok(r.sceneAlpha<=.1);}
});
test('explicit-time fading is history-free and cannot brighten a miss or reduced-motion turn',()=>{
 const sample=flash=>resolveImpactFocus({flash,targetSide:'left',outcome:'hit'}),expected=sample(.25);sample(1);sample(0);assert.deepEqual(sample(.25),expected);
 for(const outcome of ['miss','dodge'])assert.deepEqual(resolveImpactFocus({flash:1,targetSide:'right',outcome}),sample(0));
 assert.deepEqual(resolveImpactFocus({flash:1,targetSide:'right',outcome:'hit',reducedMotion:true}),sample(0));
 for(const flash of [NaN,Infinity,-.1,1.1])assert.throws(()=>sample(flash),/Invalid/);
 assert.throws(()=>resolveImpactFocus({flash:1,targetSide:'unknown',outcome:'hit'}),/Invalid/);
});
