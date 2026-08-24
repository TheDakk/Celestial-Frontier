import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AUDIO_LEGACY_FALLBACK,
  AUDIO_PALETTE_POLICY,
  AUDIO_RESOLVER_VERSION,
  AUDIO_ROUTE_INVENTORY_DIGEST,
  AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION,
  AUDIO_ROUTE_MANIFEST,
  AUDIO_ROUTE_MANIFEST_AUDIT,
  AUDIO_STATIC_PURITY_RULES,
  AUDIO_TAXONOMY,
  assertPinnedAudioRouteInventory,
  audioCatalogueRouteKey,
  audioRouteInventoryDigest,
  auditAudioStaticPurity,
  auditAudioRouteManifest,
  auditAudioRouteSoundOutputs,
  createAudioSignature,
  createAudioSoundOutputWitness,
  inspectAudioStaticPurity,
  serializeAudioSoundOutputWitness,
  type AudioIdentityInput,
  type AudioRouteManifestRow,
  type AudioRouteSoundOutputRow,
  type AudioStaticPurityRule,
  type AudioStaticSource,
} from '../src/index.js';

const PHENOTYPE = Object.freeze({
  seed: 0xEA47,
  kingdom: 'fauna' as const,
  color: 2,
  accent: 7,
  form: 3,
  body: 5,
  loco: 1,
  trait: 8,
  size: 4,
  diet: 2,
  head: 6,
  limbs: 3,
  skin: 4,
  tail: 2,
  pattern: 7,
  behavior: 5,
  habitat: 4,
  temper: 6,
  sense: 2,
  metab: 3,
  lumin: true,
  heatBand: 1 as const,
});

function clonedRows(): Array<Record<string, unknown>> {
  return AUDIO_ROUTE_MANIFEST.map((row) => ({ ...row }));
}

function routeIdentity(row: AudioRouteManifestRow): AudioIdentityInput {
  return {
    owner: { route: 'catalogue', kingdom: row.kingdom, name: row.name },
    phenotype: { ...PHENOTYPE, kingdom: row.kingdom },
    lineage: { parentSeeds: null, anchorBasisPoints: null },
  };
}

function soundRows(): AudioRouteSoundOutputRow[] {
  return AUDIO_ROUTE_MANIFEST.map((row) => {
    const signature = createAudioSignature(routeIdentity(row));
    return {
      routeKey: row.routeKey,
      signature,
      witness: createAudioSoundOutputWitness(signature),
    };
  });
}

