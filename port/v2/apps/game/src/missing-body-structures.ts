/** Candidate-template routing and painted admission are separate. Keep the
 * explicitly pending species visible after routing, until source observation,
 * painted fit, complete motion proof and review actually qualify them. */
import {EARTH_FAUNA_PROFILES} from './earth-fauna-profiles.js';
import type {SpecializedTemplateId} from '../../../tools/creature-animation/specialized-templates.mjs';
export const MISSING_BODY_TARGETS:Readonly<Record<string,SpecializedTemplateId>>=Object.freeze({
 'sessile-tunicate':'sessile-filter','fiddler-crab':'brachyuran',
 'bivalve':'bivalve','land-gastropod':'gastropod','water-gastropod':'gastropod',
 'annelid-land':'annelid','annelid-water':'annelid','clawed-crustacean':'crustacean-clawed',
 'terrestrial-crab':'crustacean-clawed','small-crustacean':'crustacean-small',
 'barnacle':'barnacle','sponge':'sessile-filter','tunicate':'colonial-filter',
 'horseshoe-crab':'xiphosuran','larva':'larva','tardigrade':'lobopod',
});
export function missingBodyStructures(){return EARTH_FAUNA_PROFILES.filter(p=>p.needsObservedFit||!p.candidateTemplates.length).flatMap(p=>{
 const target=MISSING_BODY_TARGETS[p.id];if(!target)throw Error('Unplanned body structure '+p.id);
 return p.names.map(name=>({name,profile:p.id,target:['Crab','Coconut Crab','Mud Crab','Freshwater Crab','Vent Crab','Fiddler Crab'].includes(name)?'brachyuran':name==='Sea Squirt'?'sessile-filter':target,media:p.media,anatomyRequirements:p.notes,status:'needs-observed-fit' as const}));
});}
