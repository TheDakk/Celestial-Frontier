import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir=import.meta.dirname,root=path.resolve(dir,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const template=read('audits/WILD_V43_PROOF_20260913/wild-launch.prompt.txt');
assert.equal(template.split('\nSUBJECT\n').length,2);assert.equal(template.split('\nACCURACY\n').length,2);
const prefix=template.split('\nSUBJECT\n')[0],suffix='\nACCURACY\n'+template.split('\nACCURACY\n')[1];
const atlas='audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png';
assert.equal(sha(fs.readFileSync(path.join(root,atlas))),'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62');
const kit=read('ART_KIT.md'),source=read('port/v2/packages/domain/combatcore/src/combatcore.verbatim.js');
const themes=[['fire','magma','Magma Strike','burnt sienna, warm amber flame, pale gold cores and charcoal fragments'],['frost','shatter','Shatterfrost','ivory ice, pale blue facets and cold slate shadows'],['storm','chain','Chain Lightning','warm ivory forked arcs, slate cloud fragments and ash dust'],['tide','rip','Riptide','blue-green water sheets, ivory foam and deep blue shadows'],['stone','bould','Boulder Charge','ochre stone, grey-brown fracture faces and umber grit'],['venom','venom','Venom Strike','olive sap, yellow-green droplets and dark green-brown film'],['void','eclip','Eclipse Strike','near-black indigo torn-dark shapes, charcoal debris and small violet accents'],['sand','sblast','Sandblast','ochre sand, buff grain clusters and umber scour marks'],['chem','acid','Acid Spray','pale lime reactive foam, ivory bubbles and olive etched fragments'],['psionic','mspike','Mind Spike','pearl ivory ripples, silver-grey warped-air crescents and subtle violet accents; no pink body pigment']];
const phaseShapes={
fire:['three compact curled flame tongues with clustered embers rising from the root','one long tapering horizontal flame slash with ember clusters flowing right','an outward burst of flame tongues and char flecks converging on the contact'],
frost:['a compact cluster of sharp ice chips gathering above the root','a horizontal lance-shaped crystalline sweep with rime chips','a sharp crystal shatter fan with rime fragments radiating from the contact'],
storm:['a compact charged dust knot split by short angular forked arcs','a long sharp horizontal branched arc with grouped charged-dust marks','a broken radial arc burst and compact cloud rupture at the contact'],
tide:['a small rolled wave tongue of water and foam lifting from the root','a long low cresting sheet of water with grouped spray','a cupped water splash, foam crest and bounded spray spreading from the contact'],
stone:['a tight rising wedge of irregular rock shards and grit','a long wedge-shaped scouring rock-and-grit sweep pointing right','a fanning burst of fractured rock plates and grit at the contact; no actual ground plane'],
venom:['a compact globular sap curl with a few round droplets','a long tapered liquid slash with connected viscous spatter','a sharply bounded radial spatter and irregular corroding film splash at the contact'],
void:['a compact torn-dark crescent drawing small debris inward','a long narrow torn-dark seam with dark splinters pulled along it','an incomplete collapsing ring of torn darkness drawing debris toward the contact'],
sand:['a tight curled sand-grain plume lifting from the root','a long pointed stream of grouped grains and swept scour strokes','a spilling fan of ochre grains and dune-like curled particle clusters at the contact'],
chem:['a compact cluster of fizzing foam and reactive droplets','a long pressurized reactive spray with small foam bubbles','a bounded bursting foam splash with scattered etched-looking flakes at the contact'],
psionic:['two compact warped-air crescent ripples starting from the root','a narrow pressure-lance of nested curved ripples flowing right','a crisp concentric snap-ring break with warped-air crescents expanding from the contact']};
const phases=['launch','travel','impact'],rows=[];
const framing={launch:'Origin (0.20,0.55). All marks within x=0.16..0.41, y=0.36..0.67. The right half stays empty magenta.',travel:'Origin (0.20,0.55), leading tip near contact (0.80,0.55). All marks within x=0.16..0.84, y=0.32..0.70.',impact:'Convergence/contact at (0.80,0.55). All marks within x=0.58..0.91, y=0.30..0.78. The left half stays empty magenta.'};
for(const [theme,id,name,palette]of themes){
 assert.ok(source.includes("id:'"+id+"'"));assert.ok(source.includes(name));
 const label=theme[0].toUpperCase()+theme.slice(1),row=kit.split('\n').find(l=>l.startsWith('| '+label+' |'));assert.ok(row);const cells=row.split('|').map(x=>x.trim());const material=cells[2],accent=cells[3];
 fs.mkdirSync(path.join(dir,theme));
 for(let i=0;i<phases.length;i++){const phase=phases[i],subject=`${label} ability theme, source ability ${id} / ${name}. Material and shape vocabulary (ART_KIT v4.3 closed table): ${material}. Painted material palette: ${palette}. Game accent ${accent} is a tiny accent only; material carries the theme identity. Keep the same material palette and brush hand across all three phases. ${phase.toUpperCase()}: ${phaseShapes[theme][i]}. COMMON-CANVAS REGISTRATION: exactly 1024 x 1024, direction left to right, common origin (0.20,0.55), contact (0.80,0.55). ${framing[phase]} Do not centre or enlarge the phase to fill the canvas. Large empty magenta areas are intentional. Do not paint anchor markers. One phase only. Paint energy as crisp opaque brush shapes: no luminous halo, gradients into the key, ground plane or target creature.`;
 const prompt=prefix+'\nSUBJECT\n'+subject+suffix;const filename=`${theme}/${phase}.prompt.txt`;fs.writeFileSync(path.join(dir,filename),prompt,{flag:'wx'});rows.push({theme,phase,abilityId:id,abilityName:name,material,accent,prompt:filename,promptSha256:sha(prompt),master:`${theme}/${phase}-master.png`,status:'PENDING'});
 }
}
fs.writeFileSync(path.join(dir,'requests.json'),JSON.stringify({schema:'cf.c132-effects-requests/v1',mode:'builtin-imagegen',reference:atlas,referenceSha256:sha(fs.readFileSync(path.join(root,atlas))),prefixSource:'audits/WILD_V43_PROOF_20260913/wild-launch.prompt.txt',prefixSha256:sha(prefix),kitVersion:'4.3',subjectSource:'port/v2/packages/domain/combatcore/src/combatcore.verbatim.js',subjectSourceSha256:sha(source),rows},null,2)+'\n',{flag:'wx'});
console.log('Compiled '+rows.length+' phase prompts; frozen prefix/system card copied byte-for-byte; reference hash verified.');
