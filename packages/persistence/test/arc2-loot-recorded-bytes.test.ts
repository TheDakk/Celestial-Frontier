import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAX_GEAR_CAPACITY } from '@cf/domain-loot';
import {
  canonicalizeV5Extensions,
  encodeArc2LootCarrier,
  importSaveV2,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  type ContentRegistry,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', 'fixtures', 'v1');
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(baseline, name), 'utf8')) as Record<string, unknown>;
const REGISTRY = read('content-registry.json') as unknown as ContentRegistry;
const NOW = 1_753_900_060_000;

/** Every save the legacy game recorded: the curated saves (the recovery case
 * holds two) and the Field Training restart checkpoint. */
function recordedSaves(): readonly (readonly [string, string])[] {
  const saves: [string, string][] = [];
  for (const [name, input] of Object.entries(read('save-fixtures.json').inputs as Record<string, unknown>)) {
    const pair = input as { primary?: unknown; backup?: unknown };
    if (typeof pair.primary === 'string' && typeof pair.backup === 'string') {
      saves.push([`${name}.primary`, pair.primary], [`${name}.backup`, pair.backup]);
    } else saves.push([name, JSON.stringify(input)]);
  }
  saves.push(['training-restart.snapshot', JSON.stringify(read('training-restart-fixture.json').snapshot)]);
  return saves;
}

/** The loot carrier a recorded save becomes, as stored bytes. */
function carrierOf(raw: string): string {
  const imported = importSaveV2(raw, REGISTRY, NOW);
  if (!imported.ok) return `refused:${imported.reason}`;
  const prepared = prepareArc2LootLegacyMigration({
    extensions: canonicalizeV5Extensions({}), legacy: imported.state, capacity: MAX_GEAR_CAPACITY,
  });
  if (prepared.kind !== 'prepared') return `protected:${prepared.kind}`;
  const stored = readArc2Loot(prepared.extensions);
  if (stored.kind !== 'loaded') throw new Error(`the carrier just written does not read back: ${stored.kind}`);
  expect(encodeArc2LootCarrier(stored.state).json).toBe(prepared.write.carrier.json);
  return prepared.write.carrier.json;
}

describe('@cf/persistence: the loot carrier of every recorded save', () => {
  it('is the bytes it was before a piece could hold a property and a source', () => {
    const seen = Object.fromEntries(recordedSaves().map(([name, raw]) => {
      const json = carrierOf(raw);
      return [name, json.startsWith('{')
        ? `${json.length}:${createHash('sha256').update(json).digest('hex')}`
        : json];
    }));
    const noPieces = '141:7eaf224654a11025e9d259cd81ce52daf348757a832d31794c8e947084c71251';
    expect(seen).toEqual({
      empty_object: noPieces,
      veteran_rich: '1071:1b0db7174a92f21f40268abac6c54283bc864a3fe6a7978f11a6a467c7380d33',
      hostile_shapes: noPieces,
      hostile_markup_caps: noPieces,
      hostile_arrays_as_objects: noPieces,
      pre_v17_veteran: noPieces,
      tut_midtraining: noPieces,
      settings_spread: noPieces,
      equip_integrity: '826:b8a43b377f0f0e264e57a83f743cc0a8162b6ab68e7bea2c155ad1c766747b5a',
      'recovery_from_backup.primary': 'refused:invalid',
      'recovery_from_backup.backup': noPieces,
      'training-restart.snapshot': noPieces,
    });
  });
});
