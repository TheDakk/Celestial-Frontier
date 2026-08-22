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

const TRAINING_RESTORE_CONTRADICTIONS = Object.freeze([
  /\balways\b[^.!?]{0,80}\brestor(?:e|es|ed)\b[^.!?]{0,40}\bimmediately\b/i,
  /verification[^.!?]{0,48}pauses?[^.!?]{0,72}(?:clear|discard|lose)s?[^.!?]{0,48}(?:view|location)/i,
  /verification[^.!?]{0,48}pauses?[^.!?]{0,96}(?:view|location)[^.!?]{0,48}(?:cleared|discarded|lost)/i,
  /(?:reload|retry|restarts?|resumes?)[^.!?]{0,72}(?:Earth|surface|finish(?:ed)? (?:world|location)|last location)/i,
  /verification pauses[^.!?]{0,160}reload safely restarts Field Training from proven Sol/i,
]);

const TRAINING_LEGACY_RECOVERY_CONTRADICTIONS = Object.freeze([
  /(?:older|legacy)[^.!?]{0,96}(?:checkpoint|Training)[^.!?]{0,96}(?:whole|entire) (?:save|expedition)/i,
  /(?:older|legacy)[^.!?]{0,96}checkpoint[^.!?]{0,96}restor(?:e|es|ed)[^.!?]{0,48}pre-Training view/i,
  /(?:unrecognized|unknown) checkpoint[^.!?]{0,120}(?:close|dismiss|continue|keep playing|keep exploring)/i,
  /(?:unrecognized|unknown) checkpoint[^.!?]{0,120}(?:discard|clear|overwrite|silently ignore)/i,
]);

const COMPENDIUM_COPY_CONTRADICTIONS = Object.freeze([
  /(?:mounts?|renders?|loads?|keeps?)[^.!?]{0,80}\b(?:all|every)\b[^.!?]{0,40}\b1,?500\b/i,
  /(?:132px|thumbnail)[^.!?]{0,80}(?:displayed )?(?:name|seed)[^.!?]{0,40}(?:alone|only)/i,
  /(?:list|Planetside)[^.!?]{0,48}(?:uses?|renders?|loads?|keeps?)[^.!?]{0,32}(?:440px|440-pixel)/i,
  /(?:lease|thumbnail)[^.!?]{0,80}(?:remain|stay|kept|pinned)[^.!?]{0,40}(?:after|when)[^.!?]{0,40}(?:Close|leave|unmount|filter)/i,
  /(?:capture|feeding|breeding|husbandry|renaming)[^.!?]{0,72}(?:is|are) (?:now )?(?:live|playable|available)/i,
]);

const SHIPYARD_COPY_CONTRADICTIONS = Object.freeze([
  /(?:current|read-only) Shipyard[^.!?]{0,80}\bcan\b[^.!?]{0,40}(?:build|buy|research|upgrade|equip|salvage|reward|change)/i,
  /(?:Fabricator|Research Bench|ship upgrades?)[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)/i,
  /legacy charter refit[^.!?]{0,96}(?:names|draws|includes) (?:(?:an?|the) )?(?:unowned |missing )?Intergalactic Drive/i,
  /hardpoints?[^.!?]{0,80}(?:inferred|assumed|granted) from (?:the )?(?:chassis|stage|reach)/i,
  /(?:chassis|visual state)[^.!?]{0,80}(?:saved separately|separate saved state|writes? to the save)/i,
]);

const HD_ATTACHMENT_COPY_CONTRADICTIONS = Object.freeze([
  /release(?:s|d)? the (?:displayed )?predecessor[^.!?]{0,64}before[^.!?]{0,64}(?:acquir|publish)/i,
  /stale (?:work|completion)[^.!?]{0,64}(?:can|may|will|does) publish/i,
  /(?:timer|lease|texture)[^.!?]{0,80}(?:remain|stay|kept|pinned)[^.!?]{0,48}after[^.!?]{0,32}(?:scene|surface|dispose|teardown)/i,
]);

