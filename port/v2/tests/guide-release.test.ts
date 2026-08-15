import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  GUIDE_TOPIC_SUPPORT,
  LEGACY_DORMANT_TOPIC_IDS,
  LEGACY_GUIDE_CATEGORIES,
  LEGACY_GUIDE_SYNC,
  V2_DEVELOPMENT_GUIDE_CAPABILITIES,
  getGuideCatalogue,
  getGuideTopic,
  searchGuide,
  type GuideTopicId,
  type LegacyGuideTopic,
} from '../apps/game/src/guide-content.js';
import {
  LEGACY_GAME_VERSION,
  LEGACY_RELEASES,
  LEGACY_RELEASE_SYNC,
  V2_CURRENT_RELEASE_VERSION,
  V2_DEVELOPMENT_VERSION,
  V2_DRAFT_RELEASE,
  V2_RELEASE_CATEGORIES,
  V2_SHIPPED_RELEASES,
  getCurrentV2Release,
  getLegacyReleaseLine,
  getReleaseHistory,
  hasUnseenV2Release,
} from '../apps/game/src/release-content.js';

const sourcePath = fileURLToPath(
  new URL('../../../celestial-frontier.html', import.meta.url),
);
const source = readFileSync(sourcePath, 'utf8');

function extractLiteral(startAnchor: string, endAnchor: string): string {
  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start);
  if (start < 0 || end < 0) {
    throw new Error(`source anchors missing: ${startAnchor} … ${endAnchor}`);
  }
  let literal = source.slice(start + startAnchor.length, end).trim();
  if (literal.endsWith(';')) literal = literal.slice(0, -1);
  return literal;
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function evaluateLiteral<T>(literal: string): T {
  const evaluated: unknown = vm.runInNewContext(
    `(${literal})`,
    Object.create(null) as object,
    { timeout: 1_000 },
  );
  return JSON.parse(JSON.stringify(evaluated)) as T;
}

const guideLiteral = extractLiteral('const GUIDE=', '\n/* v1.5:');
const releaseLiteral = extractLiteral('const RELEASES=', '\n];\nlet _rnSeen') + '\n]';

function legacyGuideTopics(): LegacyGuideTopic[] {
  const topics: LegacyGuideTopic[] = [];
  for (const category of LEGACY_GUIDE_CATEGORIES) {
    for (const topic of category.topics) topics.push(topic);
  }
  return topics;
}

describe('canonical Guide source and inventory', () => {
  it('is an exact snapshot of the mature v1.8.9 Guide literal', () => {
    expect(sha256(guideLiteral)).toBe(LEGACY_GUIDE_SYNC.sourceSha256);
    expect(evaluateLiteral(guideLiteral)).toEqual(LEGACY_GUIDE_CATEGORIES);
  });

  it('negative control: a one-word source drift breaks the content address', () => {
    const changed = guideLiteral.replace('Getting Around', 'Getting Elsewhere');
    expect(changed).not.toBe(guideLiteral);
    expect(sha256(changed)).not.toBe(LEGACY_GUIDE_SYNC.sourceSha256);
  });

  it('preserves nine categories, 43 unique authored IDs, and 41 legacy-live topics', () => {
    const topics = legacyGuideTopics();
    const ids = topics.map((topic) => topic.id);
    expect(LEGACY_GUIDE_CATEGORIES).toHaveLength(LEGACY_GUIDE_SYNC.categoryCount);
    expect(topics).toHaveLength(LEGACY_GUIDE_SYNC.authoredTopicCount);
    expect(new Set(ids).size).toBe(topics.length);
    expect(topics.filter((topic) =>
      !LEGACY_DORMANT_TOPIC_IDS.includes(topic.id as 'beacon' | 'events')),
    ).toHaveLength(LEGACY_GUIDE_SYNC.liveTopicCount);
    expect(LEGACY_DORMANT_TOPIC_IDS).toEqual(['beacon', 'events']);
    expect(Object.keys(GUIDE_TOPIC_SUPPORT).sort()).toEqual(ids.slice().sort());
  });

  it('keeps every authored cross-link on a stable, resolvable topic ID', () => {
    const topics = legacyGuideTopics();
    const ids = new Set(topics.map((topic) => topic.id));
    for (const topic of topics) {
      const links = [...topic.body.matchAll(/data-gt="([^"]+)"/g)]
        .map((match) => match[1]);
      expect(
        links.filter((id): id is string => id !== undefined)
          .filter((id) => !ids.has(id)),
        `broken Guide links from ${topic.id}`,
      ).toEqual([]);
    }
  });
});

