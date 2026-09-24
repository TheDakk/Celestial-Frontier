/** The MATCHUP PICKER (2026-09-24; Nick: "run a sprint… I really want to get this going"). `?battle2=1&vs=Python,Eagle`
 * (optionally `&world=lake|land` and `&seed=N`) opens a full-screen arena over the game in which ANY two painted archetypes
 * fight on the real battle2 stage — no battle has to be played first. Two lists of the painted library, a world choice
 * (Auto picks the lake when a side can only swim), an optional seed for morphed individuals, Play and Close. Study-only:
 * main.ts loads this module behind the same `?battle2=1` gate as the study (dynamic import, never on the default path),
 * and nothing here reads a clock or Math.random — the study's clock is injected. */
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { resolvePhysicalHabitat } from './battle-habitat.js';
import { devAssetSource, mountBattle2Study, type Battle2AssetSource, type Battle2StudyHandle, type Battle2StudyInput, type Battle2Status } from './battle2-wiring.js';
import { archetypeGenomeV1, type MorphGenome } from './morph/morph-params.js';

export const MATCHUP_PARAM = 'vs' as const;
export type MatchupWorld = 'auto' | 'land' | 'lake';
export interface MatchupChoice { readonly left: string; readonly right: string; readonly world: MatchupWorld; readonly seed: number | null; }
/** Every painted archetype that can fight, in the library's order. */
export const MATCHUP_NAMES: readonly string[] = Object.freeze(BATTLE2_PARTS_FITS.map((f) => f.earthName));

/** The picker opens only under the study flag AND the `vs` parameter. */
export function matchupEnabled(search: string): boolean { const q = new URLSearchParams(search); return q.get('battle2') === '1' && q.get(MATCHUP_PARAM) !== null; }

/** `vs=Left,Right` (names case-insensitive; an unknown or missing name falls back to the library's first two), `world`, `seed`. */
export function parseMatchup(search: string, names: readonly string[] = MATCHUP_NAMES): MatchupChoice & { readonly notes: readonly string[] } {
  if (names.length === 0) throw new Error('matchup: no painted archetypes');
  const q = new URLSearchParams(search), notes: string[] = [];
  const find = (raw: string | undefined): string | null => { const t = (raw ?? '').trim().toLowerCase(); return t ? names.find((n) => n.toLowerCase() === t) ?? null : null; };
  const [rawL, rawR] = (q.get(MATCHUP_PARAM) ?? '').split(',');
  let left = find(rawL), right = find(rawR);
  if (!left) { if (rawL?.trim()) notes.push(`unknown creature "${rawL.trim()}"`); left = names[0]!; }
  if (!right) { if (rawR?.trim()) notes.push(`unknown creature "${rawR.trim()}"`); right = names.find((n) => n !== left) ?? left; }
  const w = q.get('world'), world: MatchupWorld = w === 'lake' || w === 'land' ? w : 'auto';
  const s = q.get('seed'), seed = s !== null && /^\d{1,9}$/.test(s) ? Number(s) : null;
  if (s !== null && seed === null) notes.push(`seed "${s}" is not a whole number; own colours`);
  return Object.freeze({ left, right, world, seed, notes: Object.freeze(notes) });
}

/** A creature that can ONLY swim (its Earth presentation profile allows water and not ground or air). */
export function swimsOnly(earthName: string): boolean {
  try { const h = resolvePhysicalHabitat({ template: { id: 'matchup' }, identity: { earthName } }); return h.allowed.includes('water') && !h.allowed.includes('ground') && !h.allowed.includes('air'); }
  catch { return false; }
}
/** Auto → the lake when either side can only swim (a swimmer on the dry arena is refused, never drawn on the forest floor). */
export function matchupWorld(choice: Pick<MatchupChoice, 'left' | 'right' | 'world'>): 'land' | 'lake' {
  return choice.world === 'auto' ? (swimsOnly(choice.left) || swimsOnly(choice.right) ? 'lake' : 'land') : choice.world;
}

/** The fighter's genome: the archetype's OWN genome (the painting as painted), or — with a seed — a morphed individual of it
 * (colour, accent and pattern from the seed; each side its own lane so a mirror match shows two different individuals). */
