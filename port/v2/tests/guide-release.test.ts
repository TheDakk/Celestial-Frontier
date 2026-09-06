import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript evidence helper intentionally has no declaration shim.
import { hasUnnegatedSentenceClaim } from '../tools/engineering-browser-contract.mjs';
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
  /husbandry[^.!?]{0,72}(?:is|are) (?:now )?(?:live|playable|available)/i,
]);

const FEEDING_COPY_CONTRADICTIONS = Object.freeze([
  /(?<!Narrow )\bFeeding is (?:now )?(?:live|playable|available)/i,
  /(?:all|every) Compendium (?:row|detail)[^.!?]{0,80}(?:can feed|offers? Feed|exposes? Feed)/i,
  /(?:assigned|recovering|capped) companions?[^.!?]{0,80}(?:can|may) (?:still )?be fed/i,
  /Meals[^.!?]{0,64}(?:above|beyond|past|over) 200/i,
  /(?:companion Feed|feeding a companion)[^.!?]{0,96}(?:discovers? tastes?|grows? (?:stats?|Power)|heals? injuries?|applies? poison|builds? bond)/i,
  /Stats?[^.!?]{0,48}(?:is|are) (?:now )?(?:increased|raised|grown) by (?:companion )?feeding/i,
  /(?:Feed|meal)[^.!?]{0,48}(?:automatically )?retries/i,
  /optimistic(?:ally)?[^.!?]{0,48}(?:changes|updates|spends|raises)/i,
]);
const FEED_RELEASE_REPLAY_SILENCE_COPY =
  /refused, stale, converging, replayed, hidden, route-lost, counterpart-lost, and older results remain silent/i;

const BREEDING_COPY_CONTRADICTIONS = Object.freeze([
  /parents?[^.!?]{0,80}(?:is|are|gets?|becomes?) (?!never\b)(?:consumed|removed|lost|destroyed)/i,
  /(?:consumes?|removes?|destroys?)[^.!?]{0,64}(?:one|both|either|the) parents?/i,
  /(?:raw )?genetic values?[^.!?]{0,64}(?:is|are) (?:shown|visible|revealed|editable)/i,
  /(?:Recovery|recovering)[^.!?]{0,96}(?<!never )(?:advances?|progresses?|finishes?|expires?)[^.!?]{0,64}(?:closed|offline|wall clock|real time)/i,
  /(?:same exact companion|one companion)[^.!?]{0,80}(?:can|may) (?:occupy )?(?:both parent roles|both parents|breed with itself)/i,
  /(?:exhibition|mission-assigned|recovering|30% hurt)[^.!?]{0,96}(?:can|may) (?:still )?(?:Breed|breed|participate)/i,
  /(?:Breed|breeding)[^.!?]{0,64}(?:automatically )?retries/i,
  /optimistic(?:ally)?[^.!?]{0,48}(?:shows?|adds?|publishes?|changes?)[^.!?]{0,48}(?:child|Recovery|breed)/i,
  /(?:failure|failed attempt)[^.!?]{0,64}(?:creates?|adds?|produces?) (?!no\b)(?:a |one )?child/i,
  /success[^.!?]{0,64}(?:creates?|adds?|produces?)[^.!?]{0,48}(?:two|multiple) children/i,
  /(?:reload|double press|stale tab)[^.!?]{0,80}(?:can|may|will) breed twice/i,
  /(?:failure|failed pairing|refusal|stale result|failed write)[^.!?]{0,96}(?:banks?|adds?|awards?)\s+(?!no(?:thing)?\b)[^.!?]{0,64}(?:Charter|hybrid bloodline|breeding credit)/i,
]);

const COMPANION_RENAME_COPY_CONTRADICTIONS = Object.freeze([
  /exhibition[^.!?]{0,96}(?:can|may) (?:still )?be renamed/i,
  /(?:assigned|recovering|injured) companions?[^.!?]{0,96}(?:cannot|can’t|may not) be renamed/i,
  /Rename[^.!?]{0,64}(?:changes?|rewrites?|rerolls?) (?!only\b|nothing\b)[^.!?]{0,48}(?:species|genome|traits?|lineage|assignment|condition|hurt|bond|catalogue alias|another twin)/i,
  /(?:cleaned-empty|unchanged) names?[^.!?]{0,96}(?:consumes?|spends?|uses?) (?!no\b)[^.!?]{0,48}(?:receipt|write|CAS)/i,
  /Rename[^.!?]{0,80}(?:uses?|draws?|depends on)[^.!?]{0,48}(?:RNG|random|wall clock|time)/i,
  /Rename[^.!?]{0,64}(?:automatically )?retries/i,
  /optimistic(?:ally)?[^.!?]{0,48}(?:shows?|publishes?|changes?)[^.!?]{0,48}(?:name|nickname|rename)/i,
  /(?:stale|failed|duplicate) rename[^.!?]{0,96}(?:changes?|applies?|publishes?)[^.!?]{0,48}(?:name|nickname)/i,
  /(?:reload|double press|stale tab)[^.!?]{0,80}(?:can|may|will) (?:rename|apply)[^.!?]{0,32}twice/i,
]);

const FIELD_SCOUT_COPY_CONTRADICTIONS = Object.freeze([
  /Field Scout[^.!?]{0,96}(?:dies|is lost|falls below Critical)[^.!?]{0,64}(?:Discover Life|bioscan)/i,
  /A miss (?:earns?|grants?|awards?) Scout XP|A repeat species (?:earns?|grants?|awards?) Scout XP|With no standing Scout, (?:a )?capture (?:earns?|grants?|awards?) Scout XP/i,
  /(?:captured creature|new specimen)[^.!?]{0,96}(?:earns?|receives?)[^.!?]{0,48}Scout XP/i,
  /\bField Scout (?:now )?(?:dispatches?|runs missions?)/i,
  /Field Scout[^.!?]{0,64}(?:uses?|draws?|depends on)[^.!?]{0,32}(?:RNG|random)/i,
  /Field Scout[^.!?]{0,64}(?:automatically )?retries/i,
  /optimistic(?:ally)?[^.!?]{0,64}Field Scout/i,
]);

const COMBAT_COPY_CONTRADICTIONS = Object.freeze([
  /(?:combat|duel|conquest)[^.!?]{0,64}(?:automatically )?(?:retries|rerolls)/i,
  /160-run forecast[^.!?]{0,64}(?:random|estimated|guessed)/i,
  /(?:Captured )?(?:Guardians?|Titans?)[^.!?]{0,96}(?:are inserted|join|enter)[^.!?]{0,48}(?:ordinary )?Arc 5/i,
  /(?:Captured )?(?:Guardians?|Titans?)[^.!?]{0,96}(?:can|may) (?:recover|return)[^.!?]{0,48}(?:after|from) defeat/i,
  /(?:Guardian|Titan) champion[^.!?]{0,96}(?:care|breed|mission|Recovery)[^.!?]{0,64}(?:is|are) (?:now )?(?:live|available)/i,
  /extra Guardian (?:Gear|material|cache)[^.!?]{0,80}(?:is|are) (?:now )?(?:live|available|awarded)/i,
  /wk-conq[^.!?]{0,80}(?:settles?|completes?|awards?)/i,
  /Creature voices (?:controls?|governs?)[^.!?]{0,48}(?:combat|impact)/i,
  /(?:authored|recorded) combat assets?[^.!?]{0,80}(?:is|are) (?:now )?(?:live|available|loaded)/i,
  /Share battle log (?:grants?|earns?|unlocks?)[^.!?]{0,48}(?:world-Share|share achievement)/i,
]);

const PROGRESSION_COPY_CONTRADICTIONS = Object.freeze([
  /all 28 exact-event[^.!?]{0,80}(?:aggregate|automatic)/i,
  /(?:Explorer self-rename|Change name) (?:now )?(?:grants?|earns?|unlocks?)[^.!?]{0,48}(?:the )?(?:discovery-name )?namer/i,
  /locked (?:or future )?nameplate choices?[^.!?]{0,64}(?:apply|unlock|settle)/i,
  /achievement rewards?[^.!?]{0,64}(?:is|are) (?:now )?(?:live|available|claimable)/i,
  /boot(?: catch-up)?[^.!?]{0,80}(?:shows?|announces?|fires?)[^.!?]{0,48}promotion/i,
]);

const SHARING_COPY_CONTRADICTIONS = Object.freeze([
  /(?:clipboard|copy) (?:failure|denial)[^.!?]{0,96}(?:cancels?|reverses?|prevents?)[^.!?]{0,48}(?:Share|record|achievement)/i,
  /ordinary direct navigation (?:earns?|grants?|unlocks?)[^.!?]{0,48}(?:Follow|wayfarer)/i,
  /(?:Share|Follow)[^.!?]{0,64}(?:automatically )?retries/i,
  /optimistic(?:ally)?[^.!?]{0,48}(?:publishes?|changes?|moves?)[^.!?]{0,48}(?:Share|Follow|route|Shares|Jumps)/i,
  /(?:stale|forged|refused|failed)[^.!?]{0,96}(?:counts?|earns?|grants?)[^.!?]{0,48}(?:Share|Follow|share|wayfarer)/i,
  /(?:named|custom)[^.!?]{0,64}(?:progression|catch-up)[^.!?]{0,64}before[^.!?]{0,32}Follow/i,
]);

const PARAGON_COPY_CONTRADICTION = /Found Paragons plot a course instead of opening Inspect|Missing silhouettes open Inspect instead of plotting a course|Discover Life on any world adds a Paragon catalogue record|An ordinary\-world Bioscan catalogues a species|A Paragon sighting creates an owned companion|A Paragon sighting creates a specimen|A Paragon sighting grants Capture credit|A Paragon sighting spends 1 Biosphere Yield|A Paragon sighting automatically pays 120 Stardust|Seeker of Legends is claimable after one Paragon|Repeat Paragon sightings add a discovery reward|A prior Paragon\-set claim can pay again|Returning to a previously recorded Paragon home backfills its catalogue record/i;

const CAPTURE_COPY_CONTRADICTIONS = Object.freeze([
  PARAGON_COPY_CONTRADICTION,
  /(?:you|the player|the explorer)[^.!?]{0,32}(?:choose|select|target)[^.!?]{0,64}(?:species|row|life-form)/i,
  /(?:Tame|Scavenge|Sample|Capture)[^.!?]{0,32}(?:targets?|uses? the selected|lets? you choose)[^.!?]{0,48}(?:species|row|preview)/i,
  /(?:Tame|Scavenge|Sample)[^.!?]{0,96}(?:draws?|chooses?)[^.!?]{0,48}(?:only|solely)[^.!?]{0,48}(?:preview|visible|eight-row)/i,
  /miss(?:es)?[^.!?]{0,64}(?:cost|spend)s? (?:nothing|no Yield|zero)/i,
  /(?:only|just) (?:a )?(?:hit|success)[^.!?]{0,64}spends?[^.!?]{0,32}(?:Yield|attempt)/i,
  /Biosphere Yield[^.!?]{0,96}(?:separate|individual|independent)[^.!?]{0,48}(?:for|per|between)[^.!?]{0,32}(?:Tame|Scavenge|Sample|verb|action)/i,
  /(?:pool|Yield)[^.!?]{0,64}(?:recovers?|refills?|recharges?)[^.!?]{0,32}(?:while|when|from|with)[^.!?]{0,48}(?:closed|offline|wall clock|real time)/i,
  /(?:repeat|later-world|later-cycle)[^.!?]{0,80}(?:also |again )?(?:adds?|earns?|awards?)(?: a)? (?:second|new) (?:Compendium page|Rare Find|first-find reward)/i,
  /Capture (?:advances|banks|counts? for) the Charter bioscan milestone|(?:Capture|Tame|Scavenge|Sample)[^.!?]{0,128}\b(?:banks?|advances?|counts?)\b[^.!?]{0,64}(?:accepted|weekly)[^.!?]{0,48}(?:Charter|bioscan)/i,
  /(?:miss|later success|repeat|stale tab|failed write)(?![^.!?]{0,128}\bbanks nothing\b)[^.!?]{0,128}\b(?:banks?|advances?|counts?)\b(?:[^.!?]{0,48})(?:Charter|bioscan|life-discovery|tick)/i,
  /\b(?:on|in) Sol\b[^.!?]{0,96}(?:banks?|advances?|counts?)(?:[^.!?]{0,48})(?:Charter|bioscan|life-discovery|tick)/i,
  /(?:ordinary (?:card )?inspection|opening (?:the )?Survey card)[^.!?]{0,96}(?:records?|writes?|banks?)[^.!?]{0,48}(?:Survey|Discover Life|living world)/i,
  /Discover Life[^.!?]{0,96}(?:catalogues?|captures?|adds?) (?!no\b)[^.!?]{0,48}(?:species|Compendium page|creature|specimen)/i,
  /Discover Life[^.!?]{0,96}(?:spends?|uses?) (?!no\b)[^.!?]{0,48}(?:Biosphere Yield|Yield)/i,
  /Discover Life[^.!?]{0,128}(?:completes?|advances?|banks?)[^.!?]{0,64}weekly[^.!?]{0,48}(?:Charter|bioscan)|(?:older Survey|ordinary capture)[^.!?]{0,128}(?:completes?|advances?|banks?)[^.!?]{0,64}(?:accepted|weekly)[^.!?]{0,48}(?:Charter|bioscan)/i,
  /(?:Scavenge|Sample)(?![^.!?]*\bnever\b)[^.!?]{0,128}(?:creates?|adds?)[^.!?]{0,64}(?:living companions?|owned creatures?)/i,
  /(?:first contact|civilization contact)[^.!?]{0,96}(?:is|are) (?:now )?(?:live|playable|available)/i,
  /capture-chance gear[^.!?]{0,64}(?:unspecified|unknown) bonus/i,
]);

const DORMANT_CRAFTING_COPY_CONTRADICTIONS = Object.freeze([
  /authored affixes?(?:\/| and )drawbacks?[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /\b(?:item )?upgrades?\b[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /\bsockets?\b[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
  /\bvendors?\b[^.!?]{0,80}(?:is|are) (?:now )?(?:live|playable|available)\b/i,
]);

const UNAVAILABLE_V2_FEATURE_OVERCLAIMS = Object.freeze([
  /all 62 fixed Fabricator recipes[^.!?]{0,80}(?:(?:can (?:now )?be)|are(?: now)?)\s+(?:actionable|playable|available|live)/i,
  /(?:dormant|disconnected|unsupported) (?:Fabricator )?(?:effects?|outputs?|recipes?)[^.!?]{0,80}(?:is|are) (?:now )?(?:actionable|playable|available|live)/i,
  ...DORMANT_CRAFTING_COPY_CONTRADICTIONS,
  /(?:duels?|passive evolution|companion missions?|missions?)[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i,
  ...FEEDING_COPY_CONTRADICTIONS,
]);

const ENGINEERING_COPY_CONTRADICTIONS = Object.freeze([
  /(?:Research|a Research purchase)[^.!?]{0,96}(?:ignore(?:s)?|bypass(?:es)?)[^.!?]{0,64}(?:cost|prerequisite|revision|capacity)/i,
  /(?:current )?Survey card[^.!?]{0,96}(?:does not yet|renders no|shows no|paints no)[^.!?]{0,80}(?:orbit|mineral)/i,
  /(?:renders|shows|reveals|paints) every orbital mineral/i,
  /(?:orbit|orbital Survey)[^.!?]{0,96}(?:also|now) (?:shows|reveals|includes|names)[^.!?]{0,80}(?:cosmic|exceptional|grades?|reserves?|progress|Mine)/i,
  /(?:Research|Skim)[^.!?]{0,80}banks?[^.!?]{0,48}Charter/i,
  /(?:Rewards?|Costs?|HP changes?|Charter ticks?) publish(?:es)? before[^.!?]{0,48}commit/i,
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

const DEVELOPMENT_PUBLISHING_CLAIM =
  /(?:(?:(?:v2(?:[.]0)?[ \t]+)?preview(?:[ \t]+package)?|PR battery|branch-site workflow|development site|production)[^.!?;]{0,120}(?<![A-Za-z])(?:publish(?:es)?|deploys?|ships|(?:is|are|was|were|be|been|being|has|have|had)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had)){0,3}[ \t]+(?:published|deployed|shipped)|(?:is|are|was|were|be|been|being|has|have|had|goes|went|going|gone)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had|gone)){0,3}[ \t]+live)(?![A-Za-z])|(?<![A-Za-z])(?:publish(?:es)?|deploys?|ships|(?:is|are|was|were|be|been|being|has|have|had)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had)){0,3}[ \t]+(?:published|deployed|shipped)|(?:is|are|was|were|be|been|being|has|have|had|goes|went|going|gone)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had|gone)){0,3}[ \t]+live)(?![A-Za-z])[^.!?;]{0,120}(?:(?:v2(?:[.]0)?[ \t]+)?preview(?:[ \t]+package)?|PR battery|branch-site workflow|development site|production))/i;

function plainCopy(body: string): string {
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1').trim();
}

function engineeringGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Engineering &(?:amp;)? Shipyard[^.!?]{0,96}capability-derived ship preview/i.test(copy)
    && /same owned permanent systems and reach state as travel/i.test(copy)
    && /no separate visual state is saved/i.test(copy)
    && /Research Bench lists exactly six canonical, durably purchasable rows/i.test(copy)
    && /Deep Scanners reveal bounded orbital mineral facts/i.test(copy)
    && /Reinforced Hull reduces hostile Discover Life damage by 25%/i.test(copy)
    && /Xenobotany Lab adds one permanent nourishment point to every safe explorer Flora meal/i.test(copy)
    && /Fusion Drive, Antimatter Drive, and Warp Fold successively shorten the deterministic distance-scaled hyperlane presentation/i.test(copy)
    && /never replace permanent reach systems or slow an unresearched expedition/i.test(copy)
    && /Fabricator groups all 62 fixed recipes/i.test(copy)
    && /exposes an action only when its output has a connected gameplay effect/i.test(copy)
    && /exact materials, parts, Stardust, Signature, prerequisite, revision, and capacity checks pass/i.test(copy)
    && /Parts, components, permanent ship systems, and supported explorer gear settle durably/i.test(copy)
    && /Equipped healing, bioscan-protection, and travel-speed gear now join the already-live mining, skimming, and capture effects/i.test(copy)
    && /every direct material unit for a slotted craft comes from exceptional stock[^.!?]{0,120}that exact item receives one deterministic Pureforged modifier: mining yield, rich-strike chance, or capture-contact points, bound to its recipe and receipt; mixed stock remains an ordinary craft/i.test(copy)
    && /Authored natural affixes\/drawbacks, random drops, upgrades, sockets, and vendors remain separate beta work/i.test(copy)
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
    && /legacy contact effect is labelled capture chance/i.test(copy)
    && /only equipped copies change Tame, Scavenge, and Sample odds/i.test(copy)
    && /first contact remains unavailable/i.test(copy)
    && /Equip[^.!?]{0,24}Unequip[^.!?]{0,24}Salvage[^.!?]{0,40}pending-reward claim[^.!?]{0,96}revision-checked/i.test(copy)
    && /reload cannot reroll/i.test(copy)
    && /half of each direct material cost, rounded down/i.test(copy)
    && /one-unit non-gated fallback/i.test(copy)
    && /oversized legacy hold[^.!?]{0,80}inspection only/i.test(copy)
    && /never truncated/i.test(copy)
    && /Fabricator[^.!?]{0,96}lists all 62 fixed recipes/i.test(copy)
    && /settle only rows whose output has a connected effect/i.test(copy)
    && /same Arc 2 inventory authority and legacy mirror in one transaction/i.test(copy)
    && /entirely from exceptional direct materials[^.!?]{0,180}deterministic[^.!?]{0,180}Pureforged modifier[^.!?]{0,120}mining yield, rich-strike chance, or capture-contact points/i.test(copy)
    && /mixed-material craft does not/i.test(copy)
    && /Pureforged effects without a connected consumer[^.!?]{0,240}authored natural affixes\/drawbacks[^.!?]{0,240}item upgrades, sockets, and vendors remain unavailable/i.test(copy)
    && INVENTORY_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function recordsGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Records board preserves and displays imported exploration totals and Stardust earned/i.test(copy)
    && /First landfalls visibly update the worlds-landed total/i.test(copy)
    && /Mine, Skim, and fixed Fabricator settlements also preserve their compatible expedition counters/i.test(copy)
    && /those Arc 3 counters are not yet listed as separate Records totals/i.test(copy)
    && /live Journal writing is not connected/i.test(copy)
    && /all 96 achievements in 13 shelves/i.test(copy)
    && /one nonoptimistic aggregate refresh[^.!?]{0,96}68 aggregate milestones and the best-rank record/i.test(copy)
    && /owns one compare-and-swap, never retries, and publishes only after verification/i.test(copy)
    && /other 28 achievements require their exact live event owner/i.test(copy)
    && /Expedition Chronicle &(?:amp;)? Museum[^.!?]{0,160}read-only, escaped projection/i.test(copy)
    && /four independently ordered galleries of at most 60 rows each/i.test(copy)
    && /Battle Chronicle is latest receipt first/i.test(copy)
    && /Discovery Museum follows canonical immutable first-species record order/i.test(copy)
    && /Prime Victories follows Signature order without inventing claim time/i.test(copy)
    && /Legacy Journal preserves its established append order, latest first/i.test(copy)
    && /creates no writer, receipt, reward, RNG, save field, mission, share card, or global cross-gallery timeline/i.test(copy)
    && /Twenty-six exact live event joins/i.test(copy)
    && /Earth landing \(\s*home\s*\)/i.test(copy)
    && /world or companion Rename \(\s*namer\s*\)/i.test(copy)
    && /two Legendary-or-better parents \(\s*bredlegend\s*\)/i.test(copy)
    && /first verified conquest settlement \(\s*settle1\s*\)/i.test(copy)
    && /settled explorer injury below 20 HP \(\s*brink\s*\)/i.test(copy)
    && /valid-world Share \(\s*share\s*\)/i.test(copy)
    && /accepted CF1 Follow \(\s*wayfarer\s*\)/i.test(copy)
    && /twelve source-derived Survey observations/i.test(copy)
    && /wormhole traversal, arrival at a quasar or dwarf galaxy/i.test(copy)
    && /first explicit Atlas Favorite \(\s*curator\s*\)/i.test(copy)
    && /safe explorer Flora healing \(\s*fieldmedic\s*\)/i.test(copy)
    && /safe meal above 40% poison risk \(\s*gambler\s*\)/i.test(copy)
    && /hostile Discover Life injury \(\s*survivor\s*\)/i.test(copy)
    && /Accepted Follow folds its accepted route, Jumps record, galaxy visit, wayfarer, and any proved quasar\s*\/\s*dwarfg event into one receipt/i.test(copy)
    && /Explorer self-rename changes only identity and deliberately does not grant namer/i.test(copy)
    && /Exactly two event owners remain blocked: daily and decade/i.test(copy)
    && /Achievement reward claims also remain open/i.test(copy)
    && PROGRESSION_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && RECORDS_VISIBLE_ARC3_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function cf1SharingGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /valid-world Share first settles its durable Shares record and one-time Share achievement/i.test(copy)
    && /independently of whether clipboard access succeeds/i.test(copy)
    && /Follow counts only after a submitted CF1 route passes source and reach policy/i.test(copy)
    && /accepted saved route, Jumps record, Wayfarer achievement, galaxy-visit ledger, and any source-proved quasar or dwarf-galaxy achievement settle together in the same receipt/i.test(copy)
    && /Ordinary direct navigation cannot earn Follow/i.test(copy)
    && /Share and Follow each use one receipt and one compare-and-swap with no retry or optimistic record or route/i.test(copy)
    && /stale, refused, or failed write counts nothing/i.test(copy)
    && /durable ambiguity reloads instead of applying twice/i.test(copy)
    && /code carries an accepted custom world name[^.!?]{0,64}name settles first/i.test(copy)
    && /submitted Follow settles next without an intervening progression write/i.test(copy)
    && /successful Follow still owns the route and progression in its single receipt/i.test(copy)
    && /post-name route refuses or otherwise cannot join that progression[^.!?]{0,96}exactly one bounded name catch-up is queued afterward/i.test(copy)
    && SHARING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function cf1SharingReleaseCopyIsTruthful(body: string): boolean {
  return /WORLD CODES KEEP THE WHOLE DESTINATION/i.test(body)
    && /valid-world Share first settles its Shares record and one-time share achievement before the independent clipboard copy\/fallback result/i.test(body)
    && /submitted CF1 earns Follow only after its route is source-proven, reach-authorized, and accepted/i.test(body)
    && /accepted saved route, Jumps record, and wayfarer achievement settle with its galaxy visit and any source-proved quasar or dwarf-galaxy event in the same receipt/i.test(body)
    && /ordinary direct navigation cannot own Follow, Jumps, or wayfarer/i.test(body)
    && /still owns its source-proved arrival and galaxy-event aggregate/i.test(body)
    && /Each action uses one receipt and one compare-and-swap with no retry or optimistic record or route/i.test(body)
    && /durable ambiguity reloads instead of applying twice/i.test(body)
    && /named planet code[^.!?]{0,64}custom world name first/i.test(body)
    && /Follow own the joined route and progression without an intervening catch-up writer/i.test(body)
    && /successful Follow still uses its single receipt/i.test(body)
    && /post-name route that refuses or otherwise does not join progression queues exactly one later bounded catch-up for the already-committed name/i.test(body)
    && SHARING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function releaseTravelRowsAgree(worldCodes: string, rank: string): boolean {
  return /ordinary direct navigation cannot own Follow, Jumps, or wayfarer, but still owns its source-proved arrival and galaxy-event aggregate/i.test(worldCodes)
    && /wormhole\/quasar\/dwarf-galaxy travel/i.test(rank)
    && /ordinary navigation cannot counterfeit Follow/i.test(rank);
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
  return copy.includes("Seeker of Legends is the eighth Set: its separate Claim pays 120 Stardust once after ten exact Paragons; a sighting does not pay it automatically")
    && /preserves its imported\/current Stardust/i.test(copy)
    && /any successful Research purchase or eligible fixed Fabricator recipe spends its stated Stardust/i.test(copy)
    && /same durable transaction as the result/i.test(copy)
    && /first successful Legendary-or-better Tame, Scavenge, or Sample observation earns its one Rare Find Stardust bonus/i.test(copy)
    && /same durable transaction as its page and ownership/i.test(copy)
    && /result shows the exact amount/i.test(copy)
    && /miss and every later-world or later-cycle repeat earn none/i.test(copy)
    && /verified conquest win awards 8 \+ five times world tier Stardust/i.test(copy)
    && /plus 40 against an Apex Guardian or Elemental Titan/i.test(copy)
    && /Each supported Starter Charter pays its established 10–25 Stardust once/i.test(copy)
    && /completed unclaimed Binder Set pays its established 25–150 Stardust once/i.test(copy)
    && /Both paths update current and lifetime-earned totals in the same receipt/i.test(copy)
    && /Weekly Charters, passive gain[^.!?]{0,96}remain unavailable/i.test(copy)
    && !/(?:Mine|Skim|Survey)[^.!?]{0,80}earns? Stardust/i.test(copy)
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function surveyBoundaryCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return ["On ordinary worlds, it catalogues no species and spends no Biosphere Yield", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward"].every((part) => copy.includes(part))
    && /selection is navigation and inspection/i.test(copy)
    && /does not spend a resource, record a living-world Survey, catalogue life, make a capture attempt, or authorize extraction/i.test(copy)
    && /Discover Life is the separate durable bioscan that records the exact living world and resolves its one deterministic field hazard/i.test(copy)
    && /catalogues no species and spends no Biosphere Yield/i.test(copy)
    && /conquered or otherwise safe world causes no wound/i.test(copy)
    && /Reinforced Hull reduces hostile damage by 25% before worn bioscan protection/i.test(copy)
    && /Field Scout takes the nonlethal wound and is capped at Critical[^.!?]{0,96}explorer remains at or above 1 HP/i.test(copy)
    && /landing still catalogues nothing/i.test(copy)
    && /at-most-eight-row strip is only a preview/i.test(copy)
    && /Tame, Scavenge, and Sample[^.!?]{0,96}separate finite actions[^.!?]{0,96}choose uniformly[^.!?]{0,96}full biosphere/i.test(copy)
    && /separate grounded mineral reveal and its finite Mine action/i.test(copy)
    && /reveal describes the current opportunity but is not itself a mining receipt/i.test(copy)
    && /Owned Deep Scanners adds one Mineral veins row to the orbital Survey card for a proven lifeless non-Earth world/i.test(copy)
    && /preserves the generated ordinary-deposit order and marks the separate biome vein with ✦/i.test(copy)
    && /cosmic and exceptional veins, grades, reserve and progress facts, and the Mine action remain grounded Engineering information/i.test(copy)
    && !/Survey[^.!?]{0,80}(?:catalogues life|makes a capture attempt|authorizes mining)/i.test(copy)
    && ENGINEERING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function captureGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return ["On ordinary worlds, it catalogues no species and spends no Biosphere Yield", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward", "Binder Claim becomes available at ten exact Paragons and pays its established 120 Stardust once", "discovering a Paragon never pays that Set reward automatically", "A development save that recorded a Paragon home before this feature keeps its already-recorded Bioscan refusal; returning does not backfill the Paragon"].every((part) => copy.includes(part))
    && /living planet’s Survey card offers Discover Life before or after landing/i.test(copy)
    && /Ordinary card inspection remains write-free/i.test(copy)
    && /Discover Life is the single durable bioscan[^.!?]{0,160}records that exact living world[^.!?]{0,160}deterministic hazard draw/i.test(copy)
    && /catalogues no species and spends no Biosphere Yield/i.test(copy)
    && /Field Scout takes the nonlethal wound and is capped at Critical[^.!?]{0,96}explorer remains at or above 1 HP/i.test(copy)
    && /Landing reveals the biosphere roster[^.!?]{0,96}still adds no Compendium page/i.test(copy)
    && /at most eight rows as a preview/i.test(copy)
    && /Tame, Scavenge, and Sample each choose uniformly from every eligible species[^.!?]{0,160}full biosphere/i.test(copy)
    && /including species outside that preview/i.test(copy)
    && /no species row is a target/i.test(copy)
    && /Tame chooses fauna and a hit adds one owned creature/i.test(copy)
    && /Scavenge chooses flora or fungi[^.!?]{0,96}Sample chooses microbes/i.test(copy)
    && /either hit adds one specimen lot, never a living companion/i.test(copy)
    && /selected species and its exact chance are shown with the result/i.test(copy)
    && /Equipped gear labelled capture chance is already included in those shown odds/i.test(copy)
    && /each capture-chance point contributes 1.5 percentage points before the 95% overall chance ceiling, with the gear contribution capped at \+25 percentage points/i.test(copy)
    && /First contact remains unavailable/i.test(copy)
    && /three capture actions share one finite Biosphere Yield/i.test(copy)
    && /Every attempt spends 1 Yield on a hit or miss/i.test(copy)
    && /successful species leaves that action’s eligible pool[^.!?]{0,96}rest of the world’s current cycle/i.test(copy)
    && /miss stays eligible/i.test(copy)
    && /Empty, worked-out, or protected-save refusals roll nothing and spend nothing/i.test(copy)
    && /Busy, stale, and failed-write outcomes publish nothing and leave saved Yield and draw counters unchanged/i.test(copy)
    && /next 20-minute active-play cycle/i.test(copy)
    && /closing the game or moving the wall clock does not advance recovery/i.test(copy)
    && /first successful observation of a species adds its one Compendium page plus the creature or specimen lot/i.test(copy)
    && /later-world or later-cycle repeat adds another creature or lot without another page or first-find reward/i.test(copy)
    && /first successful Legendary-or-better observation earns its one Rare Find Stardust bonus/i.test(copy)
    && /result shows the exact amount/i.test(copy)
    && /miss adds no page, creature, specimen, or Stardust/i.test(copy)
    && /first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction/i.test(copy)
    && /A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing/i.test(copy)
    && /Chapter 2 capture milestone is separate from the live Discover Life action, which owns the per-world Survey record and hazard/i.test(copy)
    && /accepted Discover Life Starter Charter completes only from a later explicit Bioscan/i.test(copy)
    && /older Surveys and capture do not count/i.test(copy)
    && /Weekly bioscan Charters remain protected/i.test(copy)
    && /Sound and Creature voices on[^.!?]{0,160}verified Tame[^.!?]{0,160}exact committed Feed[^.!?]{0,160}explicit Listen action on a real owned-fauna Compendium detail/i.test(copy)
    && /one deterministic synthesized expression only while its exact current identity and accessible status counterpart agree/i.test(copy)
    && /Compendium list mounting, focus, filtering, and navigation never play a call/i.test(copy)
    && /pre-landing Survey card and landed Planetside can offer Listen to biosphere/i.test(copy)
    && /only while their exact current generic biosphere lead is visible/i.test(copy)
    && /same generic distant living-biosphere signal[^.!?]{0,160}distinct approach\/roster evidence/i.test(copy)
    && /neither reveals a species, spends Yield, awards anything, or writes the save/i.test(copy)
    && /Sound Off stops every path/i.test(copy)
    && /Creature voices Off stops creature expressions but not the generic biosphere ambience or registered post-settlement Combat Chronicle cues/i.test(copy)
    && /initiative, dodge, stun, impact\/critical\/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motifs/i.test(copy)
    && /Skip leaves the remaining transcript silent/i.test(copy)
    && /Authored ambience, music, recorded assets, and other creature actions remain unavailable/i.test(copy)
    && /Narrow companion feeding, nonlethal Breeding, exact-instance companion renaming, and Field Scout selection are available only from a real fauna Compendium detail/i.test(copy)
    && /Field Scout interception is live on hostile Discover Life/i.test(copy)
    && /real Flora detail separately offers Eat 1 for explorer healing, poison, and stat nourishment/i.test(copy)
    && /Companion Feed still does not discover tastes or flavours, grow stats or Power, heal injuries, apply poison, or build a bond/i.test(copy)
    && /Dispatch, missions, care, bond, passive evolution, and friendly duels remain unavailable/i.test(copy)
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function rarityCaptureCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Rarity lowers a species’ base Tame, Scavenge, or Sample chance/i.test(copy)
    && /action first chooses uniformly from its eligible full-biosphere pool/i.test(copy)
    && /selected species and its exact chance appear with the result/i.test(copy)
    && /preview row was targeted/i.test(copy)
    && /first successful Legendary-or-better observation earns a Rare Find Stardust bonus/i.test(copy)
    && /result shows the exact amount/i.test(copy)
    && /later-world or later-cycle repeat[^.!?]{0,96}never another Compendium page or first-find reward/i.test(copy)
    && /both parents’ established rarity tiers and the bounded lifetime-earned Stardust bonus determine the shown success chance/i.test(copy)
    && /without exposing raw genetic values/i.test(copy)
    && /broader rarity economy remains unavailable/i.test(copy)
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function charterCaptureBoundaryIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return ["At an exact fixed Paragon home, that same Bioscan can also add only the exact Paragon catalogue record", "it creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "This catalogue exception does not count as the Chapter 2 capture milestone"].every((part) => copy.includes(part))
    && /first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol banks that world’s one Chapter 2 life-discovery tick in the same capture transaction/i.test(copy)
    && /A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing/i.test(copy)
    && /Chapter 2 capture milestone is separate from the live Discover Life action/i.test(copy)
    && /Discover Life(?: action[^.!?]{0,96})? owns the existing per-world Survey record(?: and hazard|, hazard, and any accepted st-scan completion in the same receipt)/i.test(copy)
    && /An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt; older Surveys and capture do not count\./.test(copy)
    && /Weekly bioscan Charters remain protected until their separate lifecycle is complete\./.test(copy)
    && /One successful Breed banks Breed a hybrid bloodline in the same offspring save/i.test(copy)
    && /failed pairing, refusal, stale tab, or failed write banks no breeding credit/i.test(copy)
    && /first verified conquest banks Chapter 2’s conquest goal/i.test(copy)
    && /starter Conquer a world Charter \(\s*st-conq\s*\)[^.!?]{0,240}removes it from accepted work[^.!?]{0,160}records it complete[^.!?]{0,160}25 Stardust[^.!?]{0,160}current and lifetime-earned totals[^.!?]{0,160}(?:increments honored Charters once|honors one Charter)/i.test(copy)
    && /accepted weekly conquest \(\s*wk-conq\s*\) refuses before combat/i.test(copy)
    && /accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt/i.test(copy)
    && /older Surveys and capture do not count/i.test(copy)
    && /Weekly rows likewise remain protected until wall-week, slate, acceptance, and rollover authority are complete/i.test(copy)
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function engineeringReleaseCopyIsTruthful(body: string): boolean {
  return /ENGINEERING TURNS OPPORTUNITY INTO REACH/i.test(body)
    && /finite grounded Mine and Jump-gated Skim actions/i.test(body)
    && /six durably purchasable Research rows/i.test(body)
    && /all 62 fixed Fabricator recipes/i.test(body)
    && /Deep Scanners reveal bounded orbital mineral facts/i.test(body)
    && /Reinforced Hull reduces hostile Discover Life damage by 25%/i.test(body)
    && /Xenobotany Lab adds one permanent nourishment point to a safe explorer Flora meal/i.test(body)
    && /Fusion Drive, Antimatter Drive, and Warp Fold use the established 2×, 4×, and 8× travel-speed bases/i.test(body)
    && /Equipped healing, bioscan-protection, and travel-speed gear feed those same registered consumers/i.test(body)
    && /Speed never replaces permanent reach or slows the unresearched baseline/i.test(body)
    && /enables only outputs with connected effects/i.test(body)
    && /paid entirely from exceptional direct materials[^.!?]{0,180}deterministic Pureforged modifier[^.!?]{0,120}mining yield, rich-strike chance, or capture-contact points[^.!?]{0,120}bound to the exact recipe, receipt, and item/i.test(body)
    && /mixed stock remains ordinary/i.test(body)
    && /Authored natural affixes\/drawbacks, random drops, upgrades, sockets, and vendors remain unavailable/i.test(body)
    && /Built permanent systems change the real ship and star reach/i.test(body)
    && /legacy charter refit still never names or draws a missing drive/i.test(body)
    && /Remnant skim damage is previewed before it can spend HP/i.test(body)
    && /can spend preserved Stardust but does not earn it/i.test(body)
    && /no reward, cost, Charter tick, or optimistic panel change publishes before the one receipt-bearing transaction commits/i.test(body)
    && ENGINEERING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function captureReleaseCopyIsTruthful(body: string): boolean {
  return ["On ordinary worlds, the action records that exact world and resolves one shown deterministic hazard without cataloguing a species or spending Biosphere Yield", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward"].every((part) => body.includes(part))
    && /DISCOVER LIFE AND CAPTURE HAVE HONEST LIMITS/i.test(body)
    && /living planet’s Survey card offers explicit Discover Life before or after landing/i.test(body)
    && /Ordinary inspection stays write-free/i.test(body)
    && /action records that exact world and resolves one shown deterministic hazard without cataloguing a species or spending Biosphere Yield/i.test(body)
    && /Reinforced Hull reduces hostile damage by 25% before worn bioscan protection/i.test(body)
    && /assigned Field Scout intercepts the nonlethal wound at no worse than Critical[^.!?]{0,96}explorer remains at or above 1 HP/i.test(body)
    && /Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound/i.test(body)
    && /safe scans do not/i.test(body)
    && /Capture remains a separate landed action/i.test(body)
    && /Tame chooses uniformly from eligible fauna in the full biosphere/i.test(body)
    && /Scavenge from flora and fungi/i.test(body)
    && /Sample from microbes/i.test(body)
    && /not only the at-most-eight-row preview/i.test(body)
    && /Equipped capture-chance gear adds 1.5 percentage points per point before the 95% overall ceiling, capped at \+25 points/i.test(body)
    && /first contact remains unavailable/i.test(body)
    && /All three share one finite Biosphere Yield/i.test(body)
    && /every hit or miss spends 1/i.test(body)
    && /next 20-minute active-play cycle/i.test(body)
    && /never from closing the game or changing the wall clock/i.test(body)
    && /hit removes that species from its action pool for the cycle/i.test(body)
    && /miss stays eligible/i.test(body)
    && /first successful observation adds one Compendium page plus one owned creature for Tame or one specimen lot for Scavenge and Sample/i.test(body)
    && /Legendary-or-better first find also awards its one Rare Find Stardust bonus/i.test(body)
    && /repeat adds another creature or lot without another page or first-find reward/i.test(body)
    && /miss adds none/i.test(body)
    && /first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction/i.test(body)
    && /a miss, Sol, repeat, stale tab, or failed write banks nothing/i.test(body)
    && /Chapter 2 milestone is separate from Discover Life/i.test(body)
    && /accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt/i.test(body)
    && /older Surveys and capture do not count/i.test(body)
    && /Weekly bioscan Charters remain protected until their separate lifecycle is complete/i.test(body)
    && /Narrow companion Feed, nonlethal Breed, exact-instance Rename, requested Listen, and Field Scout selection are available from a real fauna detail/i.test(body)
    && /friendly duels, passive evolution, dispatch, missions, care, and bond remain unavailable/i.test(body)
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function breedingCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /real fauna Compendium detail/i.test(copy)
    && /one exact owned companion of that detail’s species as the primary parent/i.test(copy)
    && /one different exact owned fauna companion as the mate/i.test(copy)
    && /Identical same-species twins remain separate exact instances/i.test(copy)
    && /at most 24 candidates per page/i.test(copy)
    && /paging keeps every eligible owned companion reachable/i.test(copy)
    && /Exhibition creatures, mission-assigned companions, companions already in Recovery, and companions at 30% hurt or more stay disabled and explain why/i.test(copy)
    && /same exact companion cannot occupy both parent roles/i.test(copy)
    && /shown success chance comes from both parents’ established rarity tiers plus a bounded bonus from lifetime-earned Stardust/i.test(copy)
    && /raw genetic values stay hidden/i.test(copy)
    && /Both parents remain yours/i.test(copy)
    && /success creates one deterministic child with its exact lineage/i.test(copy)
    && /grants that child \+2 XP/i.test(copy)
    && /first successful union of each canonical unordered species pair grants the child another \+5 XP/i.test(copy)
    && /Renaming or reversing the parents cannot re-arm it/i.test(copy)
    && /imported v1 pair claims and their archive remain authoritative/i.test(copy)
    && /8 active-play minutes of Recovery/i.test(copy)
    && /failure creates no child/i.test(copy)
    && /2 active-play minutes of Recovery/i.test(copy)
    && /Recovery blocks Breed, combat, and dispatch/i.test(copy)
    && /Closing the game or moving the wall clock does not advance it/i.test(copy)
    && /proves both possible complete save successors before its one outcome draw/i.test(copy)
    && /one receipt-bearing compare-and-swap with no retry and no optimistic child, XP, pair claim, or Recovery/i.test(copy)
    && /refusal, stale result, overflow, or failed write draws nothing and adds nothing/i.test(copy)
    && /durable but publication cannot be confirmed[^.!?]{0,80}requires reload and cannot breed twice/i.test(copy)
    && /Back and Close remain available around the action/i.test(copy)
    && /successful outcome also banks the Chapter 3 Breed a hybrid bloodline goal inside that same offspring save/i.test(copy)
    && /failed pairing, refusal, stale result, or failed write banks no Charter credit/i.test(copy)
    && /Parent consumption, taste or bond effects, manual genetic editing, broader care, missions, and combat remain unavailable/i.test(copy)
    && BREEDING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function breedingReleaseCopyIsTruthful(body: string): boolean {
  return /TWO PARENTS, ONE DURABLE OUTCOME/i.test(body)
    && /Breed is now available from a real fauna Compendium detail/i.test(body)
    && /one exact owned companion of that detail’s species and one distinct exact owned fauna mate/i.test(body)
    && /same-species twins remain separate/i.test(body)
    && /eligible candidate stays reachable through bounded 24-row pages/i.test(body)
    && /exhibition, mission-assigned, recovering, or 30%-hurt companions explain why they cannot participate/i.test(body)
    && /shown chance uses both established rarity tiers plus a bounded lifetime-earned Stardust bonus/i.test(body)
    && /without revealing raw genetic values/i.test(body)
    && /Parents are never consumed/i.test(body)
    && /Success creates one deterministic child with \+2 XP and gives both parents 8 active-play minutes of Recovery/i.test(body)
    && /first successful union of each canonical unordered species pair gives that child another \+5 XP/i.test(body)
    && /Renaming or reversing the parents cannot re-arm that claim/i.test(body)
    && /imported v1 pair claims and their archive remain authoritative/i.test(body)
    && /failure creates no child and gives both 2/i.test(body)
    && /Recovery blocks Breed, combat, and dispatch/i.test(body)
    && /never advances from closed-game time or a changed wall clock/i.test(body)
    && /Both complete save outcomes—including exact Charter progress—are proved before the one draw/i.test(body)
    && /one immutable receipt and one compare-and-swap with no retry or optimistic child, XP, pair claim, or Recovery/i.test(body)
    && /successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save/i.test(body)
    && /failed pairing, refusal, stale result, or failed write banks nothing and grants no Charter credit/i.test(body)
    && /unconfirmable durable result locks read-only and reloads so it cannot breed twice/i.test(body)
    && /Back and Close remain available/i.test(body)
    && /Parent consumption, manual genetics, broader care, and missions remain unavailable/i.test(body)
    && BREEDING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function binderGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return ["Eight established collection sets are live: Four Crowns, The Five Flavors, Master of Arts, The Bestiary, Warden of Realms, Against All Odds, The Apex Court, and Seeker of Legends", "A missing silhouette offers Plot course", "to its source-proven home through the existing ship and Prime reach checks", "an accepted world route opens Survey, and Land remains separate", "A found entry offers Inspect", "which opens that exact existing Compendium record without travel or acquisition", "Its ordinary Back control returns to the Compendium list", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward", "Binder Claim becomes available at ten exact Paragons and pays its established 120 Stardust once", "discovering a Paragon never pays that Set reward automatically", "A prior Paragon-set claim remains claimed and can never pay again"].every((part) => copy.includes(part))
    && /Binder lives in Records/i.test(copy)
    && /six established type pages: the Spectrum, Sixteen Realms, Body Plans, Ability Themes, Flora Flavors, and Size Classes/i.test(copy)
    && /Slots are species types, not individual creatures/i.test(copy)
    && /completed unclaimed set exposes one exact Claim action/i.test(copy)
    && /one-time Stardust reward, lifetime-earned total, claimed-set record, achievements, and rank refresh settle in one receipt and one compare-and-swap with no retry or optimistic reward/i.test(copy)
    && !PARAGON_COPY_CONTRADICTION.test(copy);
}

function binderReleaseCopyIsTruthful(body: string): boolean {
  return ["Records also houses the Binder’s six established type pages and eight current-proof Set claims", "the Fifty-Paragon hunt is live, and prior Set claims remain claimed", "Missing silhouettes plot their source-proven homes, while found entries use Inspect to open the exact Compendium record without travel", "Seeker of Legends is a separate Binder Claim at ten exact Paragons for 120 Stardust once", "a sighting never pays that Set reward automatically"].every((part) => body.includes(part))
    && /completed unclaimed Set pays its established 25–150 Stardust/i.test(body)
    && /updates lifetime earned, records the claim, and refreshes achievements and rank in one receipt and one compare-and-swap with no retry or optimistic reward/i.test(body)
    && !PARAGON_COPY_CONTRADICTION.test(body);
}

function starterCharterReleaseCopyIsTruthful(body: string): boolean {
  return /THE CHARTER STOPS AT THE LIVE FRONTIER/i.test(body)
    && /two established starter chains one unfinished link at a time/i.test(body)
    && /requires Accept before tracking/i.test(body)
    && /caps incomplete accepted work at three/i.test(body)
    && /first planetfall beyond canonical Earth, one Mine, a non-null Field Scout assignment or switch, verified conquest/i.test(body)
    && /full-address Mercury, Mars, Uranus, or Neptune landfall/i.test(body)
    && /five manual Mine presses on Jupiter or Saturn/i.test(body)
    && /any canonical T2 component/i.test(body)
    && /Full-address Sol hierarchy is required[^.!?]{0,96}matching leaf seed elsewhere earns nothing/i.test(body)
    && /supported completion pays its established 10–25 Stardust once in the same receipt/i.test(body)
    && /supported gear uses the exact inventory carrier with empty-slot auto-equip only/i.test(body)
    && /accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt/i.test(body)
    && /older Surveys and capture do not count/i.test(body)
    && /Accepted wk-conq remains fail-closed because its weekly lifecycle owner is missing/i.test(body)
    && /wall-week, slate, acceptance, and rollover authority must all be complete/i.test(body)
    && !/older Surveys?[^.!?]{0,96}(?:complete|pay)[^.!?]{0,96}Discover Life Starter Charter/i.test(body);
}

function frontierEndingGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Claiming all nine Prime Signatures opens the Celestial Frontier inside the Prime Codex/i.test(copy)
    && /Sovereign of the Frontier, Warden of Life, World-Shaper, The Unseen Hand, or Prismatic Pathfinder/i.test(copy)
    && /galaxy remains open afterward/i.test(copy)
    && /Prismatic Pathfinder is the Balance path/i.test(copy)
    && /at least three conquered worlds, the Electric Signature, and at least 40 catalogued species/i.test(copy)
    && /One choice changes only the durable ending record through one receipt and one compare-and-swap/i.test(copy)
    && /cannot be overwritten by another choice, never retries or publishes optimistically/i.test(copy)
    && /unknown imported ending remains visible protected evidence/i.test(copy)
    && /later Legacy prestige layer and additional ending consequences remain future work/i.test(copy);
}

function frontierEndingReleaseCopyIsTruthful(body: string): boolean {
  return /THE FRONTIER HONORS YOUR PROGRESS/i.test(body)
    && /Prime Codex presents all nine established Signatures with their exact Titans, lore, hunt, reach, and claimed state/i.test(body)
    && /Sovereign of the Frontier, Warden of Life, World-Shaper, The Unseen Hand, and Prismatic Pathfinder/i.test(body)
    && /Balance path additionally requires three conquered worlds, the Electric Signature, and 40 catalogued species/i.test(body)
    && /One ending receipt and one compare-and-swap write only the ending record/i.test(body)
    && /cannot overwrite a prior choice, never retry or publish optimistically/i.test(body)
    && /preserve unknown imported ending evidence/i.test(body)
    && /galaxy remains open afterward/i.test(body)
    && /later Legacy consequences remain unavailable/i.test(body);
}

function progressionCeremonyGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /exact durable successor is verified and published/i.test(copy)
    && /newly appended supported achievement may announce its authored name and description with a tier-3 sting/i.test(copy)
    && /newly raised best rank may announce its name with a tier-5 sting and a bounded gold burst of at most 40 particles/i.test(copy)
    && /effects, motion, and device budget may lower that count/i.test(copy)
    && /Boot catch-up, replay, already-durable recovery, Training, convergence, and refusals stay silent/i.test(copy)
    && /ceremonies write no save, evaluate no rule, and grant no reward/i.test(copy);
}

function progressionCeremonyReleaseCopyIsTruthful(body: string): boolean {
  return /newly durable post-action achievement likewise announces only after commit/i.test(body)
    && /authored name and description with a tier-3 sting/i.test(body)
    && /rank promotion uses a tier-5 sting and an at-most-40-particle gold burst/i.test(body)
    && /effects, motion, and device budget may lower/i.test(body)
    && /Replay, already-durable recovery, Training, convergence, and refusals stay silent/i.test(body)
    && /ceremonies never write or reward/i.test(body);
}

function companionRenameCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Rename chooses one exact owned companion of this species from bounded 24-row pages/i.test(copy)
    && /Same-species twins remain distinct/i.test(copy)
    && /assigned, recovering, and injured companions may be renamed because the action changes identity only/i.test(copy)
    && /exhibition entries and protected or non-owned rows refuse/i.test(copy)
    && /shipped name policy strips &lt; &gt; &amp; &quot; and apostrophe/i.test(body)
    && /trims whitespace, and caps the result at 24 characters/i.test(copy)
    && /Cleaned-empty or unchanged names consume no receipt or write/i.test(copy)
    && /commit changes only that exact companion’s nickname/i.test(copy)
    && /keeps the old name visible while pending/i.test(copy)
    && /one immutable receipt and one compare-and-swap with no retry or optimistic publication/i.test(copy)
    && /stale or failed write changes nothing/i.test(copy)
    && /unconfirmable durable result locks read-only, requires reload, and cannot rename twice/i.test(copy)
    && COMPANION_RENAME_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function companionRenameReleaseCopyIsTruthful(body: string): boolean {
  return /ONE COMPANION, ONE DURABLE NAME/i.test(body)
    && /Rename is now available from a real fauna Compendium detail/i.test(body)
    && /one exact owned companion from bounded 24-row pages/i.test(body)
    && /Same-species twins remain separate/i.test(body)
    && /Assigned, recovering, and injured companions may be renamed because this action changes identity only/i.test(body)
    && /exhibition, non-owned, protected, and revision-exhausted rows refuse/i.test(body)
    && /strips angle brackets, ampersands, quotation marks, and apostrophes/i.test(body)
    && /trims whitespace, and caps the result at 24 characters/i.test(body)
    && /cleaned-empty or unchanged name consumes no receipt or write/i.test(body)
    && /changes only that exact companion’s nickname/i.test(body)
    && /never its species, genome, traits, lineage, assignment, condition, bond, catalogue alias, or another twin/i.test(body)
    && /keeps the old name visible until durability is verified/i.test(body)
    && /One immutable receipt and one exact-five compare-and-swap settle without RNG, retry, or optimistic publication/i.test(body)
    && /Stale, duplicate, storage, carrier, and postcommit faults change nothing visible/i.test(body)
    && /converge read-only through reload so the name cannot apply twice/i.test(body)
    && /Back and Close remain safe during settlement/i.test(body)
    && COMPANION_RENAME_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function feedingCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /real fauna Compendium detail/i.test(copy)
    && /Choose one exact unassigned owned companion whose Meals are below 200 and one exact owned flora lot/i.test(copy)
    && /Use 1/i.test(copy)
    && /Same-species twins remain separate exact instances/i.test(copy)
    && /Assigned or recovering companions and companions already at the 200-Meal cap stay disabled and explain why/i.test(copy)
    && /Meals by 1[^.!?]{0,48}capped at 200/i.test(copy)
    && /removes 1 flora from that exact lot/i.test(copy)
    && /final unit empties that exact lot/i.test(copy)
    && /one immutable receipt and one compare-and-swap save transaction/i.test(copy)
    && /no retry and no optimistic inventory or Meals change/i.test(copy)
    && /refusal, stale result, or failed write uses and publishes nothing/i.test(copy)
    && /durability succeeds but publication cannot be confirmed[^.!?]{0,80}requires reload and cannot feed twice/i.test(copy)
    && /Sound and Creature voices enabled/i.test(copy)
    && /trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status/i.test(copy)
    && /one deterministic synthesized acknowledgement after that status appears/i.test(copy)
    && /refused, stale, converging, replayed, hidden, route-lost, and counterpart-lost paths remain silent/i.test(copy)
    && /Back and Close remain available/i.test(copy)
    && /companion action is deliberately only a meal counter and inventory spend/i.test(copy)
    && /tastes and flavours, stat or Power growth, injury care or healing, companion poison, and bond remain unavailable/i.test(copy)
    && /explorer’s separate Eat 1 action lives on a real Flora detail and owns healing, poison, and nourishment without changing companion Feed/i.test(copy)
    && /Companion Breed (?:is a separate action with|has) its own eligibility, odds, lineage, and active-play Recovery/i.test(copy)
    && /Rename changes only one selected exact companion’s nickname/i.test(copy)
    && /Field Scout separately selects the exact role and can intercept hostile Discover Life injury/i.test(copy)
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy))
    && FEEDING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function feedingReleaseCopyIsTruthful(body: string): boolean {
  return /TWO EXACT MEAL PATHS, NO INVENTED CARE/i.test(body)
    && /real fauna Compendium detail/i.test(body)
    && /one exact unassigned owned companion below the 200-Meal cap/i.test(body)
    && /one exact owned flora lot through Use 1/i.test(body)
    && /Same-species twins remain separate/i.test(body)
    && /assigned, recovering, and capped companions stay disabled and explain why/i.test(body)
    && /One receipt-bearing compare-and-swap raises Meals by 1 and removes exactly 1 flora/i.test(body)
    && /emptying that exact lot on its final unit/i.test(body)
    && /no retry or optimistic change/i.test(body)
    && /committed Feed requires its trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status, then may produce one deterministic synthesized acknowledgement after that status appears/i.test(body)
    && FEED_RELEASE_REPLAY_SILENCE_COPY.test(body)
    && /Companion Feed is still only an inventory spend and meal counter/i.test(body)
    && /tastes, Power growth, injury care or healing, companion poison, and bond remain open/i.test(body)
    && /real Flora detail previews the explorer’s healing, poison risk, and deterministic nourished stat/i.test(body)
    && /Eat 1 consumes the canonical exact owned specimen in one receipt-bearing transaction/i.test(body)
    && /safe meal restores shown HP with worn healing gear, raises the stat up to 330, gains \+1 nourishment from Xenobotany/i.test(body)
    && /toxic meal grants no healing or stat and leaves the explorer at or above 1 HP/i.test(body)
    && /Safe healing owns fieldmedic[^.!?]{0,96}safe meal above 40% poison risk also owns gambler/i.test(body)
    && /Companion Breed remains separate/i.test(body)
    && /Rename is identity-only/i.test(body)
    && /Field Scout can intercept hostile Discover Life injury/i.test(body)
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body))
    && FEEDING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function fieldScoutGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Field Scout chooses one exact owned companion of this fauna species from bounded 24-row pages/i.test(copy)
    && /Same-species twins remain separate exact instances/i.test(copy)
    && /Assigned, recovering, and injured companions remain eligible because the role selector itself changes only the Scout pointer/i.test(copy)
    && /choose another companion to switch Scouts, or choose the current Scout to Stand down/i.test(copy)
    && /One exact-five compare-and-swap settles that choice with no RNG, retry, or optimistic publication/i.test(copy)
    && /designated Scout intercepts hostile Discover Life damage in the bioscan’s own transaction and remains at or below Critical/i.test(copy)
    && /Scout standing before that successful attempt earns up to \+2 XP in the same capture transaction, capped at 486/i.test(copy)
    && /no standing Scout, miss, or repeat grants Scout XP/i.test(copy)
    && /Refused, stale, failed, or unconfirmable writes change nothing visible and cannot apply twice/i.test(copy)
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function fieldScoutReleaseCopyIsTruthful(body: string): boolean {
  return /ONE EXACT FIELD SCOUT, NEVER A GUESS/i.test(body)
    && /real fauna Compendium detail names, switches, or stands down one exact owned companion/i.test(body)
    && /bounded 24-row pages/i.test(body)
    && /same-species twins remain separate by stable instance identity/i.test(body)
    && /Assigned, recovering, and injured companions stay eligible because the selector itself changes only the Scout pointer/i.test(body)
    && /one exact-five compare-and-swap settles the role with no RNG, retry, or optimistic publication/i.test(body)
    && /Refused, stale, failed, and unconfirmable writes change nothing visible and cannot apply twice/i.test(body)
    && /standing Scout intercepts hostile Discover Life damage in that bioscan’s own save and remains at or below Critical/i.test(body)
    && /genuinely fresh species[^.!?]{0,160}Scout standing before the attempt earns up to \+2 XP in the same capture transaction, capped at 486/i.test(body)
    && /485 gains 1, the cap gains 0/i.test(body)
    && /no standing Scout, a miss, or a repeat species grants no Scout XP/i.test(body)
    && /Dispatch, missions, care, and bond remain open/i.test(body)
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function combatChronicleCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Only after (?:that )?exact durab(?:le settlement|ility) is verified/i.test(copy)
    && /(?:accessible timed Combat Chronicle|Combat Chronicle opens with named timed transcript rows)/i.test(copy)
    && /two (?:accessible )?HP meters/i.test(copy)
    && /settled statistics and result/i.test(copy)
    && /Skip stops active combat sound[^.!?]{0,96}(?:reveals|completes) the remaining transcript silently/i.test(copy)
    && /Share battle log[^.!?]{0,160}(?:copies plain text|clipboard access works)[^.!?]{0,200}(?:(?:selected|selects) (?:the )?exact log|exact log is selected)/i.test(copy)
    && /(?:grants no|without granting) (?:the )?world-Share achievement/i.test(copy)
    && /Every already-modelled registered initiative, dodge, stun, impact\/critical\/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motif owns an exact visible-caption counterpart/i.test(copy)
    && /Composite events remain one voice/i.test(copy)
    && /at most two combat voices overlap/i.test(copy)
    && /(?:Creature voices does not govern combat|Master Sound—not Creature voices—governs)/i.test(copy)
    && /(?:Sound Off|Close)[^.!?]{0,200}(?:stops playback|stops active combat sound)/i.test(copy)
    && /Authored or recorded combat assets, ambience, and music remain unavailable/i.test(copy)
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function guardianChampionCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /live captured Guardian or Titan/i.test(copy)
    && /separate combat-only companion record/i.test(copy)
    && /rather than (?:being inserted into )?ordinary Arc 5 (?:companion )?ownership/i.test(copy)
    && /same forecast[^.!?]{0,160}(?:Combat )?Chronicle[^.!?]{0,160}registered audio[^.!?]{0,160}(?:win-XP|XP)/i.test(copy)
    && /exact loss-XP/i.test(copy)
    && /XP and injury (?:persist through|survive) reload/i.test(copy)
    && /(?:not bred|lineage is not bred)[^.!?]{0,96}defeat (?:can )?permanently/i.test(copy)
    && /immutable tombstone/i.test(copy)
    && /absent from (?:both )?the (?:combat )?roster and (?:the )?composite Compendium[^.!?]{0,160}reload[^.!?]{0,96}Training restore[^.!?]{0,96}capture reconciliation/i.test(copy)
    && /(?:gain|have) no Arc 5 care, breeding, mission, or Recovery fields/i.test(copy)
    && /Prime claims remain independent of later champion use/i.test(copy)
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function combatGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /landed non-Training Surface/i.test(copy)
    && /explorer, each eligible ordinary owned-fauna companion, and each live captured Guardian or Titan as champion/i.test(copy)
    && /deterministic Elemental Titan[^.!?]{0,96}Apex Guardian[^.!?]{0,96}strongest canonical fauna/i.test(copy)
    && /exact 160-run deterministic forecast/i.test(copy)
    && /one immutable receipt and one compare-and-swap/i.test(copy)
    && /no automatic retry, reroll, or optimistic result/i.test(copy)
    && /verified win conquers the world once/i.test(copy)
    && /8 \+ five times world tier Stardust, plus 40 more against a Guardian or Titan/i.test(copy)
    && /player defeat[^.!?]{0,96}never falls below 1 HP/i.test(copy)
    && /bred fauna loser crawls home Critical/i.test(copy)
    && /wild-caught loser can be permanently lost/i.test(copy)
    && /defeated Guardian or Titan is added to the Compendium with battlefield modifiers stripped/i.test(copy)
    && /Titan victory also claims its new Prime Signature[^.!?]{0,96}ninth distinct claim unlocks the Frontier/i.test(copy)
    && /Chapter 2 conquest and an accepted starter st-conq reward settle in the same save/i.test(copy)
    && /accepted wk-conq refuses before combat/i.test(copy)
    && /Authored extra Guardian Gear or material caches remain unavailable/i.test(copy)
    && /legacy 40% conquest-imbue gate[^.!?]{0,160}refuses before the duel/i.test(copy)
    && /Party roles, tactics, retreat, and broader Guardian care, breeding, Recovery, or mission systems remain open/i.test(copy)
    && guardianChampionCopyIsTruthful(body)
    && combatChronicleCopyIsTruthful(body)
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function combatReleaseCopyIsTruthful(body: string): boolean {
  return /ONE WORLD, ONE VERIFIED DUEL/i.test(body)
    && /landed non-Training Surface/i.test(body)
    && /explorer, an eligible ordinary owned-fauna companion, or a live captured Guardian or Titan/i.test(body)
    && /Elemental Titan, Apex Guardian, or strongest fauna/i.test(body)
    && /exact 160-run forecast/i.test(body)
    && /one immutable receipt and one compare-and-swap/i.test(body)
    && /no retry, reroll, or optimistic result/i.test(body)
    && /verified win conquers the world once/i.test(body)
    && /Defeated Guardians and Titans join the Compendium with battlefield modifiers stripped/i.test(body)
    && /Titan win claims its Prime Signature[^.!?]{0,96}ninth distinct claim unlocks the Frontier/i.test(body)
    && /starter st-conq[^.!?]{0,240}adds \+25 current and lifetime-earned Stardust[^.!?]{0,96}honors one Charter/i.test(body)
    && /Accepted wk-conq refuses before combat/i.test(body)
    && /legacy 40% conquest-imbue gate[^.!?]{0,160}coexist with natural and Pureforged gear/i.test(body)
    && /Party roles, tactics, retreat, and broader Guardian care, breeding, Recovery, or mission systems remain open/i.test(body)
    && guardianChampionCopyIsTruthful(body)
    && combatChronicleCopyIsTruthful(body)
    && COMBAT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function rankGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /exact ten-rank ladder: Cadet, Scout, Pathfinder, Voyager, Pioneer, Star Cartographer, Mythic Wayfarer, Void Sovereign, Cosmic Luminary, and Eternal Frontier/i.test(copy)
    && /six visible factors: living worlds surveyed, species catalogued, highest raw rarity tier, durable achievement IDs, hybrids bred, and galaxies visited/i.test(copy)
    && /3,000-point prestige steps/i.test(copy)
    && /Each attained rank permanently preserves its nameplate color/i.test(copy)
    && /Eternal Frontier uses the iridescent foil/i.test(copy)
    && /top bar shows the player name and current rank/i.test(copy)
    && /only after its one nonoptimistic progression refresh commits/i.test(copy)
    && /Boot catch-up never fakes a promotion/i.test(copy)
    && /Settings → Nameplate offers Auto to follow the current rank or any color earned through the durable best-rank record/i.test(copy)
    && /one receipt and one compare-and-swap with no retry or optimistic color change/i.test(copy)
    && /locked or malformed choices are refused[^.!?]{0,96}unconfirmable durable result reloads instead of applying twice/i.test(copy)
    && /saved best-rank record never demotes/i.test(copy)
    && /Settings → Explorer name → Change name changes only the expedition’s explorer name/i.test(copy)
    && /shipped sanitizer, trims whitespace, and caps the result at 24 characters/i.test(copy)
    && /cleaned-empty or unchanged input consumes no receipt or write/i.test(copy)
    && /one receipt and one compare-and-swap settle with no retry or optimistic name/i.test(copy)
    && /durable ambiguity reloads instead of applying twice/i.test(copy)
    && /Explorer self-rename deliberately does not unlock the discovery-name namer achievement/i.test(copy)
    && /Broader rank rewards remain unavailable/i.test(copy)
    && PROGRESSION_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
}

function rankReleaseCopyIsTruthful(body: string): boolean {
  return /EVERY EXPEDITION HAS A RANKED RECORD/i.test(body)
    && /exact ten ranks from Cadet through Eternal Frontier/i.test(body)
    && /all six score factors/i.test(body)
    && /all 96 achievements across 13 shelves/i.test(body)
    && /68 aggregate milestones and permanent best-rank record/i.test(body)
    && /Twenty-six exact joins now belong to their true actions/i.test(body)
    && /Earth landing, world or companion Rename, Legendary-pair successful Breed, first verified conquest settlement, settled explorer injury below 20 HP, valid-world Share, accepted CF1 Follow, twelve source-derived Survey observations, wormhole\/quasar\/dwarf-galaxy travel, first explicit Atlas Favorite, safe explorer Flora healing, a safe above-40%-risk Flora meal, and any hostile Discover Life encounter/i.test(body)
    && /Accepted Follow folds its route, Jumps, galaxy visit, wayfarer, and any proved quasar\/dwarfg event into one receipt/i.test(body)
    && /top bar shows the player name and rank in its earned permanent color or Eternal Frontier foil/i.test(body)
    && /only a post-action durable promotion announces the new named rank[^.!?]{0,64}boot catch-up stays silent/i.test(body)
    && /Settings → Nameplate (?:now )?offers Auto\/current-rank or any permanently earned rank color/i.test(body)
    && /one receipt-bearing compare-and-swap with no retry or optimistic color change/i.test(body)
    && /locked choices refuse and durable ambiguity reloads instead of applying twice/i.test(body)
    && /Settings → Explorer name → Change name uses the shipped sanitizer and 24-character cap/i.test(body)
    && /changes only the explorer name/i.test(body)
    && /cleaned-empty or unchanged input receipt-free/i.test(body)
    && /one receipt-bearing compare-and-swap with no retry or optimistic name/i.test(body)
    && /Explorer self-rename deliberately does not grant the discovery-name namer achievement/i.test(body)
    && /Exactly two event owners—daily and decade—remain open/i.test(body)
    && /read-only Expedition Chronicle & Museum projects four escaped, independently ordered, at-most-60-row galleries/i.test(body)
    && /Protected authority yields one protected panel/i.test(body)
    && /creates no writer, reward, RNG, save field, mission, share card, or global cross-gallery timeline/i.test(body)
    && /Achievement rewards remain open/i.test(body)
    && PROGRESSION_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

function atlasGuideCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /semantic List and Chart views/i.test(copy)
    && /filter All, Favorites, Visited, Conquered, or Life/i.test(copy)
    && copy.includes("Nearby Chart lights share one large control when their touch targets would overlap")
    && copy.includes("Choose that control to open a bounded list of its exact destinations")
    && copy.includes("Return to Chart restores the originating control")
    && copy.includes("This selection spends nothing and travels nowhere")
    && ["The legacy chart view, home marker, and undo are not yet ported", "Chart cluster selection travels automatically", "Chart filters spend Stardust", "Home can travel an unavailable route", "Remove discards another row", "Undo lasts forever", "Undo survives another Atlas mutation", "Same-seed worlds share Visited and Conquered"].every((claim) => !copy.includes(claim))
    && /Chart uses only source-proven route coordinates and marks the current view/i.test(copy)
    && /compatibility location text never becomes route or chart authority/i.test(copy)
    && /Exact canonical world keys own Visited and Conquered, so same-seed worlds remain independent/i.test(copy)
    && /only legacy p&lt;seed&gt; rows use their preserved seed facts/i.test(copy)
    && /Favorite, Home, and Remove act on one exact row through one receipt and one compare-and-swap with no retry or optimistic publication/i.test(copy)
    && /Favorite preserves that same row and its route sidecar/i.test(copy)
    && /first explicit false-to-true choice owns curator/i.test(copy)
    && /unfavoriting never removes it and an unchanged choice writes nothing/i.test(copy)
    && /Custom names and source-verified composite identities are preserved/i.test(copy)
    && /Home points to one exact row and Travel Home remains disabled if its route is unavailable/i.test(copy)
    && /Remove preserves every surviving pair and route identity/i.test(copy)
    && /Undo remains available for eight seconds/i.test(copy)
    && /restores the exact original pair, position, Home state, and present-or-absent route sidecar/i.test(copy)
    && /expires after another Atlas mutation, route-identity change, or convergence reload/i.test(copy)
    && /Accepted Atlas, Search, and CF1 arrivals may paint the same deterministic, skippable hyperlane streak overlay after the route publishes/i.test(copy)
    && /Unresearched travel keeps the established baseline/i.test(copy)
    && /Fusion, Antimatter, and Warp Fold use 2×, 4×, and 8× speed bases/i.test(copy)
    && /equipped travel-speed gear added to the active base/i.test(copy)
    && /Effects, Motion, and device limits may reduce or omit the treatment without delaying or changing the destination/i.test(copy);
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
  return /<b>Compendium<\/b> presents up to 1,500 logical entries/i.test(body)
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
    && /successful first Planetside capture can add one page/i.test(body)
    && /Tame also adds an owned fauna creature/i.test(body)
    && /Scavenge and Sample add specimen lots/i.test(body)
    && /Later-world or later-cycle successes add another creature or lot without duplicating the page/i.test(body)
    && /real fauna detail alone exposes narrow exact-instance <b>Feed<\/b>, .*Breed.*, <b>Rename<\/b>, <b>Listen<\/b>, and <b>Field Scout<\/b> actions/i.test(body)
    && /real Flora detail can expose the explorer’s separate .*Eat 1.* action/i.test(body)
    && /Owned fauna can become eligible conquest champions/i.test(body)
    && /designated Field Scout can intercept hostile Discover Life injury/i.test(body)
    && /Dispatch, missions, companion care, bond, and broader husbandry remain unavailable/i.test(body)
    && COMPENDIUM_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body))
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(plainCopy(body)))
    && FEEDING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(plainCopy(body)))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(plainCopy(body)));
}

function specimenDetailCopyIsTruthful(body: string): boolean {
  return /exact <b>440px<\/b> portrait/i.test(body)
    && /same complete-genome identity as its exact 132px list thumbnail/i.test(body)
    && /440px image is reserved for this detail rather than the list or Planetside/i.test(body)
    && /<b>Back<\/b> returns to the saved list position and restores focus to the same logical row/i.test(body)
    && /<b>Close<\/b> returns focus to the exact Compendium opener/i.test(body)
    && /Capture happens only through Planetside’s random full-biosphere Tame, Scavenge, and Sample pools, never from a Compendium row/i.test(body)
    && /Tame hit adds one owned fauna creature/i.test(body)
    && /Scavenge or Sample adds one specimen lot and never a living companion/i.test(body)
    && /Only a real fauna detail offers companion <b>Feed<\/b>/i.test(body)
    && /one exact unassigned owned companion below the 200-Meal cap and one exact owned flora lot/i.test(body)
    && /Identical same-species twins remain separate exact instances/i.test(body)
    && /Both remain available around explorer eating, companion feeding, breeding, renaming, and Field Scout selection/i.test(body)
    && /separate nonlethal .*Breed.* action chooses two distinct exact owned fauna companions/i.test(body)
    && /rarity-backed odds/i.test(body)
    && /active-play Recovery without consuming either parent/i.test(body)
    && /Field Scout.*one exact owned companion[^.!?]{0,96}bounded <b>24-row pages<\/b>/i.test(body)
    && /Assigned, recovering, and injured companions remain eligible because the role selector itself changes only the Scout pointer/i.test(body)
    && /choose another companion to switch Scouts, or choose the current Scout to <b>Stand down<\/b>/i.test(body)
    && /one exact-five compare-and-swap settles that choice with no RNG, retry, or optimistic publication/i.test(body)
    && /designated Scout intercepts hostile Discover Life damage in the bioscan’s own transaction and remains at or below Critical/i.test(body)
    && /Scout standing before that successful attempt earns up to \+2 XP in the same capture transaction, capped at 486/i.test(body)
    && /no standing Scout, miss, or repeat grants Scout XP/i.test(body)
    && companionRenameCopyIsTruthful(body)
    && COMPENDIUM_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(body))
    && FIELD_SCOUT_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(plainCopy(body)))
    && FEEDING_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(plainCopy(body)))
    && CAPTURE_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(plainCopy(body)));
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
    && /reload after updating\./i.test(body)
    && TRAINING_RESTORE_CONTRADICTIONS.every((pattern) => !pattern.test(body))
    && TRAINING_LEGACY_RECOVERY_CONTRADICTIONS.every((pattern) => !pattern.test(body));
}

