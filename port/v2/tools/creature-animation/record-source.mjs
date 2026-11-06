/** A fit record's `source` (its painter master), repo-relative. The archetype sprint's records (Codex, 2026-09-22/23) carry
 * ABSOLUTE paths into the OpenAI worktree; the same repo-relative file exists in every clone. Only a path under a
 * Celestial Frontier worktree root is rewritten; any other absolute path is refused. ONE copy, shared by the card builder,
 * the battle2 fixtures and the battle2 wiring (a second copy could disagree). */
export function repoRelativeSource(source) {
  if (typeof source !== 'string' || !source) throw Error('record source must be a non-empty string');
  if (!source.startsWith('/')) return source;
  const m = /^\/.+?\/celestial-frontier-(?:anthropic|openai)-mac\/(.+)$/.exec(source) ?? /^\/.+?\/Celestial-Frontier\/(.+)$/.exec(source);
  if (!m) throw Error('record source is an absolute path outside a Celestial Frontier worktree: ' + source);
  return m[1];
}
