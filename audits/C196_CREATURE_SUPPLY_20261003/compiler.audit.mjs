/** G2: canonical species -> controlled master prompt. No authoring, landmarks or labels. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {rolldown} from '../../port/v2/node_modules/rolldown/dist/index.mjs';
import {familyContract} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {patternRequirements} from '../../port/v2/tools/painted-creature/pattern-observation.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
/** Use canonical profile candidates, never guess a family from a name or raw procedural limbs. */
export function libraryFamily(profile,species){
 const candidates=profile?.candidateTemplates??[];
 if(SIMPLE[species.name]){const family=SIMPLE[species.name].family;if(candidates.length!==1||candidates[0]!==family)throw Error('Specialized source canonical family mismatch');return family;}
 const extended=candidates.filter(f=>EXTENSION_FAMILIES.includes(f));
 if(extended.length===1&&candidates.length===1)return extended[0];
 if(extended.length)throw Error('Ambiguous controlled library family');
 // A habitual upright pose (Meerkat) does not change a sole canonical quadruped route.
 if(candidates.includes('quadruped')&&(species.posture==='quadruped'||candidates.length===1))return 'quadruped';
 if(candidates.includes('biped-bird'))return 'biped-bird';
 if(candidates.includes('serpent'))return 'serpent';
 if(candidates.includes('insect'))return 'insect';
 if(candidates.includes('fish')&&['fish','predatory-shark','filter-shark','tube-snouted-fish'].includes(profile.id))return 'fish';
 throw Error('Unsupported controlled library family');
}
export function controlledLibraryLayout(family,name){
 if(Object.values(SIMPLE).some(r=>r.family===family)){const row=SIMPLE[name];if(!row||row.family!==family)throw Error('Exact specialized source species required');return {legs:row.legs,accuracy:row.accuracy,layout:row.layout};}
 if(EXTENSION_FAMILIES.includes(family))return controlledFamilyLayout(family,name);
 const common='Strict side profile facing RIGHT, head right and posterior left. One whole anatomically accurate adult; no duplicate subject. Preserve species-identifying natural coat patterns, colours, scales, feather edges and material. Never replace required stripes, rosettes, spots, bands or patches with a plain coat. Keep the whole silhouette, every natural tail or abdomen tip, bill, antenna and toe inside the frame with at least 8 percent clear margin on EVERY side. The TRUE SPECIES TAIL must be painted continuously from attachment through its natural taper or feather fan to its visible tip, separately readable from limbs and body; do not truncate, hide, lengthen a short tail or invent a tail on a tailless species. No floor, cast shadow, scenery, text or props.';
 const rows={
  quadruped:{legs:4,accuracy:'four separately visible legs and feet; one tail of its real species length',pose:'Quiet planted walking stride, paused with all feet on one level. Exactly FOUR separately visible legs, two fore and two hind; near and far legs visibly APART from their body attachments through their feet, separated by clear background gaps rather than only offset toes. Keep all four limbs naturally connected; no overlapping, crossed, raised, merged or invented legs. Preserve real ears, horns if present, nose and eyes.'},
  'biped-bird':{legs:2,accuracy:'two separately readable legs and feet, two natural wings and one complete feather tail; never add limbs to expose hidden ones',pose:'Quiet planted walking stride in strict side profile. Near and far legs visibly APART from the feathered body through both ankles and all natural toes, with a clear background gap along the leg shafts; both feet rest on the same ground level with TWO separately visible ground contacts and every toe kept inside the frame. Do not merge the upper legs and merely separate the toes. Both wings rest naturally folded; show the far wing edge separately only where anatomically visible, never invent an extra wing. Keep the folded wing clear enough of the tail base that its continuous root contour and feather fan are readable; never disconnect the tail or invent a gap through connected anatomy. Feather tail extends naturally left of the body with its complete tip separated from feet; species with a short tail keep a short but clearly visible tail. No spread display, flying or raised foot.'},
  fish:{legs:0,accuracy:'zero legs; species-correct dorsal, anal, paired pectoral and pelvic fins where biologically present, and one complete caudal tail',pose:'Horizontal swimming fish, no bend or foreshortening. Head right and complete caudal tail left; distinct natural fin rays and fin roots. Separate near and far paired fins slightly in the painted silhouette where possible without adding or relocating fins. Preserve the named species dorsal-fin count, barbels, adipose fin when present and true tail shape. Do not give every fish the same fin inventory.'},
  serpent:{legs:0,accuracy:'zero legs and zero wings; one head, one uninterrupted body and one natural terminal tail tip',pose:'One continuous serpent in a LOW HORIZONTAL shallow S-curve along one level, head right and tapered tail left. The head stays level with the main body, never raised or rising diagonally. Preserve the natural species-correct trunk thickness, not an unnaturally thin cord. The tail tapers left along the same ground band, with no curl below the body. NO overlapping coils, knots, crossings, upright rearing or tucked tail. Clear negative space between bends. The entire real-length body and taper must fit within the frame; preserve natural head and scale anatomy, with no added fins or appendages.'},
  insect:{legs:6,accuracy:'exactly six legs attached to the thorax, two antennae, natural head/thorax/abdomen and only species-correct wings',pose:'Grounded adult insect facing RIGHT in strict side profile: head at right, thorax in the middle, and clearly readable full natural abdomen at left. Preserve the species-correct abdomen volume and its visible attachment; do not hide it behind folded wings or turn the body into a quadruped silhouette. Exactly SIX separate legs, three near and three far, offset front-to-back with every natural tarsal endpoint visible and clear gaps. Two antennae visibly distinct, never mistaken for legs. Preserve actual wing-cover or folded-wing structure, thorax and complete abdomen tip/cerci where the species has them. Insects have an abdomen, NOT an added vertebrate tail. No flight, spread display, larval anatomy or extra legs.'}
 };
 const r=rows[family];if(!r)throw Error('Unsupported controlled library family');
 return {legs:r.legs,accuracy:r.accuracy,layout:common+' '+r.pose};
}
export async function compileLibraryMaster(name,outArg){
 const root=path.resolve(import.meta.dirname,'../..'),out=path.resolve(outArg);
 const species=JSON.parse(fs.readFileSync(root+'/port/v2/reference/fauna.json')).filter(x=>x.name===name);
 if(species.length!==1)throw Error('Exactly one canonical Earth species required');
 if(fs.existsSync(out))throw Error('New packet directory required');
 fs.mkdirSync(out,{recursive:true});
 const scratch=fs.mkdtempSync('/private/tmp/cf-g2-compiler-');
 try{
  execFileSync(process.execPath,[root+'/port/v2/tools/landfall-snapshot/kit-export.mjs',scratch+'/kit'],{cwd:root,stdio:'pipe'});
  const compiler=await import(pathToFileURL(scratch+'/kit/kit-compiler.mjs').href),kit=fs.readFileSync(root+'/ART_KIT.md','utf8'),compiled=compiler.compileCanonicalEarthKit(kit),template=compiled.familyReferences[0];
  const entry=`import {_EARTH_NAMES} from '${root}/port/v2/packages/domain/descriptors/src/index.ts';import {makeGenome} from '${root}/port/v2/packages/domain/genome/src/index.ts';import {hashInt} from '${root}/port/v2/packages/domain/rand/src/index.ts';import {speciesVisualKey} from '${root}/port/v2/packages/art/src/speciesidentity.ts';import {earthFaunaProfile} from '${root}/port/v2/apps/game/src/earth-fauna-profiles.ts';const name=${JSON.stringify(name)},i=_EARTH_NAMES.fauna.indexOf(name),ki=Object.keys(_EARTH_NAMES).indexOf('fauna');if(i<0)throw Error('No canonical named genome');const genome={...makeGenome(hashInt(0xEA47,i,ki)>>>0,'fauna',1),_earthName:name};export default {genome,visualKey:speciesVisualKey(genome),index:i,profile:earthFaunaProfile(name)};`;
  fs.writeFileSync(scratch+'/entry.mjs',entry);
  const bundle=await rolldown({input:scratch+'/entry.mjs',platform:'node'});try{await bundle.write({file:scratch+'/identity.mjs',format:'es'});}finally{await bundle.close();}
  const identity=(await import(pathToFileURL(scratch+'/identity.mjs').href)).default;
  const family=libraryFamily(identity.profile,species[0]);
  familyContract(family); // a known template is a request vocabulary, never observed anatomy
  const request=controlledLibraryLayout(family,name);
  const layout=request.layout;
  const patternFeatures=patternRequirements(species[0]),identityFeatures=[...patternFeatures,...species[0].mustRead.filter(f=>!patternFeatures.includes(f))];
  let prompt=template.prompt;
  const section=(start,end,value)=>{if(prompt.split(start).length!==2||prompt.split(end).length!==2)throw Error('Nonunique prompt section');prompt=prompt.slice(0,prompt.indexOf(start)+start.length)+value+prompt.slice(prompt.indexOf(end));};
  const fauna=prompt.split('\n').filter(x=>x.startsWith('  Fauna adaptation:'));if(fauna.length!==1)throw Error('Fauna card boundary');
  prompt=prompt.replace(fauna[0],`  Fauna adaptation: Earth ${name}; real named anatomy and natural materials take priority over raw procedural genes. Isolated library master, not an Earth landing resident claim.`);
  section('SUBJECT\n','\n\nACCURACY\n',`Species identity features FIRST: ${identityFeatures.join('; ')}. One Earth ${name}. These identifying pigment patterns and structures override conflicting generic colour or procedural-genome suggestions.\n${species[0].note?'Canonical identity note: '+species[0].note+'\n':''}Genomic identity (Earth anatomy takes priority): ${JSON.stringify(identity.genome)}\n${layout}`);
  section('ACCURACY\n','\n\nLAYOUT\n',`One anatomically accurate ${name}, ${family==='bivalve'?'no head':'one head'}; ${request.accuracy}; no duplicate subject. Required counts are requests, not measured evidence. No added anatomy, equipment or fantasy growth.`);
  section('LAYOUT\n','\n\nTECHNICAL OUTPUT\n',layout);
  const size='Create a square 1024 x 1024 PNG.';if(prompt.split(size).length!==2)throw Error('Technical size boundary');prompt=prompt.replace(size,'Create a square 1254 x 1254 PNG.');
  const ref='audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png',refHash=sha(fs.readFileSync(root+'/'+ref));if(refHash!=='c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62')throw Error('Style lock changed');
  fs.writeFileSync(out+'/prompt.txt',prompt,{flag:'wx'});
  fs.writeFileSync(out+'/subject-source.json',JSON.stringify({name,family,species:species[0],...identity},null,2)+'\n',{flag:'wx'});
  fs.copyFileSync(scratch+'/kit/manifest.json',out+'/compiler-inputs.json');
  fs.writeFileSync(out+'/request.json',JSON.stringify({schema:'cf.g2-master-request/v1',name,family,tool:'image_gen.imagegen',promptSha256:sha(prompt),kitSha256:sha(kit),compilerSha256:sha(fs.readFileSync(import.meta.filename)),reference:ref,referenceSha256:refHash,requestedSize:[1254,1254],requestedVisibleLegs:request.legs,observedVisibleLegs:null,requestedAnatomy:request.accuracy,profileId:identity.profile.id,authoringCreated:false,sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()},null,2)+'\n',{flag:'wx'});
  return {out,name,family,promptSha256:sha(prompt)};
 }finally{fs.rmSync(scratch,{recursive:true});}
}

