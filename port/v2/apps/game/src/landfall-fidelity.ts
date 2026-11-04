/** Pure review contract, not image recognition, a gameplay grant or an art approval.
 * Human/agent observations remain reported evidence. Full quality is never inferred
 * from recipe metadata, a complete review form, or favorable finish feedback. */
import { snapshotEarthLayerDataV1 } from '@cf/art/earth-resident-plan';
import { buildLandfallConditioningV1, buildLandfallConditioningV2, type LandfallConditioningRecipeV1,
  type LandfallConditioningRecipeV2 } from './landfall-conditioning.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from './local-model-manifest.js';

export const LANDFALL_FIDELITY_SCHEMA_V1 = 'cf.landfall-fidelity.v1' as const;
export const LANDFALL_VISUAL_REVIEW_SCHEMA_V1 = 'cf.landfall-visual-observation.v1' as const;
export const LANDFALL_FIDELITY_SCHEMA_V2 = 'cf.landfall-fidelity.v2' as const;
export const LANDFALL_VISUAL_REVIEW_SCHEMA_V2 = 'cf.landfall-visual-observation.v2' as const;
/** Source: pinned transformer has hidden/text states, timestep and image/text IDs.
 * stage-worker appends whole reference latents at t=10,20,...; it supplies no
 * regional mask, per-subject attention routing, boxes or object-count constraint.
 * Full signatures and official-source limits are retained in the fidelity audit. */
export const LANDFALL_CONDITIONING_CAPABILITY_V1 = Object.freeze({
  mode: 'global-text-plus-reference-tokens', multipleReferenceImages: true,
  perInstanceSpatialControl: false, enforcedObjectCount: false, qualifiedPixelIdentity: false,
} as const);

export interface LandfallImageBindingV1 {
  readonly sha256: string; readonly bytes: number;
  readonly width: number; readonly height: number; readonly mime: 'image/png';
}
export interface LandfallReferenceBindingV1 {
  readonly imageIndex: 1; readonly sha256: string; readonly width: 480; readonly height: 320;
  readonly speciesVisualKey: string;
}
export interface LandfallFidelityContractV1 {
  readonly schema: typeof LANDFALL_FIDELITY_SCHEMA_V1;
  readonly contractSha256: string;
  readonly recipeJson: string;
  readonly recipeSha256: string;
  readonly conditioningSha256: string;
  readonly snapshotSha256: string;
  readonly referenceSetSha256: string;
  readonly image: LandfallImageBindingV1;
  readonly references: readonly LandfallReferenceBindingV1[];
  /** Full19 snapshot and six complete genomes/identities/anchors, not name/seed summaries. */
  readonly conditioning: LandfallConditioningRecipeV1;
  readonly expectedCounts: Readonly<{ fauna: 3; flora: 3; displayed: 6; fullRoster: 19 }>;
  readonly conditioningCapability: typeof LANDFALL_CONDITIONING_CAPABILITY_V1;
  readonly byteVerification: 'caller-must-verify-original-and-reference-bytes';
}
export interface LandfallReferenceBindingV2 extends Omit<LandfallReferenceBindingV1, 'imageIndex'> {
  readonly imageIndex: number; readonly sourceWidth: number; readonly sourceHeight: number;
}
export interface LandfallFidelityContractV2 extends Omit<LandfallFidelityContractV1, 'schema' | 'references' | 'conditioning'> {
  readonly schema: typeof LANDFALL_FIDELITY_SCHEMA_V2;
  readonly references: readonly LandfallReferenceBindingV2[];
  readonly conditioning: LandfallConditioningRecipeV2;
}
type Verdict = 'pass' | 'fail';
type Placement = LandfallConditioningRecipeV1['residents'][number]['placement'];
export interface LandfallVisualObservationV1 {
  readonly schema: typeof LANDFALL_VISUAL_REVIEW_SCHEMA_V1;
  readonly contractSha256: string; readonly imageSha256: string;
  readonly recipeSha256: string; readonly referenceSetSha256: string;
  readonly basis: 'direct-image-observation';
  readonly observer: Readonly<{ kind: 'human-visual' | 'agent-visual' | 'synthetic-control'; id: string; evidenceSha256: string }>;
  readonly scene: Readonly<{ faunaBodies: number; unmatchedFaunaBodies: number;
    distinctBodies: Verdict; noCrossSpeciesFeatures: Verdict; evidence: string }>;
  readonly residents: readonly Readonly<{
    contractSha256: string; identityKey: string; expectedPlacement: Placement;
    /** IDs identify bodies actually observed, not automatically generated target slots. */
    instances: readonly string[];
    identity: Readonly<{ result: Verdict; evidence: string }>;
    placement: Readonly<{ result: Verdict; evidence: string }>;
    diagnostics: readonly Readonly<{ role: string; result: Verdict; evidence: string }>[];
  }>[];
}
export interface LandfallVisualObservationV2 extends Omit<LandfallVisualObservationV1, 'schema' | 'scene' | 'residents'> {
  readonly schema: typeof LANDFALL_VISUAL_REVIEW_SCHEMA_V2;
  readonly scene: LandfallVisualObservationV1['scene'] & Readonly<{
    /** Cropped/interwoven motifs do not establish three separate plant individuals. */
    floraCount: Readonly<{ result: Verdict; evidence: string }>;
  }>;
  readonly residents: readonly (LandfallVisualObservationV1['residents'][number] & Readonly<{
    referenceImageIndex: number; referenceSha256: string;
  }>)[];
}
export interface LandfallFinishFeedbackV1 {
  readonly scope: 'finish-only'; readonly source: 'user'; readonly imageSha256: string;
  readonly sentiment: 'favorable' | 'neutral' | 'unfavorable'; readonly evidence: string;
}
type Reason = 'invalid-data' | 'unsupported-recipe' | 'reference-mismatch' | 'invalid-contract'
  | 'stale-review' | 'incomplete-review' | 'duplicate-or-mixed-instance' | 'wrong-review-target'
  | 'inconsistent-count' | 'invalid-finish-feedback';
