/** Summarize the unchanged static gate, including its distinct blended presentation. */
export function summarizeStaticOutcome(report) {
  if (!report || typeof report !== 'object') return { static: 'STATIC_ERROR', staticFails: null };
  const failed = [...(Array.isArray(report.rows) ? report.rows : []).filter(row => row.status !== 'PASS')];
  if (report.presentation && report.presentation.status !== 'PASS') failed.push({ ...report.presentation, id: 'presentation' });
  return {
    static: report.status,
    staticFails: failed.map(row => row.id),
    staticRefusals: failed.map(row => ({ id: row.id, samples: row.samples, firstRefusal: row.firstRefusal ?? null })),
  };
}
