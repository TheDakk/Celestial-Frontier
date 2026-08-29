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
    || !importBlock.includes('navigationAuthorityFailureFor,')
    || !importBlock.includes('type SearchTravelCommitPlan,')) errors.push('factory-import');
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
    || /\b(?:parseStrictCF1Code|navFromCanonicalCF1Address)\b/.test(main)) {
    errors.push('main-search-listener');
  }

  for (const port of [
    "search: document.getElementById('searchbox') as HTMLInputElement,",
    'currentNav: () => nav,',
    'currentSave: () => save || null,',
    'currentPlanetName: (address) => worldIdentityName(worldIdentityState, address),',
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

  const nameCommit = section(
    adapter,
    'async function commitArc0WorldNameForSearch(',
    '\nconst searchTravel =',
  );
  const nameCommitOrder = [
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'const attempt = await commitArc0WorldNameAction({',
    'durable = true;',
    'save.customNames = attempt.transaction.state.customNames.map(',
    'syncCustomNameIndex();',
    'worldIdentityState = attempt.verification.worldIdentity.state;',
    "return 'committed';",
    'actionClaim.settle(durable);',
  ].map((needle) => nameCommit.indexOf(needle));
  if (nameCommit.length === 0
    || nameCommitOrder.some((index) => index < 0)
    || nameCommitOrder.some((index, position) => (
      position > 0 && index <= nameCommitOrder[position - 1]!
    ))) errors.push('name-commit-order');
  if (occurrences(nameCommit, 'commitArc0WorldNameAction({') !== 1
    || occurrences(nameCommit, 'save.customNames = attempt.transaction.state.customNames.map(') !== 1
    || occurrences(nameCommit, 'worldIdentityState = attempt.verification.worldIdentity.state;') !== 1
    || nameCommit.includes('persistView(')
    || nameCommit.includes('setCanonicalWorldName(')
    || !nameCommit.includes("lastArc0WorldNameOutcome = 'committed-publication-reload';")) {
    errors.push('name-commit-cardinality');
  }

  const presenter = section(
    adapter,
    'function publishAcceptedSearchNavigation(',
    '\n/** Search has already decoded',
  );
  const presenterOrder = [
    'nav = committedNav;',
    'savedRouteWriteHeld = false;',
    'playWhoosh();',
    'rerender(skipPersist ? { skipPersist: true } : undefined);',
    'surveyPlanet(focusPlanet, target.star, target.planet);',
  ].map((needle) => presenter.indexOf(needle));
  if (presenter.length === 0
    || presenterOrder.some((index) => index < 0)
    || presenterOrder.some((index, position) => (
      position > 0 && index <= presenterOrder[position - 1]!
    ))) errors.push('commit-order');
  if (occurrences(presenter, 'nav = committedNav;') !== 1
    || occurrences(presenter, 'savedRouteWriteHeld = false;') !== 1
    || occurrences(presenter, 'rerender(skipPersist ? { skipPersist: true } : undefined);') !== 1
    || occurrences(presenter, 'rerender(') !== 1
    || occurrences(presenter, 'surveyPlanet(focusPlanet, target.star, target.planet);') !== 1
    || !presenter.includes("if (focusPlanet && target.mode === 'surface') {")) {
    errors.push('commit-cardinality');
  }

  const arrivalParent = section(
    adapter,
    'function galaxyNavForAcceptedSearchRoute(',
    '\nasync function commitArc9AcceptedSearchRoute(',
  );
  if (!arrivalParent.includes("if (committedNav.mode === 'galaxy') return committedNav;")
    || !arrivalParent.includes('const lifted = ascend(committedNav);')
    || !arrivalParent.includes("lifted.ok && lifted.state.mode === 'galaxy'")) {
    errors.push('accepted-route-galaxy-parent');
  }
  const acceptedRoute = section(
    adapter,
    'async function commitArc9AcceptedSearchRoute(',
    '\n/** Search has already decoded',
  );
  const acceptedRouteOrder = [
    'const galaxyNav = galaxyNavForAcceptedSearchRoute(plan.committedNav);',
    'const acceptedSavedView = navToView(plan.committedNav);',
    "lastArc9TravelOutcome = 'refused:accepted-route-unproven';",
    'if (arc9TravelInspectionOnly()) {',
    'publishAcceptedSearchNavigation(plan, true);',
    "lastArc9TravelOutcome = 'inspection-only:accepted-route';",
    'if (arc9TravelWriteTemporarilyBlocked()) {',
    'const sourceNav = nav;',
    'return settleArc9DirectTravel(',
    "'galaxy-arrival',",
    'galaxyNav,',
    'sourceNav,',
    '() => publishAcceptedSearchNavigation(plan, true),',
    'acceptedSavedView,',
    '() => navigationAuthorityFailureFor(save, plan.target, SHIP_LIVERY_SEED) === null,',
  ].map((needle) => acceptedRoute.indexOf(needle));
  if (acceptedRoute.length === 0
    || acceptedRouteOrder.some((index) => index < 0)
    || acceptedRouteOrder.some((index, position) => (
      position > 0 && index <= acceptedRouteOrder[position - 1]!
    ))) errors.push('accepted-route-owner-order');
  if (occurrences(acceptedRoute, 'settleArc9DirectTravel(') !== 1
    || occurrences(acceptedRoute, 'publishAcceptedSearchNavigation(plan, true);') !== 1
    || acceptedRoute.includes('publishAcceptedSearchNavigation(plan, false)')
    || acceptedRoute.includes('persistView(')
    || acceptedRoute.includes('queueArc9ProgressionRefresh(')) {
    errors.push('accepted-route-owner-cardinality');
  }

  const commit = section(adapter, '  commitNavigation:', '\n  onPrimeReachBlocked:');
  const commitOrder = [
    'const naming = await commitArc0WorldNameForSearch(',
    "if (naming === 'refused') return false;",
    "if (naming === 'committed-reload') return true;",
    'if (followedCode !== null) {',
    'if (arc9TravelInspectionOnly()) {',
    'publishAcceptedSearchNavigation(plan, true);',
    "lastArc9ShareFollowOutcome = 'inspection-only:no-follow-credit';",
    'return commitArc9FollowedSearchRoute(plan);',
    'return commitArc9AcceptedSearchRoute(plan);',
  ].map((needle) => commit.indexOf(needle));
  if (commit.length === 0
    || commitOrder.some((index) => index < 0)
    || commitOrder.some((index, position) => position > 0 && index <= commitOrder[position - 1]!)) {
    errors.push('commit-order');
  }
  if (occurrences(commit, 'const naming = await commitArc0WorldNameForSearch(') !== 1
    || occurrences(commit, 'return commitArc9FollowedSearchRoute(plan);') !== 1
    || occurrences(commit, 'return commitArc9AcceptedSearchRoute(plan);') !== 1
    || occurrences(commit, 'publishAcceptedSearchNavigation(plan, true);') !== 1
    || !commit.includes('const { target, focusPlanet, focusAddress, customPlanetName, followedCode } = plan;')
    || commit.includes('publishAcceptedSearchNavigation(plan, false);')
    || commit.includes('void persistView()')
    || commit.includes('save.stats.jumps')) {
    errors.push('commit-cardinality');
  }

  for (const delegation of [
    'await searchTravel.jumpToProvenNav(route)',
    'searchTravel.navigationAuthorityFailure(r.state)',
    'searchTravel.trainingSolSystemNav()',
    'searchTravel.trainingEarthSurfaceNav()',
    'searchTravel.selectForManualCopy(code);',
    'encodeHere: searchTravel.encodeHere',
    'if (searchTravel.blurIfFocused()) return;',
  ]) if (!main.includes(delegation)) errors.push('external-delegation');
  if (occurrences(main, 'searchTravel.navigationAuthorityFailure(r.state)') !== 2
    || occurrences(main, 'searchTravel.trainingSolSystemNav()') < 5
    || occurrences(main, 'navigationAuthorityFailureFor(') < 6
    || occurrences(main, 'SHIP_LIVERY_SEED') < 8) errors.push('caller-coverage');

  if (/from ['"](?:\.\/main|pixi\.js|@pixi)/i.test(owner)
    || /\b(?:Application|Container|Graphics|Sprite)\b/.test(owner)) {
    errors.push('owner-layering');
  }
  if (!owner.includes("ports.search.addEventListener('keydown', onSearchKeydown);")
    || !owner.includes("ports.search.removeEventListener('keydown', onSearchKeydown);")) {
    errors.push('listener-lifecycle');
  }
  if (!owner.includes('readonly commitNavigation: (plan: SearchTravelCommitPlan) => Promise<boolean>;')
    || !owner.includes('const committed = await ports.commitNavigation(')
    || !owner.includes('return committed;')) {
    errors.push('commit-refusal');
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
      "import {\n  createSearchTravelController,\n  navigationAuthorityFailureFor,\n  type SearchTravelCommitPlan,\n} from './search-travel.js';",
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
        '  currentPlanetName: (address) => worldIdentityName(worldIdentityState, address),',
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
    const withoutCanonicalNameAdapter = replaceOnce(
      adapter,
      '    const attempt = await commitArc0WorldNameAction({\n      runtime,\n      state: save,\n      surface,\n      address,\n      name,\n      codecNow: Date.now(),\n    });\n',
      '      /* negative control omitted canonical world-name authority */\n',
    );
    expect(wiringErrors(mainSource.replace(adapter, withoutCanonicalNameAdapter), ownerSource))
      .toContain('name-commit-order');

    const withoutDurableNameAdapter = replaceOnce(
      adapter,
      '      save.customNames = attempt.transaction.state.customNames.map(([key, value]) => [key, value]);\n',
      '      /* negative control omitted durable custom-name publication */\n',
    );
    const withoutDurableName = mainSource.replace(adapter, withoutDurableNameAdapter);
    expect(wiringErrors(withoutDurableName, ownerSource)).toContain('name-commit-order');
    expect(wiringErrors(withoutDurableName, ownerSource)).toContain('name-commit-cardinality');

    const presenter = section(
      adapter,
      'function publishAcceptedSearchNavigation(',
      '\n/** Search has already decoded',
    );
    const withoutHeldReleasePresenter = replaceOnce(
      presenter,
      '  savedRouteWriteHeld = false;\n',
      '  /* negative control retained held route */\n',
    );
    const withoutHeldRelease = mainSource.replace(presenter, withoutHeldReleasePresenter);
    expect(wiringErrors(withoutHeldRelease, ownerSource)).toContain('commit-order');

    const earlySurveyPresenter = replaceOnce(
      presenter,
      "  playWhoosh();\n  rerender(skipPersist ? { skipPersist: true } : undefined);\n  if (focusPlanet && target.mode === 'surface') {\n    surveyPlanet(focusPlanet, target.star, target.planet);\n  }",
      '  surveyPlanet(focusPlanet!, target.star!, target.planet!);\n  playWhoosh();\n  rerender(skipPersist ? { skipPersist: true } : undefined);',
    );
    const earlySurvey = mainSource.replace(presenter, earlySurveyPresenter);
    expect(wiringErrors(earlySurvey, ownerSource)).toContain('commit-order');

    const duplicateRerenderPresenter = replaceOnce(
      presenter,
      '  rerender(skipPersist ? { skipPersist: true } : undefined);\n',
      '  rerender(skipPersist ? { skipPersist: true } : undefined);\n  rerender();\n',
    );
    const duplicateRerender = mainSource.replace(presenter, duplicateRerenderPresenter);
    expect(wiringErrors(duplicateRerender, ownerSource)).toContain('commit-cardinality');

    const unconditionalSurveyPresenter = replaceOnce(
      presenter,
      "  if (focusPlanet && target.mode === 'surface') {\n    surveyPlanet(focusPlanet, target.star, target.planet);\n  }",
      '  surveyPlanet(focusPlanet!, target.star!, target.planet!);',
    );
    const unconditionalSurvey = mainSource.replace(presenter, unconditionalSurveyPresenter);
    expect(wiringErrors(unconditionalSurvey, ownerSource)).toContain('commit-cardinality');

    const acceptedRoute = section(
      adapter,
      'async function commitArc9AcceptedSearchRoute(',
      '\n/** Search has already decoded',
    );
    const directPresentation = replaceOnce(
      acceptedRoute,
      '    () => publishAcceptedSearchNavigation(plan, true),',
      '    () => publishAcceptedSearchNavigation(plan, false),',
    );
    expect(wiringErrors(mainSource.replace(acceptedRoute, directPresentation), ownerSource))
      .toContain('accepted-route-owner-order');

    const unprovedParent = replaceOnce(
      adapter,
      '  const lifted = ascend(committedNav);',
      '  const lifted = { ok: true, state: committedNav } as const;',
    );
    expect(wiringErrors(mainSource.replace(adapter, unprovedParent), ownerSource))
      .toContain('accepted-route-galaxy-parent');
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
