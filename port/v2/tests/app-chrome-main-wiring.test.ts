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
  path.join(here, '..', 'apps', 'game', 'src', 'app-chrome.ts'),
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
    '/* ---- THE PHASE 4 CHROME',
    '\nconst esc =',
  );
  const status = section(main, 'function updateChips(): void {', '\nfunction hudText(): void {');
  const rankAnchor = section(owner, '  const rankCeremonyAnchor =', '\n\n  const renderStatus =');
  const renderStatus = section(owner, '  const renderStatus =', '\n\n  const setContext =');
  const resizeLifecycle = section(owner, '  const resizeObservers:', '\n\n  const diagnostics =');
  const diagnostics = section(owner, '  const diagnostics =', '\n\n  const dispose =');
  const dispose = section(owner, '  const dispose =', '\n\n  return Object.freeze({');
  const replacement = section(
    main,
    'function scheduleReplacementReload(',
    '\n/* ---- THE PHASE 4 CHROME',
  );

  if (occurrences(main, "import { createAppChromeController } from './app-chrome.js';") !== 1
    || occurrences(main, 'const appChrome = createAppChromeController({') !== 1) {
    errors.push('factory-ownership');
  }
  if (adapter.length === 0
    || !adapter.includes("if (nav.mode === 'galaxy') gz0 = 0.42 * minWH() / GR;\n    else if (nav.mode === 'system') sz0 = 0.40 * minWH() / SYS_R;")
    || !adapter.includes('syncContextH: syncCtxH,')
    || !adapter.includes('setContext: setCtx,')) {
    errors.push('adapter-ports');
  }
  const callbackIndex = adapter.indexOf('onViewportResize: () => {');
  const galaxyIndex = adapter.indexOf("if (nav.mode === 'galaxy')", callbackIndex);
  const systemIndex = adapter.indexOf("else if (nav.mode === 'system')", callbackIndex);
  if (callbackIndex < 0 || galaxyIndex <= callbackIndex || systemIndex <= galaxyIndex) {
    errors.push('camera-resize-order');
  }
  const exactThinAdapter = 'function syncSurfaceChromeBottom(): void {\n  appChrome.syncSurfaceChromeBottom();\n}';
  if (!adapter.includes(exactThinAdapter)
    || occurrences(main, 'appChrome.syncSurfaceChromeBottom();') !== 1
    || occurrences(main, 'syncSurfaceChromeBottom();') !== 7) {
    errors.push('surface-thin-adapter');
  }

  for (const selector of [
    "getElementById('trail')",
    "getElementById('playerchip')",
    "getElementById('primechip')",
    "querySelector('#hpbar .fill')",
    "querySelector('#hpbar .txt')",
    "getElementById('objchip')",
    "getElementById('ctxbar')",
    "getElementById('hintpill')",
    "getElementById('topbar')",
    "getElementById('dock')",
  ]) if (main.includes(selector)) errors.push('raw-main-dom');
  if (occurrences(main, 'appChrome.rankCeremonyAnchor();') !== 1
    || !owner.includes('readonly rankCeremonyAnchor: () => AppChromeAnchorPoint | null;')
    || !rankAnchor.includes('const rect = playerChip.getBoundingClientRect();')
    || !rankAnchor.includes('rect.width <= 0 || rect.height <= 0')
    || !rankAnchor.includes('x: rect.left + rect.width / 2,')
    || !rankAnchor.includes('y: rect.top + rect.height / 2,')
    || !owner.includes('    rankCeremonyAnchor,\n')) {
    errors.push('rank-ceremony-anchor-port');
  }
  for (const legacy of [
    'trailEl', 'playerChipEl', 'primeChipEl', 'hpFillEl', 'hpTxtEl', 'objChipEl',
    'ctxEl', 'hintEl', 'topbarEl', 'dockEl', 'surfaceTopChromeEls',
    'lastSurfaceTrailBottom', "classList.toggle('surface-trail-yield'",
    "style.setProperty('--surface-chrome-bottom'", "style.setProperty('--topbar-h'",
    "style.setProperty('--dock-h'", "style.setProperty('--ctx-h'", "style.setProperty('--hint-h'",
  ]) if (main.includes(legacy)) errors.push('raw-main-dom');

  const statusPorts = [
    'explorerName: save.explorerName,',
    'essence: save.essence,',
    'landedWorlds: canonicalWorldLandingCount(worldIdentityState),',
    'hp: save.hp,',
    'hpMax: save.HP_MAX,',
    'primeCount: primeCount(),',
    "? { kind: 'progress', text: objective.text, have: objective.have, need: objective.need }",
    "? { kind: 'boundary', name: projection.name }",
  ];
  if (status.length === 0 || occurrences(status, 'appChrome.renderStatus({') !== 1
    || statusPorts.some((port) => !status.includes(port))
    || !status.includes('const objective = currentV2Objective(save.ascCh, save.ascProg, stage);')
    || !status.includes('const projection = projectV2Charter(save.ascCh, save.ascProg, stage);')
    || /\b(?:innerHTML|textContent|style\.width|syncTopbarH)\b/.test(status)) {
    errors.push('status-projection');
  }

  for (const port of [
    'trail: appChrome.diagnostics().trail, ctx: appChrome.diagnostics().context,',
    'objective: appChrome.diagnostics().objective,',
    'topbarH: appChrome.diagnostics().topbarH,',
  ]) if (!main.includes(port)) errors.push('diagnostic-port');
  if (occurrences(main, 'appChrome.diagnostics()') !== 4) errors.push('diagnostic-port');

  const chromeDispose = replacement.indexOf('try { appChrome.dispose(); }');
  const rendererRelease = replacement.indexOf('try { witness = releaseRendererForReload(reason, audioRelease); }');
  const reload = replacement.indexOf('setTimeout(() => location.reload(), 0);');
  if (replacement.length === 0 || occurrences(main, 'appChrome.dispose();') !== 1
    || chromeDispose < 0 || rendererRelease <= chromeDispose || reload <= rendererRelease) {
    errors.push('replacement-teardown');
  }

  for (const binding of [
    "requiredById(chromeDocument, 'trail')",
    "requiredById(chromeDocument, 'playerchip')",
    "requiredById(chromeDocument, 'primechip')",
    "requiredElement(chromeDocument, '#hpbar .fill')",
    "requiredElement(chromeDocument, '#hpbar .txt')",
    "requiredById(chromeDocument, 'objchip')",
    "requiredById(chromeDocument, 'ctxbar')",
    "requiredById(chromeDocument, 'hintpill')",
    "requiredById(chromeDocument, 'topbar')",
    "requiredById(chromeDocument, 'dock')",
    "requiredById(chromeDocument, 'searchbox')",
  ]) if (occurrences(owner, binding) !== 1) errors.push('exact-dom-owner');
  const forbiddenOwnerAuthority = /\b(?:globalThis|__CF_SLICE__|f4Runtime|currentEcologyEpoch|SessionRNG|AudioContext|createAudioRuntime|playVoice)\b|\blocation\.reload\s*\(|\bnavigator\.storage\b/u;
  const forbiddenOwnedAction = /\b(?:trail|playerChip|primeChip|hpFill|hpText|objectiveChip|context|hint|topbar|dock|surfaceTopChrome\[[^\]]+\]!?)\.addEventListener\s*\(/u;
  const forbiddenOwnedHandler = /\b(?:trail|playerChip|primeChip|hpFill|hpText|objectiveChip|context|hint|topbar|dock|surfaceTopChrome\[[^\]]+\]!?)\.on[a-z]+\s*=/u;
  if (/^import\s/m.test(owner)
    || /from ['"](?:\.\/main|pixi\.js|@pixi|@cf\/audio|@cf\/persistence|@cf\/scene)/i.test(owner)
    || /\b(?:playWhoosh|playSurveyPing|dock.*addEventListener|localStorage|indexedDB)\b/i.test(owner)
    || forbiddenOwnerAuthority.test(owner) || forbiddenOwnedAction.test(owner)
    || forbiddenOwnedHandler.test(owner)) {
    errors.push('owner-layering');
  }

  for (const contract of [
    "playerChip.textContent = view.explorerName || 'Explorer';",
    'escapeHtml(view.objective.text)',
    'escapeHtml(view.objective.name)',
    "Math.max(0, Math.min(100, (view.hp / Math.max(1, view.hpMax)) * 100)) + '%'",
    '<span class="ico" aria-hidden="true">✦</span>',
    '<span class="lbl">Prime<span class="prime-full-label"> Codex</span></span>',
    '<span class="prime-count">${escapeHtml(view.primeCount)}/9</span>',
    "primeChip.setAttribute('aria-label', `Open Prime Codex, ${view.primeCount} of 9 signatures`);",
    'syncTopbarH();',
  ]) if (!renderStatus.includes(contract)) errors.push('render-contract');
  if (!owner.includes('${escapeHtml(segment)}</span>')
    || !owner.includes(".join('<span class=\"sep\">›</span>')")) {
    errors.push('trail-escaping');
  }
  const contextSetter = section(owner, '  const setContext =', '\n  const setHint =');
  if (!contextSetter.includes('context.textContent = text;')
    || contextSetter.includes('context.innerHTML')) errors.push('context-escaping');

  for (const observation of [
    'observeResize(topbar, syncTopbarH);',
    'observeResize(dock, syncDockH);',
    'observeResize(context, syncContextH);',
    'observeResize(hint, syncHintH);',
    'for (const element of surfaceTopChrome) observeResize(element, syncSurfaceChromeBottom);',
    'const bodyClassObserver = makeMutationObserver(syncSurfaceChromeBottom);',
    "attributeFilter: ['class'],",
  ]) if (!resizeLifecycle.includes(observation)) errors.push('observer-ownership');
  if (occurrences(resizeLifecycle, 'observeResize(') !== 5
    || occurrences(resizeLifecycle, 'makeMutationObserver(') !== 1) {
    errors.push('observer-cardinality');
  }
  const resizeOrder = [
    'syncTopbarH();',
    'syncDockH();',
    'syncContextH();',
    'syncHintH();',
    'syncSurfaceChromeBottom();',
    'options.onViewportResize?.();',
  ].map((needle) => resizeLifecycle.indexOf(needle, resizeLifecycle.indexOf('const onResize')));
  if (resizeOrder.some((index) => index < 0)
    || resizeOrder.some((index, position) => position > 0 && index <= resizeOrder[position - 1]!)) {
    errors.push('owner-resize-order');
  }
  if (!resizeLifecycle.includes('addResizeListener(onResize);')) errors.push('resize-listener');
  if (!owner.includes("rootStyle.setProperty('--row1-h', Math.max(40, searchbox.getBoundingClientRect().bottom) + 'px');")) {
    errors.push('row-one-measurement');
  }
  if (!dispose.includes('if (disposed) return;')
    || !dispose.includes('removeResizeListener(onResize);')
    || !dispose.includes('for (const observer of resizeObservers) observer.disconnect();')
    || !dispose.includes('bodyClassObserver.disconnect();')) {
    errors.push('observer-disposal');
  }

  for (const read of [
    "trail: trail.textContent || '',",
    "context: context.textContent || '',",
    "objective: objectiveChip.textContent || '',",
    "topbarH: computedStyle(chromeDocument.documentElement).getPropertyValue('--topbar-h'),",
  ]) if (!diagnostics.includes(read)) errors.push('owner-diagnostics');
  return [...new Set(errors)];
}

