/* Arc 9 Records/rank HTML projection.

   The Records panel already owns its open/close lifecycle in Main. This seam
   owns only bounded, escaped markup for the exact DOM-free Arc 9 read model:
   one rank card, six score factors, thirteen native-details achievement
   shelves, all 96 canonical rows, and explicit compatibility evidence. It
   performs no evaluation, persistence, action scheduling, or ceremony. */
import type {
  Arc9AchievementReadRowV1,
  Arc9RecordsRankReadModelV1,
} from './records-rank-model.js';

export const ARC9_RECORDS_RANK_PANEL_SCHEMA_V1 = 'cf-v2-arc9-records-rank-panel/v1';

const STATUS_COPY = Object.freeze({
  unlocked: 'Unlocked',
  eligible: 'Awaiting durable record',
  locked: 'In progress',
  'event-owner-required': 'Requires its exact live event',
} satisfies Readonly<Record<Arc9AchievementReadRowV1['status'], string>>);

function legacyCopyText(value: string): string {
  /* Three frozen legacy descriptions retain this numeric entity in source.
     Decode only that known text token before ordinary escaping so the player
     sees an apostrophe rather than entity source. */
  return value.replaceAll('&#8217;', '’');
}

function esc(value: unknown): string {
  return legacyCopyText(String(value ?? '')).replace(/[<>&"']/gu, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

function number(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function achievementRow(row: Arc9AchievementReadRowV1): string {
  return '<li class="records-achievement" data-achievement-id="' + esc(row.id)
    + '" data-achievement-status="' + esc(row.status) + '">'
    + '<span class="records-achievement-icon" aria-hidden="true">' + esc(row.icon) + '</span>'
    + '<span class="records-achievement-copy"><b>' + esc(row.name) + '</b>'
    + '<span class="sub">' + esc(row.description) + '</span></span>'
    + '<span class="records-achievement-state">' + esc(STATUS_COPY[row.status]) + '</span>'
    + '</li>';
}

/** Escaped bounded markup only. Main remains the panel lifecycle owner. */
export function renderArc9RecordsRankPanelV1(model: Arc9RecordsRankReadModelV1): string {
  const rankProgress = Math.max(0, Math.min(model.rank.span, model.rank.progress));
  const factorRows = model.factors.map((row) => (
    '<li data-rank-factor="' + esc(row.id) + '"><span>' + esc(row.label) + '</span>'
    + '<span><b>' + number(row.value) + '</b> &times; ' + number(row.scorePerUnit)
    + ' = ' + number(row.scoreContribution) + '</span></li>'
  )).join('');
  const categories = model.achievements.map((category) => {
    const categoryId = 'records-achievement-' + slug(category.category);
    return '<details class="records-achievement-category" data-achievement-category="'
      + esc(category.category) + '"><summary id="' + categoryId + '"><span>'
      + esc(category.category) + '</span><span>' + number(category.unlocked) + ' / '
      + number(category.total) + ' unlocked</span></summary><ol aria-labelledby="'
      + categoryId + '">' + category.rows.map(achievementRow).join('') + '</ol></details>';
  }).join('');
  const compatibility = model.unsupportedUnlockedIds.length === 0 ? ''
    : '<details class="records-achievement-category records-compatibility" '
      + 'data-achievement-compatibility><summary><span>Compatibility records</span><span>'
      + number(model.unsupportedUnlockedIds.length) + '</span></summary>'
      + '<p class="sub">Preserved imported achievement IDs that this build does not reinterpret:</p><ul>'
      + model.unsupportedUnlockedIds.map((id) => '<li><code>' + esc(id) + '</code></li>').join('')
      + '</ul></details>';

  return '<section class="records-rank" data-arc9-records-rank="'
    + ARC9_RECORDS_RANK_PANEL_SCHEMA_V1 + '">'
    + '<h3>Explorer Rank</h3><div class="records-rank-card" data-rank-index="'
    + model.rank.index + '" data-rank-iridescent="' + String(model.rank.nameplateIridescent) + '">'
    + '<div class="records-rank-title"><b>' + esc(model.rank.name) + '</b><span>'
    + number(model.rank.score) + ' expedition score</span></div>'
    + '<progress aria-label="Progress to ' + esc(model.rank.nextName) + '" value="'
    + rankProgress + '" max="' + model.rank.span + '"></progress>'
    + '<div class="sub">' + number(rankProgress) + ' / ' + number(model.rank.span)
    + ' toward ' + esc(model.rank.nextName) + ' at ' + number(model.rank.nextThreshold) + '</div>'
    + '<ul class="records-rank-factors" aria-label="Expedition score factors">'
    + factorRows + '</ul></div>'
    + '<h3>Achievements</h3><p class="sub" data-achievement-summary>'
    + number(model.durableUnlockedCount) + ' durable records &middot; '
    + number(model.eventOwnerRequiredCount) + ' milestones still require their exact live event'
    + (model.aggregateRefreshAvailable
      ? ' &middot; earned aggregate milestones are awaiting durable synchronization' : '')
    + '</p>' + categories + compatibility + '</section>';
}
