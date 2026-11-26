/* One switch for each new world type, and one for the card's kind row. All are off: a type is turned on in the
   app's one constant, on Dakk's word, when its rules, look and scene have been shown. */
export const WORLD_TYPE_KEYS = Object.freeze([
  'iceGiant', 'hycean', 'megaEarth', 'dwarf', 'rogue', 'double', 'greatMoon',
  'trojan', 'protoplanet', 'shattered', 'smallBody', 'artefact', 'eccentric',
] as const);

export type WorldTypeKey = (typeof WORLD_TYPE_KEYS)[number];

export type WorldSwitches = Readonly<Record<WorldTypeKey, boolean> & { kindRow: boolean }>;

const every = (on: boolean): WorldSwitches =>
  Object.freeze({ ...Object.fromEntries(WORLD_TYPE_KEYS.map((key) => [key, on])), kindRow: on }) as WorldSwitches;

export const SWITCHES_OFF: WorldSwitches = every(false);
export const SWITCHES_ON: WorldSwitches = every(true);
