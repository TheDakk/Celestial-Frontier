import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sha256} from './kit-worker-expansion.mjs';import {admitPrecomputedKitText} from './kit-worker-engine.mjs';
test('phone worker uses pinned embedding, never imports tokenizer, and rejects repeat/four-session controls',async()=>{
 const source=fs.readFileSync(new URL('./kit-phone-stage-worker.mjs',import.meta.url),'utf8');assert.ok(!source.includes('Tokenizer'));assert.ok(!source.includes('tokenizers/'));
 const manifest=JSON.parse(fs.readFileSync(new URL('../../port/v2/apps/game/public/__local_ai/embeddings/earth-rain-v1.json',import.meta.url)));
 const bytes=fs.readFileSync(new URL('../../port/v2/apps/game/public/__local_ai/embeddings/earth-rain-v1.f16',import.meta.url));assert.equal(await sha256(bytes),manifest.dataSha256);
 const recipe=JSON.parse(fs.readFileSync(new URL('../../audits/ART_KIT_WEATHER_MAT_20260912/prepared/recipe.json',import.meta.url)));
 async function run(text){const messages=[],calls=[];const factory=async options=>{assert.equal(options.Tokenizer,undefined);await admitPrecomputedKitText(options.precomputedText,recipe.finisherPrompt);return {paint:async()=>{calls.push('paint');return {sessionCreates:{text,encode:1,denoise:1,decode:1}}},dispose(){calls.push('dispose');}};};
 const body=source.replace(/^import .*;$/gm,'');const onmessage=new Function('ort','createKitWorkerEngine','admitPrecomputedKitText','admitKitEngineJob','sha256','fetch','postMessage','let onmessage;'+body+';return onmessage;')({},factory,admitPrecomputedKitText,()=>{},sha256,async url=>({ok:true,json:async()=>manifest,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}),m=>messages.push(m));
 await onmessage({data:{stage:'kit-v4',requestId:1,recipe}});await onmessage({data:{stage:'kit-v4',requestId:2,recipe}});assert.equal(calls.filter(x=>x==='paint').length,1);assert.equal(messages.at(-1).type,'error');return messages[0];}
 assert.equal((await run(0)).type,'complete');assert.equal((await run(1)).type,'error');
});
