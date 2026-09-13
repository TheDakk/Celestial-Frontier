import test from 'node:test';import assert from 'node:assert/strict';import {requireTenSecondMedia} from './capture-contract.mjs';
test('independent media duration rejects first short recordings and missing/overlong evidence',()=>{
 for(const seconds of [8.316351,8.316587,9.875067,0,NaN,Infinity,11])assert.throws(()=>requireTenSecondMedia(seconds),/Encoded capture/);
 for(const seconds of [10,10.1,10.75])assert.equal(requireTenSecondMedia(seconds),seconds);
});
