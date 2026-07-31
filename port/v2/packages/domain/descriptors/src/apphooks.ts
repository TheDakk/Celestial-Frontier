/* Capture-environment hooks for the Descriptors domain module.

   The verbatim body calls five app-layer names as FREE identifiers. In ESM
   they resolve through the global scope, so consumers install faithful
   stand-ins BEFORE calling any descriptor. Two kinds live here:

   1. VERBATIM CARRIES (apphooks.verbatim.js, machine-extracted): the side
      cache _cardFactsSet, Nick's cradle roster _EARTH_NAMES/_earthNamePass
      (it mutates g._earthName — that lands in captured output), and the pure
      GAL_KIND derivation.

   2. CAPTURE STUBS (here): the six *Thumb functions. The fixtures were
      captured under jsdom, whose canvas stub pins every drawn thumb to the
      constant "data:image/png;base64," — reproducing THAT constant is the
      parity contract, not drawing art. planetThumb has one real side effect
      the capture environment performed: drawing a gas planet runs
      surfaceColor, which caches P._pal = gasPalette(P) onto the MEMOIZED
      planet object — the systemSol fingerprint encodes exactly that
      mutation, so the stub replays it with a single surfaceColor call.

   Phase 2+ replaces these with the real app implementations; the domain
   body never changes either way. */
import { surfaceColor } from '@cf/domain-planetgen';
import { _cardFactsSet, _earthNamePass, GAL_KIND, GAL_SPRITE_SEEDS } from './apphooks.verbatim.js';

/** jsdom's canvas.toDataURL() output at capture — every fixture thumb value. */
export const CAPTURE_THUMB = 'data:image/png;base64,';

const flatNoise = (() => 0.5) as unknown as Parameters<typeof surfaceColor>[3];

function planetThumb(P: { type?: string; _pal?: unknown }): string {
  /* replay the capture's one observable side effect (gas palette cache);
     surfaceColor itself guards `if(!P._pal)`, so this is idempotent */
  if (P && P.type === 'gas' && !P._pal) surfaceColor(P as never, 0, 0, flatNoise);
  return CAPTURE_THUMB;
}
const starThumb = (): string => CAPTURE_THUMB;
const galaxyThumb = (): string => CAPTURE_THUMB;
const moonThumb = (): string => CAPTURE_THUMB;
const cometThumb = (): string => CAPTURE_THUMB;
const beltThumb = (): string => CAPTURE_THUMB;

/** Install the capture-environment hooks on globalThis (idempotent; never
    overwrites an existing binding, so a future app layer wins by default). */
export function installCaptureHooks(): void {
  const g = globalThis as Record<string, unknown>;
  const hooks: Record<string, unknown> = {
    _cardFactsSet, _earthNamePass, GAL_KIND,
    planetThumb, starThumb, galaxyThumb, moonThumb, cometThumb, beltThumb,
    /* ★ found by the real-input tests, 2026-07-31: worldgen's galaxiesInCell
       reads GAL_SPRITES.length for the sprite-pool size — a free identifier
       NO fixture path ever executed (all three probed cells are empty), so
       worldgen sat parity-green while every POPULATED cell threw. Only the
       length is read; derive it from the verbatim seed pool. */
    GAL_SPRITES: new Array(GAL_SPRITE_SEEDS.length).fill(null),
  };
  for (const [k, v] of Object.entries(hooks)) if (g[k] === undefined) g[k] = v;
}
