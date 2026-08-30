import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { getGuideCatalogue } from '../apps/game/src/guide-content.js';
import { getReleaseHistory, V2_DRAFT_RELEASE } from '../apps/game/src/release-content.js';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { assessArc4EpochSnapshot } from '../tools/arc4-browser-contract.mjs';
// @ts-expect-error The executable JavaScript evidence helper intentionally has no declaration shim.
import { hasUnnegatedSentenceClaim } from '../tools/engineering-browser-contract.mjs';

interface TestWindow {
  readonly document: Document;
  __CF_SLICE__?: unknown;
  eval(source: string): unknown;
  close(): void;
}

interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);
const glassSource = readFileSync(
  new URL('../tools/glassmatrix.mjs', import.meta.url),
  'utf8',
);
const arc4ContractSource = readFileSync(
  new URL('../tools/arc4-browser-contract.mjs', import.meta.url),
  'utf8',
);
const mainSource = readFileSync(
  new URL('../apps/game/src/main.ts', import.meta.url),
  'utf8',
);
const f4RuntimeSource = readFileSync(
  new URL('../apps/game/src/f4-runtime-authority.ts', import.meta.url),
  'utf8',
);

type Marker = readonly [label: string, value: string];

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  expect(at, `missing section start: ${start}`).toBeGreaterThanOrEqual(0);
  expect(stop, `missing section end: ${end}`).toBeGreaterThan(at);
  return source.slice(at, stop);
}

function markerErrors(owner: string, markers: readonly Marker[]): string[] {
  return markers.flatMap(([label, value]) => owner.includes(value) ? [] : [label]);
}

function proveEachMarkerRequired(owner: string, markers: readonly Marker[]): void {
  expect(markerErrors(owner, markers)).toEqual([]);
  markers.forEach(([label, value], index) => {
    const replacement = `__SIXTH_RED_MARKER_${index}__`;
    expect(owner.split(value).length - 1, label).toBe(1);
    const mutant = owner.replace(value, replacement);
    expect(markerErrors(mutant, markers), label).toContain(label);
  });
}

