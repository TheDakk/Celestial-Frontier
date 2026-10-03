import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {withPaintedContactSupports} from './painted-supports.js';
import {buildTimeline,buildActionTimeline} from './timeline.js';
import {actionsFor} from './family-actions.js';
import {createGsapPlayer} from './gsap-adapter.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url);
const inputs=JSON.parse(fs.readFileSync(new URL('audits/BIRD_SUPPORT_C75_20260927/inputs.json',root),'utf8')).cases as [string,string][];
const read=(dir:string,file:string)=>JSON.parse(fs.readFileSync(new URL(dir+'/'+file,root),'utf8'));
const fixtures=(name:string)=>{const dir=inputs.find(r=>r[0]===name)![1],record=read(dir,'record.json'),binding=read(dir,'binding.json'),base=compileBodyCard(record,record.genome);return{record,binding,base,painted:withPaintedContactSupports(base,record,binding)};};
function failures(f:ReturnType<typeof fixtures>,timeline:ReturnType<typeof buildTimeline>){
 const solver=createFamilyContactSolver(f.record,observedContactSupports(f.record,f.binding));let pose:Record<string,{rotation:number;dx?:number;dy?:number}>={},n=0;
 const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});
 try{for(let i=0;i<=120;i++){const ms=timeline.durationMs*i/120;pose={};player.seek(ms);try{solver.resolve(pose,{actionId:timeline.actionId,elapsedMs:ms,durationMs:timeline.durationMs,weight:1,realm:f.painted.realm,...timeline.actionId.startsWith('melee:')?{travel:'stage' as const}:{}});}catch{n++;}}}finally{player.stop();}return n;
}
// C201 changes only the final local neck/head curl before the existing painted
// torso author. Contact-valid curves still need that silhouette repair: a green
// contact probe is not evidence that the old nape shape is safe.
const faintHead=['neck0','neck1','head'] as const;
const coherentHeadTracks=(before:ReturnType<typeof buildTimeline>)=>Object.fromEntries(faintHead.map(j=>[j,before.tracks[j]!.map((key,i,keys)=>i===keys.length-1?{...key,value:0}:key)]));
function expectCoherentFaintHead(before:ReturnType<typeof buildTimeline>,after:ReturnType<typeof buildTimeline>){
 for(const joint of faintHead){
  expect(before.tracks[joint]!.at(-1)!.value).not.toBe(0); // The retained old curl is a real negative control.
  expect(after.tracks[joint]).toEqual(coherentHeadTracks(before)[joint]);
 }
}
function expectPassingFaint(before:ReturnType<typeof buildTimeline>,after:ReturnType<typeof buildTimeline>){
 expectCoherentFaintHead(before,after);
 const{hash:oldHash,...old}=before,{hash:newHash,...actual}=after;
 expect(actual).toEqual({...old,tracks:{...old.tracks,...coherentHeadTracks(before)},notes:[...old.notes,'axial-faint:coherent-upper-body-v1']});
 expect(newHash).not.toBe(oldHash);
}
it.each([['c54-14-goose','hit'],['c54-14-goose','tame'],['c54-15-quail','tame'],['c56-10-raven','hit'],['c59-08-vulture','hit'],['c56-15-dove','melee:claw'],['02-pigeon','tame']])('authors %s %s against the actual painted supports',(name,id)=>{
 const f=fixtures(name),before=buildTimeline(f.base,id,f.base.identity.seed),after=buildTimeline(f.painted,id,f.painted.identity.seed);
 expect(failures(f,before)).toBeGreaterThan(0);expect(failures(f,after)).toBe(0);
 expect(after.phases).toEqual(before.phases);expect(after.durationMs).toBe(before.durationMs);
 expect(buildActionTimeline(f.painted,actionsFor(f.painted.template.id,f.painted.anatomy)![id]!,f.painted.identity.seed)).toEqual(buildActionTimeline(f.base,actionsFor(f.base.template.id,f.base.anatomy)![id]!,f.base.identity.seed));
});
it('preserves every already-passing probe outcome',()=>{
 for(const [name] of inputs){const f=fixtures(name);for(const id of Object.keys(actionsFor(f.base.template.id,f.base.anatomy)!)){
  const before=buildTimeline(f.base,id,f.base.identity.seed),after=buildTimeline(f.painted,id,f.painted.identity.seed);
  if(failures(f,before)===0){
   expect(failures(f,after)).toBe(0);
   if(id==='faint')expectPassingFaint(before,after);else expect(after).toEqual(before);
  }
 }}
},20_000); // Exhaustive fixture/action/contact sampling; retain every assertion under full-profile contention.

it.each(['c59-08-vulture','c56-15-dove','02-pigeon','04-hawk-v2'])('authors %s faint against painted supports without changing limbs or timing',(name)=>{
 const f=fixtures(name),before=buildTimeline(f.base,'faint',f.base.identity.seed),after=buildTimeline(f.painted,'faint',f.painted.identity.seed);
 expect(failures(f,before)).toBeGreaterThan(0);expect(failures(f,after)).toBe(0);
 expect(after.notes.some(n=>n.startsWith('grounded-bird:painted-faint-gain='))).toBe(true);
 expect(after.phases).toEqual(before.phases);expect(after.durationMs).toBe(before.durationMs);
 expect(after.limitsRad).toEqual(before.limitsRad);expect(after.secondary).toEqual(before.secondary);expect(after.deform).toEqual(before.deform);
 expectCoherentFaintHead(before,after);
 for(const [joint,keys]of Object.entries(before.tracks))if(!['root','pelvis','spine','chest',...faintHead].includes(joint))expect(after.tracks[joint]).toEqual(keys);
 // Unobserved cards and the override constructor keep the original canonical action.
 const raw=actionsFor(f.base.template.id,f.base.anatomy)!.faint!;
 expect(buildActionTimeline(f.base,raw,f.base.identity.seed)).toEqual(before);
});

it('rejects restored nape curl, erased anticipation and unrelated faint changes',()=>{
 const f=fixtures('c54-14-goose'),before=buildTimeline(f.base,'faint',f.base.identity.seed),after=buildTimeline(f.painted,'faint',f.painted.identity.seed);
 expect(failures(f,before)).toBe(0);expectPassingFaint(before,after);
 const mutate=(edit:(timeline:ReturnType<typeof buildTimeline>)=>ReturnType<typeof buildTimeline>)=>expect(()=>expectPassingFaint(before,edit(structuredClone(after)))).toThrow();
 mutate(t=>({...t,tracks:{...t.tracks,neck0:before.tracks.neck0!}}));
 mutate(t=>({...t,tracks:{...t.tracks,head:t.tracks.head!.map(k=>({...k,value:0}))}}));
 mutate(t=>({...t,tracks:{...t.tracks,wingNearTip:t.tracks.wingNearTip!.map((k,i)=>i===1?{...k,value:k.value+.01}:k)}}));
 mutate(t=>({...t,limitsRad:{...t.limitsRad,head:{...t.limitsRad.head!,max:t.limitsRad.head!.max+.01}}}));
 mutate(t=>({...t,durationMs:t.durationMs+1}));
});
