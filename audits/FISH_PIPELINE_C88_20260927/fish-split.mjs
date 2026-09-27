/** Fixed candidate recipe. No default author or solver changes, no acceptance claim. */
import fs from'node:fs';import{createHash}from'node:crypto';
export function selectFishFinBoundaries(record,binding,probe){
 const need=(x,m)=>{if(!x)throw Error('Fish seam recipe: '+m);};
 need(record.template?.id==='fish','fish only');need(probe.recordRecipeHash===record.recipeHash&&probe.bindingHash===binding.bindingHash,'source-bound probe');
 const owners=new Map(binding.parts.map(p=>[p.id,p.joint]));need(owners.size===binding.parts.length,'unique part IDs');
 const fins=new Set(['pectoralNear','pectoralFar','dorsal']),body=new Set(['root',...Array.from({length:6},(_,i)=>'spine'+i)]),pairs=[],seen=new Set();
 for(const j of probe.excluded){const a=owners.get(j.ancestorPart),b=owners.get(j.descendantPart);need(a&&b,'known observed owners');if(!(fins.has(a)&&body.has(b)||fins.has(b)&&body.has(a)))continue;
  need(Number.isInteger(j.sourceEdges)&&j.sourceEdges>0&&j.samples?.length>0,'observed painted boundary');const p=[j.ancestorPart,j.descendantPart],key=p.slice().sort().join('\0');need(!seen.has(key),'unique observed boundary');seen.add(key);pairs.push(p);
 }
 return pairs;
}
const owner=new URL('../../port/v2/tools/creature-animation/split-observed-surfaces.mjs',import.meta.url),original=fs.readFileSync(owner,'utf8'),sha=b=>createHash('sha256').update(b).digest('hex');
export const sourceOwnerSha256=sha(original);
if(sourceOwnerSha256!=='5086e5e4f491e9ad62fccd375503bb7eb9cd85d36e2cddd54a71ce847f021b95')throw Error('Source split owner changed; fresh review required');
const old='for(const [i,j]of shape)if(!collar.has(i))locked.set(i,j);',replacement="let finCollar=new Set(collar);for(let i=0;i<2;i++)finCollar=new Set([...finCollar,...[...finCollar].flatMap(j=>[...near[j]])]);\n for(const [i,j]of shape)if(!collar.has(i)&&!(j==='pectoralFar'&&finCollar.has(i)))locked.set(i,j);";
if(original.split(old).length!==2)throw Error('Exact collar site');
const source=original.replace(old,replacement).replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,owner).href));
export const virtualOwnerSha256=sha(source);
const candidate=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
export async function splitFishSurfaces(binding,record,probe,options){
 const pairs=selectFishFinBoundaries(record,binding,probe),r=await candidate.splitObservedSurfaces(binding,record,probe,{...options,paintBoundaryPairs:pairs});return{...r,receipt:{...r.receipt,fixedCandidateRecipe:'tail-gap + axial remainder + observed body/pectoral/dorsal boundaries + far-pectoral five-ring collar',sourceOwnerSha256,virtualOwnerSha256}};
}
