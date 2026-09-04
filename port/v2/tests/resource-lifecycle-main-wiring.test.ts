import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const main = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end <= start) throw new Error(`missing mutation section: ${startText}`);
  const body = source.slice(start, end);
  const matches = body.split(needle).length - 1;
  if (matches !== 1) throw new Error(`expected one mutation target in ${startText}: ${needle}`);
  return source.slice(0, start) + body.replace(needle, replacement) + source.slice(end);
}

function includesInOrder(body: string, needles: readonly string[]): boolean {
  let cursor = 0;
  for (const needle of needles) {
    const next = body.indexOf(needle, cursor);
    if (next < 0) return false;
    cursor = next + needle.length;
  }
  return true;
}

function eagerAuthoredArchiveImports(source: string): readonly string[] {
  const imports = source.match(/^import[\s\S]*?;\s*$/gmu) ?? [];
  return imports
    .filter((statement) => !/^import\s+type\b/u.test(statement))
    .map((statement) => statement.match(/from\s+['"](\.\/[^'"]+)['"]/u)?.[1] ?? '')
    .filter((specifier) => specifier === './guide-content.js' || specifier === './release-content.js');
}

const SURVEY_DISCARD_REQUIREMENTS = Object.freeze([
  ["releaseApproachEcology(reason);", 'approach playback/listener release'],
  ['approachEcologyController.setState(null);', 'approach model release'],
  ['captureCardController.detach();', 'capture listener release'],
  ['captureCardController.setState(null);', 'capture model release'],
  ['combatCardController.detach();', 'combat listener release'],
  ['combatCardController.setState(null);', 'combat model release'],
  ['currentCapturePresentationFence = null;', 'capture fence release'],
  ['currentArc6CombatProjection = null;', 'combat projection release'],
  ['currentArc6ChampionId = null;', 'champion selection release'],
  ['lastCard = null;', 'descriptor release'],
  ['cardCtx = null;', 'route context release'],
  ['cardTravelAction = null;', 'travel action release'],
  ['surveyFocusReturn = null;', 'focus lineage release'],
  ['card.replaceChildren();', 'detached Survey DOM release'],
  ['delete card.dataset.ecologyEpoch;', 'ecology identity release'],
] as const);

function surveyDiscardErrors(source: string): readonly string[] {
  const discard = section(
    source,
    'function discardSurveyPresentation(reason: string): void {',
    '\nfunction closeVisibleSurveyAndAscend(',
  );
  const errors: string[] = [];
  for (const [needle, label] of SURVEY_DISCARD_REQUIREMENTS) {
    if (!discard.includes(needle)) errors.push(`missing ${label}`);
  }

  const rerender = section(
    source,
    'function rerender(options: { preserveSurvey?: boolean; skipPersist?: boolean } = {}): void {',
    '\n/* descents EASE in:',
  );
  const prove = rerender.indexOf('const discardSurvey = cardCtx === null || activeCardPlanetWhere() === null;');
  const hide = rerender.indexOf('hideSurvey();', prove);
  const release = rerender.indexOf("discardSurveyPresentation('survey-navigation-invalidated');", hide);
  if (!(prove >= 0 && hide > prove && release > hide)) {
    errors.push('navigation does not prove, hide, then discard stale Survey ownership');
  }

  const dock = section(
    source,
    "surveyDockEl.addEventListener('click', () => {",
    "\nchartsDockEl.addEventListener('click', () => {",
  );
  if (!includesInOrder(dock, [
    'if (cardCtx && !activeCardPlanetWhere()) {',
    'hideSurvey();',
    "discardSurveyPresentation('survey-route-stale');",
    'return;',
  ])) errors.push('stale Survey dock route does not hide then discard before return');

  const suppress = section(
    source,
    'function suppressEcologyProjection(',
    '\nfunction refreshCommittedEcologyProjection()',
  );
  if (!includesInOrder(suppress, [
    'clearPlanetside();',
    'invalidateSurveyTravel();',
    'hideSurvey();',
    "discardSurveyPresentation('ecology-projection-suppressed');",
    'try { clearWorld(); }',
  ])) errors.push('suppressed ecology projection does not invalidate, hide, then discard Survey');

  const refresh = section(
    source,
    'function refreshCommittedEcologyProjection()',
    '\nfunction publishCommittedEcologyEpoch(',
  );
  if (!includesInOrder(refresh, [
    'if (!presentPlanetSurvey(',
    'invalidateSurveyTravel();',
    'hideSurvey();',
    "discardSurveyPresentation('ecology-survey-rebuild-refused');",
  ])) errors.push('refused ecology Survey rebuild does not invalidate, hide, then discard');
  if (!includesInOrder(refresh, [
    '} else if (cardWasOpen) {',
    'invalidateSurveyTravel();',
    'hideSurvey();',
    "discardSurveyPresentation('ecology-generic-survey-invalidated');",
  ])) errors.push('generic ecology Survey invalidation does not invalidate, hide, then discard');
  return errors;
}

