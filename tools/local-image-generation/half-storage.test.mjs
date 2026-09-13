import {test} from 'node:test';
import assert from 'node:assert/strict';
import {copyFloat16Bits,decodeFloat16} from './pipeline-math.mjs';
test('ORT half-precision storage preserves native values through an offset view',()=>{
  assert.equal(typeof Float16Array,'function','this qualification requires native half arrays');
  const backing=new Float16Array([99,1,-2,0.5,99]);
  const view=backing.subarray(1,4);
  const bits=copyFloat16Bits(view);
  assert.deepEqual([...bits],[0x3c00,0xc000,0x3800]);
  assert.deepEqual([...decodeFloat16(bits)],[1,-2,0.5]);
  assert.notDeepEqual([...new Uint16Array(view)],[...bits],'same ruler detects numeric conversion bug');
  view[0]=42;assert.equal(bits[0],0x3c00,'copy owns storage');
});
test('Uint16 fallback storage has the same value contract; other views refused',()=>{
  const bits=new Uint16Array([0,0x3c00,0xc000,0x3800,0]);
  assert.deepEqual([...copyFloat16Bits(bits.subarray(1,4))],[0x3c00,0xc000,0x3800]);
  assert.throws(()=>copyFloat16Bits(new Float32Array([1])),/expected/);
  assert.throws(()=>copyFloat16Bits(new DataView(new ArrayBuffer(2))),/expected/);
  assert.throws(()=>copyFloat16Bits(new Uint16Array()),/length/);
});
