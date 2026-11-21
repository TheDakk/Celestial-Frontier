import { describe, it, expect } from 'vitest';
import { scanCode } from '../tools/scan-code.mjs';

describe('scanCode', () => {
  it('removes comments and keeps code', () => {
    expect(scanCode('a // x\nb /* y */ c').kept.replace(/\s+/g, ' ')).toBe('a b c');
  });
  it('keeps string text in kept and blanks it in bare', () => {
    const r = scanCode("const s = 'a.b';");
    expect(r.kept).toContain("'a.b'");
    expect(r.bare).not.toContain('a.b');
  });
  it('replaces a regular expression literal with RE and reports no division', () => {
    const r = scanCode('const r = /a/g.test(s);');
    expect(r.kept).toContain('RE.test');
    expect(r.division).toBe(false);
  });
  it('reports a division, including inside a template substitution', () => {
    expect(scanCode('a / b').division).toBe(true);
    expect(scanCode('`${a / b}`').division).toBe(true);
  });
  it('reads a slash after a postfix operator as division and after a prefix operator as a regular expression', () => {
    expect(scanCode('a[i]! / 2').division).toBe(true);
    expect(scanCode('a++ / 2').division).toBe(true);
    expect(scanCode('x = !/re/.test(s)').division).toBe(false);
  });
  it('known false positive: a regular expression after the closing parenthesis of an if is read as division', () => {
    expect(scanCode('if (x) /re/.test(y)').division).toBe(true);
  });
});
