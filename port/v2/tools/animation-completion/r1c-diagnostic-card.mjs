/** R1c experiment only: imported by the diagnostic runner's build transform.
 * The shipped compiler and normal native entry cannot read this configuration. */
import {compileBodyCard} from '../../apps/game/src/motion/body-card.ts';
import {compileAmplitudeProfile} from '../../apps/game/src/motion/amplitude-profile.ts';
export function diagnosticCard(record,genome,options){
 if(options?.purpose!=='R1c-20260919'||!['rows-first','presentation-first'].includes(options.order)||!['declared','legacy-body-axis'].includes(options.scale)||!record.template.id.startsWith('plant-'))throw Error('R1c: diagnostic-only plant configuration required');
 const card=compileBodyCard(record,genome);
 return options.scale==='declared'?card:Object.freeze({...card,amplitudeProfile:compileAmplitudeProfile(card.parts,card.bodyLength,card.jointMaterials,card.projectionScales)});
}