export function matchupGenome(record: { readonly genome?: MorphGenome | null; readonly identity?: { readonly speciesVisualKey?: string } }, earthName: string, seed: number | null, side: 'left' | 'right'): Readonly<Record<string, unknown>> {
  const own = { ...archetypeGenomeV1(record), _earthName: earthName, kingdom: 'fauna' };
  if (seed === null) return Object.freeze(own);
  const lane = seed * 2 + (side === 'right' ? 1 : 0);
  return Object.freeze({ ...own, seed: 1000 + lane * 7919, color: (lane * 5 + 1) % 17, accent: (lane * 11 + 3) % 17, pattern: lane % 8 });
}

/** A short scripted bout (the film scripts' shape): the left fighter hits, the right hits back, the right dodges, the right hits,
 * the left wins. Every row is stageable by `turnPlanInputFromTranscriptEvent`. */
export function matchupTranscript(left: string, right: string): readonly Readonly<Record<string, unknown>>[] {
  return Object.freeze([
    { side: 'A', an: left, dn: right, dmg: 9, crit: false, hpA: 30, hpB: 21 },
    { side: 'B', an: right, dn: left, dmg: 6, crit: false, hpA: 24, hpB: 21 },
    { an: left, dn: right, dodge: true },
    { side: 'B', an: right, dn: left, dmg: 8, crit: true, hpA: 16, hpB: 21 },
    { side: 'A', an: left, dn: right, dmg: 21, crit: true, hpA: 16, hpB: 0 },
  ].map((r) => Object.freeze(r)));
}

export interface MatchupMountInput extends Pick<Battle2StudyInput, 'ticker' | 'clock' | 'reducedMotion' | 'deviceTier' | 'pixi' | 'artLoader' | 'audio' | 'win' | 'keyer' | 'raster'> {
  readonly doc: Document;
  readonly search: string;
  readonly assets?: Battle2AssetSource;
  /** Injected for tests; the real study otherwise. */
  readonly mountStudy?: (input: Battle2StudyInput) => Battle2StudyHandle;
}
export interface MatchupHandle { readonly root: HTMLElement; current(): MatchupChoice; play(next?: Partial<MatchupChoice>): Promise<Battle2Status>; dispose(): void; }

const summary = (s: Battle2Status): string => {
  if (s.phase === 'failed') return `could not stage: ${s.reason ?? 'unknown reason'}`;
  const bits = [s.phase, s.arena ?? ''];
  if (s.attacks.left || s.attacks.right) bits.push(`attacks: ${s.attacks.left ?? '—'} / ${s.attacks.right ?? '—'}`);
  return bits.filter(Boolean).join(' · ');
};

