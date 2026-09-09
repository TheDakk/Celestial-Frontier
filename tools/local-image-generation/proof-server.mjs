import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBlock32Derivative} from './q8-block32.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'../..');
const sha=data=>createHash('sha256').update(data).digest('hex');
const prompt=`Create a cohesive natural-history landscape painting matching image 1's painted detail, atmosphere and shared lighting. A rainy Earth riverbank, mossy rocks, reflective river, deep misty forest and distant mountains. Six identifiable inhabitants belong naturally to the ground, never arranged as cutouts. Middle-right: one Civet with four short legs, a long low torso, pointed pale muzzle, small rounded ears, dark face mask, tawny spotted coat and a long ringed tail; not a fox or raccoon. Left water edge: one smaller brown furry Platypus, broad leathery duck bill, webbed feet and horizontal paddle tail. Foreground damp stone: one much smaller olive-brown Frog with folded hind legs. Left: a branching Persimmon tree, broad oval leaves, orange fruits with four-lobed calyx. Foreground: low creeping Cranberry runners with tiny oval leaves and red berries, never a tall shrub. Right: Devil's Club with very large palmate leaves, spiny canes and terminal red berry clusters. Calm broad composition; Civet about one third frame height. All six subjects in frame. Diffuse overcast light, cool sky fill, ground bounce, soft contact shadows, vegetation overlapping feet, softer contrast with distance. Real Earth anatomy and botany. No extra animals, alien plants, crystals, text, borders, interface, halos or shiny CGI.`;

// Explicit identity-only experiment; the existing scene/dual prompts stay unchanged.
const identityOnlyPrompt=`Create a cohesive natural-history landscape painting with shared environmental lighting. Image 1 is the authoritative identity of the single Civet: preserve its long narrow pale muzzle, amber eye, low deep torso, short sturdy legs, soft golden tawny fur, scattered dark spots and ringed tail. Integrate that individual into the riverbank; do not reproduce its portrait background, matte or edge artifacts. Keep the whole tail comfortably inside the frame. A rainy Earth riverbank, mossy rocks, reflective river, deep misty forest and distant mountains. Six identifiable inhabitants belong naturally to the ground, never arranged as cutouts. Middle-right: one Civet with four short legs, a long low torso, pointed pale muzzle, small rounded ears, dark face mask, tawny spotted coat and a long ringed tail; not a fox or raccoon. Left water edge: one smaller brown furry Platypus, broad leathery duck bill, webbed feet and horizontal paddle tail. Foreground damp stone: one much smaller olive-brown Frog with folded hind legs. Left: a branching Persimmon tree, broad oval leaves, orange fruits with four-lobed calyx. Foreground: low creeping Cranberry runners with tiny oval leaves and red berries, never a tall shrub. Right: Devil's Club with very large palmate leaves, spiny canes and terminal red berry clusters. Calm broad composition; Civet about one third frame height. All six subjects in frame. Diffuse overcast light, cool sky fill, ground bounce, soft contact shadows, vegetation overlapping feet, softer contrast with distance. Real Earth anatomy and botany. No extra animals, alien plants, crystals, text, borders, interface, halos or shiny CGI.`;

