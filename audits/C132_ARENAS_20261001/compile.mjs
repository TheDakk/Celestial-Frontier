import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {BIOME_PROFILE_KEYS_V1, BIOME_PROFILES_V1} from '../../port/v2/packages/domain/biome-profile/src/index.ts';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.dirname(fileURLToPath(import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const read=p=>fs.readFileSync(path.join(root,p));
const bound=p=>({path:p,sha256:sha(read(p))});
const kit=read('ART_KIT.md').toString('utf8');
function between(s,a,b){if(s.split(a).length!==2)throw Error('Unique start required: '+a);const tail=s.split(a)[1];if(tail.split(b).length!==2)throw Error('Unique end required: '+b);return tail.split(b)[0];}
function section(h){const begin='## '+h+'\n';if(kit.split(begin).length!==2)throw Error('Unique section required');return kit.split(begin)[1].split('\n## ')[0];}
const block=h=>between(section(h),'```text\n','\n```');
const reference=block('1. Reference lock'),style=block('2. Frozen style'),negative=block('6. Shared negative'),tech=block('5. Technical output');
const arena=between(section('4C. Planets (orbital cut-out, biome scene)'),'### Arena scene profile\n\n```text\n','\n```');
const layout=between(arena,'ARENA - LAYOUT (paste):\n','\n\nARENA - OUTPUT:');
const accuracy=between(arena,'ARENA MID/NEAR - ACCURACY:\n','\n\nARENA - NEGATIVE ADDITIONS:');
const arenaNegative=arena.split('ARENA - NEGATIVE ADDITIONS:\n')[1];
const sharedNegative=between(negative,"Paste in every prompt, then add the class's NEGATIVE ADDITIONS.\n\n",'\n\n  For CUT-OUT');
const keyNegative=negative.split('  For Arena MID/NEAR, replace those object-isolation clauses with:\n')[1];
const sceneTechnical=between(tech,'SCENE BLOCK (paste for universe, stars, planet biomes):\n','\n\nGlow');
const keyTechnical=tech.split('ARENA KEY-PAINTED BLOCK (paste for Arena MID and NEAR):\n')[1];
const referencePath='audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png';
if(sha(read(referencePath))!=='68f03f0233ec2ca89ddf39238cfaf1a30b83027a58beaea9fbb1735273720a38')throw Error('Reference bytes differ');

/* Authored staging interprets canonical profile data; these are reusable templates,
 * never fabricated claims that a particular generated planet has this appearance. */
const spec={
 temperate:['Temperate woodland','compact damp earth and short grouped grasses','layered broadleaf woodland and restrained distant blue-green hills','ground'],
 savanna:['Golden savanna','firm ochre earth and very short dry grass','golden grassland with a few distant flat-crowned trees and long warm horizons','ground'],
 jungle:['Rainforest clearing','compact dark damp earth with sparse leaf litter','deep emerald rainforest, tall grouped trunks and a distant layered canopy','ground'],
 marsh:['Reed marsh','firm olive-gray silt with a shallow wet sheen','distant reed beds and quiet water channels with low mist behind the battle','ground'],
 swamp:['Blackwater swamp','firm dark wet alluvial earth','dark teal blackwater, distant trunks and restrained mossy roots behind the runway','ground'],
 mangrove:['Mangrove shore','flat firm brown tidal sediment','warm green-brown mangrove trees and roots behind the stands, distant tidal water','ground'],
 tundra:['Snow-dusted tundra','flat sage-gray compact soil with low lichen and restrained snow patches','low pale hills, sparse low shrubs and cold atmospheric distance','ground'],
 karst:['Limestone karst','flat worn limestone and a thin scatter of fine gravel','pale layered limestone towers and distant wooded hollows','ground'],
 saltflat:['White salt flat','level chalk-white salt crust, no sharp fissures in the runway','flat salt horizons with sparse distant arid growth and restrained glare','ground'],
 fungal:['Fungal grove','firm muted violet humus','large grouped fungal silhouettes and distant spore-softened depth, no spore overlay across stands','ground'],
 crystalsteppe:['Crystal steppe','flat cool gray mineral soil','restrained cyan mineral outcrops in the distance, low steppe growth','ground'],
 opensea:['Open ocean shelf','flat dark blue-gray ocean-floor sediment','deep blue open water with distant submerged shelves and sparse seaweed','water'],
 archipelago:['Island shore','flat teal-gray compact beach sand','distant palm-covered islands and calm sea channels','ground'],
 coral:['Turquoise coral reef','flat pale carbonate sand on a shallow submerged shelf','turquoise underwater depth, distant grouped reef heads at the far edges, clear central water','water'],
 stormsea:['Storm sea shelf','flat dark slate seabed','slate-blue underwater depth under a distant storm-lit surface, no surface crossing in the battle band','water'],
 volcisle:['Volcanic island shore','level dark volcanic sand','dark teal sea, distant volcanic island silhouettes and restrained ash atmosphere','ground'],
 abyssal:['Abyssal plain','flat near-black blue silt','lightless deep water interpreted with restrained readable blue value separation and distant dark rock forms','water'],
 milksea:['Luminous milk sea','flat muted cyan seabed','pale luminous cyan water rendered as solid painted value masses, not bloom','water'],
 glacier:['Glacial plain','flat packed ice with restrained snow texture','white-blue glacier walls and distant ice ridges, no crevasses across the fighting path','ground'],
 packice:['Pack ice floe','flat thick continuous cold gray-blue ice','distant low pack-ice silhouettes and dark cold sea channels behind the fight','ground'],
 cryogeyser:['Cryogeyser terrace','level pale cyan frozen sediment','distant ice formations and restrained far-field vapor plumes, no eruption in the stands','ground'],
 blueice:['Blue ice field','smooth but tactile deep blue ice','distant glowing-blue ice masses painted as opaque pigment shapes, no bloom','ground'],
 dunesea:['Desert dune basin','flat compact pale ochre sand with very low wind ripples','layered distant sand dunes under dry natural light, no dune slope through the fighting path','ground'],
 canyon:['Red-rock canyon','flat compact red-brown sand and fine gravel','distant tiered red sandstone walls with broad atmospheric depth','ground'],
 saltpan:['Desert salt pan','level white-brine salt crust','flat pale saline horizons and restrained far-field mirage haze','ground'],
 oxide:['Rust oxide plain','flat rust-red mineral dust and fine grit','low oxidized ridges and dry rust-brown atmosphere','ground'],
 glass:['Glass desert','flat amber-gray mineral sand','distant weathered glassy ridges, sharp shards kept far behind the stands','ground'],
 cratered:['Cratered airless basin','flat gray regolith','distant overlapping crater rims against a dark airless sky, no atmospheric haze','ground'],
 boulder:['Boulder field clearing','flat tan stone dust with small embedded pebbles','weathered boulder groups behind the stands, clear central runway','ground'],
 graben:['Graben canyon floor','level shadowed gray mineral grit','distant fault-bounded rock walls and wide tectonic terraces','ground'],
 geode:['Geode chamber','flat muted amethyst-gray mineral floor','distant broad crystalline chamber walls, crystals never invade the fighting path','ground'],
 carbon:['Carbon plain','flat matte graphite grit','distant dark carbon landforms with restrained pale value separation','ground'],
 sulfurdeck:['Sulfur terrace','level dull gold-green mineral crust','distant sulfur formations beneath a gold-green storm atmosphere','ground'],
 acidhaze:['Acid-haze shelf','level muted yellow-gray mineral crust','restrained distant geological silhouettes through sickly yellow atmospheric layers','ground'],
 abyssgreen:['Greenhouse basin','flat dark olive-brown mineral ground','distant low landforms under dense olive heat atmosphere','ground'],
 ashwaste:['Ash plain','flat soft gray compact ash','distant weathered dark rock forms under gray ash-softened sky','ground'],
 emberfield:['Ember plain','flat dull red-brown volcanic crust','distant orange-red ember landforms, restrained solid painted glow shapes behind the stands','ground'],
 obsidian:['Obsidian field','flat dark weathered volcanic glass with subtle broken sheen','distant black glass ridges under still hot atmosphere','ground'],
 magmasea:['Magma sea shelf','a continuous dark cooled volcanic shelf','distant molten orange sea and cooled black formations, no lava crossing the stage','ground'],
 banded:['Banded cloud deck','a continuous softly layered cream-tan cloud band used as a visual registration plane, not a solid floor','vast distant cream-tan planetary cloud bands, no invented ground or plants','air'],
 ammonia:['Ammonia cloud deck','a continuous pale pastel cloud band used as a visual registration plane, not a solid floor','distant lavender-gray and pale cyan ammonia cloud layers','air'],
 stormeye:['Storm-eye cloud deck','a continuous dark red-brown cloud band used as a visual registration plane, not a solid floor','distant immense curved storm-wall cloud masses, readable quiet eye in the centre','air'],
 hotglow:['Ember cloud deck','a continuous subdued red cloud band used as a visual registration plane, not a solid floor','distant dark red planetary cloud masses with contained painted ember values','air'],
};
if(stable(Object.keys(spec).sort())!==stable([...BIOME_PROFILE_KEYS_V1].sort()))throw Error('Exact 43-profile inventory mismatch');
const variants=[{id:'freshwater-lake',key:'temperate',s:['Freshwater lakebed','flat pale gray-brown lakebed sediment with small embedded pebbles','cool clear freshwater depth, far-bank silhouettes softened through the water, sparse distant rooted aquatic plants','water'],variant:'Freshwater / Temperate Lake',source:'BIOME_ATLAS.md#freshwater-12'},
{id:'karst-cave',key:'karst',s:['Limestone cave','flat worn limestone and fine cool-gray mineral grit','distant limestone cavern walls, restrained stalactites high above the battle band, broad shadowed cave depth','ground'],variant:'Cave / Limestone Cave',source:'BIOME_ATLAS.md#cave-6'}];
const templates=[...BIOME_PROFILE_KEYS_V1.map(key=>({id:key,key,s:spec[key],variant:null,source:'BIOME_ATLAS.md#1--live-biomes-43-in-the-game-now--colored-first-in-phase-4'})),...variants];
const first=['freshwater-lake','coral','dunesea','tundra','jungle','savanna','marsh','karst-cave'];
const inputs=['ART_KIT.md','BIOME_ATLAS.md','port/v2/packages/domain/biome-profile/src/index.ts','audits/MAILBOX/C132_ART_PROGRAM_20261001.md'].filter(p=>fs.existsSync(path.join(root,p))).map(bound);
const inventory=[];
for(const t of templates){
 const profile=BIOME_PROFILES_V1[t.key], [name,material,depth,medium]=t.s;
 const folder=path.join(out,t.id);fs.mkdirSync(folder,{recursive:true});
 const card=[`SYSTEM CARD - reusable biome-family template ${t.id}; canonical profile ${t.key}`,
  '  Template scope: source-derived profile plus explicit authored stage interpretation; no live planet address or runtime world snapshot is claimed.',
  '  Star: not bound at template-authoring time; runtime system light remains source-owned.',
  '  Light: one soft diffuse near-neutral authoring light from upper left; preserve the same direction on all three plates; no visible star or extra light source.',
  `  Mineral palette: canonical signature ${profile.sig}; named material ${material}.`,
  `  Atmosphere: canonical weather ${profile.weather}; authored medium ${medium}; ${depth}.`,
  `  Flora pigment: source profile ${t.key}; permitted forms ${profile.flora.length?profile.flora.join(', '):'none'}; restrained natural pigment interpreted in the named materials.`,
  `  Fauna adaptation: source families ${profile.fauna.length?profile.fauna.join(', '):'none'}; no fauna are painted into these arena layers.`,
  `  One signature: ${profile.hazard??'no biome hazard in source'}; signature stays behind the combatant stands, never breaks the continuous fighting path.`,
  `  Authoring variant: ${t.variant??'canonical biome-family template'}; source ${t.source}.`].join('\n');
 const context={schema:'cf.arena.proof-context/v1',encounterKind:'wild',worldKey:`template:${t.id}`,combatants:['left-review-stand','right-review-stand'],round:0,biomeFamily:t.key};
 const seed=createHash('sha256').update(stable(context)).digest().readUInt32BE(0);
 const cardSource=path.relative(root,path.join(folder,'arena-far.prompt.txt'));
 for(const role of ['far','mid','near']){
  const subject=role==='far'?`${name}, FAR layer only. ${depth}. Fill all edges with distant environment only. Low eye-level side view, no strong perspective lines converging through the fighting space. Keep detailed landmarks beyond or near the outer edges, with broad quiet central atmospheric depth. The future ground line is y=0.78; the future MID layer begins around y=0.66. Do not paint nearby fighting terrain or foreground props. One uninterrupted landscape, never triptych panels.`:
   role==='mid'?`${name}, MID terrain layer only. ${material}. One broad continuous level terrain band begins near y=0.66 and fills the entire canvas width through the bottom. Both fighting stands at x=1/3 and x=2/3 register exactly to y=0.78. Clear horizontal runway across x=0.08 to0.92, no path that recedes into the distance, no tall growth or rocks across it. Only very restrained biome landmarks behind the stands near the outermost edges. Everything above/outside terrain is pure flat #FF00FF. No background environment or sky in the key. ${medium==='water'?'This is a submerged floor; no water-surface line or bubbles across the key.':medium==='air'?'The continuous band is a cloud register for floating combatants, never a fabricated solid planetary surface.':''}`:
   `${name}, NEAR layer only. A very quiet continuous lower edge of ${material}, occupying only y=0.92 to1.00. Full width, with no objects or growth rising above y=0.92. Entire upper92percent pure flat #FF00FF. Both stands and the shared ground line y=0.78 remain completely key-colored and unobstructed. Only small grouped brush marks, no large foreground props. ${medium==='air'?'A quiet low cloud band, no solid surface.':''}`;
  const prompt=[reference,style,card,'SUBJECT\n'+subject,...(role==='far'?[]:['ACCURACY\n'+accuracy]),'LAYOUT\n'+layout,'TECHNICAL OUTPUT\n'+(role==='far'?sceneTechnical:keyTechnical),'NEGATIVE\n'+sharedNegative+'\n'+(role==='far'?'':keyNegative+'\n')+arenaNegative].join('\n\n')+'\n';
  fs.writeFileSync(path.join(folder,`arena-${role}.prompt.txt`),prompt,{flag:'wx'});
 }
 const recipe={schema:'cf.arena.authoring-proof/v1',battleContext:context,seed,seedDerivation:'first4bytes big-endian SHA256 of sorted compact battleContext JSON; no clock',groundLineNormalized:.78,horizonBandNormalized:.66,standsNormalizedX:[1/3,2/3],systemCard:card,systemCardSource:cardSource,systemCardSourceSha256:sha(read(cardSource)),kitSha256:sha(Buffer.from(kit)),extractedMasks:false,qualityAccepted:false,scope:'source-derived reusable template authoring; no live world, game wiring, physical-medium admission or visual acceptance claimed',requestedCanvasSize:{width:2560,height:1440},profileKey:t.key,habitatVariant:t.variant,medium,canonicalProfile:profile,sourceInputs:inputs,reference:bound(referencePath),plates:[]};
 fs.writeFileSync(path.join(folder,'recipe.pending.json'),JSON.stringify(recipe,null,2)+'\n',{flag:'wx'});
 inventory.push({id:t.id,name,profileKey:t.key,habitatVariant:t.variant,medium,firstDelivery:first.includes(t.id),status:'PROMPTS_READY',prompts:['far','mid','near'].map(r=>bound(path.relative(root,path.join(folder,`arena-${r}.prompt.txt`))))});
}
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({schema:'cf.c132-arena-program/v1',canonicalFamilyCount:43,habitatVariants:2,firstDelivery:first,sourceInputs:inputs,compiler:bound(path.relative(root,fileURLToPath(import.meta.url))),templates:inventory},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({templates:inventory.length,prompts:inventory.length*3,firstDelivery:first,output:'~/Projects/celestial-frontier-openai-mac/audits/C132_ARENAS_20261001'}));