export function mountBattle2Matchup(input: MatchupMountInput): MatchupHandle {
  const doc = input.doc, assets = input.assets ?? devAssetSource(), mountStudy = input.mountStudy ?? mountBattle2Study;
  const parsed = parseMatchup(input.search);
  let choice: MatchupChoice = { left: parsed.left, right: parsed.right, world: parsed.world, seed: parsed.seed };
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text = ''): HTMLElementTagNameMap[K] => { const e = doc.createElement(tag); if (css) e.style.cssText = css; if (text) e.textContent = text; return e; };
  const root = el('div', 'position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;gap:8px;padding:10px 12px;box-sizing:border-box;background:#0b1116;color:#efe6cf;font:14px/1.3 system-ui,sans-serif;overflow:auto');
  root.dataset.battle2Matchup = 'true'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Painted creature matchup');
  const bar = el('div', 'display:flex;flex-wrap:wrap;align-items:center;gap:8px');
  const pick = (label: string, value: string): HTMLSelectElement => { const s = el('select', 'min-height:44px;font:inherit;padding:0 8px;border-radius:8px'); s.setAttribute('aria-label', label); for (const n of MATCHUP_NAMES) { const o = el('option', '', n); o.value = n; s.append(o); } s.value = value; return s; };
  const leftSel = pick('Left creature', choice.left), rightSel = pick('Right creature', choice.right);
  const worldSel = el('select', 'min-height:44px;font:inherit;padding:0 8px;border-radius:8px'); worldSel.setAttribute('aria-label', 'World');
  for (const [v, t] of [['auto', 'World: auto'], ['land', 'World: land'], ['lake', 'World: lake']] as const) { const o = el('option', '', t); o.value = v; worldSel.append(o); } worldSel.value = choice.world;
  const seedIn = el('input', 'min-height:44px;width:9em;font:inherit;padding:0 8px;border-radius:8px'); seedIn.type = 'number'; seedIn.min = '0'; seedIn.placeholder = 'seed'; seedIn.title = 'Empty = the archetypes in their own colours; a number = two morphed individuals'; seedIn.setAttribute('aria-label', 'Individual seed'); if (choice.seed !== null) seedIn.value = String(choice.seed);
  const playBtn = el('button', 'min-height:44px;min-width:88px;font:inherit;font-weight:600;border-radius:8px;cursor:pointer', 'Play'), closeBtn = el('button', 'min-height:44px;min-width:88px;font:inherit;border-radius:8px;cursor:pointer', 'Close');
  bar.append(leftSel, el('span', 'opacity:.7', 'vs'), rightSel, worldSel, seedIn, playBtn, closeBtn);
  const status = el('output', 'min-height:1.3em;opacity:.85'); status.setAttribute('aria-live', 'polite');
  const arena = el('div', 'width:100%;max-width:calc((100vh - 120px) * 16 / 9);margin:0 auto');
  root.append(bar, status, arena); doc.body.append(root);
  if (parsed.notes.length) status.textContent = parsed.notes.join('; ');

  const records = new Map<string, Promise<{ genome?: MorphGenome | null; identity?: { speciesVisualKey?: string } }>>();
  const recordOf = (name: string) => { let p = records.get(name); if (!p) { const fit = BATTLE2_PARTS_FITS.find((f) => f.earthName === name); if (!fit) throw new Error(`matchup: no painted archetype named ${name}`); p = assets.json(fit.dir + 'record.json') as Promise<{ genome?: MorphGenome | null; identity?: { speciesVisualKey?: string } }>; records.set(name, p); } return p; };
  let study: Battle2StudyHandle | null = null, generation = 0, disposed = false;
  const play = async (next: Partial<MatchupChoice> = {}): Promise<Battle2Status> => {
    if (disposed) throw new Error('matchup picker is closed');
    choice = { ...choice, ...next }; leftSel.value = choice.left; rightSel.value = choice.right; worldSel.value = choice.world; seedIn.value = choice.seed === null ? '' : String(choice.seed);
    const world = matchupWorld(choice), gen = ++generation;
    status.textContent = `loading ${choice.left} vs ${choice.right} (${world})…`;
    const [lr, rr] = await Promise.all([recordOf(choice.left), recordOf(choice.right)]);
    if (disposed || gen !== generation) throw new Error('superseded by a newer matchup');
    study?.dispose('matchup replaced'); arena.replaceChildren();
    study = mountStudy({ mount: arena, generation: gen, ticker: input.ticker, clock: input.clock, reducedMotion: input.reducedMotion, deviceTier: input.deviceTier, pixi: input.pixi, artLoader: input.artLoader, assets,
      ...(input.audio !== undefined ? { audio: input.audio } : {}), ...(input.win ? { win: input.win } : {}), ...(input.keyer ? { keyer: input.keyer } : {}), ...(input.raster ? { raster: input.raster } : {}), ...(world === 'lake' ? { worldPreset: 'lake' as const } : {}),
      chronicle: { championName: choice.left, defenderName: choice.right },
      settlement: { battleId: `matchup:${choice.left}:${choice.right}:${world}:${choice.seed ?? 'own'}`, champion: { kind: 'owned-fauna', name: choice.left, genome: matchupGenome(lr, choice.left, choice.seed, 'left') },
        encounter: { defender: { battleGenome: matchupGenome(rr, choice.right, choice.seed, 'right') } }, transcript: { log: matchupTranscript(choice.left, choice.right) } } });
    const st = await study.ready; if (gen === generation) status.textContent = summary(st); return st;
  };
  const fromControls = (): Partial<MatchupChoice> => ({ left: leftSel.value, right: rightSel.value, world: worldSel.value as MatchupWorld, seed: /^\d{1,9}$/.test(seedIn.value) ? Number(seedIn.value) : null });
  const onPlay = (): void => { void play(fromControls()).catch((e: unknown) => { const m = e instanceof Error ? e.message : String(e); if (!disposed && !/superseded/.test(m)) status.textContent = `could not stage: ${m}`; }); };
  const dispose = (): void => { if (disposed) return; disposed = true; study?.dispose('matchup closed'); study = null; playBtn.removeEventListener('click', onPlay); closeBtn.removeEventListener('click', dispose); root.remove(); };
  playBtn.addEventListener('click', onPlay); closeBtn.addEventListener('click', dispose);
  onPlay();
  return { root, current: () => choice, play, dispose };
}
