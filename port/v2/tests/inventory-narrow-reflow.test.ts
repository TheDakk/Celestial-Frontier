import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(
  fileURLToPath(new URL('../apps/game/index.html', import.meta.url)),
  'utf8',
);
const mainSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);
const panelsSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/panels.ts', import.meta.url)),
  'utf8',
);

function cssBlockAt(start: number, anchor: string): string {
  const open = indexSource.indexOf('{', start);
  expect(open, `missing opening brace after ${anchor}`).toBeGreaterThan(start);
  let depth = 0;
  for (let index = open; index < indexSource.length; index += 1) {
    if (indexSource[index] === '{') depth += 1;
    if (indexSource[index] === '}') depth -= 1;
    if (depth === 0) return indexSource.slice(open + 1, index);
  }
  throw new Error(`unterminated CSS block after ${anchor}`);
}

function cssBlocksAfter(anchor: string): string {
  const blocks: string[] = [];
  let start = indexSource.indexOf(anchor);
  while (start >= 0) {
    blocks.push(cssBlockAt(start, anchor));
    start = indexSource.indexOf(anchor, start + anchor.length);
  }
  expect(blocks.length, `missing CSS anchor ${anchor}`).toBeGreaterThan(0);
  return blocks.join('\n');
}

function declarations(block: string, selector: string): string {
  const uncommented = block.replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = [...uncommented.matchAll(/([^{}]+)\{([^}]*)\}/gs)].filter((candidate) =>
    (candidate[1] ?? '').split(',').some((part) => part.trim() === selector));
  expect(matches.length, `missing narrow-phone rule for ${selector}`).toBeGreaterThan(0);
  return matches.map((match) => match[2]).join('\n');
}

function selectorDeclarations(source: string, selector: string): string[] {
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...uncommented.matchAll(/([^{}]+)\{([^}]*)\}/gs)]
    .filter((candidate) => (candidate[1] ?? '').split(',').some((part) => part.trim() === selector))
    .map((candidate) => candidate[2] ?? '');
}

const COMPENDIUM_HEADING_SELECTOR_SPECIFICITY = new Map<string, readonly [number, number, number]>([
  ['.panel h3', [0, 1, 1]],
  ['#codexpanel.codex-list-mode > h3', [1, 1, 1]],
  ['#codexpanel.codex-list-mode h3', [1, 1, 1]],
]);

function specificityWins(
  candidate: readonly [number, number, number],
  incumbent: readonly [number, number, number],
): boolean {
  for (let index = 0; index < candidate.length; index += 1) {
    if (candidate[index] !== incumbent[index]) return candidate[index]! > incumbent[index]!;
  }
  return true;
}

function compendiumHeadingClearWinner(source: string): { selector: string; value: string } | null {
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let winner: {
    selector: string;
    value: string;
    important: boolean;
    specificity: readonly [number, number, number];
  } | null = null;
  for (const rule of uncommented.matchAll(/([^{}]+)\{([^}]*)\}/gs)) {
    const clearDeclarations = [...(rule[2] ?? '').matchAll(/(?:^|;)\s*clear\s*:\s*([^;!]+)\s*(!important)?\s*(?:;|$)/gi)];
    const clear = clearDeclarations.at(-1);
    if (!clear) continue;
    for (const rawSelector of (rule[1] ?? '').split(',')) {
      const selector = rawSelector.trim().replace(/\s+/g, ' ');
      const specificity = COMPENDIUM_HEADING_SELECTOR_SPECIFICITY.get(selector);
      if (!specificity) continue;
      const candidate = {
        selector,
        value: (clear[1] ?? '').trim().toLowerCase(),
        important: Boolean(clear[2]),
        specificity,
      };
      if (!winner
        || (candidate.important && !winner.important)
        || (candidate.important === winner.important
          && specificityWins(candidate.specificity, winner.specificity))) {
        winner = candidate;
      }
    }
  }
  return winner && { selector: winner.selector, value: winner.value };
}

function compendiumHeadingSharesCloseRow(source: string): boolean {
  const generic = selectorDeclarations(source, '.panel h3');
  const listMode = selectorDeclarations(source, '#codexpanel.codex-list-mode > h3');
  const winner = compendiumHeadingClearWinner(source);
  return generic.length === 1 && listMode.length === 1
    && /clear\s*:\s*both\s*;/.test(generic[0] ?? '')
    && !/clear\s*:\s*both\s*!important\s*;/.test(generic[0] ?? '')
    && /clear\s*:\s*none\s*;/.test(listMode[0] ?? '')
    && winner?.selector === '#codexpanel.codex-list-mode > h3'
    && winner.value === 'none';
}

