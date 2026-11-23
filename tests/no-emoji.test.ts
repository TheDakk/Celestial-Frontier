import { describe, expect, it } from 'vitest';
import { readRepoFiles } from '../tools/tracked-files.mjs';

// The app shows icons from the interface sheet, never emoji: an emoji is drawn by the device's own font, so it
// differs from one device to the next. Checked: every file under apps/game/src/ and the app's page.
// An emoji here is any pictographic character, a flag letter, a keycap mark or the emoji presentation selector.
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|️|⃣/u;
const APP_TEXT = /^apps\/game\/(?:src\/.*|index\.html)$/;

type Entry = { path: string; text: string };

/** One message per line holding an emoji, in a file the check covers. */
function findEmoji(files: ReadonlyArray<Entry>): string[] {
  const problems: string[] = [];
  for (const { path, text } of files) {
    if (!APP_TEXT.test(path)) continue;
    text.split('\n').forEach((line, i) => {
      const found = EMOJI.exec(line);
      if (found !== null) problems.push(`${path}:${i + 1}: emoji U+${found[0].codePointAt(0)!.toString(16).toUpperCase()}`);
    });
  }
  return problems;
}

describe('no emoji in the app', () => {
  it('no file under apps/game/src contains an emoji', () => {
    const files = readRepoFiles((path) => APP_TEXT.test(path));
    // The instrument sees the real tree.
    expect(files.length).toBeGreaterThan(10);
    expect(files.some((f) => f.path === 'apps/game/index.html')).toBe(true);
    expect(findEmoji(files)).toEqual([]);
  });
  it('flags each kind of emoji, by file and line (controls)', () => {
    const at = (text: string, path = 'apps/game/src/ui/a.ts') => findEmoji([{ path, text }]);
    expect(at("const a = 1;\nconst title = 'Tray \u{1F514}';")).toEqual(['apps/game/src/ui/a.ts:2: emoji U+1F514']);
    expect(at('// ⚙ settings')).toEqual(['apps/game/src/ui/a.ts:1: emoji U+2699']);
    expect(at("'\u{1F1EB}\u{1F1F7}'")).toEqual(['apps/game/src/ui/a.ts:1: emoji U+1F1EB']);
    expect(at("'★️'")).toEqual(['apps/game/src/ui/a.ts:1: emoji U+FE0F']);
    expect(at("'1⃣'")).toEqual(['apps/game/src/ui/a.ts:1: emoji U+20E3']);
    expect(at('<p>\u{1F680}</p>', 'apps/game/index.html')).toEqual(['apps/game/index.html:1: emoji U+1F680']);
  });
  it('passes plain text, digits and typographic marks, and ignores files outside the app (controls)', () => {
    const at = (text: string, path = 'apps/game/src/ui/a.ts') => findEmoji([{ path, text }]);
    expect(at("const s = 'Café #1 * 2 — … × → ★ °';")).toEqual([]);
    expect(at("'\u{1F514}'", 'apps/game/test/a.test.ts')).toEqual([]);
    expect(at("'\u{1F514}'", 'apps/diagnostics/src/main.ts')).toEqual([]);
    expect(at("'\u{1F514}'", 'packages/scene/src/a.ts')).toEqual([]);
  });
});
