/** Select topology before a candidate is authored; never inherit a reference's absence.
 * The caller supplies the admitted target inventory, or the full required family inventory.
 * No paint, landmark, threshold or target declaration is changed here. */
export function compatibleReferenceInventory(ranked, requiredJoints, excludedJoints = []) {
  if (requiredJoints === null || requiredJoints === undefined) return {eligible:ranked, rejected:[], judge:ranked[0]};
  if (!Array.isArray(requiredJoints) || !requiredJoints.length || new Set(requiredJoints).size !== requiredJoints.length
      || requiredJoints.some(j => typeof j !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(j))) throw Error('Reference inventory: explicit unique required joints');
  const required = new Set(requiredJoints), excluded = new Set(excludedJoints ?? []);
  if ([...required].some(j => excluded.has(j))) throw Error('Reference inventory: required joint excluded');
  const eligible = [], rejected = [];
  for (const row of ranked) {
    const landmarks = row.ref.authoring.landmarksPx;
    const actual = Object.keys(landmarks).filter(j => !excluded.has(j));
    const missing = requiredJoints.filter(j => !Object.hasOwn(landmarks,j));
    const extra = actual.filter(j => !required.has(j));
    if (missing.length || extra.length) rejected.push({reference:row.ref.subjectId, missing, extra});
    else eligible.push(row);
  }
  // Facing and wrong-family retain the cheapest original contour witness, even if
  // it cannot supply the required topology. Filtering may not move those gates.
  return {eligible, rejected, judge:ranked[0]};
}
