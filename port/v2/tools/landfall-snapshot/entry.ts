/* Local authoring entry. Resolve real domain owners; never register parsed JSON
 * as a live roster or change the player's route/save to obtain a snapshot. */
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { canonicalWorldRoster } from '../../apps/game/src/world-roster.js';
import { buildBiomeVistaRenderRequestV1 } from '../../apps/game/src/biome-vista-surface.js';
import { buildLandfallAppearanceSnapshotV1 } from '../../apps/game/src/landfall-appearance-snapshot.js';

export function produceCanonicalEarthSnapshot() {
  installCaptureHooks();
  const star = { seed: 424242, x: 560, y: 170 };
  const address = resolveCF1WorldAddress({
    galaxy: { seed: 999, x: 90, y: -60 }, star, planet: { seed: 133 },
  });
  if (!address.ok) throw Error('Canonical Earth address unavailable');
  const result = canonicalWorldRoster(address.address, 0);
  const planet = systemScene(star.seed).planets.find(row => row.seed === 133);
  if (!result.ok || !planet) throw Error('Canonical Earth roster unavailable');
  const request = buildBiomeVistaRenderRequestV1(planet, star.seed, result.roster.worldKey,
    systemFor(star.seed) as unknown as Record<string, unknown>, result.roster);
  const outcome = buildLandfallAppearanceSnapshotV1(request, result.roster);
  if (!outcome.ok) throw Error('Canonical appearance unsupported: ' + outcome.reason);
  return outcome;
}
