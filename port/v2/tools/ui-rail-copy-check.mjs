/* Compact-rail evidence oracle. The left root belongs to the dock and is
 * boxless; every retained desktop copy is hidden, including the two retired
 * right-rail shortcuts that remain in the native markup. */
export function assessCompactRailCopies(rows) {
  const reasons = [];
  if (!Array.isArray(rows)) return { pass: false, reasons: ['compact rail observations must be an array'] };
  if (rows.length !== 2) reasons.push(`compact rail inventory requires exactly 2 roots; observed ${rows.length}`);
  const expectedIds = ['raillft', 'railrgt'];
  const expectedCopies = [['railcodex'], ['railatlas', 'railshipyard', 'railinventory', 'railrecords']];
  for (const [index, id] of expectedIds.entries()) {
    const row = rows[index];
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      reasons.push(`${id}: observation is missing or malformed`); continue;
    }
    if (row.id !== id) reasons.push(`${id}: root identity/order differs (${JSON.stringify(row.id)})`);
    if (row.exists !== true) reasons.push(`${id}: native root is missing`);
    if (index === 0 && row.parentId !== 'dock') reasons.push(`${id}: parent must be dock (${JSON.stringify(row.parentId)})`);
    if (index === 1 && row.parentTag !== 'BODY') reasons.push(`${id}: parent must be BODY (${JSON.stringify(row.parentTag)})`);
    const display = index === 0 ? 'contents' : 'none';
    if (row.display !== display) reasons.push(`${id}: display must be ${display} (${JSON.stringify(row.display)})`);
    if (!Array.isArray(row.copyIds) || JSON.stringify(row.copyIds) !== JSON.stringify(expectedCopies[index]))
      reasons.push(`${id}: hidden-copy identity/order must be ${expectedCopies[index].join(',')} (${JSON.stringify(row.copyIds)})`);
    if (row.copiesHidden !== true) reasons.push(`${id}: a desktop copy is visible or its hiding evidence is missing`);
    if (row.rectCount !== 0) reasons.push(`${id}: root must have zero client rectangles (${JSON.stringify(row.rectCount)})`);
    if (row.width !== 0 || row.height !== 0)
      reasons.push(`${id}: root must be zero-sized (${JSON.stringify({ width: row.width, height: row.height })})`);
    if (row.painted !== false) reasons.push(`${id}: root is painted or its paint evidence is missing`);
  }
  return { pass: reasons.length === 0, reasons };
}
