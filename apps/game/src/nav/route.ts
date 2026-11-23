/* The saved route at boot: proven again from the game's sources, and repaired as one stated intent rather
   than as a side effect of drawing. */
import { navToView, resolveViewToNav, type NavState } from '@cf/scene';

function canonicalRouteValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : `number:${String(value)}`;
  if (Array.isArray(value)) return `[${value.map(canonicalRouteValue).join(',')}]`;
  if (typeof value !== 'object') return `${typeof value}:${String(value)}`;
  const record = value as Record<string, unknown>;
  /* The stored form omits false galaxy flags while the proven route spells them out. They are the same
     stored route and must not arm a write on every aligned reload. */
  const keys = Object.keys(record).filter((key) =>
    !((key === 'home' || key === 'quasar' || key === 'dwarf') && record[key] === false));
  return `{${keys.sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalRouteValue(record[key])}`).join(',')}}`;
}

/** Equal for two routes that store the same place, whatever their key order. */
export function routeFingerprint(savedView: unknown): string {
  return canonicalRouteValue(savedView);
}

export type RouteRepairIntent = Readonly<{ changed: boolean; pending: boolean }>;

/** `pending` is true when the stored route must be rewritten and nothing holds that write. */
export function classifyRouteRepair(input: Readonly<{
  before: unknown;
  after: unknown;
  savedRouteWriteHeld: boolean;
}>): RouteRepairIntent {
  const changed = routeFingerprint(input.before) !== routeFingerprint(input.after);
  return Object.freeze({ changed, pending: changed && !input.savedRouteWriteHeld });
}

export interface RestoredRoute {
  readonly nav: NavState;
  /** True when the sources failed while proving the route: its stored bytes are then kept as they are. */
  readonly writeHeld: boolean;
  readonly repair: RouteRepairIntent;
}

/** The place a stored route names, when it is a real place the save may be in; otherwise `fallback`. */
export function restoreRoute(
  savedView: unknown,
  allowed: (target: NavState) => boolean,
  fallback: NavState,
): RestoredRoute {
  const before = savedView === undefined ? null : savedView;
  const saved = resolveViewToNav(before);
  if (saved.ok && allowed(saved.state)) {
    return { nav: saved.state, writeHeld: false,
      repair: classifyRouteRepair({ before, after: navToView(saved.state), savedRouteWriteHeld: false }) };
  }
  const writeHeld = !saved.ok && saved.reason === 'source-error';
  return { nav: fallback, writeHeld,
    repair: classifyRouteRepair({ before, after: navToView(fallback), savedRouteWriteHeld: writeHeld }) };
}
