import type {KeyPose} from './actions.js';
const P=(t:number,ease:KeyPose['ease'],joints:KeyPose['joints']):KeyPose=>({t,ease,joints,root:{dx:0,dy:0}});

/** Relative-to-rest curvature wave. The constant phase offset makes every
 * channel exactly zero at rest without synchronizing segment extrema. */
export function travellingWave(joints:readonly string[],amplitudesDeg:readonly number[],wavelength=1,keys=64):KeyPose[]{
 if(joints.length<3||amplitudesDeg.length!==joints.length||new Set(joints).size!==joints.length||amplitudesDeg.some(a=>!Number.isFinite(a)||a<0)||!Number.isFinite(wavelength)||wavelength<=0||!Number.isInteger(keys)||keys<32||keys>128)throw Error('motion: invalid travelling wave');
 return Array.from({length:keys},(_,i)=>{const t=(i+1)/keys;return P(t,'sine-in-out',Object.fromEntries(joints.map((j,k)=>{const phase=2*Math.PI*k/((joints.length-1)*wavelength);return[j,i===keys-1?0:amplitudesDeg[k]!*(Math.sin(2*Math.PI*t-phase)-Math.sin(-phase))];})));});
}