describe('v2 Guide capability filter', () => {
  it('returns the 41 legacy-live topics without advertising dormant systems', () => {
    const categories = getGuideCatalogue();
    const topics = categories.flatMap((category) => category.topics);
    expect(categories).toHaveLength(9);
    expect(topics).toHaveLength(41);
    expect(topics.filter((topic) => topic.availability === 'available')).toHaveLength(0);
    expect(topics.filter((topic) => topic.availability === 'partial')).toHaveLength(18);
    expect(topics.filter((topic) => topic.availability === 'unavailable')).toHaveLength(23);
    expect(topics.filter((topic) => topic.availability === 'partial')
      .every((topic) => topic.body !== topic.legacyBody)).toBe(true);
    expect(topics.some((topic) => topic.id === 'beacon' || topic.id === 'events')).toBe(false);
  });

  it('uses current-slice copy for partial topics and explicit copy for unavailable topics', () => {
    const codes = getGuideTopic('codes');
    const breeding = getGuideTopic('breeding');
    expect(codes?.availability).toBe('partial');
    expect(codes?.body).toContain('not yet available');
    expect(codes?.body).toContain('selected in Search');
    expect(codes?.body).toContain('browser’s Copy command');
    expect(codes?.body).not.toContain('the identical creature, stats and all');
    expect(breeding?.availability).toBe('unavailable');
    expect(breeding?.body).toContain('Not available in this v2 development slice');
    expect(breeding?.body).not.toBe(breeding?.legacyBody);
    expect(getGuideTopic('settings')?.crossLinks).toContain('saving');
    expect(getGuideTopic('settings')?.body).toContain('Star charts');
    expect(getGuideTopic('atlas')?.body).toContain('saved galaxies, stars, and worlds');
    expect(getGuideTopic('atlas')?.body).toContain('A world entry reopens its system survey');
    expect(getGuideTopic('atlas')?.body).toContain('route coordinates are incomplete');
    expect(getGuideTopic('atlas')?.body).toContain('out-of-reach entry leaves you in place');
    expect(getGuideTopic('landing')?.body).toContain('out-of-reach route leaves you in place');
    expect(getGuideTopic('search')?.body).toContain('out-of-reach address leaves the current view unchanged');
    expect(getGuideTopic('codes')?.body).toContain('explorer stays put');
    const zoom = getGuideTopic('zoom');
    expect(zoom?.body).toContain('focus the starfield canvas');
    expect(zoom?.body).toContain('arrow keys');
    expect(zoom?.body).toContain('Enter');
    expect(zoom?.body).toContain('Space');
    expect(zoom?.body).toContain('−');
    expect(zoom?.body).toContain('first <b>Escape</b> releases it');
    expect(zoom?.body).toContain('Escape again');
    const determinism = getGuideTopic('determinism');
    expect(determinism?.availability).toBe('partial');
    expect(determinism?.body).toContain('Shared timed events and creature duels');
    expect(determinism?.body).not.toContain('duels fair, and events shared');
    expect(getGuideTopic('ascent')?.availability).toBe('partial');
    expect(getGuideTopic('ascent')?.body).toContain('first landing is the only new Charter goal progress');
    expect(getGuideTopic('ascent')?.body).toContain('Any successful Land action');
    expect(getGuideTopic('ascent')?.body).toContain('every consecutive imported chapter');
    expect(getGuideTopic('ascent')?.body).toContain('invents no missing goal, drive, reward, or reach tier');
    expect(getGuideTopic('ascent')?.body).toContain('saved reach stage');
    expect(getGuideTopic('ascent')?.body).toContain('Saved Prime Signatures');
    expect(getGuideTopic('charters')?.body).toContain('first landfall is the only new Charter goal progress');
    expect(getGuideTopic('charters')?.body).toContain('After any successful Land action');
    expect(getGuideTopic('charters')?.body).toContain('every consecutive imported chapter');
    expect(getGuideTopic('charters')?.body).toContain('saved reach stage');
    expect(getGuideTopic('charters')?.body).not.toMatch(/mine|fabricat|shipyard/i);
    expect(getGuideTopic('regions')?.body).toContain('saved reach stage');
    expect(getGuideTopic('regions')?.body).toContain('saved Prime Signature count');
    expect(getGuideTopic('achievements')?.availability).toBe('partial');
    expect(getGuideTopic('achievements')?.body).toContain('imported exploration counters');
    expect(getGuideTopic('achievements')?.body).toContain('First landfalls update');
    expect(getGuideTopic('hp')?.availability).toBe('partial');
    expect(getGuideTopic('hp')?.body).toContain('read-only expedition fact');
    expect(getGuideTopic('hp')?.body).toContain('round-trippable');
  });

  it('keeps star/drive and saved Prime-radius route boundaries truthful and distinct', () => {
    const reachableRouteTopics = ['landing', 'search', 'codes', 'charters', 'atlas', 'regions'] as const;
    const hasHonestRouteBoundaries = (body: string): boolean => {
      const charterSentence = body.match(/[^.!?]*next Charter system is not available in this development slice[^.!?]*/i)?.[0] || '';
      const primeRadiusSentence = body.match(/[^.!?]*Prime Signature radius expansion is not available in this development slice[^.!?]*/i)?.[0] || '';
      const engineeringOrMilestone = /mine|fabricat|shipyard|\bbuild\b|\bmilestone\b|\bneeded\b|\brequired\b/i;
      return charterSentence.length > 0 && primeRadiusSentence.length > 0
        && !engineeringOrMilestone.test(charterSentence)
        && !/Prime Signature radius|collect|earn|award|write/i.test(charterSentence)
        && !engineeringOrMilestone.test(primeRadiusSentence)
        && !/collect|earn|award|write|next Charter system/i.test(primeRadiusSentence);
    };
    for (const id of reachableRouteTopics) {
      const topic = getGuideTopic(id);
      expect(topic, `${id} current Guide topic missing`).toBeDefined();
      expect(topic!.body, `${id} includes unavailable engineering directions anywhere in its current support copy`)
        .not.toMatch(/mine|fabricat|shipyard|\bbuild\b/i);
      expect(hasHonestRouteBoundaries(topic!.body), `${id} conflates Charter and saved Prime-radius boundaries`)
        .toBe(true);
    }
    /* Negative controls: an old engineering instruction, a generic boundary,
       and a false Signature-collection promise must fail this same player
       visible-copy predicate. */
    expect(hasHonestRouteBoundaries(
      'This route needs a build at the Shipyard before you can continue.',
    )).toBe(false);
    expect(hasHonestRouteBoundaries(
      'This route says its next reach action is unavailable in this development slice until the required milestone is complete.',
    )).toBe(false);
    expect(hasHonestRouteBoundaries(
      'A blocked star says the next Charter system is not available in this development slice. A galaxy beyond the saved Prime Signature radius says collect Prime Signatures to expand it.',
    )).toBe(false);
    const worldCodeBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('WORLD CODES KEEP THE WHOLE DESTINATION'));
    expect(worldCodeBullet).toBeDefined();
    expect(hasHonestRouteBoundaries(worldCodeBullet!)).toBe(true);
  });

  it('keeps the player Guide scope honest about deliberately hidden dormant topics', () => {
    const visible = getGuideCatalogue().flatMap((category) => category.topics);
    expect(visible.some((topic) => topic.id === 'beacon' || topic.id === 'events')).toBe(false);
    expect(LEGACY_DORMANT_TOPIC_IDS).toEqual(['beacon', 'events']);
  });

  it('negative control: granting a capability changes the topic outcome', () => {
    const without = getGuideTopic('breeding');
    const withBreeding = getGuideTopic(
      'breeding',
      [...V2_DEVELOPMENT_GUIDE_CAPABILITIES, 'breeding'],
    );
    expect(without?.availability).toBe('unavailable');
    expect(withBreeding?.availability).toBe('available');
    expect(withBreeding?.body).toBe(withBreeding?.legacyBody);
  });

  it('can expose dormant inventory explicitly without presenting it as live', () => {
    expect(getGuideTopic('beacon')).toBeUndefined();
    const beacon = getGuideTopic('beacon', V2_DEVELOPMENT_GUIDE_CAPABILITIES, {
      includeDormant: true,
    });
    expect(beacon?.availability).toBe('dormant');
    expect(beacon?.body).toContain('Dormant in both');
  });

  it('searches stable IDs, titles, keywords, current copy, and unavailable reasons', () => {
    expect(searchGuide('bloodline').map((topic) => topic.id)).toContain('breeding');
    expect(searchGuide('protected').map((topic) => topic.id)).toContain('saving');
    expect(searchGuide('cf1').map((topic) => topic.id)).toEqual(
      expect.arrayContaining<GuideTopicId>(['search', 'codes']),
    );
  });
});