function compendiumHeadingIsDirectPanelChild(main: string, panels: string): boolean {
  const listBinding = /const panel\s*=\s*document\.getElementById\('codexpanel'\)!;[\s\S]{0,200}?panel\.classList\.add\('codex-list-mode'\);[\s\S]{0,200}?fillPanel\('codex',\s*`<h3>Compendium\b/.test(main);
  const topLevelFill = /def\.el\.innerHTML\s*=\s*html\s*;\s*seatPnx\(def\)\s*;/.test(panels);
  return listBinding && topLevelFill;
}

describe('narrow-phone Inventory row reflow contract', () => {
  const narrow = cssBlocksAfter('@media (max-width: 360px)');

  it('keeps every row owner width-bounded and reflows copy above left-aligned badges', () => {
    const list = declarations(narrow, '.inventory-list');
    const row = declarations(narrow, '#inventorypanel button.inventory-row');
    const copy = declarations(narrow, '.inventory-row-copy');
    const badges = declarations(narrow, '.inventory-badges');

    for (const [label, rule] of [['list', list], ['row', row], ['copy', copy], ['badges', badges]]) {
      expect(rule, `${label} must release intrinsic width`).toMatch(/min-width\s*:\s*0\s*;/);
      expect(rule, `${label} must stay inside the panel`).toMatch(/max-width\s*:\s*100%\s*;/);
    }
    expect(row).toMatch(/grid-template-columns\s*:\s*minmax\(0\s*,\s*1fr\)\s*;/);
    expect(row).toMatch(/align-items\s*:\s*start\s*;/);
    expect(badges).toMatch(/justify-content\s*:\s*flex-start\s*;/);
  });

  it('preserves the full visible instance copy instead of truncating or hiding it', () => {
    const copy = declarations(narrow, '.inventory-row-copy');
    expect(copy).toMatch(/overflow-wrap\s*:\s*anywhere\s*;/);
    expect(copy).toMatch(/white-space\s*:\s*normal\s*;/);
    expect(copy).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden|overflow\s*:\s*hidden|text-overflow|line-clamp/i);
  });
});

describe('Compendium list heading Close-row contract', () => {
  it('overrides the generic floated-Close clear only in list mode', () => {
    expect(compendiumHeadingSharesCloseRow(indexSource)).toBe(true);
  });

  it('rejects the former second-row clear and a broad all-panel override', () => {
    const formerClear = indexSource.replace(
      '#codexpanel.codex-list-mode > h3 { clear: none; }',
      '#codexpanel.codex-list-mode > h3 { clear: both; }',
    );
    const broadOverride = indexSource.replace(
      '#codexpanel.codex-list-mode > h3 { clear: none; }',
      '.panel h3 { clear: none; }',
    );
    const styleClose = indexSource.lastIndexOf('</style>');
    expect(styleClose, 'missing production style boundary').toBeGreaterThan(0);
    const laterEqualSpecificityConflict =
      `${indexSource.slice(0, styleClose)}#codexpanel.codex-list-mode h3 { clear: both; }\n${indexSource.slice(styleClose)}`;
    expect(formerClear).not.toBe(indexSource);
    expect(broadOverride).not.toBe(indexSource);
    expect(compendiumHeadingSharesCloseRow(formerClear)).toBe(false);
    expect(compendiumHeadingSharesCloseRow(broadOverride)).toBe(false);
    expect(compendiumHeadingSharesCloseRow(laterEqualSpecificityConflict)).toBe(false);
  });

  it('binds the direct-child selector to the production Compendium heading', () => {
    expect(compendiumHeadingIsDirectPanelChild(mainSource, panelsSource)).toBe(true);

    const wrappedHeading = mainSource.replace(
      '`<h3>Compendium ',
      '`<div><h3>Compendium ',
    );
    const wrappedFill = panelsSource.replace(
      'def.el.innerHTML = html;',
      'def.el.innerHTML = `<div>${html}</div>`;',
    );
    expect(wrappedHeading).not.toBe(mainSource);
    expect(wrappedFill).not.toBe(panelsSource);
    expect(compendiumHeadingIsDirectPanelChild(wrappedHeading, panelsSource)).toBe(false);
    expect(compendiumHeadingIsDirectPanelChild(mainSource, wrappedFill)).toBe(false);
  });
});
