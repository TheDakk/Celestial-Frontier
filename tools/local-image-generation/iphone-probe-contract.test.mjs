import {test} from 'node:test';import assert from 'node:assert/strict';
import {admitPhysicalPhone} from './iphone-probe-contract.mjs';
test('requested physical iPhone is admitted; wrong platform, form, version and missing/true simulator markers fail',()=>{
 const cap={platformName:'iOS','safari:deviceType':'iPhone','safari:useSimulator':false,'safari:platformVersion':'26.6.2','safari:deviceUDID':'explicit-test-fixture'};
 assert.equal(admitPhysicalPhone(cap),cap);
 for(const [key,value]of [['platformName','macOS'],['safari:deviceType','iPad'],['safari:platformVersion','26.5'],['safari:useSimulator',true],['safari:useSimulator',undefined],['safari:deviceUDID','']])assert.throws(()=>admitPhysicalPhone({...cap,[key]:value}),/Wrong physical device/);
});