describe('Arc 7 resolver-v1 route inventory', () => {
  it('pins all 1,014 approved routes and 1,010 canonical identities to one source digest', () => {
    expect(AUDIO_ROUTE_MANIFEST_AUDIT).toEqual({
      resolverVersion: 1,
      sourceRouteDigest: AUDIO_ROUTE_INVENTORY_DIGEST,
      routeCount: 1_014,
      currentRouteCount: 1_010,
      compatibilityRouteCount: 4,
      canonicalIdentityCount: 1_010,
    });
    expect(AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION).toBe(1);
    expect(AUDIO_RESOLVER_VERSION).toBe(AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION);
    expect(audioRouteInventoryDigest(AUDIO_ROUTE_MANIFEST)).toBe(AUDIO_ROUTE_INVENTORY_DIGEST);
    expect(assertPinnedAudioRouteInventory(AUDIO_ROUTE_MANIFEST)).toBe(AUDIO_ROUTE_INVENTORY_DIGEST);
    expect(auditAudioRouteManifest(AUDIO_ROUTE_MANIFEST)).toEqual(AUDIO_ROUTE_MANIFEST_AUDIT);
    expect(new Set(AUDIO_ROUTE_MANIFEST.map((row) => row.routeKey)).size).toBe(1_014);
    expect(new Set(AUDIO_ROUTE_MANIFEST.map((row) => row.canonicalIdentityKey)).size).toBe(1_010);
    expect(AUDIO_ROUTE_MANIFEST.filter((row) => row.status === 'legacy-compatibility')
      .map((row) => `${row.kingdom}|${row.name}|${row.canonicalKingdom}`))
      .toEqual([
        'microbe|Tardigrade|fauna',
        'flora|Reindeer Lichen|fungi',
        'flora|Snow Algae|microbe',
        'microbe|Green Algae|flora',
      ]);
  });

  it('rejects a same-count source/name substitution until resolver version and digest advance', () => {
    const substitution = clonedRows();
    const changedName = 'Resolver digest substitution control';
    substitution[0]!.name = changedName;
    substitution[0]!.routeKey = audioCatalogueRouteKey('fauna', changedName);
    substitution[0]!.canonicalIdentityKey = JSON.stringify(['fauna', changedName]);
    expect(substitution).toHaveLength(AUDIO_ROUTE_MANIFEST.length);
    expect(audioRouteInventoryDigest(substitution)).not.toBe(AUDIO_ROUTE_INVENTORY_DIGEST);
    expect(() => assertPinnedAudioRouteInventory(substitution)).toThrow('source/route digest changed');
  });

  it('rejects missing/duplicate routes, canonical drift, legacy taxonomy, and mammal fallback', () => {
    expect(() => auditAudioRouteManifest(clonedRows().slice(1))).toThrow('exactly 1014');

    const duplicate = clonedRows();
    duplicate[duplicate.length - 1] = { ...duplicate[0] };
    expect(() => auditAudioRouteManifest(duplicate)).toThrow('duplicate or mismatched');

    const canonicalDrift = clonedRows();
    canonicalDrift[0]!.canonicalIdentityKey = canonicalDrift[1]!.canonicalIdentityKey;
    expect(() => auditAudioRouteManifest(canonicalDrift)).toThrow('canonical catalogue identity');

    const forcedLegacy = clonedRows();
    forcedLegacy[0]!.taxonomyId = AUDIO_LEGACY_FALLBACK.taxonomyId;
    expect(() => auditAudioRouteManifest(forcedLegacy)).toThrow('intentional kingdom taxonomy');

    const floraIndex = AUDIO_ROUTE_MANIFEST.findIndex((row) => row.kingdom === 'flora');
    const forcedMammal = clonedRows();
    forcedMammal[floraIndex]!.palettePolicy = AUDIO_PALETTE_POLICY.fauna;
    expect(() => auditAudioRouteManifest(forcedMammal)).toThrow('intentional kingdom taxonomy');
  });
});

