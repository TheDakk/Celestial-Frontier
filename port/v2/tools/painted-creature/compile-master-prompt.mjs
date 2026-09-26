/** Track P1 — compile the painting packet for ONE named creature whose painter master exists: the Art Kit
 * 4E cut-out prompt under the canonical Earth system card (same interpreter and exemplar route the kit uses
 * for Fox/Pheasant/Trout), with counts from the family template, pigments sampled per painter part, and the
 * painter master + ownership map as the anatomy guide. Nothing is painted here; the packet is handed to the
 * lane that owns the image tool. Deterministic; the prompt and every input are hashed into the receipt.
 *   node port/v2/tools/painted-creature/compile-master-prompt.mjs <fitDir> NEW_PACKET_DIR
 */
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs'),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
if(process.argv[2]==='--library'){
 if(process.argv.length!==5)throw Error('Usage: compile-master-prompt.mjs --library EARTH_NAME NEW_PACKET_DIR');
 const {compileLibraryMaster}=await import('./compile-library-master.mjs');
 console.log(JSON.stringify(await compileLibraryMaster(process.argv[3],process.argv[4])));process.exit(0);
}
const [fitArg,outArg]=process.argv.slice(2);if(!fitArg||!outArg)throw Error('Usage: compile-master-prompt.mjs <fitDir> NEW_PACKET_DIR');
const root=process.cwd(),fit=path.resolve(fitArg),out=path.resolve(outArg);if(fs.existsSync(out))throw Error('New packet directory required');fs.mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const record=JSON.parse(fs.readFileSync(path.join(fit,'record.json'),'utf8')),declaration=JSON.parse(fs.readFileSync(path.join(fit,'declaration.json'),'utf8'));
const masterFile=path.join(root,record.source),masterBytes=fs.readFileSync(masterFile);if(sha(masterBytes)!==record.geometry.cutoutAssetHash)throw Error('Painter master hash mismatch');
const master=PNG.sync.read(masterBytes),labels=PNG.sync.read(fs.readFileSync(path.join(fit,'labels.png')));
const earthName=JSON.parse(record.identity.speciesVisualKey)[1].find(([k])=>k==='_earthName')?.[1]?.[1];if(!earthName)throw Error('Named species required for P1');
// Pigments per painter part (mean sRGB of solid pixels), grouped by part family: carapace, legs, claws, eyes.
const groups={};for(const [i,p] of declaration.parts.entries()){const g=/claw|pincer|chel/i.test(p.id)?'claws':/eye/i.test(p.id)?'eyes':/leg/i.test(p.id)?'legs':/shadow/i.test(p.id)?'shadow':'carapace';(groups[g]??=[]).push(i+1);}
const pigment={};for(const [g,ids] of Object.entries(groups)){if(g==='shadow')continue;let r=0,gg=0,b=0,n=0;for(let i=0;i<master.width*master.height;i++){if(master.data[i*4+3]<250||!ids.includes(labels.data[i*4]))continue;r+=master.data[i*4];gg+=master.data[i*4+1];b+=master.data[i*4+2];n++;}if(n)pigment[g]={hex:'#'+[r,gg,b].map(v=>Math.round(v/n).toString(16).padStart(2,'0')).join(''),pixels:n};}
const COUNTS={brachyuran:'one carapace, exactly one carapace; eight walking legs, four on the near flank and four on the far, exactly eight legs; two clawed forelimbs, exactly two claws; two stalked eyes, exactly two eyes; no tail, zero tails',quadruped:'one head, exactly one head; four legs, two fore and two hind, exactly four legs; one tail, exactly one tail'};
// Species override: counts describe the animal's VISIBLE anatomy in its natural pose, never the template's maximum
// (P1 verdict, 2026-09-20: the coconut crab hides its fourth walking pair; the template has eight legs).
const SPECIES_COUNTS={'Coconut Crab':'one carapace, exactly one carapace; six visible walking legs, three on the near flank and three on the far, exactly six visible legs, the small fourth walking pair hidden beneath the carapace; two clawed forelimbs, exactly two claws; two stalked eyes, exactly two eyes; no tail, zero tails'};
const counts=SPECIES_COUNTS[earthName]??COUNTS[record.template.id];if(!counts)throw Error('No count line for template '+record.template.id);
const family={brachyuran:'crab (brachyuran)',quadruped:'mammal quadruped'}[record.template.id];
const anatomy={brachyuran:`broad ${pigment.carapace?.hex??''} chitin carapace wider than tall, eight jointed walking legs in two ranks with the far rank foreshortened behind the near rank, two heavy jointed claws held forward, two small dark stalked eyes; low crawling stance, weight on the leg tips, no ground plane`}[record.template.id];
const pig=Object.entries(pigment).filter(([g])=>g!=='eyes').map(([g,v])=>`${g} ${v.hex}`).join(', ');
// Bundle the kit compiler (same as every landfall proof) and take the exemplar prompt as the template, as the procedural proof does.
const compilerDir=path.join(out,'compiler');execFileSync(process.execPath,[path.join(root,'port/v2/tools/landfall-snapshot/kit-export.mjs'),compilerDir],{cwd:root,stdio:['ignore','pipe','pipe']});
const compiler=await import(pathToFileURL(path.join(compilerDir,'kit-compiler.mjs')).href),kit=fs.readFileSync(path.join(root,'ART_KIT.md'),'utf8'),compiled=compiler.compileCanonicalEarthKit(kit),template=compiled.familyReferences[0];
const card=compiled.systemCard.replace('\n  One signature:',`; painted-master authoring for the procedural roster, not an Earth landing resident: ${earthName}, ${family}, land; ${pig}.\n  One signature:`);
const subject=`One ${earthName}, a ${family}; a fraction of human height; ${counts}; matte chitin with a faint mineral sheen; ${anatomy}; pigments: ${pig}; no armour, no harness, no gear, no added growth or bioluminescence; the pose, proportions and part layout of the supplied painter guide are the anatomy contract: same stance, same claw position, same leg arrangement, same facing.`;
const replaceSection=(text,start,end,value)=>{if(text.split(start).length!==2||text.split(end).length!==2)throw Error('Prompt boundary '+start);return text.slice(0,text.indexOf(start)+start.length)+value+text.slice(text.indexOf(end));};
let prompt=template.prompt.replace(template.systemCard,card);prompt=replaceSection(prompt,'SUBJECT\n','\n\nACCURACY\n',subject);
const accuracy=prompt.slice(prompt.indexOf('ACCURACY\n')+9,prompt.indexOf('\n\nLAYOUT\n')).replace(/Anatomy\/count constraints: .*?\./,`Anatomy/count constraints: ${counts}.`);
prompt=replaceSection(prompt,'ACCURACY\n','\n\nLAYOUT\n',accuracy);
if(prompt.includes('Fox')||prompt.includes('canid'))throw Error('Exemplar text leaked into the prompt');
fs.writeFileSync(path.join(out,'prompt.txt'),prompt);
// Anatomy guide: painter master at 3× (nearest), and the ownership map beside it.
const box=(()=>{let x0=master.width,y0=master.height,x1=0,y1=0;for(let i=0;i<master.width*master.height;i++)if(master.data[i*4+3]>8){const x=i%master.width,y=(i-x)/master.width;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return {left:Math.max(0,x0-16),top:Math.max(0,y0-16),width:Math.min(master.width,x1+17)-Math.max(0,x0-16),height:Math.min(master.height,y1+17)-Math.max(0,y0-16)};})();
const crop=await sharp(masterBytes).extract(box).resize({width:box.width*3,kernel:'nearest'}).png().toBuffer(),own=await sharp(fs.readFileSync(path.join(fit,'parts/ownership.png'))).extract(box).resize({width:box.width*3,kernel:'nearest'}).png().toBuffer();
const m=await sharp(crop).metadata();const guide=await sharp({create:{width:m.width*2+48,height:m.height+32,channels:4,background:{r:255,g:0,b:255,alpha:1}}}).composite([{input:crop,left:16,top:16},{input:own,left:m.width+32,top:16}]).png().toBuffer();
fs.writeFileSync(path.join(out,'anatomy-guide.png'),guide);fs.copyFileSync(masterFile,path.join(out,'painter-master.png'));fs.copyFileSync(path.join(fit,'labels.png'),path.join(out,'painter-labels.png'));
fs.rmSync(compilerDir,{recursive:true});
const receipt={schema:'cf.painted-master-packet/v1',status:'PACKET',creatureId:path.basename(fit),earthName,template:record.template,countsSource:SPECIES_COUNTS[earthName]?'species visible anatomy':'template inventory',recordRecipeHash:record.recipeHash,painterMaster:{file:record.source,sha256:record.geometry.cutoutAssetHash,width:master.width,height:master.height},pigment,counts,subject,promptSha256:sha(prompt),kitSha256:sha(kit),systemCard:card,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  paintingInstructions:['Paint with the image tool that painted the accepted Earth masters and the 2026-09-16 procedural candidate; send prompt.txt verbatim and attach anatomy-guide.png as the anatomy reference.','Output: 1024×1024 cut-out on the magenta key per the kit TECHNICAL OUTPUT block; retain the exact sent prompt, the tool, the seed if any, and the PNG sha256 in the packet.','The painter guide is the anatomy contract: same stance, claw position, leg arrangement and facing; counts as stated.','Intake: key + despill, author part masks for the NEW painting (canvas labels must not be reused), landmarks, observed split, binding; native rows on the anatomy chain exactly as the Civet.','Failure on anatomy drift (count, merged limbs, wrong facing) is a finding for the T1/T2 trust track, not a retry with a changed prompt.'],qualityAccepted:false};
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({packet:out,earthName,pigment,promptChars:prompt.length}));