function plainCopy(body: string): string {
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shipyardGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Shipyard[^.!?]{0,48}read-only inspection/i.test(copy)
    && /canonical saved reach and actual owned systems/i.test(copy)
    && /same derived capability state as travel/i.test(copy)
    && /no separate visual state is saved/i.test(copy)
    && /Scout\/Chemical[^.!?]{0,48}Jump\/Interstellar[^.!?]{0,48}Survey Cruiser[^.!?]{0,48}Frontier\/IG/i.test(copy)
    && /Only systems and hardpoints actually present in the saved inventory are named and drawn/i.test(copy)
    && /completed Charter proves frontier reach while no Intergalactic Drive is owned/i.test(copy)
    && /honest legacy charter refit[^.!?]{0,80}generic long-range chassis/i.test(copy)
    && /never names or draws the unowned drive or any unowned hardpoint/i.test(copy)
    && /Fabricator, Research Bench purchases and prerequisites, ship upgrades[^.!?]{0,160}all inventory writers remain unavailable/i.test(copy)
    && /current Shipyard cannot build, buy, research, equip, salvage, reward, or change the expedition/i.test(copy)
    && SHIPYARD_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function shipyardReleaseCopyIsTruthful(body: string): boolean {
  return /SHIPYARD READS CAPABILITY, NOT WISHES/i.test(body)
    && /read-only Shipyard derives its Scout\/Chemical, Jump\/Interstellar, Survey Cruiser, or Frontier\/IG chassis/i.test(body)
    && /same canonical saved reach used by travel/i.test(body)
    && /shows only actually owned systems and hardpoints/i.test(body)
    && /completed veteran Charter without an owned Intergalactic Drive/i.test(body)
    && /honest generic legacy charter refit/i.test(body)
    && /never names or draws the missing drive/i.test(body)
    && /fabrication, Research Bench purchases, and upgrades remain unavailable/i.test(body)
    && SHIPYARD_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function hdAttachmentReleaseCopyIsTruthful(body: string): boolean {
  return /HD SURFACES HAVE ONE NAMED OWNER/i.test(body)
    && /named HD surface-planet texture attachment/i.test(body)
    && /exact surface generation and planet identity/i.test(body)
    && /retains the displayed predecessor until an acquired successor publishes/i.test(body)
    && /rejects stale work/i.test(body)
    && /suppresses same-texture swaps/i.test(body)
    && /cancels and releases its timer and leases at the owning scene boundary/i.test(body)
    && HD_ATTACHMENT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function compendiumCatalogueCopyIsTruthful(body: string): boolean {
  return /read-only <b>Compendium<\/b> presents up to 1,500 logical entries/i.test(body)
    && /Search filters those saved records/i.test(body)
    && /count reports the logical matches/i.test(body)
    && /choosing a row opens its detail/i.test(body)
    && /mounts the visible viewport plus half a viewport of overscan on each side \(about two viewports total\)/i.test(body)
    && /plus at most the focused pinned row/i.test(body)
    && /neutral placeholder/i.test(body)
    && /exact <b>132px<\/b> thumbnail/i.test(body)
    && /complete genome[^.!?]{0,80}not only the displayed name or seed[^.!?]{0,80}owns visual identity/i.test(body)
    && /Planetside shares the same bounded thumbnail lease path/i.test(body)
    && /thumbnails are released when their visible owner leaves/i.test(body)
    && /Discovery, capture, husbandry, renaming, and other collection-writing actions remain unavailable/i.test(body)
    && COMPENDIUM_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function specimenDetailCopyIsTruthful(body: string): boolean {
  return /exact <b>440px<\/b> portrait/i.test(body)
    && /same complete-genome identity as its exact 132px list thumbnail/i.test(body)
    && /440px image is reserved for this detail rather than the list or Planetside/i.test(body)
    && /<b>Back<\/b> returns to the saved list position and restores focus to the same logical row/i.test(body)
    && /<b>Close<\/b> returns focus to the exact Compendium opener/i.test(body)
    && /profile remains read-only/i.test(body)
    && /Capture, feeding, breeding, dueling, Field Scout selection, injury care, renaming, CFB actions, and other husbandry or collection-writing outcomes are deliberately absent/i.test(body)
    && COMPENDIUM_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function compendiumArtReleaseCopyIsTruthful(body: string): boolean {
  return /ART ARRIVES WHEN IT IS NEEDED/i.test(body)
    && /Species art loads on demand/i.test(body)
    && /up to 1,500 logical entries while mounting the visible viewport plus half a viewport of overscan on each side \(about two viewports total\), plus at most the focused pinned row/i.test(body)
    && /neutral placeholder to an exact 132px thumbnail keyed by the complete genome/i.test(body)
    && /Search filters the logical count/i.test(body)
    && /Back restores the saved row and focus/i.test(body)
    && /Close returns focus to the exact opener/i.test(body)
    && /Planetside shares the same bounded thumbnail lease path/i.test(body)
    && /leases release with their visible owners/i.test(body)
    && /only specimen detail publishes and retains an exact 440px portrait/i.test(body)
    && /thumbnail scratch art is downsampled to 132px before it crosses the worker boundary/i.test(body)
    && COMPENDIUM_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function trainingRestoreCopyIsTruthful(body: string): boolean {
  return /normal Finish or Skip source-verifies and immediately restores the exact pre-Training view/i.test(body)
    && /If verification pauses, that exact view stays saved/i.test(body)
    && /when Sol can still be verified, Training returns there/i.test(body)
    && /reload can restart safely and retry/i.test(body)
    && /Older v1\.8\.9 Training checkpoints restore only the eleven pre-drill record groups they captured/i.test(body)
    && /every other expedition field is retained from the surrounding save/i.test(body)
    && /That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth/i.test(body)
    && /An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen/i.test(body)
    && /leaves the stored expedition unchanged/i.test(body)
    && /reload after updating, or import a trusted complete expedition/i.test(body)
    && TRAINING_RESTORE_CONTRADICTIONS.every((pattern) => !pattern.test(body))
    && TRAINING_LEGACY_RECOVERY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
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
    expect(topics.filter((topic) => topic.availability === 'partial')).toHaveLength(19);
    expect(topics.filter((topic) => topic.availability === 'unavailable')).toHaveLength(22);
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
    expect(getGuideTopic('atlas')?.body).toContain('source-verified destination');
    expect(getGuideTopic('atlas')?.body).toContain('stale, forged, or incomplete');
    expect(getGuideTopic('atlas')?.body).toContain('visible but disabled');
    expect(getGuideTopic('atlas')?.body).toContain('out-of-reach entry leaves you in place');
    expect(getGuideTopic('landing')?.body).toContain('out-of-reach route leaves you in place');
    expect(getGuideTopic('search')?.body).toContain('out-of-reach address leaves the current view unchanged');
    expect(getGuideTopic('search')?.body).toContain('keeps the exact query in Search');
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
    expect(determinism?.body).toContain('accepts only a source-verified match');
    expect(determinism?.body).toContain('Shared timed events and creature duels');
    expect(determinism?.body).not.toContain('duels fair, and events shared');
    expect(getGuideTopic('saving')?.body).toContain('returns safely to <b>Cosmos</b>');
    expect(getGuideTopic('saving')?.body).toContain('without losing the rest of your expedition progress');
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

  it('exposes only honest read-only Shipyard inspection and keeps every writer unavailable', () => {
    const research = getGuideTopic('research');
    const crafting = getGuideTopic('crafting');
    const shipyardBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('SHIPYARD READS CAPABILITY, NOT WISHES'));
    const attachmentBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('HD SURFACES HAVE ONE NAMED OWNER'));

    expect(research?.availability).toBe('partial');
    expect(shipyardGuideCopyIsTruthful(research!.body)).toBe(true);
    expect(crafting?.availability).toBe('unavailable');
    for (const id of ['stardust', 'harvest', 'mining', 'skimming', 'crafting'] as const) {
      expect(getGuideTopic(id)?.availability, `${id} writer/faucet became available`)
        .toBe('unavailable');
    }
    expect(shipyardBullet).toBeDefined();
    expect(shipyardReleaseCopyIsTruthful(shipyardBullet!)).toBe(true);
    expect(attachmentBullet).toBeDefined();
    expect(hdAttachmentReleaseCopyIsTruthful(attachmentBullet!)).toBe(true);

    expect(shipyardGuideCopyIsTruthful(
      research!.body + ' The current Shipyard can build and upgrade the ship.',
    )).toBe(false);
    expect(shipyardGuideCopyIsTruthful(
      research!.body + ' The legacy charter refit names an unowned Intergalactic Drive.',
    )).toBe(false);
    expect(shipyardGuideCopyIsTruthful(
      research!.body.replace(
        'Only systems and hardpoints actually present in the saved inventory are named and drawn',
        'Hardpoints are inferred from the chassis stage',
      ),
    )).toBe(false);
    expect(shipyardReleaseCopyIsTruthful(
      shipyardBullet! + ' The Research Bench is now available.',
    )).toBe(false);
    expect(shipyardReleaseCopyIsTruthful(
      shipyardBullet! + ' The legacy charter refit draws the missing Intergalactic Drive.',
    )).toBe(false);
    expect(hdAttachmentReleaseCopyIsTruthful(
      attachmentBullet!.replace(
        'retains the displayed predecessor until an acquired successor publishes',
        'releases the displayed predecessor before a successor publishes',
      ),
    )).toBe(false);
    expect(hdAttachmentReleaseCopyIsTruthful(
      attachmentBullet! + ' Stale work may publish after the surface changes.',
    )).toBe(false);
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

  it('makes source verification, correction, Atlas disablement, and field-local save recovery explicit', () => {
    const trustsUnprovenRoute = (body: string): boolean =>
      /(?:trusts?|accepts?)[^.!?]{0,72}(?:stored|caller-supplied|code) (?:coordinates|bytes|parents?)/i.test(body)
      || /(?:stored|caller-supplied|code) (?:coordinates|bytes|parents?)[^.!?]{0,40}(?:authoritative|trusted)/i.test(body);
    const contradictsCorrection = (body: string): boolean =>
      /(?:lands? immediately|automatically lands?|replaces? the current view|clears? the (?:exact )?query)/i.test(body);
    const enablesUnprovenAtlasRow = (body: string): boolean =>
      /(?:disabled|stale|forged|incomplete) (?:rows?|entries?)[^.!?]{0,48}(?:can|may|will|still) travel/i.test(body)
      || /(?:enabled|travels?) anyway/i.test(body);
    const rollsBackWholeSave = (body: string): boolean =>
      /(?:whole|entire) (?:save|expedition)[^.!?]{0,72}(?:corrupt|rolls? back|rollback|is lost)/i.test(body)
      || /rolls? back[^.!?]{0,72}(?:the )?expedition progress/i.test(body);
    const sourceVerifiesEveryLevel = (body: string): boolean =>
      /galaxy, star, or planet/i.test(body)
      && /regenerat(?:e|es|ed)/i.test(body)
      && /source-verified/i.test(body)
      && !trustsUnprovenRoute(body);
    const rejectedCodePreservesCorrection = (body: string): boolean =>
      /stale or forged code/i.test(body)
      && /current view unchanged/i.test(body)
      && /exact query[^.!?]*(?:Search|unchanged)/i.test(body)
      && !contradictsCorrection(body);
    const atlasNeedsProof = (body: string): boolean =>
      /proven(?: planet)? entry/i.test(body)
      && /stale, forged, or incomplete/i.test(body)
      && /visible but disabled/i.test(body)
      && /Land remains (?:separate|explicit)/i.test(body)
      && !enablesUnprovenAtlasRow(body)
      && !contradictsCorrection(body);
    const staleSavedLocationIsFieldLocal = (body: string): boolean =>
      /saved galaxy, star, or planet location/i.test(body)
      && /stale, forged, or incomplete/i.test(body)
      && /returns safely to <b>Cosmos<\/b>/i.test(body)
      && /without losing[^.!?]*expedition progress/i.test(body)
      && !rollsBackWholeSave(body);

    for (const id of ['landing', 'search', 'codes', 'atlas', 'determinism', 'saving'] as const) {
      const topic = getGuideTopic(id);
      expect(topic, `${id} current Guide topic missing`).toBeDefined();
      expect(sourceVerifiesEveryLevel(topic!.body), `${id} trusts route bytes or omits a hierarchy level`)
        .toBe(true);
    }
    expect(rejectedCodePreservesCorrection(getGuideTopic('search')!.body)).toBe(true);
    expect(rejectedCodePreservesCorrection(getGuideTopic('codes')!.body)).toBe(true);
    expect(atlasNeedsProof(getGuideTopic('atlas')!.body)).toBe(true);
    expect(staleSavedLocationIsFieldLocal(getGuideTopic('saving')!.body)).toBe(true);
    expect(getGuideTopic('landing')!.body).toContain('it never lands for you');
    expect(getGuideTopic('landing')!.body).toContain('Press <b>Land</b>');
    expect(getGuideTopic('search')!.body).toContain('<b>Land</b> remains a separate choice');
    expect(getGuideTopic('codes')!.body).toContain('never bypasses the Land action');
    expect(getGuideTopic('atlas')!.body).toContain('Land remains separate');

    const worldCodeBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('WORLD CODES KEEP THE WHOLE DESTINATION'))!;
    const atlasBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('THE ATLAS LEADS BACK'))!;
    expect(sourceVerifiesEveryLevel(worldCodeBullet)).toBe(true);
    expect(rejectedCodePreservesCorrection(worldCodeBullet)).toBe(true);
    expect(worldCodeBullet).toContain('without bypassing Land');
    expect(atlasNeedsProof(atlasBullet)).toBe(true);

    /* Semantic negative controls: the former structural-only copy, a direct-
       landing overclaim, the old coordinate-completeness Atlas rule, and a
       whole-save rollback claim must each fail the same player-copy laws. */
    const staleOldSearchCopy = 'A valid world address inside reach reopens its system survey. An out-of-reach address leaves the current view unchanged.';
    expect(sourceVerifiesEveryLevel(staleOldSearchCopy)).toBe(false);
    expect(rejectedCodePreservesCorrection(staleOldSearchCopy)).toBe(false);
    expect(rejectedCodePreservesCorrection(
      'Every galaxy, star, or planet code is regenerated and source-verified. A stale or forged code lands immediately and replaces the current view.',
    )).toBe(false);
    expect(atlasNeedsProof(
      'A complete Atlas entry travels. An incomplete imported route stays listed with an unavailable label.',
    )).toBe(false);
    expect(staleSavedLocationIsFieldLocal(
      'A saved galaxy, star, or planet location is regenerated and source-verified. A stale, forged, or incomplete route makes the whole save corrupt and rolls back expedition progress.',
    )).toBe(false);
    const validSearch = getGuideTopic('search')!.body;
    const validAtlas = getGuideTopic('atlas')!.body;
    const validSaving = getGuideTopic('saving')!.body;
    expect(sourceVerifiesEveryLevel(
      validSearch + ' Caller-supplied coordinates remain authoritative.',
    )).toBe(false);
    expect(rejectedCodePreservesCorrection(
      validSearch + ' A stale code then lands immediately and replaces the current view.',
    )).toBe(false);
    expect(atlasNeedsProof(
      validAtlas + ' Disabled rows can still travel.',
    )).toBe(false);
    expect(staleSavedLocationIsFieldLocal(
      validSaving + ' The whole expedition then rolls back.',
    )).toBe(false);
    expect(rejectedCodePreservesCorrection(
      worldCodeBullet + ' A stale code then lands immediately.',
    )).toBe(false);
    expect(atlasNeedsProof(
      atlasBullet + ' Disabled rows can still travel.',
    )).toBe(false);
  });

  it('qualifies current and legacy Field Training restore plus persistent recovery', () => {
    const settings = getGuideTopic('settings')!.body;
    const saving = getGuideTopic('saving')!.body;
    const trainingBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('FIELD TRAINING LIVES IN THE NEW SHELL'));

    expect(trainingBullet).toBeDefined();
    expect(trainingRestoreCopyIsTruthful(settings)).toBe(true);
    expect(trainingRestoreCopyIsTruthful(saving)).toBe(true);
    expect(trainingRestoreCopyIsTruthful(trainingBullet!)).toBe(true);

    /* Bidirectional semantic controls: the former unconditional sentence,
       plus contradictions appended to otherwise-valid copy, must turn the
       same predicate red without relying on a missing anchor alone. */
    expect(trainingRestoreCopyIsTruthful(
      'Restart begins the current drill in Sol and restores the pre-training view when it finishes or is skipped.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      settings + ' Finish or Skip always restores immediately, even when verification pauses.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      saving + ' If verification pauses, the exact pre-Training view is discarded.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      settings + ' If verification pauses, a reload safely restarts Field Training from proven Sol.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      trainingBullet! + ' The retry restarts from Earth surface.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      settings + ' Older Training checkpoints restore the entire expedition.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      saving + ' An unrecognized checkpoint can close recovery and continue exploring.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      settings + ' An older checkpoint restores the pre-Training view.',
    )).toBe(false);
    expect(trainingRestoreCopyIsTruthful(
      trainingBullet!.replace(
        'every other expedition field is retained from the surrounding save',
        'surrounding expedition ownership omitted',
      ),
    )).toBe(false);
  });

  it('documents the bounded Compendium art, virtualization, and focus contract without collection-writer overclaims', () => {
    const kingdoms = getGuideTopic('kingdoms')!.body;
    const specimen = getGuideTopic('specimen')!.body;
    const artBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('ART ARRIVES WHEN IT IS NEEDED'));

    expect(artBullet).toBeDefined();
    expect(compendiumCatalogueCopyIsTruthful(kingdoms)).toBe(true);
    expect(specimenDetailCopyIsTruthful(specimen)).toBe(true);
    expect(compendiumArtReleaseCopyIsTruthful(artBullet!)).toBe(true);

    /* Bidirectional controls: pre-Arc-1A copy and required-contract removal
       must fail, and an appended contradictory behavior must also turn the
       same semantic predicate red. */
    expect(compendiumCatalogueCopyIsTruthful(
      'The Compendium reads the expedition\'s discovered life. Choose a row to inspect its deterministic portrait.',
    )).toBe(false);
    expect(compendiumCatalogueCopyIsTruthful(
      kingdoms.replace('mounts the visible viewport plus half a viewport of overscan on each side (about two viewports total), plus at most the focused pinned row', 'shows a long scrolling list'),
    )).toBe(false);
    expect(compendiumCatalogueCopyIsTruthful(
      kingdoms + ' The Compendium mounts all 1,500 portraits at once.',
    )).toBe(false);
    expect(specimenDetailCopyIsTruthful(
      specimen.replace('Close</b> returns focus to the exact Compendium opener', 'Close</b> dismisses the panel'),
    )).toBe(false);
    expect(specimenDetailCopyIsTruthful(
      specimen + ' Planetside renders a 440px portrait for every row.',
    )).toBe(false);
    expect(compendiumArtReleaseCopyIsTruthful(
      'ART ARRIVES WHEN IT IS NEEDED: The large species-art payload loads lazily for Compendium or Planetside and retains only the latest subscriber per surface.',
    )).toBe(false);
    expect(compendiumArtReleaseCopyIsTruthful(
      artBullet!.replace('keyed by the complete genome', 'keyed by the displayed name'),
    )).toBe(false);
    expect(compendiumArtReleaseCopyIsTruthful(
      artBullet!.replace(
        'only specimen detail publishes and retains an exact 440px portrait',
        'specimen detail can show a 440px portrait',
      ),
    )).toBe(false);
    expect(compendiumArtReleaseCopyIsTruthful(
      artBullet!.replace(
        'thumbnail scratch art is downsampled to 132px before it crosses the worker boundary',
        'thumbnail scratch art crosses the worker boundary',
      ),
    )).toBe(false);
    expect(compendiumArtReleaseCopyIsTruthful(
      artBullet! + ' Thumbnail leases remain pinned after Close.',
    )).toBe(false);
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
      /Every accepted galaxy, star, or planet route is regenerated from the seeded universe and source-verified/,
      /Stale, forged, or incomplete rows remain visible but disabled/,
      /Six real lessons/,
      /A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view/,
      /if verification pauses, that exact view stays saved, and when Sol can still be verified, Training returns there so a reload can restart safely and retry/,
      /Older v1\.8\.9 Training checkpoints restore only the eleven pre-drill record groups they captured/,
      /every other expedition field is retained from the surrounding save/,
      /That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth/,
      /An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged/,
      /reload after updating, or import a trusted complete expedition/,
      /Only a world’s first landing banks the live landfall objective/,
      /no longer show a player-facing Spectral class row/,
      /primary chip and Charter board show only real landfall objectives/,
      /Saturated veteran Charter records no longer wedge/,
      /All 56 v1 releases and 398 legacy bullets/,
      /successful develop push battery/,
      /mechanics that are not yet playable are labelled instead of promised/,
      /up to 1,500 logical entries while mounting the visible viewport plus half a viewport of overscan on each side \(about two viewports total\), plus at most the focused pinned row/,
      /neutral placeholder to an exact 132px thumbnail keyed by the complete genome/,
      /Planetside shares the same bounded thumbnail lease path/,
      /only specimen detail publishes and retains an exact 440px portrait/,
      /thumbnail scratch art is downsampled to 132px before it crosses the worker boundary/,
      /Opening the Compendium now gives its variable-height rows a full safe-height left workspace while Search, Survey, and the dock remain visible and usable in a separate right column/,
      /Loading and painting the first specimen thumbnails now happens away from the renderer thread/,
      /A dedicated worker imports the heavy portrait graph only after a real owner and a serviced boot turn/,
      /terminates an idle or replaced producer without a synchronous renderer fallback/,
      /SHIPYARD READS CAPABILITY, NOT WISHES/,
      /same canonical saved reach used by travel/,
      /shows only actually owned systems and hardpoints/,
      /honest generic legacy charter refit/,
      /fabrication, Research Bench purchases, and upgrades remain unavailable/,
      /named HD surface-planet texture attachment/,
      /retains the displayed predecessor until an acquired successor publishes/,
      /Automated lenses still do not replace human play/,
      /production remains the v1\.8\.9 main-branch site/,
    ];
    const forbiddenOverclaims = [
      /\b(?:mining|crafting|combat|capture|breeding)\b[^.!?]{0,80}\b(?:is|are)\s+(?:now\s+)?(?:playable|available|live)\b/i,
      /\bv2(?:\.0)?\s+(?:port|game|build)\s+(?:is\s+)?(?:complete|finished|production[- ]ready|fully ported)\b/i,
      /\b(?:all|every)\s+legacy\s+(?:system|mechanic|feature)s?\b[^.!?]{0,80}\b(?:ported|playable|available|live)\b/i,
      /(?:stale|forged) code[^.!?]{0,80}(?:lands? immediately|automatically lands?|replaces? the current view|clears? the (?:exact )?query)/i,
      /(?:disabled|stale|forged|incomplete) (?:rows?|entries?)[^.!?]{0,48}(?:can|may|will|still) travel/i,
      /(?:stored|caller-supplied|code) (?:coordinates|bytes|parents?)[^.!?]{0,48}(?:authoritative|trusted)/i,
      /(?:whole|entire) (?:save|expedition)[^.!?]{0,80}(?:corrupt|rolls? back|rollback|is lost)/i,
      ...TRAINING_RESTORE_CONTRADICTIONS,
      ...TRAINING_LEGACY_RECOVERY_CONTRADICTIONS,
      ...COMPENDIUM_COPY_CONTRADICTIONS,
      ...SHIPYARD_COPY_CONTRADICTIONS,
      ...HD_ATTACHMENT_COPY_CONTRADICTIONS,
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
        inventory: bullets.length === 49,
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
    const missingLandscapeWorkspace = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'while Search, Survey, and the dock remain visible and usable in a separate right column',
        'with a compact phone-landscape arrangement',
      )),
    }));
    expect(bulletinOutcome(missingLandscapeWorkspace).required).toBe(false);
    const missingWorkerBoundary = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'terminates an idle or replaced producer without a synchronous renderer fallback',
        'keeps a background painter available',
      )),
    }));
    expect(bulletinOutcome(missingWorkerBoundary).required).toBe(false);
    const staleRouteProof = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'Every accepted galaxy, star, or planet route is regenerated from the seeded universe and source-verified',
        'Every complete route is accepted from its stored coordinates',
      )),
    }));
    expect(bulletinOutcome(staleRouteProof).required).toBe(false);
    const staleTrainingRestore = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('FIELD TRAINING LIVES IN THE NEW SHELL')
        ? bullet.replace(
          'A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view',
          'Finish or Skip restores the pre-training view',
        )
        : bullet),
    }));
    expect(bulletinOutcome(staleTrainingRestore).required).toBe(false);
    const contradictoryTrainingRestore = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('FIELD TRAINING LIVES IN THE NEW SHELL')
        ? bullet + ' If verification pauses, a reload safely restarts Field Training from proven Sol.'
        : bullet),
    }));
    expect(bulletinOutcome(contradictoryTrainingRestore)).toMatchObject({ required: true, honest: false });
    const staleLegacyOwnership = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('FIELD TRAINING LIVES IN THE NEW SHELL')
        ? bullet.replace(
          'every other expedition field is retained from the surrounding save',
          'surrounding expedition ownership omitted',
        )
        : bullet),
    }));
    expect(bulletinOutcome(staleLegacyOwnership).required).toBe(false);
    const contradictoryLegacyRecovery = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('FIELD TRAINING LIVES IN THE NEW SHELL')
        ? bullet + ' An unrecognized checkpoint can close recovery and continue exploring.'
        : bullet),
    }));
    expect(bulletinOutcome(contradictoryLegacyRecovery)).toMatchObject({ required: true, honest: false });
    const contradictoryWorldCode = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('WORLD CODES KEEP THE WHOLE DESTINATION')
        ? bullet + ' A stale code then lands immediately and replaces the current view.'
        : bullet),
    }));
    expect(bulletinOutcome(contradictoryWorldCode)).toMatchObject({ required: true, honest: false });
    const contradictoryAtlas = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('THE ATLAS LEADS BACK')
        ? bullet + ' Disabled rows can still travel.'
        : bullet),
    }));
    expect(bulletinOutcome(contradictoryAtlas)).toMatchObject({ required: true, honest: false });
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