function sha256Json(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function stringConstant(source: string, name: string): string {
  const match = source.match(new RegExp(`\\b${name}: '([a-f0-9]{64})'`));
  expect(match, `missing exact ${name}`).not.toBeNull();
  return match?.[1] ?? '';
}

function numberConstant(source: string, name: string): number {
  const match = source.match(new RegExp(`\\b${name}: ([0-9]+)`));
  expect(match, `missing exact ${name}`).not.toBeNull();
  return Number(match?.[1] ?? Number.NaN);
}

function executableDeclaration<T>(name: string, nextDeclaration: string): T {
  const prefix = `  const ${name} = `;
  const owner = section(sliceSource, prefix, nextDeclaration);
  const expression = owner.slice(prefix.length).trim().replace(/;\s*$/u, '');
  return Function(
    'hasUnnegatedSentenceClaim',
    'V2_DRAFT_BULLET_COUNT',
    `return (${expression});`,
  )(hasUnnegatedSentenceClaim, 73) as T;
}

interface GuideSpec {
  readonly id: string;
  readonly title: string;
  readonly required: readonly string[];
}

interface RenderedGuideResult {
  readonly ok: boolean;
  readonly missing: readonly string[];
  readonly contradictory: boolean;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

describe('sixth Slice red contract repairs', () => {
  it('binds Guide navigation to publication and the exact current 41-topic capability identity', () => {
    const owner = section(
      sliceSource,
      '  const GUIDE_CATEGORY_AUTHORITY = Object.freeze([',
      '  /* Inline Guide cross-links were spans',
    );
    const catalogue = getGuideCatalogue();
    const expected = catalogue.flatMap((category) => category.topics.map((topic) => ({
      categoryId: category.id,
      id: topic.id,
      availability: topic.availability,
    })));
    const expectedCategoryIds = catalogue.map((category) => category.id);
    expect(catalogue).toHaveLength(9);
    expect(expected).toHaveLength(41);
    expect(expected.filter((topic) => topic.availability === 'partial')).toHaveLength(34);
    expect(expected.filter((topic) => topic.availability === 'unavailable')).toHaveLength(7);
    const categoryAuthorityOwner = section(
      sliceSource,
      '  const GUIDE_CATEGORY_AUTHORITY = Object.freeze([',
      '  const GUIDE_TOPIC_AVAILABILITY_AUTHORITY = Object.freeze([',
    );
    const parseCategoryAuthority = (source: string): string[] =>
      [...source.matchAll(/'([a-z]+(?:-[a-z]+)*)'/gu)].map((match) => match[1] ?? '');
    const declaredCategories = parseCategoryAuthority(categoryAuthorityOwner);
    expect(declaredCategories).toEqual(expectedCategoryIds);
    const categoryAuthorityMutants = {
      stale: categoryAuthorityOwner.replace("'getting-around'", "'navigation'"),
      wrong: categoryAuthorityOwner.replace("'life-compendium'", "'unknown-category'"),
      reordered: categoryAuthorityOwner.replace(
        "'getting-around', 'life-compendium'",
        "'life-compendium', 'getting-around'",
      ),
      missing: categoryAuthorityOwner.replace("'getting-around', ", ''),
    };
    for (const [label, mutant] of Object.entries(categoryAuthorityMutants)) {
      expect(mutant, `${label} category mutation changed no source`).not.toBe(categoryAuthorityOwner);
      expect(parseCategoryAuthority(mutant), `${label} category authority stayed exact`)
        .not.toEqual(expectedCategoryIds);
    }
    const declaredAuthority = [...section(
      sliceSource,
      '  const GUIDE_TOPIC_AVAILABILITY_AUTHORITY = Object.freeze([',
      '  const guideMenuExpression = `',
    ).matchAll(/\['([^']+)', '([^']+)', '(available|partial|unavailable)'\]/g)]
      .map((match) => ({ categoryId: match[1], id: match[2], availability: match[3] }));
    expect(declaredAuthority).toEqual(expected);
    for (const topic of expected) {
      expect(owner, `${topic.categoryId}/${topic.id}/${topic.availability}`).toContain(
        `['${topic.categoryId}', '${topic.id}', '${topic.availability}']`,
      );
    }
    proveEachMarkerRequired(owner, [
      ['menu publication waiter', 'const waitGuideMenu = (label) => waitDesktopValue('],
      ['category publication waiter', '`${label} ${categoryId} publication`, guideCategoryPublicationExpression'],
      ['category return waiter', 'await waitGuideMenu(`${label} ${categoryId} return`)'],
      ['search publication waiter', 'return waitDesktopValue(`${label} search publication`'],
      ['topic publication waiter', 'return waitDesktopValue(`${label} topic publication`'],
      ['exact identity comparison', 'JSON.stringify(inventory.topics) === JSON.stringify(GUIDE_TOPIC_AVAILABILITY_AUTHORITY)'],
      ['exact category comparison', 'JSON.stringify(categoryIds) === JSON.stringify(GUIDE_CATEGORY_AUTHORITY)'],
      ['whole-Guide copy assessor', 'const assessGuideCopy = (copy) => {'],
      ['whole-topic copy collection', 'topicCopy.push({ categoryId, id: row.id, text: topic.text })'],
      ['stale topic mutation control', "const staleCopyTarget = staleCopySource.topics.find((row) => row.id === 'zoom')"],
      ['canonical stale-copy control', 'mutated: assessGuideCopy(staleCopySource)'],
      ['search ingress assessor', 'const assessGuideSearchIngress = (search) => ({'],
      ['disabled search ingress control', 'input.disabled=true;const disabled=${guideMenuExpression};input.disabled=false;'],
      ['missing-category control', 'missingCategory: mutateGuideInventory('],
      ['omitted-wait control', 'omittedWait: { publicationReady: guideCategoryPublished('],
      ['partial-to-unavailable control', 'partialToUnavailable: mutateGuideInventory('],
      ['unavailable-to-partial control', 'unavailableToPartial: mutateGuideInventory('],
      ['constant-count swap control', 'constantCountSwap: mutateGuideInventory('],
      ['stale-category control', 'staleCategory: mutateGuideInventory('],
      ['restoration control', 'restored: assessGuideInventory(guideInventory)'],
    ]);
    expect(owner).not.toContain('partialCount !== 26');
    expect(owner).not.toContain('unavailableCount !== 15');
  });

  it('keeps every rendered Guide and release oracle green on current exact copy before browser spend', () => {
    const catalogue = getGuideCatalogue();
    const topics = new Map<string, (typeof catalogue)[number]['topics'][number]>(
      catalogue.flatMap((category) =>
        category.topics.map((topic) => [topic.id, topic] as const)),
    );
    const evaluateGuide = (id: string, expression: string): RenderedGuideResult => {
      const topic = topics.get(id);
      expect(topic, `missing current Guide topic: ${id}`).toBeDefined();
      if (!topic) throw new Error(`missing current Guide topic: ${id}`);
      const dom = new JSDOM(
        `<div id="guidepanel"><article class="guide-topic">`
          + `<h4 data-guide-heading>${escapeHtml(topic.title)}</h4>`
          + `<span data-guide-status="${topic.availability}"></span>${topic.body}</article></div>`,
        { runScripts: 'outside-only' },
      );
      const result = dom.window.eval(expression) as RenderedGuideResult;
      dom.window.close();
      return result;
    };
    const specGroups = [
      {
        specs: executableDeclaration<readonly GuideSpec[]>(
          'arc3GuideSpecs',
          '  const renderedArc3GuideCheck = ',
        ),
        check: executableDeclaration<(spec: GuideSpec) => string>(
          'renderedArc3GuideCheck',
          '  for (const spec of arc3GuideSpecs) {',
        ),
      },
      {
        specs: executableDeclaration<readonly GuideSpec[]>(
          'compendiumGuideSpecs',
          '  const renderedCompendiumGuideCheck = ',
        ),
        check: executableDeclaration<(spec: GuideSpec) => string>(
          'renderedCompendiumGuideCheck',
          '  const renderCompendiumGuideTopic = ',
        ),
      },
      {
        specs: executableDeclaration<readonly GuideSpec[]>(
          'audioGuideSpecs',
          '  const renderedAudioGuideCheck = ',
        ),
        check: executableDeclaration<(spec: GuideSpec) => string>(
          'renderedAudioGuideCheck',
          '  const renderAudioGuideTopic = ',
        ),
      },
    ];
    for (const group of specGroups) {
      for (const spec of group.specs) {
        expect(evaluateGuide(spec.id, group.check(spec)), spec.id).toMatchObject({
          ok: true,
          missing: [],
          contradictory: false,
        });
      }
    }

    const charterCheck = executableDeclaration<(title: string) => string>(
      'renderedCharterGuideCheck',
      '  const renderCharterGuideTopic = ',
    );
    expect(evaluateGuide('charters', charterCheck('Expedition Charters'))).toMatchObject({
      ok: true,
      missing: [],
      contradictory: false,
    });
    expect(evaluateGuide('ascent', charterCheck('Chapters'))).toMatchObject({
      ok: true,
      missing: [],
      contradictory: false,
    });
    const trainingRestoreCheck = executableDeclaration<(title: string) => string>(
      'renderedTrainingRestoreGuideCheck',
      '  const renderTrainingRestoreGuideTopic = ',
    );
    expect(evaluateGuide('settings', trainingRestoreCheck('Settings'))).toMatchObject({
      ok: true,
      missing: [],
      contradictory: false,
    });
    expect(evaluateGuide('saving', trainingRestoreCheck('Your save & reset'))).toMatchObject({
      ok: true,
      missing: [],
      contradictory: false,
    });

    const releaseCheck = executableDeclaration<string>(
      'releaseDraftCheck',
      "  await evalIn(`document.querySelector('#guidepanel [data-release-index=\"0\"]')?.click()`);",
    );
    const releaseSections = V2_DRAFT_RELEASE.sections.map((releaseSection) =>
      `<h5>${escapeHtml(releaseSection.category)}</h5><ul>`
        + releaseSection.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')
        + '</ul>').join('');
    const releaseDom = new JSDOM(
      `<div id="guidepanel"><article class="guide-topic">`
        + '<h4 data-guide-heading>v2.0 · A New Foundation</h4>'
        + `<span data-guide-status="draft"></span>${releaseSections}</article></div>`,
      { runScripts: 'outside-only' },
    );
    releaseDom.window.__CF_SLICE__ = {
      api: { state: () => ({ rnSeen: '0', releasePending: null }) },
    };
    const releaseBaseline = releaseDom.window.eval(releaseCheck) as {
      readonly complete: boolean;
      readonly honest: boolean;
      readonly populated: boolean;
      readonly canonical: boolean;
      readonly liveProgressionContract: boolean;
      readonly liveProgressionContradiction: boolean;
    };
    expect(releaseBaseline).toMatchObject({
      complete: true,
      honest: true,
      populated: true,
      canonical: true,
      liveProgressionContract: true,
      liveProgressionContradiction: false,
    });
    const currentGuideCopy = catalogue.flatMap((category) => category.topics).map((topic) => {
      const dom = new JSDOM(`<article>${topic.body}</article>`);
      const copy = dom.window.document.querySelector('article')?.textContent ?? '';
      dom.window.close();
      return copy;
    }).join('\n');
    const currentReleaseCopy = V2_DRAFT_RELEASE.sections
      .flatMap((releaseSection) => releaseSection.bullets).join('\n');
    const expectedReleaseHistory = getReleaseHistory({ includeDraft: true }).map((release, index) => ({
      index: String(index),
      title: `${release.version ? `v${release.version} · ` : ''}${release.title}`,
      meta: release.status === 'draft' ? 'UNRELEASED DEVELOPMENT'
        : `${release.date}${release.status === 'shipped' ? ' · v2 release' : ' · legacy release'}`,
    }));
    const releaseHistoryAuthoritySource = section(
      sliceSource,
      '  const GUIDE_RELEASE_HISTORY_AUTHORITY = Object.freeze({',
      '  const GUIDE_DRAFT_BULLET_AUTHORITY = Object.freeze({',
    );
    expect(numberConstant(releaseHistoryAuthoritySource, 'count')).toBe(expectedReleaseHistory.length);
    expect(stringConstant(releaseHistoryAuthoritySource, 'sha256'))
      .toBe(sha256Json(expectedReleaseHistory));
    const expectedDraftBullets = V2_DRAFT_RELEASE.sections.flatMap((releaseSection) =>
      releaseSection.bullets);
    const draftBulletDom = new JSDOM(
      `<ul>${expectedDraftBullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`,
    );
    const renderedDraftBullets = [...draftBulletDom.window.document.querySelectorAll('li')]
      .map((row) => row.textContent ?? '');
    draftBulletDom.window.close();
    expect(renderedDraftBullets).toEqual(expectedDraftBullets);
    const draftBulletAuthoritySource = section(
      sliceSource,
      '  const GUIDE_DRAFT_BULLET_AUTHORITY = Object.freeze({',
      '  const assessGuideOrderedAuthority = (rows, authority) => {',
    );
    expect(numberConstant(draftBulletAuthoritySource, 'count')).toBe(renderedDraftBullets.length);
    expect(stringConstant(draftBulletAuthoritySource, 'sha256'))
      .toBe(sha256Json(renderedDraftBullets));
    const guideReleaseOwner = section(
      sliceSource,
      '  const GUIDE_CATEGORY_AUTHORITY = Object.freeze([',
      '  const guideFocusBack = await evalIn(',
    );
    const replacementAnchors = [...guideReleaseOwner.matchAll(/\.replace\('((?:\\.|[^'])*)'/gu)]
      .map((match) => Function(`return '${match[1]}'`)() as string);
    expect(replacementAnchors).toHaveLength(43);
    expect([...new Set(replacementAnchors)].filter((anchor) =>
      !`${currentGuideCopy}\n${currentReleaseCopy}`.includes(anchor))).toEqual([]);
    const starter = [...releaseDom.window.document.querySelectorAll('#guidepanel li')]
      .find((row) => /THE CHARTER STOPS AT THE LIVE FRONTIER/u.test(row.textContent ?? ''));
    expect(starter).toBeDefined();
    if (!starter) throw new Error('missing Starter Charter release control row');
    const prior = starter.textContent ?? '';
    starter.textContent = prior.replace(
      'first planetfall beyond canonical Earth, one Mine, a non-null Field Scout assignment or switch, verified conquest',
      'live writer identity removed',
    );
    expect(releaseDom.window.eval(releaseCheck)).toMatchObject({
      complete: false,
      liveProgressionContract: false,
    });
    starter.textContent = `${prior} Starter Charter rewards remain unavailable.`;
    expect(releaseDom.window.eval(releaseCheck)).toMatchObject({
      complete: false,
      honest: false,
      liveProgressionContradiction: true,
    });
    starter.textContent = prior;
    expect(releaseDom.window.eval(releaseCheck)).toMatchObject({
      complete: true,
      honest: true,
    });
    releaseDom.window.close();
  });

  it('keeps Guide Release and valid-CF1 waiters diagnostic instead of truthy or lossy', () => {
    const guideRelease = section(
      sliceSource,
      "  await evalIn(`document.querySelector('#guidepanel [data-guide-releases]')?.click()`);",
      '  const guideFocusBack = await evalIn(',
    );
    proveEachMarkerRequired(guideRelease, [
      ['release-history waiter', "waitDesktopValue('Guide release-history publication'"],
      ['draft waiter', "waitDesktopValue('Guide v2 draft publication'"],
      ['draft outcome predicate', "value?.identity === true && value?.status === 'draft' && value?.bulletCount > 0"],
      ['Starter/Binder/Scout/Conquest contract', 'liveProgressionContract=starterCharterText.includes('],
      ['live progression polarity', 'liveProgressionContradiction=/Charter rewards?'],
      ['live progression controls', 'const releaseLiveProgressionCtl = await evalIn('],
    ]);
    const cf1 = section(
      sliceSource,
      '  const validPlanetSearchCheck = `',
      '  const validPlanetSizeCtl = await evalIn(',
    );
    proveEachMarkerRequired(cf1, [
      ['direct exact waiter', "'valid CF1 keyboard focus handoff', validPlanetSearchCheck, 6000, (value) => value?.ok === true"],
      ['world naming diagnostic', 'worldNaming:st.worldNaming??null'],
      ['persistence diagnostic', 'persistence:st.persistence??null'],
      ['share-Follow owner source', 'shareFollowOwner=st.landing?.actionCoordinator?.owner??null'],
      ['share-Follow owner diagnostic', 'shareFollowOwner,shareFollowOutcome,customNames:st.save?.customNames??null'],
      ['share-Follow committed outcome', 'shareFollowOutcome===${JSON.stringify(expectedShareFollowOutcome)}'],
      ['share-Follow committed persistence', "/^arc9-share-follow-committed:[0-9]+$/u.test(shareFollowPersistence)"],
      ['share-Follow saved Sol route', "st.save?.viewType==='star'&&st.save?.savedView?.gal?.seed===999"],
      ['share-Follow exact Jumps advance', 'st.save?.stats?.jumps===${shareFollowJumpsAfter}'],
      ['share-Follow unchanged-counter control', 'const validPlanetJumpsCtl = await evalIn('],
      ['share-Follow inspection-only control', 'const validPlanetInspectionCtl = await evalIn('],
      ['share-Follow persistence control', 'const validPlanetPersistenceCtl = await evalIn('],
      ['share-Follow saved-route control', 'const validPlanetSavedRouteCtl = await evalIn('],
      ['custom-name diagnostic', 'customNames:st.save?.customNames??null'],
      ['saved-view diagnostic', 'savedView:st.save?.savedView??null'],
      ['jump diagnostic', 'jumps:st.save?.stats?.jumps??null'],
      ['nonmatching object sentinel', "diagnosticSentinel:'retained-nonmatching-valid-planet'"],
      ['timeout diagnostic assertion', "message.includes('retained-nonmatching-valid-planet')"],
    ]);
    const validPlanetPrefix = '  const validPlanetSearchCheck = `';
    const validPlanetExpressionStart = cf1.indexOf(validPlanetPrefix) + validPlanetPrefix.length;
    const validPlanetExpressionEnd = cf1.indexOf('`;\n  const validPlanetSearch = ', validPlanetExpressionStart);
    expect(validPlanetExpressionStart).toBeGreaterThanOrEqual(validPlanetPrefix.length);
    expect(validPlanetExpressionEnd).toBeGreaterThan(validPlanetExpressionStart);
    const validPlanetExpression = cf1.slice(validPlanetExpressionStart, validPlanetExpressionEnd)
      .replace('${shareFollowJumpsAfter}', '1')
      .replace('${JSON.stringify(expectedShareFollowOutcome)}', JSON.stringify('committed:0->1'));
    expect(() => Function(`return (${validPlanetExpression});`)).not.toThrow();
    expect(cf1).not.toContain("result.mode==='system'&&result.title==='Blue Earth'?result:null");
  });

  it('keeps a fixed 73-row Guide oracle with five independent population controls', () => {
    expect(sliceSource).toContain('const V2_DRAFT_BULLET_COUNT = 73;');
    const owner = section(
      sliceSource,
      '  const releaseDraftCheck = `',
      '  const releaseShipyardCopyCtl = await evalIn(',
    );
    proveEachMarkerRequired(owner, [
      ['fixed positive count', 'populated:bullets.length===${V2_DRAFT_BULLET_COUNT}'],
      ['rendered bullet identity rows', 'bulletRows:bulletRaw'],
      ['raw nonempty and trim clauses',
        'bulletRaw.every((bullet)=>bullet.length>0&&bullet===bullet.trim())'],
      ['exact draft-bullet assessor', 'const releaseDraftAuthority = assessGuideOrderedAuthority('],
      ['constant-count replacement control', "replacedDraftBullets[12] += ' unchecked replacement'"],
      ['constant-count swap control', '[swappedDraftBullets[0], swappedDraftBullets[1]] = [swappedDraftBullets[1], swappedDraftBullets[0]]'],
      ['exact draft-bullet restoration', 'restored:assessGuideOrderedAuthority(releaseDraft.bulletRows, GUIDE_DRAFT_BULLET_AUTHORITY)'],
      ['count deletion control', 'const releaseInventoryCtl = await evalIn('],
      ['uniqueness control', 'const releaseDuplicateCtl = await evalIn('],
      ['section population control', 'const releaseEmptySectionCtl = await evalIn('],
      ['raw empty control', 'const releaseEmptyBulletCtl = await evalIn('],
      ['raw trim control', 'const releaseWhitespaceBulletCtl = await evalIn('],
      ['removal delta',
        'releaseInventoryCtl.removed?.bulletCount !== V2_DRAFT_BULLET_COUNT - 1'],
      ['release-heading mutation result', 'const mutated=${releaseDraftCheck};headings[0].textContent=a;headings[1].textContent=b;'],
      ['release-heading restored result', 'const restored=${releaseDraftCheck};return {mutated,restored};'],
    ]);
    const historyOwner = section(
      sliceSource,
      "  await evalIn(`document.querySelector('#guidepanel [data-guide-releases]')?.click()`);",
      '  const releaseDraftCheck = `',
    );
    proveEachMarkerRequired(historyOwner, [
      ['57-row rendered identity', "title:(row.querySelector('b')?.textContent||'').trim(),meta:(row.querySelector('small')?.textContent||'').trim()"],
      ['exact history assessor', 'releaseGuideRaw.rows, GUIDE_RELEASE_HISTORY_AUTHORITY'],
      ['history duplicate control', 'duplicate:assessGuideOrderedAuthority(duplicateReleaseHistory, GUIDE_RELEASE_HISTORY_AUTHORITY)'],
      ['history reorder control', 'reordered:assessGuideOrderedAuthority(reorderedReleaseHistory, GUIDE_RELEASE_HISTORY_AUTHORITY)'],
      ['history restoration control', 'restored:assessGuideOrderedAuthority(releaseGuide.rows, GUIDE_RELEASE_HISTORY_AUTHORITY)'],
    ]);
    expect(glassSource).toContain('expectedBulletCount=73');
    expect(glassSource).toContain('inventory?.bulletCount===72');
    expect(glassSource).toContain('73-outcome development inventory');
    expect(glassSource).not.toContain('55-outcome development inventory');
  });

  it('separates both advancing active-play mirrors from stable fixture state', () => {
    const projection = section(
      sliceSource,
      '  const arc4PertarStableStateProjection = (state) => {',
      '  const waitForArc4PertarSurface = async',
    );
    proveEachMarkerRequired(projection, [
      ['runtime projection', 'delete stable.persistence.runtime.activePlayMs;'],
      ['ecology projection',
        'delete stable.persistence.ecology.observedActivePlayMs;'],
      ['ecology before validation',
        'const beforeEcologyActivePlayMs = before?.persistence?.ecology?.observedActivePlayMs;'],
      ['ecology after validation',
        'const afterEcologyActivePlayMs = after?.persistence?.ecology?.observedActivePlayMs;'],
      ['ecology monotonicity',
        'afterEcologyActivePlayMs >= beforeEcologyActivePlayMs'],
      ['ecology bound',
        'afterEcologyActivePlayMs - beforeEcologyActivePlayMs <= 10_000'],
    ]);
    const controls = section(
      sliceSource,
      '  const arc4FixtureWrongOrdinalClockControl =',
      '  /* A one-sided durable route mutation',
    );
    proveEachMarkerRequired(controls, [
      ['runtime clock mutant',
        'next.wrongOrdinal.stateAfter.persistence.runtime.activePlayMs'],
      ['ecology clock mutant',
        'next.wrongOrdinal.stateAfter.persistence.ecology.observedActivePlayMs'],
    ]);
  });

  it('proves private epoch staging before one committed publication and reload', () => {
    const owner = section(
      sliceSource,
      '  /* DOM-1: exercise the real epoch snapshot path',
      "  await send('Target.closeTarget', { targetId: tk.targetId });",
    );
    proveEachMarkerRequired(owner, [
      ['single awaited persist',
        'persisted=await window.__CF_SLICE__.api.__smokePersistNow()'],
      ['named assessment', 'assessArc4EpochSnapshot(epochSnapshot)'],
      ['control owner',
        'const epochSnapshotControls = epochSnapshotAssessment.ok ? ['],
      ['before control', "'negative-before', ['beforeEpoch']"],
      ['optimistic precommit control', "'optimistic-precommit', ['precommitPrivate']"],
      ['optimistic publication control',
        "'optimistic-publication', ['precommitPublicationPrivate']"],
      ['candidate control', "'missing-candidate', ['precommitCandidateStaged']"],
      ['precommit edge control', "'early-edge-clear', ['precommitEdgeDue']"],
      ['committed epoch control', "'withheld-commit', ['committedEpoch']"],
      ['committed publication control',
        "'withheld-publication', ['committedPublished']"],
      ['committed candidate control',
        "'stale-committed-candidate', ['committedCandidate']"],
      ['committed edge control',
        "'uncleared-committed-edge', ['committedEdgeSettled']"],
      ['stored control', "'stored-base', ['storedCommitted']"],
      ['reload control', "'reloaded-base', ['reloadedCommitted']"],
    ]);

    const base = {
      before: 0,
      precommit: { epoch: 0, publishedEpoch: 0, candidateEpoch: 1, edgeDue: true },
      committed: { epoch: 1, publishedEpoch: 1, candidateEpoch: 1, edgeDue: false },
      stored: 1,
      reloaded: 1,
    };
    expect(assessArc4EpochSnapshot(base).ok).toBe(true);
    const controls = [
      ['beforeEpoch', (next: typeof base) => {
        next.before = -1;
        next.precommit.epoch = -1;
        next.precommit.publishedEpoch = -1;
        next.precommit.candidateEpoch = 0;
        next.committed.epoch = 0;
        next.committed.publishedEpoch = 0;
        next.committed.candidateEpoch = 0;
        next.stored = 0;
        next.reloaded = 0;
      }],
      ['precommitPrivate', (next: typeof base) => { next.precommit.epoch = 1; }],
      ['precommitPublicationPrivate',
        (next: typeof base) => { next.precommit.publishedEpoch = 1; }],
      ['precommitCandidateStaged',
        (next: typeof base) => { next.precommit.candidateEpoch = 0; }],
      ['precommitEdgeDue', (next: typeof base) => { next.precommit.edgeDue = false; }],
      ['committedPublished', (next: typeof base) => { next.committed.publishedEpoch = 0; }],
      ['committedCandidate', (next: typeof base) => { next.committed.candidateEpoch = 0; }],
      ['committedEdgeSettled', (next: typeof base) => { next.committed.edgeDue = true; }],
      ['storedCommitted', (next: typeof base) => { next.stored = 0; }],
      ['reloadedCommitted', (next: typeof base) => { next.reloaded = 0; }],
    ] as const;
    for (const [expected, mutate] of controls) {
      const next = structuredClone(base);
      mutate(next);
      const failures = Object.entries(assessArc4EpochSnapshot(next).checks)
        .filter(([, value]) => value !== true).map(([name]) => name);
      expect(failures, expected).toEqual([expected]);
    }
    const withheld = structuredClone(base);
    withheld.committed.epoch = 0;
    withheld.stored = 0;
    withheld.reloaded = 0;
    expect(Object.entries(assessArc4EpochSnapshot(withheld).checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['committedEpoch']);
  });

  it('binds the Guide oracle to the truthful parked-development publishing contract', () => {
    const sliceOracle = section(
      sliceSource,
      '  const releaseDraftCheck = `',
      '  await evalIn(`document.querySelector',
    );
    proveEachMarkerRequired(sliceOracle, [
      ['publishing heading lookup',
        'publishing=bulletNodes.find((item)=>/DEVELOPMENT PUBLISHING STAYS PARKED/'],
      ['publishing semantic heading',
        "publishingContract=publishingHeading==='Under the Hood'"],
      ['publishing parked body',
        "&&publishingText.includes('DEVELOPMENT PUBLISHING STAYS PARKED')"],
      ['publishing non-publication body',
        "&&publishingText.includes('it does not publish')"],
      ['publishing manual workflow body',
        "&&publishingText.includes('The separate branch-site workflow remains manually parked')"],
      ['publishing production body',
        "&&publishingText.includes('production remains the v1.8.9 main-branch site')"],
      ['publishing contradiction predicate',
        'publishingClaim=/(?:(?:(?:v2(?:[.]0)?'],
      ['publishing contradiction scans every row',
        'publishingContradiction=bulletRaw.some((copy)=>unnegated(copy,publishingClaim))'],
      ['publishing contradiction contract member',
        '&&!publishingContradiction;'],
      ['publishing completeness member',
        '&&shipyardContract&&captureContract&&liveProgressionContract&&audioContract&&mealContract&&breedContract&&renameContract&&hdSurfaceContract&&publishingContract'],
      ['publishing contradiction diagnostic',
        'publishingHeading,publishingContract,publishingContradiction,overclaim'],
      ['publishing honesty member',
        '&&!captureContradiction&&!liveProgressionContradiction&&!audioContradiction&&!mealContradiction&&!breedContradiction&&!renameContradiction&&!publishingContradiction'],
    ]);
    expect(sliceOracle.split('(?:published|deployed|shipped)').length - 1).toBe(2);
    const sliceControls = section(
      sliceSource,
      '  const releasePublishingCtl = await evalIn(',
      '  const releaseOverclaimCtl = await evalIn(',
    );
    proveEachMarkerRequired(sliceControls, [
      ['publishing missing-clause mutation',
        'const releasePublishingCtl = await evalIn('],
      ['publishing missing-clause restore requirement',
        '!releasePublishingCtl.restored?.publishingContract'],
      ['publishing additive contradiction mutation',
        'const releasePublishingContradictionCtl = await evalIn('],
      ['publishing affirmative control copy',
        "The preview package now publishes and deploys the v2.0 development site."],
      ['publishing contradiction rejection',
        'releasePublishingContradictionCtl.contradictory?.publishingContradiction !== true'],
      ['publishing contradiction restoration',
        'releasePublishingContradictionCtl.restored?.publishingContradiction !== false'],
      ['publishing inverted-live mutation',
        'const releasePublishingLiveProductionCtl = await evalIn('],
      ['publishing inverted-live control copy',
        'The v2.0 preview is live in production.'],
      ['publishing inverted-live rejection',
        'releasePublishingLiveProductionCtl.contradictory?.publishingContradiction !== true'],
      ['publishing inverted-live restoration',
        'releasePublishingLiveProductionCtl.restored?.publishingContradiction !== false'],
      ['publishing passive mutation',
        'const releasePublishingPassiveCtl = await evalIn('],
      ['publishing passive control copy',
        'The preview package is published to the development site.'],
      ['publishing passive rejection',
        'releasePublishingPassiveCtl.contradictory?.publishingContradiction !== true'],
      ['publishing passive restoration',
        'releasePublishingPassiveCtl.restored?.publishingContradiction !== false'],
      ['publishing variant controls',
        'const releasePublishingVariantsCtl = await evalIn('],
      ['publishing continuous control copy',
        'The preview package is being published to the development site.'],
      ['publishing adverb control copy',
        'The development site was just published.'],
      ['publishing deployed control copy',
        'The development site is now deployed.'],
      ['publishing gone-live control copy',
        'The preview package has gone live.'],
      ['publishing variant exact inventory',
        'releasePublishingVariantsCtl.variants?.length !== 4'],
      ['publishing cross-row control',
        'const releasePublishingCrossRowCtl = await evalIn('],
      ['publishing cross-row control copy',
        'The development site now deploys the v2.0 preview package.'],
      ['publishing cross-row rejection',
        'releasePublishingCrossRowCtl.contradictory?.publishingContradiction !== true'],
    ]);

    const glassOracle = section(
      glassSource,
      '        const developmentDetailCheck = `',
      '        const developmentDetail = await evalIn(developmentDetailCheck);',
    );
    proveEachMarkerRequired(glassOracle, [
      ['Glass publishing heading lookup',
        'publishing=bulletNodes.find((item)=>/DEVELOPMENT PUBLISHING STAYS PARKED/'],
      ['Glass publishing semantic heading',
        "publishingContract=publishingHeading==='Under the Hood'"],
      ['Glass publishing parked body',
        "&&publishingText.includes('DEVELOPMENT PUBLISHING STAYS PARKED')"],
      ['Glass publishing non-publication body',
        "&&publishingText.includes('it does not publish')"],
      ['Glass publishing manual workflow body',
        "&&publishingText.includes('The separate branch-site workflow remains manually parked')"],
      ['Glass publishing production body',
        "&&publishingText.includes('production remains the v1.8.9 main-branch site')"],
      ['Glass publishing contradiction predicate',
        'publishingClaim=/(?:(?:(?:v2(?:[.]0)?'],
      ['Glass publishing contradiction scans every row',
        'publishingContradiction=bullets.some((copy)=>unnegated(copy,publishingClaim))'],
      ['Glass publishing contradiction contract member',
        '&&!publishingContradiction;'],
      ['Glass publishing completeness member',
        '&&workspaceContract&&coldArtContract&&workerContract&&shipyardContract&&hdSurfaceContract&&publishingContract'],
      ['Glass publishing contradiction diagnostic',
        'publishingHeading,publishingContract,publishingContradiction,rnSeen:state.rnSeen'],
      ['Glass publishing honesty member',
        '&&!shipyardContradiction&&!publishingContradiction&&lower.includes'],
    ]);
    expect(glassOracle.split('(?:published|deployed|shipped)').length - 1).toBe(2);
    const glassControls = section(
      glassSource,
      '          const detailControls = await evalIn(',
      '          if (!detailControls.ok)',
    );
    proveEachMarkerRequired(glassControls, [
      ['Glass publishing missing-clause mutation',
        "publishing.textContent=publishingText.replace('DEVELOPMENT PUBLISHING STAYS PARKED','DEVELOPMENT PUBLISHING CONTRACT REMOVED')"],
      ['Glass publishing additive control copy',
        "The preview package now publishes and deploys the v2.0 development site."],
      ['Glass publishing contradiction assessment',
        'publishingContradictionChanged=publishing.textContent!==publishingText;publishingContradictory=${developmentDetailCheck}'],
      ['Glass publishing semantic restoration assessment',
        'publishingRestored=${developmentDetailCheck};'],
      ['Glass publishing contradiction rejection',
        '&&publishingContradictionChanged&&publishingContradictory?.ok===false'],
      ['Glass publishing contradiction diagnosis',
        '&&publishingContradictory?.publishingContradiction===true&&publishingContradictory?.honest===false'],
      ['Glass publishing inverted-live control copy',
        'The v2.0 preview is live in production.'],
      ['Glass publishing inverted-live assessment',
        'publishingLiveProductionChanged=publishing.textContent!==publishingText;publishingLiveProductionContradictory=${developmentDetailCheck}'],
      ['Glass publishing inverted-live rejection',
        '&&publishingLiveProductionChanged&&publishingLiveProductionContradictory?.ok===false'],
      ['Glass publishing inverted-live diagnosis',
        '&&publishingLiveProductionContradictory?.publishingContradiction===true'],
      ['Glass publishing passive control copy',
        'The preview package is published to the development site.'],
      ['Glass publishing passive assessment',
        'publishingPassiveChanged=publishing.textContent!==publishingText;publishingPassiveContradictory=${developmentDetailCheck}'],
      ['Glass publishing passive rejection',
        '&&publishingPassiveChanged&&publishingPassiveContradictory?.ok===false'],
      ['Glass publishing passive diagnosis',
        '&&publishingPassiveContradictory?.publishingContradiction===true'],
      ['Glass publishing variant inventory',
        'publishingVariantContradictions.length===4'],
      ['Glass publishing variant diagnosis',
        'publishingVariantContradictions.every((row)=>row.result?.ok===false'],
      ['Glass publishing cross-row mutation',
        'first.textContent=firstText+\' The development site now deploys the v2.0 preview package.\''],
      ['Glass publishing cross-row rejection',
        '&&publishingCrossRowChanged&&publishingCrossRowContradictory?.ok===false'],
      ['Glass publishing restoration requirement',
        '&&publishingRestored?.ok===true&&publishingRestored?.publishingContract===true'],
    ]);
  });

  it('quiesces and certifies exact v4 fixture staging before route verdicts', () => {
    const drainHook = section(
      mainSource,
      'async function smokeDrainFixturePersist(',
      '\nasync function smokeStageStoredV4(',
    );
    proveEachMarkerRequired(drainHook, [
      ['drain cancels unstarted debounce', 'clearTimeout(_persistT); _persistT = 0;'],
      ['drain captures exact tail', 'const pendingPersist = activePersist;'],
      ['drain joins exact tail', 'try { await pendingPersist; }'],
      ['drain refuses concurrent authority',
        'if (activePersist || importWriteInFlight || replacementTransaction'],
      ['drain commits one current checkpoint', 'const committed = await persistView();'],
      ['drain requires quiescent completion',
        'return committed && activePersist === null && _persistT === 0;'],
    ]);
    expect(mainSource).toContain(
      '__smokeDrainFixturePersist: smokeDrainFixturePersist,',
    );
    const productHook = section(
      mainSource,
      'async function smokeStageStoredV4(',
      '\nfunction persistSoon(): void {',
    );
    proveEachMarkerRequired(productHook, [
      ['cancel unstarted debounce', 'clearTimeout(_persistT); _persistT = 0;'],
      ['block new persistence', "persistHold = 'protected-payload';"],
      ['capture exact active write', 'const pendingPersist = activePersist;'],
      ['join exact active write', 'try { await pendingPersist; }'],
      ['post-join concurrency guard',
        'if (activePersist || importWriteInFlight || replacementTransaction'],
      ['dynamic backup type guard', "backup !== undefined && typeof backup !== 'string'"],
      ['absent-primary backup rejection', 'raw === null && backup !== undefined'],
      ['pending convergence guard',
        '|| replacementReloadPending || f4AuthorityReloadScheduled) return false;'],
      ['release tab authority', 'await f4Runtime?.release();'],
      ['atomic reset and stage', 'const staged = await persistenceBackend.compareAndApply('],
      ['absent-primary atomic reset', 'raw === null ? [] : ['],
      ['clear every authoritative store in that transaction', '    STORES,'],
      ['return atomic transaction receipt', 'return staged;'],
    ]);
    expect(productHook).not.toContain('persistenceBackend.clear(STORES)');
    const quiescenceOrder = [
      'clearTimeout(_persistT); _persistT = 0;',
      'stopF4Heartbeat();',
      'f4Runtime?.setAnswerable(false);',
      "persistHold = 'protected-payload';",
      'await settleF4Heartbeat();',
      'const pendingPersist = activePersist;',
      'try { await pendingPersist; }',
      'if (activePersist || importWriteInFlight || replacementTransaction',
      'await f4Runtime?.release();',
      'f4Runtime = null;',
      'const staged = await persistenceBackend.compareAndApply(',
      'return staged;',
    ];
    const orderErrors = (owner: string) => quiescenceOrder.flatMap((marker, index) => {
      const at = owner.indexOf(marker);
      const prior = index === 0 ? -1 : owner.indexOf(quiescenceOrder[index - 1]!);
      return at >= 0 && at > prior ? [] : [marker];
    });
    expect(orderErrors(productHook)).toEqual([]);
    quiescenceOrder.slice(1).forEach((marker, index) => {
      const prior = quiescenceOrder[index]!;
      const mutant = productHook
        .replace(prior, '__STAGE_ORDER_SWAP__')
        .replace(marker, prior)
        .replace('__STAGE_ORDER_SWAP__', marker);
      expect(orderErrors(mutant), `${prior} before ${marker}`).not.toEqual([]);
    });

    const sliceHandshake = section(
      sliceSource,
      '  const exactStoredV4Stage = ({ accepted, observed, expected, backup }) =>',
      '  const keyIn = async (key, code = key, modifiers = 0) => {',
    );
    proveEachMarkerRequired(sliceHandshake, [
      ['exact primary presence', 'observed?.primary?.present === expectedPrimaryPresent'],
      ['exact primary equality', 'observed?.primary?.value === (expectedPrimaryPresent ? expected : null)'],
      ['exact backup presence', 'observed?.backup?.present === expectedBackupPresent'],
      ['exact backup equality', 'observed?.backup?.value === (expectedBackupPresent ? backup : null)'],
      ['positive selftest',
        "exactStoredV4Stage({ accepted: true, observed: exactPrimary, expected: '{}' })"],
      ['positive backup selftest',
        "exactStoredV4Stage({ accepted: true, observed: exactBackup, expected: '{}', backup: '{\"v\":4}' })"],
      ['rejected-stage control',
        "exactStoredV4Stage({ accepted: false, observed: exactPrimary, expected: '{}' })"],
      ['wrong-byte control',
        "exactStoredV4Stage({ accepted: true, observed: exactPrimary, expected: '{\"v\":5}' })"],
      ['missing-backup control',
        "exactStoredV4Stage({ accepted: true, observed: exactPrimary, expected: '{}', backup: '{\"v\":4}' })"],
      ['wrong-backup control',
        "exactStoredV4Stage({ accepted: true, observed: exactBackup, expected: '{}', backup: '{\"v\":5}' })"],
      ['unexpected-backup control',
        "exactStoredV4Stage({ accepted: true, observed: exactBackup, expected: '{}' })"],
      ['unexpected-primary on null-clear control',
        'exactStoredV4Stage({ accepted: true, observed: exactPrimary, expected: null })'],
      ['backup-with-null-primary control',
        '}, expected: null, backup: \'{"v":4}\' })'],
      ['absent-primary control', '}, expected: null }))'],
      ['stage acceptance',
        '`window.__CF_SLICE__.api.__smokeStageStoredV4(${JSON.stringify(raw)},${backup === undefined ? \'undefined\' : JSON.stringify(backup)})`'],
      ['unconditional primary/backup receipt read',
        'try { observed = await evaluate(READ_STORED_V4_STAGE_EXPRESSION); }'],
      ['fail-fast setup diagnosis',
        'setup did not stage the exact v4 fixture: ${JSON.stringify({'],
      ['rejected-stage error receipt', 'accepted, stageError, readError,'],
      ['expected primary byte/hash receipt',
        'expectedPrimary: describeStoredValue({ present: raw !== null, value: raw })'],
      ['observed winning primary byte/hash receipt',
        'observedPrimary: describeStoredValue(observed?.primary)'],
      ['expected backup byte/hash receipt',
        'expectedBackup: describeStoredValue({ present: raw !== null && backup !== undefined, value: backup })'],
      ['observed winning backup byte/hash receipt',
        'observedBackup: describeStoredValue(observed?.backup)'],
      ['held-persist outcome owner',
        'const heldStoredV4StageOutcome = (value) => value?.armed === true'],
      ['held stage wait observed', 'value.stageWaitObserved === true'],
      ['held stage stays pending', 'value.stageSettledBeforeRelease === false'],
      ['new persistence settles blocked', 'value.mutationSettledBeforeRelease === true'],
      ['new persistence returns false', 'value.mutationResult === false'],
      ['pre-release bytes remain exact', 'value.sameBytesBeforeRelease === true'],
      ['held writer release required', 'value.released === true'],
      ['held writer committed outcome', "value.writerWitness?.outcome === 'committed'"],
      ['held writer revision source', 'Number.isSafeInteger(value.writerWitness.beforeRevision)'],
      ['held writer nonnegative revision', 'value.writerWitness.beforeRevision >= 0'],
      ['held writer overflow guard',
        'value.writerWitness.beforeRevision < Number.MAX_SAFE_INTEGER'],
      ['held writer result revision source',
        'Number.isSafeInteger(value.writerWitness.afterRevision)'],
      ['held writer exact revision advance',
        'value.writerWitness.afterRevision === value.writerWitness.beforeRevision + 1'],
      ['held outcome exact stage receipt', '&& exactStoredV4Stage(value);'],
      ['held assessment positive', 'if (!heldStoredV4StageOutcome(heldStagePositive)'],
      ['held wait-observation control',
        '{ ...heldStagePositive, stageWaitObserved: false }'],
      ['held assessment directional controls', '].some(heldStoredV4StageOutcome))'],
      ['held negative-revision control',
        'writerWitness: { beforeRevision: -1, afterRevision: 0, outcome: \'committed\' }'],
      ['held unsafe-revision control',
        'beforeRevision: Number.MAX_SAFE_INTEGER,'],
    ]);
    expect(sliceSource.split('__smokeStageStoredV4').length - 1).toBe(2);
    expect(sliceSource).toContain(
      "evalIn, OUTER_AUTH_SAVED_ROUTE_RAW, 'SAVED ROUTE AUTHORIZATION'",
    );
    expect(sliceSource).toContain(
      "requireStoredV4Stage(evalIn, STALE_SAVED_ROUTE_RAW, 'SAVED ROUTE FIELD REPAIR')",
    );
    expect(sliceSource).toContain(
      "requireStoredV4Stage(evalTp, DTRAIN_FULL_FINISH_RAW, 'D-TRAIN FULL FINISH')",
    );
    expect(sliceSource).toContain(
      "requireStoredV4Stage(evalPh, raw, 'PROTECTED SAVE', backup)",
    );
    expect(sliceSource).toContain(
      "seedRaw === undefined ? null : seedRaw,\n        'TRANSIENT READ',",
    );
    expect(sliceSource).not.toContain("typeof stage==='function'");
    const heldControl = section(
      sliceSource,
      '  const heldStageDrain = await evalIn(`(async()=>{const api=window.__CF_SLICE__.api;',
      '  await requireStoredV4Stage(\n    evalIn, OUTER_AUTH_SAVED_ROUTE_RAW',
    );
    proveEachMarkerRequired(heldControl, [
      ['drain the uncontrolled navigation tail',
        'const committed=await api.__smokeDrainFixturePersist(),state=api.state();'],
      ['require zero pending persistence',
        'if (heldStageDrain.committed !== true || heldStageDrain.pending !== 0)'],
      ['arm deterministic active persist',
        '`window.__CF_SLICE__.api.__smokeArmImportRace(${JSON.stringify(STALE_AUTOSAVE_RAW)})`'],
      ['start exact primary/backup stage while held',
        '`window.__CF_SLICE__.api.__smokeStageStoredV4(${JSON.stringify(ONE_BAD_FIELD_V4_RAW)},${JSON.stringify(STALE_AUTOSAVE_RAW)})`'],
      ['bounded stage-entry poll',
        'const heldStageWaitDeadline = performance.now() + 10_000;'],
      ['observe protected stage wait', "if (hold === 'protected-payload') {"],
      ['probe new persist while hold is active',
        "evalIn('window.__CF_SLICE__.api.__smokePersistNow()')"],
      ['bounded competing-persist poll',
        'const heldMutationDeadline = performance.now() + 10_000;'],
      ['continuously reject early stage settlement',
        'while (!heldMutationSettled && !heldStageSettled'],
      ['capture pending polarity before release',
        'stageSettledBeforeRelease = heldStageSettled;'],
      ['capture mutation polarity before release',
        'mutationSettledBeforeRelease = heldMutationSettled;'],
      ['read exact bytes before release',
        'heldStageDuring = await evalIn(READ_STORED_V4_STAGE_EXPRESSION);'],
      ['release in finally',
        "heldStageReleased = await evalIn('window.__CF_SLICE__.api.__smokeReleaseImportRace()') === true;"],
      ['join both diagnostic operations',
        'const [heldStageAccepted, heldMutationResult] = await Promise.all(['],
      ['read committed writer witness',
        "'window.__CF_SLICE__.api.state().persistence.importRace'"],
      ['bind writer witness into outcome', 'writerWitness: heldWriterWitness,'],
      ['bind observed stage wait', 'stageWaitObserved: heldStageWaitObserved,'],
      ['read exact post-stage receipt',
        'const heldStageObserved = await evalIn(READ_STORED_V4_STAGE_EXPRESSION);'],
      ['compare pre-release bytes',
        'sameBytesBeforeRelease: JSON.stringify(heldStageDuring) === JSON.stringify(heldFixtureBefore)'],
      ['judge executable outcome',
        'if (!heldStoredV4StageOutcome(heldStageControl))'],
      ['retain byte/hash diagnosis',
        'primary: describeStoredValue(heldStageObserved?.primary)'],
    ]);
    const protectedStageAt = sliceSource.indexOf(
      "return requireStoredV4Stage(evalPh, raw, 'PROTECTED SAVE', backup);",
    );
    const siblingCloseAt = sliceSource.lastIndexOf(
      "await send('Target.closeTarget', { targetId: t.targetId });",
      protectedStageAt,
    );
    expect(siblingCloseAt).toBeGreaterThanOrEqual(0);
    expect(siblingCloseAt).toBeLessThan(protectedStageAt);
  });

  it('uses a real legacy-v4 primary and gates transient-read controls on green bases', () => {
    const transient = section(
      sliceSource,
      '  /* The transient-read probe owns the database in isolation.',
      '  /* 4e-phone. A FRESH PHONE starts with training active.',
    );
    proveEachMarkerRequired(transient, [
      ['portable fixture inner legacy-v4 derivation',
        'const transientExistingV4Raw = (() => {'],
      ['portable fixture identity guard',
        "envelope?.format !== 'celestial-frontier-portable-v5' || envelope?.version !== 1"],
      ['inner legacy-v4 shape guard',
        "typeof envelope.legacyV4 !== 'string' || legacy?.v !== 4"],
      ['legacy-v4 existing-primary fixture',
        'const existingRetry = await transientRetryProbe(transientExistingV4Raw);'],
      ['legacy-v4 pre-click byte identity',
        'transientPreClickOutcome(value.preClick, transientExistingV4Raw)'],
      ['existing retry positive decision',
        'const existingRetryGreen = existingRetryOutcome(existingRetry);'],
      ['fresh retry positive decision',
        'const freshRetryGreen = freshRetryOutcome(freshRetry);'],
      ['green-only mutation controls',
        'if (existingRetryGreen && freshRetryGreen) {'],
    ]);
    expect(transient).not.toContain('transientRetryProbe(vrRaw)');
    expect(transient).not.toContain('transientPreClickOutcome(value.preClick, vrRaw)');
  });

  it('collects one exact convergence-release witness for both Arc 4 reload paths', () => {
    expect(sliceSource.split(
      "const F4_CONVERGENCE_BINDING = '__cfF4AuthorityConvergenceWitness';",
    ).length - 1).toBe(1);
    expect(sliceSource).toContain(
      "await send('Runtime.addBinding', { name: F4_CONVERGENCE_BINDING }, sess);",
    );
    expect(sliceSource).toContain(
      'const arc4ConvergenceReleaseIsolatedCheck = (result, expected) => (',
    );
    const stale = section(
      sliceSource,
      "  const arc4StaleFaultKey = 'cf_slice_arc4_stale_fault_capture_v1';",
      '  const arc4MissBeforeRaw = arc4StaleReloadedRaw;',
    );
    proveEachMarkerRequired(stale, [
      ['stale event mark', 'const arc4StaleMark = events.length;'],
      ['stale witness collection',
        'const arc4StaleConvergenceWitnesses = f4ConvergenceWitnessesSince('],
      ['stale exact witness selection',
        'convergenceWitness: arc4StaleConvergenceWitnesses.length === 1'],
      ['stale missing-count control',
        'const arc4StaleMissingWitnessControl = assessArc4StaleConvergence('],
      ['stale duplicate-count control',
        'const arc4StaleDuplicateWitnessControl = assessArc4StaleConvergence('],
      ['stale before-authority control',
        'const arc4StaleWitnessAuthorityControl = assessArc4StaleWitnessControl('],
      ['stale tuple-drift control',
        'const arc4StaleWitnessTupleControl = assessArc4StaleWitnessControl('],
      ['stale lifecycle-swap control',
        'const arc4StaleWitnessLifecycleControl = assessArc4StaleWitnessControl('],
      ['stale visible-runtime control',
        'const arc4StaleWitnessVisibleControl = assessArc4StaleWitnessControl('],
      ['stale heartbeat-runtime control',
        'const arc4StaleWitnessHeartbeatControl = assessArc4StaleWitnessControl('],
      ['stale authority exact shared failures',
        "!arc4ExactFailureSet(arc4StaleWitnessAuthorityControl, [\n      'convergenceRelease', 'oldUiConvergence',\n    ])"],
      ['stale nested authority diagnosis',
        "!arc4IsolatedCheck(\n      arc4StaleWitnessAuthorityControl.convergenceReleaseDiagnostics,\n      'beforeAuthority',\n    )"],
      ['stale nested tuple diagnosis',
        "arc4StaleWitnessTupleControl, 'tuplePreserved')"],
      ['stale nested lifecycle diagnosis',
        "arc4StaleWitnessLifecycleControl, 'beforeLifecycle')"],
      ['stale pagehide release control',
        'const arc4StalePagehideRuntimeControl = assessArc4StaleOldSurfaceControl('],
      ['stale future UI control',
        'const arc4StaleRenderedFutureControl = assessArc4StaleOldSurfaceControl('],
      ['stale excessive lag control',
        'const arc4StaleExcessiveUiLagControl = assessArc4StaleWitnessControl('],
    ]);
    expect(stale).not.toMatch(
      /arc4ConvergenceReleaseIsolatedCheck\s*\(\s*arc4StaleWitnessAuthorityControl\s*,\s*['"]beforeAuthority['"]\s*\)/,
    );
    const staleAuthoritySelftest = section(
      arc4ContractSource,
      'const negativeStaleConvergenceAuthoritySelftest',
      'const negativeStaleConvergenceTupleSelftest',
    );
    proveEachMarkerRequired(staleAuthoritySelftest, [
      ['full-assessor coordinated authority fixture',
        '= withConvergenceWitnessMutation(staleBundleSelftest, (witness) => {'],
      ['full-assessor before ordinal mutation',
        'witness.before.runtime.sessionOrdinal += 1;'],
      ['full-assessor after ordinal mutation',
        'witness.after.runtime.sessionOrdinal += 1;'],
    ]);
    const staleAuthoritySelftestVerdict = section(
      arc4ContractSource,
      '  staleConvergenceAuthority: Object.freeze({',
      '  staleConvergenceTuple: Object.freeze({',
    );
    proveEachMarkerRequired(staleAuthoritySelftestVerdict, [
      ['full-assessor exact two-red set',
        "expected: Object.freeze(['convergenceRelease', 'oldUiConvergence']),"],
      ['full-assessor authority fixture execution',
        'negativeStaleConvergenceAuthoritySelftest'],
    ]);
    const staleAuthorityNestedSelftest = section(
      arc4ContractSource,
      'const staleConvergenceAuthoritySelftestResult',
      'const coordinatedV4CompatibilitySelftests = Object.freeze({',
    );
    proveEachMarkerRequired(staleAuthorityNestedSelftest, [
      ['full-assessor nested red verdict',
        'staleConvergenceAuthoritySelftestResult.convergenceReleaseDiagnostics?.ok !== false'],
      ['full-assessor nested diagnostics',
        'staleConvergenceAuthoritySelftestResult.convergenceReleaseDiagnostics?.checks ?? {}'],
      ['full-assessor exact nested authority failure',
        "!same(staleConvergenceAuthorityNestedFailures, ['beforeAuthority'])"],
    ]);
    const publication = section(
      sliceSource,
      "  const arc4PublicationFaultKey = 'cf_slice_arc4_publication_fault_capture_v1';",
      '  arc4SliceLedger = {',
    );
    proveEachMarkerRequired(publication, [
      ['publication event mark', 'const arc4PublicationMark = events.length;'],
      ['publication witness collection',
        'const arc4PublicationConvergenceWitnesses = f4ConvergenceWitnessesSince('],
      ['publication exact witness selection',
        'convergenceWitness: arc4PublicationConvergenceWitnesses.length === 1'],
      ['publication missing-count control',
        'const arc4PublicationMissingWitnessControl = assessArc4PublicationConvergence('],
      ['publication duplicate-count control',
        'const arc4PublicationDuplicateWitnessControl = assessArc4PublicationConvergence('],
      ['publication before-authority control',
        'const arc4PublicationWitnessAuthorityControl'],
      ['publication tuple-drift control',
        'const arc4PublicationWitnessTupleControl'],
      ['publication lifecycle-swap control',
        'const arc4PublicationWitnessLifecycleControl'],
      ['publication visible-runtime control',
        'const arc4PublicationWitnessVisibleControl'],
      ['publication heartbeat-runtime control',
        'const arc4PublicationWitnessHeartbeatControl'],
      ['publication nested authority diagnosis',
        "convergenceExpected: 'beforeAuthority',\n      result: arc4PublicationWitnessAuthorityControl"],
      ['publication nested tuple diagnosis',
        "convergenceExpected: 'tuplePreserved'"],
      ['publication nested lifecycle diagnosis',
        "convergenceExpected: 'beforeLifecycle'"],
      ['publication coordinated pre-action authority control',
        'for (const runtime of [witness.before.runtime, witness.after.runtime])'],
      ['publication pagehide release control',
        'const arc4PublicationPagehideRuntimeControl'],
      ['publication future UI control',
        'const arc4PublicationRenderedFutureControl'],
      ['publication excessive lag control',
        'const arc4PublicationExcessiveUiLagControl'],
    ]);
  });

  it('independently proves convergence release from product-exact audio and stable reads', () => {
    const productAudio = section(
      mainSource,
      'function tameGreetingAudioReleasedForReload(',
      '\ntype BootPhaseStage =',
    );
    const contractAudio = section(
      arc4ContractSource,
      'const exactConvergenceAudioReleased = (audio) => {',
      '\nconst exactConvergenceRuntimeTuple =',
    );
    const mirroredAudioConditions = [
      ['schema',
        'diagnostics.schema === TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA',
        "audio?.schema === 'cf-v2-tame-greeting-audio/v1'"],
      ['disposed', 'diagnostics.disposed === true', 'audio.disposed === true'],
      ['armed', 'diagnostics.armed === 0', 'audio.armed === 0'],
      ['active voice',
        'diagnostics.activeVoiceId === null', 'audio.activeVoiceId === null'],
      ['counterpart none',
        "diagnostics.counterpart.status === 'none'",
        "audio?.counterpart?.status === 'none'"],
      ['counterpart key',
        'diagnostics.counterpart.key === null', 'audio.counterpart.key === null'],
      ['counterpart generation',
        'diagnostics.counterpart.generation === null',
        'audio.counterpart.generation === null'],
      ['counterpart lost',
        "diagnostics.counterpart.status === 'lost'",
        "audio?.counterpart?.status === 'lost'"],
      ['runtime disposed',
        "diagnostics.runtime.state === 'disposed'",
        "audio.runtime?.state === 'disposed'"],
      ['context released',
        'diagnostics.runtime.contextState === null',
        'audio.runtime.contextState === null'],
      ['nodes released',
        'diagnostics.runtime.nodes.active === 0',
        'audio.runtime.nodes?.active === 0'],
      ['voices released',
        'diagnostics.runtime.voices.active === 0',
        'audio.runtime.voices?.active === 0'],
      ['voice ids released',
        'diagnostics.runtime.voices.ids.length === 0',
        'audio.runtime.voices.ids.length === 0'],
      ['creature emitters released',
        'diagnostics.runtime.creatureEmitters.active === 0',
        'audio.runtime.creatureEmitters?.active === 0'],
      ['voice reservations released',
        'diagnostics.runtime.reservations.voices.active === 0',
        'audio.runtime.reservations?.voices?.active === 0'],
      ['node reservations released',
        'diagnostics.runtime.reservations.nodes.active === 0',
        'audio.runtime.reservations?.nodes?.active === 0'],
    ] as const;
    for (const [label, productNeedle, contractNeedle] of mirroredAudioConditions) {
      expect(productAudio, `product ${label}`).toContain(productNeedle);
      expect(contractAudio, `contract ${label}`).toContain(contractNeedle);
    }
    expect(contractAudio).toContain('Array.isArray(audio.runtime.voices.ids)');

    const productConvergence = section(
      mainSource,
      'function scheduleF4AuthorityConvergenceReload(',
      '\ntype F4HeartbeatStorageError =',
    );
    proveEachMarkerRequired(productConvergence, [
      ['product transient read hold', "persistHold = 'transient-read';"],
      ['product pre-release runtime witness',
        'runtime: runtime.diagnostics(),\n        audio: tameGreetingAudioOwner?.diagnostics() ?? null'],
      ['product runtime release await', 'try { await runtime.release(); }'],
      ['product runtime owner clear', 'if (f4Runtime === runtime) f4Runtime = null;'],
      ['product post-release runtime witness',
        'runtime: runtime.diagnostics(),\n          audio: afterAudio'],
      ['product convergence schema',
        "schema: 'cf-v2-f4-authority-convergence/v1' as const"],
    ]);
    const productStaleLifecycle = section(
      f4RuntimeSource,
      '  const blockAndRelease = async (stale: boolean): Promise<void> => {',
      '\n\n  const heartbeatUnsafe =',
    );
    proveEachMarkerRequired(productStaleLifecycle, [
      ['product stale write count', 'if (stale) staleWrites++;'],
      ['product stale block', 'staleBlocked = true;'],
      ['product stale lease release', 'await releaseGrant();'],
    ]);
    const productRuntimeRelease = section(
      f4RuntimeSource,
      '    release(): Promise<void> {',
      '\n    diagnostics(): F4RuntimeDiagnostics {',
    );
    proveEachMarkerRequired(productRuntimeRelease, [
      ['product terminal release latch', 'released = true;'],
      ['product release eligibility',
        'clock.setEligibility({ visible: false, answerable: false, leaseOwned: false }, input.now());'],
      ['product release visibility', 'visible = false;'],
      ['product exact grant release', 'return enqueue(releaseGrant);'],
    ]);
    expect(f4RuntimeSource).toContain('leaseHeartbeat: grant?.heartbeat ?? null');

    const lifecycle = section(
      arc4ContractSource,
      'const exactConvergenceRuntimeTuple = (left, right) => (',
      '\nconst assessConvergenceRelease = ({',
    );
    proveEachMarkerRequired(lifecycle, [
      ['tuple active play', 'left?.activePlayMs === right?.activePlayMs'],
      ['tuple stale block', 'left?.staleBlocked === right?.staleBlocked'],
      ['tuple commits', 'left?.commits === right?.commits'],
      ['tuple stale writes', 'left?.staleWrites === right?.staleWrites'],
      ['tuple lease losses', 'left?.leaseLosses === right?.leaseLosses'],
      ['before visibility', 'runtime?.visible !== true'],
      ['stale lease released', 'runtime.leaseOwned === false'],
      ['stale block retained', 'runtime.staleBlocked === true'],
      ['stale heartbeat released', 'runtime.leaseHeartbeat === null'],
      ['stale write observed', 'runtime.staleWrites > 0'],
      ['publication lease retained', 'runtime.leaseOwned === true'],
      ['publication not stale-blocked', 'runtime.staleBlocked === false'],
      ['publication heartbeat retained', 'counter(runtime.leaseHeartbeat)'],
      ['publication commit observed', 'runtime.commits > 0'],
    ]);
    expect(arc4ContractSource).toContain(
      'commits = 1, staleWrites = staleBlocked ? 1 : 0,',
    );

    const assessment = section(
      arc4ContractSource,
      'const assessConvergenceRelease = ({',
      '\nconst exactReleasedStaleActivePlayProjection =',
    );
    proveEachMarkerRequired(assessment, [
      ['detail attribution', 'detailAttribution: boundedText(expectedDetail, 512)'],
      ['exact release read count',
        'leaseReleaseReadsExact: counter(before?.leaseReadCount)'],
      ['release result read counter', 'counter(after?.leaseReadCount)'],
      ['publication release read overflow guard',
        "scenario !== 'publication' || before.leaseReadCount < Number.MAX_SAFE_INTEGER"],
      ['publication release read delta',
        "+ (scenario === 'publication' ? 1 : 0)"],
      ['revision read stability',
        'revisionReadsStable: counter(before?.revisionReadCount)'],
      ['scenario-specific before lifecycle',
        'beforeLifecycle: exactConvergenceBeforeLifecycle(beforeRuntime, scenario)'],
      ['post-release visibility', 'afterRuntime?.visible === false'],
      ['post-release heartbeat', 'afterRuntime?.leaseHeartbeat === null'],
      ['post-disposal audio',
        'audioReleased: exactConvergenceAudioReleased(after?.audio)'],
    ]);
    expect(arc4ContractSource).toContain(
      'expectedDetail: `Arc 4 ${interaction?.verb} authority stale`',
    );
    expect(arc4ContractSource).toContain(
      'expectedDetail: `Arc 4 ${interaction?.verb} committed at revision ${committed?.revision}; publication slice-smoke injected Arc 4 publication rejection`',
    );
    expect(arc4ContractSource).toContain("scenario: 'stale'");
    expect(arc4ContractSource).toContain("scenario: 'publication'");
    expect(mainSource).toContain('`Arc 4 ${verb} authority ${attempt.detail}`');
    expect(mainSource).toContain(
      "throw new Error('slice-smoke injected Arc 4 publication rejection')",
    );
    expect(mainSource).toContain(
      '`Arc 4 ${verb} committed at revision ${transaction.revision}; publication ${detail}`',
    );

    const controls = section(
      arc4ContractSource,
      'const convergenceReleaseDirectionalSelftests = Object.freeze({',
      '\nfor (const [name, control] of Object.entries(',
    );
    proveEachMarkerRequired(controls, [
      ['detail mutant', 'detailAttribution: Object.freeze({'],
      ['stale release-read mutant', 'staleLeaseReleaseRead: Object.freeze({'],
      ['publication missing release-read mutant',
        'publicationLeaseReleaseReadMissing: Object.freeze({'],
      ['publication extra release-read mutant',
        'publicationLeaseReleaseReadExtra: Object.freeze({'],
      ['publication negative release-read mutant',
        'publicationLeaseReleaseReadNegative: Object.freeze({'],
      ['publication overflow release-read mutant',
        'publicationLeaseReleaseReadOverflow: Object.freeze({'],
      ['revision read mutant', 'revisionReadsStable: Object.freeze({'],
      ['before visible mutant', 'beforeVisible: Object.freeze({'],
      ['stale lifecycle swap mutant', 'staleLifecycleSwap: Object.freeze({'],
      ['publication lifecycle swap mutant',
        'publicationLifecycleSwap: Object.freeze({'],
      ['after visible mutant', 'afterVisible: Object.freeze({'],
      ['after heartbeat mutant', 'afterLeaseHeartbeat: Object.freeze({'],
      ['tuple stale-block mutant', 'tupleStaleBlocked: Object.freeze({'],
      ['tuple commit mutant', 'tupleCommits: Object.freeze({'],
      ['tuple stale-write mutant', 'tupleStaleWrites: Object.freeze({'],
      ['tuple lease-loss mutant', 'tupleLeaseLosses: Object.freeze({'],
      ['missing audio mutant', 'audioMissing: Object.freeze({'],
      ['audio schema mutant', 'audioSchema: Object.freeze({'],
      ['audio disposal mutant', 'audioDisposed: Object.freeze({'],
      ['audio armed mutant', 'audioArmed: Object.freeze({'],
      ['active voice mutant', 'audioVoiceId: Object.freeze({'],
      ['counterpart mutant', 'audioCounterpart: Object.freeze({'],
      ['counterpart key mutant', 'audioCounterpartKey: Object.freeze({'],
      ['counterpart generation mutant', 'audioCounterpartGeneration: Object.freeze({'],
      ['runtime state mutant', 'audioRuntimeState: Object.freeze({'],
      ['context state mutant', 'audioContextState: Object.freeze({'],
      ['node mutant', 'audioNodes: Object.freeze({'],
      ['voice mutant', 'audioVoices: Object.freeze({'],
      ['voice id mutant', 'audioVoiceIds: Object.freeze({'],
      ['voice id shape mutant', 'audioVoiceIdsShape: Object.freeze({'],
      ['creature emitter mutant', 'audioCreatureEmitter: Object.freeze({'],
      ['voice reservation mutant', 'audioVoiceReservation: Object.freeze({'],
      ['node reservation mutant', 'audioNodeReservation: Object.freeze({'],
    ]);
    expect(arc4ContractSource).toContain(
      'leaseReadCount: beforeLeaseOwned ? 2 : 1,',
    );
    expect(arc4ContractSource).toContain(
      "throw new Error('Arc 4 convergence release rejected a released lost counterpart')",
    );
  });

  it('requires canonical Earth identity only after legacy Training restoration', () => {
    const assessment = section(
      sliceSource,
      '  const DTRAIN_CANONICAL_GALAXY_VIEW = Object.freeze({',
      '  const assessDtrainArc2Restore = ({',
    );
    proveEachMarkerRequired(assessment, [
      ['canonical Earth key',
        'const DTRAIN_CANONICAL_EARTH_KEY = ARC3_OTHER_WORLD_CONTROL_ADDRESS.key;'],
      ['canonical Earth id',
        'const DTRAIN_CANONICAL_EARTH_ID = `w|${DTRAIN_CANONICAL_EARTH_KEY}`;'],
      ['physical Earth parent route',
        'const dtrainPhysicalEarthAtlasRow = (entry) => entry?.where?.type === \'planet\''],
      ['physical Earth galaxy identity',
        'entry.where.gal?.seed === DTRAIN_CANONICAL_GALAXY_VIEW.seed'],
      ['physical Earth galaxy x',
        'entry.where.gal?.x === DTRAIN_CANONICAL_GALAXY_VIEW.x'],
      ['physical Earth galaxy y',
        'entry.where.gal?.y === DTRAIN_CANONICAL_GALAXY_VIEW.y'],
      ['physical Earth galaxy size',
        'entry.where.gal?.size === DTRAIN_CANONICAL_GALAXY_VIEW.size'],
      ['physical Earth galaxy spacing',
        'entry.where.gal?.sp === DTRAIN_CANONICAL_GALAXY_VIEW.sp'],
      ['physical Earth galaxy tilt',
        'entry.where.gal?.tilt === DTRAIN_CANONICAL_GALAXY_VIEW.tilt'],
      ['physical Earth galaxy rotation',
        'entry.where.gal?.rot === DTRAIN_CANONICAL_GALAXY_VIEW.rot'],
      ['physical Earth home identity',
        'entry.where.gal?.home === DTRAIN_CANONICAL_GALAXY_VIEW.home'],
      ['physical Earth star identity',
        'entry.where.star?.seed === DTRAIN_CANONICAL_STAR_VIEW.seed'],
      ['physical Earth star x',
        'entry.where.star?.x === DTRAIN_CANONICAL_STAR_VIEW.x'],
      ['physical Earth star y',
        'entry.where.star?.y === DTRAIN_CANONICAL_STAR_VIEW.y'],
      ['physical Earth leaf under canonical parents',
        'entry.where.pseed === EARTH.seed;'],
      ['projection removes one checkpoint row',
        'copy.log = rows.filter((_, index) => index !== checkpointRowIndex)'],
      ['projection recognizes the physical full route',
        'rows.findIndex(dtrainPhysicalEarthAtlasRow)'],
      ['assessment recognizes the physical full route',
        'raw.log.filter(dtrainPhysicalEarthAtlasRow)'],
      ['legacy and duplicate rows forbidden',
        "legacyEarthRows.length === 0 && earthRows.length === 1, 'checkpoint Earth row inventory'"],
      ['canonical parent identity',
        "earthIdentity?.[1] === canonicalEarthIdentity?.[1], 'checkpoint Earth parent identity'"],
      ['canonical ordinal identity',
        "earthIdentity?.[2] === canonicalEarthIdentity?.[2], 'checkpoint Earth ordinal identity'"],
      ['content compared without identity',
        'canonicalJson(earthWithoutId) === canonicalJson(expectedEarth)'],
      ['canonical home binding',
        'raw?.home === DTRAIN_CANONICAL_EARTH_ID'],
    ]);
    const controls = section(
      sliceSource,
      '  const privateProofControlRaw = structuredClone(rescueRaw);',
      '  /* Candidate proof fails before repository ownership reaches a write.',
    );
    proveEachMarkerRequired(controls, [
      ['private ordinal control', 'privateProofEarthRow.where.ordinal = 2;'],
      ['legacy output control', "['legacy Earth output id'"],
      ['wrong parent isolated control',
        "['Earth parent identity', 'checkpoint Earth parent identity'"],
      ['wrong ordinal isolated control',
        "['Earth ordinal identity', 'checkpoint Earth ordinal identity'"],
      ['identity exact-reason assertion',
        'JSON.stringify(assessment.reasons) !== JSON.stringify([expectedReason])'],
      ['identity restoration assertion', '!restored.ok'],
      ['duplicate identity control', "['duplicate legacy and canonical Earth rows'"],
      ['route mismatch control', "['Earth route identity'"],
    ]);
  });

  it('treats failed Arc 2 bootstrap Inventory as lazy, closed, and empty', () => {
    const collector = section(
      sliceSource,
      '  const arc2BootstrapHookFailure = await evalF4Control(',
      '  const arc2BootstrapFailedToken = await sliceToken(',
    );
    proveEachMarkerRequired(collector, [
      ['marker presence retained', 'panelStateMarkerPresent:marker!==null'],
      ['blank marker retained',
        "panelState:marker===null?null:marker.getAttribute('data-inventory-state')"],
      ['logical panel owner presence collected',
        "panelOpenPresent:apiState!==null&&typeof apiState==='object'"],
      ['logical panel owner collected', 'panelOpen:apiState?.panelOpen'],
      ['computed visibility collected',
        'panelDisplay:panel?getComputedStyle(panel).display:null'],
      ['accessibility visibility collected',
        "panelAriaHidden:panel?.getAttribute('aria-hidden')??null"],
      ['dock opener state collected',
        "dockExpanded:dock?.getAttribute('aria-expanded')??null"],
      ['rail opener state collected',
        "railExpanded:rail?.getAttribute('aria-expanded')??null"],
    ]);
    const assessment = section(
      sliceSource,
      'const assessArc2BootstrapRefusal = ({',
      'const assessFreshInitializationRace = (',
    );
    proveEachMarkerRequired(assessment, [
      ['lazy marker is absent, not blank',
        'hook?.panelStateMarkerPresent !== false || hook?.panelState !== null'],
      ['logical closure',
        'hook?.panelOpenPresent !== true || hook?.panelOpen !== null'],
      ['visual closure',
        "if (hook?.panelDisplay !== 'none') reasons.push('failed bootstrap Inventory display')"],
      ['accessible closure',
        "if (hook?.panelAriaHidden !== 'true') reasons.push('failed bootstrap Inventory aria-hidden')"],
      ['dock opener collapsed',
        "if (hook?.dockExpanded !== 'false') reasons.push('failed bootstrap dock opener collapsed')"],
      ['rail opener collapsed',
        "if (hook?.railExpanded !== 'false') reasons.push('failed bootstrap rail opener collapsed')"],
      ['empty deferred rows',
        "if (hook?.panelRows !== 0) reasons.push('failed bootstrap Inventory rows empty')"],
      ['empty deferred actions',
        "if (hook?.panelActions !== 0) reasons.push('failed bootstrap Inventory actions empty')"],
    ]);
    const controls = section(
      sliceSource,
      '  const arc2MissingPanelOpenHook = structuredClone(arc2BootstrapBundle.hook);',
      '  const waitControlValue = async (',
    );
    proveEachMarkerRequired(controls, [
      ['mounted marker control', 'mountedPanelState: assessArc2BootstrapRefusal('],
      ['blank marker control', 'blankPanelStateMarker: assessArc2BootstrapRefusal('],
      ['logical owner control', 'logicalPanelOwner: assessArc2BootstrapRefusal('],
      ['missing logical-owner property control',
        'missingPanelOpenProperty: assessArc2BootstrapRefusal('],
      ['missing logical-owner property mutation',
        'delete arc2MissingPanelOpenHook.panelOpen;'],
      ['missing logical-owner presence mutation',
        'arc2MissingPanelOpenHook.panelOpenPresent = false;'],
      ['visual display control', 'visiblePanelDisplay: assessArc2BootstrapRefusal('],
      ['ARIA visibility control', 'visiblePanelAria: assessArc2BootstrapRefusal('],
      ['dock opener control', 'expandedDockOpener: assessArc2BootstrapRefusal('],
      ['rail opener control', 'expandedRailOpener: assessArc2BootstrapRefusal('],
      ['row leak control', 'leakedPanelRow: assessArc2BootstrapRefusal('],
      ['action leak control', 'leakedPanelAction: assessArc2BootstrapRefusal('],
      ['logical owner exact reason',
        "logicalPanelOwner: 'failed bootstrap logical Inventory owner'"],
      ['missing logical-owner exact reason',
        "missingPanelOpenProperty: 'failed bootstrap logical Inventory owner'"],
      ['visual display exact reason',
        "visiblePanelDisplay: 'failed bootstrap Inventory display'"],
      ['ARIA visibility exact reason',
        "visiblePanelAria: 'failed bootstrap Inventory aria-hidden'"],
      ['dock opener exact reason',
        "expandedDockOpener: 'failed bootstrap dock opener collapsed'"],
      ['rail opener exact reason',
        "expandedRailOpener: 'failed bootstrap rail opener collapsed'"],
      ['closure exact-reason assertion',
        'JSON.stringify(control?.reasons) !== JSON.stringify([expectedReason])'],
      ['closure restoration assertion', '|| !arc2BootstrapAssessment.ok'],
    ]);
  });
});
