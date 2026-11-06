/** Source-bound functional coverage, kept separate from species authenticity and listening. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {rolldown} from 'rolldown';
const root=path.resolve(import.meta.dirname,'../../../..'),base=path.join(root,'audio-production');
const output=process.argv[2];if(!output||process.argv.length!==3||fs.existsSync(output))throw Error('Supply a new coverage report path');
const hash=b=>createHash('sha256').update(b).digest('hex');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'audits/AUDIO_PRODUCTION_20260915/game-inventory-v2.json')));
const cues=JSON.parse(fs.readFileSync(path.join(base,'audition/catalog.json'))).outputs;
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-audio-coverage-'));const sources=new Map();
try{
 const entry=`export * as plans from ${JSON.stringify(path.join(root,'port/v2/apps/game/src/audio-production-plan.ts'))};
 export {selectProductionPlan} from ${JSON.stringify(path.join(root,'port/v2/apps/game/src/audio-production-mix.ts'))};
 export {soundBodyFromResolvedRecord} from ${JSON.stringify(path.join(root,'port/v2/apps/game/src/audio-production-anatomy.ts'))};`;
 const bundle=await rolldown({input:'coverage',platform:'node',plugins:[{name:'coverage-authorities',
   resolveId(id){if(id==='coverage')return '\0coverage';},load(id){if(id==='\0coverage')return entry;},
   transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,hash(fs.readFileSync(id)));}}]});
 try{await bundle.write({dir:scratch,format:'es',entryFileNames:'audit.mjs'});}finally{await bundle.close();}
 const {plans:p,selectProductionPlan,soundBodyFromResolvedRecord}=await import(pathToFileURL(path.join(scratch,'audit.mjs')));
 const examples=[],routes=[];const add=(id,label,plan)=>{
   const selection=selectProductionPlan(plan,cues,0,true);
   const result={id,label,plan,selected:selection.selected.map(s=>({requirement:s.layer.requirement,id:s.cue.id,sha256:s.cue.previewSha256})),
     missing:selection.missing,functional:plan.layers.length===0?'explicit_silence':selection.missing.length?'gap':'rendered_recipe',listening:'not_reviewed',promoted:false};
   examples.push({id,label,plan});routes.push(result);return result;
 };
 for(const [biome,profile] of Object.entries(inventory.biomes))add('biome.'+biome,'Biome · '+biome,p.compileProductionEnvironment({worldKey:'coverage-world:133',seed:133,biome,weather:profile.weather,medium:profile.weather==='airless'?'vacuum':'air',timeOfDay:'day'}));
 for(const weather of [...new Set([...inventory.weather,'rain','snow','dust','storm'])])add('weather.'+weather,'Weather · '+weather,p.compileProductionEnvironment({worldKey:'coverage-world:133',seed:133,biome:'temperate',weather,medium:'air',timeOfDay:'day'}));
 for(const state of p.PRODUCTION_MUSIC_STATES){add('music.'+state,'Music · '+state,p.compileProductionMusic(state,state));add('music-transition.'+state,'Music transition · '+state+' to battle',p.compileProductionMusic(state,'battle'));}
 for(const theme of Object.keys(inventory.abilityThemes))for(const phase of p.PRODUCTION_ABILITY_PHASES)add('ability.'+theme+'.'+phase,'Ability · '+theme+' · '+phase,p.compileProductionAbility(theme,phase,phase==='impact'?3:1,'coverage-battle:133'));
 for(const event of inventory.events.combat)add('battle.'+event,'Battle · '+event,p.compileProductionBattle(event,'coverage-settlement:133'));
 const bodyFor=family=>({seed:133,speciesVisualKey:'coverage-example:'+family,ownerId:'contract-example-not-an-observed-creature',earthName:null,
   kingdom:family.startsWith('plant-')?'flora':family==='fungal'?'fungi':family==='microbe'?'microbe':'fauna',family,
   material:family.startsWith('plant-')?'foliage':family==='fungal'?'fungal':family==='microbe'?'microbial':family==='biped-bird'?'feathered':family==='quadruped'?'furred':'scaled',
   size:'medium',medium:family==='fish'||family==='cephalopod'?'water':'air',recipeHash:hash(Buffer.from('explicit coverage example:'+family))});
 for(const family of p.PRODUCTION_FAMILIES){
   for(const cue of p.PRODUCTION_VOICE_CUES)add('family.'+family+'.'+cue,'Fictional family · '+family+' · '+cue,p.compileProductionVoice(bodyFor(family),cue));
   for(const surface of p.PRODUCTION_SURFACES)add('contact.'+family+'.'+surface,'Contact · '+family+' · '+surface,p.compileProductionContact(bodyFor(family),surface,'land'));
 }
 const materialRows=p.PRODUCTION_MATERIALS.map(material=>add('material.'+material,'Material · '+material,p.compileProductionContact({...bodyFor('quadruped'),material},'grass','step')));
 const locomotion={grazers:'step',burrowers:'burrow','pack hunters':'step',gliders:'takeoff',swimmers:'swim',floaters:'swim',
  'ambush predators':'swipe',climbers:'crawl','herd-beasts':'step','filter-feeders':'swim',leapers:'jump',drifters:'swim',runners:'step',
  'jet-propelled swimmers':'swim','tentacle-walkers':'crawl',rollers:'slither','wall-clingers':'crawl','current-drifters':'swim',
  'vent-clingers':'crawl','magma-swimmers':'swim','under-ice drifters':'swim','pressure-walkers':'step','acid-cloud floaters':'swim',
  'storm-riders':'takeoff','winged hunters':'wingbeat','thermal-soarers':'takeoff','brine-crawlers':'crawl'};
 const locomotionRows=[...inventory.traits.FA_LOCO,...inventory.traits.EX_LOCO].map(name=>{
  if(!Object.hasOwn(locomotion,name))throw Error('Unmapped actual locomotion '+name);
  return {id:'locomotion.'+name,event:locomotion[name],selection:'Resolved family/contact and medium are required; no limb/wing inferred from this label alone.'};});
 // Every canonical Earth identity keeps the existing procedural audio owner. Recording
 // evidence is a separate column and is never filled with an unrelated family treatment.
 const oldCoverage=JSON.parse(fs.readFileSync(path.join(base,'manifests/audio-coverage.json')));
 const earth=inventory.earth.map(row=>{
  const prior=oldCoverage.requirements.find(r=>r.name===row.name&&r.kingdom===row.kingdom);
  if(!prior)throw Error('Canonical Earth route missing in source ledger');
  return {identity:row.identity,name:row.name,kingdom:row.kingdom,
   functionalOwner:'existing @cf/audio canonical identity + creature expression owner',
   functionalClassification:row.kingdom==='fauna'?'synthetic_fictional_fallback':'synthetic_fictional_sonification',
   recording:row.kingdom==='fauna'?(prior.candidateSourceHashes?.length?'source_candidate_context_unreviewed':'missing'):'not_an_animal_voice',
   recordingCandidateHashes:prior.candidateSourceHashes??[],productionRecipe:'resolved anatomy required before recorded/material substitution',
   accepted:false};});
 const actualAnatomy=[];
 for(const file of ['audits/CIVET_2D_PROOF_20260912/civet.landmarks.json','audits/C2_BOUNDED_REPAIR_20260913/candidate-01/fox.landmarks.json','audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/record.json']){
   const record=JSON.parse(fs.readFileSync(path.join(root,file))),context={kingdom:'fauna',size:'medium',medium:'air'};
   const body=await soundBodyFromResolvedRecord(record,context);
   let corruptRejected=false;try{await soundBodyFromResolvedRecord({...record,materials:{surface:'wrong'}},context);}catch{corruptRejected=true;}
   if(!corruptRejected)throw Error('Corrupted material control accepted');
   actualAnatomy.push({path:file,sha256:hash(fs.readFileSync(path.join(root,file))),recipeHash:record.recipeHash,
     material:body.material,voice:p.compileProductionVoice(body,'call'),contact:p.compileProductionContact(body,'grass','land'),
     suppliedReviewContext:context,missingRecordFields:['kingdom','acoustic size','current propagation medium'],
     meaning:'Context values exercise the adapter only; they are not inferred physical measurements.',corruptRejected});
 }
 const report={schema:'cf.audio-functional-coverage/v2',scope:'Candidate recipe resolution, not accepted soundtrack or species coverage',
  inventorySha256:hash(fs.readFileSync(path.join(root,'audits/AUDIO_PRODUCTION_20260915/game-inventory-v2.json'))),
  catalogSha256:hash(fs.readFileSync(path.join(base,'audition/catalog.json'))),
  counts:{earth:earth.length,faunaAuthenticMissing:earth.filter(r=>r.recording==='missing').length,
    routes:routes.length,renderedRecipes:routes.filter(r=>r.functional==='rendered_recipe').length,
    explicitSilences:routes.filter(r=>r.functional==='explicit_silence').length,gaps:routes.filter(r=>r.functional==='gap').length,
    locomotion:locomotionRows.length,materials:materialRows.length,listeningAccepted:0,gameplayPromotions:0},
  earth,routes,actualAnatomy,locomotion:locomotionRows,musicTransitions:p.PRODUCTION_MUSIC_STATES.flatMap(from=>p.PRODUCTION_MUSIC_STATES.map(to=>{
    const t=p.productionMusicTransition(from,to,1300);return {from,to,boundaryMs:t.boundaryMs,crossfadeMs:t.crossfadeMs,unchanged:t.unchanged};})),
  sourceBindings:[...sources].map(([file,sha256])=>({path:path.relative(root,file),sha256})),
  limits:['Contract examples are not painter observations or a completed animation proof.',
   'Named fauna keep explicit recording/behavior gaps; existing fictional fallback is not authentic coverage.',
   'Original music remains unapproved sketches; transition code does not make composition or loop quality accepted.',
   'No production asset replacement, full-bank startup decode, or delivery change.']};
 for(const [file,digest] of sources)if(hash(fs.readFileSync(file))!==digest)throw Error('Source changed during audit');
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(path.join(base,'audition/plans.json'),JSON.stringify({schema:'cf.audio-production-review-plans/v2',examples},null,2)+'\n');
 console.log(JSON.stringify(report.counts));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
