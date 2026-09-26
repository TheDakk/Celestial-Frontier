import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { isCanonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { buildLandfallFidelityV1, assessLandfallFidelityV1, LANDFALL_VISUAL_REVIEW_SCHEMA_V1,
  buildLandfallFidelityV2, assessLandfallFidelityV2, LANDFALL_VISUAL_REVIEW_SCHEMA_V2,
  type LandfallFidelityContractV1, type LandfallVisualObservationV1, type LandfallFidelityContractV2,
  type LandfallVisualObservationV2 } from '../apps/game/src/landfall-fidelity.js';

beforeAll(() => installCaptureHooks());
const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root));
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Observation = { instances: string[]; identity: { result: 'pass' | 'fail'; evidence: string };
  placement: { result: 'pass' | 'fail'; evidence: string };
  diagnostics: Record<string, { result: 'pass' | 'fail'; evidence: string }> };
type Negative = { run: '01' | '02'; originalPath: string; originalSha256: string; originalBytes: number;
  recipeSha256: string; reviewPath: string; reviewSha256: string;
  scene: LandfallVisualObservationV1['scene']; observations: Record<string, Observation> };
const negatives = (JSON.parse(read('audits/AI_LANDFALL_CONTINUATION_20260909/fidelity/known-negative-observations.json').toString()) as { records: Negative[] }).records;
function fixture(run: '01' | '02' = '02', synthetic = false) {
  const negative = negatives.find(row => row.run === run)!;
  const input = JSON.parse(read(`audits/AI_GAME_INTEGRATION_20260909/native-game-${run}/actual-landfall-input.json`).toString()) as { recipeJson: string };
  const recipe = JSON.parse(input.recipeJson) as { reference: { sha256: string; width: number; height: number; speciesVisualKey: string } };
  const image = { sha256: synthetic ? hash('explicitly synthetic pixel binding; no generated positive') : negative.originalSha256,
    bytes: synthetic ? 1 : negative.originalBytes, width: 1024, height: 576, mime: 'image/png' };
  const references = [{ imageIndex: 1, ...recipe.reference }];
  return { negative, recipeJson: input.recipeJson, image, references };
}
function bound(input = fixture()): LandfallFidelityContractV1 {
  const result = buildLandfallFidelityV1(input.recipeJson, input.image, input.references);
  if (!result.ok) throw Error(`Fixture refused: ${result.reason}`);
  return result.contract;
}
function syntheticReview(contract: LandfallFidelityContractV1 | LandfallFidelityContractV2): Mutable<LandfallVisualObservationV1> {
  return copy({ schema: LANDFALL_VISUAL_REVIEW_SCHEMA_V1, contractSha256: contract.contractSha256,
    imageSha256: contract.image.sha256, recipeSha256: contract.recipeSha256, referenceSetSha256: contract.referenceSetSha256,
    basis: 'direct-image-observation', observer: { kind: 'synthetic-control', id: 'test-only-not-accepted-art', evidenceSha256: hash('synthetic test evidence') },
    scene: { faunaBodies: 3, unmatchedFaunaBodies: 0, distinctBodies: 'pass', noCrossSpeciesFeatures: 'pass', evidence: 'Synthetic positive reported outcomes only.' },
    residents: contract.conditioning.residents.map((row, index) => ({ contractSha256: contract.contractSha256,
      identityKey: row.identityKey, expectedPlacement: copy(row.placement), instances: [`synthetic-body-${index}`],
      identity: { result: 'pass', evidence: 'Synthetic full identity outcome.' },
      placement: { result: 'pass', evidence: 'Synthetic placement outcome.' },
      diagnostics: row.namedRule.diagnostics.map(item => ({ role: item.role, result: 'pass', evidence: 'Synthetic diagnostic outcome.' })) })) } as LandfallVisualObservationV1) as Mutable<LandfallVisualObservationV1>;
}
function observedReview(contract: LandfallFidelityContractV1, negative: Negative): Mutable<LandfallVisualObservationV1> {
  const review = syntheticReview(contract);
  review.observer = { kind: 'agent-visual', id: 'retained-independent-native-still-review', evidenceSha256: negative.reviewSha256 };
  review.scene = copy(negative.scene);
  review.residents = contract.conditioning.residents.map(row => {
    const observation = negative.observations[row.name]!;
    return { contractSha256: contract.contractSha256, identityKey: row.identityKey, expectedPlacement: copy(row.placement),
      instances: copy(observation.instances), identity: copy(observation.identity), placement: copy(observation.placement),
      diagnostics: row.namedRule.diagnostics.map(item => ({ role: item.role, ...observation.diagnostics[item.role]! })) };
  });
  return review;
}
function finish(contract: LandfallFidelityContractV1 | LandfallFidelityContractV2) {
  return { scope: 'finish-only', source: 'user', imageSha256: contract.image.sha256, sentiment: 'favorable',
    evidence: 'Nick praised the latest painting finish; this does not remove species constraints.' };
}
const refused = (result: { ok: boolean }) => expect(result.ok).toBe(false);