type Refusal = Readonly<{ ok: false; reason: Reason }>;
class Refuse extends Error { constructor(readonly reason: Reason) { super(reason); } }
function stop(reason: Reason): never { throw new Refuse(reason); }
const failure = (error: unknown): Refusal => Object.freeze({ ok: false, reason: error instanceof Refuse ? error.reason : 'invalid-data' });
const sha = (text: string): string => new LocalModelSha256V1().update(new TextEncoder().encode(text)).digestHex();
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const own = Object.keys(value); return own.length === expected.length && expected.every(key => Object.hasOwn(value, key));
};
const text = (value: unknown, max = 1024): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 12;
const verdict = (value: unknown): value is Verdict => value === 'pass' || value === 'fail';
const normal = (value: unknown): unknown => JSON.parse(JSON.stringify(snapshotEarthLayerDataV1(value)));
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); }
  return value;
}
const contracts = new WeakSet<object>();
const contractsV2 = new WeakSet<object>();

/** Historical prompt variants remain reviewable as exact byte-bound records.
 * All other conditioning data must equal the existing canonical compiler. This
 * does not certify which producer generated those prompt bytes, widen runtime
 * admission, verify image bytes or manufacture a live CanonicalWorldRoster. */
export function buildLandfallFidelityV1(
  recipeJson: unknown, imageInput: unknown, referenceInput: unknown,
): Readonly<{ ok: true; contract: LandfallFidelityContractV1 }> | Refusal {
  try {
    if (!text(recipeJson, 131072)) stop('invalid-data');
    const recipe = normal(JSON.parse(recipeJson));
    if (!record(recipe) || !keys(recipe, ['schema', 'conditioning', 'width', 'height', 'steps', 'seed', 'modelRevision',
      'runtimeVersion', 'modelManifestSha256', 'q8Block32', 'reference', 'negativePromptHandling', 'qualityAccepted'])
      || recipe.schema !== 'cf.ai-landfall-render.v1' || recipe.width !== 1024 || recipe.height !== 576 || recipe.steps !== 4
      || recipe.seed !== 133 || recipe.modelRevision !== PINNED_LOCAL_MODEL_MANIFEST_V1.revision
      || recipe.modelManifestSha256 !== PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256
      || recipe.runtimeVersion !== 'cf.local-ai-worker.v1' || typeof recipe.q8Block32 !== 'boolean'
      || recipe.negativePromptHandling !== 'metadata-only-not-consumed-by-klein' || recipe.qualityAccepted !== false
      || !record(recipe.conditioning) || !text(recipe.conditioning.prompt, 4096)) stop('unsupported-recipe');
    const compiled = buildLandfallConditioningV1(recipe.conditioning.sourceSnapshot);
    if (!compiled.ok) stop('unsupported-recipe');
    const { prompt: _oldPrompt, ...observed } = recipe.conditioning;
    const { prompt: _currentPrompt, ...expected } = compiled.recipe;
    if (JSON.stringify(observed) !== JSON.stringify(expected)) stop('unsupported-recipe');
    const image = normal(imageInput), references = normal(referenceInput);
    if (!record(image) || !keys(image, ['sha256', 'bytes', 'width', 'height', 'mime']) || !digest(image.sha256)
      || !Number.isSafeInteger(image.bytes) || (image.bytes as number) < 1 || (image.bytes as number) > 16 * 1024 * 1024
      || image.width !== 1024 || image.height !== 576 || image.mime !== 'image/png') stop('invalid-data');
    if (!Array.isArray(references) || references.length !== 1 || !record(references[0]) || !record(recipe.reference)) stop('reference-mismatch');
    const ref = references[0];
    if (!keys(ref, ['imageIndex', 'sha256', 'width', 'height', 'speciesVisualKey'])
      || !keys(recipe.reference, ['sha256', 'width', 'height', 'speciesVisualKey'])
      || ref.imageIndex !== 1 || !digest(ref.sha256) || ref.width !== 480 || ref.height !== 320
      || ref.speciesVisualKey !== compiled.recipe.referenceRequirements[0]!.subjectIdentityKey
      || recipe.reference.sha256 !== ref.sha256 || recipe.reference.width !== ref.width
      || recipe.reference.height !== ref.height || recipe.reference.speciesVisualKey !== ref.speciesVisualKey) stop('reference-mismatch');
    const boundImage: LandfallImageBindingV1 = { sha256: image.sha256, bytes: image.bytes as number, width: 1024, height: 576, mime: 'image/png' };
    const boundReferences: LandfallReferenceBindingV1[] = [{ imageIndex: 1, sha256: ref.sha256,
      width: 480, height: 320, speciesVisualKey: ref.speciesVisualKey as string }];
    const payload = { schema: LANDFALL_FIDELITY_SCHEMA_V1, recipeJson, recipeSha256: sha(recipeJson),
      conditioningSha256: sha(JSON.stringify(recipe.conditioning)), snapshotSha256: sha(JSON.stringify(compiled.recipe.sourceSnapshot)),
      referenceSetSha256: sha(JSON.stringify(boundReferences)), image: boundImage, references: boundReferences,
      conditioning: recipe.conditioning as unknown as LandfallConditioningRecipeV1,
      expectedCounts: { fauna: 3, flora: 3, displayed: 6, fullRoster: 19 } as const,
      conditioningCapability: LANDFALL_CONDITIONING_CAPABILITY_V1,
      byteVerification: 'caller-must-verify-original-and-reference-bytes' as const };
    const contract = freeze({ ...payload, contractSha256: sha(JSON.stringify(payload)) }); contracts.add(contract);
    return Object.freeze({ ok: true, contract });
  } catch (error) { return failure(error); }
}

