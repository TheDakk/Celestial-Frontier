import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);
const glassSource = readFileSync(
  new URL('../tools/glassmatrix.mjs', import.meta.url),
  'utf8',
);

const CONNECTED_EFFECT_TRUTH =
  'mining yield, rich-strike chance, or capture-contact points';
const RESEARCH_GUIDE_TRUTH = Object.freeze([
  'When every direct material unit for a slotted craft comes from exceptional stock',
  'exact item receives one deterministic Pureforged modifier',
  CONNECTED_EFFECT_TRUTH,
  'bound to its recipe and receipt',
  'mixed stock remains an ordinary craft',
  'Pureforged effects without a connected consumer, authored natural affixes/drawbacks, random drops, upgrades, sockets, and vendors remain separate beta work',
]);
const CRAFTING_GUIDE_TRUTH = Object.freeze([
  'A slotted item made entirely from exceptional direct materials carries one deterministic, recipe-and-receipt-bound Pureforged modifier',
  CONNECTED_EFFECT_TRUTH,
  'as part of that exact item through comparison and reload',
  'a mixed-material craft does not',
  'Pureforged effects without a connected consumer, authored natural affixes/drawbacks, random authored drops, targeting tags, item upgrades, sockets, and vendors remain unavailable',
]);
const RELEASE_TRUTH = Object.freeze([
  'A slotted craft paid entirely from exceptional direct materials receives one deterministic Pureforged modifier',
  CONNECTED_EFFECT_TRUTH,
  'bound to the exact recipe, receipt, and item',
  'mixed stock remains ordinary',
  'Authored natural affixes/drawbacks, random drops, upgrades, sockets, and vendors remain unavailable',
]);
const FALSE_CLAIMS = Object.freeze([
  'Mixed stock also receives a Pureforged modifier.',
  'The Pureforged modifier rerolls after reload.',
  'Authored affixes/drawbacks are now available.',
  'Item upgrades are now available.',
  'Sockets are now available.',
  'Vendors are now available.',
]);
const TRUTHFUL_FEATURE_CLAIM =
  'Fully exceptional direct-material gear crafting is now playable with a deterministic Pureforged modifier.';

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function exactSpan(source: string, start: string, end: string): string | null {
  const startIndex = source.indexOf(start);
  if (startIndex < 0 || startIndex !== source.lastIndexOf(start)) return null;
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0 || endIndex !== source.lastIndexOf(end)) return null;
  return source.slice(startIndex, endIndex);
}

function mutateExactOwner(
  source: string,
  start: string,
  end: string,
  marker: string,
  replacement: string,
  expectedOccurrences = 1,
): string {
  const owner = exactSpan(source, start, end);
  expect(owner, `missing owner ${start}`).not.toBeNull();
  expect(occurrences(owner!, marker), `unexpected owner marker count ${marker}`)
    .toBe(expectedOccurrences);
  const changed = owner!.replace(marker, replacement);
  expect(changed, marker).not.toBe(owner);
  return source.replace(owner!, changed);
}

