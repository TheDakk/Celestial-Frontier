import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);
const ownerSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'search-travel.ts'),
  'utf8',
);

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceOnce(source: string, needle: string, replacement: string): string {
  if (occurrences(source, needle) !== 1) throw new Error(`mutation target is not unique: ${needle}`);
  return source.replace(needle, replacement);
}

function wiringErrors(main: string, owner: string): string[] {
  const errors: string[] = [];
  const adapter = section(
    main,
    '/* ---- THE SEARCH BAR',
    "\nsheet.querySelector('#importclose')",
  );
  const importBlock = section(main, "import {\n  createSearchTravelController,", "} from './search-travel.js';");
  if (adapter.length === 0) errors.push('missing-main-adapter');
  if (importBlock.length === 0
    || !importBlock.includes('navigationAuthorityFailureFor,')) errors.push('factory-import');
  if (!adapter.includes('const searchTravel = createSearchTravelController({')) {
    errors.push('single-controller');
  }

  for (const legacy of [
    'const searchEl =',
    'function encodeHere(',
    'function resolveStrictAddress(',
    'function navigationAuthorityFailureFor(',
    'function navigationAuthorityFailure(',
    'function trainingSolSystemNav(',
    'function trainingEarthSurfaceNav(',
    'function jumpToProvenNav(',
    'function jumpToCanonicalAddress(',
  ]) if (main.includes(legacy)) errors.push('legacy-main-owner');
  if (adapter.includes("addEventListener('keydown'")
    || /\b(?:parseStrictCF1Code|navFromCanonicalCF1Address|cleanName)\b/.test(main)) {
    errors.push('main-search-listener');
  }

  for (const port of [
    "search: document.getElementById('searchbox') as HTMLInputElement,",
    'currentNav: () => nav,',
    'currentSave: () => save || null,',
    "currentPlanetName: (planetSeed) => customNames.get('p' + planetSeed) || null,",
    'routeChangeBlocked: () => blockRouteChangeWhileProductAction(),',
    'mutationsBlocked: () => playerMutationsBlocked(),',
    'planetNodeForProof,',
    'onPrimeReachBlocked: () => { toastPrimeReachBoundary(); },',
    'onCharterReachBlocked: () => { toastCharterBoundary(ascHintFor(ascStage())); },',
    "  compendiumState: () => ({\n    panelOpen: openPanelId() === 'codex',\n    mode: codexMode,\n    filter: codexFilter,\n  }),",
    'clearCompendium: () => { fillCodex(\'\'); },',
    'presentCompendium: (query, opener) => { codexOpenController.present(query, opener); },',
    "  focusCompendiumContinuation: () => {\n    (document.querySelector<HTMLElement>('#codexpanel [data-ci]')\n      || document.querySelector<HTMLElement>('#codexpanel [data-pnx]'))?.focus();\n  },",
    "  focusAfterAcceptedRoute: () => {\n    const action = card.querySelector<HTMLElement>('[data-act=\"landcta\"],[data-act=\"travel\"]');\n    (action || app.canvas).focus();\n  },",
  ]) if (!adapter.includes(port)) errors.push('required-port');

  const commit = section(adapter, '  commitNavigation:', '\n  onPrimeReachBlocked:');
  const commitOrder = [
    "customNames.set('p' + focusPlanet.seed, customPlanetName);",
    'save.customNames = [...customNames.entries()];',
    'nav = committedNav;',
    'savedRouteWriteHeld = false;',
    'playWhoosh();',
    'rerender();',
    'surveyPlanet(focusPlanet, target.star, target.planet);',
  ].map((needle) => commit.indexOf(needle));
  if (commit.length === 0
    || commitOrder.some((index) => index < 0)
    || commitOrder.some((index, position) => position > 0 && index <= commitOrder[position - 1]!)) {
    errors.push('commit-order');
  }
  if (occurrences(commit, 'save.customNames = [...customNames.entries()];') !== 1
    || occurrences(commit, 'rerender();') !== 1
    || occurrences(commit, 'surveyPlanet(focusPlanet, target.star, target.planet);') !== 1
    || !commit.includes("if (focusPlanet && target.mode === 'surface') {\n      surveyPlanet(focusPlanet, target.star, target.planet);\n    }")) {
    errors.push('commit-cardinality');
  }

  for (const delegation of [
    'searchTravel.jumpToProvenNav(route)',
    'searchTravel.navigationAuthorityFailure(r.state)',
    'searchTravel.trainingSolSystemNav()',
    'searchTravel.trainingEarthSurfaceNav()',
    'searchTravel.selectForManualCopy(code);',
    'encodeHere: searchTravel.encodeHere',
    'if (searchTravel.blurIfFocused()) return;',
  ]) if (!main.includes(delegation)) errors.push('external-delegation');
  if (occurrences(main, 'searchTravel.navigationAuthorityFailure(r.state)') !== 2
    || occurrences(main, 'searchTravel.trainingSolSystemNav()') < 5
    || occurrences(main, 'navigationAuthorityFailureFor(') !== 5
    || occurrences(main, 'SHIP_LIVERY_SEED') < 8) errors.push('caller-coverage');

  if (/from ['"](?:\.\/main|pixi\.js|@pixi)/i.test(owner)
    || /\b(?:Application|Container|Graphics|Sprite)\b/.test(owner)) {
    errors.push('owner-layering');
  }
  if (!owner.includes("ports.search.addEventListener('keydown', onSearchKeydown);")
    || !owner.includes("ports.search.removeEventListener('keydown', onSearchKeydown);")) {
    errors.push('listener-lifecycle');
  }
  if (owner.includes('querySelector(')
    || /\b(?:persistView|savedRouteWriteHeld|surveyPlanet|fillCodex|codexOpenController)\b/.test(owner)) {
    errors.push('injected-effects-only');
  }
  return [...new Set(errors)];
}

describe('MAIN-1 Search/CF1 travel extraction wiring', () => {
  it('leaves Main as one renderer/persistence adapter over the focused owner', () => {
    expect(wiringErrors(mainSource, ownerSource)).toEqual([]);
  });

  it('negative-controls factory ownership and a reintroduced Main listener', () => {
    const withoutImport = replaceOnce(
      mainSource,
      "import {\n  createSearchTravelController,\n  navigationAuthorityFailureFor,\n} from './search-travel.js';",
      '/* negative control removed Search/travel import */',
    );
    expect(wiringErrors(withoutImport, ownerSource)).toContain('factory-import');

    const adapter = section(mainSource, '/* ---- THE SEARCH BAR', "\nsheet.querySelector('#importclose')");
    const directListener = mainSource.replace(
      adapter,
      adapter + "\ndocument.getElementById('searchbox')!.addEventListener('keydown', () => {});",
    );
    expect(wiringErrors(directListener, ownerSource)).toContain('main-search-listener');
  });

  it('negative-controls every injected name, Compendium, focus, and boundary-notice binding', () => {
    const adapter = section(mainSource, '/* ---- THE SEARCH BAR', "\nsheet.querySelector('#importclose')");
    for (const [needle, replacement] of [
      [
        "  currentPlanetName: (planetSeed) => customNames.get('p' + planetSeed) || null,",
        '  currentPlanetName: () => null,',
      ],
      [
        "    panelOpen: openPanelId() === 'codex',",
        '    panelOpen: false,',
      ],
      [
        '  onPrimeReachBlocked: () => { toastPrimeReachBoundary(); },',
        '  onPrimeReachBlocked: () => {},',
      ],
      [
        '  onCharterReachBlocked: () => { toastCharterBoundary(ascHintFor(ascStage())); },',
        '  onCharterReachBlocked: () => {},',
      ],
      [
        "  focusCompendiumContinuation: () => {\n    (document.querySelector<HTMLElement>('#codexpanel [data-ci]')\n      || document.querySelector<HTMLElement>('#codexpanel [data-pnx]'))?.focus();\n  },",
        '  focusCompendiumContinuation: () => {},',
      ],
      [
        "  focusAfterAcceptedRoute: () => {\n    const action = card.querySelector<HTMLElement>('[data-act=\"landcta\"],[data-act=\"travel\"]');\n    (action || app.canvas).focus();\n  },",
        '  focusAfterAcceptedRoute: () => {},',
      ],
    ] as const) {
      const mutatedAdapter = replaceOnce(adapter, needle, replacement);
      const mutated = mainSource.replace(adapter, mutatedAdapter);
      expect(wiringErrors(mutated, ownerSource), needle).toContain('required-port');
    }
  });

  it('negative-controls the atomic commit order and Survey-after-render seam', () => {
    const adapter = section(mainSource, '/* ---- THE SEARCH BAR', "\nsheet.querySelector('#importclose')");
    const withoutDurableNameAdapter = replaceOnce(
      adapter,
      '      save.customNames = [...customNames.entries()];\n',
      '      /* negative control omitted durable custom-name publication */\n',
    );
    const withoutDurableName = mainSource.replace(adapter, withoutDurableNameAdapter);
    expect(wiringErrors(withoutDurableName, ownerSource)).toContain('commit-order');
    expect(wiringErrors(withoutDurableName, ownerSource)).toContain('commit-cardinality');

    const withoutHeldReleaseAdapter = replaceOnce(
      adapter,
      '    savedRouteWriteHeld = false;\n',
      '    /* negative control retained held route */\n',
    );
    const withoutHeldRelease = mainSource.replace(adapter, withoutHeldReleaseAdapter);
    expect(wiringErrors(withoutHeldRelease, ownerSource)).toContain('commit-order');

    const earlySurveyAdapter = replaceOnce(
      adapter,
      '    playWhoosh();\n    rerender();\n    if (focusPlanet && target.mode === \'surface\') {\n      surveyPlanet(focusPlanet, target.star, target.planet);\n    }',
      '    surveyPlanet(focusPlanet!, target.star!, target.planet!);\n    playWhoosh();\n    rerender();',
    );
    const earlySurvey = mainSource.replace(adapter, earlySurveyAdapter);
    expect(wiringErrors(earlySurvey, ownerSource)).toContain('commit-order');

    const duplicateRerenderAdapter = replaceOnce(
      adapter,
      '    rerender();\n',
      '    rerender();\n    rerender();\n',
    );
    const duplicateRerender = mainSource.replace(adapter, duplicateRerenderAdapter);
    expect(wiringErrors(duplicateRerender, ownerSource)).toContain('commit-cardinality');

    const unconditionalSurveyAdapter = replaceOnce(
      adapter,
      "    if (focusPlanet && target.mode === 'surface') {\n      surveyPlanet(focusPlanet, target.star, target.planet);\n    }",
      '    surveyPlanet(focusPlanet!, target.star!, target.planet!);',
    );
    const unconditionalSurvey = mainSource.replace(adapter, unconditionalSurveyAdapter);
    expect(wiringErrors(unconditionalSurvey, ownerSource)).toContain('commit-cardinality');
  });

  it('negative-controls Escape and manual-copy bypasses around the owner', () => {
    const directEscape = replaceOnce(
      mainSource,
      '    if (searchTravel.blurIfFocused()) return;',
      "    if (document.activeElement === document.getElementById('searchbox')) return;",
    );
    expect(wiringErrors(directEscape, ownerSource)).toContain('external-delegation');

    const directCopy = replaceOnce(
      mainSource,
      '    searchTravel.selectForManualCopy(code);',
      "    (document.getElementById('searchbox') as HTMLInputElement).value = code;",
    );
    expect(wiringErrors(directCopy, ownerSource)).toContain('external-delegation');
  });
});
