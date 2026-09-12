import {test} from 'node:test';import assert from 'node:assert/strict';
import {installedProofState} from './installed-proof-state.mjs';
test('scheduled install redraw may leave the initial view briefly; terminal failure still fails',()=>{
 const initial='Download / resume model Verify browser copy';
 const oracle=classify=>{assert.equal(classify(initial,false),'pending');assert.equal(classify('Pause model preparation',false),'working');assert.equal(classify(initial,true),'failed');assert.equal(classify('Model ready. Land to finish a painting.',true),'ready');};
 oracle(installedProofState);
 assert.throws(()=>oracle((text,started)=>installedProofState(text,true))); // Former early-terminal assumption.
 assert.throws(()=>oracle((text,started)=>installedProofState(text,false))); // Never noticing terminal failure.
});