/** V2 requires the exact six-reference compiler output, including its ordered prompt.
 * Original and source-reference bytes remain the caller's verification responsibility. */
export function buildLandfallFidelityV2(
  recipeJson: unknown, imageInput: unknown, referenceInput: unknown,
): Readonly<{ ok: true; contract: LandfallFidelityContractV2 }> | Refusal {
  try {
    if (!text(recipeJson, 131072)) stop('invalid-data');
    const recipe = normal(JSON.parse(recipeJson));
    if (!record(recipe) || !keys(recipe, ['schema', 'conditioning', 'width', 'height', 'steps', 'seed', 'modelRevision',
      'runtimeVersion', 'modelManifestSha256', 'q8Block32', 'references', 'negativePromptHandling', 'qualityAccepted'])
      || recipe.schema !== 'cf.ai-landfall-render.v2' || recipe.width !== 1024 || recipe.height !== 576 || recipe.steps !== 4
      || recipe.seed !== 133 || recipe.modelRevision !== PINNED_LOCAL_MODEL_MANIFEST_V1.revision
      || recipe.modelManifestSha256 !== PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256
      || recipe.runtimeVersion !== 'cf.local-ai-worker.v1' || typeof recipe.q8Block32 !== 'boolean'
      || recipe.negativePromptHandling !== 'metadata-only-not-consumed-by-klein' || recipe.qualityAccepted !== false
      || !record(recipe.conditioning)) stop('unsupported-recipe');
    const compiled = buildLandfallConditioningV2(recipe.conditioning.sourceSnapshot);
    if (!compiled.ok || JSON.stringify(recipe.conditioning) !== compiled.canonicalJson) stop('unsupported-recipe');
    const image = normal(imageInput), references = normal(referenceInput);
    if (!record(image) || !keys(image, ['sha256', 'bytes', 'width', 'height', 'mime']) || !digest(image.sha256)
      || !Number.isSafeInteger(image.bytes) || (image.bytes as number) < 1 || (image.bytes as number) > 16 * 1024 * 1024
      || image.width !== 1024 || image.height !== 576 || image.mime !== 'image/png') stop('invalid-data');
    if (!Array.isArray(references) || references.length !== 6
      || !Array.isArray(recipe.references) || recipe.references.length !== 6) stop('reference-mismatch');
    const boundReferences: LandfallReferenceBindingV2[] = [], hashes = new Set<string>();
    const referenceKeys = ['imageIndex', 'sha256', 'width', 'height', 'sourceWidth', 'sourceHeight', 'speciesVisualKey'];
    for (let index = 0; index < references.length; index++) {
      const ref = references[index], rendered = recipe.references[index];
      if (!record(ref) || !record(rendered) || !keys(ref, referenceKeys) || !keys(rendered, referenceKeys)
        || referenceKeys.some(key => ref[key] !== rendered[key])
        || ref.imageIndex !== index + 1 || !digest(ref.sha256) || hashes.has(ref.sha256)
        || ref.width !== 480 || ref.height !== 320
        || !Number.isSafeInteger(ref.sourceWidth) || !Number.isSafeInteger(ref.sourceHeight)
        || (ref.sourceWidth as number) < 1 || (ref.sourceHeight as number) < 1
        || (ref.sourceWidth as number) > 8192 || (ref.sourceHeight as number) > 8192
        || (ref.sourceWidth as number) * (ref.sourceHeight as number) > 16_777_216
        || (ref.sourceWidth as number) * 2 !== (ref.sourceHeight as number) * 3
        || ref.speciesVisualKey !== compiled.recipe.referenceRequirements[index]!.subjectIdentityKey) stop('reference-mismatch');
      hashes.add(ref.sha256);
      boundReferences.push({ imageIndex: index + 1, sha256: ref.sha256, width: 480, height: 320,
        sourceWidth: ref.sourceWidth as number, sourceHeight: ref.sourceHeight as number, speciesVisualKey: ref.speciesVisualKey as string });
    }
    const boundImage: LandfallImageBindingV1 = { sha256: image.sha256, bytes: image.bytes as number, width: 1024, height: 576, mime: 'image/png' };
    const payload = { schema: LANDFALL_FIDELITY_SCHEMA_V2, recipeJson, recipeSha256: sha(recipeJson),
      conditioningSha256: sha(compiled.canonicalJson), snapshotSha256: sha(JSON.stringify(compiled.recipe.sourceSnapshot)),
      referenceSetSha256: sha(JSON.stringify(boundReferences)), image: boundImage, references: boundReferences,
      conditioning: compiled.recipe, expectedCounts: { fauna: 3, flora: 3, displayed: 6, fullRoster: 19 } as const,
      conditioningCapability: LANDFALL_CONDITIONING_CAPABILITY_V1,
      byteVerification: 'caller-must-verify-original-and-reference-bytes' as const };
    const contract = freeze({ ...payload, contractSha256: sha(JSON.stringify(payload)) }); contractsV2.add(contract);
    return Object.freeze({ ok: true, contract });
  } catch (error) { return failure(error); }
}

