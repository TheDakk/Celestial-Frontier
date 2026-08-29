import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const MAIN = readFileSync(fileURLToPath(
  new URL('../apps/game/src/main.ts', import.meta.url),
), 'utf8');
const ECOLOGY = readFileSync(fileURLToPath(
  new URL('../apps/game/src/biome-ecology-audio.ts', import.meta.url),
), 'utf8');
const APPROACH = readFileSync(fileURLToPath(
  new URL('../apps/game/src/approach-ecology-audio.ts', import.meta.url),
), 'utf8');

function section(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`missing section ${start} -> ${end}`);
  return source.slice(startIndex, endIndex);
}

function replaceOnce(source: string, exact: string, replacement: string): string {
  const first = source.indexOf(exact);
  if (first < 0 || source.indexOf(exact, first + exact.length) >= 0) {
    throw new Error(`mutation anchor must be unique: ${exact}`);
  }
  return source.slice(0, first) + replacement + source.slice(first + exact.length);
}

function audit(main: string, ecology: string, approach: string): readonly string[] {
  const errors: string[] = [];
  const detail = section(main, 'function fillCodexDetail(', '  const portrait =');
  const list = section(main, 'function fillCodex(filter?', '/* the Compendium DETAIL CARD');
  const rows = section(main, 'function mountCodexRow(', 'function fillCodex(filter?');
  const controller = section(
    main,
    'const compendiumAuditionController = new CompendiumAuditionController({',
    'const compendiumBreedController =',
  );
  const dispatch = section(main, 'async function runCompendiumAudition(', 'function showToast(');
  const fillPlanetside = section(main, 'function fillPlanetside(', 'function showPlanetsideEcologyUnavailable(');
  const handler = section(
    main,
    "sideEl.addEventListener('click', (event) => {",
    'type CompendiumFixtureResult',
  );
  const visual = section(
    main,
    'function currentPlanetsideEcologyVisualReceipt()',
    'function planetsideEcologyCounterpartIsCurrent(',
  );
  const counterpart = section(
    main,
    'function planetsideEcologyCounterpartIsCurrent(',
    'function clearPlanetside()',
  );
  const adapter = section(
    ecology,
    'function playbackFor(',
    'export function isCurrentWorldDistantEcologyPlaybackV1(',
  );
  const approachMain = section(
    main,
    'interface ApproachEcologyPresentation {',
    'function surveyOwnsCurrentCaptureSurface()',
  );
  const surveyCard = section(main, 'function showSurvey(', 'function hideSurvey(');
  const planetSurvey = section(main, 'function presentPlanetSurvey(', 'function surveyPlanet(');
  const approachClick = section(approach, 'readonly #onClick', '  #render():');
  const approachRender = section(approach, '  #render():', '  #canInteract():');

  if (!main.includes("from './compendium-audition.js'")
    || !detail.includes('projectCurrentCompendiumAudition(row, generation)')
    || !detail.includes('data-arc7-audition-body')
    || !detail.includes('compendiumAuditionController.attach(')) {
    errors.push('compendium-detail-audition-disconnected');
  }
  if (list.includes('runCompendiumAudition(')
    || list.includes('playClaimedCompendiumAudition(')
    || rows.includes('runCompendiumAudition(')
    || rows.includes('playClaimedCompendiumAudition(')) {
    errors.push('compendium-list-autoplay-path');
  }
  const arm = controller.indexOf('tameGreetingAudioOwner?.armNativeCompendiumAuditionGesture();');
  const action = controller.indexOf('void runCompendiumAudition(request, counterpart);');
  if (arm < 0 || action < 0 || arm > action) errors.push('compendium-native-arm-order');
  if (!dispatch.includes('owner.claimCompendiumAudition(request, arc5OwnershipState)')
    || !dispatch.includes('compendiumAuditionController.counterpartIsCurrent(counterpart)')
    || !dispatch.includes('owner.playClaimedCompendiumAudition(claim, counterpart)')) {
    errors.push('compendium-current-identity-or-counterpart-bypass');
  }
  if (!main.includes("releaseCompendiumAudition('detail-closed')")
    || !main.includes("releaseCompendiumAudition('detail-replaced')")
    || !main.includes('compendiumAuditionController.dispose();')) {
    errors.push('compendium-audition-lifecycle-missing');
  }

  const trusted = handler.indexOf('|| !event.isTrusted) return;');
  const visible = handler.indexOf('const visual = currentPlanetsideEcologyVisualReceipt();');
  const plan = handler.indexOf('createCurrentWorldDistantEcologyPlaybackV1(roster, visual)');
  if (trusted < 0 || visible < trusted || plan < visible) errors.push('untrusted-ecology-gesture');
  if (fillPlanetside.includes('createCurrentWorldDistantEcologyPlaybackV1(')
    || fillPlanetside.includes('playClaimedDistantEcology(')) {
    errors.push('ecology-autoplay-path');
  }
  if (!visual.includes("heading?.textContent !== 'PLANETSIDE — Biosphere'")
    || !visual.includes("getComputedStyle(sideEl).display === 'none'")
    || !visual.includes("granularity: 'biosphere'")
    || !visual.includes('visible: true')) {
    errors.push('ecology-visible-counterpart-bypass');
  }
  if (!counterpart.includes("registered.playback.plan.granularity === 'biosphere'")
    || !counterpart.includes('registered.playback.plan.kingdom === null')
    || !counterpart.includes('registered.playback.plan.familyKey === null')
    || !counterpart.includes('registered.playback.plan.identityKey === null')) {
    errors.push('ecology-hidden-detail-admitted');
  }
  const adapterVisible = adapter.indexOf('visual.visible !== true');
  const adapterPlan = adapter.indexOf(
    'createCurrentWorldDistantEcologyHintPlanForSource(roster, source)',
  );
  if (adapterVisible < 0 || adapterPlan < adapterVisible) {
    errors.push('ecology-plan-before-visual-proof');
  }
  if (!main.includes("releasePlanetsideEcology('planetside-cleared')")
    || !main.includes("releasePlanetsideEcology('planetside-hidden')")) {
    errors.push('ecology-lifecycle-missing');
  }
  if (/\bsave\.|\bgameEvent\(|\bcommit[A-Z]|SessionRNG/u.test(handler)) {
    errors.push('ecology-gameplay-writer-or-rng');
  }
  if (!main.includes("from './approach-ecology-audio.js'")
    || !surveyCard.includes('data-approach-ecology-body')
    || !surveyCard.includes('approachEcologyController.attach(approachEcologyMount)')
    || !surveyCard.includes('approachEcologyController.refresh()')
    || !planetSurvey.includes("if (nav.mode === 'system')")
    || !planetSurvey.includes('projectApproachEcologyAudioV1({')) {
    errors.push('approach-ecology-disconnected');
  }
  if (surveyCard.indexOf("card.style.display = 'block';") < 0
    || surveyCard.indexOf('approachEcologyController.attach(approachEcologyMount)')
      < surveyCard.indexOf("card.style.display = 'block';")) {
    errors.push('approach-mounted-before-visible');
  }
  if (!approachMain.includes("surface.surface === 'approach'")
    || !approachMain.includes("nav.mode === 'system'")
    || !approachMain.includes('surface.environmentFingerprint === roster.environmentFingerprint')
    || !approachMain.includes('surface.ecologyEpoch === roster.ecologyEpoch')
    || !approachMain.includes('approachEcologyController.counterpartIsCurrent(counterpart)')
    || !main.includes('|| approachEcologyController.counterpartIsCurrent(receipt)')) {
    errors.push('approach-current-counterpart-bypass');
  }
  const approachVisible = approachClick.indexOf('this.#leadIsCurrent(button)');
  const approachPlan = approachClick.indexOf(
    'createCurrentWorldApproachDistantEcologyPlaybackV1(roster, visual)',
  );
  const approachPaint = approachClick.indexOf('this.#render();');
  const approachCounterpart = approachClick.indexOf('this.counterpartIsCurrent(counterpart)');
  if (approachVisible < 0 || approachPlan < approachVisible
    || approachPaint < approachPlan || approachCounterpart < approachPaint) {
    errors.push('approach-plan-or-counterpart-order');
  }
  if (approachRender.includes('createCurrentWorldApproachDistantEcologyPlaybackV1(')
    || approachRender.includes('onListen?.(')) {
    errors.push('approach-autoplay-path');
  }
  if (!approachMain.includes('tameGreetingAudioOwner?.armNativeDistantEcologyGesture();')
    || !approachMain.includes('void runApproachEcologyListen(playback, counterpart);')) {
    errors.push('approach-native-owner-disconnected');
  }
  if (!main.includes("releaseApproachEcology('survey-hidden')")
    || !main.includes('approachEcologyController.dispose();')) {
    errors.push('approach-lifecycle-missing');
  }
  if (/\bsave\.|\bgameEvent\(|\bcommit[A-Z]|SessionRNG|Math\.random|Date\.now/u.test(
    approachClick,
  )) {
    errors.push('approach-gameplay-writer-or-rng');
  }
  return errors;
}

describe('Arc 7 noncombat audio Main wiring', () => {
  it('mounts explicit detail audition and visible-biosphere ecology without autoplay or writers', () => {
    expect(audit(MAIN, ECOLOGY, APPROACH)).toEqual([]);
    expect(MAIN.match(/createCurrentWorldDistantEcologyPlaybackV1\(roster, visual\)/gu))
      .toHaveLength(1);
  });

  it('negative-controls missing required joins and newly introduced autoplay paths', () => {
    const disconnectedDetail = replaceOnce(
      MAIN,
      '    compendiumAuditionController.attach(\n',
      '    void compendiumAuditionController; // disconnected negative control\n',
    );
    expect(audit(disconnectedDetail, ECOLOGY, APPROACH)).toContain(
      'compendium-detail-audition-disconnected',
    );

    const listAutoplay = replaceOnce(
      MAIN,
      '  const previousList = codexList;\n',
      '  const previousList = codexList;\n  void runCompendiumAudition({} as never, {} as never);\n',
    );
    expect(audit(listAutoplay, ECOLOGY, APPROACH)).toContain('compendium-list-autoplay-path');

    const untrusted = replaceOnce(MAIN, '    || !event.isTrusted) return;\n', '    ) return;\n');
    expect(audit(untrusted, ECOLOGY, APPROACH)).toContain('untrusted-ecology-gesture');

    const renderAutoplay = replaceOnce(
      MAIN,
      '  /* THE LIVING PLANETSIDE:',
      '  void createCurrentWorldDistantEcologyPlaybackV1({} as never, {} as never);\n  /* THE LIVING PLANETSIDE:',
    );
    expect(audit(renderAutoplay, ECOLOGY, APPROACH)).toContain('ecology-autoplay-path');

    const approachAutoplay = replaceOnce(
      APPROACH,
      '  #render(): void {\n',
      '  #render(): void {\n    void createCurrentWorldApproachDistantEcologyPlaybackV1({} as never, {} as never);\n',
    );
    expect(audit(MAIN, ECOLOGY, approachAutoplay)).toContain('approach-autoplay-path');

    const approachMountedHidden = replaceOnce(
      MAIN,
      "  } else approachEcologyController.setState(null);\n  card.style.display = 'block';\n",
      '  } else approachEcologyController.setState(null);\n'
        + '  approachEcologyController.attach(approachEcologyMount);\n'
        + "  card.style.display = 'block';\n",
    );
    expect(audit(approachMountedHidden, ECOLOGY, APPROACH))
      .toContain('approach-mounted-before-visible');
  });

  it('negative-controls both sides of visible granularity and presentation-only authority', () => {
    const hiddenDetail = replaceOnce(
      MAIN,
      '    && registered.playback.plan.identityKey === null\n',
      '    && true\n',
    );
    expect(audit(hiddenDetail, ECOLOGY, APPROACH)).toContain('ecology-hidden-detail-admitted');

    const noVisualGate = replaceOnce(
      ECOLOGY,
      "  source: 'approach-lead' | 'survey-roster',\n): CurrentWorldDistantEcologyPlaybackV1 {\n  if (!isCanonicalWorldRoster(roster)) {",
      "  source: 'approach-lead' | 'survey-roster',\n): CurrentWorldDistantEcologyPlaybackV1 {\n  const planBeforeVisual = createCurrentWorldDistantEcologyHintPlanForSource(roster, source);\n  void planBeforeVisual;\n  if (!isCanonicalWorldRoster(roster)) {",
    );
    expect(audit(MAIN, noVisualGate, APPROACH)).toContain('ecology-plan-before-visual-proof');

    const writer = replaceOnce(
      MAIN,
      '    || !event.isTrusted) return;\n  const visual = currentPlanetsideEcologyVisualReceipt();\n',
      '    || !event.isTrusted) return;\n  save.stats.scans = 1;\n  const visual = currentPlanetsideEcologyVisualReceipt();\n',
    );
    expect(audit(writer, ECOLOGY, APPROACH)).toContain('ecology-gameplay-writer-or-rng');

    const approachWriter = replaceOnce(
      APPROACH,
      '    if (!button || !this.#leadIsCurrent(button)) return;\n',
      '    if (!button || !this.#leadIsCurrent(button)) return;\n    gameEvent("survey");\n',
    );
    expect(audit(MAIN, ECOLOGY, approachWriter))
      .toContain('approach-gameplay-writer-or-rng');
  });
});
