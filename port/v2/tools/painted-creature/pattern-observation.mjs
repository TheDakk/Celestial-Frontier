/** Semantic G2 pattern review. Geometry/colour variance is not proof of stripes or rosettes.
 * A source-bound visual observation is required; expected prompt text never supplies a verdict. */
import{createHash}from'node:crypto';
export const patternRequirements=species=>(species.mustRead??[]).filter(s=>/\b(stripes?|striped|spots?|spotted|rosettes?|blotches|bands?|banded|ringed|mottled)\b/i.test(s));
export function assessPatternObservation(species,masterBytes,observation){
 const required=patternRequirements(species),masterSha256=createHash('sha256').update(masterBytes).digest('hex');
 const out={schema:'cf.g2-pattern-observation/v1',name:species.name,masterSha256,required,source:'explicit visual observation; not prompt or pixel-variance inference'};
 if(!required.length)return{...out,status:'NOT_REQUIRED'};
 if(!observation||observation.name!==species.name||observation.masterSha256!==masterSha256)return{...out,status:'REFUSE',reason:'Missing or stale source-bound pattern observation'};
 if(observation.status!=='PRESENT')return{...out,status:'REFUSE',reason:observation.status==='ABSENT'?'Flat coat on patterned species':'Pattern unresolved'};
 if(!Array.isArray(observation.features)||required.some(feature=>!observation.features.some(r=>r.requirement===feature&&r.status==='PRESENT'&&typeof r.observed==='string'&&r.observed.trim().length>0)))return{...out,status:'REFUSE',reason:'Every required pattern feature needs an explicit observation'};
 return{...out,status:'PASS',features:observation.features};
}
