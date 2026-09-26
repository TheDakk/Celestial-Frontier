/** G2: canonical species -> controlled master prompt. No authoring, landmarks or labels. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {familyContract} from '../creature-animation/family-contracts.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
export async function compileLibraryMaster(name,outArg){
 const root=path.resolve(import.meta.dirname,'../../../..'),out=path.resolve(outArg);
 const species=JSON.parse(fs.readFileSync(root+'/port/v2/reference/fauna.json')).filter(x=>x.name===name);
 if(species.length!==1||species[0].posture!=='quadruped')throw Error('Exactly one canonical Earth quadruped required');
 if(fs.existsSync(out))throw Error('New packet directory required');
 fs.mkdirSync(out,{recursive:true});
 const scratch=fs.mkdtempSync('/private/tmp/cf-g2-compiler-');
 try{
  execFileSync(process.execPath,[root+'/port/v2/tools/landfall-snapshot/kit-export.mjs',scratch+'/kit'],{cwd:root,stdio:'pipe'});
  const compiler=await import(pathToFileURL(scratch+'/kit/kit-compiler.mjs').href),kit=fs.readFileSync(root+'/ART_KIT.md','utf8'),compiled=compiler.compileCanonicalEarthKit(kit),template=compiled.familyReferences[0];
  const entry=`import {_EARTH_NAMES} from '${root}/port/v2/packages/domain/descriptors/src/index.ts';import {makeGenome} from '${root}/port/v2/packages/domain/genome/src/index.ts';import {hashInt} from '${root}/port/v2/packages/domain/rand/src/index.ts';import {speciesVisualKey} from '${root}/port/v2/packages/art/src/speciesidentity.ts';const name=${JSON.stringify(name)},i=_EARTH_NAMES.fauna.indexOf(name),ki=Object.keys(_EARTH_NAMES).indexOf('fauna');if(i<0)throw Error('No canonical named genome');const genome={...makeGenome(hashInt(0xEA47,i,ki)>>>0,'fauna',1),_earthName:name};export default {genome,visualKey:speciesVisualKey(genome),index:i};`;
  fs.writeFileSync(scratch+'/entry.mjs',entry);
  const bundle=await rolldown({input:scratch+'/entry.mjs',platform:'node'});try{await bundle.write({file:scratch+'/identity.mjs',format:'es'});}finally{await bundle.close();}
  const identity=(await import(pathToFileURL(scratch+'/identity.mjs').href)).default;
  const layout='Strict side profile facing RIGHT, head right and tail left. One whole adult in a quiet neutral standing pose. Exactly FOUR separately visible legs, two fore and two hind; far legs offset horizontally so all four feet are readable, naturally connected and resting at one level. Real species proportions; no crossed, raised or merged legs. Plain natural midtone coat: omit all pigment stripes, spots, bands, masks and patches, which separate marking masks will provide. Preserve real structural anatomy, ears, horns if this species has them, feet, nose and eyes. Whole body including ear/horn/tail tips inside frame with at least 8 percent margin. No floor, cast shadow or scenery.';
  let prompt=template.prompt;
  const section=(start,end,value)=>{if(prompt.split(start).length!==2||prompt.split(end).length!==2)throw Error('Nonunique prompt section');prompt=prompt.slice(0,prompt.indexOf(start)+start.length)+value+prompt.slice(prompt.indexOf(end));};
  const fauna=prompt.split('\n').filter(x=>x.startsWith('  Fauna adaptation:'));if(fauna.length!==1)throw Error('Fauna card boundary');
  prompt=prompt.replace(fauna[0],`  Fauna adaptation: Earth ${name}; real named anatomy and natural materials take priority over raw procedural genes. Isolated library master, not an Earth landing resident claim.`);
  section('SUBJECT\n','\n\nACCURACY\n',`One Earth ${name}. Species identity features: ${species[0].mustRead.join('; ')}. The controlled plain-coat rule below overrides pigment markings only, never structure.\nGenomic identity (Earth anatomy takes priority): ${JSON.stringify(identity.genome)}\n${layout}`);
  section('ACCURACY\n','\n\nLAYOUT\n',`One anatomically accurate ${name}, one head, four visible legs, one tail of its real species length, no duplicate subject. Required counts are requests, not measured evidence. No added anatomy, equipment or fantasy growth.`);
  section('LAYOUT\n','\n\nTECHNICAL OUTPUT\n',layout);
  const size='Create a square 1024 x 1024 PNG.';if(prompt.split(size).length!==2)throw Error('Technical size boundary');prompt=prompt.replace(size,'Create a square 1254 x 1254 PNG.');
  const ref='audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png',refHash=sha(fs.readFileSync(root+'/'+ref));if(refHash!=='c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62')throw Error('Style lock changed');
  fs.writeFileSync(out+'/prompt.txt',prompt,{flag:'wx'});
  fs.writeFileSync(out+'/subject-source.json',JSON.stringify({name,family:'quadruped',species:species[0],...identity},null,2)+'\n',{flag:'wx'});
  fs.copyFileSync(scratch+'/kit/manifest.json',out+'/compiler-inputs.json');
  fs.writeFileSync(out+'/request.json',JSON.stringify({schema:'cf.g2-master-request/v1',name,family:'quadruped',tool:'image_gen.imagegen',promptSha256:sha(prompt),kitSha256:sha(kit),compilerSha256:sha(fs.readFileSync(import.meta.filename)),reference:ref,referenceSha256:refHash,requestedSize:[1254,1254],requestedVisibleLegs:4,observedVisibleLegs:null,authoringCreated:false,sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()},null,2)+'\n',{flag:'wx'});
  return {out,name,promptSha256:sha(prompt)};
 }finally{fs.rmSync(scratch,{recursive:true});}
}
