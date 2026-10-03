import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';import{pathToFileURL}from'node:url';
import{repoRelativeSource}from'../../../port/v2/tools/creature-animation/record-source.mjs';
import{sha,jsonHash,validateManifest,SUCCESSOR_OWNER_FILES}from'./validate-v2.mjs';
import{canonicalPath}from'./input-contract.mjs';
const requireV2=createRequire(new URL('../../../port/v2/package.json',import.meta.url)),{rolldown}=await import(pathToFileURL(requireV2.resolve('rolldown')).href);
const root=path.resolve(import.meta.dirname,'../../..'),base=path.relative(root,import.meta.dirname),output=process.argv[2]??base+'/prepared-v2';
if(fs.existsSync(output))throw Error('New preparation directory required');fs.mkdirSync(output,{recursive:true});
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-c163-all-pairs-')),sources=new Map(),remember=file=>{const p=path.relative(root,path.resolve(file));if(p.startsWith('../'))throw Error('External source');if(sources.has(p))return;const b=fs.readFileSync(file);sources.set(p,{path:p,sha256:sha(b),bytes:b.length});};
let bundle;
try{
 bundle=await rolldown({input:base+'/prepare-entry.ts',platform:'node',plugins:[{name:'audit-source-receipt',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id))remember(id);}}]});await bundle.write({file:scratch+'/owners.mjs',format:'es'});await bundle.close();bundle=null;
 const owner=await import(pathToFileURL(scratch+'/owners.mjs').href),fits=[];
 bundle=await rolldown({input:base+'/native-entry.mjs',platform:'browser',plugins:[{name:'audit-native-source-receipt',resolveId(id){if(id==='pixi.js')return requireV2.resolve(id);if(id.startsWith('cf-proof/'))return path.resolve(root,'port/v2/apps/game/src',id.slice(9));},transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id))remember(id);}}]});await bundle.write({file:scratch+'/native-bundle.js',format:'es'});await bundle.close();bundle=null;
 const nativeBundleSha256=sha(fs.readFileSync(scratch+'/native-bundle.js'));
 for(const f of owner.BATTLE2_PARTS_FITS){
  const dir=canonicalPath('audits/ARENA_EFFECTS_V42_PROOF_20260912/'+f.dir),record=JSON.parse(fs.readFileSync(dir+'/record.json')),binding=JSON.parse(fs.readFileSync(dir+'/binding.json')),manifest=JSON.parse(fs.readFileSync(dir+'/parts/manifest.json'));
  if(record.identity.earthName!==f.earthName)throw Error('Fit identity differs');
  const inputs=[dir+'/record.json',dir+'/binding.json',dir+'/parts/manifest.json',dir+'/parts/keyed.png',dir+'/parts/atlas/'+manifest.creatureId+'.png',repoRelativeSource(record.source)];
  const markingsDir=f.markingsDir?canonicalPath('audits/ARENA_EFFECTS_V42_PROOF_20260912/'+f.markingsDir):dir;
  if(fs.existsSync(markingsDir+'/markings.json')){inputs.push(markingsDir+'/markings.json');const markings=JSON.parse(fs.readFileSync(markingsDir+'/markings.json'));for(const v of Object.values(markings.patterns??{}))if(v?.file)inputs.push(path.posix.normalize(markingsDir+'/'+v.file));}
  let declaration=null,declarationPath=null;if(f.weaponDeclaration){const p=path.posix.normalize('audits/ARENA_EFFECTS_V42_PROOF_20260912/'+f.weaponDeclaration);declarationPath=p;inputs.push(p);declaration=JSON.parse(fs.readFileSync(p));}
  for(const p of inputs)remember(p);
  const baseCard=owner.compileBodyCard(record,record.genome),card=f.contactSupports==='observed'?owner.withPaintedContactSupports(baseCard,record,binding):baseCard;
  fits.push({name:f.earthName,dir,markingsDir,supports:f.contactSupports??'default',declaration,declarationPath,habitat:owner.resolvePhysicalHabitat(record),card,inputs});
 }
 if(fits.length!==38)throw Error('Explicit roster changed; new scope review required');
 const worldDescriptors={dry:{key:'c163-representative-temperate',biome:'temperate',seed:133,solid:true,atmosphere:true,liquid:null,surfaceWater:false},surface:{key:'c163-representative-surface-interface',biome:'temperate',seed:133,solid:true,atmosphere:true,liquid:'water',surfaceWater:true},lake:{key:'c163-representative-lake',biome:'temperate',seed:133,solid:true,atmosphere:true,liquid:'water',surfaceWater:true},coral:{key:'c163-representative-coral',biome:'coral',seed:133,solid:true,atmosphere:true,liquid:'water',surfaceWater:true}};
 const worlds=Object.fromEntries(Object.entries(worldDescriptors).map(([k,w])=>[k,{...w,signature:'Explicit audit representative '+k+' world; not a live encounter or every habitat',cardHash:jsonHash(w)}]));
 fs.writeFileSync(output+'/worlds.json',JSON.stringify({schema:'cf.c163-representative-worlds/v1',scope:'Audit source fixtures for pair coverage, not a claim about every canonical habitat',worlds},null,2)+'\n',{flag:'wx'});remember(output+'/worlds.json');
 const effectAnchors='audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json';remember(effectAnchors);const effects=JSON.parse(fs.readFileSync(effectAnchors));const effectInputs=[effectAnchors];for(const p of effects.phases)if(p.keyedImage&&!p.keyedImage.startsWith('procedural:')){const file=path.posix.normalize(path.posix.dirname(effectAnchors)+'/'+p.keyedImage);effectInputs.push(file);remember(file);}
 const pairs=[];
 for(const [li,L]of fits.entries())for(const [ri,R]of fits.entries()){
  const id=String(li*38+ri+1).padStart(4,'0')+'-'+L.name.toLowerCase().replaceAll(' ','-')+'--'+R.name.toLowerCase().replaceAll(' ','-');
  const hasWater=L.habitat.preferred==='water'||R.habitat.preferred==='water',bothWater=L.habitat.preferred==='water'&&R.habitat.preferred==='water';
  const world=worlds[bothWater?((li+ri)%2?'coral':'lake'):hasWater?'surface':'dry'];
  const contextId='c163-'+id;let habitat=owner.compileHabitatBattle({contextId,seed:133,round:0,kind:'wild',home:world,visitor:world,left:L.habitat,right:R.habitat});if(habitat.status!=='READY')throw Error(id+': '+habitat.reason);
  const medium=habitat.left.medium==='water'&&habitat.right.medium==='water'?'water':'ground',selected=owner.selectArena({kind:'wild',contextId,seed:133,round:0,worlds:{home:world,visitor:world},medium});
  const arena=selected.set,recipe=JSON.parse(fs.readFileSync(arena.recipe)),acceptance=JSON.parse(fs.readFileSync(arena.acceptance));if(acceptance.qualityAccepted!==true)throw Error('Arena not accepted '+arena.id);if(![arena.far,arena.mid,arena.near].every(p=>p.endsWith('.webp')))throw Error('Accepted WebP runtime required '+arena.id);
  const exactWorld={...world,groundLineY:recipe.groundLineNormalized};habitat=owner.compileHabitatBattle({contextId,seed:recipe.seed,round:0,kind:'wild',home:exactWorld,visitor:exactWorld,left:L.habitat,right:R.habitat});if(habitat.status!=='READY')throw Error('Exact arena world refused');
  const labels={A:L.name+' [A]',B:R.name+' [B]'},rows=[{side:'A',an:labels.A,dn:labels.B,dmg:9,crit:false,hpA:30,hpB:21},{side:'B',an:labels.B,dn:labels.A,dmg:6,crit:false,hpA:24,hpB:21},{side:'A',an:labels.A,dn:labels.B,dodge:true},{side:'B',an:labels.B,dn:labels.A,dodge:true},{side:'A',an:labels.A,dn:labels.B,dmg:21,crit:true,hpA:24,hpB:0}];
  const supports={left:L.supports,right:R.supports},declarations={...(L.declaration?{A:L.declaration}:{}),...(R.declaration?{B:R.declaration}:{})};
  const script={readyMs:600,commandMs:300,contextId,labels,supportsBySide:supports,themes:{A:'wild',B:'wild'},world:exactWorld,weaponDeclarations:declarations,rows};
  const ordinal={A:0,B:0},expectedTurns=rows.map((r,i)=>{const f=r.side==='A'?L:R,m=r.side==='A'?habitat.left.medium:habitat.right.medium,a=owner.compileAnatomyAttack(f.card,m,ordinal[r.side]++,undefined,f.declaration??undefined);if(!a.attack||!a.timeline)throw Error('False anatomical compile');return{attacker:r.side==='A'?'left':'right',outcome:r.dodge?'dodge':'hit',targetFaints:i===4,attack:{verb:a.attack.verb,contactJoint:a.attack.contactJoint,contactMs:a.contactMs}};});
  const inputPaths=[...new Set([...L.inputs,...R.inputs,...effectInputs,arena.recipe,arena.far,arena.mid,arena.near,arena.delivery,arena.acceptance,output+'/worlds.json'])];for(const p of inputPaths)remember(p);
  pairs.push({id,left:L.name,right:R.name,fitConfig:{left:{dir:L.dir,markingsDir:L.markingsDir},right:{dir:R.dir,markingsDir:R.markingsDir}},supports,mediums:{left:habitat.left.medium,right:habitat.right.medium},interaction:habitat.interaction,arena:{id:arena.id,medium:arena.medium,recipe:arena.recipe,far:arena.far,mid:arena.mid,near:arena.near},arenaReason:selected.reason,effectAnchors,script,scriptSha256:jsonHash(script),expectedTurns,inputs:inputPaths.map(p=>sources.get(p))});
 }
 for(const f of SUCCESSOR_OWNER_FILES)remember(f);for(const f of ['port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs','port/v2/tools/workspacelock.mjs','port/v2/tools/morph/build-card-masters.mjs','port/v2/tools/battle2-proof/cpu-profile.mjs'])remember(f);remember('port/v2/package-lock.json');
 // Shared product/runner sources are bound once; each execution case expands them into its required inputs.
 const manifest={schema:'cf.c163-all-pairs/v1',sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),preparedOnly:true,nativeRuns:0,nativeBundleSha256,scope:'1444 ordered registered-fit pairs at default presentation; five coherent turns and one representative habitat each. Reverse ordered pairs cover the opposite losing fit. No every-verb, every-habitat or all-scale claim.',fits:fits.map(({card,inputs,...f})=>({...f,inputs:inputs.map(p=>sources.get(p))})),pairs,sources:[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path))};
 validateManifest(manifest);for(const s of manifest.sources)if(sha(fs.readFileSync(s.path))!==s.sha256)throw Error('Source changed during preparation '+s.path);
 fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({fits:38,pairs:1444,sourceFiles:manifest.sources.length,nativeRuns:0,manifest:output+'/manifest.json',sha256:sha(fs.readFileSync(output+'/manifest.json'))}));
}finally{await bundle?.close();fs.rmSync(scratch,{recursive:true});}
