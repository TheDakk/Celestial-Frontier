/** The companion's v4 Compendium mirror row (`g.xp`) is published from a COMMITTED state by exactly one rule, shared by the friendly duel
 * and D13 care XP: only rows whose committed `g.xp` differs change, and only that field. Pure; returns the live list itself when nothing
 * changed. */
export function mirrorCompanionCodexXpV1<E extends { g: { xp?: number } }>(live: [string, E][], committed: readonly (readonly [string, E])[]): [string, E][] {
  let changed = false;
  const next = live.map(([id, entry]): [string, E] => {
    const row = committed.find(([rowId]) => rowId === id)?.[1];
    if (row === undefined || row.g?.xp === entry.g?.xp) return [id, entry];
    changed = true; return [id, { ...entry, g: { ...entry.g, xp: row.g.xp } }];
  });
  return changed ? next : live;
}
