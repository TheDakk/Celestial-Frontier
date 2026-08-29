/* One-shot, allocation-free finishing owners for existing painter canvases.
   The underlying painters retain sole ownership of silhouettes, anatomy,
   placement, topology and seeded detail. These owners only apply the finite
   VisualTreatmentV1 grade once to each returned surface. */
import {
  applyCanvasVisualTreatmentV1,
  type CanvasVisualSurfaceV1,
} from './canvas-treatment.js';
import { createVisualTreatmentV1 } from './visual-treatment.js';

const POLISHED_GRADE_V1 = Object.freeze({
  color: 'polished',
  contrast: 'polished',
  lighting: 'polished',
  material: 'polished',
  atmosphere: 'polished',
} as const);

const GALAXY_TREATMENT_V1 = createVisualTreatmentV1(
  { scope: 'galaxy', key: 'universe-wide-v1' },
  POLISHED_GRADE_V1,
);
const SYSTEM_TREATMENT_V1 = createVisualTreatmentV1(
  { scope: 'system', key: 'universe-wide-v1' },
  POLISHED_GRADE_V1,
);
const PLANET_TREATMENT_V1 = createVisualTreatmentV1(
  { scope: 'planet', key: 'universe-wide-v1' },
  POLISHED_GRADE_V1,
);
const BIOME_TREATMENT_V1 = createVisualTreatmentV1(
  { scope: 'biome', key: 'universe-wide-v1' },
  POLISHED_GRADE_V1,
);
const SPECIES_TREATMENT_V1 = createVisualTreatmentV1(
  { scope: 'species', key: 'universe-wide-v1' },
  POLISHED_GRADE_V1,
);

function createOnceOwner(treatment: ReturnType<typeof createVisualTreatmentV1>) {
  const finished = new WeakSet<CanvasVisualSurfaceV1>();
  return <T extends CanvasVisualSurfaceV1>(surface: T): T => {
    if (finished.has(surface)) return surface;
    applyCanvasVisualTreatmentV1(surface, treatment);
    finished.add(surface);
    return surface;
  };
}

/** Galaxy-map canvases: galaxies, haze, quasars and deep-space decor. */
export const polishGalaxyCanvasV1 = createOnceOwner(GALAXY_TREATMENT_V1);

/** System-map canvases: stars, belts, compact objects and transients. */
export const polishSystemCanvasV1 = createOnceOwner(SYSTEM_TREATMENT_V1);

/** Planet-family canvases: planets, clouds, rings, moons and dwarf worlds. */
export const polishPlanetCanvasV1 = createOnceOwner(PLANET_TREATMENT_V1);

/** Full landing vistas: one grade over the preserved biome compositor. */
export const polishBiomeCanvasV1 = createOnceOwner(BIOME_TREATMENT_V1);

/** Every creature/plant/fungus/microbe portrait, worker and audit alike. */
export const polishSpeciesCanvasV1 = createOnceOwner(SPECIES_TREATMENT_V1);