/** Controlled painting vocabulary only. Requests are never observed anatomy or motion support. */
const EXTENSION_FAMILIES=Object.freeze(['primate','myriapod','cephalopod','flyer-membrane']);
const EXTENSION_SPECIES=Object.freeze({"primate":["Gorilla","Chimpanzee","Orangutan","Capuchin","Howler Monkey","Spider Monkey","Tamarin","Macaque","Langur","Baboon","Monkey","Lemur","Gibbon","Mandrill","Marmoset","Aye-Aye","Proboscis Monkey"],"myriapod":["Centipede","Giant Centipede","Millipede"],"cephalopod":["Squid","Octopus","Cuttlefish","Giant Octopus","Giant Squid","Vampire Squid","Deep-Sea Octopus","Nautilus"],"flyer-membrane":["Fruit Bat","Bat","Insect-Eating Bat","Vampire Bat"]});
function controlledFamilyLayout(family,name){
 if(!EXTENSION_SPECIES[family]?.includes(name))throw Error('Named species required for controlled extended family');
 const common='One whole anatomically accurate adult '+name+' in the approved painted hand, head facing RIGHT. Preserve its canonical identity, natural pigments and actual appendages. No second subject, invented body parts, ground, shadow, scenery, props, labels or text. Flat pure magenta background; full silhouette entirely within generous margins. Every appendage remains connected at its biological attachment. Separated silhouettes are requests, never proof of observed anatomy.';
 const layouts={
  primate:{legs:2,accuracy:'two natural arms with hands and two natural legs with feet, one head, species-correct tail or natural taillessness',pose:'Quiet terrestrial stance appropriate to the named species: an ape may knuckle-walk where biologically natural, while a monkey may rest on palms and feet. Two arms and two legs are distinct, offset in a quiet stride so hands, feet, wrists, elbows and knees can be read. Preserve real relative arm/leg length, hands with fingers and feet with toes, ears and face. Chimpanzee, Gorilla, Orangutan and Gibbon are tailless; never add a tail. Other species retain the actual tail length or natural reduction; do not infer prehensility. No human upright heroic pose, gloves, hooves or generic four-paw dog anatomy.'},
  myriapod:{legs:null,accuracy:'one head, two antennae, a continuous segmented body and the named species leg-pair pattern; no universal leg count inferred',pose:name==='Millipede'?'A gently extended almost-straight cylindrical millipede, head right, tail left. Preserve numerous round diplosegments with two pairs of short legs on most trunk segments, short clubbed antennae and a low rippling fringe of legs beneath the body. No flat centipede body, giant splayed walking legs, rear stinger or venom claws. Expose near/far leg rows as far as a natural shallow side view allows, without inventing a species-independent count.':'An extended low flattened centipede, head right, terminal legs left, with a shallow continuous bend and no coil or crossing. One pair of walking legs per leg-bearing segment, two long antennae at the head and one terminal pair trailing at the rear. Expose both leg rows with clear background between adjacent legs. The venom forcipules belong behind the mouth at the head, never to a scorpion tail; do not invent a rear stinger. Keep the real species segment count; the old rig joint count is not a biological instruction.'},
  cephalopod:{legs:0,accuracy:cephalopodAccuracy(name),pose:cephalopodPose(name)},
  'flyer-membrane':{legs:2,accuracy:'two forelimbs form membranous wings, two hind legs, species-correct tail/interfemoral membrane, one head; no extra arms or feathers',pose:'A shallow side view in calm flight, head right, both membranous wings comfortably extended and vertically offset enough to read their natural roots, elbows, wrists and elongated finger struts. The wing is the forelimb, not an extra appendage: two wings total, two hind legs total. Membranes connect continuously between fingers, arm and body; show the actual free thumb claw. No separate floating wing panels, bird feathers, dragon scales or extra hands. Fruit Bat keeps its fox-like face and real small ears; insectivorous bats retain their own ears, nose and tail membrane. Do not impose a generic tail absence or leaf-nose on every species.'},
 };
 const r=layouts[family];if(!r)throw Error('Unsupported controlled painting family');
 return{legs:r.legs,accuracy:r.accuracy,layout:common+' '+r.pose};
}
function cephalopodAccuracy(name){
 if(name==='Deep-Sea Octopus')return 'eight naturally webbed arms, one soft mantle with two ear-like fins, no added feeding tentacles';
 if(name==='Nautilus')return 'one chambered external shell, mantle/head and numerous unsuckered tentacles; never substitute eight octopus arms';
 if(name==='Vampire Squid')return 'eight webbed arms plus two retractile sensory filaments, mantle, natural fins and eyes; no ten squid arms';
 if(['Squid','Giant Squid','Cuttlefish'].includes(name))return 'eight sucker-bearing arms plus two longer feeding tentacles with terminal clubs, one mantle, two eyes and species-correct fins';
 return 'eight tapering sucker-bearing arms, one mantle above/behind the eyes, no added feeding tentacles or invented fins';
}
function cephalopodPose(name){
 const begin='A calm swimming or crawling pose appropriate to the named species, with a single connected mantle and head at the right and the full appendage fan displayed in a shallow side view. ';
 if(name==='Deep-Sea Octopus')return begin+'A finned dumbo-type octopus, preserving the two ear-like mantle fins and natural webbed umbrella between exactly eight arms. Keep the soft translucent mantle continuous and the eight arm tips separately readable without removing the web or inventing squid feeding tentacles.';
 if(name==='Nautilus')return begin+'Retain the chambered external spiral shell and its continuous body opening. Natural numerous fine unsuckered tentacles remain attached around the mouth. Do not draw an octopus emerging from the shell. Count is species-specific and unresolved by this request; no eight-arm declaration.';
 if(name==='Vampire Squid')return begin+'Eight natural arms carry their connecting web; two slender sensory filaments are distinct from feeding tentacles. Do not remove the real web merely to force artificial limb gaps. Fins attach to the mantle, not to arms.';
 if(['Squid','Giant Squid','Cuttlefish'].includes(name))return begin+'Keep eight short arms separately readable and exactly two longer club-tipped feeding tentacles; no extra arms. Arm bases remain connected around the mouth and suckers follow the inner surfaces. Squid retains a torpedo mantle with rear triangular fins; Cuttlefish retains its flattened mantle and undulating lateral fin fringe. No artificial arm knots, severed tentacles or gaps through connected tissue.';
 return begin+'Exactly eight natural arms spread in broad gentle curves, each continuously traceable from its root to its tapered tip with suckers on the inner surface. Do not coil, cross or bunch the arms to hide their count. The bulb is the mantle, not the head; the eyes lie below it. No squid feeding tentacles or new lateral fins. Preserve any named species natural webbing or fin structures instead of erasing them to force generic anatomy.';
}

/** Audit-only one-source vocabulary; no production support or measured anatomical admission. */
const SIMPLE=Object.freeze({"Leech":{"family":"annelid","legs":0,"accuracy":"one naturally flattened annelid body with fine annuli, a smaller anterior sucker and a posterior sucker; no invented limbs or vertebrate face","layout":"One whole anatomically accurate adult in the approved painted hand, isolated on pure magenta. Entire natural specimen and all appendages stay inside the central half of native 1254 by 1254 canvas, with roughly 300 pixels empty magenta on every side. No floor, scenery, shadow, frame, guides, text or props. Real biological anatomy takes priority over a coarse template; requests are not measured presence. One complete adult leech in a shallow gentle natural curve, right anterior and left posterior. Preserve its real flattened elongated body, fine annuli, natural pigments and modest true terminal suckers with continuous attachment. Both endpoints visible, the anterior sucker smaller than the posterior. No huge funnel cavities, tight loop, crossing, overlap, earthworm clitellum, props or invented eyes; retain real small eye spots only where source-visible."}});