describe('MAIN-1 / CHROME-1 application chrome extraction wiring', () => {
  it('leaves Main as a projection/viewport adapter over one DOM lifecycle owner', () => {
    expect(wiringErrors(mainSource, ownerSource)).toEqual([]);
  });

  it('negative-controls the factory, exact DOM boundary, and thin Survey/Planetside seam', () => {
    const withoutFactory = replaceOnce(
      mainSource,
      "import { createAppChromeController } from './app-chrome.js';",
      '/* negative control removed app chrome factory */',
    );
    expect(wiringErrors(withoutFactory, ownerSource)).toContain('factory-ownership');

    const directDom = mainSource.replace(
      'function updateChips(): void {',
      "function updateChips(): void {\n  document.getElementById('playerchip')!.textContent = 'bypass';",
    );
    expect(wiringErrors(directDom, ownerSource)).toContain('raw-main-dom');

    const directRankAnchor = replaceOnce(
      mainSource,
      'const anchor = appChrome.rankCeremonyAnchor();',
      "const anchor = document.getElementById('playerchip')?.getBoundingClientRect();",
    );
    expect(wiringErrors(directRankAnchor, ownerSource)).toContain('raw-main-dom');
    expect(wiringErrors(directRankAnchor, ownerSource)).toContain('rank-ceremony-anchor-port');

    const bypass = replaceOnce(
      mainSource,
      '  appChrome.syncSurfaceChromeBottom();',
      "  document.body.classList.toggle('surface-trail-yield', false);",
    );
    expect(wiringErrors(bypass, ownerSource)).toContain('surface-thin-adapter');

    const directSurvey = replaceOnce(
      mainSource,
      "  document.body.classList.add('card-open');\n  syncSurfaceChromeBottom();",
      "  document.body.classList.add('card-open');\n  appChrome.syncSurfaceChromeBottom();",
    );
    expect(wiringErrors(directSurvey, ownerSource)).toContain('surface-thin-adapter');

    const missingReplacementTeardown = replaceOnce(
      mainSource,
      '    try { appChrome.dispose(); }\n',
      '    /* negative control omitted app chrome replacement teardown */\n',
    );
    expect(wiringErrors(missingReplacementTeardown, ownerSource))
      .toContain('replacement-teardown');
  });

  it('negative-controls every status projection and the owner render contract', () => {
    const mainStatus = section(mainSource, 'function updateChips(): void {', '\nfunction hudText(): void {');
    for (const [needle, replacement] of [
      ['explorerName: save.explorerName,', "explorerName: 'Explorer',"],
      ['essence: save.essence,', 'essence: 0,'],
      ['landedWorlds: canonicalWorldLandingCount(worldIdentityState),', 'landedWorlds: 0,'],
      ['hp: save.hp,', 'hp: 0,'],
      ['hpMax: save.HP_MAX,', 'hpMax: 1,'],
      ['primeCount: primeCount(),', 'primeCount: 0,'],
      [
        "? { kind: 'progress', text: objective.text, have: objective.have, need: objective.need }",
        "? { kind: 'progress', text: '', have: 0, need: 0 }",
      ],
      [
        "? { kind: 'boundary', name: projection.name }",
        "? { kind: 'boundary', name: '' }",
      ],
    ] as const) {
      const mutatedStatus = replaceOnce(mainStatus, needle, replacement);
      const mutated = mainSource.replace(mainStatus, mutatedStatus);
      expect(wiringErrors(mutated, ownerSource), needle).toContain('status-projection');
    }

    const unsafeExplorerHtml = replaceOnce(
      ownerSource,
      "playerChip.textContent = view.explorerName || 'Explorer';",
      "playerChip.innerHTML = view.explorerName || 'Explorer';",
    );
    expect(wiringErrors(mainSource, unsafeExplorerHtml)).toContain('render-contract');
    const unescapedPrimeCount = replaceOnce(ownerSource, '${escapeHtml(view.primeCount)}/9</span>', '${view.primeCount}/9</span>');
    expect(wiringErrors(mainSource, unescapedPrimeCount)).toContain('render-contract');
    const guessedRowOne = replaceOnce(ownerSource, "Math.max(40, searchbox.getBoundingClientRect().bottom) + 'px'", "'40px'");
    expect(wiringErrors(mainSource, guessedRowOne)).toContain('row-one-measurement');
    expect(wiringErrors(mainSource, ownerSource)).toEqual([]);
    const unescapedTrail = replaceOnce(ownerSource, '${escapeHtml(segment)}</span>', '${segment}</span>');
    expect(wiringErrors(mainSource, unescapedTrail)).toContain('trail-escaping');
    const unescapedContext = replaceOnce(
      ownerSource,
      '    context.textContent = text;',
      '    context.innerHTML = text;',
    );
    expect(wiringErrors(mainSource, unescapedContext)).toContain('context-escaping');
    const ownerRenderStatus = section(ownerSource, '  const renderStatus =', '\n\n  const setContext =');
    const withoutRemeasure = replaceOnce(ownerRenderStatus, '    syncTopbarH();\n', '');
    const ownerWithoutRemeasure = ownerSource.replace(ownerRenderStatus, withoutRemeasure);
    expect(wiringErrors(mainSource, ownerWithoutRemeasure)).toContain('render-contract');
    const wrongRankAnchor = replaceOnce(
      ownerSource,
      'const rect = playerChip.getBoundingClientRect();',
      'const rect = topbar.getBoundingClientRect();',
    );
    expect(wiringErrors(mainSource, wrongRankAnchor)).toContain('rank-ceremony-anchor-port');
  });

  it('negative-controls observer cardinality, mutation scope, resize order, and teardown', () => {
    const withoutHintObserver = replaceOnce(
      ownerSource,
      '  observeResize(hint, syncHintH);\n',
      '',
    );
    expect(wiringErrors(mainSource, withoutHintObserver)).toContain('observer-ownership');
    expect(wiringErrors(mainSource, withoutHintObserver)).toContain('observer-cardinality');

    const duplicateSurfaceObserver = replaceOnce(
      ownerSource,
      '  for (const element of surfaceTopChrome) observeResize(element, syncSurfaceChromeBottom);',
      '  for (const element of surfaceTopChrome) {\n    observeResize(element, syncSurfaceChromeBottom);\n    observeResize(element, syncSurfaceChromeBottom);\n  }',
    );
    expect(wiringErrors(mainSource, duplicateSurfaceObserver)).toContain('observer-ownership');
    expect(wiringErrors(mainSource, duplicateSurfaceObserver)).toContain('observer-cardinality');

    const broadMutation = replaceOnce(
      ownerSource,
      "    attributeFilter: ['class'],",
      "    attributeFilter: ['class', 'style'],",
    );
    expect(wiringErrors(mainSource, broadMutation)).toContain('observer-ownership');

    const earlyViewportCallback = replaceOnce(
      ownerSource,
      '  const onResize = (): void => {\n    syncTopbarH();',
      '  const onResize = (): void => {\n    options.onViewportResize?.();\n    syncTopbarH();',
    ).replace('    options.onViewportResize?.();\n  };\n  addResizeListener(onResize);', '  };\n  addResizeListener(onResize);');
    expect(wiringErrors(mainSource, earlyViewportCallback)).toContain('owner-resize-order');

    const withoutRemoval = replaceOnce(
      ownerSource,
      '    removeResizeListener(onResize);\n',
      '',
    );
    expect(wiringErrors(mainSource, withoutRemoval)).toContain('observer-disposal');

    for (const authorityLeak of [
      '  const leakedF4Authority = (globalThis as any).f4Runtime;\n',
      "  surfaceTopChrome[1]!.addEventListener('click', () => undefined);\n",
      '  void new (chromeWindow.AudioContext as any)();\n',
      '  chromeWindow.location.reload();\n',
      '  void chromeWindow.navigator.storage.persist();\n',
      '  dock.onclick = () => undefined;\n',
      '  void (globalThis as any).deepScanner;\n',
      '  void (globalThis as any).rarity;\n',
    ]) {
      const ownerWithLeak = replaceOnce(
        ownerSource,
        '  addResizeListener(onResize);\n',
        `  addResizeListener(onResize);\n${authorityLeak}`,
      );
      expect(wiringErrors(mainSource, ownerWithLeak), authorityLeak)
        .toContain('owner-layering');
    }
  });

  it('negative-controls all diagnostic delegation and owner reads', () => {
    for (const [needle, replacement] of [
      ['trail: appChrome.diagnostics().trail,', "trail: document.getElementById('trail')?.textContent || '',"],
      ['ctx: appChrome.diagnostics().context,', "ctx: '',"],
      ['objective: appChrome.diagnostics().objective,', "objective: '',"],
      ['topbarH: appChrome.diagnostics().topbarH,', "topbarH: '',"],
    ] as const) {
      const mutated = replaceOnce(mainSource, needle, replacement);
      expect(wiringErrors(mutated, ownerSource), needle).toContain('diagnostic-port');
    }
    const missingObjectiveRead = replaceOnce(
      ownerSource,
      "    objective: objectiveChip.textContent || '',\n",
      '',
    );
    expect(wiringErrors(mainSource, missingObjectiveRead)).toContain('owner-diagnostics');
  });
});