function sliceExceptionalCopyContract(source: string): boolean {
  const research = exactSpan(
    source,
    "    { id: 'research', title: 'Research & ships'",
    "    { id: 'crafting', title: 'The Fabricator & gear'",
  );
  const crafting = exactSpan(
    source,
    "    { id: 'crafting', title: 'The Fabricator & gear'",
    "    { id: 'achievements', title: 'Achievements'",
  );
  const renderedGuide = exactSpan(
    source,
    '  const renderedArc3GuideCheck = (spec) => `',
    '  for (const spec of arc3GuideSpecs)',
  );
  const releaseAssessment = exactSpan(
    source,
    '  const releaseDraftCheck = `',
    '  const releaseDuplicateCtl = await evalIn',
  );
  const releaseBulletAuthority = exactSpan(
    source,
    '  const releaseDraftAuthority = assessGuideOrderedAuthority(',
    '  const releaseInventoryCtl = await evalIn',
  );
  const releaseControls = exactSpan(
    source,
    '  const releaseShipyardCopyCtl = await evalIn',
    '  const releaseCaptureCopyCtl = await evalIn',
  );
  const featureControls = exactSpan(
    source,
    '  const releaseOverclaimCtl = await evalIn',
    ' const releaseAuthorityCtl = await evalIn',
  );
  if (!research || !crafting || !renderedGuide || !releaseAssessment || !releaseBulletAuthority
    || !releaseControls || !featureControls) return false;

  return RESEARCH_GUIDE_TRUTH.every((copy) => research.includes(copy))
    && CRAFTING_GUIDE_TRUTH.every((copy) => crafting.includes(copy))
    && FALSE_CLAIMS.every((copy) => research.includes(copy) || crafting.includes(copy))
    && renderedGuide.includes('(?:mixed stock|mixed-material craft)')
    && renderedGuide.includes('Pureforged[^.!?]{0,80}(?:rerolls?|changes?)')
    && renderedGuide.includes('authored (?:natural )?affixes')
    && renderedGuide.includes('drawbacks are now available')
    && RELEASE_TRUTH.every((copy) => releaseAssessment.includes(copy))
    && releaseAssessment.includes('(?:mixed stock|mixed-material craft)')
    && releaseAssessment.includes('Pureforged[^.!?]{0,80}(?:rerolls?|changes?)')
    && releaseBulletAuthority.includes('releaseDraft.bulletRows, GUIDE_DRAFT_BULLET_AUTHORITY')
    && releaseBulletAuthority.includes('!releaseDraftAuthority.ok')
    && releaseBulletAuthority.includes('releaseDraftAuthorityCtl.replaced.ok')
    && releaseBulletAuthority.includes('releaseDraftAuthorityCtl.swapped.ok')
    && releaseBulletAuthority.includes('!releaseDraftAuthorityCtl.restored.ok')
    && releaseControls.includes('exceptionalMissing')
    && releaseControls.includes('effectSetMissing')
    && releaseControls.includes('mixedMissing')
    && releaseControls.includes('advancedBoundaryMissing')
    && releaseControls.includes('releaseShipyardCopyCtl.exceptionalMissing?.shipyardContract')
    && RELEASE_TRUTH.every((copy) => releaseControls.includes(copy))
    && FALSE_CLAIMS.every((copy) => releaseControls.includes(copy))
    && featureControls.includes(TRUTHFUL_FEATURE_CLAIM)
    && featureControls.includes('releaseOverclaimCtl.truthful?.length !== 13')
    && featureControls.includes('releaseOverclaimCtl.unavailable?.length !== 14')
    && !source.includes('Outputs with dormant effects, fully exceptional slotted crafting, authored affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable');
}

function glassExceptionalCopyContract(source: string): boolean {
  const ingress = exactSpan(
    source,
    'const renderedGuideIngress = await evalIn',
    'const guideReleaseBaseline = await evalIn',
  );
  const assessment = exactSpan(
    source,
    'const developmentDetailCheck = `',
    'const developmentDetail = await evalIn(developmentDetailCheck);',
  );
  const controls = exactSpan(
    source,
    'const detailControls = await evalIn',
    'if (!detailControls.ok)',
  );
  if (!ingress || !assessment || !controls) return false;

  return RESEARCH_GUIDE_TRUTH.every((copy) => ingress.includes(copy))
    && CRAFTING_GUIDE_TRUTH.every((copy) => ingress.includes(copy))
    && FALSE_CLAIMS.every((copy) => ingress.includes(copy))
    && RELEASE_TRUTH.every((copy) => assessment.includes(copy))
    && assessment.includes('(?:mixed stock|mixed-material craft)')
    && occurrences(assessment, '(?:mixed stock|mixed-material craft)') === 2
    && assessment.includes('Pureforged[^.!?]{0,80}(?:rerolls?|changes?)')
    && controls.includes(TRUTHFUL_FEATURE_CLAIM)
    && controls.includes('truthfulFeatureClaims.length===11')
    && controls.includes('unavailableFeatureClaims.length===14')
    && controls.includes('shipyardExceptionalMissing')
    && controls.includes('shipyardEffectSetMissing')
    && controls.includes('shipyardMixedMissing')
    && controls.includes('shipyardAdvancedMissing')
    && RELEASE_TRUTH.every((copy) => controls.includes(copy))
    && FALSE_CLAIMS.every((copy) => controls.includes(copy))
    && controls.includes('shipyardExceptionalMissing?.shipyardContract===false')
    && controls.includes('shipyardEffectSetMissing?.shipyardContract===false')
    && controls.includes('shipyardMixedMissing?.shipyardContract===false')
    && controls.includes('shipyardAdvancedMissing?.shipyardContract===false')
    && occurrences(ingress, CRAFTING_GUIDE_TRUTH[0]!) === 2
    && !source.includes('Fully exceptional slotted crafting, authored affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable');
}