describe('Arc 7 sound-output witness', () => {
  it('excludes identity metadata while retaining every sound-producing profile and call field', () => {
    const witness = soundRows()[0]!.witness;
    expect(Object.keys(witness)).toEqual(['profile', 'call']);
    expect(Object.keys(witness.profile)).toEqual([
      'palettePolicy', 'paletteId', 'register', 'phraseGrammar', 'rhythm', 'articulation',
    ]);
    expect(Object.keys(witness.call)).toEqual([
      'paletteId', 'phraseGrammar', 'cooldownGroup', 'cooldownMs', 'phrases',
    ]);
    expect(Object.keys(witness.call.phrases[0]!)).toEqual([
      'purpose', 'intervalsSemitones', 'durationsMs', 'intensityPermille',
    ]);
    expect(witness).not.toHaveProperty('schema');
    expect(witness).not.toHaveProperty('version');
    expect(witness).not.toHaveProperty('identityKey');
    expect(witness).not.toHaveProperty('identityId');
    expect(serializeAudioSoundOutputWitness(witness)).not.toContain('"kingdom"');
    expect(serializeAudioSoundOutputWitness(witness)).not.toContain('"phraseId"');
    expect(Object.isFrozen(witness)).toBe(true);
    expect(Object.isFrozen(witness.profile.register)).toBe(true);
    expect(Object.isFrozen(witness.call.phrases)).toBe(true);
  });

  it('audits all 1,014 routes collision-free on actual sound output with no legacy/fauna fallback', () => {
    const rows = soundRows();
    expect(auditAudioRouteSoundOutputs(rows)).toEqual({
      routeCount: 1_014,
      uniqueWitnessCount: 1_014,
      legacyOrdinarySelectionCount: 0,
      nonFaunaFaunaSelectionCount: 0,
    });
    expect(new Set(rows.map((row) => serializeAudioSoundOutputWitness(row.witness))).size).toBe(1_014);
    for (const [index, row] of rows.entries()) {
      const route = AUDIO_ROUTE_MANIFEST[index]!;
      expect(row.witness.profile.palettePolicy).toBe(AUDIO_TAXONOMY[route.kingdom].palettePolicy);
      expect(row.witness.profile.paletteId).not.toBe(AUDIO_LEGACY_FALLBACK.paletteId);
    }
  });

  it('binds every witness and signature to its exact route and rejects fabrication independently', () => {
    expect(AUDIO_ROUTE_MANIFEST[0]!.kingdom).toBe(AUDIO_ROUTE_MANIFEST[1]!.kingdom);
    const swappedWitness = soundRows();
    const witnessFirst = swappedWitness[0]!, witnessSecond = swappedWitness[1]!;
    swappedWitness[0] = { ...witnessFirst, witness: witnessSecond.witness };
    swappedWitness[1] = { ...witnessSecond, witness: witnessFirst.witness };
    expect(() => auditAudioRouteSoundOutputs(swappedWitness)).toThrow('witness does not match');

    const swappedSignature = soundRows();
    const signatureFirst = swappedSignature[0]!, signatureSecond = swappedSignature[1]!;
    swappedSignature[0] = { ...signatureFirst, signature: signatureSecond.signature };
    swappedSignature[1] = { ...signatureSecond, signature: signatureFirst.signature };
    expect(() => auditAudioRouteSoundOutputs(swappedSignature)).toThrow('does not own its exact route');

    const swappedPair = soundRows();
    const pairFirst = swappedPair[0]!, pairSecond = swappedPair[1]!;
    swappedPair[0] = {
      ...pairFirst, signature: pairSecond.signature, witness: pairSecond.witness,
    };
    swappedPair[1] = {
      ...pairSecond, signature: pairFirst.signature, witness: pairFirst.witness,
    };
    expect(() => auditAudioRouteSoundOutputs(swappedPair)).toThrow('does not own its exact route');

    const fabricated = soundRows();
    const genuineWitnesses = new Set(fabricated.map((row) =>
      serializeAudioSoundOutputWitness(row.witness)));
    const fabricatedWitness = fabricated[0]!.witness;
    fabricated[0] = {
      ...fabricated[0]!,
      witness: {
        ...fabricatedWitness,
        profile: {
          ...fabricatedWitness.profile,
          register: {
            ...fabricatedWitness.profile.register,
            centerHz: fabricatedWitness.profile.register.centerHz + 1,
          },
        },
      },
    };
    expect(genuineWitnesses.has(serializeAudioSoundOutputWitness(fabricated[0]!.witness))).toBe(false);
    expect(() => auditAudioRouteSoundOutputs(fabricated)).toThrow('witness does not match');

    const nonCanonicalSignature = soundRows();
    nonCanonicalSignature[0] = {
      ...nonCanonicalSignature[0]!,
      signature: { ...nonCanonicalSignature[0]!.signature, unexpected: true } as never,
    };
    expect(() => auditAudioRouteSoundOutputs(nonCanonicalSignature)).toThrow('invalid canonical signature');

    const genuineSignature = soundRows()[0]!.signature;
    let toJsonCalls = 0;
    const toJsonCarrier = soundRows();
    toJsonCarrier[0] = {
      ...toJsonCarrier[0]!,
      signature: {
        toJSON() { toJsonCalls++; return genuineSignature; },
        fabricated: true,
      } as never,
    };
    expect(() => auditAudioRouteSoundOutputs(toJsonCarrier)).toThrow('invalid canonical signature');
    expect(toJsonCalls).toBe(0);

    const hiddenExtra = soundRows();
    const hiddenOwner = { ...hiddenExtra[0]!.signature.owner } as Record<string, unknown>;
    Object.defineProperty(hiddenOwner, 'fabricated', { value: true, enumerable: false });
    hiddenExtra[0] = {
      ...hiddenExtra[0]!,
      signature: { ...hiddenExtra[0]!.signature, owner: hiddenOwner } as never,
    };
    expect(() => auditAudioRouteSoundOutputs(hiddenExtra)).toThrow('invalid canonical signature');

    let accessorCalls = 0;
    const accessor = soundRows();
    const accessorPhenotype = { ...accessor[0]!.signature.phenotype } as Record<string, unknown>;
    Object.defineProperty(accessorPhenotype, 'seed', {
      get() { accessorCalls++; return genuineSignature.phenotype.seed; },
      enumerable: true,
    });
    accessor[0] = {
      ...accessor[0]!,
      signature: { ...accessor[0]!.signature, phenotype: accessorPhenotype } as never,
    };
    expect(() => auditAudioRouteSoundOutputs(accessor)).toThrow('invalid canonical signature');
    expect(accessorCalls).toBe(0);

    const customPrototype = soundRows();
    const prototypeLineage = Object.assign(
      Object.create({ fabricated: true }) as Record<string, unknown>,
      customPrototype[0]!.signature.lineage,
    );
    customPrototype[0] = {
      ...customPrototype[0]!,
      signature: { ...customPrototype[0]!.signature, lineage: prototypeLineage } as never,
    };
    expect(() => auditAudioRouteSoundOutputs(customPrototype)).toThrow('invalid canonical signature');
  });

  it('rejects missing and duplicate routes independently of witness binding', () => {
    expect(() => auditAudioRouteSoundOutputs(soundRows().slice(1))).toThrow('exactly 1014');
    const duplicate = soundRows();
    duplicate[duplicate.length - 1] = {
      ...duplicate[duplicate.length - 1]!, routeKey: duplicate[0]!.routeKey,
    };
    expect(() => auditAudioRouteSoundOutputs(duplicate)).toThrow('duplicate route');
  });

  it('passes the reusable static purity audit and fails every forbidden term one at a time', () => {
    const sources: AudioStaticSource[] = [
      '../src/taxonomy.ts', '../src/identity.ts', '../src/sound-witness.ts',
    ].map((path) => ({ sourceId: path, sourceText: readFileSync(new URL(path, import.meta.url), 'utf8') }));
    expect(inspectAudioStaticPurity(sources)).toEqual([]);
    expect(auditAudioStaticPurity(sources)).toEqual({
      sourceCount: 3,
      ruleCount: AUDIO_STATIC_PURITY_RULES.length,
      violationCount: 0,
    });

    const controls: ReadonlyArray<readonly [AudioStaticPurityRule, string]> = [
      ['math-random', 'const value = Math.random();'],
      ['date-now', 'const value = Date.now();'],
      ['performance-now', 'const value = performance.now();'],
      ['new-date', 'const value = new Date();'],
      ['crypto', 'const value = crypto.getRandomValues(bytes);'],
      ['window', 'const value = window.location;'],
      ['document', 'const value = document.body;'],
      ['global-this', 'const value = globalThis.__audioControl;'],
      ['dom-import', "import { JSDOM } from 'jsdom';"],
      ['rng-import', "import { mulberry32 } from '@cf/domain-rand';"],
      ['rng-import', "import { createSessionRNG } from '@cf/domain-sessionrng';"],
      ['dom-import', "import {\n  JSDOM,\n} from 'jsdom';"],
      ['rng-import', "import {\n  mulberry32,\n} from '@cf/domain-rand';"],
      ['dom-import', "const module = await import('jsdom');"],
      ['rng-import', "const module = await import('@cf/domain-sessionrng');"],
    ];
    for (const [rule, sourceText] of controls) {
      const control = { sourceId: `negative-${rule}`, sourceText };
      const violations = inspectAudioStaticPurity([...sources, control]);
      expect(violations.map((violation) => violation.rule), sourceText).toEqual([rule]);
      expect(() => auditAudioStaticPurity([...sources, control]), sourceText).toThrow(rule);
    }
  });
});