describe('canonical landfall reported fidelity outcomes; no image recognition or art approval', () => {
  it.each(['01', '02'] as const)('binds retained %s PNG/recipe/review bytes and rejects its actual observed species failures', run => {
    const input = fixture(run), contract = bound(input), negative = input.negative;
    expect(hash(read(negative.originalPath))).toBe(contract.image.sha256);
    expect(read(negative.originalPath).length).toBe(contract.image.bytes);
    expect(hash(read(negative.reviewPath))).toBe(negative.reviewSha256);
    expect(hash(input.recipeJson)).toBe(negative.recipeSha256);
    expect(contract.recipeSha256).toBe(negative.recipeSha256);
    expect(hash(read('audits/AI_GAME_INTEGRATION_20260909/platypus-reference.png'))).toBe(contract.references[0]!.sha256);
    const result = assessLandfallFidelityV1(contract, observedReview(contract, negative), run === '02' ? finish(contract) : null);
    expect(result).toMatchObject({ ok: true, disposition: 'species-rejected', allRequiredOutcomesReportedPass: false,
      observationKind: 'agent-visual', semanticsVerifiedByCode: false, reviewerAuthenticated: false, fullQualityAccepted: false });
    if (run === '02') expect(result).toMatchObject({ finishFeedback: { sentiment: 'favorable', scope: 'finish-only' } });
  });

  it('preserves all19 full identities and six exact anchors without promoting transported data to live roster trust', () => {
    const input = fixture(), before = JSON.stringify(input), contract = bound(input);
    const source = JSON.parse(input.recipeJson).conditioning;
    expect(contract.conditioning.sourceSnapshot.roster.view.all).toEqual(source.sourceSnapshot.roster.view.all);
    expect(contract.conditioning.sourceSnapshot.roster.view.all).toHaveLength(19);
    for (const resident of contract.conditioning.residents) {
      expect(Object.keys(resident.genome)).toHaveLength(29);
      expect(resident.identityKey).toBe(source.residents.find((row: { name: string }) => row.name === resident.name).identityKey);
    }
    expect(contract.conditioning.residents.map(row => [row.name, row.placement])).toEqual([
      ['Civet', { x: .72, groundY: .77, width: .15, flip: false }], ['Persimmon', { x: .13, groundY: .78, width: .21, flip: false }],
      ['Platypus', { x: .43, groundY: .86, width: .2, flip: true }], ['Frog', { x: .25, groundY: .87, width: .07, flip: false }],
      ["Devil's Club", { x: .87, groundY: .88, width: .16, flip: false }], ['Cranberry', { x: .34, groundY: .9, width: .11, flip: false }],
    ]);
    expect(contract.conditioningSha256).toBe(hash(JSON.stringify(source)));
    expect(contract.snapshotSha256).toBe(hash(JSON.stringify(source.sourceSnapshot)));
    expect(contract.referenceSetSha256).toBe(hash(JSON.stringify(input.references)));
    expect(isCanonicalWorldRoster(contract.conditioning.sourceSnapshot.roster)).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
    input.image.sha256 = hash('changed source');input.references[0]!.sha256 = hash('changed ref');
    expect(contract.image.sha256).not.toBe(input.image.sha256);
    expect(Object.isFrozen(contract.conditioning.residents[0]!.genome)).toBe(true);
    expect(Object.isFrozen(contract.references)).toBe(true);
  });

  it('allows only a synthetic complete positive and still grants no quality or authenticated pixel conclusion', () => {
    const contract = bound(fixture('02', true)), review = syntheticReview(contract), before = JSON.stringify(review);
    expect(negatives.some(row => row.originalSha256 === contract.image.sha256)).toBe(false);
    const result = assessLandfallFidelityV1(contract, review);
    expect(result).toMatchObject({ ok: true, disposition: 'review-complete', observationKind: 'synthetic-control',
      allRequiredOutcomesReportedPass: true, semanticsVerifiedByCode: false, reviewerAuthenticated: false, fullQualityAccepted: false });
    expect(JSON.stringify(review)).toBe(before);expect(Object.isFrozen(result)).toBe(true);
    expect(contract.conditioningCapability).toMatchObject({ mode: 'global-text-plus-reference-tokens',
      multipleReferenceImages: true, perInstanceSpatialControl: false, enforcedObjectCount: false, qualifiedPixelIdentity: false });
    expect(contract.byteVerification).toBe('caller-must-verify-original-and-reference-bytes');
  });

  it.each(['contractSha256', 'imageSha256', 'recipeSha256', 'referenceSetSha256'] as const)('refuses stale %s using the same outcome assessor', field => {
    const contract = bound(fixture('02', true)), review = syntheticReview(contract);
    expect(assessLandfallFidelityV1(contract, review).ok).toBe(true);
    review[field] = hash('different bytes');
    expect(assessLandfallFidelityV1(contract, review)).toEqual({ ok: false, reason: 'stale-review' });
  });

  it('refuses incomplete, duplicate and unknown diagnostic roles or absent evidence', () => {
    const contract = bound(fixture('02', true));
    const variants = [syntheticReview(contract), syntheticReview(contract), syntheticReview(contract), syntheticReview(contract), syntheticReview(contract)];
    variants[0]!.residents.pop();variants[1]!.residents[0]!.diagnostics.pop();
    variants[2]!.residents[0]!.diagnostics[1]!.role = variants[2]!.residents[0]!.diagnostics[0]!.role;
    variants[3]!.residents[0]!.diagnostics[0]!.role = 'unknown';variants[4]!.residents[0]!.identity.evidence = '  ';
    for (const review of variants) expect(assessLandfallFidelityV1(contract, review)).toEqual({ ok: false, reason: 'incomplete-review' });
  });

  it('refuses repeated residents, mixed image rows and one observed body assigned to two identities', () => {
    const contract = bound(fixture('02', true));
    const duplicate = syntheticReview(contract);duplicate.residents[1] = copy(duplicate.residents[0]!);
    expect(assessLandfallFidelityV1(contract, duplicate)).toEqual({ ok: false, reason: 'duplicate-or-mixed-instance' });
    const mixed = syntheticReview(contract);mixed.residents[0]!.contractSha256 = bound(fixture('01')).contractSha256;
    expect(assessLandfallFidelityV1(contract, mixed)).toEqual({ ok: false, reason: 'stale-review' });
    const hybrid = syntheticReview(contract);hybrid.residents[2]!.instances[0] = hybrid.residents[0]!.instances[0]!;
    expect(assessLandfallFidelityV1(contract, hybrid)).toEqual({ ok: false, reason: 'duplicate-or-mixed-instance' });
  });

  it('refuses modified target anchors and seed-only identities', () => {
    const contract = bound(fixture('02', true)), position = syntheticReview(contract), identity = syntheticReview(contract);
    position.residents[0]!.expectedPlacement.x = .2;identity.residents[0]!.identityKey = 'Civet:133';
    for (const review of [position, identity]) expect(assessLandfallFidelityV1(contract, review)).toEqual({ ok: false, reason: 'wrong-review-target' });
  });

  it('cannot pass a missing Frog or additional body just because the expected metadata still lists three fauna', () => {
    const contract = bound(fixture('02', true)), missing = syntheticReview(contract), extra = syntheticReview(contract);
    missing.residents[3]!.instances = [];
    expect(assessLandfallFidelityV1(contract, missing)).toEqual({ ok: false, reason: 'inconsistent-count' });
    missing.scene.faunaBodies = 2;
    expect(assessLandfallFidelityV1(contract, missing)).toMatchObject({ ok: true, disposition: 'species-rejected' });
    extra.scene.faunaBodies = 4;extra.scene.unmatchedFaunaBodies = 1;
    expect(assessLandfallFidelityV1(contract, extra)).toMatchObject({ ok: true, disposition: 'species-rejected' });
    extra.residents[0]!.instances.push('second-civet');extra.scene.unmatchedFaunaBodies = 0;
    expect(assessLandfallFidelityV1(contract, extra)).toMatchObject({ ok: true, disposition: 'species-rejected' });
  });

  it('requires all six species outcomes including botany even when counts and animal identities pass', () => {
    const contract = bound(fixture('02', true)), review = syntheticReview(contract);
    review.residents[5]!.diagnostics[1]!.result = 'fail';
    expect(assessLandfallFidelityV1(contract, review, finish(contract))).toMatchObject({ ok: true, disposition: 'species-rejected',
      finishFeedback: { sentiment: 'favorable' }, fullQualityAccepted: false });
    review.residents[5]!.diagnostics[1]!.result = 'pass';
    expect(assessLandfallFidelityV1(contract, review)).toMatchObject({ ok: true, disposition: 'review-complete' });
  });

  it('refuses finish feedback bound to another painting or expanded into species approval', () => {
    const contract = bound(fixture('02', true)), review = syntheticReview(contract);
    for (const feedback of [{ ...finish(contract), imageSha256: hash('other painting') }, { ...finish(contract), scope: 'all-quality' },
      { ...finish(contract), speciesAccepted: true }]) expect(assessLandfallFidelityV1(contract, review, feedback)).toEqual({ ok: false, reason: 'invalid-finish-feedback' });
    refused(assessLandfallFidelityV1(contract, finish(contract)));
  });

  it('refuses metadata-only semantics and forged or transported contracts; explicit rebuilding remains available', () => {
    const contract = bound(fixture('02', true)), review = syntheticReview(contract);
    refused(assessLandfallFidelityV1(contract, { ...review, basis: 'metadata-only' }));
    expect(assessLandfallFidelityV1(copy(contract), review)).toEqual({ ok: false, reason: 'invalid-contract' });
    expect(assessLandfallFidelityV1({ ...contract }, review)).toEqual({ ok: false, reason: 'invalid-contract' });
    expect(assessLandfallFidelityV1(bound(fixture('02', true)), review).ok).toBe(true);
  });

  it('binds historical prompt bytes without allowing a different identity, roster, anatomy rule or world', () => {
    const old = bound(fixture('01')), current = bound(fixture('02'));
    expect(old.recipeSha256).not.toBe(current.recipeSha256);
    expect(old.snapshotSha256).toBe(current.snapshotSha256);
    const input = fixture();
    const mutations = [
      (r: any) => { r.conditioning.residents[0].genome.color += 1; },
      (r: any) => { r.conditioning.sourceSnapshot.roster.view.all[18].color += 1; },
      (r: any) => { r.conditioning.residents[0].namedRule.diagnostics[0].required = 'generic mammal'; },
      (r: any) => { r.conditioning.sourceSnapshot.roster.ecologyEpoch = 1; },
    ];
    for (const mutate of mutations) {
      const recipe = JSON.parse(input.recipeJson);mutate(recipe);
      expect(buildLandfallFidelityV1(JSON.stringify(recipe), input.image, input.references)).toEqual({ ok: false, reason: 'unsupported-recipe' });
    }
  });

  it('refuses incompatible model/runtime/reference and image declarations before producing a contract', () => {
    const input = fixture();
    for (const fields of [{ modelRevision: 'other' }, { steps: 8 }, { qualityAccepted: true }, { q8Block32: 'true' },
      { negativePromptHandling: 'consumed' }, { runtimeVersion: 'other' }]) {
      refused(buildLandfallFidelityV1(JSON.stringify({ ...JSON.parse(input.recipeJson), ...fields }), input.image, input.references));
    }
    for (const fields of [{ sha256: hash('other ref') }, { width: 481 }, { speciesVisualKey: 'Platypus:133' }, { imageIndex: 2 }]) {
      expect(buildLandfallFidelityV1(input.recipeJson, input.image, [{ ...input.references[0], ...fields }])).toEqual({ ok: false, reason: 'reference-mismatch' });
    }
    for (const fields of [{ bytes: 0 }, { bytes: Number.MAX_SAFE_INTEGER }, { width: 768 }, { sha256: 'missing' }]) {
      refused(buildLandfallFidelityV1(input.recipeJson, { ...input.image, ...fields }, input.references));
    }
  });

  it('rejects hostile accessors and malformed records without executing coercion hooks or using a clock/RNG', () => {
    const input = fixture(), contract = bound(fixture('02', true)), getter = vi.fn(() => input.image.sha256), coercion = vi.fn(() => 'agent-visual');
    const hostile = { ...input.image };Object.defineProperty(hostile, 'sha256', { get: getter, enumerable: true });
    refused(buildLandfallFidelityV1(input.recipeJson, hostile, input.references));
    const review = syntheticReview(contract);
    refused(assessLandfallFidelityV1(contract, { ...review, observer: { ...review.observer, kind: { toString: coercion } } }));
    expect(getter).not.toHaveBeenCalled();expect(coercion).not.toHaveBeenCalled();
    const proxy = Proxy.revocable({}, {});proxy.revoke();refused(assessLandfallFidelityV1(contract, proxy.proxy));
    refused(buildLandfallFidelityV1('x'.repeat(131073), input.image, input.references));
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock used'); });
    const rng = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('RNG used'); });
    try { expect(assessLandfallFidelityV1(contract, review).ok).toBe(true);expect(bound(fixture()).expectedCounts.fullRoster).toBe(19); }
    finally { clock.mockRestore();rng.mockRestore(); }
  });
});


