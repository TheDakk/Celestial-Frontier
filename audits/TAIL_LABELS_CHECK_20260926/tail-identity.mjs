/** Tail identity guard for the exact-label fill (Claude, 2026-09-26). The fill trusts its caller's tail/stalk names; a wrong name
 * (the Cod's dorsal as "tail") silently moves 970 px. This derives the pair from the rig joints instead and refuses a disagreement:
 * tail = joint `caudal` (fish) or the highest `tailN`; stalk = the highest `spineN` (fish) or `tail(N-1)`; the two must share painted
 * 4-neighbour edges in the labels (a real anatomical join, not a name). */
export function deriveTailPair(parts, labels, width) {
  const byJoint = new Map(parts.map((p, k) => [p.joint, { id: p.id, owner: k + 1 }])), num = (re) => parts.map((p) => +(re.exec(p.joint) ?? [])[1]).filter(Number.isFinite);
  let tail, stalk;
  if (byJoint.has('caudal')) { const s = Math.max(...num(/^spine(\d+)$/)); tail = byJoint.get('caudal'); stalk = byJoint.get('spine' + s); }
  else { const t = num(/^tail(\d+)$/); if (!t.length) throw Error('Tail identity: no caudal or tailN joint'); const n = Math.max(...t); tail = byJoint.get('tail' + n); stalk = byJoint.get('tail' + (n - 1)); }
  if (!tail || !stalk) throw Error('Tail identity: stalk joint missing');
  let edges = 0; for (let i = 0; i < labels.length; i++) if (labels[i] === tail.owner) { const x = i % width; for (const n of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) if (n >= 0 && n < labels.length && labels[n] === stalk.owner) edges++; }
  return { tail: tail.id, stalk: stalk.id, tailOwner: tail.owner, stalkOwner: stalk.owner, sharedEdges: edges };
}
export function assertTailPair(parts, labels, width, tailId, stalkId) {
  const d = deriveTailPair(parts, labels, width);
  if (d.tail !== tailId || d.stalk !== stalkId) throw Error(`Tail identity: requested ${tailId}/${stalkId}, rig says ${d.tail}/${d.stalk}`);
  return d;
}
