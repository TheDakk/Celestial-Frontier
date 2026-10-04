import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex'),once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Unique exact source boundary required');return s.replace(a,b);};
const write=(p,s)=>{fs.writeFileSync(p+'.tmp',s,{flag:'wx'});fs.renameSync(p+'.tmp',p);};
const compiler='port/v2/tools/painted-creature/compile-library-master.mjs',beforeCompiler=fs.readFileSync(compiler,'utf8');
let code=once(beforeCompiler,' const candidates=profile?.candidateTemplates??[];',' const candidates=profile?.candidateTemplates??[];\n const extended=candidates.filter(f=>EXTENSION_FAMILIES.includes(f));\n if(extended.length===1&&candidates.length===1)return extended[0];\n if(extended.length)throw Error(\'Ambiguous controlled library family\');');
code=once(code,'export function controlledLibraryLayout(family){','export function controlledLibraryLayout(family,name){\n if(EXTENSION_FAMILIES.includes(family))return controlledFamilyLayout(family,name);');
code=once(code,'const request=controlledLibraryLayout(family);','const request=controlledLibraryLayout(family,name);');
const groups=JSON.parse(fs.readFileSync('audits/C132_REFERENCES_20261001/template-checks.json')).families;
let extensions=fs.readFileSync('audits/C132_REFERENCES_20261001/layout-extensions.mjs','utf8');
extensions=once(extensions,'/** C132 audit-only painting vocabulary. Requests are never observed anatomy. */','/** Controlled painting vocabulary only. Requests are never observed anatomy or motion support. */');
extensions=once(extensions,'export const EXTENSION_FAMILIES','const EXTENSION_FAMILIES');
extensions=once(extensions,'export function controlledFamilyLayout(family,name){','const EXTENSION_SPECIES=Object.freeze('+JSON.stringify(Object.fromEntries(groups.map(g=>[g.family,g.names])))+');\nfunction controlledFamilyLayout(family,name){\n if(!EXTENSION_SPECIES[family]?.includes(name))throw Error(\'Named species required for controlled extended family\');');
extensions=once(extensions,'Unsupported audit painting family','Unsupported controlled painting family');
code+='\n'+extensions;
write(compiler,code);
const presence='port/v2/tools/painted-creature/reviewed-presence.mjs',beforePresence=fs.readFileSync(presence,'utf8');
let policy=once(beforePresence,"import {createHash} from 'node:crypto';","import {createHash} from 'node:crypto';\nimport {rolldown} from 'rolldown';\nimport {fileURLToPath} from 'node:url';");
policy=once(policy,'/** v1 admits only reviewed external-tail absence on canonical tailless quadrupeds.','/** The v1 tail schema remains restricted to canonical tailless quadrupeds.\n * The distinct ear schema admits exact-master reviewed absence of external pinnae\n * on independently checked reptile/salamander profiles, never missing ear paint.');
policy=once(policy,'export function admitReviewedPresence({masterBytes, subjectBytes, promptBytes, review}) {','export function admitReviewedPresence({masterBytes, subjectBytes, promptBytes, review}) {\n  if(review?.schema===\'cf.reviewed-external-ear-absence/v1\')return admitReviewedExternalEarAbsence({masterBytes,subjectBytes,promptBytes,review});');
const loader=`
// Bundle the existing TS registry once so this Node tool retains its Node 20+ support.
// Never trust the target subject's asserted profile as biological eligibility.
const profileBundle=await rolldown({input:fileURLToPath(new URL('../../apps/game/src/earth-fauna-profiles.ts',import.meta.url)),platform:'node'});
let earthFaunaProfile;
try{
 const {output}=await profileBundle.generate({format:'es'});
 if(output.length!==1||output[0].type!=='chunk')throw Error('Reviewed presence: single independent profile module required');
 ({earthFaunaProfile}=await import('data:text/javascript;base64,'+Buffer.from(output[0].code).toString('base64')));
}finally{await profileBundle.close();}
const ELIGIBLE_PROFILES=Object.freeze(['lizard','special-lizard','marine-iguana','crocodilian','salamander']);
`;
let ears=fs.readFileSync('audits/C136_SPRAWLER_REFERENCES_20261002/ear-absence-policy.mjs','utf8');
ears=ears.slice(ears.indexOf('export function admitReviewedExternalEarAbsence'));
ears=once(ears,'export function admitReviewedExternalEarAbsence','function admitReviewedExternalEarAbsence');
ears=once(ears,"new URL('../../port/v2/reference/fauna.json',import.meta.url)","new URL('../../reference/fauna.json',import.meta.url)");
policy+=loader+'\n'+ears;
write(presence,policy);
fs.writeFileSync(new URL('integration-authority.json',import.meta.url),JSON.stringify({schema:'cf.c136-compiler-presence-integration/v1',changes:[{file:compiler,beforeSha256:sha(beforeCompiler),afterSha256:sha(code)},{file:presence,beforeSha256:sha(beforePresence),afterSha256:sha(policy)}],scope:'Canonical painting request dispatch and exact-master optional-pinna review only. No certificate, gallery, reference pool or runtime topology admission.'},null,2)+'\n',{flag:'wx'});
