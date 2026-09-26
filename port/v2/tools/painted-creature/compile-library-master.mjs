/** G2: canonical species -> controlled master prompt. No authoring, landmarks or labels. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {familyContract} from '../creature-animation/family-contracts.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
/** Use canonical profile candidates, never guess a family from a name or raw procedural limbs. */
export function libraryFamily(profile,species){
 const candidates=profile?.candidateTemplates??[];
 if(species.posture==='quadruped'&&candidates.includes('quadruped'))return 'quadruped';
 if(candidates.includes('biped-bird'))return 'biped-bird';
 if(candidates.includes('serpent'))return 'serpent';
 if(candidates.includes('insect'))return 'insect';
 if(candidates.includes('fish')&&['fish','predatory-shark','filter-shark','tube-snouted-fish'].includes(profile.id))return 'fish';
 throw Error('Unsupported controlled library family');
}
export function controlledLibraryLayout(family){
 const common='Strict side profile facing RIGHT, head right and posterior left. One whole anatomically accurate adult; no duplicate subject. Plain natural midtone pigment without stripes, spots, bands, masks or patches; preserve species structural anatomy, scales, feather edges and material. Keep the whole silhouette, every natural tail or abdomen tip, bill, antenna and toe inside the frame with at least 8 percent clear margin on EVERY side. The TRUE SPECIES TAIL must be painted continuously from attachment through its natural taper or feather fan to its visible tip, separately readable from limbs and body; do not truncate, hide, lengthen a short tail or invent a tail on a tailless species. No floor, cast shadow, scenery, text or props.';
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
 const root=path.resolve(import.meta.dirname,'../../../..'),out=path.resolve(outArg);
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
  const request=controlledLibraryLayout(family);
  const layout=request.layout;
  let prompt=template.prompt;
  const section=(start,end,value)=>{if(prompt.split(start).length!==2||prompt.split(end).length!==2)throw Error('Nonunique prompt section');prompt=prompt.slice(0,prompt.indexOf(start)+start.length)+value+prompt.slice(prompt.indexOf(end));};
  const fauna=prompt.split('\n').filter(x=>x.startsWith('  Fauna adaptation:'));if(fauna.length!==1)throw Error('Fauna card boundary');
  prompt=prompt.replace(fauna[0],`  Fauna adaptation: Earth ${name}; real named anatomy and natural materials take priority over raw procedural genes. Isolated library master, not an Earth landing resident claim.`);
  section('SUBJECT\n','\n\nACCURACY\n',`One Earth ${name}. Species identity features: ${species[0].mustRead.join('; ')}. The controlled plain-coat rule below overrides pigment markings only, never structure.\nGenomic identity (Earth anatomy takes priority): ${JSON.stringify(identity.genome)}\n${layout}`);
  section('ACCURACY\n','\n\nLAYOUT\n',`One anatomically accurate ${name}, one head; ${request.accuracy}; no duplicate subject. Required counts are requests, not measured evidence. No added anatomy, equipment or fantasy growth.`);
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
