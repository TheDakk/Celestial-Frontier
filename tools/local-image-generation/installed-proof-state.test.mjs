import {test} from 'node:test';import assert from 'node:assert/strict';
import {installedProofState,retainedReloadReady} from './installed-proof-state.mjs';
test('scheduled install redraw may leave the initial view briefly; terminal failure still fails',()=>{
 const initial='Download / resume model Verify browser copy';
 const oracle=classify=>{assert.equal(classify(initial,false),'pending');assert.equal(classify('Pause model preparation',false),'working');assert.equal(classify(initial,true),'failed');assert.equal(classify('Model ready. Land to finish a painting.',true),'ready');};
 oracle(installedProofState);
 assert.throws(()=>oracle((text,started)=>installedProofState(text,true))); // Former early-terminal assumption.
 assert.throws(()=>oracle((text,started)=>installedProofState(text,false))); // Never noticing terminal failure.
});

test('reload restoration must belong to the new document; departing page and absent API controls fail',()=>{
 const s={localAi:{originalId:'retained',crossfading:false,alpha:1}};
 const oracle=f=>{assert.equal(f(s,'retained',1,2),true);assert.equal(f(s,'retained',1,1),false);assert.equal(f(undefined,'retained',1,2),false);assert.equal(f(s,'another',1,2),false);};
 oracle(retainedReloadReady);assert.throws(()=>oracle((s,id,old,now)=>retainedReloadReady(s,id,0,now)));
});
