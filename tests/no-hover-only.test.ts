import { describe, expect, it } from 'vitest';
import { readRepoFiles } from '../tools/tracked-files.mjs';

/*
 * Nothing in the app is reachable by hover alone: a touch player has no hover, and a keyboard player has focus.
 *
 * What is checked: every style rule written in a file under apps/game/ (a stylesheet, the page's <style>, or
 * style text inside a script), found as `selectors { declarations }`. For each selector with `:hover` whose rule
 * sets display, visibility, opacity, pointer-events or content, some rule of the app must set the same property to
 * the same value under the same selector with `:hover` replaced by `:focus-visible`, or by `:focus-within`.
 *
 * What it cannot detect: a style set from script on a mouseover or mouseenter event; a rule whose selector or
 * declarations are assembled at run time; a hover rule nested inside another rule's braces (CSS nesting).
 */

const REVEALING = ['display', 'visibility', 'opacity', 'pointer-events', 'content'];
const APP_FILE = /^apps\/game\/(?!test\/).*\.(?:css|html|ts|mts|mjs|js)$/;
const RULE = /([^{}]*)\{([^{}]*)\}/g;

type Entry = { path: string; text: string };
interface Rule { path: string; selectors: string[]; declarations: Map<string, string> }

const tidy = (s: string): string => s.replace(/\s+/g, ' ').trim();

function rulesOf(files: ReadonlyArray<Entry>): Rule[] {
  const rules: Rule[] = [];
  for (const { path, text } of files) {
    if (!APP_FILE.test(path)) continue;
    for (const [, head, body] of text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(RULE)) {
      // Only the text after the last `;` or line of markup before the brace is the selector list.
      const selectors = tidy((head as string).split(/[;>`'"]\s*\n|;/).pop() as string).split(',').map(tidy).filter((s) => s !== '');
      const declarations = new Map<string, string>();
      for (const declaration of (body as string).split(';')) {
        const colon = declaration.indexOf(':');
        if (colon > 0) declarations.set(tidy(declaration.slice(0, colon)).toLowerCase(), tidy(declaration.slice(colon + 1)).replace(/\s*!important$/, ''));
      }
      rules.push({ path, selectors, declarations });
    }
  }
  return rules;
}

/** One message per hover selector and property with no focus rule beside it. */
function findHoverOnly(files: ReadonlyArray<Entry>): string[] {
  const rules = rulesOf(files);
  const sets = (selector: string, property: string, value: string): boolean =>
    rules.some((r) => r.selectors.includes(selector) && r.declarations.get(property) === value);
  const problems: string[] = [];
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      if (!selector.includes(':hover')) continue;
      for (const property of REVEALING) {
        const value = rule.declarations.get(property);
        if (value === undefined) continue;
        const matched = [':focus-visible', ':focus-within'].some((focus) => sets(selector.replaceAll(':hover', focus), property, value));
        if (!matched) problems.push(`${rule.path}: ${selector} sets ${property} with no :focus-visible or :focus-within rule doing the same`);
      }
    }
  }
  return problems;
}

describe('nothing is reachable by hover alone', () => {
  it('no style rule in the app changes display, visibility, opacity, pointer-events or content under :hover without the same rule under :focus-visible or :focus-within', () => {
    const files = readRepoFiles((path) => APP_FILE.test(path));
    // The instrument sees the real tree, and reads the rules of the page.
    expect(files.length).toBeGreaterThan(10);
    expect(rulesOf(files).some((r) => r.path === 'apps/game/index.html' && r.selectors.includes('body'))).toBe(true);
    expect(findHoverOnly(files)).toEqual([]);
  });
  it('flags a hover rule that reveals something with no focus rule beside it (controls)', () => {
    const at = (text: string, path = 'apps/game/src/ui/style.css') => findHoverOnly([{ path, text }]);
    expect(at('.row .more { opacity: 0; }\n.row:hover .more { opacity: 1; }')).toEqual([
      'apps/game/src/ui/style.css: .row:hover .more sets opacity with no :focus-visible or :focus-within rule doing the same']);
    for (const property of ['display: block', 'visibility: visible', 'pointer-events: auto', "content: 'x'"]) {
      expect(at(`.a:hover > .tip { ${property}; }`)).toHaveLength(1);
    }
    // A focus rule that sets another value, or sits on another selector, does not count.
    expect(at('.a:hover .tip { opacity: 1; }\n.a:focus-within .tip { opacity: .5; }')).toHaveLength(1);
    expect(at('.a:hover .tip { opacity: 1; }\n.b:focus-within .tip { opacity: 1; }')).toHaveLength(1);
    // Two hover selectors in one list are each held to it.
    expect(at('.a:hover .tip, .b:hover .tip { display: block; }\n.a:focus-within .tip { display: block; }')).toEqual([
      'apps/game/src/ui/style.css: .b:hover .tip sets display with no :focus-visible or :focus-within rule doing the same']);
    // Style text in a script and in the page is read too.
    expect(at('const css = `\n.dock:hover .label { display: block; }\n`;', 'apps/game/src/ui/chrome.ts')).toHaveLength(1);
    expect(at('<style>\n  .dock:hover .label{display:block}\n</style>', 'apps/game/index.html')).toHaveLength(1);
    expect(at('@media (min-width: 600px) {\n  .dock:hover .label { display: block; }\n}')).toHaveLength(1);
  });
  it('passes a hover rule with its focus rule, and hover rules that reveal nothing (controls)', () => {
    const at = (text: string, path = 'apps/game/src/ui/style.css') => findHoverOnly([{ path, text }]);
    expect(at('.row:hover .more { opacity: 1; }\n.row:focus-within .more { opacity: 1; }')).toEqual([]);
    expect(at('.a:hover > .tip, .a:focus-visible > .tip { display: block !important; }')).toEqual([]);
    expect(at('button:hover { background: #123; border-color: #456; }')).toEqual([]);
    expect(at('/* .a:hover .tip { display: block; } */')).toEqual([]);
    expect(at('.a:hover .tip { display: block; }', 'apps/game/test/a.test.ts')).toEqual([]);
    expect(at('.a:hover .tip { display: block; }', 'apps/diagnostics/src/a.css')).toEqual([]);
  });
});
