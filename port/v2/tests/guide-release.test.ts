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

const DORMANT_CRAFTING_COPY_CONTRADICTIONS = Object.freeze([
  /fully[- ]?exceptional slotted craft(?:ing)?[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /authored affixes?(?:\/| and )drawbacks?[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /\b(?:item )?upgrades?\b[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /\bsockets?\b[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /\bvendors?\b[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
]);

const UNAVAILABLE_V2_FEATURE_OVERCLAIMS = Object.freeze([
  /all six Research rows[^.!?]{0,80}(?:(?:can (?:now )?be)|are(?: now)?)\s+(?:bought|purchased|playable|available|live)/i,
  /all 62 fixed Fabricator recipes[^.!?]{0,80}(?:(?:can (?:now )?be)|are(?: now)?)\s+(?:actionable|playable|available|live)/i,
  /(?:dormant|disconnected|unsupported) (?:Fabricator )?(?:effects?|outputs?|recipes?)[^.!?]{0,80}(?:is|are) (?:now )?(?:actionable|playable|available|live)/i,
  ...DORMANT_CRAFTING_COPY_CONTRADICTIONS,
  /(?:Capture|biosphere discovery|Discover Life|breeding|conquest|creature combat)[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i,
]);

const ENGINEERING_COPY_CONTRADICTIONS = Object.freeze([
  /all six research rows[^.!?]{0,80}(?:can be|are) (?:bought|purchased|available)/i,
  /current Survey card (?:now )?(?:renders|shows|paints)[^.!?]{0,80}(?:orbit|mineral)/i,
  /(?:Research|Skim)[^.!?]{0,80}banks?[^.!?]{0,48}Charter/i,
  /(?:Rewards?|Costs?|HP changes?|Charter ticks?) publish(?:es)? before[^.!?]{0,48}commit/i,
  /(?:Capture|biosphere discovery)[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)/i,
  /legacy charter refit[^.!?]{0,96}(?:names|draws|includes) (?:(?:an?|the) )?(?:unowned |missing )?Intergalactic Drive/i,
  /hardpoints?[^.!?]{0,80}(?:inferred|assumed|granted) from (?:the )?(?:chassis|stage|reach)/i,
  /(?:chassis|visual state)[^.!?]{0,80}(?:saved separately|separate saved state|writes? to the save)/i,
  ...DORMANT_CRAFTING_COPY_CONTRADICTIONS,
]);

const INVENTORY_COPY_CONTRADICTIONS = Object.freeze([
  /(?:unsupported effects?|random authored drops?|targeting tags?|item upgrades?|sockets?|vendors?)[^.!?]{0,96}(?:is|are) (?:now )?(?:live|playable|available)/i,
  /salvage[^.!?]{0,80}(?:scrap|Stardust)/i,
  /oversized legacy hold[^.!?]{0,80}(?:is|may be|will be) (?:truncat|discard|drop)/i,
  /(?:reload|double press|stale tab)[^.!?]{0,80}(?:can|may|will) (?:reroll|duplicate)/i,
  ...DORMANT_CRAFTING_COPY_CONTRADICTIONS,
]);

const RECORDS_VISIBLE_ARC3_CONTRADICTIONS = Object.freeze([
  /(?:Records board|visible Records rows?)[^.!?]{0,96}(?:shows?|lists?|displays?|includes?)[^.!?]{0,96}(?:Mine|mined|mining)[^.!?]{0,64}(?:counter|total|record|row)s?/i,
  /(?:Records board|visible Records rows?)[^.!?]{0,96}(?:shows?|lists?|displays?|includes?)[^.!?]{0,96}(?:Skim|skimmed|skimming)[^.!?]{0,64}(?:counter|total|record|row)s?/i,
  /(?:Records board|visible Records rows?)[^.!?]{0,96}(?:shows?|lists?|displays?|includes?)[^.!?]{0,96}Fabricator[^.!?]{0,64}(?:counter|total|record|row)s?/i,
]);

const HD_ATTACHMENT_COPY_CONTRADICTIONS = Object.freeze([
  /release(?:s|d)? the (?:displayed )?predecessor[^.!?]{0,64}before[^.!?]{0,64}(?:acquir|publish)/i,
  /stale (?:work|completion)[^.!?]{0,64}(?:can|may|will|does) publish/i,
  /(?:timer|lease|texture)[^.!?]{0,80}(?:remain|stay|kept|pinned)[^.!?]{0,48}after[^.!?]{0,32}(?:scene|surface|dispose|teardown)/i,
]);

function plainCopy(body: string): string {
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function engineeringGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Engineering &(?:amp;)? Shipyard[^.!?]{0,96}capability-derived ship preview/i.test(copy)
    && /same owned permanent systems and reach state as travel/i.test(copy)
    && /no separate visual state is saved/i.test(copy)
    && /Only actually owned systems and fitted hardpoints are named and drawn/i.test(copy)
    && /completed veteran Charter without its Intergalactic Drive[^.!?]{0,96}legacy charter refit/i.test(copy)
    && /never names or draws the missing drive/i.test(copy)
    && /Research Bench lists exactly six canonical rows/i.test(copy)
    && /Deep Scanners is the only current purchase/i.test(copy)
    && /consumes 6 Iron, 4 Silicon, and 20 Stardust/i.test(copy)
    && /current Survey card does not yet render those orbital rows/i.test(copy)
    && /other five[^.!?]{0,96}visible but disabled/i.test(copy)
    && /Fabricator groups all 62 fixed recipes/i.test(copy)
    && /exposes an action only when its output has a connected gameplay effect/i.test(copy)
    && /exact materials, parts, Stardust, Signature, prerequisite, revision, and capacity checks pass/i.test(copy)
    && /built drive or Array changes the actual ship and reach/i.test(copy)
    && /Outputs with dormant effects, fully exceptional slotted crafting, authored affixes\/drawbacks, item upgrades, sockets, and vendors remain unavailable/i.test(copy)
    && /Only one Engineering action can be pending/i.test(copy)
    && /no reward, HP change, Charter tick, ownership change, or cost is published before the receipt-bearing transaction commits/i.test(copy)
    && ENGINEERING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function inventoryGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Inventory[^.!?]{0,80}(?:phone dock|desktop rail)/i.test(copy)
    && /stable item instance/i.test(copy)
    && /compare every effect/i.test(copy)
    && /conditional effects are labelled/i.test(copy)
    && /Equip[^.!?]{0,24}Unequip[^.!?]{0,24}Salvage[^.!?]{0,40}pending-reward claim[^.!?]{0,96}revision-checked/i.test(copy)
    && /reload cannot reroll/i.test(copy)
    && /half of each direct material cost, rounded down/i.test(copy)
    && /one-unit non-gated fallback/i.test(copy)
    && /oversized legacy hold[^.!?]{0,80}inspection only/i.test(copy)
    && /never truncated/i.test(copy)
    && /Fabricator[^.!?]{0,96}lists all 62 fixed recipes/i.test(copy)
    && /settle only rows whose output has a connected effect/i.test(copy)
    && /same Arc 2 inventory authority and legacy mirror in one transaction/i.test(copy)
    && /Outputs with dormant effects[^.!?]{0,240}fully exceptional slotted crafting[^.!?]{0,240}authored affixes\/drawbacks[^.!?]{0,240}item upgrades, sockets, and vendors remain unavailable/i.test(copy)
    && INVENTORY_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function recordsGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Records board preserves and displays imported exploration totals, Stardust earned, and Journal entries/i.test(copy)
    && /First landfalls visibly update the worlds-landed total/i.test(copy)
    && /Mine, Skim, and fixed Fabricator settlements also preserve their compatible expedition counters/i.test(copy)
    && /those Arc 3 counters are not yet listed on the Records board/i.test(copy)
    && /live Journal writing is not connected/i.test(copy)
    && RECORDS_VISIBLE_ARC3_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function miningGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /lifeless, non-Earth world/i.test(copy)
    && /grounded Engineering reveals[^.!?]{0,120}exact pulls remaining/i.test(copy)
    && /reveal is inspection only/i.test(copy)
    && /Mine this world[^.!?]{0,64}separate durable action/i.test(copy)
    && /ordinary, rich-strike, cosmic, and exceptional results into Cargo/i.test(copy)
    && /eventually leaves the world Worked out/i.test(copy)
    && /Auto-Extractor[^.!?]{0,96}active play/i.test(copy)
    && /wall clock creates no income/i.test(copy)
    && /Capacity, revision, stale-tab, protected-save, and failed-write checks refuse before publication/i.test(copy)
    && /pending action disables every Engineering action until it settles/i.test(copy)
    && !/(?:Earth|living worlds?)[^.!?]{0,80}(?:can|may) be mined/i.test(copy)
    && !/(?:offline income is earned|wall clock accrues new loads)/i.test(copy);
}

function skimmingGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /fitted Jump Drive is required/i.test(copy)
    && /exact material, finite passes remaining, and next HP damage/i.test(copy)
    && /successful skim deposits one deterministic material haul and spends one corona pass/i.test(copy)
    && /unguarded remnant costs exactly 3 HP/i.test(copy)
    && /HP of 4 or lower blocks the unsafe attempt/i.test(copy)
    && /spent corona remains Worked out/i.test(copy)
    && /does not bank a mining Charter goal/i.test(copy)
    && /no wall-clock recharge/i.test(copy)
    && !/(?:unlimited|infinite) (?:passes|skims|corona)/i.test(copy)
    && !/remnant skim[^.!?]{0,80}(?:cannot|never) (?:harm|cost|spend) HP/i.test(copy);
}

function stardustGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /preserves its imported\/current Stardust/i.test(copy)
    && /Deep Scanners purchase or eligible fixed Fabricator recipe spends its stated Stardust/i.test(copy)
    && /same durable transaction as the result/i.test(copy)
    && /No current v2 action earns Stardust/i.test(copy)
    && /Rare-life discovery rewards[^.!?]{0,160}remain unavailable/i.test(copy)
    && !/(?:Mine|Skim|Survey|Capture)[^.!?]{0,80}earns? Stardust/i.test(copy);
}

function surveyBoundaryCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /selection is navigation and inspection/i.test(copy)
    && /does not spend a resource, discover life, capture a species, or authorize extraction/i.test(copy)
    && /separate grounded mineral reveal and its finite Mine action/i.test(copy)
    && /reveal describes the current opportunity but is not itself a mining receipt/i.test(copy)
    && /current Survey card does not yet paint those orbital mineral rows/i.test(copy)
    && !/Survey[^.!?]{0,80}(?:discovers life|captures a species|authorizes mining)/i.test(copy)
    && !/current Survey card (?:now )?(?:renders|shows|paints)[^.!?]{0,80}(?:orbit|mineral)/i.test(copy);
}

function engineeringReleaseCopyIsTruthful(body: string): boolean {
  return /ENGINEERING TURNS OPPORTUNITY INTO REACH/i.test(body)
    && /finite grounded Mine and Jump-gated Skim actions/i.test(body)
    && /exactly six Research rows/i.test(body)
    && /all 62 fixed Fabricator recipes/i.test(body)
    && /Only Deep Scanners can currently be purchased/i.test(body)
    && /current Survey card does not yet render those mineral rows/i.test(body)
    && /enables only outputs with connected effects/i.test(body)
    && /Fully exceptional slotted crafting, authored affixes\/drawbacks, item upgrades, sockets, and vendors remain unavailable/i.test(body)
    && /Built permanent systems change the real ship and star reach/i.test(body)
    && /legacy charter refit still never names or draws a missing drive/i.test(body)
    && /Remnant skim damage is previewed before it can spend HP/i.test(body)
    && /may spend preserved Stardust but cannot earn it/i.test(body)
    && /no reward, cost, Charter tick, or optimistic panel change publishes before the one receipt-bearing transaction commits/i.test(body)
    && /Capture and biosphere discovery remain unavailable/i.test(body)
    && ENGINEERING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
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
    expect(topics.filter((topic) => topic.availability === 'partial')).toHaveLength(23);
    expect(topics.filter((topic) => topic.availability === 'unavailable')).toHaveLength(18);
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
    expect(getGuideTopic('ascent')?.body).toContain('first landfalls, successful Mine actions, and successful fixed Fabricator outputs');
    expect(getGuideTopic('ascent')?.body).toContain('Research and Skim bank neither');
    expect(getGuideTopic('ascent')?.body).toContain('Chapter 1 is now completable through real play');
    expect(getGuideTopic('ascent')?.body).toContain('owned system that backs the next reach stage');
    expect(getGuideTopic('ascent')?.body).toContain('without invented goals, rewards, systems, or reach');
    expect(getGuideTopic('ascent')?.body).toContain('Saved Prime Signatures');
    expect(getGuideTopic('charters')?.body).toContain('first landfalls, successful <b>Mine</b> actions, and successful fixed <b>Fabricator</b> outputs');
    expect(getGuideTopic('charters')?.body).toContain('Each Mine press banks one mining-goal tick');
    expect(getGuideTopic('charters')?.body).toContain('Research and Skim do not counterfeit');
    expect(getGuideTopic('charters')?.body).toContain('newly built Jump Drive, Long-Range Array, or Intergalactic Drive');
    expect(getGuideTopic('charters')?.body).toContain('canonical progress and owned reach');
    expect(getGuideTopic('regions')?.body).toContain('permanent ship systems');
    expect(getGuideTopic('regions')?.body).toContain('eligible fixed Fabricator recipes');
    expect(getGuideTopic('regions')?.body).toContain('In-progress chapter state never invents a permanent system');
    expect(getGuideTopic('regions')?.body).toContain('fully completed imported veteran Charter preserves intergalactic reach');
    expect(getGuideTopic('regions')?.body).toContain('saved Prime Signatures');
    expect(getGuideTopic('achievements')?.availability).toBe('partial');
    expect(getGuideTopic('achievements')?.body).toContain('imported exploration totals');
    expect(getGuideTopic('achievements')?.body).toContain('First landfalls visibly update');
    expect(getGuideTopic('achievements')?.body).toContain('Arc 3 counters are not yet listed');
    expect(recordsGuideCopyIsTruthful(getGuideTopic('achievements')!.body)).toBe(true);
    for (const visibleClaim of [
      'The Records board now displays the mining counter.',
      'The Records board now lists the skimming total.',
      'The visible Records rows now include the Fabricator counter.',
    ]) {
      expect(recordsGuideCopyIsTruthful(
        getGuideTopic('achievements')!.body + visibleClaim,
      ), visibleClaim).toBe(false);
    }
    expect(getGuideTopic('hp')?.availability).toBe('partial');
    expect(getGuideTopic('hp')?.body).toContain('costs exactly <b>3 HP</b>');
    expect(getGuideTopic('hp')?.body).toContain('HP is 4 or lower');
    expect(getGuideTopic('hp')?.body).toContain('only current HP writer');
    expect(getGuideTopic('discover')?.availability).toBe('unavailable');
    expect(getGuideTopic('discover')?.body).toContain('Survey selection and Engineering mineral reveal do not catalogue life');
  });

  it('describes the exact live Engineering and Inventory actions without promoting dormant rows', () => {
    const research = getGuideTopic('research');
    const crafting = getGuideTopic('crafting');
    const engineeringBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('ENGINEERING TURNS OPPORTUNITY INTO REACH'));
    const attachmentBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('HD SURFACES HAVE ONE NAMED OWNER'));

    expect(research?.availability).toBe('partial');
    expect(engineeringGuideCopyIsTruthful(research!.body)).toBe(true);
    expect(crafting?.availability).toBe('partial');
    expect(inventoryGuideCopyIsTruthful(crafting!.body)).toBe(true);
    for (const id of ['stardust', 'mining', 'skimming'] as const) {
      expect(getGuideTopic(id)?.availability, `${id} live Arc 3 boundary is hidden`).toBe('partial');
    }
    expect(getGuideTopic('harvest')?.availability).toBe('unavailable');
    expect(engineeringBullet).toBeDefined();
    expect(engineeringReleaseCopyIsTruthful(engineeringBullet!)).toBe(true);
    expect(attachmentBullet).toBeDefined();
    expect(hdAttachmentReleaseCopyIsTruthful(attachmentBullet!)).toBe(true);

    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' All six research rows can be purchased now.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' The current Survey card now renders the orbital mineral reveal.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' Research banks one Charter fabrication goal.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' The legacy charter refit names an unowned Intergalactic Drive.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body.replace(
        'Only actually owned systems and fitted hardpoints are named and drawn',
        'Hardpoints are inferred from the chassis stage',
      ),
    )).toBe(false);
    expect(inventoryGuideCopyIsTruthful(
      crafting!.body + ' Unsupported effects are now available.',
    )).toBe(false);
    expect(inventoryGuideCopyIsTruthful(
      crafting!.body.replace('never truncated', 'truncated to fit'),
    )).toBe(false);
    expect(inventoryGuideCopyIsTruthful(
      crafting!.body.replace('half of each direct material cost, rounded down', 'invented scrap and Stardust'),
    )).toBe(false);
    const dormantCraftingClaims = [
      'Fully exceptional slotted crafting is now available.',
      'Fully-exceptional slotted craft is now available.',
      'Authored affixes/drawbacks are now available.',
      'Upgrades are now available.',
      'Item upgrades are now available.',
      'Sockets are now available.',
      'Vendors are now available.',
    ];
    for (const claim of dormantCraftingClaims) {
      expect(engineeringGuideCopyIsTruthful(research!.body + claim), claim).toBe(false);
      expect(inventoryGuideCopyIsTruthful(crafting!.body + claim), claim).toBe(false);
      expect(engineeringReleaseCopyIsTruthful(engineeringBullet! + claim), claim).toBe(false);
    }
    expect(engineeringReleaseCopyIsTruthful(
      engineeringBullet! + ' All six research rows can be purchased.',
    )).toBe(false);
    expect(engineeringReleaseCopyIsTruthful(
      engineeringBullet! + ' Capture is now available.',
    )).toBe(false);
    expect(engineeringReleaseCopyIsTruthful(
      engineeringBullet!.replace(
        'Only Deep Scanners can currently be purchased',
        'Research purchase boundary omitted',
      ),
    )).toBe(false);
    expect(engineeringReleaseCopyIsTruthful(
      engineeringBullet! + ' The legacy charter refit draws the missing Intergalactic Drive.',
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

  it('separates Survey reveal, finite extraction, HP risk, and Stardust spending from unavailable capture', () => {
    const survey = getGuideTopic('survey')!.body;
    const mining = getGuideTopic('mining')!.body;
    const skimming = getGuideTopic('skimming')!.body;
    const stardust = getGuideTopic('stardust')!.body;
    expect(surveyBoundaryCopyIsTruthful(survey)).toBe(true);
    expect(miningGuideCopyIsTruthful(mining)).toBe(true);
    expect(skimmingGuideCopyIsTruthful(skimming)).toBe(true);
    expect(stardustGuideCopyIsTruthful(stardust)).toBe(true);
    expect(getGuideTopic('discover')?.availability).toBe('unavailable');

    /* Missing-anchor and contradictory controls are independent: each must
       turn the same semantic predicate red for the intended reason. */
    expect(surveyBoundaryCopyIsTruthful(
      survey.replace('selection is navigation and inspection', 'selection boundary omitted'),
    )).toBe(false);
    expect(surveyBoundaryCopyIsTruthful(
      survey + ' Survey authorizes mining and captures a species.',
    )).toBe(false);
    expect(surveyBoundaryCopyIsTruthful(
      survey + ' The current Survey card now renders every orbital mineral.',
    )).toBe(false);
    expect(miningGuideCopyIsTruthful(
      mining.replace('exact pulls remaining', 'pull count omitted'),
    )).toBe(false);
    expect(miningGuideCopyIsTruthful(
      mining + ' Living worlds can be mined, and the wall clock accrues new loads offline.',
    )).toBe(false);
    expect(skimmingGuideCopyIsTruthful(
      skimming.replace('finite passes remaining', 'pass count omitted'),
    )).toBe(false);
    expect(skimmingGuideCopyIsTruthful(
      skimming + ' A remnant skim can never harm HP, and corona passes are unlimited.',
    )).toBe(false);
    expect(stardustGuideCopyIsTruthful(
      stardust.replace('No current v2 action earns Stardust', 'earning boundary omitted'),
    )).toBe(false);
    expect(stardustGuideCopyIsTruthful(
      stardust + ' Survey earns Stardust on every world.',
    )).toBe(false);
  });

  it('keeps star/drive and saved Prime-radius route boundaries truthful and distinct', () => {
    const reachableRouteTopics = ['landing', 'search', 'codes', 'charters', 'atlas', 'regions'] as const;
    const hasHonestRouteBoundaries = (body: string): boolean => {
      const copy = plainCopy(body);
      const starBoundary = /(?:(?:star beyond owned ship reach|blocked star)[^.!?]{0,160}(?:owned|required)[^.!?]{0,80}permanent system|system beyond the expedition’s owned reach[\s\S]{0,240}permanent ship systems)/i.test(copy);
      const engineeringPath = /Engineering|fixed Fabricator|newly built Jump Drive/i.test(copy);
      const primeBoundary = /(?:galaxy beyond|Galaxy-distance radius|Saved Prime Signatures)[^.!?]{0,200}Prime Signature/i.test(copy)
        && /Prime Signature (?:earning|radius expansion)[^.!?]{0,96}not available in this development slice/i.test(copy);
      const stale = /next Charter system is not available in this development slice/i.test(copy);
      const conflated = /(?:chapter progress|chapter number)[^.!?]{0,80}(?:grants|mints|creates)[^.!?]{0,48}(?:drive|system|reach)/i.test(copy)
        || /collect Prime Signatures to (?:extend|expand)[^.!?]{0,48}(?:star|ship) reach/i.test(copy);
      return starBoundary && engineeringPath && primeBoundary && !stale && !conflated;
    };
    for (const id of reachableRouteTopics) {
      const topic = getGuideTopic(id);
      expect(topic, `${id} current Guide topic missing`).toBeDefined();
      expect(hasHonestRouteBoundaries(topic!.body), `${id} conflates Charter and saved Prime-radius boundaries`)
        .toBe(true);
    }
    /* Negative controls: the old no-system message, a generic build hint,
       and conflated chapter/Signature authority must fail the same predicate. */
    expect(hasHonestRouteBoundaries(
      'A blocked star says the next Charter system is not available in this development slice. A galaxy beyond the saved Prime Signature radius says Prime Signature radius expansion is not available in this development slice.',
    )).toBe(false);
    expect(hasHonestRouteBoundaries(
      'Build something at Engineering before you continue.',
    )).toBe(false);
    expect(hasHonestRouteBoundaries(
      getGuideTopic('regions')!.body + ' Collect Prime Signatures to extend star reach.',
    )).toBe(false);
    expect(hasHonestRouteBoundaries(
      getGuideTopic('charters')!.body + ' Chapter progress alone grants the missing drive.',
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

  it('negative control: Inventory copy is capability-bound rather than always exposed', () => {
    const withoutInventory = V2_DEVELOPMENT_GUIDE_CAPABILITIES
      .filter((capability) => capability !== 'inventory-actions');
    const topic = getGuideTopic('crafting', withoutInventory);
    expect(topic?.availability).toBe('unavailable');
    expect(topic?.body).toContain('Exact Inventory actions have not been connected');
    expect(topic?.body).not.toContain('revision-checked actions');
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
      /EVERY PIECE STAYS ITSELF/,
      /stable exact item instance/,
      /Oversized legacy holds remain lossless inspection-only evidence/,
      /COMPARISON TELLS THE WHOLE STORY/,
      /bounded 48-row page/,
      /GEAR ACTIONS SETTLE ONCE/,
      /tab lease, save revision, exact item identity, and one immutable receipt/,
      /ONE DURABLE AUTHORITY AT A TIME/,
      /Versioned split-store saves, a per-document tab lease, revision fences, immutable receipts/,
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
      /primary chip and Charter board show only landfall, mining, and fixed-fabrication goals with real outcome writers/,
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
      /ENGINEERING TURNS OPPORTUNITY INTO REACH/,
      /finite grounded Mine and Jump-gated Skim actions/,
      /exactly six Research rows/,
      /all 62 fixed Fabricator recipes/,
      /Only Deep Scanners can currently be purchased/,
      /current Survey card does not yet render those mineral rows/,
      /Fully exceptional slotted crafting, authored affixes\/drawbacks, item upgrades, sockets, and vendors remain unavailable/,
      /Built permanent systems change the real ship and star reach/,
      /may spend preserved Stardust but cannot earn it/,
      /Capture and biosphere discovery remain unavailable/,
      /Finish for now that points to the live Engineering & Shipyard/,
      /named HD surface-planet texture attachment/,
      /retains the displayed predecessor until an acquired successor publishes/,
      /Automated lenses still do not replace human play/,
      /production remains the v1\.8\.9 main-branch site/,
    ];
    const forbiddenOverclaims = [
      ...UNAVAILABLE_V2_FEATURE_OVERCLAIMS,
      /\bv2(?:\.0)?\s+(?:port|game|build)\s+(?:is\s+)?(?:complete|finished|production[- ]ready|fully ported)\b/i,
      /\b(?:all|every)\s+legacy\s+(?:system|mechanic|feature)s?\b[^.!?]{0,80}\b(?:ported|playable|available|live)\b/i,
      /(?:stale|forged) code[^.!?]{0,80}(?:lands? immediately|automatically lands?|replaces? the current view|clears? the (?:exact )?query)/i,
      /(?:disabled|stale|forged|incomplete) (?:rows?|entries?)[^.!?]{0,48}(?:can|may|will|still) travel/i,
      /(?:stored|caller-supplied|code) (?:coordinates|bytes|parents?)[^.!?]{0,48}(?:authoritative|trusted)/i,
      /(?:whole|entire) (?:save|expedition)[^.!?]{0,80}(?:corrupt|rolls? back|rollback|is lost)/i,
      ...TRAINING_RESTORE_CONTRADICTIONS,
      ...TRAINING_LEGACY_RECOVERY_CONTRADICTIONS,
      ...COMPENDIUM_COPY_CONTRADICTIONS,
      ...ENGINEERING_COPY_CONTRADICTIONS,
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
        inventory: bullets.length === 53,
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
    const withInjectedFeatureClaim = (claim: string) => V2_DRAFT_RELEASE.sections
      .map((section, sectionIndex) => ({
        category: section.category,
        bullets: section.bullets.map((bullet, bulletIndex) => (
          sectionIndex === 0 && bulletIndex === 1 ? `${bullet} ${claim}` : bullet
        )),
      }));
    for (const truthfulClaim of [
      'Mining is now playable.',
      'Eligible fixed Fabricator crafting is now playable.',
      'Exploration audio is now live.',
    ]) {
      expect(bulletinOutcome(withInjectedFeatureClaim(truthfulClaim)), truthfulClaim).toEqual({
        categories: true, canonical: true, inventory: true, populated: true, required: true, honest: true,
      });
    }
    for (const unavailableClaim of [
      'All six Research rows can now be purchased.',
      'All 62 fixed Fabricator recipes are now actionable.',
      'Disconnected Fabricator outputs are now playable.',
      'Fully-exceptional slotted craft is now playable.',
      'Authored affixes/drawbacks are now available.',
      'Upgrades are now playable.',
      'Item upgrades are now live.',
      'Sockets are now available.',
      'Vendors are now live.',
      'Capture is now playable.',
      'Discover Life is now playable.',
      'Breeding is now playable.',
      'Creature combat is now playable.',
    ]) {
      expect(bulletinOutcome(withInjectedFeatureClaim(unavailableClaim)), unavailableClaim)
        .toMatchObject({
          categories: true, canonical: true, inventory: true, populated: true, required: true, honest: false,
        });
    }
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