type EffectRow = {
  key: string;
  value: number;
  source: string;
  percent: boolean;
  condition: string | null;
};

function compileSliceEffectRows(source: string): (instance: unknown) => EffectRow[] {
  const owner = exactSpan(
    source,
    'const arc2PercentEffect =',
    'const arc2ComparisonRows =',
  );
  expect(owner, 'missing Slice Arc 2 effect-row owner').not.toBeNull();
  const effectRows = runInNewContext(
    `${owner}\nglobalThis.__effectRows = arc2EffectRows;`,
    {},
  ) as ((instance: unknown) => EffectRow[]) | undefined;
  expect(effectRows).toBeTypeOf('function');
  return effectRows!;
}

const EXCEPTIONAL_FIXTURE_SOURCE =
  'loot1|craft|legacy-v1.8.9-items|recipe%3Ameteor|||receipt%3A8';

function exceptionalFixture(
  affixId: string,
  value: number,
  tier = 1,
): Readonly<Record<string, unknown>> {
  return {
    construction: 'generated',
    instanceId: `gear1|${EXCEPTIONAL_FIXTURE_SOURCE}|0`,
    baseId: 'meteor',
    baseTier: 1,
    baseEffects: {},
    naturalAffixes: [],
    legacyAffix: null,
    generation: { seed: 0x1234_5678, ordinal: 0 },
    provenance: {
      kind: 'craft',
      sourceActionId: EXCEPTIONAL_FIXTURE_SOURCE,
      receiptId: 'receipt:8',
    },
    craftedModifier: { affixId, tier, value },
  };
}