const SETTINGS_GRAPHICS_COPY_CONTRADICTIONS = Object.freeze([
  /Visual effects Off[^.!?]{0,96}(?:still|may|can)[^.!?]{0,48}(?:allocate|animate|render)[^.!?]{0,48}(?:fog|particles?|bloom)/i,
  /(?:Motion )?Reduced(?: motion)?\s+(?:still\s+)?(?:can|may|will)\s+(?:animate|enable|allow)[^.!?]{0,64}(?:fog|particles?|bloom|shake)/i,
  /Motion Auto[^.!?]{0,80}(?:ignores?|overrides?)[^.!?]{0,64}(?:device|system|OS)[^.!?]{0,32}(?:preference|setting)/i,
  /Screen shake[^.!?]{0,96}(?:works?|runs?|activates?|is enabled)[^.!?]{0,64}(?:even when|without)[^.!?]{0,64}(?:Visual effects|full motion)/i,
  /(?:Screen shake|planetfall (?:impulse|shake))[^.!?]{0,80}(?:random|nondeterministic|unbounded)/i,
  /Screen shake[^.!?]{0,96}(?:also|can|may)[^.!?]{0,64}(?:travel|combat|survey|skimming)/i,
  /(?:touch|low-tier)(?: and|\/| or)?(?: touch| low-tier)? devices[^.!?]{0,96}(?:use|receive|animate)[^.!?]{0,64}(?:full|animated)[^.!?]{0,48}(?:atmosphere|fog|bloom)/i,
  /device policy[^.!?]{0,48}(?:can|may|will)\s+(?!never\b)(?:enable|turn on|override)\b[^.!?]{0,48}(?:Screen )?shake/i,
]);

