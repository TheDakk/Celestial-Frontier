import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/node_modules/vite/dist/node/index.js';
import {Tokenizer} from '/Users/nick/Projects/celestial-frontier-openai-mac/tools/local-image-generation/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',out=root+'/audits/AI_SPECIES_MOBILE_20260909/prompt-preflight-01';
await fs.mkdir(out);const receipt={status:'FAIL',startedAt:new Date().toISOString(),inference:false,inputs:[]};let vite;
const sha=x=>createHash('sha256').update(x).digest('hex');
try{
 const set=JSON.parse(await fs.readFile(root+'/audits/AI_SPECIES_MOBILE_20260909/references/reference-set-v1.json','utf8'));
 vite=await createServer({root:root+'/port/v2/apps/game',configFile:root+'/port/v2/apps/game/vite.config.ts',mode:'evidence',server:{middlewareMode:true,hmr:false},appType:'custom'});
 const {buildLandfallConditioningV2}=await vite.ssrLoadModule('/src/landfall-conditioning.ts');
 const result=buildLandfallConditioningV2(set.sourceSnapshot);if(!result.ok)throw Error('CanonicalV2 compiler refused:'+result.reason);
 const manifest=JSON.parse(await fs.readFile(root+'/tools/local-image-generation/model-manifest.json','utf8'));
 const cache=root+'/port/v2/apps/game/smoke/local-image-generation/'+manifest.modelId.replaceAll('/','--')+'/'+manifest.revision;
 const read=async name=>{const pin=manifest.files.find(x=>x.path===name),bytes=await fs.readFile(cache+'/'+name);if(bytes.length!==pin.bytes||sha(bytes)!==pin.sha256)throw Error('Pinned tokenizer changed');receipt.inputs.push({path:name,bytes:bytes.length,sha256:sha(bytes)});return JSON.parse(bytes)};
 const tokenizer=new Tokenizer(await read('tokenizer/tokenizer.json'),await read('tokenizer/tokenizer_config.json'));
 const chat='<|im_start|>user\n'+result.recipe.prompt+'<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n';
 const tokens=tokenizer.encode(chat,{add_special_tokens:false}).ids;
 receipt.tokenCount=tokens.length;receipt.limit=512;receipt.promptSha256=sha(result.recipe.prompt);receipt.conditioningSha256=sha(result.canonicalJson);receipt.sourceSnapshotDigest=sha(result.snapshotKey);
 await fs.writeFile(out+'/conditioning-v2.json',result.canonicalJson+'\n');await fs.writeFile(out+'/prompt.txt',chat);
 if(tokens.length>512)throw Error('Canonical multi-reference prompt exceeds512; no truncation allowed');
 receipt.status='PASS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}finally{await vite?.close();receipt.finishedAt=new Date().toISOString();await fs.writeFile(out+'/result.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));}
