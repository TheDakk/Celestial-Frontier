import { installCaptureHooks } from '../../../port/v2/packages/domain/descriptors/src/index.ts';
import { systemFor } from '../../../port/v2/packages/domain/worldgen/src/index.ts';
import { resolveCF1WorldAddress, systemScene } from '../../../port/v2/packages/scene/src/index.ts';
import { canonicalWorldRoster } from '../../../port/v2/apps/game/src/world-roster.ts';
import { buildBiomeVistaRenderRequestV1 } from '../../../port/v2/apps/game/src/biome-vista-surface.ts';
import { planFor } from '../../../port/v2/packages/art/src/proceduraloverrides.ts';
import { speciesName, habOf, locoOf, floraFormOf, SP_COLOR, SP_HEX, FA_BODY, FA_HEAD, FA_SKIN, FA_TAIL, FA_PATTERN, FA_SIZE } from '../../../port/v2/packages/domain/speciestraits/src/index.ts';
export function capture() {
  installCaptureHooks();
  const galaxy={seed:394332036,x:-300.95,y:175.47};
  const star={seed:676840317,x:27.3,y:-24.6};
  const system=systemFor(star.seed);
  return {galaxy,star,system,planets:systemScene(star.seed).planets.map(planet=>{
    const resolved=resolveCF1WorldAddress({galaxy,star,planet:{seed:planet.seed}});
    if(!resolved.ok)throw Error(`Address unavailable: ${planet.seed}`);
    const result=canonicalWorldRoster(resolved.address,0);
    if(!result.ok)throw Error(`Roster unavailable: ${planet.seed}`);
    const roster=result.roster;
    const request=buildBiomeVistaRenderRequestV1(planet,star.seed,roster.worldKey,system as Record<string,unknown>,roster);
    return {planet,request,roster,presentation:roster.view.all.map(genome=>({
      genome,
      name:genome._earthName||speciesName(Number(genome.seed)),
      owner:genome._earthName||genome._earthBlend?'named-or-lineage-unresolved':planFor(genome),
      descriptors:{habitat:habOf(genome),locomotion:locoOf(genome),floraForm:genome.kingdom==='flora'?floraFormOf(genome):null,color:SP_COLOR[Number(genome.color)%SP_COLOR.length],colorHex:SP_HEX[SP_COLOR[Number(genome.color)%SP_COLOR.length]],accent:SP_COLOR[Number(genome.accent)%SP_COLOR.length],accentHex:SP_HEX[SP_COLOR[Number(genome.accent)%SP_COLOR.length]],body:FA_BODY[Number(genome.body)%FA_BODY.length],head:FA_HEAD[Number(genome.head)%FA_HEAD.length],skin:FA_SKIN[Number(genome.skin)%FA_SKIN.length],tail:FA_TAIL[Number(genome.tail)%FA_TAIL.length],pattern:FA_PATTERN[Number(genome.pattern)%FA_PATTERN.length],size:FA_SIZE[Number(genome.size)%FA_SIZE.length]}
    }))};
  })};
}
