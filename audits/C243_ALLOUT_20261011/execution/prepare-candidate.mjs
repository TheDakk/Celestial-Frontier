/** Prepare one new canonical repaint. Run only inside the active machine window. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileLibraryMaster} from '../../../port/v2/tools/painted-creature/compile-library-master.mjs';

const base='audits/C243_ALLOUT_20261011/execution';
const [batchArg,indexArg,roundArg='1',candidateArg='1']=process.argv.slice(2);
const [batch,index,round,candidate]=[batchArg,indexArg,roundArg,candidateArg].map(Number);
if (![batch,index,round,candidate].every(Number.isSafeInteger)||batch<1||index<1||![1,2].includes(round)||candidate<1||candidate>3) throw Error('usage: prepare-candidate.mjs batch index round candidate');
const ledger=JSON.parse(fs.readFileSync(base+'/ledger.json'));
const subject=ledger.batches.find(b=>b.batch===batch)?.species[index-1];
if (!subject) throw Error('Species must belong to the committed batch ledger');
const slug=subject.name.toLowerCase().replaceAll(' ','-');
const id=`c243b${String(batch).padStart(2,'0')}r${round}c${candidate}-${String(index).padStart(2,'0')}-${slug}`;
const packet=`${base}/batch${String(batch).padStart(2,'0')}/${id}`;
const scores=subject.packets.flatMap(p=>{
  const f=`audits/G1_AUTO_AUTHOR_20260926/auto-sweep7/${p.id}/score.json`;
  return fs.existsSync(f)?JSON.parse(fs.readFileSync(f)).reasons??[]:[];
});
const batchDir=`${base}/batch${String(batch).padStart(2,'0')}`;
const attemptsFile=batchDir+'/attempts.json',notesFile=batchDir+'/repaint-notes.json';
const recent=fs.existsSync(attemptsFile)?JSON.parse(fs.readFileSync(attemptsFile)).filter(a=>a.name===subject.name&&(a.round<round||(a.round===round&&a.candidate<candidate))):[];
const retryNote=(round>1||candidate>1)&&fs.existsSync(notesFile)?JSON.parse(fs.readFileSync(notesFile))[subject.name]??'':'';
const reviewDir=base+'/incoming-reviews';
const reviewReasons=round>1&&fs.existsSync(reviewDir)?fs.readdirSync(reviewDir).filter(f=>f.endsWith('.json')).sort().flatMap(f=>{
 const hold=JSON.parse(fs.readFileSync(reviewDir+'/'+f)).holds?.[subject.name];
 return typeof hold==='string'?[`review-HOLD: ${hold}`]:[];
}):[];
const reasons=[...new Set([...scores,...recent.flatMap(a=>[...(a.reasons??[]),...(a.visualHold?['source-identity: '+a.visualHold]:[])]),...reviewReasons])];
const parts=[...new Set(reasons.flatMap(r=>[...r.matchAll(/part ([^ ]+) \(([^)]+)\)/g)].map(m=>m[1])))];
await compileLibraryMaster(subject.name,packet);
const promptPath=packet+'/prompt.txt',compilerPrompt=fs.readFileSync(promptPath,'utf8');
const source=JSON.parse(fs.readFileSync(packet+'/subject-source.json'));
// Refusal labels are not biological instructions: the canonical species remains authoritative.
const attention=parts.length?`Previous paintings failed to expose or preserve these reference regions: ${parts.join(', ')}. Make the corresponding REAL anatomical structures readable at their true attachments where they exist. These are diagnostic labels, not permission to add anatomy. `:'';
const anatomy=`Species truth has priority: ${source.species.mustRead.join('; ')}. ${source.species.note??''} Preserve naturally short or absent tails and absent external ears. Never invent a missing part to imitate another species. Keep the true tail, feet, limb roots, ear contours and naturally visible far-side parts separately readable wherever biologically possible. No detached strands or islands. `;
const variation=[
  'Use a calm, clearly separated natural stance, with continuous clean contours and no appendage crossings.',
  'Use a fresh composition with more separation between naturally visible near and far appendages; retain natural proportions and all identifying pigments.',
  'Use a fresh shallow side-profile arrangement with particularly legible appendage roots and tips; avoid overlap while preserving biological posture and natural lengths.'
][candidate-1];
const diagnosis=reasons.length?`Previous refusals/HOLD observations (diagnostics only, never permission to invent anatomy): ${reasons.join('; ')}. `:'';
const prefix=`FRAMING PRIORITY: One small whole creature in the central 60 percent of a square 1254 by 1254 canvas. Every extremity at least 200 pixels from all edges. Flat pure magenta background, no ground or shadow. Do not enlarge to fill the frame.\n\nREPAINT ATTENTION: ${diagnosis}${attention}${anatomy}${variation}\n\n`;
const finalFraming="\n\nFINAL COMPOSITION CHECK: Paint the animal SMALL, like a miniature specimen in a large empty square. The complete animal including every appendage must fit inside a central box no wider than 650 pixels and no taller than 650 pixels on the native 1254 by 1254 canvas. Leave at least 275 pixels of flat magenta on EVERY side. No close-up. Do not fill the canvas. This is part of the newly generated painting, not a request to resize or pad a finished image.\n";
const prompt=prefix+compilerPrompt+(retryNote?'\n\nTARGETED REPAINT: '+retryNote+'\n':'')+finalFraming,sha=s=>createHash('sha256').update(s).digest('hex');
fs.writeFileSync(promptPath,prompt);
const q=JSON.parse(fs.readFileSync(packet+'/request.json'));
q.compilerPromptSha256=q.promptSha256;q.promptSha256=sha(prompt);
q.generationMode='Brand-new image; canonical ART_KIT and Atlas style authority retained; no edit target';
q.framingRequest='Central 60 percent; existing 8 percent measured margin unchanged';
q.repaint={round,candidate,priorRefusals:reasons,priorParts:parts,anatomyAuthority:'Canonical species facts; refusal labels never authorize invented anatomy'};
fs.writeFileSync(packet+'/request.json',JSON.stringify(q,null,2)+'\n');
const row={id,name:subject.name,family:source.family,packet,master:packet+'/master.png'};
fs.writeFileSync(packet+'/pilot.json',JSON.stringify([row],null,2)+'\n');
console.log(JSON.stringify(row));
