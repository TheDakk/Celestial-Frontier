/** Read the actual game authorities before making a production/download plan.
 * No downloaded media, source approvals or species coverage are inferred. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {tokenizer} from 'acorn';
import {ARCHETYPES, VOICE_CUES} from '../asset-intake/contracts.mjs';

const root = path.resolve(import.meta.dirname, '../../../..');
const output = process.argv[2];
if (!output || process.argv.length !== 3) throw Error('Usage: inventory.mjs NEW_REPORT.json');
if (fs.existsSync(output)) throw Error('Existing report is preserved; choose a new path');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = new Map();
function source(relative) {
  const file = path.join(root, relative), bytes = fs.readFileSync(file);
  sources.set(file, hash(bytes));
  return bytes.toString('utf8');
}
function typeValues(relative, name, property = null) {
  // Lexical extraction only: Acorn skips comments and decodes string literals.
  // TS type syntax is not parsed as JavaScript. Balance nested type members so
  // their semicolons cannot prematurely end an exported union.
  const tokens = [...tokenizer(source(relative), {ecmaVersion: 'latest', sourceType: 'module'})];
  const starts = tokens.flatMap((t, i) => t.type.label === 'export' && tokens[i+1]?.value === 'type'
    && tokens[i+2]?.value === name && tokens[i+3]?.type.label === '=' ? [i+4] : []);
  if (starts.length !== 1) throw Error('Missing/ambiguous authoritative type ' + name);
  const body = []; let depth = 0, ended = false;
  for (const token of tokens.slice(starts[0])) {
    if (token.type.label === ';' && depth === 0) { ended = true; break; }
    if (['{','(','['].includes(token.type.label)) depth++;
    if (['}',')',']'].includes(token.type.label)) depth--;
    if (depth < 0) throw Error('Unbalanced authoritative type ' + name);
    body.push(token);
  }
  if (!ended) throw Error('Unterminated authoritative type ' + name);
  const values = [...new Set(body.flatMap((token, i) => token.type.label === 'string'
    && (!property || (body[i-1]?.type.label === ':' && body[i-2]?.value === property)) ? [token.value] : []))];
  if (!values.length) throw Error('Empty authoritative vocabulary ' + name);
  return values;
}
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-audio-inventory-'));
try {
  const imports = {
    taxonomy: 'port/v2/packages/audio/src/taxonomy.ts',
    traits: 'port/v2/packages/domain/speciestraits/src/index.ts',
    combat: 'port/v2/packages/domain/combatcore/src/index.ts',
    biome: 'port/v2/packages/domain/biome-profile/src/index.ts',
  };
  const entry = Object.entries(imports).map(([name, file]) =>
    `export * as ${name} from ${JSON.stringify(path.join(root, file))};`).join('\n');
  const bundle = await rolldown({input: 'cf-inventory', platform: 'node', plugins: [{
    name: 'authorities',
    resolveId(id) { if (id === 'cf-inventory') return '\0cf-inventory'; },
    load(id) { if (id === '\0cf-inventory') return entry; },
    transform(_, id) {
      if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) sources.set(id, hash(fs.readFileSync(id)));
    },
  }]});
  try { await bundle.write({dir: scratch, format: 'es', entryFileNames: 'inventory.mjs'}); }
  finally { await bundle.close(); }
  const data = await import(pathToFileURL(path.join(scratch, 'inventory.mjs')));
  const routes = data.taxonomy.AUDIO_ROUTE_MANIFEST;
  const catalogueAudit = data.taxonomy.auditAudioRouteManifest(routes);
  const current = routes.filter(row => row.status === 'current');
  const report = {
    schema: 'cf.audio-production-game-inventory/v1',
    scope: 'Current game vocabulary and implementation boundaries; no media coverage inferred',
    catalogueAudit,
    kingdoms: Object.fromEntries(data.taxonomy.AUDIO_KINGDOM_ORDER.map(k => [k, current.filter(r => r.kingdom === k).length])),
    earth: current.map(row => ({name: row.name, kingdom: row.kingdom, identity: row.canonicalIdentityKey,
      authenticRecording: row.kingdom === 'fauna' ? 'assignment-not-evaluated' : 'not-an-animal-voice',
      fictionalVoice: 'assignment-not-evaluated', approximation: 'not-counted-as-species-coverage'})),
    compatibilityRoutes: routes.filter(row => row.status !== 'current'),
    traits: Object.fromEntries(['FA_BODY','FA_LOCO','FA_SKIN','FA_HABITAT','FA_SIZE','FA_METAB','EX_LOCO','EX_HABITAT','FLORA_FORM','FUNGI_FORM','MICROBE_FORM'].map(k => {
      if (!Array.isArray(data.traits[k]) || !data.traits[k].length) throw Error('Missing trait ' + k);
      return [k, data.traits[k]];
    })),
    painterPlans: typeValues('port/v2/packages/art/src/proceduraloverrides.ts', 'ProcPlan', 'kind'),
    recordedVoiceArchetypes: ARCHETYPES,
    voiceCues: VOICE_CUES,
    abilityThemes: data.combat.ABILITY_THEMES,
    biomes: data.biome.BIOME_PROFILES_V1,
    weather: [...new Set(Object.values(data.biome.BIOME_PROFILES_V1).map(p => p.weather))],
    events: {
      settledCreature: typeValues('port/v2/packages/audio/src/events.ts', 'SettledCreatureAudioEvent', 'kind'),
      combat: typeValues('port/v2/packages/audio/src/combat-cues.ts', 'CombatCueFamily'),
    },
    implementation: {
      voiceOwner: 'port/v2/apps/game/src/tame-greeting-audio.ts',
      samplePlayer: 'port/v2/apps/game/src/pilot-sound-player.ts',
      runtime: 'port/v2/packages/audio/src/runtime.ts',
      rights: 'port/v2/packages/audio/src/rights.ts',
      existingAudition: 'port/v2/apps/game/src/pilot-review.ts (eight pilot cues only)',
      music: 'One pilot exploration phrase; no complete adaptive music-state owner identified',
      c3: 'Intake/export code exists; no accepted recorded-source sets in this lane',
      sharedOwnership: 'motion/effects/battle2/soundkit/worldlife are read-only',
    },
    productionCoverage: 'Not evaluated: this command inventories vocabulary and does not audit supplied recordings or rendered assets',
  };
  for (const name of ['runtime.ts','rights.ts','identity.ts']) source('port/v2/packages/audio/src/' + name);
  for (const name of ['tame-greeting-audio.ts','pilot-sound-player.ts','pilot-assets.ts','pilot-review.ts']) source('port/v2/apps/game/src/' + name);
  source('port/v2/tools/asset-intake/contracts.mjs');
  source('port/v2/tools/audio-production/inventory.mjs');
  for (const [file, digest] of sources) if (hash(fs.readFileSync(file)) !== digest) throw Error('Source changed during inventory');
  report.sources = [...sources].map(([file, sha256]) => ({path: path.relative(root, file), sha256}));
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({kingdoms: report.kingdoms, biomeCount: Object.keys(report.biomes).length,
    weatherCount: report.weather.length, abilityThemes: Object.keys(report.abilityThemes), output}));
} finally { fs.rmSync(scratch, {recursive: true, force: true}); }
