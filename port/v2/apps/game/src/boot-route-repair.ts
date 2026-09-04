/* Boot route repair is a transaction intent, not a render side effect.
   Inputs come only from the bounded, plain-data SaveStateV2 importer and the
   canonical scene projector; this helper is not a classifier for hostile
   arbitrary object graphs. */

export type BootRouteProjection = Readonly<{
  savedView: unknown;
  atlas: readonly (readonly [id: string, where: unknown])[];
}>;

export type BootRouteRepairGuards = Readonly<{
  persistenceHeld: boolean;
  savedRouteWriteHeld: boolean;
  trainingCheckpointWriteHeld: boolean;
  trainingBootRouteBlocked: boolean;
  trainingBootRuntimeOnlySeat: boolean;
}>;

export type BootRouteRepairIntent = Readonly<{
  changed: boolean;
  pending: boolean;
}>;

function canonicalRouteValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : `number:${String(value)}`;
  if (Array.isArray(value)) return `[${value.map(canonicalRouteValue).join(',')}]`;
  if (typeof value !== 'object') return `${typeof value}:${String(value)}`;
  const record = value as Record<string, unknown>;
  /* The fixed-point Atlas importer omits false legacy galaxy flags while the
     proven route projector spells them explicitly. They are the same stored
     route meaning and must not arm a write on every aligned reload. */
  const keys = Object.keys(record).filter((key) =>
    !((key === 'home' || key === 'quasar' || key === 'dwarf') && record[key] === false));
  return `{${keys.sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalRouteValue(record[key])}`).join(',')}}`;
}

export function bootRouteProjectionFingerprint(projection: BootRouteProjection): string {
  return canonicalRouteValue(projection);
}

export function classifyBootRouteRepair(input: Readonly<{
  before: BootRouteProjection;
  after: BootRouteProjection;
  guards: BootRouteRepairGuards;
}>): BootRouteRepairIntent {
  const changed = bootRouteProjectionFingerprint(input.before)
    !== bootRouteProjectionFingerprint(input.after);
  const pending = changed
    && !input.guards.persistenceHeld
    && !input.guards.savedRouteWriteHeld
    && !input.guards.trainingCheckpointWriteHeld
    && !input.guards.trainingBootRouteBlocked
    && !input.guards.trainingBootRuntimeOnlySeat;
  return Object.freeze({ changed, pending });
}
