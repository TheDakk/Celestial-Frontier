/* Presentation adapter; the app and combat settlement share one pure weekly lifecycle. */
export * from '../../../packages/persistence/src/weekly-charters.js';
import type { WeeklyCharterBoardV1 } from '../../../packages/persistence/src/weekly-charters.js';

export function formatActivePlayRemainingV1(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const esc = (value: string): string => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** The weekly board beneath the starter board: the same row shape; the cycle counter says how much PLAY is left, never a date. */
export function renderWeeklyCharterBoardV1(board: WeeklyCharterBoardV1): string {
  const rows = board.rows.map((row) => {
    const progress = `${row.progress} / ${row.definition.count}`;
    return `<div class="centry starter-charter weekly-charter" data-weekly-charter="${esc(row.definition.id)}" data-charter-status="${row.status}">`
      + `<b>${row.status === 'completed' ? '✓ ' : ''}${esc(row.definition.title)}</b><div class="sub">${esc(row.definition.description)}</div>`
      + `<div class="starter-charter-actions"><span class="sub">${progress} · +${row.definition.stardust} ✦</span>`
      + (row.status === 'available' ? `<button type="button" data-weekly-charter-accept="${esc(row.definition.id)}">Accept</button>`
        : row.status === 'accepted' ? '<span class="binder-claimed">active</span>'
          : row.status === 'completed' ? '<span class="binder-claimed">done this week</span>'
            : `<span class="sub">${esc(row.lockedReason ?? 'Unavailable')}</span>`)
      + '</div></div>';
  }).join('');
  return `<section data-weekly-charter-board data-weekly-cycle="${board.cycle}"><h3>Weekly Charters `
    + `<span class="sub">${board.acceptedCount} / ${board.cap} active</span></h3>`
    + `<div class="sub" data-weekly-charter-clock>New board in ${formatActivePlayRemainingV1(board.remainingActiveMs)} of play. The expedition keeps its own clock; changing the device clock never resets or advances it.</div>`
    + rows + '</section>';
}
