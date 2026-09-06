import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { getReleaseHistory, V2_DEVELOPMENT_VERSION } from '../apps/game/src/release-content.js';
// @ts-expect-error The executable browser contract intentionally has no declaration shim.
import { hasUnnegatedSentenceClaim } from '../tools/engineering-browser-contract.mjs';

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

interface ReleaseReplayAssessment {
  readonly ok: boolean;
  readonly honest: boolean;
  readonly overclaim: boolean;
  readonly shipyardContract: boolean;
  readonly shipyardContradiction: boolean;
  readonly bulletCount: number;
}

interface ReleaseReplayResult {
  readonly ok: boolean;
  readonly error: string | null;
  readonly restored: boolean;
  readonly baseline: ReleaseReplayAssessment;
  readonly truthfulFeatureClaims: readonly { copy: string; result: ReleaseReplayAssessment }[];
  readonly unavailableFeatureClaims: readonly { copy: string; result: ReleaseReplayAssessment }[];
  readonly shipyardContradictions: readonly { copy: string; result: ReleaseReplayAssessment }[];
}

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options: Record<string, unknown>) => {
    readonly window: {
      readonly document: Document;
      eval(source: string): unknown;
      close(): void;
    };
  };
};

// Replay the existing product render body and both actual Glass expressions.
// Only their document/state hosts are supplied here; no duplicate verdict owner.
async function replayRenderedReleaseControls(source: string) {
  const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
  const renderer = exactSpan(mainSource, 'function renderReleaseView(', 'function renderRelease(');
  const assessment = exactSpan(source, 'const developmentDetailCheck = `',
    'const developmentDetail = await evalIn(developmentDetailCheck);');
  const controls = exactSpan(source, 'const detailControls = await evalIn(', 'if (!detailControls.ok)');
  expect(renderer).not.toBeNull();
  expect(assessment).not.toBeNull();
  expect(controls).not.toBeNull();
  if (!renderer || !assessment || !controls) throw new Error('Release replay owner missing');
  const renderBody = renderer.slice(renderer.indexOf('  const release = releases[index];'),
    renderer.lastIndexOf('}'));
  const dom = new JSDOM('<div id="guidepanel"></div>', { runScripts: 'outside-only' });
  const document = dom.window.document;
  const panel = document.querySelector<HTMLElement>('#guidepanel');
  if (!panel) throw new Error('Release replay panel missing');
  const releases = getReleaseHistory({ includeDraft: true, includeLegacy: false });
  const escapeText = (value: unknown): string => {
    const carrier = document.createElement('span');
    carrier.textContent = String(value ?? '');
    return carrier.innerHTML;
  };
  Function('index', 'focusResult', 'releases', 'guideBodyEl', 'esc',
    'V2_DEVELOPMENT_VERSION', 'focusGuide', renderBody)(
    0, false, releases, () => panel, escapeText, V2_DEVELOPMENT_VERSION, () => {},
  );
  dom.window.eval('window.__CF_SLICE__={api:{state:()=>({rnSeen:"1.8.9",releasePending:null})}};');
  const expression = Function('hasUnnegatedSentenceClaim', 'guideReleaseBaseline',
    `${assessment}\nreturn developmentDetailCheck;`)(
    hasUnnegatedSentenceClaim, { rnSeen: '1.8.9', releasePending: null },
  ) as string;
  try {
    const result = await Function('developmentDetailCheck', 'evalIn',
      `return (async()=>{${controls}\nreturn detailControls;})();`)(
      expression, (input: string) => dom.window.eval(input),
    ) as ReleaseReplayResult;
    const after = dom.window.eval(expression) as ReleaseReplayAssessment;
    const shipyard = [...panel.querySelectorAll('li')]
      .find((row) => row.textContent?.includes('ENGINEERING TURNS OPPORTUNITY INTO REACH'));
    if (!shipyard) throw new Error('Release replay Shipyard missing');
    const original = shipyard.innerHTML;
    const reachClaims = [
      'Travel research extends permanent reach.',
      'Travel research never extends permanent reach.',
      'Travel research does not increase permanent reach.',
    ].map((copy) => {
      try {
        shipyard.textContent = shipyard.textContent + ' ' + copy;
        return { copy, result: dom.window.eval(expression) as ReleaseReplayAssessment };
      } finally { shipyard.innerHTML = original; }
    });
    const launcherClaims = [
      'FAMILIAR CONTROLS ON EVERY SCREEN: Phones keep five icon-only boards and four utility controls in compact bottom rows',
      'ONE GLASS LANGUAGE: Rounded name, health, objective and navigation controls carry the production layout forward',
      'UTILITIES STAY TOGETHER: Desktop notices and utility panels clear the measured bottom-right utility controls and share their right edge',
      'PRIME KEEPS YOUR PROGRESS: Prime Codex retains its Signature count out of nine in the phone bottom row and the tablet or desktop top-center pill',
      'Spacing inside the side navigation belongs to its controls and leaves the active panel open',
    ].map((copy) => {
      const item = [...panel.querySelectorAll('li')].find((row) => row.textContent?.includes(copy));
      if (!item) throw new Error(`Release replay launcher clause missing: ${copy}`);
      const prior = item.innerHTML;
      try {
        item.textContent = item.textContent!.replace(copy, 'Required launcher outcome removed');
        return { copy, result: dom.window.eval(expression) as ReleaseReplayAssessment };
      } finally { item.innerHTML = prior; }
    });
    const final = dom.window.eval(expression) as ReleaseReplayAssessment;
    return { result, after, reachClaims, launcherClaims, final };
  } finally { dom.window.close(); }
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
  it('replays every current rendered release control and preserves the Research reach boundary', async () => {
    const { result, after, reachClaims, launcherClaims, final } = await replayRenderedReleaseControls(glassSource);
    expect(result.error).toBeNull();
    expect(result.baseline.ok).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.restored).toBe(true);
    expect(after.ok).toBe(true);
    expect(final.ok).toBe(true);
    expect(launcherClaims).toHaveLength(5);
    for (const row of launcherClaims) {
      expect(row.result, row.copy).toMatchObject({ ok: false, honest: true, overclaim: false, bulletCount: 81 });
    }
    expect(result.truthfulFeatureClaims).toHaveLength(11);
    expect(result.truthfulFeatureClaims.every((row) => row.result.ok && row.result.honest
      && !row.result.overclaim)).toBe(true);
    expect(result.unavailableFeatureClaims).toHaveLength(14);
    expect(result.unavailableFeatureClaims.every((row) => !row.result.ok && !row.result.honest
      && row.result.overclaim)).toBe(true);
    expect(result.shipyardContradictions).toHaveLength(13);
    expect(result.shipyardContradictions.every((row) => !row.result.ok && !row.result.honest
      && !row.result.shipyardContract && row.result.shipyardContradiction)).toBe(true);
    expect(reachClaims[0]!.result).toMatchObject({ ok: false, honest: false,
      shipyardContract: false, shipyardContradiction: true });
    for (const row of reachClaims.slice(1)) {
      expect(row.result, row.copy).toMatchObject({ ok: true, honest: true,
        shipyardContract: true, shipyardContradiction: false });
    }
  });

  it('rejects the historical generic Research-reach false green and restores the bulletin', async () => {
    const marker = "              ||unnegated(shipyardText,/Travel research[^.!?]{0,128}(?:extends?|increases?)[^.!?]{0,64}(?:permanent )?reach/i)\n";
    expect(occurrences(glassSource, marker)).toBe(1);
    const { result, after, final } = await replayRenderedReleaseControls(glassSource.replace(marker, ''));
    expect(result.error).toBeNull();
    expect(result.baseline.ok).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.restored).toBe(true);
    expect(after.ok).toBe(true);
    expect(final.ok).toBe(true);
    const escaped = Array.from(result.shipyardContradictions)
      .filter((row) => row.result.ok || row.result.honest || row.result.shipyardContract
        || !row.result.shipyardContradiction);
    expect(escaped.map((row) => row.copy)).toEqual(['Travel research extends permanent reach.']);
  });

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