const v2Root = 'audits/AI_SPECIES_MOBILE_20260909/native-generation-01/';
const v2Evidence = JSON.parse(read('audits/AI_OFFLINE_INTEGRATION_20260909/species-review/retained-v2-reported-outcomes.json').toString()) as {
  sourceManualReview: { path: string; sha256: string }; output: { path: string; bytes: number; sha256: string };
  scene: LandfallVisualObservationV2['scene']; observations: Record<string, Observation>;
};
function fixtureV2(synthetic = false) {
  const input = JSON.parse(read(v2Root + 'actual-landfall-input.json').toString()) as { recipeJson: string };
  const recipe = JSON.parse(input.recipeJson);
  return { recipeJson: input.recipeJson, references: copy(recipe.references),
    image: { sha256: synthetic ? hash('synthetic six-reference image') : v2Evidence.output.sha256,
      bytes: synthetic ? 1 : v2Evidence.output.bytes, width: 1024, height: 576, mime: 'image/png' } };
}
function boundV2(input = fixtureV2()): LandfallFidelityContractV2 {
  const result = buildLandfallFidelityV2(input.recipeJson, input.image, input.references);
  if (!result.ok) throw Error('V2 fixture refused: ' + result.reason);
  return result.contract;
}
function syntheticReviewV2(contract: LandfallFidelityContractV2): Mutable<LandfallVisualObservationV2> {
  const prior = syntheticReview(contract);
  return { ...prior, schema: LANDFALL_VISUAL_REVIEW_SCHEMA_V2,
    scene: { ...prior.scene, floraCount: { result: 'pass', evidence: 'Synthetic exactly three complete plant individuals.' } },
    residents: prior.residents.map(row => {
      const ref = contract.references.find(candidate => candidate.speciesVisualKey === row.identityKey)!;
      return { ...row, referenceImageIndex: ref.imageIndex, referenceSha256: ref.sha256 };
    }) };
}
function observedReviewV2(contract: LandfallFidelityContractV2): Mutable<LandfallVisualObservationV2> {
  const review = syntheticReviewV2(contract);
  review.observer = { kind: 'agent-visual', id: 'retained-six-reference-observation-transcription', evidenceSha256: v2Evidence.sourceManualReview.sha256 };
  review.scene = copy(v2Evidence.scene);
  review.residents = contract.conditioning.residents.map(row => {
    const observation = v2Evidence.observations[row.name]!, ref = contract.references.find(candidate => candidate.speciesVisualKey === row.identityKey)!;
    return { contractSha256: contract.contractSha256, identityKey: row.identityKey, expectedPlacement: copy(row.placement),
      referenceImageIndex: ref.imageIndex, referenceSha256: ref.sha256,
      instances: copy(observation.instances), identity: copy(observation.identity), placement: copy(observation.placement),
      diagnostics: row.namedRule.diagnostics.map(item => ({ role: item.role, ...observation.diagnostics[item.role]! })) };
  });
  return review;
}

