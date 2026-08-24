import { describe, expect, it } from 'vitest';
import {
  AUDIO_PALETTE_POLICY,
  createAudioIdentityProfile,
  createAudioSignature,
  createAudioSoundOutputWitness,
  createCreatureCallPlan,
  createCreatureExpressionCue,
  createDistantEcologyHintPlan,
  creatureExpressionAudioEvent,
  deserializeAudioSignature,
  distantEcologyAudioEvent,
  serializeAudioSignature,
  serializeAudioSoundOutputWitness,
  type AudioIdentityInput,
  type CanonicalAudioOwner,
  type SettledCreatureAudioEvent,
} from '../src/index.js';

const PHENOTYPE = Object.freeze({
  seed: 0xC0FFEE,
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

function identity(options: Partial<AudioIdentityInput> = {}): AudioIdentityInput {
  return {
    owner: options.owner ?? { route: 'catalogue', kingdom: 'fauna', name: 'Tardigrade' },
    phenotype: options.phenotype ?? PHENOTYPE,
    lineage: options.lineage ?? { parentSeeds: null, anchorBasisPoints: null },
  };
}

function pipeline(input: AudioIdentityInput) {
  const signature = createAudioSignature(input);
  const profile = createAudioIdentityProfile(signature);
  const plan = createCreatureCallPlan(profile);
  const witness = createAudioSoundOutputWitness(signature);
  return {
    signature,
    profile,
    plan,
    witness,
    key: serializeAudioSignature(signature),
    soundKey: serializeAudioSoundOutputWitness(witness),
  };
}

describe('Arc 7 pure audible identity', () => {
  it('is deterministic, deeply immutable, and canonical on decode', () => {
    const first = pipeline(identity());
    const second = pipeline(structuredClone(identity()));
    expect(second).toEqual(first);
    expect({
      identityId: first.profile.identityId,
      paletteId: first.profile.paletteId,
      register: first.profile.register,
      grammar: first.profile.phraseGrammar,
      rhythm: first.profile.rhythm,
      articulation: first.profile.articulation,
      cooldownMs: first.plan.cooldownMs,
      phrases: first.plan.phrases.map((phrase) => ({
        id: phrase.phraseId,
        intervals: phrase.intervalsSemitones,
        durations: phrase.durationsMs,
      })),
    }).toEqual({
      identityId: 'aip1-7796154081a1e7ce',
      paletteId: 'fauna-resonant',
      register: { centerHz: 206, spanCents: 1_019 },
      grammar: 'rising-motif',
      rhythm: 'spaced',
      articulation: 'smooth',
      cooldownMs: 2_438,
      phrases: [
        { id: 'phrase-0-8a72238f', intervals: [1, -5, 5], durations: [175, 103, 146] },
        { id: 'phrase-1-d1130787', intervals: [7, -1, 1], durations: [139, 120, 256] },
        { id: 'phrase-2-a6cad4df', intervals: [6, -6, -7, 1], durations: [280, 174, 235, 201] },
        { id: 'phrase-3-bf013ff1', intervals: [-2, 6, 6], durations: [316, 131, 252] },
        { id: 'phrase-4-3a0a0e72', intervals: [-6, -1, -7], durations: [361, 248, 106] },
      ],
    });
    expect(Object.isFrozen(first.signature)).toBe(true);
    expect(Object.isFrozen(first.signature.owner)).toBe(true);
    expect(Object.isFrozen(first.signature.phenotype)).toBe(true);
    expect(Object.isFrozen(first.plan.phrases)).toBe(true);
    expect(first.plan.phrases.every((phrase) => Object.isFrozen(phrase)
      && Object.isFrozen(phrase.intervalsSemitones)
      && Object.isFrozen(phrase.durationsMs))).toBe(true);

    const decoded = deserializeAudioSignature(first.key);
    expect(decoded.kind).toBe('ok');
    if (decoded.kind === 'ok') expect(serializeAudioSignature(decoded.signature)).toBe(first.key);
  });

  it('projects away each mutable field one at a time through the sound witness', () => {
    const expected = pipeline(identity());
    const mutations: ReadonlyArray<readonly [string, unknown]> = [
      ['xp', 999_999],
      ['hurt', 8],
      ['fed', 4],
      ['assignment', 'mission-44'],
      ['bond', 100],
      ['brood', ['a', 'b']],
    ];
    for (const [field, value] of mutations) {
      const rootMutation = { ...identity(), [field]: value } as AudioIdentityInput;
      const phenotypeMutation = identity({
        phenotype: { ...PHENOTYPE, [field]: value },
      });
      expect(pipeline(rootMutation), `root ${field}`).toEqual(expected);
      expect(pipeline(phenotypeMutation), `phenotype ${field}`).toEqual(expected);
    }
  });

  it('changes the sound witness for each selected immutable field one at a time', () => {
    const base = identity({
      owner: { route: 'lineage', kingdom: 'fauna', name: 'Wolf' },
      lineage: { parentSeeds: [11, 22], anchorBasisPoints: 7_300 },
    });
    const expected = pipeline(base).soundKey;
    const numericFields = [
      'seed', 'color', 'accent', 'form', 'body', 'loco', 'trait', 'size', 'diet',
      'head', 'limbs', 'skin', 'tail', 'pattern', 'behavior', 'habitat', 'temper',
      'sense', 'metab',
    ] as const;
    const variants: Array<readonly [string, AudioIdentityInput]> = numericFields.map((field) => [
      field,
      identity({ ...base, phenotype: { ...base.phenotype, [field]: base.phenotype[field] + 1 } }),
    ] as const);
    variants.push(['kingdom', identity({
      ...base, phenotype: { ...base.phenotype, kingdom: 'flora' },
    })]);
    variants.push(['lumin', identity({
      ...base, phenotype: { ...base.phenotype, lumin: !base.phenotype.lumin },
    })]);
    variants.push(['heatBand', identity({
      ...base, phenotype: { ...base.phenotype, heatBand: 2 },
    })]);
    variants.push(['owner', identity({
      ...base, owner: { ...base.owner, name: 'Tiger' },
    })]);
    variants.push(['anchor', identity({
      ...base, lineage: { ...base.lineage, anchorBasisPoints: 7_301 },
    })]);
    variants.push(['parent order', identity({
      ...base, lineage: { ...base.lineage, parentSeeds: [22, 11] },
    })]);
    for (const [field, variant] of variants) {
      expect(pipeline(variant).soundKey, field).not.toBe(expected);
    }
  });

  it('keeps exact approved set-qualified owners distinct in signatures and sound output', () => {
    const fauna = pipeline(identity());
    const microbe = pipeline(identity({
      owner: { route: 'catalogue', kingdom: 'microbe', name: 'Tardigrade' },
      phenotype: { ...PHENOTYPE, kingdom: 'microbe' },
    }));
    const lineage = pipeline(identity({
      owner: { route: 'lineage', kingdom: 'fauna', name: 'Tardigrade' },
      lineage: { parentSeeds: null, anchorBasisPoints: 8_500 },
    }));

    expect(new Set([fauna.key, microbe.key, lineage.key]).size).toBe(3);
    expect(new Set([fauna.soundKey, microbe.soundKey, lineage.soundKey]).size).toBe(3);
    expect(() => pipeline(identity({
      owner: { route: 'catalogue', kingdom: 'fauna', name: 'Tardigrade|microbe' },
    }))).toThrow('approved set-qualified');
  });

  it('preserves ordered lineage and separates reversed parents through the complete pipeline', () => {
    const owner: CanonicalAudioOwner = { route: 'lineage', kingdom: 'fauna', name: 'Wolf' };
    const forward = pipeline(identity({
      owner,
      lineage: { parentSeeds: [11, 22], anchorBasisPoints: 7_300 },
    }));
    const reverse = pipeline(identity({
      owner,
      lineage: { parentSeeds: [22, 11], anchorBasisPoints: 7_300 },
    }));

    expect(forward.signature.lineage.parentSeeds).toEqual([11, 22]);
    expect(reverse.signature.lineage.parentSeeds).toEqual([22, 11]);
    expect(reverse.key).not.toBe(forward.key);
    expect(reverse.soundKey).not.toBe(forward.soundKey);
    expect(reverse.plan).not.toEqual(forward.plan);

    const legacyLineage = pipeline(identity({
      owner,
      lineage: { parentSeeds: null, anchorBasisPoints: 7_300 },
    }));
    expect(legacyLineage.signature.lineage.parentSeeds).toBeNull();
  });

  it('fails closed for future signatures, unknown serialized fields, and malformed bounded inputs', () => {
    const current = pipeline(identity());
    const future = JSON.parse(current.key) as Record<string, unknown>;
    future.version = 2;
    expect(deserializeAudioSignature(JSON.stringify(future)))
      .toEqual({ kind: 'unsupported-version', version: 2 });

    const unknown = JSON.parse(current.key) as Record<string, unknown>;
    unknown.futureMood = 'must-not-enter-identity';
    expect(deserializeAudioSignature(JSON.stringify(unknown))).toEqual({ kind: 'malformed' });
    expect(() => createAudioIdentityProfile({ ...current.signature, version: 2 } as never))
      .toThrow('current audio signature');

    for (const parentSeeds of [[1], [1, 2, 3], [-1, 2], [1.5, 2], [1, 0x1_0000_0000]]) {
      expect(() => createAudioSignature(identity({
        lineage: { parentSeeds: parentSeeds as never, anchorBasisPoints: null },
      })), JSON.stringify(parentSeeds)).toThrow();
    }
    expect(() => createAudioSignature(identity({
      owner: { route: 'procedural', kingdom: 'fauna', name: 'not-null' },
    }))).toThrow('must be null');
    expect(() => createAudioSignature(identity({
      owner: { route: 'lineage', kingdom: 'fauna', name: 'Wolf' },
      lineage: { parentSeeds: [1, 2], anchorBasisPoints: null },
    }))).toThrow('carries an anchor');
    expect(() => createAudioSignature(identity({
      phenotype: { ...PHENOTYPE, heatBand: 3 as never },
    }))).toThrow('heatBand');
    expect(() => createAudioSignature(identity({
      owner: { route: 'catalogue', kingdom: 'flora', name: 'Apple' },
    }))).toThrow('must match the phenotype kingdom');
    expect(() => createAudioSignature(identity({
      owner: { route: 'catalogue', kingdom: 'fauna', name: `Wolf\nHidden` },
    }))).toThrow('bounded canonical key');
  });

  it('routes every non-fauna phenotype to its explicit environmental policy, including mixed lineage', () => {
    const nonFauna = [
      ['flora', 'Apple'],
      ['fungi', 'Oyster Mushroom'],
      ['microbe', 'Amoeba'],
    ] as const;
    for (const [kingdom, name] of nonFauna) {
      const result = pipeline(identity({
        owner: { route: 'catalogue', kingdom, name },
        phenotype: { ...PHENOTYPE, kingdom },
      }));
      expect(result.profile.palettePolicy).toBe(AUDIO_PALETTE_POLICY[kingdom]);
      expect(result.profile.paletteId.startsWith(`${kingdom}-`)).toBe(true);
      expect(result.profile.paletteId.startsWith('fauna-')).toBe(false);
    }

    const mixed = pipeline(identity({
      owner: { route: 'lineage', kingdom: 'fauna', name: 'Wolf' },
      phenotype: { ...PHENOTYPE, kingdom: 'flora' },
      lineage: { parentSeeds: [9, 7], anchorBasisPoints: 7_300 },
    }));
    expect(mixed.profile.palettePolicy).toBe(AUDIO_PALETTE_POLICY.flora);
    expect(mixed.profile.paletteId.startsWith('flora-')).toBe(true);
  });
});

describe('Arc 7 distant ecology and settled expression seams', () => {
  it('binds distant hints to canonical world plus exact already-surfaced evidence', () => {
    const input = {
      canonicalWorldKey: 'galaxy:999/system:424242/world:133',
      surfaced: {
        source: 'survey-roster' as const,
        evidenceKey: 'survey:133:family:canopy',
        granularity: 'family' as const,
        kingdom: 'flora' as const,
        familyKey: 'canopy-producer',
      },
    };
    const first = createDistantEcologyHintPlan(input);
    expect(createDistantEcologyHintPlan(structuredClone(input))).toEqual(first);
    expect(first.route).toBe('ambience');
    expect(first.palettePolicy).toBe(AUDIO_PALETTE_POLICY.flora);
    expect(createDistantEcologyHintPlan({ ...input, canonicalWorldKey: `${input.canonicalWorldKey}:other` }).planId)
      .not.toBe(first.planId);

    const fauna = createDistantEcologyHintPlan({
      ...input,
      surfaced: { ...input.surfaced, kingdom: 'fauna', familyKey: 'aerial-fauna' },
    });
    expect(fauna.route).toBe('creature');
    expect(fauna.palettePolicy).toBe(AUDIO_PALETTE_POLICY.fauna);
  });

  it('rejects hidden detail and a species owner/signature mismatch', () => {
    const signature = createAudioSignature(identity({
      owner: { route: 'catalogue', kingdom: 'flora', name: 'Apple' },
      phenotype: { ...PHENOTYPE, kingdom: 'flora' },
    }));
    const world = 'galaxy:999/system:424242/world:133';
    expect(() => createDistantEcologyHintPlan({
      canonicalWorldKey: world,
      surfaced: {
        source: 'approach-lead',
        evidenceKey: 'lead:family',
        granularity: 'family',
        kingdom: 'flora',
        familyKey: 'canopy',
        signature,
      } as never,
    })).toThrow('hidden species detail');

    expect(() => createDistantEcologyHintPlan({
      canonicalWorldKey: world,
      surfaced: {
        source: 'survey-roster',
        evidenceKey: 'survey:species:apple',
        granularity: 'species',
        owner: { route: 'catalogue', kingdom: 'fungi', name: 'Apple' },
        signature,
      },
    })).toThrow('does not match');
  });

  it('selects expression from one immutable plan and one completed captioned event', () => {
    const { plan } = pipeline(identity());
    const before = JSON.stringify(plan);
    const event: SettledCreatureAudioEvent = {
      kind: 'injury-applied',
      eventKey: 'duel:44:injury:0',
      captionKey: 'audio.creature.injury.major',
      severity: 'major',
    };
    const first = createCreatureExpressionCue(plan, event);
    const second = createCreatureExpressionCue(plan, structuredClone(event));
    expect(second).toEqual(first);
    expect(first.phrase.purpose).toBe('subdued');
    expect(first.expression.gainPermille).toBe(620);
    expect(JSON.stringify(plan)).toBe(before);
    expect(createCreatureExpressionCue(plan, { ...event, eventKey: 'duel:44:injury:1' }).cueId)
      .not.toBe(first.cueId);
    expect(creatureExpressionAudioEvent(first)).toEqual({ type: 'creature.expression', cue: first });

    const ecology = createDistantEcologyHintPlan({
      canonicalWorldKey: 'world:133',
      surfaced: { source: 'approach-lead', evidenceKey: 'lead:life', granularity: 'biosphere' },
    });
    expect(distantEcologyAudioEvent(ecology)).toEqual({ type: 'ecology.distant-hint', plan: ecology });
  });

  it('rejects absence/polling events, missing captions, future fields, and mutated call plans', () => {
    const { plan } = pipeline(identity());
    expect(() => createCreatureExpressionCue(plan, {
      kind: 'app-returned-after-absence',
      eventKey: 'absence:4d',
      captionKey: 'pressure.return',
    } as never)).toThrow('not a completed supported event');
    expect(() => createCreatureExpressionCue(plan, {
      kind: 'selected', eventKey: 'select:1', captionKey: '',
    })).toThrow('caption key');
    expect(() => createCreatureExpressionCue(plan, {
      kind: 'selected', eventKey: 'select:1', captionKey: 'audio.creature.selected', hurt: 5,
    } as never)).toThrow('not a completed supported event');
    expect(() => createCreatureExpressionCue({ ...plan, cooldownMs: plan.cooldownMs + 1 }, {
      kind: 'selected', eventKey: 'select:1', captionKey: 'audio.creature.selected',
    })).toThrow('does not match its immutable identity');
  });
});
