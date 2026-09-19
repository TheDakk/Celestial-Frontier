/** Qualify existing arena inputs without changing originals or painting masks. */
import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {readBoundFile,inspectMaster,sha256} from './contracts.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const need=(ok,why)=>{if(!ok)throw Error('Arena intake: '+why);};
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export function inspectArenaSet(root,manifest){
 need(manifest?.schema==='cf.arena-intake/v1','schema');
 const recipeBytes=readBoundFile(root,manifest.recipe),recipe=JSON.parse(recipeBytes);
 need(recipe.schema==='cf.arena.authoring-proof/v1'&&recipe.extractedMasks===false,'key-painted proof recipe');
 need(recipe.battleContext?.schema==='cf.arena.proof-context/v1'&&Number.isSafeInteger(recipe.seed),'battle context/seed');
 need(JSON.stringify(Object.keys(recipe.battleContext).sort())===JSON.stringify(['schema','encounterKind','worldKey','combatants','round','biomeFamily'].sort()),'closed battle context fields; no clock input');
 need(['wild','guardian','duel'].includes(recipe.battleContext.encounterKind)&&Number.isSafeInteger(recipe.battleContext.round)&&recipe.battleContext.round>=0&&Array.isArray(recipe.battleContext.combatants)&&recipe.battleContext.combatants.length===2&&recipe.battleContext.combatants.every(x=>typeof x==='string'&&x.length>0)&&['worldKey','biomeFamily'].every(k=>typeof recipe.battleContext[k]==='string'&&recipe.battleContext[k].length>0),'encounter identity');
 need(createHash('sha256').update(stable(recipe.battleContext)).digest().readUInt32BE(0)===recipe.seed,'seed differs from battle context');
 need(Number.isFinite(recipe.groundLineNormalized)&&recipe.groundLineNormalized>0&&recipe.groundLineNormalized<1,'normalized fighting ground');
 const card=readBoundFile(root,{path:recipe.systemCardSource,sha256:recipe.systemCardSourceSha256});
 const cards=[...card.toString('utf8').matchAll(/^SYSTEM CARD - [\s\S]*?(?=\n\nSUBJECT(?:\n|$))/gm)];
 need(cards.length===1&&cards[0][0].trimEnd()===recipe.systemCard,'card differs from complete compiler source');
 const roles=['far','mid','near'];
 need(Array.isArray(manifest.layers)&&manifest.layers.length===3&&manifest.layers.every((l,i)=>l.role===roles[i])&&Array.isArray(recipe.plates)&&recipe.plates.length===3,'ordered FAR/MID/NEAR triplet');
 const sources=new Set(),outputs=new Set();
 const layers=manifest.layers.map((layer,i)=>{
  const declared=recipe.plates[i];need(declared.groundLineNormalized===recipe.groundLineNormalized,'layer ground line mismatch');
  need(declared.kind===(i===0?'scene':'key-painted terrain')&&layer.source.sha256===declared.sha256,'layer kind/source recipe binding');
  need(!sources.has(layer.source.path)&&!outputs.has(layer.runtime.path),'duplicate layer path');sources.add(layer.source.path);outputs.add(layer.runtime.path);
  const original=readBoundFile(root,layer.source),runtime=readBoundFile(root,layer.runtime),master=inspectMaster(original,'plate'),delivered=inspectMaster(runtime,'plate');
  for(const f of [master,delivered])need(f.width===recipe.canvasSize?.width&&f.height===recipe.canvasSize?.height,'common canvas registration');
  const pixels=PNG.sync.read(runtime,{checkCRC:true});let transparent=0,visible=0,translucent=0;
  for(let p=3;p<pixels.data.length;p+=4){const a=pixels.data[p];if(a===0)transparent++;else{visible++;if(a<255)translucent++;}}
  if(i===0){need(transparent===0&&translucent===0,'FAR must be full-bleed opaque');need(pixels.data.equals(PNG.sync.read(original,{checkCRC:true}).data),'FAR copy changed painted pixels');}
  else{need(layer.runtime.path!==layer.source.path,'key intake must use a copy');need(transparent>0&&visible>0,'MID/NEAR require keyed transparency and painted content');}
  return {role:layer.role,groundLineNormalized:recipe.groundLineNormalized,original:master,runtime:delivered,transparentPixels:transparent,visiblePixels:visible,translucentPixels:translucent};
 });
 return {schema:'cf.arena-intake-report/v1',recipeSha256:sha256(recipeBytes),seed:recipe.seed,systemCardSourceSha256:sha256(card),groundLineNormalized:recipe.groundLineNormalized,layers,qualityAccepted:false,
  scope:'Hashes, compiler-card provenance, seeded context, registration and alpha only. Existing human acceptance is unchanged.',pending:['composition and style review','edge/despill review','runtime replay and choreography']};
}
