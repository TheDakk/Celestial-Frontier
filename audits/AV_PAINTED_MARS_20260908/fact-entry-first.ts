import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { canonicalWorldRoster } from '../../port/v2/apps/game/src/world-roster.js';
import { buildBiomeVistaRenderRequestV1 } from '../../port/v2/apps/game/src/biome-vista-surface.js';
export function capture() {
 installCaptureHooks();
 const star={seed:424242,x:560,y:170};
 const resolved=resolveCF1WorldAddress({galaxy:{seed:999,x:90,y:-60},star,planet:{seed:134}});
 if(!resolved.ok)throw Error('Mars address unavailable');
 const result=canonicalWorldRoster(resolved.address,0);
 const planet=systemScene(star.seed).planets.find(p=>p.seed===134);
 if(!result.ok||!planet)throw Error('Mars roster unavailable');
 const roster=result.roster;
 const request=buildBiomeVistaRenderRequestV1(planet,star.seed,roster.worldKey,systemFor(star.seed) as Record<string,unknown>,roster);
 return{planet,request,roster};
}
