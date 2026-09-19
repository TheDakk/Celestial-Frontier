/** @module battle2/habitat-arena [app] — arena selection and placement from the physical habitat
 * (E1 design §1.4). Pure: Codex's `compileHabitatBattle` / `containHabitatBody` decide the medium
 * per side and the band each body must fit; this module turns that into the stage's stands and a
 * labelled report. UNSUPPORTED is returned with its reason, never a clipped sprite. No clock. */
import { compileHabitatBattle, containHabitatBody, resolvePhysicalHabitat, type ArenaWorld, type BattleMedium, type HabitatRecord, type PhysicalHabitat } from '../battle-habitat.js';
import type { Side } from './choreography.js';

export interface HabitatSideInput {
  /** The combatant's anatomy record (null for a portrait combatant, which stands on the ground and is labelled). */
  readonly record: HabitatRecord | null;
  readonly genome: Readonly<Record<string, unknown>> | null;
  readonly label: string;
  /** How tall the staged body is, as a fraction of frame height, and how far its foot point sits below the body centre (fraction). */
  readonly painted: Readonly<{ height: number; footBelowCentre: number }>;
}
export interface HabitatArenaInput {
  readonly contextId: string; readonly seed: number; readonly round: number; readonly kind: 'wild' | 'guardian' | 'duel';
  /** The battle's home and visitor worlds; null = no world context yet (the study), so a labelled default is used. */
  readonly worlds: Readonly<{ home: ArenaWorld; visitor: ArenaWorld }> | null;
  /** Ground line of the arena layout (the plates' painted ground). */
  readonly groundLineY: number;
  readonly left: HabitatSideInput; readonly right: HabitatSideInput;
}
export interface HabitatStand { readonly x: number; readonly y: number; readonly medium: BattleMedium; readonly band: Readonly<{ minY: number; maxY: number }>; readonly habitat: PhysicalHabitat; }
export type HabitatArenaResult =
  | Readonly<{ status: 'READY'; worldKey: string; seed: number; source: 'worlds' | 'default'; label: string; stands: Readonly<Record<Side, HabitatStand>>; interaction: 'same-medium' | 'surface-ranged' }>
  | Readonly<{ status: 'UNSUPPORTED'; worldKey: string; reason: string; label: string }>;

/** The accepted Earth-temperate arena (three plates, ground line from the recipe) as a world, used when the battle carries no
 * world context. The plates paint a dry forest clearing: solid ground and air, no liquid — an aquatic-only body is refused
 * here, never floated over the grass. */
export const DEFAULT_ARENA_WORLD_KEY = 'earth-temperate-default' as const;
export function defaultArenaWorld(groundLineY: number): ArenaWorld {
  return Object.freeze({ key: DEFAULT_ARENA_WORLD_KEY, biome: 'temperate', seed: 424242, solid: true, atmosphere: true, liquid: null, surfaceWater: false, signature: 'accepted Earth temperate plates (ARENA_EFFECTS_V42_PROOF_20260912)', cardHash: 'earth-temperate-v42', groundLineY });
}
/** A combatant without an anatomy record stands on the ground; the report says so. */
export const PORTRAIT_GROUND_HABITAT: PhysicalHabitat = Object.freeze({ realm: 'land', preferred: 'ground', allowed: Object.freeze(['ground'] as const), source: 'portrait combatant without an anatomy record: ground', liquid: null });

export function habitatFor(side: HabitatSideInput): PhysicalHabitat {
  if (!side.record) return PORTRAIT_GROUND_HABITAT;
  return resolvePhysicalHabitat(side.record, side.genome ?? undefined);
}

export function selectHabitatArena(input: HabitatArenaInput): HabitatArenaResult {
  if (!(input.groundLineY > 0) || !(input.groundLineY < 1)) throw new TypeError('habitat arena: groundLineY must lie inside the frame');
  const worlds = input.worlds ?? { home: defaultArenaWorld(input.groundLineY), visitor: defaultArenaWorld(input.groundLineY) };
  const source: 'worlds' | 'default' = input.worlds ? 'worlds' : 'default';
  const left = habitatFor(input.left), right = habitatFor(input.right);
  const compiled = compileHabitatBattle({ contextId: input.contextId, seed: input.seed, round: input.round, kind: input.kind, home: worlds.home, visitor: worlds.visitor, left, right });
  const worldLabel = source === 'default' ? `${compiled.worldKey} (no world context: accepted Earth temperate plates)` : compiled.worldKey;
  if (compiled.status === 'UNSUPPORTED') {
    return Object.freeze({ status: 'UNSUPPORTED', worldKey: compiled.worldKey, reason: `${compiled.reason} · left ${input.left.label}: ${left.realm} (${left.allowed.join('/')}) · right ${input.right.label}: ${right.realm} (${right.allowed.join('/')})`, label: worldLabel });
  }
  const stand = (side: Side, habitat: PhysicalHabitat, s: HabitatSideInput): HabitatStand => {
    const placed = compiled[side];
    // Ground: the foot point stands on the painted ground line. Air/water: the whole painted box sits inside its band (never clipped).
    const y = placed.medium === 'ground' ? input.groundLineY : containHabitatBody(placed.band, (placed.band.minY + placed.band.maxY) / 2, s.painted.height) + s.painted.footBelowCentre;
    return Object.freeze({ x: placed.x, y, medium: placed.medium, band: Object.freeze({ ...placed.band }), habitat });
  };
  const stands = Object.freeze({ left: stand('left', left, input.left), right: stand('right', right, input.right) });
  const label = `${worldLabel} · left ${input.left.label}: ${stands.left.medium} (${left.source}) · right ${input.right.label}: ${stands.right.medium} (${right.source})`;
  return Object.freeze({ status: 'READY', worldKey: compiled.worldKey, seed: compiled.seed, source, label, stands, interaction: compiled.interaction });
}