type ArchiveContract = Readonly<{
  label: 'Guide' | 'Release';
  specifier: './guide-content.js' | './release-content.js';
  loadStart: string;
  loadEnd: string;
  promise: 'guideContentPromise' | 'releaseContentPromise';
  requestStart: string;
  requestEnd: string;
  cachedModule: 'guideContentModule' | 'releaseContentModule';
  loadCall: 'loadGuideContent' | 'loadReleaseContent';
  successCall: 'render(module, catalogue);' | 'render(module);';
}>;

const ARCHIVE_CONTRACTS: readonly ArchiveContract[] = Object.freeze([
  Object.freeze({
    label: 'Guide',
    specifier: './guide-content.js',
    loadStart: 'function loadGuideContent(): Promise<GuideContentModule> {',
    loadEnd: '\nfunction loadReleaseContent()',
    promise: 'guideContentPromise',
    requestStart: 'function requestGuideContent(',
    requestEnd: '\nfunction requestReleaseContent(',
    cachedModule: 'guideContentModule',
    loadCall: 'loadGuideContent',
    successCall: 'render(module, catalogue);',
  }),
  Object.freeze({
    label: 'Release',
    specifier: './release-content.js',
    loadStart: 'function loadReleaseContent(): Promise<ReleaseContentModule> {',
    loadEnd: '\nfunction guideBodyEl()',
    promise: 'releaseContentPromise',
    requestStart: 'function requestReleaseContent(',
    requestEnd: '\nfunction guideTopicRow(',
    cachedModule: 'releaseContentModule',
    loadCall: 'loadReleaseContent',
    successCall: 'render(module);',
  }),
]);

function archiveLifecycleErrors(source: string, contract: ArchiveContract): readonly string[] {
  const load = section(source, contract.loadStart, contract.loadEnd);
  const request = section(source, contract.requestStart, contract.requestEnd);
  const cachedStart = request.indexOf(`if (${contract.cachedModule} !== null) {`);
  const publishStart = request.indexOf('const publish =');
  const coldStart = request.indexOf(`void ${contract.loadCall}().then(publish, () => {`);
  const success = publishStart >= 0 && cachedStart > publishStart
    ? request.slice(publishStart, cachedStart) : '';
  const failure = coldStart >= 0 ? request.slice(coldStart) : '';
  const errors: string[] = [];

  if (!load.includes(`${contract.promise} ??= import('${contract.specifier}').then((module) => {`)) {
    errors.push(`${contract.label} is not loaded through its lazy single-flight promise`);
  }
  if (!load.includes(`${contract.promise} = null;`)) {
    errors.push(`${contract.label} rejected import does not clear its promise for retry`);
  }
  if (!load.includes('throw error;')) {
    errors.push(`${contract.label} rejected import does not propagate failure`);
  }
  if (!request.includes('const request = ++guideViewRequest;')) {
    errors.push(`${contract.label} request does not mint a publication generation`);
  }
  for (const [needle, label] of [
    ['request !== guideViewRequest', 'success request-generation fence'],
    ['guideBodyEl() !== body', 'success exact-body fence'],
    ["openPanelId() !== 'guide'", 'success visible-panel fence'],
    [contract.successCall, 'success publication'],
  ] as const) if (!success.includes(needle)) errors.push(`${contract.label} missing ${label}`);

  if (!request.includes(`if (${contract.cachedModule} !== null) {`)
    || !request.includes('queueMicrotask(() => publish(module));')) {
    errors.push(`${contract.label} cached publication is not deferred until panel visibility`);
  }
  if (coldStart < 0) errors.push(`${contract.label} cold success/failure publication is not joined`);
  for (const [needle, label] of [
    ['request === guideViewRequest', 'failure request-generation fence'],
    ['guideBodyEl() === body', 'failure exact-body fence'],
    ["openPanelId() === 'guide'", 'failure visible-panel fence'],
    ['guideLoadFailure(body);', 'failure publication'],
  ] as const) if (!failure.includes(needle)) errors.push(`${contract.label} missing ${label}`);

  return errors;
}

