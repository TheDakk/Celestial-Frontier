/** D14 Outposts P2 — the `arc9.projects` v1 carrier: absent ⇒ empty, an old save loads unchanged, the portable export/import round
 * trip keeps it byte-exact, and every malformed carrier reads as PROTECTED (never as "no projects"). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_OUTPOST_PROJECTS_V1, OUTPOST_PROJECTS_NAMESPACE_V1, applyV5ExtensionWrites, buildOutpostStageV1, classifyPortableV5Save,
  classifyV4Save, exportPortableV5Save, outpostProjectsWriteV1, readOutpostProjectsV1, startOutpostV1, type ContentRegistry,
  type OutpostProjectsStateV1, type OutpostSaveFactsV1, type V5Extensions,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const FIXTURES = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as { inputs: Record<string, unknown> };
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const facts: OutpostSaveFactsV1 = { honouredCharters: ['st-comp'], research: ['scan1'], landed: [11, 12, 13], conquered: [], landings: 4, fedTotal: 0,
  items: { frame: 9, plate: 9, navcore: 2, lens: 4 }, stardust: 100 };
function sampleState(): OutpostProjectsStateV1 {
  const ctx = { world: { galaxySeed: 999, starSeed: 70, planetSeed: 11, name: 'Kestrel', systemPlanetSeeds: [13, 11, 12] }, hasFauna: true, standingHere: false };
  const started = startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts, 'relay', ctx, 1000);
  if (started.kind !== 'ok') throw new Error(started.reason);
  const built = buildOutpostStageV1(started.state, facts, 'relay@11', null, 2000);
  if (built.kind !== 'ok') throw new Error(built.reason);
  return built.state;
}
const withCarrier = (state: OutpostProjectsStateV1, base: V5Extensions = {}): V5Extensions => applyV5ExtensionWrites(base, [outpostProjectsWriteV1(state)]).extensions;
const rawCarrier = (json: string, version = 1): V5Extensions => ({ player: { [OUTPOST_PROJECTS_NAMESPACE_V1]: { version, json } } });

describe('arc9.projects carrier (P2)', () => {
  it('absent ⇒ no projects; an old save with no namespace loads unchanged', () => {
    expect(readOutpostProjectsV1({})).toEqual({ kind: 'loaded', state: EMPTY_OUTPOST_PROJECTS_V1, present: false });
    const legacy = classifyV4Save(JSON.stringify(FIXTURES.inputs.veteran_rich), REGISTRY, NOW);
    if (legacy.kind !== 'supported') throw new Error('fixture');
    const raw = exportPortableV5Save({ state: legacy.state, extensions: {} }, REGISTRY, NOW), back = classifyPortableV5Save(raw, REGISTRY, NOW);
    if (back.kind !== 'supported') throw new Error(back.kind);
    expect(readOutpostProjectsV1(back.extensions)).toMatchObject({ kind: 'loaded', present: false });
  });
  it('write → read is exact; the portable export/import round trip keeps the carrier byte-identical', () => {
    const state = sampleState(), ext = withCarrier(state), read = readOutpostProjectsV1(ext);
    expect(read).toMatchObject({ kind: 'loaded', present: true });
    if (read.kind !== 'loaded') return;
    expect(outpostProjectsWriteV1(read.state)).toEqual(outpostProjectsWriteV1(state)); // read → write reproduces the exact carrier
    expect(read.state.sites[0]).toMatchObject({ id: 'relay@11', built: 1, baseline: { systemLanded: [11, 12, 13] } });
    const legacy = classifyV4Save(JSON.stringify(FIXTURES.inputs.veteran_rich), REGISTRY, NOW);
    if (legacy.kind !== 'supported') throw new Error('fixture');
    const raw = exportPortableV5Save({ state: legacy.state, extensions: ext }, REGISTRY, NOW), back = classifyPortableV5Save(raw, REGISTRY, NOW);
    if (back.kind !== 'supported') throw new Error(back.kind);
    expect(back.extensions.player?.[OUTPOST_PROJECTS_NAMESPACE_V1]).toEqual(ext.player?.[OUTPOST_PROJECTS_NAMESPACE_V1]);
    expect(readOutpostProjectsV1(back.extensions)).toEqual(read);
  });
  it('every malformed carrier is PROTECTED, never "no projects" (controls)', () => {
    const good = outpostProjectsWriteV1(sampleState()).carrier.json, obj = JSON.parse(good) as { schema: string; sites: Record<string, unknown>[] };
    expect(readOutpostProjectsV1(rawCarrier(good))).toMatchObject({ kind: 'loaded', present: true }); // positive control
    expect(readOutpostProjectsV1(rawCarrier(good, 2))).toEqual({ kind: 'protected', reason: 'future-version' });
    expect(readOutpostProjectsV1({ inventory: { [OUTPOST_PROJECTS_NAMESPACE_V1]: { version: 1, json: good } } })).toEqual({ kind: 'protected', reason: 'wrong-segment' });
    expect(readOutpostProjectsV1(rawCarrier(good.replace('"schema"', ' "schema"')))).toEqual({ kind: 'protected', reason: 'corrupt' });
    expect(readOutpostProjectsV1(rawCarrier(JSON.stringify({ ...obj, sites: [{ ...obj.sites[0], built: 4 }] })))).toMatchObject({ kind: 'protected' });
    expect(readOutpostProjectsV1(rawCarrier(JSON.stringify({ ...obj, sites: [{ ...obj.sites[0], id: 'relay@12' }] })))).toMatchObject({ kind: 'protected' });
    expect(readOutpostProjectsV1(rawCarrier(JSON.stringify({ ...obj, sites: [{ ...obj.sites[0], spent: [] }] })))).toMatchObject({ kind: 'protected' });
    expect(readOutpostProjectsV1(rawCarrier(JSON.stringify({ ...obj, sites: [{ ...obj.sites[0], residents: ['x'] }] })))).toMatchObject({ kind: 'protected' });
    expect(readOutpostProjectsV1(rawCarrier(JSON.stringify({ ...obj, sites: Array.from({ length: 25 }, () => obj.sites[0]) })))).toMatchObject({ kind: 'protected' });
  });
});
