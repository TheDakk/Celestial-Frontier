import test from 'node:test';import assert from 'node:assert/strict';
import {intakeAuthoredPixels} from './authored-intake.mjs';
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
const fixture=(alpha)=>{const a=new Uint8ClampedArray(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const on=x>=8&&x<24&&y>=8&&y<24;a.set(on?[30,90,50,255]:alpha?[10,20,30,0]:[255,0,255,255],(y*32+x)*4);}return a;};
test('native alpha preserves every RGBA channel and old keying resurrects invisible background',()=>{const a=fixture(true),got=intakeAuthoredPixels(a,32,32);assert.deepEqual(got.rgba,a);assert.equal(got.alpha.filter(x=>x>0).length,256);const old=keyAndDespill(a,32,32);assert.equal(old.alpha.filter(x=>x>0).length,900);assert.notDeepEqual(old.rgba,a);});
test('opaque keyed sources retain the established intake result exactly',()=>{const a=fixture(false);assert.deepEqual(intakeAuthoredPixels(a,32,32),keyAndDespill(a,32,32));});
test('blank and mixed opaque-border exports refuse',()=>{assert.throws(()=>intakeAuthoredPixels(new Uint8ClampedArray(4096),32,32),/blank/);const a=fixture(true);a.set([255,0,255,255],14*4);assert.throws(()=>intakeAuthoredPixels(a,32,32),/opaque border/);});