function guideFailurePresentationErrors(source: string): readonly string[] {
  const failure = section(
    source,
    'function guideLoadFailure(body: HTMLElement): void {',
    '\nfunction requestGuideContent(',
  );
  const errors: string[] = [];
  if (!failure.includes('role="alert"')) errors.push('Guide load failure is not announced');
  if (!failure.includes('Close Guide and try again')) errors.push('Guide load failure does not explain retry');
  return errors;
}

describe('browser resource lifecycle wiring', () => {
  it('keeps authored Guide/release archives outside the eager boot graph', () => {
    expect(eagerAuthoredArchiveImports(main)).toEqual([]);
    expect(main).toContain("guideContentPromise ??= import('./guide-content.js')");
    expect(main).toContain("releaseContentPromise ??= import('./release-content.js')");
    expect(main).toContain("from './release-identity.js';");
    expect(main).toContain('if (V2_CURRENT_RELEASE_VERSION === null) return false;');
    expect(main).toContain('Opening the expedition archive…');

    /* Independent negative controls: either authored archive entering the
       runtime import graph must make the detector red. */
    for (const [specifier, needle, replacement] of [
      [
        './guide-content.js',
        'import type {\n  GuideCategoryId, GuideCategoryView, GuideTopicId, GuideTopicView,',
        'import {\n  GuideCategoryId, GuideCategoryView, GuideTopicId, GuideTopicView,',
      ],
      [
        './release-content.js',
        "import type { ReleaseNoteView, V2ShippedRelease } from './release-content.js';",
        "import { ReleaseNoteView, V2ShippedRelease } from './release-content.js';",
      ],
    ] as const) {
      expect(main.split(needle)).toHaveLength(2);
      expect(eagerAuthoredArchiveImports(main.replace(needle, replacement))).toContain(specifier);
    }
  });

  it('fences Guide and Release success/failure publication and preserves retry independently', () => {
    expect(guideFailurePresentationErrors(main)).toEqual([]);
    expect(guideFailurePresentationErrors(replaceInSectionExact(
      main,
      'function guideLoadFailure(body: HTMLElement): void {',
      '\nfunction requestGuideContent(',
      'role="alert"',
      '',
    )))
      .toContain('Guide load failure is not announced');
    expect(guideFailurePresentationErrors(replaceInSectionExact(
      main,
      'function guideLoadFailure(body: HTMLElement): void {',
      '\nfunction requestGuideContent(',
      'Close Guide and try again',
      'Try later',
    )))
      .toContain('Guide load failure does not explain retry');

    for (const contract of ARCHIVE_CONTRACTS) {
      expect(archiveLifecycleErrors(main, contract), contract.label).toEqual([]);

      for (const [start, end, needle, replacement, expected] of [
        [
          contract.loadStart,
          contract.loadEnd,
          `${contract.promise} = null;`,
          '/* negative control retained the rejected promise */',
          `${contract.label} rejected import does not clear its promise for retry`,
        ],
        [
          contract.loadStart,
          contract.loadEnd,
          'throw error;',
          '/* negative control swallowed the import failure */',
          `${contract.label} rejected import does not propagate failure`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'const request = ++guideViewRequest;',
          'const request = guideViewRequest;',
          `${contract.label} request does not mint a publication generation`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'request !== guideViewRequest',
          'false',
          `${contract.label} missing success request-generation fence`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'guideBodyEl() !== body',
          'false',
          `${contract.label} missing success exact-body fence`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          "openPanelId() !== 'guide'",
          'false',
          `${contract.label} missing success visible-panel fence`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          contract.successCall,
          '/* negative control removed success publication */',
          `${contract.label} missing success publication`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'queueMicrotask(() => publish(module));',
          'publish(module);',
          `${contract.label} cached publication is not deferred until panel visibility`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          `void ${contract.loadCall}().then(publish, () => {`,
          `void ${contract.loadCall}().then(() => {}, () => {`,
          `${contract.label} cold success/failure publication is not joined`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'request === guideViewRequest',
          'true',
          `${contract.label} missing failure request-generation fence`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'guideBodyEl() === body',
          'true',
          `${contract.label} missing failure exact-body fence`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          "openPanelId() === 'guide'",
          'true',
          `${contract.label} missing failure visible-panel fence`,
        ],
        [
          contract.requestStart,
          contract.requestEnd,
          'guideLoadFailure(body);',
          '/* negative control removed failure publication */',
          `${contract.label} missing failure publication`,
        ],
      ] as const) {
        const mutated = replaceInSectionExact(main, start, end, needle, replacement);
        expect(archiveLifecycleErrors(mutated, contract), `${contract.label}: ${needle}`)
          .toContain(expected);
      }
    }
  });

  it('destroys a Survey presentation once its proven route is no longer current', () => {
    expect(surveyDiscardErrors(main)).toEqual([]);

    /* Every owner in the destructive boundary has its own removal control. */
    for (const [needle, label] of SURVEY_DISCARD_REQUIREMENTS) {
      const mutated = replaceInSectionExact(
        main,
        'function discardSurveyPresentation(reason: string): void {',
        '\nfunction closeVisibleSurveyAndAscend(',
        needle,
        `/* negative control removed ${label} */`,
      );
      expect(surveyDiscardErrors(mutated), label).toContain(`missing ${label}`);
    }

    /* Each route-invalidating caller is independently required; a helper
       that is correct but never called at one exit is still a lifecycle bug. */
    for (const [start, end, call, expected] of [
      [
        'function rerender(options: { preserveSurvey?: boolean; skipPersist?: boolean } = {}): void {',
        '\n/* descents EASE in:',
        "discardSurveyPresentation('survey-navigation-invalidated');",
        'navigation does not prove, hide, then discard stale Survey ownership',
      ],
      [
        "surveyDockEl.addEventListener('click', () => {",
        "\nchartsDockEl.addEventListener('click', () => {",
        "discardSurveyPresentation('survey-route-stale');",
        'stale Survey dock route does not hide then discard before return',
      ],
      [
        'function suppressEcologyProjection(',
        '\nfunction refreshCommittedEcologyProjection()',
        "discardSurveyPresentation('ecology-projection-suppressed');",
        'suppressed ecology projection does not invalidate, hide, then discard Survey',
      ],
      [
        'function refreshCommittedEcologyProjection()',
        '\nfunction publishCommittedEcologyEpoch(',
        "discardSurveyPresentation('ecology-survey-rebuild-refused');",
        'refused ecology Survey rebuild does not invalidate, hide, then discard',
      ],
      [
        'function refreshCommittedEcologyProjection()',
        '\nfunction publishCommittedEcologyEpoch(',
        "discardSurveyPresentation('ecology-generic-survey-invalidated');",
        'generic ecology Survey invalidation does not invalidate, hide, then discard',
      ],
    ] as const) {
      const mutated = replaceInSectionExact(
        main, start, end, call, '/* negative control removed Survey discard call */',
      );
      expect(surveyDiscardErrors(mutated), call).toContain(expected);
    }
  });

  it('bounds cache-only species art after the last Compendium or Planetside owner', () => {
    expect(main).toContain(
      'const QUIESCENT_SPECIES_ART_CACHE = Object.freeze({ retainRecentThumbEntries: 17 });',
    );
    const closeCodex = section(main, 'function closeCodexSurface(): void {', '\nfunction activeCodexSource()');
    const images = closeCodex.indexOf("document.querySelectorAll<HTMLImageElement>('#codexpanel img')");
    const release = closeCodex.indexOf(
      'speciesArtLoader.releaseUnownedCachedArt(QUIESCENT_SPECIES_ART_CACHE);',
      images,
    );
    expect(images).toBeGreaterThanOrEqual(0);
    expect(release).toBeGreaterThan(images);

    const clearPlanetside = section(main, 'function clearPlanetside(): void {', '\nfunction showPlanetsideRosterFailure(');
    const leases = clearPlanetside.indexOf('releasePlanetsideThumbs();');
    const cache = clearPlanetside.indexOf(
      'speciesArtLoader.releaseUnownedCachedArt(QUIESCENT_SPECIES_ART_CACHE);',
      leases,
    );
    expect(leases).toBeGreaterThanOrEqual(0);
    expect(cache).toBeGreaterThan(leases);
  });
});
