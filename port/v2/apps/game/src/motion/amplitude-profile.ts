/** Record-relative angular budget. No species, seed, pixels or clock.
 * Source-pincer closure is a measured contact and is deliberately not attenuated. */
import type {BodyPart} from './body-card.js';
export interface AmplitudeProfile {readonly schema:'cf.motion-amplitude/v1';readonly scales:Readonly<Record<string,number>>;}
export function compileAmplitudeProfile(parts:readonly BodyPart[],bodyLength:number,materials:Readonly<Record<string,string>>,contactScales:Readonly<Record<string,number>>={}):AmplitudeProfile{
 if(!Number.isFinite(bodyLength)||bodyLength<=0)throw Error('Amplitude: invalid body length');
 const depth:Record<string,number>={root:0},scales:Record<string,number>={root:1};
 for(const p of parts){
  if(depth[p.parent]===undefined||!Number.isFinite(p.boneLength)||p.boneLength<=0)throw Error('Amplitude: invalid source chain');
  const d=depth[p.parent]!+1;depth[p.joint]=d;
  const ratio=p.boneLength/bodyLength,plant=materials[p.joint]==='bark'||materials[p.joint]==='foliage';
  // Woody chains bend over their whole observed length, not by the same angle
  // at every canopy-sector pivot. One dimensionless profile for every source.
  scales[p.joint]=Object.hasOwn(contactScales,p.joint)?1:plant
   ?Math.max(.08,Math.min(.5,.5/(Math.max(.5,ratio)*(1+.5*d))))
   :p.group==='legs'?Math.min(1,.5/Math.max(.5,ratio)):1;
 }
 return Object.freeze({schema:'cf.motion-amplitude/v1',scales:Object.freeze(scales)});
}
