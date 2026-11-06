import test from 'node:test';
import assert from 'node:assert/strict';
import {assessOfflineWorkerReply} from './run-offline-runtime.mjs';
test('admits one exact existing early guard reply; synthetic control only',()=>assert.doesNotThrow(()=>assessOfflineWorkerReply([{type:'error',message:'Error: Profile option must be boolean\n at onmessage'}])));
test('rejects no response, duplicates, completion, progress and unrelated failures',()=>{for(const input of [null,[],[{type:'complete',message:'Error: Profile option must be boolean'}],[{type:'error',message:'Error: Unknown stage'}],[{type:'progress',message:'Error: Profile option must be boolean'}],[{type:'error',message:'Error: Profile option must be boolean'},{}]])assert.throws(()=>assessOfflineWorkerReply(input));});
