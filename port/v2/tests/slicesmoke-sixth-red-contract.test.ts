import { assessF4ActionCommitSequence } from '../tools/slicesmoke-contract.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { getGuideCatalogue, getGuideTopic } from '../apps/game/src/guide-content.js';
import { getReleaseHistory, V2_DRAFT_RELEASE } from '../apps/game/src/release-content.js';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { assessArc4EpochSnapshot } from '../tools/arc4-browser-contract.mjs';
// @ts-expect-error The executable JavaScript evidence helper intentionally has no complete declaration shim.
import { assessCharterLandSettlementTopology, assessLazyOwnerOriginGate, assessLazyProductProducerSettlement, assessSingleF4ActionCommit, buildLazyRefillObservationExpression, captureInlineStyleProperties, classifyForegroundServiceTurn, exactTrustedCharterLandReceipt, INLINE_STYLE_PROPERTY_CARRIER_RUNTIME_SOURCE, inspectInlineStyleProperties, restoreInlineStyleProperties } from '../tools/slicesmoke-contract.mjs';
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
const sliceContractSource = readFileSync(
  new URL('../tools/slicesmoke-contract.mjs', import.meta.url),
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
const indexSource = readFileSync(
  new URL('../apps/game/index.html', import.meta.url),
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
  )(hasUnnegatedSentenceClaim, 81) as T;
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
    expect(expected.filter((topic) => topic.availability === 'partial')).toHaveLength(35);
    expect(expected.filter((topic) => topic.availability === 'unavailable')).toHaveLength(6);
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
    expect(replacementAnchors).toHaveLength(44);
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
    for (const claim of ['A miss earns Scout XP.', 'A repeat species grants Scout XP.',
      'A capture with no standing Scout awards Scout XP.']) {
      starter.textContent = `${prior} ${claim}`;
      expect(releaseDom.window.eval(releaseCheck), claim).toMatchObject({
        complete: false, honest: false, liveProgressionContradiction: true,
      });
    }
    starter.textContent = prior;
    expect(releaseDom.window.eval(releaseCheck)).toMatchObject({
      complete: true,
      honest: true,
      liveProgressionContradiction: false,
    });
    releaseDom.window.close();
  });

  it('executes Guide split-markup, contradiction, polarity, and exact-restoration controls', () => {
    interface RenderedMutation {
      readonly count: number;
      readonly changed: boolean;
      readonly start: number | null;
    }
    const replaceExactRenderedGuideText = executableDeclaration<(
      root: Element | null,
      anchor: string,
      replacement: string,
    ) => RenderedMutation>(
      'replaceExactRenderedGuideText',
      '  const compendiumGuideSpecs = ',
    );
    const compendiumSpecs = executableDeclaration<readonly GuideSpec[]>(
      'compendiumGuideSpecs',
      '  const renderedCompendiumGuideCheck = ',
    );
    const compendiumCheck = executableDeclaration<(spec: GuideSpec) => string>(
      'renderedCompendiumGuideCheck',
      '  const renderCompendiumGuideTopic = ',
    );
    const audioSpecs = executableDeclaration<readonly (GuideSpec & { readonly missingAnchor: string })[]>(
      'audioGuideSpecs',
      '  const renderedAudioGuideCheck = ',
    );
    const audioCheck = executableDeclaration<(spec: GuideSpec) => string>(
      'renderedAudioGuideCheck',
      '  const renderAudioGuideTopic = ',
    );
    const charterCheck = executableDeclaration<(title: string) => string>(
      'renderedCharterGuideCheck',
      '  const renderCharterGuideTopic = ',
    );
    const catalogue = getGuideCatalogue();
    const topics = new Map<string, (typeof catalogue)[number]['topics'][number]>(
      catalogue.flatMap((category) =>
        category.topics.map((topic) => [topic.id, topic] as const)),
    );
    const createGuideDom = (id: string): { dom: TestDom; article: HTMLElement } => {
      const topic = topics.get(id);
      expect(topic, `missing current Guide topic: ${id}`).toBeDefined();
      if (!topic) throw new Error(`missing current Guide topic: ${id}`);
      const dom = new JSDOM(
        `<div id="guidepanel"><article class="guide-topic">`
          + `<h4 data-guide-heading>${escapeHtml(topic.title)}</h4>`
          + `<span data-guide-status="${topic.availability}"></span>${topic.body}</article></div>`,
        { runScripts: 'outside-only' },
      );
      const article = dom.window.document.querySelector<HTMLElement>('#guidepanel .guide-topic');
      expect(article, id).not.toBeNull();
      if (!article) throw new Error(`missing rendered Guide article: ${id}`);
      return { dom, article };
    };
    const oneTextNodeContains = (article: Element, anchor: string): boolean => {
      const walker = article.ownerDocument.createTreeWalker(article, 4);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if ((node.nodeValue ?? '').includes(anchor)) return true;
      }
      return false;
    };

    const breedingSpec = compendiumSpecs.find((spec) => spec.id === 'breeding');
    expect(breedingSpec).toBeDefined();
    if (!breedingSpec) throw new Error('missing Breeding Guide spec');
    const breedingAnchor = 'successful outcome also banks the Chapter 3 Breed a hybrid bloodline goal inside that same offspring save';
    {
      const { dom, article } = createGuideDom('breeding');
      try {
        const beforeHtml = article.innerHTML;
        expect(article.textContent).toContain(breedingAnchor);
        expect(oneTextNodeContains(article, breedingAnchor)).toBe(false);
        expect(replaceExactRenderedGuideText(
          article,
          breedingAnchor,
          'Charter co-delivery omitted',
        )).toEqual({ count: 1, changed: true, start: expect.any(Number) });
        expect(dom.window.eval(compendiumCheck(breedingSpec))).toMatchObject({
          ok: false,
          missing: [breedingAnchor],
          contradictory: false,
        });
        article.innerHTML = beforeHtml;
        expect(article.innerHTML).toBe(beforeHtml);
        expect(dom.window.eval(compendiumCheck(breedingSpec))).toMatchObject({
          ok: true,
          missing: [],
          contradictory: false,
        });

        const zeroBefore = article.innerHTML;
        expect(replaceExactRenderedGuideText(
          article,
          'absent rendered Guide target',
          'must not publish',
        )).toEqual({ count: 0, changed: false, start: null });
        expect(article.innerHTML).toBe(zeroBefore);

        const duplicate = article.ownerDocument.createElement('p');
        duplicate.textContent = breedingAnchor;
        article.appendChild(duplicate);
        const duplicateBefore = article.innerHTML;
        expect(replaceExactRenderedGuideText(
          article,
          breedingAnchor,
          'must not publish',
        )).toEqual({ count: 2, changed: false, start: expect.any(Number) });
        expect(article.innerHTML).toBe(duplicateBefore);
        duplicate.remove();
        expect(article.innerHTML).toBe(beforeHtml);
      } finally {
        dom.window.close();
      }
    }

    const audioContradictions = [
      'Compendium filtering auto-plays the selected creature call.',
      'Listen to biosphere reveals a hidden species and spends 1 Yield.',
      'The biosphere signal grants a discovery reward and changes the save.',
      'Creature voices Off silences the generic biosphere ambience.',
      'Sound Off still permits the owned creature call.',
      'Combat sound remains future work.',
    ];
    for (const spec of audioSpecs) {
      const { dom, article } = createGuideDom(spec.id);
      try {
        const beforeHtml = article.innerHTML;
        expect(replaceExactRenderedGuideText(
          article,
          spec.missingAnchor,
          'audio ownership boundary omitted',
        )).toEqual({ count: 1, changed: true, start: expect.any(Number) });
        expect(dom.window.eval(audioCheck(spec))).toMatchObject({
          ok: false,
          missing: [spec.missingAnchor],
          contradictory: false,
        });
        article.innerHTML = beforeHtml;
        expect(article.innerHTML).toBe(beforeHtml);

        const footer = article.ownerDocument.createElement('div');
        footer.textContent = 'Passive evolution';
        article.appendChild(footer);
        const footerHtml = article.innerHTML;
        for (const copy of audioContradictions) {
          const marker = article.ownerDocument.createElement('p');
          marker.textContent = copy;
          article.appendChild(marker);
          if (copy.startsWith('Combat sound')) {
            expect(article.textContent).toContain(`Passive evolution${copy}`);
          }
          expect(dom.window.eval(audioCheck(spec)), `${spec.id}: ${copy}`).toMatchObject({
            ok: false,
            missing: [],
            contradictory: true,
          });
          marker.remove();
          expect(article.innerHTML).toBe(footerHtml);
        }
        footer.remove();
        expect(article.innerHTML).toBe(beforeHtml);
        expect(dom.window.eval(audioCheck(spec))).toMatchObject({
          ok: true,
          missing: [],
          contradictory: false,
        });
      } finally {
        dom.window.close();
      }
    }

    const charterBreedAnchor = 'One successful Breed banks Breed a hybrid bloodline in the same offspring save';
    {
      const { dom, article } = createGuideDom('ascent');
      try {
        const beforeHtml = article.innerHTML;
        expect(article.textContent).toContain(charterBreedAnchor);
        expect(oneTextNodeContains(article, charterBreedAnchor)).toBe(false);
        expect(replaceExactRenderedGuideText(
          article,
          charterBreedAnchor,
          'Breed Charter co-delivery omitted',
        )).toEqual({ count: 1, changed: true, start: expect.any(Number) });
        expect(dom.window.eval(charterCheck('Chapters'))).toMatchObject({
          ok: false,
          missing: [charterBreedAnchor],
          stale: false,
          contradictory: false,
        });
        article.innerHTML = beforeHtml;
        expect(article.innerHTML).toBe(beforeHtml);

        const positive = article.ownerDocument.createElement('p');
        positive.textContent = 'A stale Breed result grants breeding credit.';
        article.appendChild(positive);
        expect(dom.window.eval(charterCheck('Chapters'))).toMatchObject({
          ok: false,
          missing: [],
          stale: false,
          contradictory: true,
        });
        positive.remove();
        expect(article.innerHTML).toBe(beforeHtml);

        const negated = article.ownerDocument.createElement('p');
        negated.textContent = 'A stale Breed result grants no breeding credit.';
        article.appendChild(negated);
        expect(dom.window.eval(charterCheck('Chapters'))).toMatchObject({
          ok: true,
          missing: [],
          stale: false,
          contradictory: false,
        });
        negated.remove();
        expect(article.innerHTML).toBe(beforeHtml);
        expect(dom.window.eval(charterCheck('Chapters'))).toMatchObject({
          ok: true,
          missing: [],
          stale: false,
          contradictory: false,
        });
      } finally {
        dom.window.close();
      }
    }

    const neverMintAnchor = 'chapter progress alone never mints one';
    const neverMintRequirement = '(?:invents? no|without invented) goals?|chapter progress alone never mints one';
    {
      const { dom, article } = createGuideDom('charters');
      try {
        const beforeHtml = article.innerHTML;
        expect(replaceExactRenderedGuideText(
          article,
          neverMintAnchor,
          'chapter progress alone mints one',
        )).toEqual({ count: 1, changed: true, start: expect.any(Number) });
        expect(dom.window.eval(charterCheck('Expedition Charters'))).toMatchObject({
          ok: false,
          missing: [neverMintRequirement],
          stale: false,
          contradictory: true,
        });
        article.innerHTML = beforeHtml;
        expect(article.innerHTML).toBe(beforeHtml);

        const positive = article.ownerDocument.createElement('p');
        positive.textContent = 'Chapter progress does not merely record milestones; it grants system reach.';
        article.appendChild(positive);
        expect(dom.window.eval(charterCheck('Expedition Charters'))).toMatchObject({
          ok: false,
          missing: [],
          stale: false,
          contradictory: true,
        });
        positive.remove();
        expect(article.innerHTML).toBe(beforeHtml);

        const negated = article.ownerDocument.createElement('p');
        negated.textContent = 'Chapter progress alone never grants system reach.';
        article.appendChild(negated);
        expect(dom.window.eval(charterCheck('Expedition Charters'))).toMatchObject({
          ok: true,
          missing: [],
          stale: false,
          contradictory: false,
        });
        negated.remove();
        expect(article.innerHTML).toBe(beforeHtml);
        expect(dom.window.eval(charterCheck('Expedition Charters'))).toMatchObject({
          ok: true,
          missing: [],
          stale: false,
          contradictory: false,
        });
      } finally {
        dom.window.close();
      }
    }

    const guideControlOwner = section(
      sliceSource,
      '  const replaceExactRenderedGuideText = ',
      '  const renderedTrainingRestoreGuideCheck = ',
    );
    proveEachMarkerRequired(guideControlOwner, [
      ['split-markup helper definition', 'const replaceExactRenderedGuideText = (root, anchor, replacement) =>'],
      ['Breeding split mutation', "replaceExactRenderedGuideText(article,anchor,'Charter co-delivery omitted')"],
      ['audio exact mutation', "replaceExactRenderedGuideText(article,anchor,'audio ownership boundary omitted')"],
      ['Charter Breed split mutation', "replaceExactRenderedGuideText(article,breedAnchor,'Breed Charter co-delivery omitted')"],
      ['never-mint full-clause polarity mutation', "replaceExactRenderedGuideText(article,anchor,'chapter progress alone mints one')"],
      ['truthfully negated polarity control', "marker.textContent='Chapter progress alone never grants system reach.'"],
    ]);
  });

  it('keeps the existing Land lesson and Guide ingress truthful about exact-world descent', () => {
    const landOwner = section(
      sliceSource,
      "  const landCopy = await evalT(`",
      "  /* The final lesson allows only Earth's exact Land button.",
    );
    expect(landOwner.split('  if (')).toHaveLength(2);
    const conditionStart = landOwner.indexOf('  if (') + '  if ('.length;
    const conditionEnd = landOwner.indexOf(') {', conditionStart);
    expect(conditionEnd).toBeGreaterThan(conditionStart);
    const rejects = new Function(
      'landCopy', `return (${landOwner.slice(conditionStart, conditionEnd)});`,
    ) as (copy: string) => boolean;
    const trainingSource = readFileSync(
      new URL('../apps/game/src/training.ts', import.meta.url), 'utf8',
    );
    const lesson = section(
      trainingSource,
      "      id: 'land', spot:",
      "      when: (t, d) => t === 'landfall'",
    );
    expect(lesson.split('      text: () => ')).toHaveLength(2);
    const expression = lesson.slice(lesson.indexOf('      text: () => ')
      + '      text: () => '.length).trim().replace(/,$/u, '');
    const html = new Function(`return (${expression});`)() as string;
    const copy = html.replace(/<[^>]+>/gu, '').replace(/\s+/gu, ' ').trim();
    expect(rejects(copy)).toBe(false);
    for (const needle of [
      'Press Land safely on Earth’s card',
      'Earth and known-world returns are guaranteed',
      'same button and visible approach note show the exact current success chance',
      'possible HP cost, and learned approach',
      'a failed approach waves off safely, cannot defeat you',
      'teaches that exact world for a stronger next attempt',
    ]) {
      expect(copy.split(needle), needle).toHaveLength(2);
      expect(rejects(copy.replace(needle, 'required descent disclosure removed')), needle).toBe(true);
      expect(rejects(copy), needle).toBe(false);
    }
    for (const contradiction of [
      'This slice does not simulate descent odds or wave-offs.',
      'Descent odds are not yet ported.',
      'Wave-offs can defeat you.',
      'Wave-offs share learning across same-seed worlds.',
      'Earth landing can fail.',
      'Known-world returns can fail.',
      'Reinforced Hull reduces descent damage.',
    ]) {
      expect(rejects(`${copy} ${contradiction}`), contradiction).toBe(true);
      expect(rejects(copy), contradiction).toBe(false);
    }

    const guideOwner = section(glassSource,
      "              {id:'landing',required:",
      "              {id:'search',required:",
    ).trim().replace(/,$/u, '');
    const spec = new Function(`return (${guideOwner});`)() as {
      id: string; required: string[]; requiredControls: string[];
      forbidden: string[]; stale: string; contradictions: string[];
    };
    const required = [
      'A first-time descent uses the exact world’s authored type and biome chance, current deterministic weather, equipped landing gear, and exact-world approach learning',
      'The Land control and its visible approach note disclose the final success chance, nonlethal wave-off damage range, and learned approach before commitment',
      'A 100% approach is shown as guaranteed with zero descent damage risk',
      'A wave-off keeps the ship in orbit, leaves the explorer at 1 HP or more',
      'adds +20% exact-world approach knowledge for the next attempt, up to five wave-offs',
      'Earth, Training, and known-world returns are guaranteed and consume no landing draws',
    ];
    expect(spec.requiredControls).toEqual(required);
    expect(spec.required).toEqual([
      'Any galaxy, star, or planet route arriving from Search, the Star Atlas, or a saved location is regenerated from the seeded universe before it is accepted',
      'navigation uses only the source-verified destination',
      'A stale or forged route cannot act',
      ...required,
    ]);
    expect(spec.contradictions).toEqual([
      'The legacy descent-risk and wave-off model is not yet part of this slice.',
      'legacy descent odds and wave-off progression are not yet ported.',
      'Wave-offs can defeat the explorer.',
      'Wave-offs teach every world with the same planet seed.',
      'A 100% approach still risks HP damage.',
      'Earth, Training, and known-world returns can fail.',
      'Reinforced Hull reduces descent damage.',
    ]);
    const checkStart = '            const check=(article,spec)=>';
    const checkEnd = ';\n            let error=null,baselineComplete=false;';
    const checkOwner = section(glassSource, checkStart, checkEnd);
    const checkExpression = checkOwner.slice(checkStart.length).replaceAll('\\\\s', '\\s');
    const check = new Function(`return ((article,spec)=>${checkExpression});`)() as (
      article: { textContent: string }, expected: typeof spec,
    ) => { ok: boolean; missing: string[]; stale: string[] };
    const body = getGuideTopic('landing')!.body.replace(/<[^>]+>/gu, '')
      .replace(/\s+/gu, ' ').trim();
    expect(check({ textContent: body }, spec).ok).toBe(true);
    for (const needle of required) {
      expect(body.split(needle), needle).toHaveLength(2);
      const result = check({ textContent: body.replace(needle, 'required descent disclosure removed') }, spec);
      expect(result.ok, needle).toBe(false);
      expect(result.missing, needle).toEqual([needle]);
      expect(check({ textContent: body }, spec).ok).toBe(true);
    }
    for (const contradiction of [spec.stale, ...spec.contradictions]) {
      const result = check({ textContent: `${body} ${contradiction}` }, spec);
      expect(result.ok, contradiction).toBe(false);
      expect(result.stale.length, contradiction).toBeGreaterThan(0);
      expect(check({ textContent: body }, spec).ok).toBe(true);
    }
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

  it('keeps a fixed 81-row Guide oracle with five independent population controls', () => {
    expect(sliceSource).toContain('const V2_DRAFT_BULLET_COUNT = 81;');
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
    const glassExpectedBulletCount = Number(
      glassSource.match(/expectedBulletCount=(\d+);/)?.[1],
    );
    const glassMissingBulletCount = Number(
      glassSource.match(/inventory\?\.bulletCount===(\d+)/)?.[1],
    );
    expect(glassExpectedBulletCount).toBe(81);
    expect(glassMissingBulletCount).toBe(80);
    expect(glassMissingBulletCount).toBe(glassExpectedBulletCount - 1);
    expect(glassSource).toContain('81-outcome development inventory');
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

    const stageOwnerWait = section(
      sliceSource,
      'const waitForStoredV4StageOwner = async (',
      'try {\n  /* A generic writable snapshot may be the gap between a receipt-bearing',
    );
    proveEachMarkerRequired(stageOwnerWait, [
      ['explicit hold policy',
        "{ timeoutMs = 15000, allowedHolds = [null, 'protected-payload'] } = {}"],
      ['foreground intended owner', "await send('Page.bringToFront', {}, session);"],
      ['observe exact hold',
        "Object.prototype.hasOwnProperty.call(state.persistence,'hold')"],
      ['observe mutation authority',
        "typeof state?.persistence?.mutationBlocked==='boolean'"],
      ['observe convergence state',
        'convergenceReloadScheduled:state?.persistence?.convergenceReloadScheduled??null'],
      ['advance tested stability owner',
        'const stability = advanceStoredV4StageOwnerStability('],
      ['carry only classifier candidate',
        'candidateToken = stability.candidateToken;'],
      ['return only two-observation token',
        "if (stability.status === 'ready') return stability.readyToken;"],
    ]);

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
      ['session-qualified stage helper',
        'const requireStoredV4Stage = async (\n    session, evaluate, raw, label, backup = undefined,'],
      ['stable owner wait',
        'documentToken = await waitForStoredV4StageOwner('],
      ['token-bound stage expression',
        'buildStoredV4StageInvocationExpression(raw, backup, documentToken, allowedHolds)'],
      ['exact stage receipt assessment',
        'const assessment = assessStoredV4StageInvocation(candidate, documentToken, allowedHolds);'],
      ['only unclaimed receipts may rebind',
        "if (continuation.kind === 'rebind') {"],
      ['ambiguous dispatched attempt never retries',
        'That outcome is ambiguous and must never be\n           retried; exact storage readback below remains independent evidence.'],
      ['invoked outcomes never retry',
        "accepted = continuation.kind === 'accept';"],
      ['unconditional primary/backup receipt read',
        'try { observed = await evaluate(READ_STORED_V4_STAGE_EXPRESSION); }'],
      ['fail-fast setup diagnosis',
        'setup did not stage the exact v4 fixture: ${JSON.stringify({'],
      ['rejected-stage lifecycle receipt',
        'accepted, stageError, readError, stageReceipt, stageAssessment,'],
      ['pre-invocation replacement receipts', 'unclaimedReceipts,'],
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
    expect(sliceSource).not.toContain('window.__CF_SLICE__.api.__smokeStageStoredV4');
    expect(sliceContractSource.split('hook=owner.api.__smokeStageStoredV4').length - 1).toBe(1);
    /* Seven shared-helper paths plus the independently held-persist invocation
       are the complete eight-path staging inventory. */
    expect(sliceSource.split('requireStoredV4Stage(').length - 1).toBe(7);
    expect(sliceSource.split('buildStoredV4StageInvocationExpression(').length - 1).toBe(2);
    expect(sliceSource).toContain(
      "sess, evalIn, ONE_BAD_FIELD_V4_RAW, 'ONE BAD FIELD', undefined,\n    { allowedHolds: ['protected-payload'] },",
    );
    expect(sliceSource).toContain(
      "sess, evalIn, OUTER_AUTH_SAVED_ROUTE_RAW, 'SAVED ROUTE AUTHORIZATION', undefined,\n    { allowedHolds: ['protected-payload'] },",
    );
    expect(sliceSource).toContain(
      "sess, evalIn, STALE_SAVED_ROUTE_RAW, 'SAVED ROUTE FIELD REPAIR', undefined,\n    { allowedHolds: [null] },",
    );
    expect(sliceSource).toContain(
      'sess, evalIn, raw, label, undefined, { allowedHolds: [null] },',
    );
    expect(sliceSource).toContain(
      "trp, evalTp, DTRAIN_FULL_FINISH_RAW, 'D-TRAIN FULL FINISH', undefined,\n    { allowedHolds: [null] },",
    );
    expect(sliceSource).toContain(
      "ph, evalPh, raw, 'PROTECTED SAVE', backup,\n      { allowedHolds: [null, 'protected-payload'] },",
    );
    expect(sliceSource).toContain(
      "retrySession, evalRetry,\n        seedRaw === undefined ? null : seedRaw,\n"
        + "        'TRANSIENT READ', undefined, { allowedHolds: [null] },",
    );
    expect(sliceSource).not.toContain("typeof stage==='function'");
    const heldControl = section(
      sliceSource,
      '  const heldStageDrain = await evalIn(`(async()=>{const api=window.__CF_SLICE__.api;',
      '  await requireStoredV4Stage(\n    sess, evalIn, OUTER_AUTH_SAVED_ROUTE_RAW',
    );
    proveEachMarkerRequired(heldControl, [
      ['drain the uncontrolled navigation tail',
        'const committed=await api.__smokeDrainFixturePersist(),state=api.state();'],
      ['require zero pending persistence',
        'if (heldStageDrain.committed !== true || heldStageDrain.pending !== 0)'],
      ['bind stable held-stage document',
        'const heldStageDocumentToken = await waitForStoredV4StageOwner('],
      ['arm deterministic active persist',
        '`window.__CF_SLICE__.api.__smokeArmImportRace(${JSON.stringify(STALE_AUTOSAVE_RAW)})`'],
      ['start exact primary/backup stage while held',
        'buildStoredV4StageInvocationExpression(\n      ONE_BAD_FIELD_V4_RAW, STALE_AUTOSAVE_RAW, heldStageDocumentToken, [null],'],
      ['assess held-stage lifecycle receipt',
        'heldStageAssessment = assessStoredV4StageInvocation(\n        value, heldStageDocumentToken, [null],'],
      ['held-stage accepts only exact terminal receipt',
        "return heldStageAssessment.status === 'accepted';"],
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
    const protectedOwner = section(
      sliceSource,
      '  /* Every remaining fixture in this section belongs to the phone document.',
      '  const waitProtectedNotice = async (expectedTitle, timeoutMs = 3000) => {',
    );
    const protectedOrder = [
      "await send('Target.closeTarget', { targetId: t.targetId });",
      "await send('Target.activateTarget', { targetId: t2.targetId });",
      "await send('Emulation.setFocusEmulationEnabled', { enabled: true }, ph);",
      "await send('Page.bringToFront', {}, ph);",
      "await navigateToSlice(ph, URL0, 'protected-save fixture owner rebind');",
      "return requireStoredV4Stage(\n      ph, evalPh, raw, 'PROTECTED SAVE', backup,",
    ];
    const protectedOrderErrors = (owner: string) => protectedOrder.flatMap((marker, index) => {
      const at = owner.indexOf(marker);
      const prior = index === 0 ? -1 : owner.indexOf(protectedOrder[index - 1]!);
      return at >= 0 && at > prior ? [] : [marker];
    });
    expect(protectedOrderErrors(protectedOwner)).toEqual([]);
    protectedOrder.slice(1).forEach((marker, index) => {
      const prior = protectedOrder[index]!;
      const mutant = protectedOwner
        .replace(prior, '__PROTECTED_STAGE_ORDER_SWAP__')
        .replace(marker, prior)
        .replace('__PROTECTED_STAGE_ORDER_SWAP__', marker);
      expect(protectedOrderErrors(mutant), `${prior} before ${marker}`).not.toEqual([]);
    });
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
      ['actual root canvas owner', 'const S=window.__CF_SLICE__,canvas=S?.app?.canvas,'],
      ['hit-tested native canvas target', 'hit=document.elementFromPoint(x,y)'],
      ['reject obscured canvas points', 'if(hit!==canvas)continue;'],
      ['same-document canvas target', 'canvasPoint.documentToken !== retryBootToken'],
      ['native measured press', "type: 'mousePressed', x: canvasPoint.x, y: canvasPoint.y"],
      ['native measured release', "type: 'mouseReleased', x: canvasPoint.x, y: canvasPoint.y"],
      ['trusted root canvas receipt', 'trusted:event.isTrusted,targetCanvas:event.target===canvas'],
      ['one owned event listener', '{capture:true,once:true,signal:abort.signal}'],
      ['receipt remains through authoritative reload', 'await waitForSlice(retrySession, \'transient-read authoritative reload\', { previousToken: retryBootToken });'],
      ['exact receipt decision', 'if (!transientCanvasActivationPasses(canvasPoint, canvasPress))'],
      ['owned receipt cleanup', 'const canvasCleanup = await evalRetry('],
      ['cleanup failure stops successor', 'if (canvasFailure !== null || canvasCleanup !== true)'],
      ['bounded failure diagnostics', 'point: canvasPoint, observed'],
      ['both retry branches wait for the final revision-two successor',
        'const expectedWrites = 2;'],
      ['existing retry exact two-write topology',
        "count: 2, me: 'Dakk', tut: 1, epoch: 12, viewType: 'planet', codexCount: 3, landCount: 6,"],
      ['existing retry final SessionRNG ordinal', 'ordinal: 1,'],
      ['existing retry progression receipt kind', "kind: 'arc9-progression-refresh-v1',"],
      ['existing retry fixture-owned progression witness',
        'witness: F4_REPLACEMENT_EXPECTATION.progressionWitness,'],
      ['existing retry exact successor achievements',
        'JSON.stringify(payload?.ach) === JSON.stringify(F4_REPLACEMENT_EXPECTATION.successorUnlockedIds)'],
      ['fresh retry remains receipt-free ordinal zero',
        'ordinal: 0, receiptRows: [],'],
      ['green-only mutation controls',
        'if (existingRetryGreen && freshRetryGreen) {'],
      ['pre-catch-up revision-one control',
        'const existingPreCatchupControl = structuredClone(existingRetry);'],
      ['pre-catch-up receipt absence control',
        "revisionRaw: '1', revision: 1, ordinal: 0, receiptKeys: [], receiptRows: [],"],
      ['extra third-write control',
        'const existingExtraWriteControl = structuredClone(existingRetry);'],
      ['missing progression receipt control',
        'const existingMissingReceiptControl = structuredClone(existingRetry);'],
      ['wrong progression witness control',
        'const existingReceiptWitnessControl = structuredClone(existingRetry);'],
      ['transient phase causal stop',
        "failSliceWithoutCascade('TRANSIENT READ phase was red; phone and Training successors were not run'"],
    ]);
    expect(transient).not.toContain('transientRetryProbe(vrRaw)');
    expect(transient).not.toContain('transientPreClickOutcome(value.preClick, vrRaw)');
    expect(transient).not.toContain('seedRaw === undefined ? 2 : 1');
    expect(transient).not.toContain('x: 30, y: 300');
    expect(transient).not.toContain("count: 1, me: 'Dakk'");
    expect(transient).not.toContain('value.authority?.ordinal === 0');
  });

  it('requires a measured root-canvas hit and the matching trusted pointerdown after transient recovery', () => {
    const owner = section(sliceSource,
      '  const transientCanvasActivationPasses = (point, receipt) =>',
      '  const transientRetryProbe = async (seedRaw) => {');
    const assess = Function(`${owner}; return transientCanvasActivationPasses;`)() as
      (point: unknown, receipt: unknown) => boolean;
    const point = { ok: true, documentToken: 'protected-first-document', canvasTag: 'CANVAS',
      canvasConnected: true, canvasOwnsPoint: true, x: 640, y: 400, viewportWidth: 1280, viewportHeight: 800 };
    const receipt = { schema: 'cf-v2-transient-canvas-press/v1', documentToken: point.documentToken,
      type: 'pointerdown', trusted: true, targetCanvas: true, button: 0, pointerType: 'mouse', x: 640, y: 400 };
    expect(assess(point, receipt)).toBe(true);
    expect(assess({ ...point, canvasTag: 'BUTTON', canvasOwnsPoint: false }, receipt)).toBe(false);
    expect(assess({ ...point, canvasConnected: false }, receipt)).toBe(false);
    expect(assess({ ...point, x: -1 }, { ...receipt, x: -1 })).toBe(false);
    expect(assess({ ...point, y: point.viewportHeight }, { ...receipt, y: point.viewportHeight })).toBe(false);
    expect(assess(point, null)).toBe(false);
    expect(assess(point, { ...receipt, targetCanvas: false })).toBe(false);
    expect(assess(point, { ...receipt, trusted: false })).toBe(false);
    expect(assess(point, { ...receipt, documentToken: 'a-different-document' })).toBe(false);
    expect(assess(point, { ...receipt, type: 'click' })).toBe(false);
    expect(assess(point, { ...receipt, button: 2 })).toBe(false);
    expect(assess(point, { ...receipt, x: point.x + 1 })).toBe(false);
    expect(assess(point, receipt)).toBe(true);
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
    const publicationAssessment = section(
      arc4ContractSource,
      'export const assessArc4PublicationConvergence = ({',
      '\nconst progressForFixture = (evidence) => {',
    );
    proveEachMarkerRequired(publicationAssessment, [
      ['Capture action authority projection',
        'const actionBoundary = captureActionAuthorityProjection(before);'],
      ['Capture action revision',
        'const actionRevision = actionBoundary?.revision ?? null;'],
      ['R+1 convergence authority',
        'raw: actionBoundary, documentToken: priorToken,'],
      ['R+1 publication detail',
        'committed at revision ${actionRevision}; publication slice-smoke injected Arc 4 publication rejection'],
      ['R+2 progression outcome',
        'committedOutcome: exactRawCaptureOutcome(before, committed, expected, {\n      requireProgressionTail: true,\n    }),'],
      ['R+1 publication fault', 'fault?.injectedRevision === actionRevision'],
      ['R+2 progression reload',
        'committed, reloaded, reloadedState, reloadedUi, priorToken, token,\n      requireProgressionTail: true,'],
    ]);
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

  it('binds post-durable Training reload to its exact progression successor', () => {
    const expectation = section(
      sliceSource,
      'const DTRAIN_POST_RELOAD_PROGRESSION_EXPECTATION = (() => {',
      'const ENGINEERING_VETERAN_RAW = (() => {',
    );
    proveEachMarkerRequired(expectation, [
      ['R+2 revision', 'revision: 3,'],
      ['fresh-document commit count', 'freshDocumentCommits: 1,'],
      ['progression outcome', "lastOutcome: 'arc9-progression-committed:3',"],
      ['aggregate unlock authority', 'unlockedIds: F4_REPLACEMENT_EXPECTATION.successorUnlockedIds,'],
      ['progression receipt kind', "kind: 'arc9-progression-refresh-v1',"],
      ['progression receipt witness',
        "witness: 'arc9p1:951639d0daa5c423e6bfcb886c21c4ede752ad10e3b9de02699acc4eb3770929',"],
    ]);
    const rawAssessment = section(
      sliceSource,
      '  const dtrainRestoredRawAssessment = (raw, {',
      '  const dtrainRestoredRawOutcome = (raw, options)',
    );
    proveEachMarkerRequired(rawAssessment, [
      ['default checkpoint achievements',
        'expectedAchievements = GENUINE_TRAINING_CHECKPOINT.ac,'],
      ['selected achievement authority',
        'canonicalJson(raw?.ach) === canonicalJson(expectedAchievements)'],
    ]);
    const carrierAssessment = section(
      sliceSource,
      '  const assessDtrainArc2Restore = ({',
      '  const assessDtrainArc2Deferred = ({',
    );
    proveEachMarkerRequired(carrierAssessment, [
      ['optional progression tail', 'progressionTail = null,'],
      ['one successor RNG ordinal', 'beforeSessionRng?.ordinal + 1'],
      ['exact successor receipt key',
        "after.receiptKeys.at(-1) === `receipt:${progressionTail.receipt.ordinal}`"],
      ['exact successor receipt raw bytes',
        'after.receiptRawRows.at(-1) === JSON.stringify(progressionTail.receipt)'],
      ['live aggregate publication',
        'canonicalJson(state?.save?.unlocked) === canonicalJson(progressionTail.unlockedIds)'],
    ]);
    const publication = section(
      sliceSource,
      '  /* A failure after the one durable write is committed-state convergence,',
      '  /* The restored checkpoint Earth row must be bound to the final-import entry,',
    );
    proveEachMarkerRequired(publication, [
      ['raw R+1 control', 'const captureOnlyRaw = structuredClone(publishRaw);'],
      ['carrier R+1 control', 'const captureOnlyEvidence = structuredClone(publishLootEvidence);'],
      ['wrong achievement control', 'wrongAchievementTail: assessPublishControl('],
      ['exact tail selected',
        'progressionTail: DTRAIN_POST_RELOAD_PROGRESSION_EXPECTATION,\n  });\n  if (!publishNativeArmed'],
    ]);
  });

  it('isolates lazy-art persistence owners while retaining one exact held release', () => {
    const serverOwner = section(
      sliceSource,
      'let slowSpeciesOpen = false;',
      'const server6 = http.createServer(serveDist);',
    );
    const runner = section(
      sliceSource,
      '  /* 4c-lazy-focus. Hold the actual Vite species-art chunk',
      '  /* 4d. THE PHONE LEG (emulated):',
    );
    proveEachMarkerRequired(`${serverOwner}\n${runner}`, [
      ['shared role-tagged handler', 'const slowSpeciesHandler = (owner) => (req, res) => {'],
      ['append-only request-attempt ledger', 'slowSpeciesAttempts.push(Object.freeze({'],
      ['monotonic request ordinal', 'ordinal: slowSpeciesAttempts.length + 1,'],
      ['release-phase evidence', "phase: slowSpeciesOpen ? 'post-release' : 'held',"],
      ['exact request method', "method: String(req.method || ''),"],
      ['exact request path', "pathname: (req.url || '').split('?')[0],"],
      ['fetch-metadata request role',
        "destination: String(req.headers['sec-fetch-dest'] || '').toLowerCase(),"],
      ['shared held-response queue', 'slowSpeciesRequests.push({ req, res, owner });'],
      ['live origin server', "const server5 = http.createServer(slowSpeciesHandler('live'));"],
      ['closed origin server', "const server5Closed = http.createServer(slowSpeciesHandler('closed'));"],
      ['closed origin server listen',
        "await new Promise((r) => server5Closed.listen(0, '127.0.0.1', r));"],
      ['closed origin URL', "const URL5_CLOSED = 'http://127.0.0.1:' + server5Closed.address().port + '/';"],
      ['startup origin inequality', 'new URL(URL5).origin === new URL(URL5_CLOSED).origin'],
      ['one shared release drain',
        'for (const request of slowSpeciesRequests.splice(0)) serveDist(request.req, request.res);'],
      ['one factored veteran seed owner',
        'const seedLazyVeteran = async (sessionId, originUrl, label) => {'],
      ['exact seed origin readiness',
        "location.origin===${JSON.stringify(expectedOrigin)}&&location.pathname==='/seed.html'"],
      ['exact seed database version', "q=indexedDB.open('cf-v2-slice',1);"],
      ['exact veteran primary seed',
        "tx.objectStore('meta').put(${JSON.stringify(VETERAN_RAW)},'save');"],
      ['live owner independent seed',
        "await seedLazyVeteran(lazy, URL5, 'lazy-art live owner');"],
      ['closed owner seed document',
        "const tLazyClosed = await send('Target.createTarget', { url: URL5_CLOSED + 'seed.html' });"],
      ['closed owner independent seed',
        "await seedLazyVeteran(lazyClosed, URL5_CLOSED, 'lazy-art closed owner');"],
      ['closed owner isolated navigation',
        "lazyClosed, URL5_CLOSED, 'slow species-art closed-owner boot',"],
      ['pure current-origin/request gate',
        'const assessCurrentLazyOwnerOriginGate = (stage) => assessLazyOwnerOriginGate({'],
      ['exact candidate path binding', 'expectedPath: candidateSpeciesPainterPath,'],
      ['exact append-only role inventory',
        'slowRequestAttempts = [...slowSpeciesAttempts];'],
      ['immediate irreversible request stop', "lazyOwnerOriginGate.status === 'error'"],
      ['immediate irreversible request diagnostic',
        "throw new Error('slow Compendium isolated-origin request role became terminal before release: '"],
      ['gate before release fail-stop',
        "throw new Error('slow Compendium isolated-origin request gate failed before release: '"],
      ['synchronous release revalidation',
        "const lazyReleaseOriginGate = assessCurrentLazyOwnerOriginGate('pre-release');"],
      ['release-revalidation fail-stop',
        "throw new Error('slow Compendium request inventory changed before release: '"],
      ['single operational release', '  releaseSlowSpecies();'],
      ['live-loop duplicate-role fail-fast',
        "throw new Error('slow Compendium request role became terminal during live settlement: '"],
      ['closed-loop duplicate-role fail-fast',
        "throw new Error('slow Compendium request role became terminal during closed-owner settlement: '"],
      ['pre-control role recheck',
        'const lazyPostSettlementOriginGate = assessCurrentLazyOwnerOriginGate(\'settled\');'],
      ['post-settlement final inventory',
        "const lazyFinalOriginGate = assessCurrentLazyOwnerOriginGate('settled');"],
      ['post-settlement final fail-stop',
        "throw new Error('slow Compendium final request inventory drifted after settlement: '"],
      ['live single-producer authority',
        'lazyAfter.lazyArt, lazyDocumentToken,\n  );'],
      ['closed single-producer authority',
        'lazyClosedAfter.lazyArt, lazyClosedDocumentToken,\n  );'],
      ['single-producer authority fail-stop',
        'COMPENDIUM LAZY PRODUCER AUTHORITY: an isolated owner did not retain exactly one'],
    ]);
    const startupCleanup = section(
      sliceSource,
      '} catch (error) {\n  server.close(); server2.close();',
      'const send = browser.send;',
    );
    const finalCleanup = section(
      sliceSource,
      '} finally {\n  releaseSlowSpecies();',
      '\n}\n\nif (fails.length) {',
    );
    expect(startupCleanup).toContain('server5.close(); server5Closed.close(); server6.close();');
    expect(finalCleanup).toContain('server5.close(); server5Closed.close(); server6.close();');
    const gateAt = runner.indexOf("if (lazyReleaseOriginGate.status !== 'ready')");
    const releaseAt = runner.indexOf('  releaseSlowSpecies();');
    const finalGateAt = runner.indexOf("const lazyFinalOriginGate = assessCurrentLazyOwnerOriginGate('settled');");
    expect(gateAt).toBeGreaterThanOrEqual(0);
    expect(releaseAt).toBeGreaterThan(gateAt);
    expect(finalGateAt).toBeGreaterThan(releaseAt);

    const expectedPath = '/assets/species-art.worker-exact.js';
    const attempt = (
      ordinal: number,
      owner: 'closed' | 'live',
      destination: 'worker' | 'empty',
      phase: 'held' | 'post-release' = 'held',
    ) => ({ ordinal, owner, phase, method: 'GET', pathname: expectedPath, destination });
    const ready = { status: 'ready', ok: true, reasons: [] };
    const topology = {
      liveOrigin: 'http://127.0.0.1:41001',
      closedOrigin: 'http://127.0.0.1:41002',
      expectedPath,
      stage: 'pre-release',
      requestAttempts: [
        attempt(1, 'closed', 'worker'),
        attempt(2, 'live', 'worker'),
      ],
    };
    expect(assessLazyOwnerOriginGate(topology)).toEqual(ready);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [attempt(1, 'closed', 'empty'), attempt(2, 'live', 'empty')],
    })).toEqual(ready);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [attempt(1, 'closed', 'worker'), attempt(2, 'live', 'empty')],
    })).toEqual(ready);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [
        attempt(1, 'closed', 'empty'), attempt(2, 'live', 'worker'),
        attempt(3, 'closed', 'worker'), attempt(4, 'live', 'empty'),
      ],
    })).toEqual(ready);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      stage: 'settled',
      requestAttempts: [
        attempt(1, 'closed', 'empty'), attempt(2, 'live', 'worker'),
        attempt(3, 'closed', 'worker', 'post-release'),
        attempt(4, 'live', 'empty', 'post-release'),
      ],
    })).toEqual(ready);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      stage: 'settled',
      requestAttempts: [attempt(1, 'closed', 'empty'), attempt(2, 'live', 'empty')],
    })).toEqual(ready);
    expect(assessLazyOwnerOriginGate({ ...topology, closedOrigin: topology.liveOrigin }).reasons)
      .toEqual(['distinct owner origins']);
    expect(assessLazyOwnerOriginGate({ ...topology, requestAttempts: null }).reasons)
      .toEqual(['sealed-worker request-attempt ledger']);
    expect(assessLazyOwnerOriginGate({
      ...topology, requestAttempts: [attempt(1, 'live', 'worker')],
    })).toEqual({
      status: 'pending', ok: false, reasons: ['closed sealed-worker request pending'],
    });
    expect(assessLazyOwnerOriginGate({
      ...topology, stage: 'settled', requestAttempts: [attempt(1, 'live', 'worker')],
    }).reasons).toEqual(['closed sealed-worker request missing']);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [...topology.requestAttempts, attempt(3, 'live', 'worker')],
    }).reasons).toEqual(['one request per sealed-worker role and owner']);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [
        attempt(1, 'closed', 'worker'),
        { ...attempt(2, 'live', 'worker'), destination: 'script' },
      ],
    }).reasons).toEqual(['recognized sealed-worker request roles']);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [
        ...topology.requestAttempts, attempt(3, 'closed', 'empty'), attempt(4, 'closed', 'empty'),
      ],
    }).reasons).toEqual(['one request per sealed-worker role and owner']);
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [
        attempt(1, 'closed', 'worker'),
        { ...attempt(2, 'live', 'worker'), owner: 'unknown' },
      ],
    }).reasons).toContain('recognized sealed-worker request roles');
    for (const mutant of [
      { ...attempt(1, 'closed', 'worker'), ordinal: 2 },
      { ...attempt(1, 'closed', 'worker'), method: 'POST' },
      { ...attempt(1, 'closed', 'worker'), pathname: '/assets/other.js' },
    ]) {
      expect(assessLazyOwnerOriginGate({
        ...topology, requestAttempts: [mutant, attempt(2, 'live', 'worker')],
      }).reasons).toContain('recognized sealed-worker request roles');
    }
    expect(assessLazyOwnerOriginGate({
      ...topology,
      requestAttempts: [attempt(1, 'closed', 'worker', 'post-release'), attempt(2, 'live', 'worker')],
    }).reasons).toContain('pre-release requests remain held');

    const producer = {
      schema: 'cf-v2-species-art-worker-diagnostics/v2',
      state: 'ready',
      importStarts: 1,
      identity: {
        documentToken: 'lazy-document', lastProducerEpoch: 1, lastWorkerInstanceId: 1,
      },
      lastEvent: {
        producerEpoch: 1, workerInstanceId: 1, jobId: 1, kind: 'thumb132', event: 'result',
      },
      lastError: null,
      worker: {
        live: false, starts: 1, ready: 1, disposals: 1, fatals: 0, protocolErrors: 0,
      },
      phases: {
        importStarts: 1, importCompletes: 1,
        thumbJobStarts: 1, thumbRenderCompletes: 1,
        thumbEncodeStarts: 1, thumbEncodeCompletes: 1,
        portraitJobStarts: 0, portraitRenderCompletes: 0,
        portraitEncodeStarts: 0, portraitEncodeCompletes: 0,
      },
      results: {
        count: 1, maxImportDurationMs: 1, maxRenderDurationMs: 1, maxEncodeDurationMs: 1,
      },
      errors: { capability: 0, protocol: 0, import: 0, paint: 0, encode: 0 },
    };
    expect(assessLazyProductProducerSettlement(producer, 'lazy-document'))
      .toEqual({ ok: true, reasons: [] });
    const elevenThumbResults = {
      ...producer,
      lastEvent: { ...producer.lastEvent, jobId: 11 },
      phases: {
        ...producer.phases,
        thumbJobStarts: 11, thumbRenderCompletes: 11,
        thumbEncodeStarts: 11, thumbEncodeCompletes: 11,
      },
      results: { ...producer.results, count: 11 },
    };
    const mixedResults = {
      ...elevenThumbResults,
      lastEvent: { ...producer.lastEvent, jobId: 13, kind: 'portrait440' },
      phases: {
        ...elevenThumbResults.phases,
        portraitJobStarts: 2, portraitRenderCompletes: 2,
        portraitEncodeStarts: 2, portraitEncodeCompletes: 2,
      },
      results: { ...producer.results, count: 13 },
    };
    expect(assessLazyProductProducerSettlement(elevenThumbResults, 'lazy-document'))
      .toEqual({ ok: true, reasons: [] });
    expect(assessLazyProductProducerSettlement(mixedResults, 'lazy-document'))
      .toEqual({ ok: true, reasons: [] });
    const oneKindProducer = (kind: 'thumb' | 'portrait') => ({
      ...producer,
      lastEvent: {
        ...producer.lastEvent,
        kind: kind === 'thumb' ? 'thumb132' : 'portrait440',
      },
      phases: {
        ...producer.phases,
        thumbJobStarts: kind === 'thumb' ? 1 : 0,
        thumbRenderCompletes: kind === 'thumb' ? 1 : 0,
        thumbEncodeStarts: kind === 'thumb' ? 1 : 0,
        thumbEncodeCompletes: kind === 'thumb' ? 1 : 0,
        portraitJobStarts: kind === 'portrait' ? 1 : 0,
        portraitRenderCompletes: kind === 'portrait' ? 1 : 0,
        portraitEncodeStarts: kind === 'portrait' ? 1 : 0,
        portraitEncodeCompletes: kind === 'portrait' ? 1 : 0,
      },
    });
    for (const kind of ['thumb', 'portrait'] as const) {
      const base = oneKindProducer(kind);
      const prefix = kind === 'thumb' ? 'thumb' : 'portrait';
      const tailMutants = [
        {
          ...base,
          lastEvent: { ...base.lastEvent, jobId: 2 },
          phases: { ...base.phases, [`${prefix}JobStarts`]: 2 },
        },
        {
          ...base,
          lastEvent: { ...base.lastEvent, jobId: 2 },
          phases: {
            ...base.phases,
            [`${prefix}JobStarts`]: 2,
            [`${prefix}RenderCompletes`]: 2,
          },
        },
        {
          ...base,
          lastEvent: { ...base.lastEvent, jobId: 2 },
          phases: {
            ...base.phases,
            [`${prefix}JobStarts`]: 2,
            [`${prefix}RenderCompletes`]: 2,
            [`${prefix}EncodeStarts`]: 2,
          },
        },
      ];
      tailMutants.forEach((mutant, index) => {
        expect(assessLazyProductProducerSettlement(mutant, 'lazy-document'), `${kind} phase ${index}`)
          .toEqual({ ok: false, reasons: ['coherent producer phase/results'] });
      });
    }
    expect(assessLazyProductProducerSettlement({
      ...producer, results: { ...producer.results, count: 2 },
    }, 'lazy-document')).toEqual({ ok: false, reasons: ['coherent producer phase/results'] });
    expect(assessLazyProductProducerSettlement({
      ...producer, lastEvent: { ...producer.lastEvent, event: 'encode-complete' },
    }, 'lazy-document')).toEqual({ ok: false, reasons: ['final product result event'] });
    const producerMutants = [
      { field: 'schema', value: { ...producer, schema: 'wrong' } },
      { field: 'state', value: { ...producer, state: 'loading' } },
      { field: 'importStarts', value: { ...producer, importStarts: 2 } },
      { field: 'documentToken', value: {
        ...producer, identity: { ...producer.identity, documentToken: 'replacement-document' },
      } },
      { field: 'producerEpoch', value: {
        ...producer, identity: { ...producer.identity, lastProducerEpoch: 2 },
      } },
      { field: 'workerInstance', value: {
        ...producer, identity: { ...producer.identity, lastWorkerInstanceId: 2 },
      } },
      { field: 'workerStarts', value: {
        ...producer, worker: { ...producer.worker, starts: 2 },
      } },
      { field: 'workerReady', value: {
        ...producer, worker: { ...producer.worker, ready: 2 },
      } },
      { field: 'workerLive', value: {
        ...producer, worker: { ...producer.worker, live: true },
      } },
      { field: 'workerDisposals', value: {
        ...producer, worker: { ...producer.worker, disposals: 0 },
      } },
      { field: 'workerFatal', value: {
        ...producer, worker: { ...producer.worker, fatals: 1 },
      } },
      { field: 'workerProtocol', value: {
        ...producer, worker: { ...producer.worker, protocolErrors: 1 },
      } },
      { field: 'importPhaseStart', value: {
        ...producer, phases: { ...producer.phases, importStarts: 2 },
      } },
      { field: 'importPhaseComplete', value: {
        ...producer, phases: { ...producer.phases, importCompletes: 0 },
      } },
      { field: 'lastEventProducer', value: {
        ...producer, lastEvent: { ...producer.lastEvent, producerEpoch: 2 },
      } },
      { field: 'lastEventMissing', value: { ...producer, lastEvent: null } },
      { field: 'lastEventJob', value: {
        ...producer, lastEvent: { ...producer.lastEvent, jobId: 2 },
      } },
      { field: 'lastEventKind', value: {
        ...producer, lastEvent: { ...producer.lastEvent, kind: 'portrait440' },
      } },
      { field: 'lastError', value: { ...producer, lastError: { stage: 'paint' } } },
      { field: 'resultsMissing', value: { ...producer, results: null } },
      { field: 'zeroWork', value: {
        ...producer,
        lastEvent: null,
        phases: {
          ...producer.phases,
          thumbJobStarts: 0, thumbRenderCompletes: 0,
          thumbEncodeStarts: 0, thumbEncodeCompletes: 0,
        },
        results: { ...producer.results, count: 0 },
      } },
      { field: 'producerError', value: {
        ...producer, errors: { ...producer.errors, paint: 1 },
      } },
    ];
    for (const mutant of producerMutants) {
      expect(assessLazyProductProducerSettlement(mutant.value, 'lazy-document').ok, mutant.field)
        .toBe(false);
    }

    const expected = {
      targetId: 'lazy-live-target', documentToken: 'lazy-live-document',
      serviceToken: 'lazy-live-service',
    };
    const pending = {
      targetId: expected.targetId, documentToken: expected.documentToken,
      visibilityState: 'visible', hidden: false, focused: true,
      service: {
        token: expected.serviceToken, visibilityChanges: 0, focusLosses: 0,
        armVisibilityState: 'visible', armHidden: false, armFocused: true,
        raf: false, rafVisibilityState: null, rafHidden: null, rafFocused: null,
        laterTask: false, laterVisibilityState: null, laterHidden: null, laterFocused: null,
      },
    };
    expect(classifyForegroundServiceTurn(pending, expected)).toEqual({
      status: 'pending',
      reasons: ['rendering opportunity pending', 'later task pending'],
    });
    expect(classifyForegroundServiceTurn({ ...pending, documentToken: null }, expected)).toEqual({
      status: 'error',
      reasons: ['document identity null', 'rendering opportunity pending', 'later task pending'],
    });
    expect(classifyForegroundServiceTurn({
      ...pending,
      service: {
        ...pending.service,
        raf: true, rafVisibilityState: 'visible', rafHidden: false, rafFocused: true,
        laterTask: true, laterVisibilityState: 'visible', laterHidden: false, laterFocused: true,
      },
    }, expected)).toEqual({ status: 'ready', reasons: [] });
  });

  it('binds one dependent action to an exact same-document F4 commit', () => {
    const idleLanding = {
      schema: 'cf-v2-arc0-landing-app-state/v1',
      actionCoordinator: {
        inFlight: false,
        owner: {
          schema: 'cf-v2-product-action-coordinator-diagnostics/v1',
          busy: false,
          operation: null,
        },
        hold: {
          schema: 'cf-v2-product-action-hold-diagnostics/v1',
          phase: 'idle',
          operation: null,
          sequence: 0,
        },
        faultArmed: {
          storageFailure: false,
          staleAuthority: false,
          publicationFailure: false,
        },
        lastFault: null,
      },
    };
    const priorRows = [
      { ordinal: 0, kind: 'seed', witness: 'seed:0' },
      { ordinal: 1, kind: 'arc9-survey-v1', witness: 'survey:1' },
      { ordinal: 2, kind: 'arc9-add-v1', witness: 'add:2' },
    ];
    const beforeAuthority = {
      token: 'single-f4-document',
      raw: {
        revision: 7,
        revisionRaw: '7',
        seed: 1314635406,
        ordinal: 3,
        draws: { terrain: 4 },
        receiptKeys: priorRows.map((row) => `receipt:${row.ordinal}`),
        receiptRows: priorRows,
      },
      state: {
        persistence: {
          lastOutcome: 'arc9-add-committed:7',
          runtime: {
            schema: 'cf-v2-f4-runtime/v1', revision: 7, commits: 5,
            sessionSeed: 1314635406, sessionOrdinal: 3, sessionDraws: { terrain: 4 },
          },
        },
        landing: idleLanding,
      },
    };
    const afterAuthority = {
      token: 'single-f4-document',
      raw: {
        revision: 8,
        revisionRaw: '8',
        seed: 1314635406,
        ordinal: 4,
        draws: { terrain: 4 },
        receiptKeys: [...beforeAuthority.raw.receiptKeys, 'receipt:3'],
        receiptRows: [
          ...priorRows,
          { ordinal: 3, kind: 'arc9-share-send-v1', witness: 'share:3' },
        ],
      },
      state: {
        persistence: {
          lastOutcome: 'arc9-share-committed:8',
          runtime: {
            schema: 'cf-v2-f4-runtime/v1', revision: 8, commits: 6,
            sessionSeed: 1314635406, sessionOrdinal: 4, sessionDraws: { terrain: 4 },
          },
        },
        landing: idleLanding,
      },
    };
    const assess = (after = afterAuthority, state = after.state) =>
      assessSingleF4ActionCommit({
        beforeAuthority,
        afterAuthority: after,
        state,
        expectedKind: 'arc9-share-send-v1',
        expectedPersistenceLastOutcome: 'arc9-share-committed:8',
      });
    expect(assess()).toEqual({ ok: true, reasons: [] });

    const replaced = structuredClone(afterAuthority);
    replaced.token = 'replacement-document';
    expect(assess(replaced).reasons).toContain('same document identity');

    const rawRevision = structuredClone(afterAuthority);
    rawRevision.raw.revision = 9;
    rawRevision.raw.revisionRaw = '9';
    expect(assess(rawRevision).reasons).toContain('exact raw revision successor');

    const runtimeRevision = structuredClone(afterAuthority);
    runtimeRevision.state.persistence.runtime.revision = 7;
    expect(assess(runtimeRevision).reasons).toContain('exact live runtime successor');
    const runtimeCommits = structuredClone(afterAuthority);
    runtimeCommits.state.persistence.runtime.commits = 5;
    expect(assess(runtimeCommits).reasons).toContain('exact live runtime successor');
    const runtimeSchema = structuredClone(afterAuthority);
    runtimeSchema.state.persistence.runtime.schema = 'wrong-runtime';
    expect(assess(runtimeSchema).reasons).toContain('exact live runtime successor');

    const runtimeSeed = structuredClone(afterAuthority);
    runtimeSeed.state.persistence.runtime.sessionSeed += 1;
    expect(assess(runtimeSeed).reasons).toContain('exact live/raw SessionRNG parity');
    const runtimeOrdinal = structuredClone(afterAuthority);
    runtimeOrdinal.state.persistence.runtime.sessionOrdinal += 1;
    expect(assess(runtimeOrdinal).reasons).toContain('exact live/raw SessionRNG parity');
    const runtimeDraws = structuredClone(afterAuthority);
    runtimeDraws.state.persistence.runtime.sessionDraws.terrain += 1;
    expect(assess(runtimeDraws).reasons).toContain('exact live/raw SessionRNG parity');

    const rngOrdinal = structuredClone(afterAuthority);
    rngOrdinal.raw.ordinal = 5;
    expect(assess(rngOrdinal).reasons).toContain('exact SessionRNG successor');
    const rngSeed = structuredClone(afterAuthority);
    rngSeed.raw.seed += 1;
    expect(assess(rngSeed).reasons).toContain('exact SessionRNG successor');
    const rngDraws = structuredClone(afterAuthority);
    rngDraws.raw.draws.terrain += 1;
    expect(assess(rngDraws).reasons).toContain('exact SessionRNG successor');

    const prefix = structuredClone(afterAuthority);
    prefix.raw.receiptRows[1]!.witness = 'mutated-prior-row';
    expect(assess(prefix).reasons).toContain('exact predecessor receipt rows');
    const wrongKind = structuredClone(afterAuthority);
    wrongKind.raw.receiptRows[3]!.kind = 'wrong-action-kind';
    expect(assess(wrongKind).reasons).toContain('exact action receipt');
    const extraReceipt = structuredClone(afterAuthority);
    extraReceipt.raw.receiptKeys.push('receipt:4');
    extraReceipt.raw.receiptRows.push({
      ordinal: 4, kind: 'unexpected-tail', witness: 'unexpected:4',
    });
    expect(assess(extraReceipt).reasons).toContain('exact action receipt');

    const wrongOutcome = structuredClone(afterAuthority);
    wrongOutcome.state.persistence.lastOutcome = 'arc9-share-committed:9';
    expect(assess(wrongOutcome).reasons).toContain('exact persistence outcome');
    const busy = structuredClone(afterAuthority);
    busy.state.landing.actionCoordinator.inFlight = true;
    expect(assess(busy).reasons).toContain('idle clear landing action coordinator');
    const unclearedFault = structuredClone(afterAuthority);
    (unclearedFault.state.landing.actionCoordinator as { lastFault: unknown }).lastFault = {
      kind: 'stale-authority',
    };
    expect(assess(unclearedFault).reasons).toContain('idle clear landing action coordinator');

    expect(assessSingleF4ActionCommit({
      beforeAuthority,
      afterAuthority: beforeAuthority,
      expectedKind: 'arc9-add-v1',
      expectedPersistenceLastOutcome: 'arc9-add-committed:7',
    })).toEqual({
      ok: false,
      reasons: [
        'exact raw revision successor',
        'exact live runtime successor',
        'exact SessionRNG successor',
        'exact action receipt',
      ],
    });

    const lexicalRows = Array.from({ length: 10 }, (_, ordinal) => ({
      ordinal,
      kind: 'fixture-prefix',
      witness: `prefix:${ordinal}`,
    }));
    const lexicographic = (rows: typeof lexicalRows) => rows
      .map((row) => ({ key: `receipt:${row.ordinal}`, row }))
      .sort((left, right) => left.key.localeCompare(right.key));
    const lexicalBeforeEntries = lexicographic(lexicalRows);
    const lexicalAfterEntries = lexicographic([
      ...lexicalRows,
      { ordinal: 10, kind: 'arc9-share-send-v1', witness: 'share:10' },
    ]);
    const lexicalBefore = structuredClone(beforeAuthority);
    lexicalBefore.raw.revision = 40;
    lexicalBefore.raw.revisionRaw = '40';
    lexicalBefore.raw.ordinal = 10;
    lexicalBefore.raw.receiptKeys = lexicalBeforeEntries.map(({ key }) => key);
    lexicalBefore.raw.receiptRows = lexicalBeforeEntries.map(({ row }) => row);
    lexicalBefore.state.persistence.runtime = {
      schema: 'cf-v2-f4-runtime/v1', revision: 40, commits: 12,
      sessionSeed: lexicalBefore.raw.seed, sessionOrdinal: 10,
      sessionDraws: structuredClone(lexicalBefore.raw.draws),
    };
    const lexicalAfter = structuredClone(afterAuthority);
    lexicalAfter.raw.revision = 41;
    lexicalAfter.raw.revisionRaw = '41';
    lexicalAfter.raw.ordinal = 11;
    lexicalAfter.raw.receiptKeys = lexicalAfterEntries.map(({ key }) => key);
    lexicalAfter.raw.receiptRows = lexicalAfterEntries.map(({ row }) => row);
    lexicalAfter.state.persistence.lastOutcome = 'arc9-share-committed:41';
    lexicalAfter.state.persistence.runtime = {
      schema: 'cf-v2-f4-runtime/v1', revision: 41, commits: 13,
      sessionSeed: lexicalAfter.raw.seed, sessionOrdinal: 11,
      sessionDraws: structuredClone(lexicalAfter.raw.draws),
    };
    expect(assessSingleF4ActionCommit({
      beforeAuthority: lexicalBefore,
      afterAuthority: lexicalAfter,
      expectedKind: 'arc9-share-send-v1',
      expectedPersistenceLastOutcome: 'arc9-share-committed:41',
    }), 'IDB lexicographic receipt:10 before ordinal 11').toEqual({ ok: true, reasons: [] });
  });

  it('binds single and sequenced Land receipts to the exact two descent draws or a proven safe zero-draw path', () => {
    const mercuryWorldKey = 'CF1|g:999@90,-60|s:424242@560,170|p:131#0';
    const factsFor = () => ({
      schema: 'cf-v2-arc0-landing-witness/v1', worldKey: mercuryWorldKey,
      planetSeed: 131, planetOrdinal: 0, landing: 'unresolved-already-landed',
      permanentLanding: true, training: false, landingKnownBefore: true,
      identityLandedAfter: true, claimedLegacyIdentity: true, legacyMirrorContainsSeedAfter: true,
      savedView: { type: 'planet', gal: { seed: 999, x: 90, y: -60 },
        star: { seed: 424242, x: 560, y: 170 }, pseed: 131 },
      sample: { kind: 'suppressed', reason: 'unresolved-already-landed' },
      charter: { banked: false, ascChBefore: 0, ascChAfter: 0, stage: 0,
        progressSeal: 'a'.repeat(64), delta: {} },
      starterCharters: { changed: false, progressIds: [], completions: [], priorUnlockedIds: [],
        nextUnlockedIds: [], addedAchievementIds: [], priorBestRankIndex: 0, nextBestRankIndex: 0 },
      achievement: null, descentWeather: null,
      descent: {
        kind: 'landed', navigation: 'surface', drawsConsumed: 2,
        hpBefore: 55, hpAfter: 55, damage: 0, waveOffCountBefore: 0,
        waveOffCountAfter: 0, persistenceOutcome: 'success',
        policy: {
          schema: 'cf-v2-descent-policy/v1', key: mercuryWorldKey,
          address: { format: 'CF1', key: mercuryWorldKey,
            galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 },
            planet: { seed: 131, ordinal: 0 } },
          opportunityIdentity: `cf-v2-world-opportunity/v3:${mercuryWorldKey}`,
          capabilityFingerprint: 'fixture-no-worn-effects', planetType: 'rocky', biomeKey: 'cratered',
          typeBase: { successPercent: 90, damageMin: 2, damageMax: 2 },
          baseSuccessPercent: 95, stormActive: false, stormAdjustedPercent: 95,
          waveOffCount: 0, learnedApproachBonus: 0, globalGearBonus: 0, familyGearBonus: 0,
          landingGuaranteed: false, successPercent: 95, damageMin: 2, damageMax: 2,
          waveOffDamageReduction: 0, safeReason: null,
          requiredDomains: ['descent.success', 'descent.damage'],
        },
      },
      stateSuccessorSeal: 'b'.repeat(64), worldIdentitySuccessorSeal: 'c'.repeat(64),
      waveOffStateSuccessorSeal: 'd'.repeat(64), waveOffLegacySuccessorSeal: 'e'.repeat(64),
      arc2LootSuccessorSeal: 'f'.repeat(64), waveOffProtectedStateSeal: null, receiptOrdinal: 3,
    });
    const fixture = (sequence = false) => {
      const count = sequence ? 2 : 1;
      const draws: Record<string, number> = { terrain: 4 };
      const nextDraws = { ...draws, 'descent.success': 1, 'descent.damage': 1 };
      const landing = { schema: 'cf-v2-arc0-landing-app-state/v1', lastOutcome: 'committed:8',
        actionCoordinator: { inFlight: false,
          owner: { schema: 'cf-v2-product-action-coordinator-diagnostics/v1', busy: false, operation: null },
          hold: { schema: 'cf-v2-product-action-hold-diagnostics/v1', phase: 'idle', operation: null, sequence: 0 },
          faultArmed: { storageFailure: false, staleAuthority: false, publicationFailure: false }, lastFault: null } };
      const runtime = { schema: 'cf-v2-f4-runtime/v1', revision: 7, commits: 5,
        sessionSeed: 68, sessionOrdinal: 3, sessionDraws: draws };
      const prior = { ordinal: 2, kind: 'arc9-add-v1', witness: 'prior:2' };
      const afterState = { landing, persistence: {
        lastOutcome: sequence ? 'arc9-progression-committed:9' : 'arc0-land-committed:8',
        runtime: { ...runtime, revision: 7 + count, commits: 5 + count,
          sessionOrdinal: 3 + count, sessionDraws: nextDraws as Record<string, number> } } };
      return {
        beforeAuthority: { token: 'land-draw-document',
          raw: { revision: 7, revisionRaw: '7', seed: 68, ordinal: 3, draws,
            receiptKeys: ['receipt:2'], receiptRows: [prior] },
          state: { landing, persistence: { lastOutcome: 'arc9-add-committed:7', runtime } } },
        afterAuthority: { token: 'land-draw-document',
          raw: { revision: 7 + count, revisionRaw: String(7 + count), seed: 68,
            ordinal: 3 + count, draws: nextDraws as Record<string, number>,
            receiptKeys: ['receipt:2', 'receipt:3', ...(sequence ? ['receipt:4'] : [])],
            receiptRows: [prior, { ordinal: 3, kind: 'arc0-land', witness: JSON.stringify(factsFor()) },
              ...(sequence ? [{ ordinal: 4, kind: 'arc9-progression-refresh-v1', witness: 'progression:4' }] : [])] },
          state: afterState },
      };
    };
    type Fixture = ReturnType<typeof fixture>;
    const assess = (value: Fixture, sequence = false) => sequence
      ? assessF4ActionCommitSequence({ ...value, state: value.afterAuthority.state,
        expectedKinds: ['arc0-land', 'arc9-progression-refresh-v1'],
        expectedPersistenceLastOutcome: 'arc9-progression-committed:9' })
      : assessSingleF4ActionCommit({ ...value, state: value.afterAuthority.state,
        expectedKind: 'arc0-land', expectedPersistenceLastOutcome: 'arc0-land-committed:8' });
    const rewrite = (value: Fixture, mutate: (facts: Record<string, any>) => void) => {
      const row = value.afterAuthority.raw.receiptRows[1]!;
      const facts = JSON.parse(row.witness); mutate(facts); row.witness = JSON.stringify(facts);
    };
    const counters = (value: Fixture, draws: Record<string, number>) => {
      value.afterAuthority.raw.draws = structuredClone(draws);
      value.afterAuthority.state.persistence.runtime.sessionDraws = structuredClone(draws);
    };
    for (const sequence of [false, true]) {
      expect(assess(fixture(sequence), sequence)).toEqual({ ok: true, reasons: [] });
      for (const reason of ['training', 'revisit', 'earth']) {
        const value = fixture(sequence);
        rewrite(value, (facts) => {
          const policy = facts.descent.policy;
          policy.safeReason = reason; policy.successPercent = 100; policy.requiredDomains = [];
          facts.descent.drawsConsumed = 0;
          if (reason === 'training') {
            facts.training = true; facts.permanentLanding = false;
            facts.descent.persistenceOutcome = 'unchanged';
          } else if (reason === 'revisit') facts.landing = 'repeat';
          else {
            facts.worldKey = 'CF1|g:999@90,-60|s:424242@560,170|p:133#2';
            facts.planetSeed = 133; facts.planetOrdinal = 2;
            policy.key = facts.worldKey; policy.address.key = facts.worldKey;
            policy.address.planet = { seed: 133, ordinal: 2 };
            policy.opportunityIdentity = `cf-v2-world-opportunity/v3:${facts.worldKey}`;
          }
        });
        counters(value, { terrain: 4 });
        expect(assess(value, sequence), reason).toEqual({ ok: true, reasons: [] });
        counters(value, { terrain: 4, 'descent.success': 1, 'descent.damage': 1 });
        expect(assess(value, sequence).ok, `${reason} burned draws`).toBe(false);
      }
      const waveOff = fixture(sequence);
      waveOff.beforeAuthority.raw.seed = 10;
      waveOff.afterAuthority.raw.seed = 10;
      waveOff.beforeAuthority.state.persistence.runtime.sessionSeed = 10;
      waveOff.afterAuthority.state.persistence.runtime.sessionSeed = 10;
      rewrite(waveOff, (facts) => {
        facts.permanentLanding = false; facts.arc2LootSuccessorSeal = null;
        facts.waveOffProtectedStateSeal = 'f'.repeat(64); facts.sample = null;
        Object.assign(facts.descent, { kind: 'wave-off', navigation: 'orbit',
          hpAfter: 53, rawDamage: 2, gearAdjustedDamage: 2, damage: 2,
          waveOffCountAfter: 1, persistenceOutcome: 'failure' });
      });
      /* Seed10 independently gives success .9993766504 and damage .5748063517. */
      expect(assess(waveOff, sequence)).toEqual({ ok: true, reasons: [] });
      rewrite(waveOff, (facts) => { facts.descent.hpAfter = 0; });
      expect(assess(waveOff, sequence).ok).toBe(false);

      const resumed = fixture(sequence);
      resumed.beforeAuthority.raw.seed = 10; resumed.afterAuthority.raw.seed = 10;
      resumed.beforeAuthority.state.persistence.runtime.sessionSeed = 10;
      resumed.afterAuthority.state.persistence.runtime.sessionSeed = 10;
      resumed.beforeAuthority.raw.draws = { terrain: 4, 'descent.success': 1, 'descent.damage': 1 };
      resumed.beforeAuthority.state.persistence.runtime.sessionDraws = structuredClone(resumed.beforeAuthority.raw.draws);
      counters(resumed, { terrain: 4, 'descent.success': 2, 'descent.damage': 2 });
      /* At counter1 the same seed gives .7803765372 and lands: replaying
         counter0 instead would report the opposite result. */
      expect(assess(resumed, sequence)).toEqual({ ok: true, reasons: [] });

      const variableDamage = fixture(sequence);
      variableDamage.beforeAuthority.raw.seed = 10; variableDamage.afterAuthority.raw.seed = 10;
      variableDamage.beforeAuthority.state.persistence.runtime.sessionSeed = 10;
      variableDamage.afterAuthority.state.persistence.runtime.sessionSeed = 10;
      rewrite(variableDamage, (facts) => {
        const key = 'CF1|g:999@90,-60|s:1347060996@414.31,168.49|p:546621068#3';
        facts.worldKey = key; facts.planetSeed = 546621068; facts.planetOrdinal = 3;
        facts.permanentLanding = false; facts.descentWeather = 'rain'; facts.sample = null;
        facts.arc2LootSuccessorSeal = null; facts.waveOffProtectedStateSeal = 'f'.repeat(64);
        Object.assign(facts.descent.policy, { key,
          address: { format: 'CF1', key, galaxy: { seed: 999, x: 90, y: -60 },
            star: { seed: 1347060996, x: 414.31, y: 168.49 }, planet: { seed: 546621068, ordinal: 3 } },
          opportunityIdentity: `cf-v2-world-opportunity/v3:${key}`,
          planetType: 'ocean', biomeKey: 'volcisle', baseSuccessPercent: 70,
          stormActive: true, stormAdjustedPercent: 65, successPercent: 65, damageMin: 4, damageMax: 6 });
        Object.assign(facts.descent, { kind: 'wave-off', navigation: 'orbit',
          hpBefore: 4, hpAfter: 1, rawDamage: 5, gearAdjustedDamage: 5, damage: 3,
          waveOffCountAfter: 1, persistenceOutcome: 'failure' });
      });
      expect(assess(variableDamage, sequence)).toEqual({ ok: true, reasons: [] });
      rewrite(variableDamage, (facts) => { facts.descent.rawDamage = 4; });
      expect(assess(variableDamage, sequence).ok).toBe(false);

      const drawMutants: Array<Record<string, number>> = [
        { terrain: 4 }, { terrain: 4, 'descent.success': 1 },
        { terrain: 4, 'descent.success': 2, 'descent.damage': 1 },
        { terrain: 4, 'descent.success': 1, 'descent.damage': 2 },
        { terrain: 5, 'descent.success': 1, 'descent.damage': 1 },
        { terrain: 4, 'descent.success': 1, 'descent.damage': 1, invented: 0 },
      ];
      for (const draws of drawMutants) {
        const value = fixture(sequence); counters(value, draws);
        expect(assess(value, sequence).ok, JSON.stringify(draws)).toBe(false);
      }
      const witnessMutants: Array<(facts: Record<string, any>) => void> = [
        (facts) => { delete facts.descentWeather; }, (facts) => { facts.extra = true; },
        (facts) => { facts.schema = 'old-schema'; }, (facts) => { facts.receiptOrdinal++; },
        (facts) => { facts.descent.drawsConsumed = 0; },
        (facts) => { facts.descent.policy.requiredDomains = ['invented', 'descent.damage']; },
        (facts) => { facts.descent.policy.requiredDomains.reverse(); },
        (facts) => { facts.descent.policy.requiredDomains = ['descent.success', 'descent.success']; },
        (facts) => { facts.descent.policy.safeReason = 'revisit'; },
        (facts) => { facts.descent.policy.successPercent = 100; },
        (facts) => { facts.descent.policy.damageMax = 99; },
        (facts) => { facts.descent.policy.key = 'forged'; },
        (facts) => { facts.descent.hpAfter = 54; },
        (facts) => { facts.descent.navigation = 'orbit'; },
        (facts) => { facts.descent.rawDamage = 2; },
      ];
      for (const mutate of witnessMutants) {
        const value = fixture(sequence); rewrite(value, mutate);
        expect(assess(value, sequence).ok).toBe(false);
      }
      const refused = fixture(sequence);
      refused.afterAuthority.state.landing.lastOutcome = 'refused:storage-error';
      expect(assess(refused, sequence).reasons).toContain('exact committed Land outcome');
      const ordinal = fixture(sequence);
      ordinal.afterAuthority.raw.ordinal++;
      ordinal.afterAuthority.state.persistence.runtime.sessionOrdinal++;
      expect(assess(ordinal, sequence).ok).toBe(false);
      const shiftedReceipt = fixture(sequence);
      shiftedReceipt.afterAuthority.raw.receiptRows[1]!.ordinal++;
      expect(assess(shiftedReceipt, sequence).ok).toBe(false);
      expect(assess(fixture(sequence), sequence)).toEqual({ ok: true, reasons: [] });
    }
  });
  it('binds Charter Land to one exact receipt topology and trusted pointer order', () => {
    const galaxyKey = 'CF1|g:999@90,-60';
    const starKey = `${galaxyKey}|s:424242@560,170`;
    const worldKey = `${starKey}|p:131#0`;
    const savedView = {
      type: 'planet',
      gal: {
        x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
        seed: 999, home: true, quasar: false, dwarf: false,
      },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 131,
    };
    // Synthetic contract fixture: seals and fingerprint are placeholders;
    // Mercury's biome, chance, damage and domain counters are independent literals.
    const mercuryPolicy = {
      "schema": "cf-v2-descent-policy/v1",
      "key": "CF1|g:999@90,-60|s:424242@560,170|p:131#0",
      "address": {
        "format": "CF1",
        "key": "CF1|g:999@90,-60|s:424242@560,170|p:131#0",
        "galaxy": {
          "seed": 999,
          "x": 90,
          "y": -60,
          "size": 78,
          "sp": 0,
          "tilt": 0.62,
          "rot": 0.5,
          "home": true,
          "quasar": false,
          "dwarf": false,
          "parentCell": {
            "x": 0,
            "y": -1
          }
        },
        "star": {
          "seed": 424242,
          "x": 560,
          "y": 170,
          "layer": "coarse",
          "parentCell": {
            "x": 12,
            "y": 4
          }
        },
        "planet": {
          "seed": 131,
          "ordinal": 0
        }
      },
      "opportunityIdentity": "cf-v2-world-opportunity/v3:CF1|g:999@90,-60|s:424242@560,170|p:131#0",
      "capabilityFingerprint": "ec1:0:test-fixture",
      "planetType": "rocky",
      "biomeKey": "cratered",
      "typeBase": {
        "successPercent": 90,
        "damageMin": 2,
        "damageMax": 2
      },
      "baseSuccessPercent": 95,
      "stormActive": false,
      "stormAdjustedPercent": 95,
      "waveOffCount": 0,
      "learnedApproachBonus": 0,
      "globalGearBonus": 0,
      "familyGearBonus": 0,
      "landingGuaranteed": false,
      "successPercent": 95,
      "damageMin": 2,
      "damageMax": 2,
      "waveOffDamageReduction": 0,
      "safeReason": null,
      "requiredDomains": [
        "descent.success",
        "descent.damage"
      ]
    };
    const landWitness = (chapter: 0 | 3, stage: 0 | 3, ordinal: number, learned = false) => JSON.stringify({
      schema: 'cf-v2-arc0-landing-witness/v1',
      worldKey,
      planetSeed: 131,
      planetOrdinal: 0,
      landing: 'unresolved-already-landed',
      permanentLanding: true,
      training: false,
      landingKnownBefore: true,
      identityLandedAfter: true,
      claimedLegacyIdentity: true,
      legacyMirrorContainsSeedAfter: true,
      savedView,
      sample: { kind: 'suppressed', reason: 'unresolved-already-landed' },
      charter: {
        banked: false, ascChBefore: 0, ascChAfter: chapter, stage,
        progressSeal: 'a'.repeat(64), delta: {},
      },
      starterCharters: {
        changed: false, progressIds: [], completions: [], priorUnlockedIds: [],
        nextUnlockedIds: [], addedAchievementIds: [], priorBestRankIndex: 0,
        nextBestRankIndex: 0,
      },
      achievement: null,
      descentWeather: null,
      descent: { kind: 'landed', navigation: 'surface',
        policy: { ...mercuryPolicy, waveOffCount: learned ? 1 : 0,
          learnedApproachBonus: learned ? 20 : 0, successPercent: learned ? 100 : 95 },
        drawsConsumed: 2, hpBefore: learned ? 53 : 55, hpAfter: learned ? 53 : 55, damage: 0,
        waveOffCountBefore: learned ? 1 : 0, waveOffCountAfter: 0, persistenceOutcome: 'success' },
      waveOffStateSuccessorSeal: 'd'.repeat(64),
      waveOffLegacySuccessorSeal: 'e'.repeat(64),
      arc2LootSuccessorSeal: 'f'.repeat(64),
      waveOffProtectedStateSeal: null,
      stateSuccessorSeal: 'b'.repeat(64),
      worldIdentitySuccessorSeal: 'c'.repeat(64),
      receiptOrdinal: ordinal,
    });
    const routeState = {
      mode: 'surface', gal: 999, galX: 90, galY: -60, galSize: 78,
      star: 424242, starX: 560, starY: 170, planet: 131, planetOrdinal: 0,
      navGalaxyKey: galaxyKey, navStarKey: starKey, navWorldKey: worldKey,
      epoch: 12,
      renderedScene: {
        serial: 2, mode: 'surface', ecologyEpoch: 12,
        galaxyKey, starKey, worldKey,
      },
      save: { savedView },
    };
    const prefixRows = [
      { ordinal: 0, kind: 'seed', witness: 'seed:0' },
      { ordinal: 1, kind: 'arc9-survey-v1', witness: 'survey:1' },
      { ordinal: 2, kind: 'arc9-share-send-v1', witness: 'share:2' },
    ];
    const beforeAuthority = {
      raw: {
        revision: 34, revisionRaw: '34', seed: 1314635406, ordinal: 3, draws: {},
        receiptKeys: ['receipt:0', 'receipt:1', 'receipt:2'],
        receiptRows: prefixRows,
      },
      state: { persistence: { runtime: { revision: 34, commits: 4 } } },
    };
    const afterAuthority = {
      raw: {
        revision: 36, revisionRaw: '36', seed: 1314635406, ordinal: 5,
        draws: { 'descent.success': 1, 'descent.damage': 1 },
        receiptKeys: ['receipt:0', 'receipt:1', 'receipt:2', 'receipt:3', 'receipt:4'],
        receiptRows: [
          ...prefixRows,
          { ordinal: 3, kind: 'arc0-land', witness: landWitness(3, 3, 3) },
          { ordinal: 4, kind: 'arc9-progression-refresh-v1', witness: 'progression:4' },
        ],
      },
      state: { persistence: { runtime: { revision: 36, commits: 6 } } },
    };
    const state = {
      ...routeState,
      landing: { lastOutcome: 'committed:35' },
      persistence: { lastOutcome: 'arc9-progression-committed:36' },
    };
    const assess = (after = afterAuthority, current = state) =>
      assessCharterLandSettlementTopology({
        beforeAuthority, afterAuthority: after, state: current,
        expectedChapter: 3, expectedStage: 3,
      });
    expect(assess()).toEqual({ ok: true, reasons: [] });

    const orderedReceipts = (rows: readonly { ordinal: number; kind: string; witness: string }[]) =>
      rows.map((row) => ({ key: `receipt:${row.ordinal}`, row }))
        .sort((left, right) => left.key.localeCompare(right.key));
    const lexicalPrefix = orderedReceipts(Array.from({ length: 10 }, (_, ordinal) => ({
      ordinal, kind: 'fixture-prefix', witness: `prefix:${ordinal}`,
    })));
    const lexicalBefore = structuredClone(beforeAuthority);
    lexicalBefore.raw.ordinal = 10;
    lexicalBefore.raw.receiptKeys = lexicalPrefix.map(({ key }) => key);
    lexicalBefore.raw.receiptRows = lexicalPrefix.map(({ row }) => row);
    const lexicalAfter = structuredClone(afterAuthority);
    lexicalAfter.raw.ordinal = 12;
    const lexicalAll = orderedReceipts([
      ...lexicalPrefix.map(({ row }) => row),
      { ordinal: 10, kind: 'arc0-land', witness: landWitness(3, 3, 10) },
      { ordinal: 11, kind: 'arc9-progression-refresh-v1', witness: 'progression:11' },
    ]);
    lexicalAfter.raw.receiptKeys = lexicalAll.map(({ key }) => key);
    lexicalAfter.raw.receiptRows = lexicalAll.map(({ row }) => row);
    expect(assessCharterLandSettlementTopology({
      beforeAuthority: lexicalBefore,
      afterAuthority: lexicalAfter,
      state,
      expectedChapter: 3,
      expectedStage: 3,
    }), 'IDB lexical receipt:10 ordering').toEqual({ ok: true, reasons: [] });

    const revision = structuredClone(afterAuthority);
    revision.raw.revision = 37;
    expect(assess(revision).reasons).toContain('exact F4 revision span');
    const receipt = structuredClone(afterAuthority);
    receipt.raw.receiptRows[3]!.kind = 'wrong-land-kind';
    expect(assess(receipt).reasons).toContain('exact Land/progression receipt tail');
    const prefix = structuredClone(afterAuthority);
    prefix.raw.receiptRows[1]!.witness = 'wrong-predecessor';
    expect(assess(prefix).reasons).toContain('exact predecessor receipt prefix');
    const witness = structuredClone(afterAuthority);
    const witnessIndex = witness.raw.receiptRows.findIndex((row) => row.kind === 'arc0-land');
    expect(witnessIndex).toBeGreaterThanOrEqual(0);
    witness.raw.receiptRows[witnessIndex]!.witness = landWitness(0, 3, 3);
    expect(assess(witness).reasons).toContain('exact unresolved legacy Land witness');
    const rng = structuredClone(afterAuthority);
    rng.raw.ordinal = 6;
    expect(assess(rng).reasons).toContain('exact SessionRNG receipt span');
    for (const domain of ['descent.success', 'descent.damage'] as const) {
      const wrongDraw = structuredClone(afterAuthority);
      wrongDraw.raw.draws[domain] = 0;
      expect(assess(wrongDraw).reasons).toContain('exact SessionRNG receipt span');
    }
    for (const change of [
      (facts: any) => { facts.descent.policy.successPercent = 100; },
      (facts: any) => { facts.descent.policy.biomeKey = 'glacier'; },
      (facts: any) => { facts.descent.policy.globalGearBonus = 5; },
      (facts: any) => { facts.descent.policy.safeReason = 'revisit'; },
      (facts: any) => { facts.descent.kind = 'wave-off'; },
      (facts: any) => { facts.descent.hpAfter -= 1; },
      (facts: any) => { facts.waveOffProtectedStateSeal = 'a'.repeat(64); },
    ]) {
      const wrongDescent = structuredClone(afterAuthority);
      const facts = JSON.parse(wrongDescent.raw.receiptRows[3]!.witness);
      change(facts);
      wrongDescent.raw.receiptRows[3]!.witness = JSON.stringify(facts);
      expect(assess(wrongDescent).ok).toBe(false);
    }
    expect(assess()).toEqual({ ok: true, reasons: [] });
    const learnedBefore = structuredClone(beforeAuthority);
    learnedBefore.raw.draws = { 'descent.success': 1, 'descent.damage': 1 };
    const learnedAfter = structuredClone(afterAuthority);
    learnedAfter.raw.draws = { 'descent.success': 2, 'descent.damage': 2 };
    learnedAfter.raw.receiptRows[3]!.witness = landWitness(3, 3, 3, true);
    expect(assessCharterLandSettlementTopology({
      beforeAuthority: learnedBefore, afterAuthority: learnedAfter, state,
      expectedChapter: 3, expectedStage: 3,
    })).toEqual({ ok: true, reasons: [] });
    const runtime = structuredClone(afterAuthority);
    runtime.state.persistence.runtime.commits = 5;
    expect(assess(runtime).reasons).toContain('exact live runtime settlement');
    expect(assess(afterAuthority, {
      ...state, landing: { lastOutcome: 'committed:36' },
    }).reasons).toContain('exact landing outcome');
    expect(assess(afterAuthority, {
      ...state, persistence: { lastOutcome: 'arc0-land-committed:35' },
    }).reasons).toContain('exact persistence outcome');
    expect(assess(afterAuthority, {
      ...state, navWorldKey: `${worldKey}:collision`,
    }).reasons).toContain('exact live Mercury route and saved view');

    const noAdvanceAfter = {
      raw: {
        revision: 35, revisionRaw: '35', seed: 1314635406, ordinal: 4,
        draws: { 'descent.success': 1, 'descent.damage': 1 },
        receiptKeys: [...beforeAuthority.raw.receiptKeys, 'receipt:3'],
        receiptRows: [
          ...prefixRows,
          { ordinal: 3, kind: 'arc0-land', witness: landWitness(0, 0, 3) },
        ],
      },
      state: { persistence: { runtime: { revision: 35, commits: 5 } } },
    };
    expect(assessCharterLandSettlementTopology({
      beforeAuthority,
      afterAuthority: noAdvanceAfter,
      state: {
        ...routeState,
        landing: { lastOutcome: 'committed:35' },
        persistence: { lastOutcome: 'arc0-land-committed:35' },
      },
      expectedChapter: 0,
      expectedStage: 0,
    })).toEqual({ ok: true, reasons: [] });
    expect(() => assessCharterLandSettlementTopology({ expectedChapter: 1, expectedStage: 3 }))
      .toThrow(/expected chapter\/stage 0 or 3/u);

    const trusted = [
      { type: 'pointerdown', trusted: true, act: 'landcta' },
      { type: 'pointerup', trusted: true, act: 'landcta' },
      { type: 'click', trusted: true, act: 'landcta' },
    ];
    expect(exactTrustedCharterLandReceipt(trusted)).toBe(true);
    expect(exactTrustedCharterLandReceipt(trusted.slice(0, 2))).toBe(false);
    expect(exactTrustedCharterLandReceipt([trusted[1], trusted[0], trusted[2]])).toBe(false);
    expect(exactTrustedCharterLandReceipt([
      { ...trusted[0], trusted: false }, trusted[1], trusted[2],
    ])).toBe(false);
    expect(exactTrustedCharterLandReceipt([
      trusted[0], { ...trusted[1], act: 'share' }, trusted[2],
    ])).toBe(false);
    expect(exactTrustedCharterLandReceipt([...trusted, trusted[2]])).toBe(false);
  });

  it('restores only the exact inline style property carrier used by a control', () => {
    const dom = new JSDOM('<div id="target"></div>', { runScripts: 'outside-only' });
    const target = dom.window.document.getElementById('target') as HTMLElement;
    target.style.setProperty('display', 'inline', 'important');
    target.style.setProperty('color', 'red');

    const prior = captureInlineStyleProperties(target.style, ['display', 'top']);
    target.style.setProperty('display', 'inline');
    expect(inspectInlineStyleProperties(target.style, prior).changed).toEqual(['display']);
    restoreInlineStyleProperties(target.style, prior);

    target.style.setProperty('top', '12px');
    expect(inspectInlineStyleProperties(target.style, prior).changed).toEqual(['top']);
    restoreInlineStyleProperties(target.style, prior);

    target.style.setProperty('display', 'inline');
    target.style.setProperty('top', '12px', 'important');
    target.style.setProperty('color', 'blue');

    const drift = inspectInlineStyleProperties(target.style, prior);
    expect(drift.ok).toBe(false);
    expect(drift.changed).toEqual(['display', 'top']);
    expect(drift.prior.display).toEqual({ value: 'inline', priority: 'important' });
    expect(drift.current.display).toEqual({ value: 'inline', priority: '' });
    expect(drift.prior.top).toEqual({ value: '', priority: '' });
    expect(drift.current.top).toEqual({ value: '12px', priority: 'important' });

    restoreInlineStyleProperties(target.style, prior);
    expect(inspectInlineStyleProperties(target.style, prior)).toMatchObject({ ok: true, changed: [] });
    expect(target.style.getPropertyValue('display')).toBe('inline');
    expect(target.style.getPropertyPriority('display')).toBe('important');
    expect(target.style.getPropertyValue('top')).toBe('');
    expect(target.style.getPropertyPriority('top')).toBe('');
    expect(Array.from({ length: target.style.length }, (_, index) => target.style.item(index))).not.toContain('top');
    expect(target.style.getPropertyValue('color')).toBe('blue');

    type Runtime = {
      captureInlineStyleProperties(style: CSSStyleDeclaration, names: string[]): Record<string, { value: string; priority: string }>;
      restoreInlineStyleProperties(style: CSSStyleDeclaration, carrier: Record<string, { value: string; priority: string }>): void;
      inspectInlineStyleProperties(style: CSSStyleDeclaration, carrier: Record<string, { value: string; priority: string }>): { ok: boolean; changed: string[] };
    };
    const runtime = dom.window.eval(`(()=>{${INLINE_STYLE_PROPERTY_CARRIER_RUNTIME_SOURCE}
      return {captureInlineStyleProperties,restoreInlineStyleProperties,inspectInlineStyleProperties};})()`) as Runtime;
    const emittedPrior = runtime.captureInlineStyleProperties(target.style, ['left']);
    target.style.setProperty('left', '24px', 'important');
    target.style.setProperty('background', 'gold');
    expect(runtime.inspectInlineStyleProperties(target.style, emittedPrior)).toMatchObject({
      ok: false,
      changed: ['left'],
    });
    runtime.restoreInlineStyleProperties(target.style, emittedPrior);
    expect(runtime.inspectInlineStyleProperties(target.style, emittedPrior)).toMatchObject({ ok: true, changed: [] });
    expect(target.style.getPropertyValue('left')).toBe('');
    expect(Array.from({ length: target.style.length }, (_, index) => target.style.item(index))).not.toContain('left');
    expect(target.style.getPropertyValue('background')).toBe('gold');
    dom.window.close();
  });

  it('seals the repaired phone, lazy publication, and Charter causal prefixes before browser spend', () => {
    expect(indexSource).not.toContain(
      'body:is(.card-open,.panel-open) #primechip { display: none; }',
    );
    const phonePrime = section(
      sliceSource,
      '  const phGeo = await evalPh(geoCheck);',
      '  /* The lower-phone stack has four independently-sized surfaces.',
    );
    proveEachMarkerRequired(phonePrime, [
      ['green Prime base', 'if (phGeo.length === 0) {'],
      ['Prime base causal stop', "failSliceWithoutCascade('PHONE GOLDEN LAYOUT drift:"],
      ['shared property carrier runtime', '${INLINE_STYLE_PROPERTY_CARRIER_RUNTIME_SOURCE}'],
      ['four owned Prime properties', "captureInlineStyleProperties(prime.style,['display','top','left','transform','position','bottom'])"],
      ['Prime property restore binding', 'const restore=()=>restoreInlineStyleProperties(prime.style,prior);'],
      ['hidden Prime control', "prime.style.setProperty('display','none','important')"],
      ['hidden Prime restoration proof', 'hiddenRestoration=inspectInlineStyleProperties(prime.style,prior)'],
      ['hidden Prime restoration gate', 'if(!hiddenRestoration.ok)throw new Error'],
      ['hidden Prime outer gate', '|| !phonePrimeControls.hiddenRestoration?.ok'],
      ['measured HP and Prime rectangles', 'const h=hp.getBoundingClientRect(),p=prime.getBoundingClientRect();'],
      ['measured HP horizontal translation', "prime.style.setProperty('transform','translate('+(h.left-p.left)+'px,'+"],
      ['measured HP vertical translation', "(h.top-p.top)+'px)','important');"],
      ['exact Prime restoration', 'finally{restore();}'],
      ['Prime control causal stop', "failSliceWithoutCascade('PHONE PRIME TIER CONTROLS FAILED"],
      ['restored Prime recheck', 'phonePrimeControls.restored.length !== 0'],
    ]);

    const phoneGuide = section(
      sliceSource,
      '  const phoneGuideClearanceCheck = `',
      "  await evalPh(`(()=>{ document.querySelector('#guidepanel [data-pnx]').click(); return true; })()`);",
    );
    proveEachMarkerRequired(phoneGuide, [
      ['Guide publication waiter', "waitPhValue('PHONE GUIDE current publication'"],
      ['Guide loading exclusion', "!body?.querySelector('[data-guide-loading]')"],
      ['Guide post-publication frames', 'requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))'],
      ['general Prime overlay checker', 'const phonePrimeOverlayCheck = (overlayId, openClass) =>'],
      ['phone Prime overlay outcome', 'const phonePrimeOverlay = await evalPh(phoneGuidePrimeOverlayCheck);'],
      ['phone Prime overlay causal control', 'if (!phonePrimeOverlay.ok) {'],
      ['Prime overlay base causal stop', "failSliceWithoutCascade('PHONE PRIME OVERLAY YIELD:"],
      ['visible Prime/panel collision control', "prime.style.setProperty('display','block','important')"],
      ['measured Prime/panel rectangles', "const p=document.getElementById('guidepanel').getBoundingClientRect(),q=prime.getBoundingClientRect();"],
      ['measured Prime/panel horizontal translation', "'translate('+(p.left+8-q.left)+'px,'+"],
      ['measured Prime/panel vertical translation', "(p.top+8-q.top)+'px)','important');"],
      ['measured Prime/panel overlap', '!phonePrimeOverlayCtl.result?.overlap'],
      ['Prime overlay property carrier', "captureInlineStyleProperties(prime.style,['display','position','left','top','bottom','transform','z-index'])"],
      ['Prime overlay restore binding', 'const restore=()=>restoreInlineStyleProperties(prime.style,prior);'],
      ['Prime overlay exact restoration', 'const restoration=inspectInlineStyleProperties(prime.style,prior)'],
      ['Prime overlay causal stop', "failSliceWithoutCascade('PHONE PRIME OVERLAY YIELD CONTROL FAILED"],
      ['Prime overlay restored recheck', '!phonePrimeOverlayCtl.restored.ok'],
      ['Guide base causal stop', "failSliceWithoutCascade('PHONE GUIDE CLEARANCE:"],
      ['green Guide base', 'if (phoneGuideClearance.ok) {'],
      ['measured Guide collision', 'targetHeight=Math.ceil(d.top-p.top+9)'],
      ['Guide min-height carrier', "captureInlineStyleProperties(panel.style,['min-height'])"],
      ['Guide min-height restore binding', 'const restore=()=>restoreInlineStyleProperties(panel.style,prior);'],
      ['Guide strong min-height mutation', "panel.style.setProperty('min-height',targetHeight+'px','important')"],
      ['exact Guide restoration', 'const restoration=inspectInlineStyleProperties(panel.style,prior)'],
      ['Guide control causal stop', "failSliceWithoutCascade('PHONE GUIDE CLEARANCE CONTROL FAILED"],
      ['restored Guide recheck', '!phoneGuideClearanceCtl.restored.ok'],
    ]);
    expect(phoneGuide.split('${INLINE_STYLE_PROPERTY_CARRIER_RUNTIME_SOURCE}').length - 1)
      .toBe(2);
    expect(phoneGuide.split('finally{restore();}').length - 1).toBe(2);

    const phoneSurvey = section(
      sliceSource,
      '  const phoneEarthBeforeAuthority = await waitNavPhF4Writable(',
      '  /* Help requested from an open body card must be readable above that card.',
    );
    proveEachMarkerRequired(phoneSurvey, [
      ['Earth Survey predecessor authority', 'phone Earth Survey predecessor F4 authority'],
      ['Earth Survey native invocation', 'const phoneEarthSurveyed = await evalNavPh('],
      ['Earth Survey exact fixed point', "label: 'phone Earth Survey'"],
      ['real Survey card checker', "phonePrimeOverlayCheck('survey', 'card-open')"],
      ['real Survey green outcome', 'if (!phoneSurveyPrimeOverlay.ok) {'],
      ['Survey Prime base causal stop', "failSliceWithoutCascade('PHONE PRIME SURVEY YIELD:"],
      ['Survey property carrier runtime', '${INLINE_STYLE_PROPERTY_CARRIER_RUNTIME_SOURCE}'],
      ['visible Prime/Survey collision control', "prime.style.setProperty('display','block','important')"],
      ['measured Prime/Survey rectangles', "const p=document.getElementById('survey').getBoundingClientRect(),q=prime.getBoundingClientRect();"],
      ['measured Prime/Survey horizontal translation', "'translate('+(p.left+8-q.left)+'px,'+"],
      ['measured Prime/Survey vertical translation', "(p.top+8-q.top)+'px)','important');"],
      ['measured Prime/Survey overlap', '!phoneSurveyPrimeOverlayCtl.result?.overlap'],
      ['Survey Prime property carrier', "captureInlineStyleProperties(prime.style,['display','position','left','top','bottom','transform','z-index'])"],
      ['Survey Prime restore binding', 'const restore=()=>restoreInlineStyleProperties(prime.style,prior);'],
      ['Survey Prime final restoration', 'finally{restore();}'],
      ['Survey Prime exact restoration', 'const restoration=inspectInlineStyleProperties(prime.style,prior)'],
      ['Survey Prime causal stop', "failSliceWithoutCascade('PHONE PRIME SURVEY YIELD CONTROL FAILED"],
      ['Survey Prime restored recheck', '!phoneSurveyPrimeOverlayCtl.restored.ok'],
    ]);
    for (const owner of [phonePrime, phoneGuide, phoneSurvey]) {
      expect(owner).not.toMatch(/(?:get|set|remove)Attribute\('style'\)|cssText/u);
    }

    const stage3 = section(
      sliceSource,
      '  const stage3Token = await sliceToken(navPh);',
      '  /* Human-facing Chapter 2 is exactly zero-based ascCh 1.',
    );
    proveEachMarkerRequired(stage3, [
      ['Survey causal predecessor', 'const stage3SurveyBeforeAuthority = await waitNavPhF4Writable('],
      ['Survey fixed point', "waitNavPhF4Writable('PRIME RADIUS Survey settlement')"],
      ['Survey exact one-commit assessor', "expectedKind: 'arc9-survey-v1'"],
      ['Survey-to-Charted causal stop', 'const stage3AddAction = stage3SurveyCommit.ok'],
      ['Charted fixed point', "waitNavPhF4Writable('PRIME RADIUS Charted settlement')"],
      ['Charted exact one-commit assessor', "expectedKind: 'arc0-atlas'"],
      ['exact commit causal gate', '&& stage3SurveyCommit.ok && stage3AddCommit.ok'],
      ['same-document Charted predecessor', 'stage3AddAuthority?.token === stage3DocumentToken'],
      ['Charted causal stop', 'if (stage3ChartedReady) {'],
      ['boundary causal stop', 'if (stage3ReachReady) {'],
      ['controls causal stop', 'if (stage3BoundaryControlsReady) {'],
      ['Share predecessor-derived topology',
        'const stage3ShareExpectation = arc9ShareSendSettlementExpectation('],
      ['Share exact sequence fixed point', 'await waitForF4ActionSequenceFixedPoint({'],
      ['Share predecessor authority', 'beforeAuthority: stage3AddAuthority,'],
      ['Share exact expectation', 'expectation: stage3ShareExpectation,'],
      ['Share state-specific assessor',
        'assessSettlement: assessArc9ShareSendSettlement,'],
      ['Share causal stop', 'if (stage3ShareReady) {'],
      ['restore causal stop', 'if (stage3RestoredReady) {'],
    ]);

    const charter = section(
      sliceSource,
      '  const charterStableLedger = (state) => {',
      "  await send('Target.closeTarget', { targetId: tPanel.targetId });",
    );
    proveEachMarkerRequired(charter, [
      ['collision-safe Mercury route', 'const charterWorldKey = `${charterStarKey}|p:131#0`;'],
      ['exact saved view', 'const charterSavedView = {'],
      ['additional save families', 'customNames: state.save.customNames,'],
      ['pre-existing achievement rejection', "beforeShare.save.unlocked.includes('ascended')"],
      ['Survey replacement authority', 'const replacementAuthority = await waitNavPhF4Writable('],
      ['Survey exact causal assessment', 'const surveyCommitAssessment = surveyed && surveyAuthority'],
      ['Survey causal stop', 'if (!surveyCommitAssessment.ok || surveyAuthority?.token !== charterDocumentToken) {'],
      ['Share predecessor-derived topology',
        'const shareExpectation = arc9ShareSendSettlementExpectation(surveyAuthority);'],
      ['Share exact sequence fixed point', 'await waitForF4ActionSequenceFixedPoint({'],
      ['Share state-specific assessor',
        'assessSettlement: assessArc9ShareSendSettlement,'],
      ['exact Share successor',
        'const expectedShareUnlocks = shareExpectation.nextUnlockedIds;'],
      ['Share exact causal assessment', "const shareCommitAssessment = shareSettlement?.status === 'ready'"],
      ['Share assessment causal gate', '|| !shareCommitAssessment.ok'],
      ['pre-Land authority', 'let preLandAuthority = surveyAuthority;'],
      ['exact topology assessor', 'const topologyAssessment = assessCharterLandSettlementTopology({'],
      ['topology causal stop', 'if (!outcomeExact || !topologyExact || !toastExact) return;'],
      ['ordinal-safe control lookup', '`receipt:${preLandAuthority.raw.ordinal}`'],
      ['exact durable view', 'JSON.stringify(data.view)===${JSON.stringify(JSON.stringify(charterSavedView))}'],
      ['exact trusted desktop receipt', '&& exactTrustedCharterLandReceipt(panelEvents)'],
      ['desktop Survey predecessor', 'const panelSurveyBeforeAuthority = await waitPanelF4Writable('],
      ['desktop Survey assessment', 'const panelSurveyCommit = panelSurveyed && panelSurveyAuthority'],
      ['desktop Survey causal gate', 'if (!panelSurveyCommit.ok || panelSurveyAuthority?.token !== panelDocumentToken'],
      ['desktop topology assessor', 'const panelTopology = assessCharterLandSettlementTopology({'],
      ['desktop causal stop', 'if (panelLanded) {'],
    ]);
  });

  it('requires Window-owned Blob thumbnails and lifecycle-safe lazy-art observation', () => {
    const runner = section(
      sliceSource,
      '  const lazyRefillObservationExpression = buildLazyRefillObservationExpression(',
      '  let lazyAfter = {',
    );
    proveEachMarkerRequired(runner, [
      ['shared generated-expression builder',
        'buildLazyRefillObservationExpression(\n    lazyForegroundObservationExpression,\n  );'],
    ]);
    const owner = buildLazyRefillObservationExpression(
      "(()=>({documentToken:'fixture-document',visibilityState:'visible',hidden:false,focused:true,service:null}))()",
    );
    expect(() => Function(`return ${owner};`)).not.toThrow();
    const replacementDom = new JSDOM('<div id="codexpanel"></div>', {
      runScripts: 'outside-only',
    }) as TestDom;
    replacementDom.window.eval(`window.__CF_SLICE__={api:{compendiumDiagnostics:()=>({
      panel:{mode:'list',renderCommits:0},art:{live:{queuedJobs:0,activeJobs:0}},
      lazyArt:{state:'ready'},generation:1
    })}}`);
    expect(replacementDom.window.eval(owner)).toMatchObject({
      done: false,
      sameRows: false,
    });
    replacementDom.window.close();
    const errors = (source: string): string[] => {
      const findings: string[] = [];
      if (!source.includes('d=S?.api?.compendiumDiagnostics?.()??null')) {
        findings.push('optional diagnostics');
      }
      if (!source.includes("if(!d)return {done:false,reason:'slice-document-unavailable',foreground};")) {
        findings.push('structured document loss');
      }
      if (!source.includes("srcKind:src?.startsWith('blob:')?'blob-url':src?.startsWith('data:image/')?'data-image':src?'other':null")) {
        findings.push('URL classification');
      }
      if (!source.includes('originalRows=Array.isArray(window.__cfLazyOriginalRows)')
        || !source.includes('sameRows:originalRows!==null')) {
        findings.push('replacement-document row guard');
      }
      if (!source.includes('lastError:lazyArt.lastError')) {
        findings.push('complete producer error diagnostics');
      }
      if ((source.match(/image\.srcKind==='blob-url'/gu) ?? []).length !== 2
        || source.includes("image.srcKind==='data-image'&&image.complete")) {
        findings.push('Blob-only ready predicates');
      }
      return findings;
    };
    expect(errors(owner)).toEqual([]);
    expect(errors(owner.replaceAll("image.srcKind==='blob-url'", "image.srcKind==='data-image'")))
      .toContain('Blob-only ready predicates');
    expect(errors(owner.replace(
      'd=S?.api?.compendiumDiagnostics?.()??null',
      'd=S.api.compendiumDiagnostics()',
    ))).toContain('optional diagnostics');
    expect(errors(owner.replace(
      "if(!d)return {done:false,reason:'slice-document-unavailable',foreground};",
      'if(!d)return null;',
    ))).toContain('structured document loss');
    expect(errors(owner.replace('lastError:lazyArt.lastError,', '')))
      .toContain('complete producer error diagnostics');
    expect(errors(owner.replace(
      'originalRows=Array.isArray(window.__cfLazyOriginalRows)?window.__cfLazyOriginalRows:null',
      'originalRows=window.__cfLazyOriginalRows',
    ))).toContain('replacement-document row guard');
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
