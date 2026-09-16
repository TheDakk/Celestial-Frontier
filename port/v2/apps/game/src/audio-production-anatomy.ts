import {hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {validateResolvedSoundBody,PRODUCTION_FAMILIES,PRODUCTION_MATERIALS,type ResolvedSoundBody,type ProductionMaterial} from './audio-production-plan.js';

export interface SoundAnatomyRecord {
 readonly kind:string;readonly recipeHash:string;readonly template:{readonly id:string;readonly version:number};
 readonly identity:{readonly speciesVisualKey:string;readonly seed:number;readonly ownerId:string;readonly earthName:string|null};
 readonly materials:{readonly surface:string};
}
export type SoundBodyContext=Pick<ResolvedSoundBody,'kingdom'|'size'|'medium'>;
/** The visual intake still owns cut-out/geometry admission. This adapter verifies
 * the same record hash and never re-reads genes to override a painter's material.
 * Physical acoustic size and current propagation medium are not in today's rig
 * record, so the caller must provide them explicitly, never an invented default. */
export async function soundBodyFromResolvedRecord(input:SoundAnatomyRecord,context:SoundBodyContext):Promise<ResolvedSoundBody> {
 const record=structuredClone(input),{recipeHash,...body}=record;
 if(JSON.stringify(record).length>256000||!/^[a-f0-9]{64}$/u.test(recipeHash)||await hashJSON(body)!==recipeHash)
   throw new TypeError('Sound anatomy: corrupted record hash');
 if(record.template?.version!==1||record.kind!==record.template.id||!(PRODUCTION_FAMILIES as readonly string[]).includes(record.kind))
   throw new TypeError('Sound anatomy: unsupported family record');
 const aliases:Record<string,ProductionMaterial>={fur:'furred',feathers:'feathered',scales:'scaled',chitin:'chitinous'};
 const raw=record.materials?.surface;
 const material=Object.hasOwn(aliases,raw)?aliases[raw]:raw;
 if(!(PRODUCTION_MATERIALS as readonly string[]).includes(material??''))throw new TypeError('Sound anatomy: unresolved material');
 const resolved={...record.identity,...context,family:record.kind,material,recipeHash} as ResolvedSoundBody;
 validateResolvedSoundBody(resolved);return Object.freeze(resolved);
}
