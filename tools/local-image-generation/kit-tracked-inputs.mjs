import {execFileSync} from 'node:child_process';
export const KIT_TRACKED_SOURCES=Object.freeze([
 'browser-variant-plan.json','browser-variant-plan.mjs','browser-variant-plan.test.mjs','browser-variant-source.mjs',
 'first-step-harness.mjs','first-step-harness.test.mjs','offline-variant-proof.mjs','offline-variant-proof.test.mjs',
 'run-first-step-diagnostic.mjs','stage-worker-first-step.test.mjs',
 'kit-stage-worker.mjs','kit-worker-engine.mjs','kit-worker-expansion.mjs','kit-engine-math.mjs','kit-contact-math.mjs',
].map(name=>'tools/local-image-generation/'+name));
export function assertTrackedKitSources(root,tracked){
 const files=new Set(tracked??execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0'));
 const missing=KIT_TRACKED_SOURCES.filter(file=>!files.has(file));
 if(missing.length)throw Error('Untracked load-bearing kit source: '+missing.join(', '));
 return {tracked:true,files:KIT_TRACKED_SOURCES};
}
