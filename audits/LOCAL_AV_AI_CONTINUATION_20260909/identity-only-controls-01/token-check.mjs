import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Tokenizer} from '../../../tools/local-image-generation/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';
import {createProofServer} from '../../../tools/local-image-generation/proof-server.mjs';
import {DEFAULT_CACHE_ROOT} from '../../../tools/local-image-generation/fetch-model.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const sha=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(await fs.readFile(path.join(root,'tools/local-image-generation/model-manifest.json'),'utf8'));
const cacheDir=path.join(DEFAULT_CACHE_ROOT,manifest.modelId.replace('/','--'),manifest.revision);
const inputs=[];
for(const name of ['tokenizer/tokenizer.json','tokenizer/tokenizer_config.json']){
 const pin=manifest.files.find(row=>row.path===name),bytes=await fs.readFile(path.join(cacheDir,name));
 assert.equal(bytes.length,pin.bytes);assert.equal(sha(bytes),pin.sha256);inputs.push(JSON.parse(bytes));
}
const fixture=path.join(root,'audits/LOCAL_AV_AI_CONTINUATION_20260909/browser-canonical-snapshot-preflight-02/canonical-input');
const canonicalJson=await fs.readFile(path.join(fixture,'canonical-snapshot.json'),'utf8');
const canonical={canonicalJson,snapshot:JSON.parse(canonicalJson),receipt:JSON.parse(await fs.readFile(path.join(fixture,'manifest.json'),'utf8'))};
const server=await createProofServer({cacheDir,canonical,identityOnly:true,width:1024,height:576});
try{
 const recipe=server.recipe,tokenizer=new Tokenizer(...inputs),ids=tokenizer.encode(recipe.chatPrompt,{add_special_tokens:false}).ids;
 const result={status:'FAIL',modelRevision:manifest.revision,promptSha256:sha(recipe.prompt),chatPromptSha256:sha(recipe.chatPrompt),tokenCount:ids.length,maximumTokens:512,truncated:false,referenceCount:recipe.references.length,reference:recipe.references[0]};
 await fs.writeFile(path.join(here,'recipe.json'),JSON.stringify(recipe,null,2)+'\n',{flag:'wx'});
 assert.ok(ids.length>0&&ids.length<=512);assert.equal(recipe.references.length,1);assert.equal(recipe.references[0].url,'/identity.webp');
 result.status='PASS';await fs.writeFile(path.join(here,'TOKEN_CHECK.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:result.status,tokenCount:result.tokenCount,promptSha256:result.promptSha256}));
}finally{await server.close();}