describe('legacy and v2 release channels', () => {
  it('keeps the complete v1 release history source-addressed and unchanged', () => {
    expect(sha256(releaseLiteral)).toBe(LEGACY_RELEASE_SYNC.sourceSha256);
    expect(evaluateLiteral(releaseLiteral)).toEqual(LEGACY_RELEASES);
    expect(LEGACY_RELEASES).toHaveLength(LEGACY_RELEASE_SYNC.releaseCount);
    expect(LEGACY_RELEASES[0]?.v).toBe('1.8.9');
    expect(LEGACY_RELEASES.at(-1)?.v).toBe('1.0');
    const bullets = LEGACY_RELEASES.reduce((total, release) =>
      total + release.sections.reduce((subtotal, section) =>
        subtotal + section[1].length, 0), 0);
    expect(bullets).toBe(LEGACY_RELEASE_SYNC.bulletCount);
    expect(LEGACY_GAME_VERSION).toBe(LEGACY_RELEASE_SYNC.sourceGameVersion);
  });

  it('negative control: a changed legacy bulletin breaks the content address', () => {
    const changed = releaseLiteral.replace('One Measure', 'Another Measure');
    expect(changed).not.toBe(releaseLiteral);
    expect(sha256(changed)).not.toBe(LEGACY_RELEASE_SYNC.sourceSha256);
  });

  it('preserves the mature latest-popup minor-line selection rule', () => {
    expect(getLegacyReleaseLine().map((release) => release.v)).toEqual([
      '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5',
      '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8.0',
    ]);
  });

  it('keeps the v2.0 development identity separate from the production release channel', () => {
    expect(V2_DEVELOPMENT_VERSION).toBe('2.0');
    expect(V2_DRAFT_RELEASE.status).toBe('draft');
    expect(V2_DRAFT_RELEASE.id).toBe('v2-development');
    expect(V2_DRAFT_RELEASE.version).toBe(V2_DEVELOPMENT_VERSION);
    expect(V2_DRAFT_RELEASE.title).toBe('A New Foundation');
    expect(V2_DRAFT_RELEASE.date).toBe('Unreleased');
    expect(V2_CURRENT_RELEASE_VERSION).toBeNull();
    expect(V2_SHIPPED_RELEASES).toEqual([]);
    expect(getCurrentV2Release()).toBeUndefined();
    expect(hasUnseenV2Release(undefined)).toBe(false);
    expect(hasUnseenV2Release('1.8.9')).toBe(false);
  });

  it('keeps the cumulative v2.0 bulletin structured, unique, and bound to key outcomes', () => {
    const expectedCategories = [
      'New Features & Systems', 'UI Enhancements', 'Gameplay', 'Bug Fixes', 'Under the Hood',
    ];
    const requiredCopy = [
      /TypeScript and Pixi v2 development build/,
      /Star Atlas, read-only Compendium, Records, Charters, Settings, Field Training/,
      /exactly one 44-pixel top-right Close action/,
      /Spacing inside either desktop rail belongs to that command deck and leaves the active panel open/,
      /a genuine empty-sky press still dismisses it/,
      /bottom-right dock edge/,
      /CF1 addresses preserve galaxy, star, planet, coordinates/,
      /Six real lessons/,
      /Only a world’s first landing banks the live landfall objective/,
      /no longer show a player-facing Spectral class row/,
      /primary chip and Charter board show only real landfall objectives/,
      /Saturated veteran Charter records no longer wedge/,
      /All 56 v1 releases and 398 legacy bullets/,
      /successful develop push battery/,
      /mechanics that are not yet playable are labelled instead of promised/,
      /Automated lenses still do not replace human play/,
      /production remains the v1\.8\.9 main-branch site/,
    ];
    const forbiddenOverclaims = [
      /\b(?:mining|crafting|combat|capture|breeding)\b[^.!?]{0,80}\b(?:is|are)\s+(?:now\s+)?(?:playable|available|live)\b/i,
      /\bv2(?:\.0)?\s+(?:port|game|build)\s+(?:is\s+)?(?:complete|finished|production[- ]ready|fully ported)\b/i,
      /\b(?:all|every)\s+legacy\s+(?:system|mechanic|feature)s?\b[^.!?]{0,80}\b(?:ported|playable|available|live)\b/i,
    ];
    const bulletinOutcome = (sections: readonly {
      readonly category: string;
      readonly bullets: readonly string[];
    }[]) => {
      const categories = sections.map((section) => section.category);
      const bullets = sections.flatMap((section) => section.bullets);
      const copy = bullets.join('\n');
      return {
        categories: JSON.stringify(categories) === JSON.stringify(expectedCategories),
        canonical: categories.every((category) => V2_RELEASE_CATEGORIES.includes(category as never)),
        inventory: bullets.length === 44,
        populated: sections.every((section) => section.bullets.length > 0)
          && bullets.every((bullet) => bullet.length > 0 && bullet === bullet.trim())
          && new Set(bullets).size === bullets.length,
        required: requiredCopy.every((pattern) => pattern.test(copy)),
        honest: forbiddenOverclaims.every((pattern) => !pattern.test(copy)),
      };
    };
    const outcome = bulletinOutcome(V2_DRAFT_RELEASE.sections);
    expect(outcome).toEqual({
      categories: true, canonical: true, inventory: true, populated: true, required: true, honest: true,
    });

    const reordered = [...V2_DRAFT_RELEASE.sections];
    [reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!];
    expect(bulletinOutcome(reordered).categories).toBe(false);
    const missingMiddle = V2_DRAFT_RELEASE.sections.map((section, index) => ({
      category: section.category,
      bullets: index === 1 ? section.bullets.filter((_, bulletIndex) => bulletIndex !== 3) : section.bullets,
    }));
    expect(bulletinOutcome(missingMiddle).inventory).toBe(false);
    const missingRequired = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'Automated lenses still do not replace human play.',
        'Automated evidence boundary removed.',
      )),
    }));
    expect(bulletinOutcome(missingRequired).required).toBe(false);
    const missingCloseContract = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'exactly one 44-pixel top-right Close action',
        'Close-action outcome removed',
      )),
    }));
    expect(bulletinOutcome(missingCloseContract).required).toBe(false);
    const missingRailBoundary = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'leaves the active panel open',
        'rail preservation outcome removed',
      )),
    }));
    expect(bulletinOutcome(missingRailBoundary).required).toBe(false);
    const missingEmptySky = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'a genuine empty-sky press still dismisses it',
        'empty-sky dismissal outcome removed',
      )),
    }));
    expect(bulletinOutcome(missingEmptySky).required).toBe(false);
    const injectedOverclaim = V2_DRAFT_RELEASE.sections.map((section, sectionIndex) => ({
      category: section.category,
      bullets: section.bullets.map((bullet, bulletIndex) => (
        sectionIndex === 0 && bulletIndex === 1 ? 'Mining is now playable.' : bullet
      )),
    }));
    const overclaimOutcome = bulletinOutcome(injectedOverclaim);
    expect(overclaimOutcome).toMatchObject({
      categories: true, canonical: true, inventory: true, populated: true, required: true, honest: false,
    });
  });

  it('positive control: an injected shipped bulletin obeys the one-time decision without authorizing a version', () => {
    const fixture = Object.freeze({
      status: 'shipped' as const,
      version: '2.0.0-test',
      title: 'Test bulletin',
      date: 'Test only',
      sections: Object.freeze([{ category: 'Under the Hood' as const, bullets: Object.freeze(['fixture']) }]),
    });
    const current = getCurrentV2Release(fixture.version, [fixture]);
    expect(current).toBe(fixture);
    expect(hasUnseenV2Release(undefined, current)).toBe(true);
    expect(hasUnseenV2Release('2.0.0-test', current)).toBe(false);
    expect(V2_CURRENT_RELEASE_VERSION).toBeNull();
    expect(V2_SHIPPED_RELEASES).toEqual([]);
  });

  it('shows immutable legacy history by default and draft copy only by opt-in', () => {
    const player = getReleaseHistory();
    expect(player).toHaveLength(56);
    expect(player.every((release) => release.status === 'legacy')).toBe(true);
    const development = getReleaseHistory({ includeDraft: true });
    expect(development).toHaveLength(57);
    expect(development[0]?.status).toBe('draft');
    expect(development[0]?.version).toBe('2.0');
    expect(development[1]?.version).toBe('1.8.9');
  });
});