describe('six-reference V2 review binding without changing historical V1 or claiming visual approval', () => {
  it('binds the actual rejected PNG, exact recipe, six source-image byte hashes and retained independent observations', () => {
    const input = fixtureV2(), contract = boundV2(input);
    const manual = JSON.parse(read(v2Evidence.sourceManualReview.path).toString());
    expect(hash(read(v2Evidence.sourceManualReview.path))).toBe(v2Evidence.sourceManualReview.sha256);
    expect(hash(read(v2Evidence.output.path))).toBe(contract.image.sha256);
    expect(read(v2Evidence.output.path).length).toBe(contract.image.bytes);
    expect(contract.recipeSha256).toBe(hash(input.recipeJson));
    expect(contract.conditioningSha256).toBe(hash(JSON.stringify(JSON.parse(input.recipeJson).conditioning)));
    expect(contract.references).toEqual(manual.references);
    for (const binding of manual.bindings) expect(hash(read(binding.path))).toBe(binding.sha256);
    const refs = JSON.parse(read('audits/AI_SPECIES_MOBILE_20260909/references/reference-set-v1.json').toString()).references;
    for (const ref of contract.references) {
      const source = refs.find((row: { imageIndex: number }) => row.imageIndex === ref.imageIndex);
      expect(hash(read(source.source))).toBe(ref.sha256);
      expect([source.sourceWidth, source.sourceHeight, source.speciesVisualKey]).toEqual([ref.sourceWidth, ref.sourceHeight, ref.speciesVisualKey]);
    }
    expect(contract.conditioning.sourceSnapshot.roster.view.all).toHaveLength(19);
    expect(contract.conditioning.residents.map(row => row.name)).toEqual(['Civet', 'Persimmon', 'Platypus', 'Frog', "Devil's Club", 'Cranberry']);
    expect(manual.speciesFidelityAccepted).toBe(false);expect(manual.completePlantCountCertified).toBe(false);
    const result = assessLandfallFidelityV2(contract, observedReviewV2(contract));
    const formalPath = 'audits/AI_OFFLINE_INTEGRATION_20260909/species-review/formal-v2-review';
    const formal = JSON.parse(read(formalPath + '.json').toString());
    expect(hash(read(formalPath + '.json'))).toBe(read(formalPath + '.sha256').toString().split(' ')[0]);
    expect(formal.contractSha256).toBe(contract.contractSha256);
    expect(formal.review).toEqual(observedReviewV2(contract));expect(result).toEqual(formal.expectedAssessment);
    expect(result).toMatchObject({ ok: true, disposition: 'species-rejected', allRequiredOutcomesReportedPass: false,
      observationKind: 'agent-visual', semanticsVerifiedByCode: false, reviewerAuthenticated: false, fullQualityAccepted: false });
  });

  it('admits only a synthetic complete positive and deep-freezes detached full-identity/geometry bindings', () => {
    const input = fixtureV2(true), before = JSON.stringify(input), contract = boundV2(input), review = syntheticReviewV2(contract);
    expect(assessLandfallFidelityV2(contract, review)).toMatchObject({ ok: true, disposition: 'review-complete',
      observationKind: 'synthetic-control', allRequiredOutcomesReportedPass: true,
      semanticsVerifiedByCode: false, reviewerAuthenticated: false, fullQualityAccepted: false });
    expect(JSON.stringify(input)).toBe(before);expect(Object.isFrozen(contract.references[0])).toBe(true);
    expect(Object.isFrozen(contract.conditioning.referenceRequirements[0]!.fullGenome)).toBe(true);
    expect(contract.referenceSetSha256).toBe(hash(JSON.stringify(input.references)));
    expect(contract.snapshotSha256).toBe(bound(fixture()).snapshotSha256);
    expect(contract.conditioningCapability.perInstanceSpatialControl).toBe(false);
    input.references[0].sha256 = hash('changed source');expect(contract.references[0]!.sha256).not.toBe(input.references[0].sha256);
    refused(assessLandfallFidelityV2(copy(contract), review));
  });

  it('keeps V1 and V2 producer, contract and observation admission separate', () => {
    const v1 = fixture(), c1 = bound(v1), v2 = fixtureV2(), c2 = boundV2(v2);
    refused(buildLandfallFidelityV1(v2.recipeJson, v2.image, v2.references));
    refused(buildLandfallFidelityV2(v1.recipeJson, v1.image, v1.references));
    expect(assessLandfallFidelityV1(c2, syntheticReviewV2(c2))).toEqual({ ok: false, reason: 'invalid-contract' });
    expect(assessLandfallFidelityV2(c1, syntheticReview(c1))).toEqual({ ok: false, reason: 'invalid-contract' });
    refused(assessLandfallFidelityV2(c2, { ...syntheticReviewV2(c2), schema: LANDFALL_VISUAL_REVIEW_SCHEMA_V1 }));
    refused(assessLandfallFidelityV1(c1, { ...syntheticReview(c1), schema: LANDFALL_VISUAL_REVIEW_SCHEMA_V2 }));
    expect(assessLandfallFidelityV1(c1, observedReview(c1, v1.negative))).toMatchObject({ ok: true, disposition: 'species-rejected' });
  });

  it('refuses V2 reference count, order, full identity and duplicated source-digest mutations even when both carriers agree', () => {
    const input = fixtureV2();
    const mutations = [
      (refs: any[]) => { refs.pop(); }, (refs: any[]) => { refs.push(copy(refs[0])); },
      (refs: any[]) => { refs.reverse(); }, (refs: any[]) => { refs[1].imageIndex = 1; },
      (refs: any[]) => { refs[0].speciesVisualKey = refs[2].speciesVisualKey; },
      (refs: any[]) => { refs[0].speciesVisualKey = 'Civet:3212817920'; },
      (refs: any[]) => { refs[1].sha256 = refs[0].sha256; }, (refs: any[]) => { refs[0].sha256 = 'invalid'; },
    ];
    for (const mutate of mutations) {
      const refs = copy(input.references);mutate(refs);
      const recipe = { ...JSON.parse(input.recipeJson), references: refs };
      expect(buildLandfallFidelityV2(JSON.stringify(recipe), input.image, refs)).toEqual({ ok: false, reason: 'reference-mismatch' });
    }
  });

  it('rejects substituted recipe/source reference SHA, source geometry, prepared geometry and undeclared reference fields', () => {
    const input = fixtureV2();
    for (const fields of [{ sha256: hash('substituted source') }, { sourceWidth: 1536 }, { width: 481 }, { url: 'unbound.png' }]) {
      const refs = copy(input.references);Object.assign(refs[0], fields);
      expect(buildLandfallFidelityV2(input.recipeJson, input.image, refs)).toEqual({ ok: false, reason: 'reference-mismatch' });
    }
    for (const fields of [{ sourceWidth: 0 }, { sourceWidth: 768.5 }, { sourceWidth: 8193 },
      { sourceWidth: 6000, sourceHeight: 4000 }, { sourceWidth: 768, sourceHeight: 511 }, { width: 481 }, { height: 321 }]) {
      const refs = copy(input.references);Object.assign(refs[0], fields);
      expect(buildLandfallFidelityV2(JSON.stringify({ ...JSON.parse(input.recipeJson), references: refs }), input.image, refs)).toEqual({ ok: false, reason: 'reference-mismatch' });
    }
  });

  it('rejects mixed conditioning versions, full-genome/rule/anchor changes and altered V2 prompt ordering', () => {
    const input = fixtureV2();
    const mutations = [
      (r: any) => { r.schema = 'cf.ai-landfall-render.v1'; },
      (r: any) => { r.conditioning = JSON.parse(fixture().recipeJson).conditioning; },
      (r: any) => { r.conditioning.referenceRequirements[0].fullGenome.color++; },
      (r: any) => { r.conditioning.sourceSnapshot.roster.view.all[18].color++; },
      (r: any) => { r.conditioning.referenceRequirements[0].subjectIdentityKey = r.conditioning.referenceRequirements[2].subjectIdentityKey; },
      (r: any) => { r.conditioning.residents[0].placement.x = .2; },
      (r: any) => { r.conditioning.residents[0].namedRule.diagnostics[0].required = 'generic animal'; },
      (r: any) => { r.conditioning.prompt = r.conditioning.prompt.replace('Image 1 guides ONLY Civet', 'Image 3 guides ONLY Civet'); },
      (r: any) => { r.modelManifestSha256 = hash('changed model'); }, (r: any) => { r.qualityAccepted = true; },
    ];
    for (const mutate of mutations) {
      const recipe = JSON.parse(input.recipeJson);mutate(recipe);
      expect(buildLandfallFidelityV2(JSON.stringify(recipe), input.image, input.references)).toEqual({ ok: false, reason: 'unsupported-recipe' });
    }
  });

  it('refuses stale digest families and per-resident reference/image/index mixing with the same assessor', () => {
    const contract = boundV2(fixtureV2(true));
    for (const field of ['contractSha256', 'imageSha256', 'recipeSha256', 'referenceSetSha256'] as const) {
      const review = syntheticReviewV2(contract);review[field] = hash('stale');
      expect(assessLandfallFidelityV2(contract, review)).toEqual({ ok: false, reason: 'stale-review' });
    }
    for (const fields of [{ referenceImageIndex: 3 }, { referenceSha256: contract.references[2]!.sha256 },
      { identityKey: 'Civet:3212817920' }, { expectedPlacement: { ...contract.conditioning.residents[0]!.placement, x: .1 } }]) {
      const review = syntheticReviewV2(contract);Object.assign(review.residents[0]!, fields);
      expect(assessLandfallFidelityV2(contract, review)).toEqual({ ok: false, reason: 'wrong-review-target' });
    }
    const mixed = syntheticReviewV2(contract);mixed.residents[0]!.contractSha256 = bound(fixture()).contractSha256;
    expect(assessLandfallFidelityV2(contract, mixed)).toEqual({ ok: false, reason: 'stale-review' });
  });

  it('makes legitimate new image/reference bindings require a new review rather than laundering old observations', () => {
    const input = fixtureV2(true), prior = boundV2(input), review = syntheticReviewV2(prior);
    input.image.sha256 = hash('another synthetic image');
    const nextImage = boundV2(input);
    expect(nextImage.contractSha256).not.toBe(prior.contractSha256);
    expect(assessLandfallFidelityV2(nextImage, review)).toEqual({ ok: false, reason: 'stale-review' });
    const recipe = JSON.parse(input.recipeJson);recipe.references[0].sha256 = hash('another declared reference');
    const nextReference = boundV2({ ...input, recipeJson: JSON.stringify(recipe), references: recipe.references });
    expect(nextReference.referenceSetSha256).not.toBe(prior.referenceSetSha256);
    expect(assessLandfallFidelityV2(nextReference, review)).toEqual({ ok: false, reason: 'stale-review' });
  });

  it('requires explicit plant-count evidence and all diagnostics; favorable finish cannot repair their failures', () => {
    const contract = boundV2(fixtureV2(true)), review = syntheticReviewV2(contract);
    review.scene.floraCount = copy(v2Evidence.scene.floraCount);
    expect(assessLandfallFidelityV2(contract, review, finish(contract))).toMatchObject({ ok: true, disposition: 'species-rejected', fullQualityAccepted: false });
    review.scene.floraCount = { result: 'pass', evidence: 'Synthetic count restored.' };
    expect(assessLandfallFidelityV2(contract, review)).toMatchObject({ ok: true, disposition: 'review-complete' });
    const { floraCount: _count, ...missingCount } = review.scene;
    for (const invalid of [missingCount, { ...review.scene, floraCount: { result: 'pass', evidence: '' } }])
      expect(assessLandfallFidelityV2(contract, { ...review, scene: invalid })).toEqual({ ok: false, reason: 'incomplete-review' });
    expect(assessLandfallFidelityV2(contract, { ...review, scene: { ...review.scene, floraCount: undefined } }))
      .toEqual({ ok: false, reason: 'invalid-data' });
    review.residents[1]!.diagnostics[2]!.result = 'fail';
    expect(assessLandfallFidelityV2(contract, review)).toMatchObject({ ok: true, disposition: 'species-rejected' });
    review.residents[1]!.diagnostics.pop();expect(assessLandfallFidelityV2(contract, review)).toEqual({ ok: false, reason: 'incomplete-review' });
  });

  it('keeps V2 hostile input, transported contracts, duplicate bodies and image metadata fail-closed', () => {
    const input = fixtureV2(true), contract = boundV2(input), review = syntheticReviewV2(contract);
    const getter = vi.fn(() => input.references[0].sha256), hostile = copy(input.references);
    Object.defineProperty(hostile[0], 'sha256', { get: getter, enumerable: true });
    refused(buildLandfallFidelityV2(input.recipeJson, input.image, hostile));expect(getter).not.toHaveBeenCalled();
    refused(assessLandfallFidelityV2({ ...contract }, review));
    review.residents[2]!.instances[0] = review.residents[0]!.instances[0]!;
    expect(assessLandfallFidelityV2(contract, review)).toEqual({ ok: false, reason: 'duplicate-or-mixed-instance' });
    for (const image of [{ ...input.image, bytes: 0 }, { ...input.image, width: 768 }, { ...input.image, mime: 'image/webp' }, { ...input.image, sha256: 'missing' }])
      refused(buildLandfallFidelityV2(input.recipeJson, image, input.references));
  });
});