export async function createProofServer({cacheDir,canonical,identityReference=false,identityOnly=false,width=768,height=432,q8Block32=false,fixedDenoiserShapes=false}) {
  if(typeof fixedDenoiserShapes!=='boolean')throw Error('Invalid fixed denoiser shapes choice');
  if(typeof identityReference!=='boolean'||typeof identityOnly!=='boolean'||(identityReference&&identityOnly))
    throw Error('Invalid or conflicting identity conditioning choice');
  if(!((width===768&&height===432)||(width===1024&&height===576)))throw Error('Unqualified proof resolution');
  const manifest=JSON.parse(await fs.readFile(path.join(directory,'model-manifest.json'),'utf8'));
  if(typeof q8Block32!=='boolean')throw Error('Invalid derivative choice');
  const derivative=q8Block32?await openBlock32Derivative(manifest):null;
  const referencePath=path.join(root,'audits/MIDGAME_ART_DIRECTION_20260908/03-earth-full-landfall.png');
  const reference=identityOnly?null:await fs.readFile(referencePath);
  const identityPath=path.join(root,'audits/CREATURE_SCENE_COHESION_20260908/civet-selected-v1.webp');
  const identityPrompt=identityOnly?identityOnlyPrompt:identityReference
    ? prompt+' Image 2 is the authoritative Civet identity: match its long narrow pale pointed muzzle, warm amber eye, low deep torso, short sturdy legs, soft golden tawny fur and scattered dark spots. Preserve that individual, not the gray short-faced animal in image 1. Blend it naturally into the painted bank; do not copy image 2 background or edge artifacts. Keep the whole tail comfortably inside the frame.'
    : prompt;
  // The runner builds this from real domain owners in an isolated Node bundle.
  // This detached display snapshot is never installed as live roster authority.
  if(canonical?.receipt?.status!=='PASS'||canonical.receipt.workspaceReleased!==true
    ||canonical.snapshot?.schema!=='cf.art.landfall-snapshot.v1'
    ||canonical.snapshot.recipeId!=='canonical-earth-epoch0-six-residents-v1'
    ||canonical.snapshot.qualityAccepted!==false
    ||JSON.stringify(canonical.snapshot)!==canonical.canonicalJson
    ||sha(canonical.canonicalJson)!==canonical.receipt.snapshotSha256)throw Error('Unsupported canonical appearance export');
  const {request,roster,displayPlan}=canonical.snapshot;
  const authority=canonical.receipt.sources.find(row=>row.path==='port/v2/apps/game/src/earth-layered-recipe.ts');
  if(!authority)throw Error('Missing canonical Earth admission source');
  const recipe={schema:'cf.local-image-browser-proof/v1',modelId:manifest.modelId,modelRevision:manifest.revision,
    runtime:{onnxruntimeWeb:'1.29.0',tokenizers:'0.2.0'},width,height,steps:4,seed:133,
    prompt:identityPrompt,chatPrompt:'<|im_start|>user\n'+identityPrompt+'<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n',
    schedulerSource:'diffusers/040c7cde626504d14caf63b13b8b25b6a9f62120:compute_empirical_mu',
    sourceAuthoritySha256:authority.sha256,request,roster,
    appearanceSnapshot:{schema:canonical.snapshot.schema,recipeId:canonical.snapshot.recipeId,
      sha256:canonical.receipt.snapshotSha256,displayPlan},
    references:identityOnly?[]:[{url:'/reference.png',sha256:sha(reference),originalPath:path.relative(root,referencePath),width:512,height:288,
      transform:'Browser Canvas2D scale1672x941 to512x288, RGB[-1,1]; no crop or manual retouch'}],
    qualityAccepted:false,scope:'Authoring proof; model output does not alter authoritative game data'};
  if(derivative)recipe.modelDerivative=derivative.pin;
  if(fixedDenoiserShapes)recipe.fixedDenoiserShapes=true;
  if(identityReference||identityOnly){
    const identity=await fs.readFile(identityPath);
    if(sha(identity)!=='186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365')throw Error('Selected identity changed');
    recipe.references.push({url:'/identity.webp',sha256:sha(identity),originalPath:path.relative(root,identityPath),width:480,height:320,
      matte:'#72786e',transform:'Browser Canvas2D scale768x512 to480x320 over explicit opaque #72786e matte, RGB[-1,1]; original unchanged'});
  }
  const routes=new Map([
    ['/',path.join(directory,'browser-proof.html')],
    ...(identityOnly?[]:[['/reference.png',referencePath]]),
    ...['browser-proof.mjs','landing-progress.mjs','stage-worker.mjs','pipeline-math.mjs','gpu-profile.mjs','denoiser-shapes.mjs'].map(x=>['/'+x,path.join(directory,x)]),
    ...manifest.files.map(file=>['/model/'+file.path,path.join(cacheDir,file.path)]),
  ]);
  if(identityReference||identityOnly)routes.set('/identity.webp',identityPath);
  if(derivative)for(const row of derivative.files)routes.set('/model/'+row.path,row.file);
  const dist=path.join(directory,'node_modules/onnxruntime-web/dist');
  for(const name of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(name))routes.set('/node_modules/onnxruntime-web/dist/'+name,path.join(dist,name));
  routes.set('/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',path.join(directory,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
  const runtimeFiles=[];
  for(const [url,file]of routes)if(url.startsWith('/node_modules/')){
    const bytes=await fs.readFile(file);runtimeFiles.push({url,bytes:bytes.length,sha256:sha(bytes)});
  }
  const requests=[];
  const server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    requests.push({method:req.method,path:url.pathname,at:new Date().toISOString()});
    res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
    res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; worker-src 'self' blob:; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    if(url.pathname==='/recipe.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(recipe));return;}
    const file=routes.get(url.pathname);if(!file){res.writeHead(404);res.end();return;}
    try{
      const stat=await fs.stat(file);if(!stat.isFile())throw Error('Not a file');
      const extension=path.extname(file),types={'.html':'text/html','.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.webp':'image/webp'};
      res.setHeader('Content-Type',types[extension]??'application/octet-stream');res.setHeader('Content-Length',stat.size);
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {url:`http://127.0.0.1:${server.address().port}/`,recipe,requests,runtimeFiles,
    async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
