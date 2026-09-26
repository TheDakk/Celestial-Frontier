import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createProofServer} from './proof-server.mjs';
import {parseProofOptions} from './gpu-profile.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const packet=path.join(root,'audits/LOCAL_AV_AI_CONTINUATION_20260909');
const readJson=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const canonicalDirectory=path.join(packet,'browser-canonical-snapshot-preflight-02/canonical-input');
// Defined retained transport fixture only: this test does not manufacture a
// branded live roster or claim a fresh source export/canonical admission.
const canonicalJson=await fs.readFile(path.join(canonicalDirectory,'canonical-snapshot.json'),'utf8');
const canonical={snapshot:JSON.parse(canonicalJson),canonicalJson,
  receipt:await readJson(path.join(canonicalDirectory,'manifest.json'))};
const priorDefault=await readJson(path.join(packet,'browser-preflight/recipe.json'));
const priorDual=await readJson(path.join(packet,'browser-canonical-snapshot-preflight-02/recipe.json'));
const cacheDir=path.join(root,'smoke/identity-conditioning-unused-cache');
const sha=data=>createHash('sha256').update(data).digest('hex');
async function withServer(options,review){
  const server=await createProofServer({cacheDir,canonical,...options});
  try{return await review(server);}finally{await server.close();}
}
async function servedRecipe(server){
  const response=await fetch(new URL('recipe.json',server.url));
  assert.equal(response.status,200);
  const recipe=await response.json();
  assert.deepEqual(recipe,server.recipe);
  return recipe;
}

test('Actual default server recipe preserves retained scene prompt and generation inputs',async()=>{
  await withServer({},async server=>{
    const recipe=await servedRecipe(server);
    // The versioned appearance snapshot was added after this earlier default
    // reference receipt; all of its existing fields must remain exact.
    assert.deepEqual(recipe,{...priorDefault,appearanceSnapshot:priorDual.appearanceSnapshot});
    assert.equal(recipe.prompt,priorDefault.prompt);
    assert.equal(recipe.chatPrompt,priorDefault.chatPrompt);
    assert.equal(recipe.references.length,1);
    assert.equal(recipe.references[0].url,'/reference.png');
    assert.equal((await fetch(new URL('identity.webp',server.url))).status,404);
  });
});

test('Actual dual-reference server recipe remains byte-identical to its retained canonical recipe',async()=>{
  await withServer({identityReference:true},async server=>{
    const recipe=await servedRecipe(server);
    assert.equal(JSON.stringify(recipe),JSON.stringify(priorDual));
    assert.equal(recipe.references.length,2);
    assert.equal(recipe.references[0].url,'/reference.png');
    assert.equal(recipe.references[1].url,'/identity.webp');
  });
});

test('Identity-only actual server serves one exact Civet reference and no full-scene image',async()=>{
  const options=parseProofOptions(['unused','--identity-only','--resolution=1024x576']);
  await withServer({identityOnly:options.identityOnly,width:options.width,height:options.height},async server=>{
    const recipe=await servedRecipe(server);
    assert.deepEqual(recipe,{...priorDual,width:1024,height:576,prompt:recipe.prompt,
      chatPrompt:recipe.chatPrompt,references:[priorDual.references[1]]});
    assert.deepEqual(recipe.references,[{url:'/identity.webp',
      sha256:'186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365',
      originalPath:'audits/CREATURE_SCENE_COHESION_20260908/civet-selected-v1.webp',
      width:480,height:320,matte:'#72786e',
      transform:'Browser Canvas2D scale768x512 to480x320 over explicit opaque #72786e matte, RGB[-1,1]; original unchanged'}]);
    assert.match(recipe.prompt,/Image 1 is the authoritative identity of the single Civet/);
    assert.match(recipe.prompt,/do not reproduce its portrait background, matte or edge artifacts/);
    assert.doesNotMatch(recipe.prompt,/Image 2|image 1's painted detail|gray short-faced animal/);
    const landscape=priorDefault.prompt.slice(priorDefault.prompt.indexOf('A rainy Earth riverbank'));
    assert.ok(recipe.prompt.endsWith(landscape),'all prior six-resident/world/composition wording is retained');
    for(const resident of ['Civet','Platypus','Frog','Persimmon','Cranberry',"Devil's Club"])
      assert.ok(recipe.prompt.includes(resident));
    assert.equal(recipe.chatPrompt,'<|im_start|>user\n'+recipe.prompt+'<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n');
    // Real Qwen token-count admission remains the existing 512-token worker
    // boundary and the root's pinned-tokenizer check; characters are no proxy.
    assert.equal(recipe.qualityAccepted,false);
    assert.equal((await fetch(new URL('reference.png',server.url))).status,404);
    const response=await fetch(new URL('identity.webp',server.url));
    assert.equal(response.status,200);
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length,179816);
    assert.equal(sha(bytes),recipe.references[0].sha256);
    assert.ok(server.requests.every(row=>!row.path.startsWith('/model/')),'recipe controls never load model weights');
  });
});

test('Server rejects conflicting or nonboolean identity modes before starting',async()=>{
  for(const options of [{identityReference:true,identityOnly:true},{identityOnly:'true'},{identityReference:'true'}])
    await assert.rejects(()=>createProofServer({cacheDir,canonical,...options}),/conditioning choice/);
});