function checkEvidence(value: unknown): asserts value is { result: Verdict; evidence: string } {
  if (!record(value) || !keys(value, ['result', 'evidence']) || !verdict(value.result) || !text(value.evidence)) stop('incomplete-review');
}
export type LandfallFidelityAssessmentV1 = Readonly<{
  ok: true; disposition: 'review-complete' | 'species-rejected';
  contractSha256: string; reviewSha256: string;
  observationKind: LandfallVisualObservationV1['observer']['kind'];
  finishFeedback: LandfallFinishFeedbackV1 | null;
  allRequiredOutcomesReportedPass: boolean;
  /** A complete reported form is never an image-classification certificate. */
  semanticsVerifiedByCode: false; reviewerAuthenticated: false; fullQualityAccepted: false;
}> | Refusal;

export function assessLandfallFidelityV1(
  contract: unknown, reviewInput: unknown, finishInput: unknown = null,
): LandfallFidelityAssessmentV1 {
  return assessLandfallFidelity(contract, reviewInput, finishInput, 1);
}
export function assessLandfallFidelityV2(
  contract: unknown, reviewInput: unknown, finishInput: unknown = null,
): LandfallFidelityAssessmentV1 {
  return assessLandfallFidelity(contract, reviewInput, finishInput, 2);
}
function assessLandfallFidelity(contract: unknown, reviewInput: unknown, finishInput: unknown, version: 1 | 2): LandfallFidelityAssessmentV1 {
  try {
    if (!record(contract) || !(version === 1 ? contracts : contractsV2).has(contract)) stop('invalid-contract');
    const bound = contract as unknown as LandfallFidelityContractV1 | LandfallFidelityContractV2;
    const review = normal(reviewInput);
    if (!record(review) || !keys(review, ['schema', 'contractSha256', 'imageSha256', 'recipeSha256', 'referenceSetSha256',
      'basis', 'observer', 'scene', 'residents'])
      || review.schema !== (version === 1 ? LANDFALL_VISUAL_REVIEW_SCHEMA_V1 : LANDFALL_VISUAL_REVIEW_SCHEMA_V2)) stop('incomplete-review');
    if (review.contractSha256 !== bound.contractSha256 || review.imageSha256 !== bound.image.sha256
      || review.recipeSha256 !== bound.recipeSha256 || review.referenceSetSha256 !== bound.referenceSetSha256) stop('stale-review');
    if (review.basis !== 'direct-image-observation' || !record(review.observer)
      || !keys(review.observer, ['kind', 'id', 'evidenceSha256']) || !text(review.observer.id, 128)
      || !['human-visual', 'agent-visual', 'synthetic-control'].includes(review.observer.kind as string)
      || !digest(review.observer.evidenceSha256)) stop('incomplete-review');
    const scene = review.scene;
    if (!record(scene) || !keys(scene, ['faunaBodies', 'unmatchedFaunaBodies', 'distinctBodies', 'noCrossSpeciesFeatures', 'evidence', ...(version === 2 ? ['floraCount'] : [])])
      || !count(scene.faunaBodies) || !count(scene.unmatchedFaunaBodies)
      || !verdict(scene.distinctBodies) || !verdict(scene.noCrossSpeciesFeatures) || !text(scene.evidence)
      || !Array.isArray(review.residents) || review.residents.length !== 6) stop('incomplete-review');
    let allPass = scene.faunaBodies === 3 && scene.unmatchedFaunaBodies === 0
      && scene.distinctBodies === 'pass' && scene.noCrossSpeciesFeatures === 'pass';
    if (version === 2) { checkEvidence(scene.floraCount); allPass &&= scene.floraCount.result === 'pass'; }
    const identities = new Set<string>(), instances = new Set<string>(); let fauna = 0;
    for (const row of review.residents) {
      if (!record(row) || !keys(row, ['contractSha256', 'identityKey', 'expectedPlacement', 'instances', 'identity', 'placement', 'diagnostics',
        ...(version === 2 ? ['referenceImageIndex', 'referenceSha256'] : [])])) stop('incomplete-review');
      if (row.contractSha256 !== bound.contractSha256) stop('stale-review');
      const resident = bound.conditioning.residents.find(candidate => candidate.identityKey === row.identityKey);
      if (!resident || JSON.stringify(row.expectedPlacement) !== JSON.stringify(resident.placement)) stop('wrong-review-target');
      if (version === 2) {
        const ref = (bound as LandfallFidelityContractV2).references.find(reference => reference.speciesVisualKey === resident.identityKey);
        if (!ref || row.referenceImageIndex !== ref.imageIndex || row.referenceSha256 !== ref.sha256) stop('wrong-review-target');
      }
      if (identities.has(resident.identityKey)) stop('duplicate-or-mixed-instance'); identities.add(resident.identityKey);
      if (!Array.isArray(row.instances) || row.instances.length > 8) stop('incomplete-review');
      for (const instance of row.instances) {
        if (typeof instance !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(instance)) stop('incomplete-review');
        if (instances.has(instance)) stop('duplicate-or-mixed-instance'); instances.add(instance);
      }
      if (resident.kingdom === 'fauna') fauna += row.instances.length;
      checkEvidence(row.identity); checkEvidence(row.placement);
      if (!Array.isArray(row.diagnostics) || row.diagnostics.length !== resident.namedRule.diagnostics.length) stop('incomplete-review');
      const roles = new Set<string>();
      for (const diagnostic of row.diagnostics) {
        if (!record(diagnostic) || !keys(diagnostic, ['role', 'result', 'evidence']) || typeof diagnostic.role !== 'string'
          || !resident.namedRule.diagnostics.some(expected => expected.role === diagnostic.role)
          || roles.has(diagnostic.role) || !verdict(diagnostic.result) || !text(diagnostic.evidence)) stop('incomplete-review');
        roles.add(diagnostic.role); allPass &&= diagnostic.result === 'pass';
      }
      allPass &&= row.instances.length === 1 && row.identity.result === 'pass' && row.placement.result === 'pass';
    }
    if (fauna + scene.unmatchedFaunaBodies !== scene.faunaBodies) stop('inconsistent-count');
    let finish: LandfallFinishFeedbackV1 | null = null;
    if (finishInput !== null) {
      const value = normal(finishInput);
      if (!record(value) || !keys(value, ['scope', 'source', 'imageSha256', 'sentiment', 'evidence'])
        || value.scope !== 'finish-only' || value.source !== 'user' || value.imageSha256 !== bound.image.sha256
        || !['favorable', 'neutral', 'unfavorable'].includes(value.sentiment as string) || !text(value.evidence)) stop('invalid-finish-feedback');
      finish = value as unknown as LandfallFinishFeedbackV1;
    }
    return freeze({ ok: true, disposition: allPass ? 'review-complete' : 'species-rejected', contractSha256: bound.contractSha256,
      reviewSha256: sha(JSON.stringify(review)), observationKind: review.observer.kind as LandfallVisualObservationV1['observer']['kind'],
      finishFeedback: finish, allRequiredOutcomesReportedPass: allPass,
      semanticsVerifiedByCode: false, reviewerAuthenticated: false, fullQualityAccepted: false });
  } catch (error) { return failure(error); }
}
