import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{createRequire}from'node:module';
import{autoAuthor,prepareSubject,mirrorSubject,referenceStats}from'../../port/v2/tools/anatomy-verify/auto-author.mjs';
import{familyContract,familyContactChains}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{reviewedExclusions}from'../../port/v2/tools/anatomy-verify/reviewed-exclusions.mjs';
import{speciesVisualKey}from'../../port/v2/packages/art/src/speciesidentity.ts';
import{earthFaunaProfile}from'../../port/v2/apps/game/src/earth-fauna-profiles.ts';
const root=path.resolve(import.meta.dirname,'../..'),base='audits/C163_REFERENCE_REPAIR_20261002',out=base+'/reference-comparison',require=createRequire(root+'/port/v2/package.json'),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),bindings=new Map(),read=p=>{const b=fs.readFileSync(p);bindings.set(p,sha(b));return b;},json=p=>JSON.parse(read(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert(!fs.existsSync(out));fs.mkdirSync(out);const sets=['audits/C132_REFERENCES_20261001/reference-packets.json','audits/C136_BIRD_INSECT_REFERENCES_20261002/reference-packets.json','audits/C136_SPRAWLER_REFERENCES_20261002/reference-packets.json'];
const original=[...json('audits/G1_AUTO_AUTHOR_20260926/corpus.json').subjects,...json('audits/G1_AUTO_AUTHOR_20260926/pilots/reference-pool-extras.json')],extra=sets.flatMap(json),cache=new Map();
async function reference(row){const master=read(row.packet+'/master.png'),{data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true}),prepared=prepareSubject(data,info.width,info.height),authoring=json(row.packet+'/authoring.json'),subject=json(row.packet+'/subject-source.json'),stats=referenceStats(prepared,authoring);return{...prepared,family:row.family,subjectId:row.id,name:subject.name,packet:row.packet,authoring,partPaint:stats.partPaint,unclaimedFrac:stats.unclaimedFrac,skeleton:null};}
for(const r of [...original,...extra])cache.set(r.id,await reference(r));
const reviews=new Map(json(base+'/reviewed-presence.json').map(r=>[r.id,json(r.review)])),targets=json('audits/G2_C136_REPAIRS_20261002/pilot.json'),rows=[];
for(const row of targets){
 const packet=row.packet,subject=json(packet+'/subject-source.json'),profile=earthFaunaProfile(subject.name),master=read(packet+'/master.png'),{data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(subject.family,row.family);assert.equal(subject.visualKey,speciesVisualKey({...subject.genome}));assert.deepEqual(subject.profile,profile);
 const options={id:row.id,family:row.family,target:prepareSubject(data,info.width,info.height),mirrored:mirrorSubject(data,info.width,info.height),materials:{surface:row.family==='insect'?'chitin':row.family==='biped-bird'?'feathers':profile.id==='salamander'?'smooth skin':'fur'},topK:1,chains:familyContactChains(familyContract(row.family)),counter:{}};
 const refsFor=rs=>rs.map(r=>cache.get(r.id)).filter(r=>r.subjectId!==row.id&&r.name!==subject.name);
 const baselineRefs=refsFor(original),candidateRefs=refsFor([...original,...extra]);assert(candidateRefs.every(r=>r.name!==subject.name));
 const baseline=autoAuthor({...options,refs:baselineRefs}),expanded=autoAuthor({...options,refs:candidateRefs}),review=reviews.get(row.id),rx=review?reviewedExclusions({packetDir:packet,review,family:row.family}):null;
 const reviewed=rx?autoAuthor({...options,refs:candidateRefs,excludedJoints:rx.excludedJoints}):expanded;
 if(rx)assert.equal(rx.refused,null);
 const summarize=r=>({verdict:r.verdict,reasons:r.reasons,bestReference:r.evidence?.bestReference??null,groundContacts:r.evidence?.inventory?.target?.ground??null});
 const targetDir=out+'/'+row.id;fs.mkdirSync(targetDir);write(targetDir+'/baseline.json',baseline);write(targetDir+'/expanded.json',expanded);if(rx)write(targetDir+'/reviewed.json',reviewed);
 const result={id:row.id,name:subject.name,family:row.family,baseline:summarize(baseline),expanded:summarize(expanded),reviewed:rx?summarize(reviewed):null,excludedJoints:rx?.excludedJoints??null,leaveOneSpeciesOut:true,qualityAccepted:false,scope:'Author-only candidate comparison, no reference-pool registration, intake, static, native, gallery or visual admission.'};rows.push(result);console.log(JSON.stringify(result));
}
read('port/v2/tools/anatomy-verify/auto-author.mjs');read('port/v2/tools/anatomy-verify/reviewed-exclusions.mjs');read('port/v2/tools/painted-creature/reviewed-presence.mjs');read(base+'/compare-references.mjs');
for(const[p,s]of bindings)assert.equal(sha(fs.readFileSync(p)),s,'input drift '+p);
write(out+'/summary.json',{schema:'cf.c163-reference-comparison/v1',rows,originalPool:original,additionalCandidateReferences:extra,policy:'Same current author, topK=1, chains+counter, rank0 only, no shopping or retry. A third branch supplies the separate exact-master admitted presence reviews. No reference is self/same-species. All candidates remain unregistered.',inputs:[...bindings].map(([path,sha256])=>({path,sha256})),qualityAccepted:false});