function settingsGraphicsCopyIsTruthful(body: string): boolean {
  const copy = plainCopy(body);
  return /Settings currently controls[^.!?]{0,160}Visual effects, Screen shake/i.test(copy)
    && /Visual effects Off allocates no frontier fog particles and turns off the live bloom treatment/i.test(copy)
    && /With Visual effects On, Motion Reduced keeps only bounded static atmosphere/i.test(copy)
    && /touch\/low-tier devices also stay static/i.test(copy)
    && /full-motion capable devices may animate capped fog, blazar bloom, and bright-star breathing/i.test(copy)
    && /Motion Auto follows the device’s reduced-motion preference live/i.test(copy)
    && /Screen shake adds only a short deterministic planetfall impulse/i.test(copy)
    && /only when Visual effects, Screen shake, and full motion are all enabled/i.test(copy)
    && /Reduced motion disables shake/i.test(copy)
    && /device policy may lower the enabled profile and concurrent-impulse cap, but it can never enable shake/i.test(copy)
    && /Preferences persist with the expedition/i.test(copy)
    && SETTINGS_GRAPHICS_COPY_CONTRADICTIONS.every((pattern) => !pattern.test(copy));
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

  it('requires the Paragon exception, Inspect/travel split, separate claim and development-save limit', () => {
    const cases = [
      [surveyBoundaryCopyIsTruthful, plainCopy(getGuideTopic('survey')!.body), ["On ordinary worlds, it catalogues no species and spends no Biosphere Yield", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward"]],
      [captureGuideCopyIsTruthful, plainCopy(getGuideTopic('discover')!.body), ["On ordinary worlds, it catalogues no species and spends no Biosphere Yield", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward", "Binder Claim becomes available at ten exact Paragons and pays its established 120 Stardust once", "discovering a Paragon never pays that Set reward automatically", "A development save that recorded a Paragon home before this feature keeps its already-recorded Bioscan refusal; returning does not backfill the Paragon"]],
      [binderGuideCopyIsTruthful, plainCopy(getGuideTopic('binder')!.body), ["Eight established collection sets are live: Four Crowns, The Five Flavors, Master of Arts, The Bestiary, Warden of Realms, Against All Odds, The Apex Court, and Seeker of Legends", "A missing silhouette offers Plot course", "to its source-proven home through the existing ship and Prime reach checks", "an accepted world route opens Survey, and Land remains separate", "A found entry offers Inspect", "which opens that exact existing Compendium record without travel or acquisition", "Its ordinary Back control returns to the Compendium list", "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward", "Binder Claim becomes available at ten exact Paragons and pays its established 120 Stardust once", "discovering a Paragon never pays that Set reward automatically", "A prior Paragon-set claim remains claimed and can never pay again"]],
      [charterCaptureBoundaryIsTruthful, plainCopy(getGuideTopic('charters')!.body), ["At an exact fixed Paragon home, that same Bioscan can also add only the exact Paragon catalogue record", "it creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "This catalogue exception does not count as the Chapter 2 capture milestone"]],
      [charterCaptureBoundaryIsTruthful, plainCopy(getGuideTopic('ascent')!.body), ["At an exact fixed Paragon home, that same Bioscan can also add only the exact Paragon catalogue record", "it creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "This catalogue exception does not count as the Chapter 2 capture milestone"]],
    ] as const;
    for (const [predicate, original, anchors] of cases) {
      expect(predicate(original)).toBe(true);
      for (const anchor of anchors) {
        expect(original.split(anchor), anchor).toHaveLength(2);
        const changed = original.replace(anchor, 'isolated Paragon boundary omitted');
        expect(changed).not.toBe(original);
        expect(predicate(changed), anchor).toBe(false);
        expect(predicate(original), anchor + ' restored').toBe(true);
      }
      for (const copy of ["Found Paragons plot a course instead of opening Inspect.", "Missing silhouettes open Inspect instead of plotting a course.", "Discover Life on any world adds a Paragon catalogue record.", "An ordinary-world Bioscan catalogues a species.", "A Paragon sighting creates an owned companion.", "A Paragon sighting creates a specimen.", "A Paragon sighting grants Capture credit.", "A Paragon sighting spends 1 Biosphere Yield.", "A Paragon sighting automatically pays 120 Stardust.", "Seeker of Legends is claimable after one Paragon.", "Repeat Paragon sightings add a discovery reward.", "A prior Paragon-set claim can pay again.", "Returning to a previously recorded Paragon home backfills its catalogue record."]) {
        expect(predicate(original + ' ' + copy), copy).toBe(false);
        expect(predicate(original), copy + ' restored').toBe(true);
      }
    }
    const draft = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets);
    const records = draft.find((row) => row.includes('EVERY EXPEDITION HAS A RANKED RECORD'))!;
    expect(binderReleaseCopyIsTruthful(records)).toBe(true);
    for (const anchor of ["Records also houses the Binder’s six established type pages and eight current-proof Set claims", "the Fifty-Paragon hunt is live, and prior Set claims remain claimed", "Missing silhouettes plot their source-proven homes, while found entries use Inspect to open the exact Compendium record without travel", "Seeker of Legends is a separate Binder Claim at ten exact Paragons for 120 Stardust once", "a sighting never pays that Set reward automatically"]) {
      expect(records.split(anchor), anchor).toHaveLength(2);
      expect(binderReleaseCopyIsTruthful(records.replace(anchor, 'omitted'))).toBe(false);
      expect(binderReleaseCopyIsTruthful(records)).toBe(true);
    }
    const legends = draft.filter((row) => row.includes('FOLLOW THE FIFTY:'));
    expect(legends).toHaveLength(1);
    const original = legends[0]!;
    const truthful = (copy: string) => ["FOLLOW THE FIFTY:", "A missing silhouette plots its source-proven home through existing ship and Prime reach checks", "a found entry uses Inspect to open its exact existing Compendium record without travel", "Back returns to the Compendium list", "Discover Life at an exact fixed home adds only that Paragon catalogue record in the same verified save", "with no owned companion or specimen, no Capture credit and no Biosphere Yield spend", "Repeat sightings add no duplicate record or discovery reward", "Seeker of Legends becomes claimable after ten exact Paragons through a separate Binder Claim and pays its established 120 Stardust once", "a sighting never pays that Set reward automatically"].every((part) => copy.includes(part))
      && !PARAGON_COPY_CONTRADICTION.test(copy);
    expect(truthful(original)).toBe(true);
    for (const anchor of ["FOLLOW THE FIFTY:", "A missing silhouette plots its source-proven home through existing ship and Prime reach checks", "a found entry uses Inspect to open its exact existing Compendium record without travel", "Back returns to the Compendium list", "Discover Life at an exact fixed home adds only that Paragon catalogue record in the same verified save", "with no owned companion or specimen, no Capture credit and no Biosphere Yield spend", "Repeat sightings add no duplicate record or discovery reward", "Seeker of Legends becomes claimable after ten exact Paragons through a separate Binder Claim and pays its established 120 Stardust once", "a sighting never pays that Set reward automatically"]) {
      expect(original.split(anchor), anchor).toHaveLength(2);
      expect(truthful(original.replace(anchor, 'omitted')), anchor).toBe(false);
    }
    for (const copy of ["Found Paragons plot a course instead of opening Inspect.", "Missing silhouettes open Inspect instead of plotting a course.", "Discover Life on any world adds a Paragon catalogue record.", "An ordinary-world Bioscan catalogues a species.", "A Paragon sighting creates an owned companion.", "A Paragon sighting creates a specimen.", "A Paragon sighting grants Capture credit.", "A Paragon sighting spends 1 Biosphere Yield.", "A Paragon sighting automatically pays 120 Stardust.", "Seeker of Legends is claimable after one Paragon.", "Repeat Paragon sightings add a discovery reward.", "A prior Paragon-set claim can pay again.", "Returning to a previously recorded Paragon home backfills its catalogue record."]) {
      expect(truthful(original + ' ' + copy), copy).toBe(false);
      expect(binderReleaseCopyIsTruthful(records + ' ' + copy), copy).toBe(false);
    }
    expect(truthful(original)).toBe(true);
  });

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
    expect(topics.filter((topic) => topic.availability === 'partial')).toHaveLength(35);
    expect(topics.filter((topic) => topic.availability === 'unavailable')).toHaveLength(6);
    expect(topics.filter((topic) => topic.availability === 'partial')
      .every((topic) => topic.body !== topic.legacyBody)).toBe(true);
    expect(topics.some((topic) => topic.id === 'beacon' || topic.id === 'events')).toBe(false);
  });

  it('uses Pureforged in current v2 copy while preserving the frozen historical name', () => {
    const currentGuideCopy = getGuideCatalogue()
      .flatMap((category) => category.topics)
      .map((topic) => topic.body)
      .join('\n');
    const currentReleaseCopy = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .join('\n');
    const usesApprovedCurrentName = (copy: string): boolean =>
      /\bPureforged\b/.test(copy)
      && !/\bExceptionally Forged\b/.test(copy)
      && !/\bexceptional-v1\b/.test(copy);

    expect(usesApprovedCurrentName(currentGuideCopy)).toBe(true);
    expect(usesApprovedCurrentName(currentReleaseCopy)).toBe(true);
    expect(usesApprovedCurrentName(
      currentGuideCopy.replace(/\bPureforged\b/, 'Exceptionally Forged'),
    )).toBe(false);
    expect(legacyGuideTopics().map((topic) => topic.body).join('\n'))
      .toContain('Exceptionally Forged');
  });

  it('documents durable explorer rename and the exact Share/Follow/travel/Atlas event owners', () => {
    const codes = getGuideTopic('codes')!.body;
    const atlas = getGuideTopic('atlas')!.body;
    const rank = getGuideTopic('rank')!.body;
    const settings = getGuideTopic('settings')!.body;
    const bullets = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets);
    const worldCodes = bullets.find((bullet) =>
      bullet.includes('WORLD CODES KEEP THE WHOLE DESTINATION'));
    const rankBullet = bullets.find((bullet) =>
      bullet.includes('EVERY EXPEDITION HAS A RANKED RECORD'));

    expect(worldCodes).toBeDefined();
    expect(rankBullet).toBeDefined();
    expect(cf1SharingGuideCopyIsTruthful(codes)).toBe(true);
    expect(atlasGuideCopyIsTruthful(atlas)).toBe(true);
    for (const fact of [
      'semantic <b>List</b> and <b>Chart</b> views',
      'filter All, Favorites, Visited, Conquered, or Life',
      "Nearby Chart lights share one large control when their touch targets would overlap",
      "Choose that control to open a bounded list of its exact destinations",
      "<b>Return to Chart</b> restores the originating control",
      "This selection spends nothing and travels nowhere",
      'source-proven route coordinates',
      'Exact canonical world keys own Visited and Conquered',
      'one receipt and one compare-and-swap',
      'present-or-absent route sidecar',
      'available for eight seconds',
    ]) {
      expect(atlas).toContain(fact);
      expect(atlasGuideCopyIsTruthful(atlas.replace(fact, 'omitted'))).toBe(false);
      expect(atlasGuideCopyIsTruthful(atlas)).toBe(true);
    }
    for (const contradiction of ["The legacy chart view, home marker, and undo are not yet ported", "Chart cluster selection travels automatically", "Chart filters spend Stardust", "Home can travel an unavailable route", "Remove discards another row", "Undo lasts forever", "Undo survives another Atlas mutation", "Same-seed worlds share Visited and Conquered"]) {
      expect(atlasGuideCopyIsTruthful(atlas + ' ' + contradiction)).toBe(false);
      expect(atlasGuideCopyIsTruthful(atlas)).toBe(true);
    }
    const atlasRelease = bullets.find((bullet) => bullet.includes('THE ATLAS LEADS BACK'));
    expect(atlasRelease).toBeDefined();
    const glassCopySource = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
    const atlasStart = '            atlasRouteContract=';
    const atlasEnd = ',\n            captureBioscanContradiction=';
    expect(glassCopySource.split(atlasStart)).toHaveLength(2);
    const atlasExpression = glassCopySource.slice(glassCopySource.indexOf(atlasStart) + atlasStart.length,
      glassCopySource.indexOf(atlasEnd, glassCopySource.indexOf(atlasStart)));
    expect(atlasExpression).toContain('atlasRouteText.includes');
    const actualGlassAtlasContract = Function('atlasRouteText', 'return (' + atlasExpression + ');') as (copy: string) => boolean;
    const atlasReleaseText = plainCopy(atlasRelease!);
    expect(actualGlassAtlasContract(atlasReleaseText)).toBe(true);
    for (const fact of ["Star Atlas restores semantic List and Chart views plus All, Favorites, Visited, Conquered, and Life filters", "Overlapping Chart targets become one large control for a bounded exact-destination list", "Return to Chart restoring focus and no automatic travel", "Chart coordinates come only from source-proven route sidecars", "the current view has its own marker", "canonical world-key history keeps same-seed worlds independent", "only legacy p-seed rows use preserved seed facts", "Favorite, Home, and Remove each settle one exact row through one receipt and one compare-and-swap with no retry or optimistic publication", "Travel Home remains honest when its route is unavailable", "Remove preserves every survivor", "one eight-second Undo that restores the exact pair, source position, Home state, and present-or-absent route sidecar", "another Atlas mutation, route-identity change, or convergence reload expires it"]) {
      expect(atlasReleaseText.split(fact)).toHaveLength(2);
      expect(actualGlassAtlasContract(atlasReleaseText.replace(fact, 'omitted'))).toBe(false);
      expect(actualGlassAtlasContract(atlasReleaseText)).toBe(true);
    }
    for (const contradiction of ["The legacy chart view, home marker, and undo are not yet ported", "Chart cluster selection travels automatically", "Chart filters spend Stardust", "Home can travel an unavailable route", "Remove discards another row", "Undo lasts forever", "Undo survives another Atlas mutation", "Same-seed worlds share Visited and Conquered"]) {
      expect(actualGlassAtlasContract(atlasReleaseText + ' ' + contradiction)).toBe(false);
      expect(actualGlassAtlasContract(atlasReleaseText)).toBe(true);
    }
    expect(cf1SharingReleaseCopyIsTruthful(worldCodes!)).toBe(true);
    expect(releaseTravelRowsAgree(worldCodes!, rankBullet!)).toBe(true);
    expect(rankGuideCopyIsTruthful(rank)).toBe(true);
    expect(rankReleaseCopyIsTruthful(rankBullet!)).toBe(true);
    expect(settings).toContain('Explorer name → Change name');
    expect(settings).toContain('combat deliberately ignores Creature voices');
    expect(settings).toContain('never grants the discovery-name <code>namer</code> achievement');

    expect(cf1SharingGuideCopyIsTruthful(
      codes.replace('independently of whether clipboard access succeeds', 'clipboard ownership omitted'),
    )).toBe(false);
    expect(cf1SharingReleaseCopyIsTruthful(
      worldCodes!.replace('Ordinary direct navigation cannot own Follow, Jumps, or wayfarer', 'Ordinary direct navigation earns Follow'),
    )).toBe(false);
    expect(cf1SharingGuideCopyIsTruthful(
      codes.replace('galaxy-visit ledger, and any source-proved quasar or dwarf-galaxy achievement', 'arrival join omitted'),
    )).toBe(false);
    expect(cf1SharingReleaseCopyIsTruthful(
      worldCodes!.replace('galaxy visit and any source-proved quasar or dwarf-galaxy event', 'wayfarer only'),
    )).toBe(false);
    expect(cf1SharingGuideCopyIsTruthful(
      codes.replace('the submitted Follow settles next without an intervening progression write', 'the progression catch-up runs before Follow'),
    )).toBe(false);
    expect(cf1SharingReleaseCopyIsTruthful(
      worldCodes!.replace('a post-name route that refuses or otherwise does not join progression queues exactly one later bounded catch-up for the already-committed name', 'every named route queues its catch-up before Follow'),
    )).toBe(false);
    expect(releaseTravelRowsAgree(
      worldCodes!.replace('still owns its source-proved arrival and galaxy-event aggregate', 'owns no arrival or galaxy events'),
      rankBullet!,
    )).toBe(false);
    expect(atlasGuideCopyIsTruthful(
      atlas.replace('first explicit false-to-true choice owns <code>curator</code>', 'imported favorites infer <code>curator</code>'),
    )).toBe(false);
    expect(rankGuideCopyIsTruthful(
      rank.replace('deliberately does not unlock the discovery-name <code>namer</code> achievement', 'rename achievement boundary omitted'),
    )).toBe(false);
    expect(rankReleaseCopyIsTruthful(
      rankBullet!.replace('deliberately does not grant the discovery-name namer achievement', 'rename achievement boundary omitted'),
    )).toBe(false);
    expect(recordsGuideCopyIsTruthful(
      getGuideTopic('achievements')!.body.replace('<code>daily</code> and <code>decade</code>', 'blocked-owner list omitted'),
    )).toBe(false);
    expect(rankReleaseCopyIsTruthful(
      rankBullet!.replace('daily and decade', 'blocked-owner list omitted'),
    )).toBe(false);

    for (const contradiction of [
      ' Ordinary direct navigation earns Follow and wayfarer.',
      ' Share automatically retries after a failed write.',
    ]) {
      expect(cf1SharingGuideCopyIsTruthful(codes + contradiction), contradiction).toBe(false);
      expect(cf1SharingReleaseCopyIsTruthful(worldCodes! + contradiction), contradiction).toBe(false);
    }
    const renameContradiction =
      ' Explorer self-rename grants the discovery-name namer achievement.';
    expect(rankGuideCopyIsTruthful(rank + renameContradiction)).toBe(false);
    expect(rankReleaseCopyIsTruthful(rankBullet! + renameContradiction)).toBe(false);
  });

  it('uses current-slice copy for partial topics and explicit copy for unavailable topics', () => {
    const codes = getGuideTopic('codes');
    const breeding = getGuideTopic('breeding');
    const feeding = getGuideTopic('feeding');
    expect(codes?.availability).toBe('partial');
    expect(codes?.body).toContain('not yet available');
    expect(codes?.body).toContain('selected in Search');
    expect(codes?.body).toContain('browser’s Copy command');
    expect(codes?.body).not.toContain('the identical creature, stats and all');
    expect(breeding?.availability).toBe('partial');
    expect(breedingCopyIsTruthful(breeding?.body ?? '')).toBe(true);
    expect(breeding?.body).not.toBe(breeding?.legacyBody);
    expect(feeding?.availability).toBe('partial');
    expect(feedingCopyIsTruthful(feeding?.body ?? '')).toBe(true);
    expect(getGuideTopic('injuries')?.availability).toBe('partial');
    expect(getGuideTopic('injuries')?.body).toContain('bred champion crawls home Critical');
    expect(getGuideTopic('injuries')?.body).toContain('healing, broader care');
    expect(getGuideTopic('eating')?.availability).toBe('partial');
    expect(getGuideTopic('eating')?.body).toContain('real Flora Compendium detail');
    expect(getGuideTopic('eating')?.body).toContain('beta-safe meal rule stops at <b>1 HP</b>');
    expect(getGuideTopic('settings')?.crossLinks).toContain('saving');
    expect(getGuideTopic('settings')?.body).toContain('Star charts');
    expect(getGuideTopic('settings')?.body).toContain('Creature voices');
    expect(getGuideTopic('settings')?.body).toContain(
      'Creature voices governs the verified Tame, committed Feed, and explicit owned-fauna Listen expressions',
    );
    expect(getGuideTopic('settings')?.body).toContain(
      'Sound governs all audio, including the generic Planetside biosphere signal',
    );
    expect(getGuideTopic('settings')?.body).toContain(
      'every registered post-settlement Combat Chronicle cue',
    );
    expect(getGuideTopic('settings')?.body).toContain('current <b>15-card</b> drill in Sol');
    expect(getGuideTopic('settings')?.body).toContain(
      'every ordinary save-mutating preference and Training control—including Creature voices and both sliders—remains inspection-only',
    );
    expect(getGuideTopic('settings')?.body).toContain(
      'a protected reload is the only recovery path',
    );
    expect(getGuideTopic('settings')?.body).toContain(
      'stops active-play eligibility and accrual immediately, then converges through a protected reload instead of silently reacquiring',
    );
    expect(getGuideTopic('determinism')?.body).toContain(
      'two different worlds that happen to share a planet seed remain separate',
    );
    expect(getGuideTopic('atlas')?.body).toContain('saved galaxies, stars, and worlds');
    expect(getGuideTopic('atlas')?.body).toContain('A world entry reopens its system survey');
    expect(getGuideTopic('atlas')?.body).toContain('source-verified destination');
    expect(getGuideTopic('atlas')?.body).toContain('stale, forged, or incomplete');
    expect(getGuideTopic('atlas')?.body).toContain('visible but disabled');
    expect(getGuideTopic('atlas')?.body).toContain('out-of-reach entry leaves you in place');
    expect(getGuideTopic('landing')?.body).toContain('out-of-reach route leaves you in place');
    expect(getGuideTopic('landing')?.body).toContain(
      'complete verified hierarchy and planet ordinal rather than the planet seed alone',
    );
    expect(getGuideTopic('charters')?.body).toContain(
      'complete registered home-galaxy, Sol-star, planet-seed, and source-ordinal hierarchy',
    );
    expect(getGuideTopic('charters')?.body).toContain('a matching leaf seed elsewhere earns nothing');
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
    expect(determinism?.body).toContain('Landed deterministic conquest duels and their verified Combat Chronicle are live');
    expect(determinism?.body).toContain('Friendly or imported creature-code duels and shared timed events');
    expect(determinism?.body).not.toContain('duels fair, and events shared');
    expect(getGuideTopic('saving')?.body).toContain('returns safely to <b>Cosmos</b>');
    expect(getGuideTopic('saving')?.body).toContain('without losing the rest of your expedition progress');
    expect(getGuideTopic('ascent')?.availability).toBe('partial');
    expect(getGuideTopic('ascent')?.body).toContain('first landfalls, successful Mine actions, successful fixed Fabricator outputs, one successful companion Breed');
    expect(getGuideTopic('ascent')?.body).toContain('Research and Skim bank neither');
    expect(getGuideTopic('ascent')?.body).toContain('Chapter 1 is now completable through real play');
    expect(getGuideTopic('ascent')?.body).toContain('owned system that backs the next reach stage');
    expect(getGuideTopic('ascent')?.body).toContain('without invented goals, rewards, systems, or reach');
    expect(getGuideTopic('ascent')?.body).toContain('Saved Prime Signatures');
    expect(charterCaptureBoundaryIsTruthful(getGuideTopic('ascent')!.body)).toBe(true);
    expect(getGuideTopic('charters')?.body).toContain('first landfalls, successful <b>Mine</b> actions, successful fixed <b>Fabricator</b> outputs, one successful companion <b>Breed</b>');
    expect(getGuideTopic('charters')?.body).toContain('Each Mine press banks one mining-goal tick');
    expect(getGuideTopic('charters')?.body).toContain('Research and Skim do not counterfeit');
    expect(getGuideTopic('charters')?.body).toContain('newly built Jump Drive, Long-Range Array, or Intergalactic Drive');
    expect(getGuideTopic('charters')?.body).toContain('canonical progress and owned reach');
    expect(charterCaptureBoundaryIsTruthful(getGuideTopic('charters')!.body)).toBe(true);
    for (const id of ['charters', 'ascent'] as const) {
      const original = getGuideTopic(id)!.body;
      const required = 'An accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt; older Surveys and capture do not count.';
      expect(original.split(required), `${id} exact bioscan boundary`).toHaveLength(2);
      expect(charterCaptureBoundaryIsTruthful(
        original.replace(required, 'bioscan Charter boundary omitted'),
      ), `${id} missing bioscan boundary`).toBe(false);
      expect(charterCaptureBoundaryIsTruthful(original), `${id} restoration`).toBe(true);
    }
    expect(getGuideTopic('regions')?.body).toContain('permanent ship systems');
    expect(getGuideTopic('regions')?.body).toContain('eligible fixed Fabricator recipes');
    expect(getGuideTopic('regions')?.body).toContain('In-progress chapter state never invents a permanent system');
    expect(getGuideTopic('regions')?.body).toContain('fully completed imported veteran Charter preserves intergalactic reach');
    expect(getGuideTopic('regions')?.body).toContain('saved Prime Signatures');
    expect(getGuideTopic('achievements')?.availability).toBe('partial');
    expect(getGuideTopic('achievements')?.body).toContain('imported exploration totals');
    expect(getGuideTopic('achievements')?.body).toContain('First landfalls visibly update');
    expect(getGuideTopic('achievements')?.body).toContain('Arc 3 counters are not yet listed as separate Records totals');
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
    expect(getGuideTopic('hp')?.body).toContain('1 HP mercy floor');
    expect(getGuideTopic('hp')?.body).toContain('On the Brink');
    expect(V2_DEVELOPMENT_GUIDE_CAPABILITIES).toContain('life-discovery');
    expect(V2_DEVELOPMENT_GUIDE_CAPABILITIES).toContain('breeding');
    expect(V2_DEVELOPMENT_GUIDE_CAPABILITIES).toEqual(expect.arrayContaining([
      'creature-care', 'ranks', 'achievements', 'creature-progression',
      'conquest', 'guardians', 'prime-codex',
    ]));
    expect(getGuideTopic('discover')?.availability).toBe('partial');
    expect(captureGuideCopyIsTruthful(getGuideTopic('discover')!.body)).toBe(true);
    const audioBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('THE FRONTIER SPEAKS'));
    const tameGreetingFixBullet = V2_DRAFT_RELEASE.sections
      .find((section) => section.category === 'Bug Fixes')
      ?.bullets.find((bullet) => bullet.includes('A NEWLY TAMED CREATURE CAN GREET YOU'));
    expect(audioBullet).toContain('verified durable wild-fauna Tame');
    expect(audioBullet).toContain('durable nonconverging Feed commit');
    expect(audioBullet).toContain('explorer-requested call from one exact owned-fauna detail');
    expect(audioBullet).toContain('current visible accessible counterpart');
    expect(audioBullet).toContain('without retry or replay');
    expect(audioBullet).toContain('explicit pre-landing Survey and Planetside biosphere Listen');
    expect(audioBullet).toContain('distinct approach/roster evidence');
    expect(audioBullet).toContain('reveal no species, spend no Yield, grant nothing, and write no save');
    expect(audioBullet).toContain('After a verified settlement, the Combat Chronicle');
    expect(audioBullet).toContain('every already-modelled registered cue its own exact visible-caption sound');
    expect(audioBullet).toContain('initiative, dodge, stun, damage with critical or ability layers, burn, regeneration, defeat, resolution');
    expect(audioBullet).toContain('Guardian or Titan entrance, phase, victory, and defeat motifs');
    expect(audioBullet).toContain('at most two combat voices overlap');
    expect(audioBullet).toContain('master Sound governs them, Creature voices does not');
    expect(audioBullet).toContain('Authored ambience, music, recorded assets, and other creature actions remain future work');
    const creatureListenBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('CREATURE CALLS ARE YOURS TO REQUEST'));
    const biosphereListenBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('HEAR A LIVING WORLD WITHOUT SPOILERS'));
    expect(creatureListenBullet).toContain('Browsing, filtering, focusing, and returning through the Compendium never auto-play it');
    expect(biosphereListenBullet).toContain(
      'pre-landing Survey card and landed Planetside both offer Listen to biosphere',
    );
    expect(biosphereListenBullet).toContain('never names a hidden species, spends Yield, grants a discovery or reward, or changes the save');
    expect(tameGreetingFixBullet).toContain('two different save revisions');
    expect(tameGreetingFixBullet).toContain('keeping stale results silent');
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

    for (const required of [
      'every direct material unit for a slotted craft comes from exceptional stock',
      'mining yield, rich-strike chance, or capture-contact points',
      'bound to its recipe and receipt',
      'mixed stock remains an ordinary craft',
    ]) {
      expect(research!.body.split(required)).toHaveLength(2);
      expect(engineeringGuideCopyIsTruthful(
        research!.body.replace(required, 'Pureforged boundary removed'),
      ), required).toBe(false);
      expect(engineeringGuideCopyIsTruthful(research!.body), `${required} restoration`).toBe(true);
    }
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' Research ignores prerequisites and cost.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' The current Survey card does not yet render those orbital rows.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' Orbit now shows cosmic veins and grades.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' Research banks one Charter fabrication goal.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' The legacy charter refit names an unowned Intergalactic Drive.',
    )).toBe(false);
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' Hardpoints are inferred from the chassis stage.',
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
    expect(engineeringGuideCopyIsTruthful(
      research!.body + ' A Research purchase ignores prerequisites and revision.',
    )).toBe(false);
    expect(inventoryGuideCopyIsTruthful(
      crafting!.body.replace('only equipped copies change', 'held copies also change'),
    )).toBe(false);
    const dormantCraftingClaims = [
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
      engineeringBullet! + ' Research purchases bypass cost and revision checks.',
    )).toBe(false);
    expect(engineeringReleaseCopyIsTruthful(
      engineeringBullet!.replace(
        'Engineering can spend preserved Stardust but does not earn it',
        'Engineering Stardust boundary omitted',
      ),
    )).toBe(false);
    expect(engineeringReleaseCopyIsTruthful(
      engineeringBullet!.replace(
        'six durably purchasable Research rows',
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

  it('separates Survey reveal and Engineering extraction from random finite Planetside capture', () => {
    const survey = getGuideTopic('survey')!.body;
    const capture = getGuideTopic('discover')!.body;
    const rarity = getGuideTopic('rarity')!.body;
    const mining = getGuideTopic('mining')!.body;
    const skimming = getGuideTopic('skimming')!.body;
    const stardust = getGuideTopic('stardust')!.body;
    const captureBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('DISCOVER LIFE AND CAPTURE HAVE HONEST LIMITS'));
    expect(surveyBoundaryCopyIsTruthful(survey)).toBe(true);
    expect(getGuideTopic('discover')?.availability).toBe('partial');
    expect(captureGuideCopyIsTruthful(capture)).toBe(true);
    expect(rarityCaptureCopyIsTruthful(rarity)).toBe(true);
    expect(miningGuideCopyIsTruthful(mining)).toBe(true);
    expect(skimmingGuideCopyIsTruthful(skimming)).toBe(true);
    expect(stardustGuideCopyIsTruthful(stardust)).toBe(true);
    expect(captureBullet).toBeDefined();
    expect(captureReleaseCopyIsTruthful(captureBullet!)).toBe(true);

    /* Missing-anchor and contradictory controls are independent: each must
       turn the same semantic predicate red for the intended reason. */
    expect(surveyBoundaryCopyIsTruthful(
      survey.replace('selection is navigation and inspection', 'selection boundary omitted'),
    )).toBe(false);
    expect(surveyBoundaryCopyIsTruthful(
      survey + ' Survey catalogues life and makes a capture attempt.',
    )).toBe(false);
    expect(surveyBoundaryCopyIsTruthful(
      survey + ' The current Survey card now renders every orbital mineral.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture.replace(
        'choose uniformly from every eligible species for that action in the full biosphere',
        'choose from the visible preview',
      ),
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' The player chooses a visible species row to target.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' Sample creates a living companion.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture.replace('Every attempt spends 1 Yield on a hit or miss', 'Only a hit spends Yield'),
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' The Yield pool recovers while the game is closed.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' A later-cycle repeat earns a new Rare Find reward.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' Capture advances the Charter bioscan milestone.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' A miss banks one Chapter 2 life-discovery tick.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' A successful capture on Sol banks one Charter bioscan tick.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' A later success on the same world banks another life-discovery tick.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' An older Survey completes the accepted Discover Life Starter Charter retroactively.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture.replace(
        'each capture-chance point contributes <b>1.5 percentage points</b> before the <b>95% overall chance ceiling</b>, with the gear contribution capped at <b>+25 percentage points</b>',
        'capture-chance gear changes the odds',
      ),
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture + ' First contact is now available.',
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture.replace(
        'both the pre-landing Survey card and landed Planetside',
        'landed Planetside',
      ),
    )).toBe(false);
    expect(captureGuideCopyIsTruthful(
      capture.replace('distinct approach/roster evidence', 'shared unbound evidence'),
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet!.replace(
        'Tame chooses uniformly from eligible fauna in the full biosphere',
        'Tame targets one visible fauna row',
      ),
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' Tame targets the selected preview row.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' Scavenge adds a living companion.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet!.replace('every hit or miss spends 1', 'only a hit spends 1'),
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' The Yield pool recovers while the game is closed.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' A later-world repeat earns a second Compendium page.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' Capture counts for the Charter bioscan milestone.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' A stale tab still banks one life-discovery tick.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' A failed write advances the Charter bioscan.',
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet!.replace(
        '1.5 percentage points per point before the 95% overall ceiling, capped at +25 points',
        'an unspecified bonus',
      ),
    )).toBe(false);
    expect(captureReleaseCopyIsTruthful(
      captureBullet! + ' First contact is now available.',
    )).toBe(false);
    expect(rarityCaptureCopyIsTruthful(
      rarity.replace('result shows the exact amount', 'rare reward amount omitted'),
    )).toBe(false);
    expect(rarityCaptureCopyIsTruthful(
      rarity + ' The player selects a preview row to target.',
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
      stardust.replace('A verified conquest win awards <b>8 + five times world tier</b> Stardust', 'conquest earning boundary omitted'),
    )).toBe(false);
    expect(stardustGuideCopyIsTruthful(
      stardust + ' Survey earns Stardust on every world.',
    )).toBe(false);
    expect(charterCaptureBoundaryIsTruthful(
      getGuideTopic('charters')!.body + ' Capture banks the Charter bioscan milestone.',
    )).toBe(false);
  });

  it('keeps star/drive and saved Prime-radius route boundaries truthful and distinct', () => {
    const reachableRouteTopics = ['landing', 'search', 'codes', 'charters', 'atlas', 'regions'] as const;
    const hasHonestRouteBoundaries = (body: string): boolean => {
      const copy = plainCopy(body);
      const starBoundary = /(?:(?:star beyond owned ship reach|blocked star)[^.!?]{0,160}(?:owned|required)[^.!?]{0,80}permanent system|system beyond the expedition’s owned reach[\s\S]{0,240}permanent ship systems)/i.test(copy);
      const engineeringPath = /Engineering|fixed Fabricator|newly built Jump Drive/i.test(copy);
      const primeBoundary = /(?:galaxy beyond|galaxy-distance radius|Saved Prime Signatures)/i.test(copy)
        && /verified Titan victor(?:y|ies)[^.!?]{0,96}(?:claim|new Signatures)/i.test(copy)
        && /ninth distinct claim unlocks the Frontier/i.test(copy);
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
      && /no longer authorized[^.!?]*saved reach/i.test(body)
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
    const protectedBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('PROTECTED MEANS PROTECTED'))!;
    expect(sourceVerifiesEveryLevel(worldCodeBullet)).toBe(true);
    expect(rejectedCodePreservesCorrection(worldCodeBullet)).toBe(true);
    expect(worldCodeBullet).toContain('without bypassing Land');
    expect(atlasNeedsProof(atlasBullet)).toBe(true);
    expect(protectedBullet).toContain(
      'A source-valid saved destination that is no longer authorized repairs only its location to Cosmos',
    );

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
    expect(staleSavedLocationIsFieldLocal(validSaving.replace(
      ', or if its destination is no longer authorized by your saved reach',
      '',
    ))).toBe(false);
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

  it('documents explorer-controlled installed updates without treating app rollback as save rollback', () => {
    const settings = getGuideTopic('settings')!.body;
    const saving = getGuideTopic('saving')!.body;
    const copyIsTruthful = (settingsCopy: string, savingCopy: string): boolean =>
      settingsCopy.includes(
        'A ready update waits for <b>Activate update</b>, and activation still never reloads the page for you',
      )
      && settingsCopy.includes('One complete prior build may be selected with <b>Roll back</b>')
      && settingsCopy.includes('The local development server deliberately does not register the offline worker')
      && savingCopy.includes(
        'Roll back changes only which complete app-file set will answer after your explicit reload',
      )
      && savingCopy.includes('It never rolls back, copies, or rewrites the IndexedDB expedition')
      && savingCopy.includes('the same <b>Update required</b> protection below still applies')
      && !/activation reloads the page automatically/iu.test(settingsCopy)
      && !/restores? the prior IndexedDB expedition/iu.test(savingCopy);

    expect(copyIsTruthful(settings, saving)).toBe(true);
    expect(copyIsTruthful(settings.replace(
      'activation still never reloads the page for you',
      'activation reloads the page automatically',
    ), saving)).toBe(false);
    expect(copyIsTruthful(settings, saving.replace(
      'It never rolls back, copies, or rewrites the IndexedDB expedition',
      'It restores the prior IndexedDB expedition',
    ))).toBe(false);
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

  it('describes the live graphics controls with their motion and device limits', () => {
    const settings = getGuideTopic('settings')!.body;
    expect(settingsGraphicsCopyIsTruthful(settings)).toBe(true);

    const underclaims = [
      settings.replace(
        '<b>Visual effects</b> Off allocates no frontier fog particles and turns off the live bloom treatment',
        '<b>Visual effects</b> Off changes the scene',
      ),
      settings.replace(
        'Motion Reduced keeps only bounded static atmosphere',
        'Motion Reduced changes the atmosphere',
      ),
      settings.replace(
        'touch/low-tier devices also stay static',
        'device limits omitted',
      ),
      settings.replace(
        'full-motion capable devices may animate capped fog, blazar bloom, and bright-star breathing',
        'full-motion effects omitted',
      ),
      settings.replace(
        'Motion Auto follows the device’s reduced-motion preference live',
        'Motion Auto is available',
      ),
      settings.replace(
        '<b>Screen shake</b> adds only a short deterministic planetfall impulse',
        '<b>Screen shake</b> changes the camera',
      ),
      settings.replace(
        'only when Visual effects, Screen shake, and full motion are all enabled',
        'when Screen shake is enabled',
      ),
      settings.replace(
        'Reduced motion disables shake',
        'Reduced-motion shake behavior omitted',
      ),
      settings.replace(
        'device policy may lower the enabled profile and concurrent-impulse cap, but it can never enable shake',
        'device policy details omitted',
      ),
    ];
    for (const [index, mutant] of underclaims.entries()) {
      expect(mutant, `graphics underclaim ${index} did not mutate the source`).not.toBe(settings);
      expect(settingsGraphicsCopyIsTruthful(mutant), `graphics underclaim ${index}`).toBe(false);
    }

    for (const contradiction of [
      'Visual effects Off can still allocate and animate frontier fog particles.',
      'Reduced motion can animate fog, bloom, and screen shake.',
      'Motion Auto ignores the device reduced-motion preference.',
      'Screen shake works even when Visual effects is Off.',
      'Planetfall shake is random.',
      'Screen shake also runs during travel.',
      'Touch and low-tier devices use the full animated atmosphere.',
      'Device policy can enable Screen shake when its toggle is Off.',
    ]) {
      expect(
        settingsGraphicsCopyIsTruthful(`${settings} ${contradiction}`),
        contradiction,
      ).toBe(false);
      expect(settingsGraphicsCopyIsTruthful(settings), `${contradiction} restoration`).toBe(true);
    }
  });

  it('keeps Compendium browsing bounded while documenting first-find and narrow Feed writes', () => {
    const kingdoms = getGuideTopic('kingdoms')!.body;
    const specimen = getGuideTopic('specimen')!.body;
    const feeding = getGuideTopic('feeding')!.body;
    const artBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('ART ARRIVES WHEN IT IS NEEDED'));
    const feedingBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('TWO EXACT MEAL PATHS, NO INVENTED CARE'));

    expect(artBullet).toBeDefined();
    expect(feedingBullet).toBeDefined();
    expect(compendiumCatalogueCopyIsTruthful(kingdoms)).toBe(true);
    expect(specimenDetailCopyIsTruthful(specimen)).toBe(true);
    expect(feedingCopyIsTruthful(feeding)).toBe(true);
    expect(feedingReleaseCopyIsTruthful(feedingBullet!)).toBe(true);
    for (const required of [
      'emptying that exact lot on its final unit',
      'trusted native Feed gesture',
      'exact current ownership successor',
      'still-current accessible settled status',
      'after that status appears',
    ]) {
      expect(feedingBullet!.split(required)).toHaveLength(2);
      expect(feedingReleaseCopyIsTruthful(
        feedingBullet!.replace(required, 'Feed boundary removed'),
      ), required).toBe(false);
      expect(feedingReleaseCopyIsTruthful(feedingBullet!), `${required} restoration`).toBe(true);
    }
    expect(FEED_RELEASE_REPLAY_SILENCE_COPY.test(feedingBullet!)).toBe(true);
    expect(feedingReleaseCopyIsTruthful(
      feedingBullet!.replace(
        FEED_RELEASE_REPLAY_SILENCE_COPY,
        'replay-silence boundary removed',
      ),
    )).toBe(false);
    expect(feedingReleaseCopyIsTruthful(feedingBullet!)).toBe(true);
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
    expect(compendiumCatalogueCopyIsTruthful(
      kingdoms.replace('successful first Planetside capture can add one page', 'capture write boundary omitted'),
    )).toBe(false);
    expect(compendiumCatalogueCopyIsTruthful(
      kingdoms + ' The player chooses a Compendium row to target.',
    )).toBe(false);
    expect(specimenDetailCopyIsTruthful(
      specimen.replace('Close</b> returns focus to the exact Compendium opener', 'Close</b> dismisses the panel'),
    )).toBe(false);
    expect(specimenDetailCopyIsTruthful(
      specimen + ' Planetside renders a 440px portrait for every row.',
    )).toBe(false);
    expect(specimenDetailCopyIsTruthful(
      specimen + ' The player selects this Compendium row to target.',
    )).toBe(false);
    expect(feedingCopyIsTruthful(
      feeding.replace('one immutable receipt and one compare-and-swap save transaction', 'one ordinary save'),
    )).toBe(false);
    for (const contradiction of [
      ' Assigned companions can still be fed.',
      ' The meal automatically retries after a stale result.',
      ' Stats are now increased by feeding.',
    ]) {
      expect(feedingCopyIsTruthful(feeding + contradiction), contradiction).toBe(false);
      expect(feedingReleaseCopyIsTruthful(feedingBullet! + contradiction), contradiction).toBe(false);
    }
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

  it('documents live Scout, conquest, Prime, ranks, achievements, and starter Charter joins without claiming their open successors', () => {
    const specimen = getGuideTopic('specimen')!.body;
    const conquest = getGuideTopic('conquest')!.body;
    const conquestCopy = plainCopy(conquest);
    const rank = getGuideTopic('rank')!.body;
    const achievements = getGuideTopic('achievements')!.body;
    const charters = getGuideTopic('charters')!.body;
    const stardust = getGuideTopic('stardust')!.body;
    const scoutBullet = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('ONE EXACT FIELD SCOUT, NEVER A GUESS'));
    const combatBullet = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('ONE WORLD, ONE VERIFIED DUEL'));
    const rankBullet = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('EVERY EXPEDITION HAS A RANKED RECORD'));

    expect(getGuideTopic('conquest')?.availability).toBe('partial');
    expect(getGuideTopic('guardians')?.availability).toBe('partial');
    expect(getGuideTopic('signatures')?.availability).toBe('partial');
    expect(getGuideTopic('rank')?.availability).toBe('partial');
    expect(getGuideTopic('classes')?.availability).toBe('partial');
    expect(fieldScoutGuideCopyIsTruthful(specimen)).toBe(true);
    expect(fieldScoutReleaseCopyIsTruthful(scoutBullet ?? '')).toBe(true);
    expect(guardianChampionCopyIsTruthful(conquest)).toBe(true);
    expect(conquestCopy).toMatch(/Only after (?:that )?exact durab(?:le settlement|ility) is verified/i);
    expect(conquestCopy).toMatch(/(?:accessible timed Combat Chronicle|Combat Chronicle opens with named timed transcript rows)/i);
    expect(conquestCopy).toMatch(/two (?:accessible )?HP meters/i);
    expect(conquestCopy).toMatch(/settled statistics and result/i);
    expect(conquestCopy).toMatch(/Skip stops active combat sound[^.!?]{0,96}(?:reveals|completes) the remaining transcript silently/i);
    expect(conquestCopy).toMatch(/Share battle log[^.!?]{0,160}(?:copies plain text|clipboard access works)[^.!?]{0,200}(?:(?:selected|selects) (?:the )?exact log|exact log is selected)/i);
    expect(conquestCopy).toMatch(/Every already-modelled registered initiative, dodge, stun, impact\/critical\/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motif owns an exact visible-caption counterpart/i);
    expect(conquestCopy).toMatch(/Composite events remain one voice/i);
    expect(conquestCopy).toMatch(/at most two combat voices overlap/i);
    expect(conquestCopy).toMatch(/Master Sound—not Creature voices—governs combat/i);
    expect(conquestCopy).toMatch(/Authored or recorded combat assets, ambience, and music remain unavailable/i);
    expect(combatChronicleCopyIsTruthful(conquest)).toBe(true);
    expect(combatGuideCopyIsTruthful(conquest)).toBe(true);
    expect(combatReleaseCopyIsTruthful(combatBullet ?? '')).toBe(true);
    expect(rankGuideCopyIsTruthful(rank)).toBe(true);
    expect(rankReleaseCopyIsTruthful(rankBullet ?? '')).toBe(true);
    expect(recordsGuideCopyIsTruthful(achievements)).toBe(true);
    expect(charterCaptureBoundaryIsTruthful(charters)).toBe(true);
    expect(stardustGuideCopyIsTruthful(stardust)).toBe(true);
    expect(getGuideTopic('guardians')?.body).toContain('battlefield modifiers stripped');
    expect(getGuideTopic('guardians')?.body).toContain('can return as a conquest champion');
    expect(getGuideTopic('guardians')?.body).toContain('immutable tombstone');
    expect(getGuideTopic('signatures')?.body).toContain('ninth distinct claim unlocks the Frontier');
    expect(combatGuideCopyIsTruthful(
      conquest.replace(
        'Only after that exact durable settlement is verified',
        'Combat Chronicle timing omitted',
      ),
    )).toBe(false);
    expect(combatReleaseCopyIsTruthful(
      combatBullet!.replace(
        'Master Sound—not Creature voices—governs playback',
        'Creature voices governs combat impact',
      ),
    )).toBe(false);
    expect(combatGuideCopyIsTruthful(
      conquest.replace(
        'Every already-modelled registered initiative, dodge, stun, impact/critical/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motif owns an exact visible-caption counterpart',
        'Combat audio has no visible counterpart',
      ),
    )).toBe(false);
    expect(combatGuideCopyIsTruthful(
      conquest.replace(
        'rather than being inserted into ordinary Arc 5 companion ownership',
        'and are inserted into ordinary Arc 5 companion ownership',
      ),
    )).toBe(false);
    expect(combatReleaseCopyIsTruthful(
      combatBullet!.replace(
        'defeat permanently removes them through an immutable tombstone',
        'they can recover after defeat',
      ),
    )).toBe(false);

    for (const [label, predicate, original, mutant] of [
      [
        'Scout exact-five settlement', fieldScoutGuideCopyIsTruthful, specimen,
        specimen.replace('One exact-five compare-and-swap settles that choice', 'Scout settlement omitted'),
      ],
      [
        'Scout pointer-only release', fieldScoutReleaseCopyIsTruthful, scoutBullet!,
        scoutBullet!.replace('Assigned, recovering, and injured companions stay eligible because the selector itself changes only the Scout pointer', 'pointer-only eligibility omitted'),
      ],
      [
        'combat forecast', combatGuideCopyIsTruthful, conquest,
        conquest.replace('exact <b>160-run deterministic forecast</b>', 'forecast omitted'),
      ],
      [
        'combat CAS', combatReleaseCopyIsTruthful, combatBullet!,
        combatBullet!.replace('One immutable receipt and one compare-and-swap settle one deterministic duel', 'combat settlement omitted'),
      ],
      [
        'rank factors', rankGuideCopyIsTruthful, rank,
        rank.replace('Expedition score is the sum of six visible factors', 'score factors omitted'),
      ],
      [
        'event owners', recordsGuideCopyIsTruthful, achievements,
        achievements.replace('The other 28 achievements require their exact live event owner', 'event ownership omitted'),
      ],
      [
        'starter reward', charterCaptureBoundaryIsTruthful, charters,
        charters.replace('adds <b>25 Stardust</b>', 'reward amount omitted'),
      ],
    ] as const) {
      expect(mutant, `${label} mutant did not change`).not.toBe(original);
      expect(predicate(mutant), label).toBe(false);
      expect(predicate(original), `${label} restoration`).toBe(true);
    }

    expect(fieldScoutGuideCopyIsTruthful(
      `${specimen} A miss grants Scout XP.`,
    )).toBe(false);
    expect(fieldScoutReleaseCopyIsTruthful(
      `${scoutBullet} The captured creature receives the Scout XP.`,
    )).toBe(false);
    expect(combatGuideCopyIsTruthful(
      `${conquest} Combat automatically retries and rerolls after a stale write.`,
    )).toBe(false);
    expect(combatReleaseCopyIsTruthful(
      `${combatBullet} wk-conq completes and awards its weekly reward.`,
    )).toBe(false);
    expect(rankGuideCopyIsTruthful(
      `${rank} Boot catch-up announces a rank promotion.`,
    )).toBe(false);
    expect(rankReleaseCopyIsTruthful(
      `${rankBullet} Achievement rewards are now claimable.`,
    )).toBe(false);
  });

  it('documents Starter Charters, Binder claims, progression ceremonies, and Frontier endings at their exact live boundaries', () => {
    const charters = getGuideTopic('charters')!.body;
    const binder = getGuideTopic('binder')!.body;
    const achievements = getGuideTopic('achievements')!.body;
    const endings = getGuideTopic('endings')!.body;
    const bullets = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets);
    const charterBullet = bullets.find((bullet) =>
      bullet.includes('THE CHARTER STOPS AT THE LIVE FRONTIER'))!;
    const recordsBullet = bullets.find((bullet) =>
      bullet.includes('EVERY EXPEDITION HAS A RANKED RECORD'))!;
    const frontierBullet = bullets.find((bullet) =>
      bullet.includes('THE FRONTIER HONORS YOUR PROGRESS'))!;

    expect(getGuideTopic('binder')?.availability).toBe('partial');
    expect(getGuideTopic('endings')?.availability).toBe('partial');
    expect(charterCaptureBoundaryIsTruthful(charters)).toBe(true);
    expect(starterCharterReleaseCopyIsTruthful(charterBullet)).toBe(true);
    expect(binderGuideCopyIsTruthful(binder)).toBe(true);
    expect(binderReleaseCopyIsTruthful(recordsBullet)).toBe(true);
    expect(progressionCeremonyGuideCopyIsTruthful(achievements)).toBe(true);
    expect(progressionCeremonyReleaseCopyIsTruthful(recordsBullet)).toBe(true);
    expect(frontierEndingGuideCopyIsTruthful(endings)).toBe(true);
    expect(frontierEndingReleaseCopyIsTruthful(frontierBullet)).toBe(true);

    for (const [label, predicate, original, mutant] of [
      [
        'starter full-address authority', starterCharterReleaseCopyIsTruthful, charterBullet,
        charterBullet.replace('Full-address Sol hierarchy is required; a matching leaf seed elsewhere earns nothing', 'A matching leaf planet seed is enough'),
      ],
      [
        'Binder Paragon boundary', binderGuideCopyIsTruthful, binder,
        binder.replace("which opens that exact existing Compendium record without travel or acquisition", "which plots a course instead of opening the exact record"),
      ],
      [
        'Binder atomic reward', binderReleaseCopyIsTruthful, recordsBullet,
        recordsBullet.replace('in one receipt and one compare-and-swap with no retry or optimistic reward', 'in an ordinary save'),
      ],
      [
        'ceremony recovery silence', progressionCeremonyGuideCopyIsTruthful, achievements,
        achievements.replace('Boot catch-up, replay, already-durable recovery, Training, convergence, and refusals stay silent', 'Recovery catch-up announces every award'),
      ],
      [
        'ending Balance predicate', frontierEndingGuideCopyIsTruthful, endings,
        endings.replace('at least 40 catalogued species', 'at least 4 catalogued species'),
      ],
      [
        'ending one-choice durability', frontierEndingReleaseCopyIsTruthful, frontierBullet,
        frontierBullet.replace('cannot overwrite a prior choice, never retry or publish optimistically', 'can overwrite and retry the prior choice'),
      ],
    ] as const) {
      expect(mutant, `${label} mutant did not change`).not.toBe(original);
      expect(predicate(mutant), label).toBe(false);
      expect(predicate(original), `${label} restoration`).toBe(true);
    }
  });

  it('documents the bounded nonlethal Breed and active-play Recovery outcome without exposing legacy overclaims', () => {
    const breeding = getGuideTopic('breeding')!.body;
    const breedingBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('TWO PARENTS, ONE DURABLE OUTCOME'));
    expect(breedingBullet).toBeDefined();
    expect(breedingCopyIsTruthful(breeding)).toBe(true);
    expect(breedingReleaseCopyIsTruthful(breedingBullet!)).toBe(true);

    for (const [label, guideMutant, releaseMutant] of [
      [
        'parent survival',
        breeding.replace('Both parents remain yours', 'Parent survival boundary omitted'),
        breedingBullet!.replace('Parents are never consumed', 'Parent survival boundary omitted'),
      ],
      [
        'child union XP',
        breeding.replace('grants that child <b>+2 XP</b>', 'child XP omitted'),
        breedingBullet!.replace('one deterministic child with +2 XP', 'one deterministic child'),
      ],
      [
        'canonical unordered-pair XP',
        breeding.replace('first successful union of each canonical unordered species pair grants the child another <b>+5 XP</b>', 'pair XP omitted'),
        breedingBullet!.replace('first successful union of each canonical unordered species pair gives that child another +5 XP', 'pair XP omitted'),
      ],
      [
        'active-play Recovery',
        breeding.replace('Closing the game or moving the wall clock does not advance it', 'Recovery clock boundary omitted'),
        breedingBullet!.replace('never advances from closed-game time or a changed wall clock', 'Recovery clock boundary omitted'),
      ],
      [
        'pre-draw capacity',
        breeding.replace('proves both possible complete save successors before its one outcome draw', 'capacity proof omitted'),
        breedingBullet!.replace('Both complete save outcomes—including exact Charter progress—are proved before the one draw', 'capacity proof omitted'),
      ],
      [
        'Charter co-delivery',
        breeding.replace('A successful outcome also banks the Chapter 3 <b>Breed a hybrid bloodline</b> goal inside that same offspring save.', 'Charter co-delivery omitted.'),
        breedingBullet!.replace('A successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save;', 'Charter co-delivery omitted;'),
      ],
      [
        'read-only convergence',
        breeding.replace('requires reload and cannot breed twice', 'convergence boundary omitted'),
        breedingBullet!.replace('locks read-only and reloads so it cannot breed twice', 'convergence boundary omitted'),
      ],
    ] as const) {
      expect(guideMutant, `${label} Guide mutant did not change`).not.toBe(breeding);
      expect(releaseMutant, `${label} release mutant did not change`).not.toBe(breedingBullet);
      expect(breedingCopyIsTruthful(guideMutant), label).toBe(false);
      expect(breedingReleaseCopyIsTruthful(releaseMutant), label).toBe(false);
    }

    for (const contradiction of [
      ' Both parents are consumed after breeding.',
      ' Recovery advances while the game is closed.',
      ' The same exact companion can occupy both parent roles.',
      ' A failed attempt creates one child.',
      ' Breeding automatically retries after a stale result.',
      ' A failed pairing also banks the Charter hybrid bloodline goal.',
    ]) {
      expect(breedingCopyIsTruthful(breeding + contradiction), contradiction).toBe(false);
      expect(breedingReleaseCopyIsTruthful(breedingBullet! + contradiction), contradiction)
        .toBe(false);
      expect(breedingCopyIsTruthful(breeding), `${contradiction} Guide restoration`).toBe(true);
      expect(
        breedingReleaseCopyIsTruthful(breedingBullet!),
        `${contradiction} release restoration`,
      ).toBe(true);
    }
  });

  it('documents exact-instance durable companion Rename without changing creature identity', () => {
    const specimen = getGuideTopic('specimen')!.body;
    const renameBullet = V2_DRAFT_RELEASE.sections
      .flatMap((section) => section.bullets)
      .find((bullet) => bullet.includes('ONE COMPANION, ONE DURABLE NAME'));
    expect(renameBullet).toBeDefined();
    expect(companionRenameCopyIsTruthful(specimen)).toBe(true);
    expect(companionRenameReleaseCopyIsTruthful(renameBullet!)).toBe(true);

    for (const [label, guideMutant, releaseMutant] of [
      [
        'exact nickname-only successor',
        specimen.replace('changes only that exact companion’s nickname', 'rename scope omitted'),
        renameBullet!.replace('changes only that exact companion’s nickname', 'rename scope omitted'),
      ],
      [
        'shipped sanitizer',
        specimen.replace('shipped name policy strips &lt; &gt; &amp; &quot; and apostrophe', 'name policy omitted'),
        renameBullet!.replace('strips angle brackets, ampersands, quotation marks, and apostrophes', 'name policy omitted'),
      ],
      [
        'no-op refusal',
        specimen.replace('Cleaned-empty or unchanged names consume no receipt or write', 'no-op boundary omitted'),
        renameBullet!.replace('a cleaned-empty or unchanged name consumes no receipt or write', 'no-op boundary omitted'),
      ],
      [
        'read-only convergence',
        specimen.replace('cannot rename twice', 'convergence boundary omitted'),
        renameBullet!.replace('cannot apply twice', 'convergence boundary omitted'),
      ],
    ] as const) {
      expect(guideMutant, `${label} Guide mutant did not change`).not.toBe(specimen);
      expect(releaseMutant, `${label} release mutant did not change`).not.toBe(renameBullet);
      expect(companionRenameCopyIsTruthful(guideMutant), label).toBe(false);
      expect(companionRenameReleaseCopyIsTruthful(releaseMutant), label).toBe(false);
    }

    for (const contradiction of [
      ' Exhibition companions may still be renamed.',
      ' Rename changes the selected companion genome.',
      ' An unchanged name consumes one receipt and CAS.',
      ' Rename automatically retries after storage failure.',
      ' A stale rename changes the nickname.',
    ]) {
      expect(companionRenameCopyIsTruthful(specimen + contradiction), contradiction).toBe(false);
      expect(companionRenameReleaseCopyIsTruthful(renameBullet! + contradiction), contradiction)
        .toBe(false);
      expect(companionRenameCopyIsTruthful(specimen), `${contradiction} Guide restoration`)
        .toBe(true);
      expect(
        companionRenameReleaseCopyIsTruthful(renameBullet!),
        `${contradiction} release restoration`,
      ).toBe(true);
    }
  });

  it('keeps the player Guide scope honest about deliberately hidden dormant topics', () => {
    const visible = getGuideCatalogue().flatMap((category) => category.topics);
    expect(visible.some((topic) => topic.id === 'beacon' || topic.id === 'events')).toBe(false);
    expect(LEGACY_DORMANT_TOPIC_IDS).toEqual(['beacon', 'events']);
  });

  it('negative control: narrow Breed copy is capability-bound rather than always exposed', () => {
    const withBreeding = getGuideTopic('breeding');
    const withoutBreeding = V2_DEVELOPMENT_GUIDE_CAPABILITIES
      .filter((capability) => capability !== 'breeding');
    const without = getGuideTopic('breeding', withoutBreeding);
    expect(withBreeding?.availability).toBe('partial');
    expect(breedingCopyIsTruthful(withBreeding?.body ?? '')).toBe(true);
    expect(without?.availability).toBe('unavailable');
    expect(without?.body).toContain('exact-instance companion Breed and Recovery action has not been connected');
    expect(without?.body).not.toContain('both possible complete save successors');
  });

  it('negative control: Inventory copy is capability-bound rather than always exposed', () => {
    const withoutInventory = V2_DEVELOPMENT_GUIDE_CAPABILITIES
      .filter((capability) => capability !== 'inventory-actions');
    const topic = getGuideTopic('crafting', withoutInventory);
    expect(topic?.availability).toBe('unavailable');
    expect(topic?.body).toContain('Exact Inventory actions have not been connected');
    expect(topic?.body).not.toContain('revision-checked actions');
  });

  it('negative control: narrow Feed copy is capability-bound rather than always exposed', () => {
    const withoutFeeding = V2_DEVELOPMENT_GUIDE_CAPABILITIES
      .filter((capability) => capability !== 'feeding');
    const topic = getGuideTopic('feeding', withoutFeeding);
    expect(topic?.availability).toBe('unavailable');
    expect(topic?.body).toContain('exact-instance fauna Feed action has not been connected');
    expect(topic?.body).not.toContain('one immutable receipt');
  });

  it('negative control: Discovering life is partial only with the live capture capability', () => {
    const withoutCapture = V2_DEVELOPMENT_GUIDE_CAPABILITIES
      .filter((capability) => capability !== 'life-discovery');
    const topic = getGuideTopic('discover', withoutCapture);
    expect(topic?.availability).toBe('unavailable');
    expect(topic?.body).toContain('Planetside capture has not been connected');
    expect(topic?.body).not.toContain('Every attempt spends 1 Yield on a hit or miss');
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
      /ONE POLISHED UNIVERSE:[^\n]*all 43 live biomes[^\n]*seed, silhouette, anatomy, proportion, placement, and gameplay boundary unchanged[^\n]*Sol is a calibration point, never a special-case filter/,
      /EVERY LANDED WORLD HAS A HORIZON:[^\n]*960×430 authored landing vista[^\n]*full canonical biosphere[^\n]*unsupported workers or failed art mounts leave the usable globe intact/,
      /Star Atlas, Compendium, Records, Charters, Settings, Field Training/,
      /EVERY PIECE STAYS ITSELF/,
      /stable exact item instance/,
      /Oversized legacy holds remain lossless inspection-only evidence/,
      /COMPARISON TELLS THE WHOLE STORY/,
      /bounded 48-row page/,
      /current and newly mounted background surfaces stay inert and hidden from assistive technology/,
      /Close restores each surface’s exact prior state/,
      /GEAR ACTIONS SETTLE ONCE/,
      /tab lease, save revision, exact item identity, and one immutable receipt/,
      /ONE DURABLE AUTHORITY AT A TIME/,
      /Versioned split-store saves, a per-document tab lease, revision fences, immutable receipts/,
      /A lease-storage failure or rejected repository-revision read immediately stops eligibility and accrual and converges through protected reload instead of silently reacquiring/,
      /Promotion and recovery now recheck the exact primary, backup, revision, and lease evidence immediately before writing/,
      /every ordinary save-mutating preference and Training control—including Creature Voices—remains inspection-only; a protected reload is the only recovery path/,
      /exactly one 44-pixel top-right Close action/,
      /Spacing inside either desktop rail belongs to that command deck and leaves the active panel open/,
      /a genuine empty-sky press still dismisses it/,
      /bottom-right dock edge/,
      /GRAPHICS CHOICES NOW CONTROL THE SKY:[^\n]*Effects Off allocates no frontier fog particles[^\n]*Screen Shake adds only a short deterministic planetfall impulse/,
      /Resize bursts settle at most once per animation frame and density-only work never creates a save write/,
      /CF1 addresses preserve galaxy, star, planet, coordinates/,
      /different worlds that happen to share a planet seed remain independent/,
      /valid-world Share first settles its Shares record and one-time share achievement before the independent clipboard copy\/fallback result/,
      /submitted CF1 earns Follow only after its route is source-proven, reach-authorized, and accepted/,
      /accepted saved route, Jumps record, and wayfarer achievement settle with its galaxy visit and any source-proved quasar or dwarf-galaxy event in the same receipt/,
      /ordinary direct navigation cannot own Follow, Jumps, or wayfarer, but still owns its source-proved arrival and galaxy-event aggregate/i,
      /Every accepted galaxy, star, or planet route is regenerated from the seeded universe and source-verified/,
      /Stale, forged, or incomplete rows remain visible but disabled/,
      /current 15-card drill keeps six real navigation lessons[^\n]*read-only Planetside, Engineering, Compendium, Records, Guardian\/combat, and CF1 Share\/Follow orientation/,
      /A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view/,
      /if verification pauses, that exact view stays saved, and when Sol can still be verified, Training returns there so a reload can restart safely and retry/,
      /Older v1\.8\.9 Training checkpoints restore only the eleven pre-drill record groups they captured/,
      /every other expedition field is retained from the surrounding save/,
      /That older checkpoint contains no saved view: Skip from Welcome stays in Sol, while completing the drill after Land stays at Earth/,
      /An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen and leaves the stored expedition unchanged/,
      /reload after updating\./,
      /Only a world’s first landing banks the live landfall objective/,
      /a matching planet seed elsewhere cannot impersonate Sol/,
      /Chapter 1 Mine credit likewise requires the exact home-galaxy, Sol-star, dead-world, coordinate, and source-ordinal hierarchy/,
      /same dead-world seed elsewhere cannot advance it/,
      /no longer show a player-facing Spectral class row/,
      /primary chip and Charter board show only landfall, mining, fixed-fabrication, successful-breeding, first-world alien bioscan, and conquest goals with real outcome writers/,
      /Any successful Land, Mine, Fabricator, Breed, qualifying capture, or Conquest commit may reconcile an imported Chapter/,
      /Saturated veteran Charter records no longer wedge/,
      /If Survey is rebuilt while a lesson owns it, the new Land and Atlas actions inherit the same keyboard, focus, and pointer scope before they can answer/,
      /A wrong-world detour keeps only its real Close available, and Escape dismisses it without abandoning Sol or the lesson/,
      /All 56 v1 releases and 398 legacy bullets/,
      /owner-authorized, labelled PR battery can build, browser-check, and archive/,
      /it does not publish/,
      /separate branch-site workflow remains manually parked/,
      /mechanics that are not yet playable are labelled instead of promised/,
      /up to 1,500 logical entries while mounting the visible viewport plus half a viewport of overscan on each side \(about two viewports total\), plus at most the focused pinned row/,
      /neutral placeholder to an exact 132px thumbnail keyed by the complete genome/,
      /Planetside shares the same bounded thumbnail lease path/,
      /only specimen detail publishes and retains an exact 440px portrait/,
      /thumbnail scratch art is downsampled to 132px before it crosses the worker boundary/,
      /Opening the Compendium now gives its variable-height rows a full safe-height left workspace while Search, Survey, and the dock remain visible and usable in a separate right column/,
      /Loading and painting the first specimen thumbnails now happens away from the renderer thread/,
      /A dedicated worker is constructed only after a real owner and a serviced boot turn, with its complete portrait graph sealed into that exact worker entry/,
      /terminates an idle or replaced producer without a synchronous renderer fallback/,
      /ENGINEERING TURNS OPPORTUNITY INTO REACH/,
      /finite grounded Mine and Jump-gated Skim actions/,
      /six durably purchasable Research rows/,
      /all 62 fixed Fabricator recipes/,
      /Deep Scanners reveal bounded orbital mineral facts/,
      /Reinforced Hull reduces hostile Discover Life damage by 25%/,
      /Xenobotany Lab adds one permanent nourishment point to a safe explorer Flora meal/,
      /Fusion Drive, Antimatter Drive, and Warp Fold use the established 2×, 4×, and 8× travel-speed bases/,
      /Equipped healing, bioscan-protection, and travel-speed gear feed those same registered consumers/,
      /deterministic Pureforged modifier[^\n]*mining yield, rich-strike chance, or capture-contact points[^\n]*bound to the exact recipe, receipt, and item/,
      /Authored natural affixes\/drawbacks, random drops, upgrades, sockets, and vendors remain unavailable/,
      /Built permanent systems change the real ship and star reach/,
      /can spend preserved Stardust but does not earn it/,
      /ENGINEERING KEEPS YOUR PLACE:[^\n]*Activating Research or Fabrication with Enter[^\n]*exact row now keeps keyboard context[^\n]*completed Research stays on its result[^\n]*still-available recipe returns to its exact action[^\n]*without stealing focus/,
      /DISCOVER LIFE AND CAPTURE HAVE HONEST LIMITS/,
      /living planet’s Survey card offers explicit Discover Life before or after landing/,
      /action records that exact world and resolves one shown deterministic hazard without cataloguing a species or spending Biosphere Yield/,
      /Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound; safe scans do not/,
      /Capture remains a separate landed action/,
      /CREATURE CALLS ARE YOURS TO REQUEST:[^\n]*real owned-fauna Compendium detail[^\n]*never auto-play it/,
      /HEAR A LIVING WORLD WITHOUT SPOILERS:[^\n]*pre-landing Survey card and landed Planetside both offer Listen to biosphere[^\n]*never names a hidden species, spends Yield, grants a discovery or reward, or changes the save/,
      /Tame chooses uniformly from eligible fauna in the full biosphere/,
      /Scavenge from flora and fungi/,
      /Sample from microbes[^.!?]{0,96}not only the at-most-eight-row preview/,
      /Equipped capture-chance gear adds 1\.5 percentage points per point before the 95% overall ceiling, capped at \+25 points; first contact remains unavailable/,
      /All three share one finite Biosphere Yield[^.!?]{0,128}every hit or miss spends 1/,
      /next 20-minute active-play cycle[^.!?]{0,160}never from closing the game or changing the wall clock/,
      /hit removes that species from its action pool for the cycle[^.!?]{0,96}miss stays eligible/,
      /first successful observation adds one Compendium page plus one owned creature for Tame or one specimen lot for Scavenge and Sample/,
      /Legendary-or-better first find also awards its one Rare Find Stardust bonus/,
      /repeat adds another creature or lot without another page or first-find reward/,
      /first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction/,
      /[Aa] miss, Sol, repeat, stale tab, or failed write banks nothing/,
      /Chapter 2 milestone is separate from Discover Life[^\n]*accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt[^\n]*older Surveys and capture do not count[^\n]*Weekly bioscan Charters remain protected until their separate lifecycle is complete/,
      /Narrow companion Feed, nonlethal Breed, exact-instance Rename, requested Listen, and Field Scout selection are available from a real fauna detail/,
      /ONE EXACT FIELD SCOUT, NEVER A GUESS:[^\n]*bounded 24-row pages[^\n]*same-species twins remain separate by stable instance identity[^\n]*One exact-five compare-and-swap[^\n]*standing Scout intercepts hostile Discover Life damage[^\n]*genuinely fresh species[^\n]*earns up to \+2 XP[^\n]*capped at 486[^\n]*485 gains 1[^\n]*cap gains 0[^\n]*no standing Scout, a miss, or a repeat species grants no Scout XP/,
      /ONE WORLD, ONE VERIFIED DUEL:[^\n]*landed non-Training Surface[^\n]*live captured Guardian or Titan[^\n]*exact 160-run forecast[^\n]*One immutable receipt and one compare-and-swap[^\n]*no retry, reroll, or optimistic result[^\n]*accessible timed Combat Chronicle[^\n]*two HP meters[^\n]*Skip stops active combat sound[^\n]*Share battle log copies plain text[^\n]*without granting the world-Share achievement[^\n]*Every already-modelled registered initiative, dodge, stun, impact\/critical\/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motif owns an exact visible-caption counterpart[^\n]*Composite events remain one voice[^\n]*at most two combat voices overlap[^\n]*Master Sound—not Creature voices—governs playback[^\n]*Authored or recorded combat assets, ambience, and music remain unavailable[^\n]*separate combat-only companion record[^\n]*rather than ordinary Arc 5 ownership[^\n]*exact loss-XP[^\n]*XP and injury survive reload[^\n]*defeat permanently removes them through an immutable tombstone[^\n]*absent from the roster and composite Compendium across reload, Training restore, and capture reconciliation[^\n]*Defeated Guardians and Titans join the Compendium[^\n]*Titan win claims its Prime Signature[^\n]*ninth distinct claim unlocks the Frontier[^\n]*Prime claims remain independent of later champion use[^\n]*starter st-conq[^\n]*adds \+25 current and lifetime-earned Stardust[^\n]*Accepted wk-conq refuses before combat[^\n]*legacy 40% conquest-imbue gate[^\n]*natural and Pureforged gear/,
      /TWO EXACT MEAL PATHS, NO INVENTED CARE:[^\n]*one exact unassigned owned companion below the 200-Meal cap[^\n]*one exact owned flora lot through Use 1[^\n]*Meals by 1[^\n]*exactly 1 flora[^\n]*no retry or optimistic change[^\n]*real Flora detail[^\n]*Eat 1[^\n]*safe meal restores shown HP[^\n]*toxic meal grants no healing or stat[^\n]*fieldmedic[^\n]*gambler/,
      /committed Feed requires its trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status, then may produce one deterministic synthesized acknowledgement after that status appears/,
      /refused, stale, converging, replayed, hidden, route-lost, counterpart-lost, and older results remain silent/,
      /Companion Feed is still only an inventory spend and meal counter[^\n]*tastes, Power growth, injury care or healing, companion poison, and bond remain open/,
      /TWO PARENTS, ONE DURABLE OUTCOME:[^\n]*Parents are never consumed[^\n]*Success creates one deterministic child[^\n]*8 active-play minutes of Recovery[^\n]*failure creates no child[^\n]*both 2/,
      /Both complete save outcomes—including exact Charter progress—are proved before the one draw[^\n]*one immutable receipt and one compare-and-swap with no retry or optimistic child/,
      /unconfirmable durable result locks read-only and reloads so it cannot breed twice/,
      /ONE COMPANION, ONE DURABLE NAME:[^\n]*one exact owned companion from bounded 24-row pages[^\n]*same-species twins remain separate by stable instance identity/,
      /Assigned, recovering, and injured companions may be renamed because this action changes identity only[^\n]*exhibition, non-owned, protected, and revision-exhausted rows refuse/,
      /cleaned-empty or unchanged name consumes no receipt or write/,
      /changes only that exact companion’s nickname[^\n]*never its species, genome, traits, lineage, assignment, condition, bond, catalogue alias, or another twin/,
      /One immutable receipt and one exact-five compare-and-swap settle without RNG, retry, or optimistic publication/,
      /converge read-only through reload so the name cannot apply twice/,
      /A successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save/,
      /failed pairing, refusal, stale result, or failed write banks nothing and grants no Charter credit/,
      /EVERY EXPEDITION HAS A RANKED RECORD:[^\n]*exact ten ranks from Cadet through Eternal Frontier[^\n]*all six score factors[^\n]*all 96 achievements across 13 shelves[^\n]*68 aggregate milestones/,
      /Twenty-six exact joins[^\n]*twelve source-derived Survey observations[^\n]*wormhole\/quasar\/dwarf-galaxy travel[^\n]*first explicit Atlas Favorite[^\n]*safe explorer Flora healing[^\n]*safe above-40%-risk Flora meal[^\n]*hostile Discover Life/,
      /Exactly two event owners—daily and decade—remain open/,
      /Expedition Chronicle & Museum[^\n]*four escaped, independently ordered, at-most-60-row galleries/,
      /Achievement rewards remain open/,
      /verified conquest banks Chapter 2 conquest and can honor one accepted starter st-conq for \+25 Stardust in the same combat save/,
      /Accepted wk-conq remains fail-closed because its weekly lifecycle owner is missing/,
      /Training locks every mutating board action and performs no capture, meal, breeding, rename, Field Scout change, engineering transaction, or combat/,
      /named HD surface-planet texture attachment/,
      /retains the displayed predecessor until an acquired successor publishes/,
      /AURORAS RESPECT THE WEATHER:[^\n]*rain and snow once again suppress the aurora overlay/,
      /ALIEN YEARS AGREE ON EVERY DEVICE:[^\n]*deterministic ASCII comma grouping[^\n]*Earth keeps its authored Year 2026 CE[^\n]*numeric year, RNG chronology, and every other generated field remain unchanged/,
      /A FAILED VISTA CANNOT POISON THE NEXT VISIT:[^\n]*unmountable cached canvas is evicted[^\n]*new canvas is committed only after it mounts successfully/,
      /A MODULAR CORE UNDER ONE UNIVERSE:[^\n]*versioned, digested 43-key domain biome-profile authority[^\n]*current-world roster environment fingerprint[^\n]*pure already-surfaced distant-ecology plan[^\n]*strict playback join[^\n]*exact visible inhabited-biosphere evidence[^\n]*writes no save, spends no Yield, and reveals no species/,
      /Closed Inventory panels retain their inventory, filter, and page state without keeping hidden item rows or dormant event subscriptions/,
      /every registered panel opener shares one focus-capture owner/,
      /THE REVISION CEILING FAILS CLOSED:[^\n]*maximum safe revision remains readable[^\n]*typed protected outcome/,
      /BROWSER UPDATES ARE PROVENANCE, NOT BASELINES:[^\n]*compatible Edge\/Chrome executable[^\n]*connected browser must report complete Chromium-family identity[^\n]*Any compatible point version is accepted and never demands a visual rebaseline/,
      /AN INSTALLED FRONTIER CAN TRAVEL OFFLINE:[^\n]*every exact emitted runtime file passes its recorded digest[^\n]*complete marker is written last[^\n]*failed or altered candidate is deleted[^\n]*no network fallback or cross-build mixing[^\n]*one complete predecessor is retained when available for rollback/,
      /UPDATES WAIT FOR YOUR COMMAND:[^\n]*accessible App status disclosure[^\n]*Check for updates, Activate update, Reload when ready, and Roll back[^\n]*never forces a reload[^\n]*rollback changes app files rather than expedition data[^\n]*verification failure leaves the current offline build unchanged/,
      /memory ruler names the exact exceeded counter and cannot move merely because the browser received a compatible point update/,
      /Automated lenses still do not replace human play/,
      /DEVELOPMENT PUBLISHING STAYS PARKED:[^\n]*it does not publish[^\n]*The separate branch-site workflow remains manually parked/,
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
      ...CAPTURE_COPY_CONTRADICTIONS,
      ...BREEDING_COPY_CONTRADICTIONS,
      ...COMPANION_RENAME_COPY_CONTRADICTIONS,
      ...FIELD_SCOUT_COPY_CONTRADICTIONS,
      ...COMBAT_COPY_CONTRADICTIONS,
      ...PROGRESSION_COPY_CONTRADICTIONS,
      /\bCreature combat is (?:now )?(?:playable|available|live)\b/i,
      /primary chip and Charter board show only landfall, mining, and fixed-fabrication goals/i,
      /Bioscan, conquest, and breeding milestones remain hidden/i,
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
      const publishingContradiction = bullets.some((bullet) =>
        hasUnnegatedSentenceClaim(bullet, DEVELOPMENT_PUBLISHING_CLAIM));
      return {
        categories: JSON.stringify(categories) === JSON.stringify(expectedCategories),
        canonical: categories.every((category) => V2_RELEASE_CATEGORIES.includes(category as never)),
        inventory: bullets.length === 81,
        populated: sections.every((section) => section.bullets.length > 0)
          && bullets.every((bullet) => bullet.length > 0 && bullet === bullet.trim())
          && new Set(bullets).size === bullets.length,
        required: requiredCopy.every((pattern) => pattern.test(copy)),
        publishingContradiction,
        honest: forbiddenOverclaims.every((pattern) => !pattern.test(copy))
          && !publishingContradiction,
      };
    };
    const draftCopy = V2_DRAFT_RELEASE.sections.flatMap((section) => section.bullets).join('\n');
    expect(forbiddenOverclaims.filter((pattern) => pattern.test(draftCopy)).map(String))
      .toEqual([]);
    expect(requiredCopy.filter((pattern) => !pattern.test(draftCopy)).map(String))
      .toEqual([]);
    const outcome = bulletinOutcome(V2_DRAFT_RELEASE.sections);
    expect(outcome).toEqual({
      categories: true, canonical: true, inventory: true, populated: true, required: true,
      publishingContradiction: false, honest: true,
    });

    const reordered = [...V2_DRAFT_RELEASE.sections];
    [reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!];
    expect(bulletinOutcome(reordered).categories).toBe(false);
    const missingMiddle = V2_DRAFT_RELEASE.sections.map((section, index) => ({
      category: section.category,
      bullets: index === 1 ? section.bullets.filter((_, bulletIndex) => bulletIndex !== 3) : section.bullets,
    }));
    expect(missingMiddle.flatMap((section) => section.bullets)).toHaveLength(80);
    expect(bulletinOutcome(missingMiddle).inventory).toBe(false);
    const missingRequired = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'Automated lenses still do not replace human play.',
        'Automated evidence boundary removed.',
      )),
    }));
    expect(bulletinOutcome(missingRequired).required).toBe(false);
    const staleClosedPanelOwnership = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'Closed Inventory panels retain their inventory, filter, and page state without keeping hidden item rows or dormant event subscriptions',
        'Closed Inventory panels keep their hidden item rows and dormant event subscriptions',
      )),
    }));
    expect(bulletinOutcome(staleClosedPanelOwnership).required).toBe(false);
    const staleOpenerOwnership = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'every registered panel opener shares one focus-capture owner',
        'every registered panel opener owns another focus-capture listener',
      )),
    }));
    expect(bulletinOutcome(staleOpenerOwnership).required).toBe(false);
    const browserVersionRuler = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'cannot move merely because the browser received a compatible point update',
        'moves whenever the browser receives a compatible point update',
      )),
    }));
    expect(bulletinOutcome(browserVersionRuler).required).toBe(false);
    const stalePublishingHeading = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'DEVELOPMENT PUBLISHING STAYS PARKED',
        'DEVELOPMENT PUBLISHING IS ISOLATED',
      )),
    }));
    expect(bulletinOutcome(stalePublishingHeading).required).toBe(false);
    const contradictoryPublishing = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('DEVELOPMENT PUBLISHING STAYS PARKED')
        ? `${bullet} The preview package now publishes and deploys the v2.0 development site.`
        : bullet),
    }));
    expect(bulletinOutcome(contradictoryPublishing)).toMatchObject({
      required: true, publishingContradiction: true, honest: false,
    });
    const crossRowPublishing = V2_DRAFT_RELEASE.sections.map((section, sectionIndex) => ({
      category: section.category,
      bullets: section.bullets.map((bullet, bulletIndex) => sectionIndex === 0 && bulletIndex === 0
        ? `${bullet} The development site now deploys the v2.0 preview package.`
        : bullet),
    }));
    expect(bulletinOutcome(crossRowPublishing)).toMatchObject({
      required: true, publishingContradiction: true, honest: false,
    });
    const liveProductionPublishing = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('DEVELOPMENT PUBLISHING STAYS PARKED')
        ? `${bullet} The v2.0 preview is live in production.`
        : bullet),
    }));
    expect(bulletinOutcome(liveProductionPublishing)).toMatchObject({
      required: true, publishingContradiction: true, honest: false,
    });
    for (const claim of [
      'The preview package is published to the development site.',
      'The development site was deployed.',
      'The preview package has shipped.',
      'The preview package is being published to the development site.',
      'The development site was just published.',
      'The development site is now deployed.',
      'The preview package has gone live.',
    ]) {
      const passivePublishing = V2_DRAFT_RELEASE.sections.map((section) => ({
        category: section.category,
        bullets: section.bullets.map((bullet) => bullet.includes('DEVELOPMENT PUBLISHING STAYS PARKED')
          ? `${bullet} ${claim}`
          : bullet),
      }));
      expect(bulletinOutcome(passivePublishing), claim).toMatchObject({
        required: true, publishingContradiction: true, honest: false,
      });
    }
    expect(bulletinOutcome(V2_DRAFT_RELEASE.sections)).toEqual(outcome);
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
    const lateSurveyTrainingScope = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'before they can answer',
        'after they answer',
      )),
    }));
    expect(bulletinOutcome(lateSurveyTrainingScope).required).toBe(false);
    const trappedWrongWorld = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'without abandoning Sol or the lesson',
        'after abandoning Sol and the lesson',
      )),
    }));
    expect(bulletinOutcome(trappedWrongWorld).required).toBe(false);
    const staleRecoveryRace = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'recheck the exact primary, backup, revision, and lease evidence immediately before writing',
        'reuse the recovery snapshot before writing',
      )),
    }));
    expect(bulletinOutcome(staleRecoveryRace).required).toBe(false);
    const writableVoiceWhileProtected = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'every ordinary save-mutating preference and Training control—including Creature Voices—remains inspection-only; a protected reload is the only recovery path',
        'most Settings controls remain inspection-only',
      )),
    }));
    expect(bulletinOutcome(writableVoiceWhileProtected).required).toBe(false);
    const autoReacquireAfterStorageError = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'immediately stops eligibility and accrual and converges through protected reload instead of silently reacquiring',
        'continues accrual and silently reacquires',
      )),
    }));
    expect(bulletinOutcome(autoReacquireAfterStorageError).required).toBe(false);
    const staleContactBoundary = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.replace(
        'Equipped capture-chance gear adds 1.5 percentage points per point before the 95% overall ceiling, capped at +25 points; first contact remains unavailable',
        'Capture gear has an unspecified effect',
      )),
    }));
    expect(bulletinOutcome(staleContactBoundary).required).toBe(false);
    const contradictoryContactBoundary = V2_DRAFT_RELEASE.sections.map((section) => ({
      category: section.category,
      bullets: section.bullets.map((bullet) => bullet.includes('DISCOVER LIFE AND CAPTURE HAVE HONEST LIMITS')
        ? `${bullet} First contact is now available.`
        : bullet),
    }));
    expect(bulletinOutcome(contradictoryContactBoundary)).toMatchObject({
      required: true, honest: false,
    });
    const crossRowStaleBioscanBoundary = V2_DRAFT_RELEASE.sections.map((section, sectionIndex) => ({
      category: section.category,
      bullets: section.bullets.map((bullet, bulletIndex) => sectionIndex === 0 && bulletIndex === 0
        ? `${bullet} The primary chip and Charter board show only landfall, mining, and fixed-fabrication goals with real outcome writers. Bioscan, conquest, and breeding milestones remain hidden.`
        : bullet),
    }));
    expect(bulletinOutcome(crossRowStaleBioscanBoundary)).toMatchObject({
      required: true, honest: false,
    });
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
      'Pureforged slotted craft is now playable.',
      'All six Research rows can now be purchased.',
      'Discover Life is now playable.',
      'Capture is now playable.',
      'Narrow real-fauna Compendium Feed is now playable.',
      'Explorer Flora eating is now playable.',
      'Breeding is now playable.',
      'Renaming is now available.',
      'Field Scout selection, interception, and fresh-species XP are now live.',
      'Landed non-Training Conquest is now playable.',
      'Exploration audio is now live.',
    ]) {
      expect(bulletinOutcome(withInjectedFeatureClaim(truthfulClaim)), truthfulClaim).toEqual({
        categories: true, canonical: true, inventory: true, populated: true, required: true,
        publishingContradiction: false, honest: true,
      });
    }
    for (const unavailableClaim of [
      'All 62 fixed Fabricator recipes are now actionable.',
      'Disconnected Fabricator outputs are now playable.',
      'Authored affixes/drawbacks are now available.',
      'Upgrades are now playable.',
      'Item upgrades are now live.',
      'Sockets are now available.',
      'Vendors are now live.',
      'Creature combat is now playable.',
      'Feeding is now playable.',
      'Duels are now playable.',
      'Passive evolution is now available.',
      'Missions are now playable.',
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