describe('Pureforged browser-evidence truth', () => {
  it('binds Slice Guide and release evidence to the live feature and still-open advanced systems', () => {
    expect(sliceExceptionalCopyContract(sliceSource)).toBe(true);
  });

  it('binds Glass Guide and release evidence to the same current boundary', () => {
    expect(glassExceptionalCopyContract(glassSource)).toBe(true);
  });

  it('fails closed when each Slice owner loses one required outcome or negative control', () => {
    const mutations = [
      ["    { id: 'research', title: 'Research & ships'", "    { id: 'crafting', title: 'The Fabricator & gear'", RESEARCH_GUIDE_TRUTH[1]!],
      ["    { id: 'crafting', title: 'The Fabricator & gear'", "    { id: 'achievements', title: 'Achievements'", CRAFTING_GUIDE_TRUTH[0]!],
      ['  const renderedArc3GuideCheck = (spec) => `', '  for (const spec of arc3GuideSpecs)', '(?:mixed stock|mixed-material craft)'],
      ['  const releaseDraftCheck = `', '  const releaseDuplicateCtl = await evalIn', RELEASE_TRUTH[0]!],
      ['  const releaseDraftAuthority = assessGuideOrderedAuthority(', '  const releaseInventoryCtl = await evalIn', 'releaseDraftAuthorityCtl.replaced.ok'],
      ['  const releaseShipyardCopyCtl = await evalIn', '  const releaseCaptureCopyCtl = await evalIn', 'releaseShipyardCopyCtl.exceptionalMissing?.shipyardContract'],
      ['  const releaseOverclaimCtl = await evalIn', ' const releaseAuthorityCtl = await evalIn', TRUTHFUL_FEATURE_CLAIM],
    ] as const;
    for (const [start, end, marker] of mutations) {
      const mutated = mutateExactOwner(sliceSource, start, end, marker, 'slice-exceptional-mutation');
      expect(sliceExceptionalCopyContract(mutated), marker).toBe(false);
    }
  });

  it('fails closed when each Glass owner loses one required outcome or negative control', () => {
    const mutations = [
      ['const renderedGuideIngress = await evalIn', 'const guideReleaseBaseline = await evalIn', CRAFTING_GUIDE_TRUTH[0]!, 2],
      ['const developmentDetailCheck = `', 'const developmentDetail = await evalIn(developmentDetailCheck);', RELEASE_TRUTH[0]!],
      ['const developmentDetailCheck = `', 'const developmentDetail = await evalIn(developmentDetailCheck);', '(?:mixed stock|mixed-material craft)', 2],
      ['const detailControls = await evalIn', 'if (!detailControls.ok)', 'shipyardExceptionalMissing?.shipyardContract===false'],
      ['const detailControls = await evalIn', 'if (!detailControls.ok)', TRUTHFUL_FEATURE_CLAIM],
    ] as const;
    for (const [start, end, marker, expectedOccurrences] of mutations) {
      const mutated = mutateExactOwner(
        glassSource,
        start,
        end,
        marker,
        'glass-exceptional-mutation',
        expectedOccurrences ?? 1,
      );
      expect(glassExceptionalCopyContract(mutated), marker).toBe(false);
    }
  });

  it('functionally folds the three connected crafted modifiers and rejects dormant or unknown IDs', () => {
    const effectRows = compileSliceEffectRows(sliceSource);
    const known = [
      ['exceptional-v1:yield', 'yield', true, 0.2],
      ['exceptional-v1:strike', 'strike', true, 0.04],
      ['exceptional-v1:contact', 'contact', false, 8],
    ] as const;
    for (const [affixId, key, percent, value] of known) {
      expect(effectRows(exceptionalFixture(affixId, value)), affixId).toEqual([{
        key,
        value,
        source: 'crafted',
        percent,
        condition: null,
      }]);
    }
    for (const affixId of [
      'exceptional-v1:scut',
      'exceptional-v1:land',
      'exceptional-v1:heal',
      'exceptional-v1:unknown',
    ]) {
      expect(() => effectRows(exceptionalFixture(affixId, 8)), affixId)
        .toThrow('Slice Arc 2 oracle received an invalid or unsupported crafted modifier');
    }
    for (const mutant of [
      { ...exceptionalFixture('exceptional-v1:contact', 8), construction: 'legacy' },
      { ...exceptionalFixture('exceptional-v1:contact', 8), instanceId: 'forged' },
      { ...exceptionalFixture('exceptional-v1:contact', 8), drawback: { affixId: 'x', tier: 1, value: 1 } },
      exceptionalFixture('exceptional-v1:contact', 8, 2),
      exceptionalFixture('exceptional-v1:contact', 13),
    ]) {
      expect(() => effectRows(mutant))
        .toThrow('Slice Arc 2 oracle received an invalid or unsupported crafted modifier');
    }
  });

  it('proves the effect-row oracle controls in both directions', () => {
    const missingKnown = mutateExactOwner(
      sliceSource,
      'const arc2PercentEffect =',
      'const arc2ComparisonRows =',
      "  'exceptional-v1:contact': Object.freeze({ key: 'contact', min: 4, max: 12 }),",
      "  'exceptional-v1:contact-mutant': Object.freeze({ key: 'contact', min: 4, max: 12 }),",
    );
    expect(() => compileSliceEffectRows(missingKnown)(
      exceptionalFixture('exceptional-v1:contact', 8),
    )).toThrow('Slice Arc 2 oracle received an invalid or unsupported crafted modifier');

    const acceptsUnknown = mutateExactOwner(
      sliceSource,
      'const arc2PercentEffect =',
      'const arc2ComparisonRows =',
      "      throw new Error('Slice Arc 2 oracle received an invalid or unsupported crafted modifier');",
      '      return rows;',
    );
    expect(compileSliceEffectRows(acceptsUnknown)(
      exceptionalFixture('exceptional-v1:unknown', 8),
    )).toEqual([]);
  });
});
