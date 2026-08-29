import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  battleStats,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type BattleStats,
  type CombatSettlementChampionV1,
  type CombatSettlementOutcomeV1,
  type CombatSettlementPlanV1,
  type DuelResult,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import {
  combatCuePlan,
  projectCombatCueParticipantsV1,
  type CombatCuePlanV1,
} from '@cf/audio';
import {
  COMBAT_CHRONICLE_ROW_DELAY_MS,
  COMBAT_CHRONICLE_START_DELAY_MS,
  CombatChronicleController,
  isCombatChronicleV1,
  projectCombatChronicleV1,
  type CombatChronicleCueEmissionV1,
  type CombatChronicleStopReasonV1,
} from '../apps/game/src/combat-chronicle.js';

vi.mock('@cf/domain-sessionrng', () => {
  throw new Error('Combat Chronicle imported gameplay SessionRNG');
});

interface TestWindow extends Window {
  readonly Event: typeof Event;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: { pretendToBeVisual?: boolean }) => TestDom;
};
const indexSource = readFileSync(fileURLToPath(
  new URL('../apps/game/index.html', import.meta.url),
), 'utf8');
const chronicleSource = readFileSync(fileURLToPath(
  new URL('../apps/game/src/combat-chronicle.ts', import.meta.url),
), 'utf8');

beforeAll(() => installCaptureHooks());

let dom: TestDom | null = null;
let controller: CombatChronicleController | null = null;

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
  vi.useRealTimers();
});

function target(kind: 'ordinary' | 'guardian' | 'titan' = 'ordinary'): GuardianPrimeEncounterV1 {
  const world = resolveCF1WorldAddress(kind === 'ordinary' ? {
    galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
    star: { seed: 4077594722, x: -271.54, y: -67.36 },
    planet: { seed: 488332735 },
  } : kind === 'guardian' ? {
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 },
    planet: { seed: 2456455053 },
  } : {
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 },
    planet: { seed: 2481585519 },
  });
  if (!world.ok) throw new Error(world.reason);
  const projected = projectGuardianPrimeEncounterV1({
    world: world.address,
    descriptor: { worldType: kind === 'titan' ? 'lava' : 'airless' },
    regionIndex: 0,
    faunaRoster: kind === 'titan' ? [] : [{
      speciesId: 'chronicle-defender',
      genome: makeGenome(kind === 'ordinary' ? 999 : 1, 'fauna', 0.5),
    }],
    claimedSignatureIds: [],
    conquered: false,
  });
  if (projected === null) throw new Error('Chronicle fixture encounter missing');
  return projected;
}

function owned(seed = 3, name = `Chronicle Champion ${seed}`): CombatSettlementChampionV1 {
  const genome = makeGenome(seed, 'fauna', 0.5);
  return {
    kind: 'owned-fauna', creatureId: `chronicle-${seed}`, name, genome,
    legacyBredLineage: true,
  };
}

function duel(champion: CombatSettlementChampionV1, encounter: GuardianPrimeEncounterV1): DuelResult {
  const mine = champion.kind === 'player'
    ? { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats }
    : { name: champion.name, genome: champion.genome as Genome };
  return runDuel(mine, {
    name: encounter.defender.name,
    genome: encounter.defender.battleGenome as Genome,
  });
}

function outcome(result: DuelResult): CombatSettlementOutcomeV1 {
  return result.winner === 'A' ? 'champion-win'
    : result.winner === 'B' ? 'defender-win' : 'draw';
}

function plans(options: Readonly<{
  champion?: CombatSettlementChampionV1;
  battleId?: string;
  encounter?: GuardianPrimeEncounterV1;
}> = {}): Readonly<{
  settlement: CombatSettlementPlanV1;
  cues: CombatCuePlanV1;
}> {
  const encounter = options.encounter ?? target();
  const champion = options.champion ?? owned();
  const transcript = duel(champion, encounter);
  const settlement = planCombatSettlementV1({
    battleId: options.battleId ?? 'chronicle-fixture',
    receiptOrdinal: 47,
    encounter,
    champion,
    transcript,
    outcome: outcome(transcript),
    worldTier: 5,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: [],
      lossXp: champion.kind === 'player' ? null : { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (settlement.status !== 'planned') throw new Error(`Chronicle settlement refused: ${settlement.reason}`);
  const participants = projectCombatCueParticipantsV1(settlement);
  return Object.freeze({ settlement, cues: combatCuePlan(settlement, participants) });
}

function shell(): Readonly<{ root: HTMLElement; mount: HTMLElement }> {
  dom = new JSDOM(
    '<!doctype html><body><aside id="panel"><section id="body"></section></aside></body>',
    { pretendToBeVisual: true },
  );
  const document = dom.window.document;
  return Object.freeze({
    root: document.getElementById('panel') as HTMLElement,
    mount: document.getElementById('body') as HTMLElement,
  });
}

function startController(options: Readonly<{
  onCue?: (emission: CombatChronicleCueEmissionV1) => void;
  onShare?: (shareText: string) => void;
  onStopVoices?: (reason: CombatChronicleStopReasonV1, generation: number) => void;
}> = {}) {
  const view = shell();
  const pair = plans();
  const chronicle = projectCombatChronicleV1(pair.settlement, pair.cues);
  controller = new CombatChronicleController({ root: view.root, ...options });
  controller.attach(view.mount);
  const generation = controller.start(chronicle, pair.cues);
  return { ...view, ...pair, chronicle, generation };
}

function hpContract(
  mount: HTMLElement,
  side: 'A' | 'B',
  name: string,
  maximum: number,
  current: number,
): boolean {
  const owner = mount.querySelector<HTMLElement>(`[data-combat-hp-side="${side}"]`);
  const label = owner?.querySelector<HTMLElement>(`[data-combat-hp-name="${side}"]`);
  const progress = owner?.querySelector<HTMLProgressElement>(`progress[data-combat-hp-progress="${side}"]`);
  const output = owner?.querySelector<HTMLOutputElement>(`output[data-combat-hp-current="${side}"]`);
  return owner !== null && owner !== undefined
    && label?.textContent === name
    && progress instanceof (mount.ownerDocument.defaultView!.HTMLProgressElement)
    && progress.max === maximum
    && progress.value === current
    && progress.getAttribute('aria-label') === `${name} HP`
    && progress.getAttribute('aria-valuemin') === '0'
    && progress.getAttribute('aria-valuemax') === String(maximum)
    && progress.getAttribute('aria-valuenow') === String(current)
    && progress.getAttribute('aria-valuetext') === `${current} of ${maximum} HP for ${name}`
    && output?.textContent === `${current} / ${maximum}`;
}

function staticChroniclePanelContract(source: string): boolean {
  const parsed = new JSDOM(source);
  try {
    const panels = parsed.window.document.querySelectorAll<HTMLElement>('#combatpanel');
    if (panels.length !== 1) return false;
    const panel = panels[0]!;
    const headings = [...panel.children].filter((child) => child.tagName === 'H3');
    const mounts = [...panel.children].filter((child) => child.hasAttribute('data-combat-chronicle-body'));
    return panel.tagName === 'ASIDE'
      && panel.getAttribute('aria-label') === 'Combat Chronicle'
      && headings.length === 1
      && headings[0]?.textContent === 'Combat Chronicle'
      && mounts.length === 1;
  } finally {
    parsed.window.close();
  }
}

function nativeHpSourceContract(source: string): boolean {
  return source.includes("const progress = this.#document.createElement('progress');")
    && source.includes('progress.dataset.combatHpProgress = side;')
    && source.match(/progress\.max = maximum;/gu)?.length === 2
    && source.includes('progress.value = maximum;')
    && source.includes("progress.setAttribute('aria-valuemax', String(maximum));")
    && source.includes("progress.setAttribute('aria-valuenow', String(maximum));")
    && source.includes('owner.append(label, progress, value);')
    && source.includes('progress.value = current;')
    && source.includes("progress.setAttribute('aria-valuenow', String(current));")
    && source.includes('value.textContent = `${current} / ${maximum}`;');
}

function cssBlocksAfter(source: string, header: string): readonly string[] {
  const blocks: string[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    const headerAt = source.indexOf(header, cursor);
    if (headerAt < 0) break;
    const openingBrace = headerAt + header.length - 1;
    let depth = 1;
    let blockEnd = openingBrace + 1;
    while (blockEnd < source.length && depth > 0) {
      if (source[blockEnd] === '{') depth += 1;
      if (source[blockEnd] === '}') depth -= 1;
      blockEnd += 1;
    }
    if (depth !== 0) return Object.freeze([]);
    blocks.push(source.slice(openingBrace + 1, blockEnd - 1));
    cursor = blockEnd;
  }
  return Object.freeze(blocks);
}

function cssDeclarationsOwn(
  declarationSource: string,
  required: Readonly<Record<string, string>>,
): boolean {
  const declarations = new Map<string, string>();
  for (const part of declarationSource.split(';')) {
    const colon = part.indexOf(':');
    if (colon < 0) continue;
    declarations.set(
      part.slice(0, colon).trim(),
      part.slice(colon + 1).replace(/\s+/gu, ' ').trim(),
    );
  }
  return Object.entries(required).every(([property, value]) => declarations.get(property) === value);
}

function cssRuleOwnsDirectSelector(
  source: string,
  requiredSelector: string,
  requiredDeclarations: Readonly<Record<string, string>>,
): boolean {
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const selectors = match[1]!.split(',').map((selector) => selector.trim());
    if (selectors.includes(requiredSelector) && cssDeclarationsOwn(match[2]!, requiredDeclarations)) {
      return true;
    }
  }
  return false;
}

function mobilePanelLayerOwnsChronicle(source: string): boolean {
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const selector = match[1]!.replace(/\s+/gu, ' ').trim();
    const panelList = /^body:not\(\.training\) :is\(([^)]*)\)$/u.exec(selector);
    if (panelList === null) continue;
    const members = panelList[1]!.split(',').map((member) => member.trim());
    if (members.includes('#combatpanel') && cssDeclarationsOwn(match[2]!, { 'z-index': '24' })) {
      return true;
    }
  }
  return false;
}

function chroniclePanelCssContract(source: string): boolean {
  const compact = source.replace(/\s+/gu, ' ');
  const mobileBlocks = cssBlocksAfter(compact, '@media (max-width: 900px) {');
  const desktopBlocks = cssBlocksAfter(compact, '@media (min-width: 901px) {');
  return compact.includes('#combatpanel { width: min(520px, calc(100vw - var(--safe-left) - var(--safe-right) - 16px)); }')
    && compact.includes('.panel { position: fixed; top: calc(var(--topbar-h) + 6px); left: calc(var(--safe-left) + 8px); bottom: auto;')
    && compact.includes('width: min(360px, calc(100vw - var(--safe-left) - var(--safe-right) - 16px)); overflow: auto; z-index: 22;')
    && compact.includes('#combatpanel [data-combat-chronicle-log] { display: grid; gap: 5px; max-height: min(44dvh, 430px); overflow: auto; overscroll-behavior: contain;')
    && compact.includes('#combatpanel :is([data-combat-chronicle-skip],[data-combat-chronicle-share]) { width: 100%; min-height: 44px; box-sizing: border-box;')
    && mobileBlocks.some((block) => mobilePanelLayerOwnsChronicle(block))
    && desktopBlocks.some((block) => cssRuleOwnsDirectSelector(block, '#combatpanel', {
      top: 'auto',
      left: 'auto',
      right: 'calc(var(--safe-right) + 12px)',
      bottom: 'calc(var(--safe-bottom) + var(--dock-h) + 24px)',
      'max-height': 'calc(100dvh - var(--safe-top) - var(--safe-bottom) - var(--dock-h) - 48px)',
    }));
}

function skipPlaybackCancellationContract(source: string): boolean {
  const start = source.indexOf('if (skip && this.#mount.contains(skip) && !skip.disabled) {');
  const end = source.indexOf('\n    const share =', start);
  if (start < 0 || end < 0) return false;
  const branch = source.slice(start, end);
  const clear = branch.indexOf('this.#clearTimer();');
  const stop = branch.indexOf("this.#onStopVoices?.('skip', this.#generation);");
  const remove = branch.indexOf('skip.remove();');
  const render = branch.indexOf('this.#renderRemainderSynchronously();');
  return clear >= 0 && stop > clear && remove > stop && render > remove
    && branch.match(/#onStopVoices\?\.\('skip', this\.#generation\)/gu)?.length === 1;
}

describe('Arc 8 Combat Chronicle projection', () => {
  it('pins one static Chronicle panel and its bounded mobile/desktop native-control contract', () => {
    expect(staticChroniclePanelContract(indexSource)).toBe(true);
    const panelBlock = '  <aside id="combatpanel" class="glass panel" aria-label="Combat Chronicle">\n'
      + '    <h3>Combat Chronicle</h3>\n'
      + '    <div data-combat-chronicle-body></div>\n'
      + '  </aside>';
    expect(indexSource).toContain(panelBlock);
    expect(staticChroniclePanelContract(indexSource.replace(panelBlock, `${panelBlock}\n${panelBlock}`)))
      .toBe(false);
    expect(staticChroniclePanelContract(indexSource.replace('<h3>Combat Chronicle</h3>', '')))
      .toBe(false);
    expect(staticChroniclePanelContract(indexSource.replace(
      '<div data-combat-chronicle-body></div>',
      '<div data-combat-chronicle-body></div><div data-combat-chronicle-body></div>',
    ))).toBe(false);

    expect(nativeHpSourceContract(chronicleSource)).toBe(true);
    expect(nativeHpSourceContract(chronicleSource.replace(
      "const progress = this.#document.createElement('progress');",
      "const progress = this.#document.createElement('div');",
    ))).toBe(false);
    expect(nativeHpSourceContract(chronicleSource.replace('progress.max = maximum;', ''))).toBe(false);
    expect(nativeHpSourceContract(chronicleSource.replace(
      "progress.setAttribute('aria-valuenow', String(current));", '',
    ))).toBe(false);

    expect(chroniclePanelCssContract(indexSource)).toBe(true);
    expect(chroniclePanelCssContract(indexSource.replace(
      '#combatpanel :is([data-combat-chronicle-skip],[data-combat-chronicle-share]) {\n      width: 100%; min-height: 44px;',
      '#combatpanel :is([data-combat-chronicle-skip],[data-combat-chronicle-share]) {\n      width: 100%; min-height: 20px;',
    ))).toBe(false);
    expect(chroniclePanelCssContract(indexSource.replace(
      'max-height: min(44dvh, 430px); overflow: auto;',
      'max-height: none; overflow: visible;',
    ))).toBe(false);
    const withoutMobileChronicleLayer = indexSource.replace(
      ',#inventorypanel,#combatpanel) { z-index: 24;',
      ',#inventorypanel) { z-index: 24;',
    );
    expect(withoutMobileChronicleLayer).not.toBe(indexSource);
    expect(chroniclePanelCssContract(withoutMobileChronicleLayer)).toBe(false);
    expect(chroniclePanelCssContract(indexSource.replace(
      'left: calc(var(--safe-left) + 8px);',
      'left: auto;',
    ))).toBe(false);
    const withoutDesktopChronicleDock = indexSource.replace(
      '#setpanel, #recpanel, #shipyardpanel, #inventorypanel, #combatpanel {',
      '#setpanel, #recpanel, #shipyardpanel, #inventorypanel {',
    );
    expect(withoutDesktopChronicleDock).not.toBe(indexSource);
    expect(chroniclePanelCssContract(withoutDesktopChronicleDock)).toBe(false);

    const withUnrelatedPanel = indexSource
      .replace(',#inventorypanel,#combatpanel) {', ',#inventorypanel,#unrelatedpanel,#combatpanel) {')
      .replace(', #inventorypanel, #combatpanel {', ', #inventorypanel, #unrelatedpanel, #combatpanel {');
    expect(withUnrelatedPanel).not.toBe(indexSource);
    expect(chroniclePanelCssContract(withUnrelatedPanel)).toBe(true);
  });

  it('is deterministic, immutable, narrator-seeded by the exact matchup, and presentation-only', () => {
    const pair = plans();
    const settlementBefore = JSON.stringify(pair.settlement);
    const first = projectCombatChronicleV1(pair.settlement, pair.cues);
    const second = projectCombatChronicleV1(pair.settlement, pair.cues);
    expect(second).toEqual(first);
    expect(isCombatChronicleV1(first)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.steps)).toBe(true);
    expect(Object.isFrozen(first.steps[0]?.rows)).toBe(true);
    expect(first.initialRows.map((entry) => entry.displayText)).toEqual([
      `The conquest begins — ${pair.settlement.champion.name} faces ${pair.settlement.encounter.defender.name}…`,
      `${pair.settlement.transcript.turnA0 ? pair.settlement.champion.name : pair.settlement.encounter.defender.name} moves first`,
    ].map((value, index) => index === 0 ? value : expect.stringContaining(value)));
    expect(first.steps.flatMap((step) => step.rows).some((entry) => entry.kind === 'damage')).toBe(true);
    expect(JSON.stringify(pair.settlement)).toBe(settlementBefore);

    const source = readFileSync(fileURLToPath(
      new URL('../apps/game/src/combat-chronicle.ts', import.meta.url),
    ), 'utf8');
    expect(source).toContain('mulberry32(hashInt(championSeed >>> 0, defenderSeed >>> 0, 0xba7d) >>> 0)');
    expect(source).not.toMatch(/Math\.random|Date\.now|runDuel|localStorage|queueSave|awardXP|checkAch/u);
    expect(source).not.toContain('.innerHTML');
    expect(source).not.toContain('insertAdjacentHTML');
  });

  it('rejects structural clones and a registered cue plan from a different settlement', () => {
    const first = plans({ battleId: 'chronicle-authority-a' });
    const other = plans({ battleId: 'chronicle-authority-b' });
    expect(() => projectCombatChronicleV1({ ...first.settlement } as never, first.cues))
      .toThrow(/registered combat settlement/u);
    expect(() => projectCombatChronicleV1(first.settlement, { ...first.cues } as never))
      .toThrow(/registered combat cue/u);
    expect(() => projectCombatChronicleV1(first.settlement, other.cues))
      .toThrow(/does not match/u);

    const chronicle = projectCombatChronicleV1(first.settlement, first.cues);
    const view = shell();
    const authorityController = new CombatChronicleController({ root: view.root });
    controller = authorityController;
    authorityController.attach(view.mount);
    expect(() => authorityController.start({ ...chronicle } as never, first.cues))
      .toThrow(/projected Combat Chronicle/u);
    expect(() => authorityController.start(chronicle, { ...first.cues } as never))
      .toThrow(/registered matching/u);
  });

  it('preserves the exact mature share header, initiative twin, statistics ledger, and verdict', () => {
    const pair = plans();
    const chronicle = projectCombatChronicleV1(pair.settlement, pair.cues);
    const a = pair.settlement.transcript.A;
    const b = pair.settlement.transcript.B;
    const champion = pair.settlement.champion.name;
    const defender = pair.settlement.encounter.defender.name;
    expect(chronicle.shareText.startsWith(
      `⚔ BATTLE LOG — Celestial Frontier\n${champion}${a.cls ? ` (${a.cls} Lv${a.lvl})` : ''} vs ${defender}${b.cls ? ` (${b.cls} Lv${b.lvl})` : ''}\nPower ${a.total} vs ${b.total}\n\nThe duel begins.\nInitiative: ${pair.settlement.transcript.turnA0 ? champion : defender} moves first.\n`,
    )).toBe(true);
    expect(chronicle.statisticsRows).toHaveLength(2);
    expect(chronicle.shareText).toContain(`\n-- ${champion}: `);
    expect(chronicle.shareText).toContain(`\n-- ${defender}: `);
    expect(chronicle.shareText.endsWith(
      pair.settlement.transcript.winner === null
        ? 'A draw — both champions stand.'
        : `Winner: ${pair.settlement.transcript.winner === 'A' ? champion : defender}`,
    )).toBe(true);
    const damageRows = chronicle.steps.flatMap((step) => step.rows)
      .filter((entry) => entry.kind === 'damage');
    expect(damageRows).toHaveLength(pair.cues.cues.filter((cue) => cue.families.includes('damage')).length);
    expect(damageRows.every((entry) => entry.damageCue?.transcriptIndex === entry.transcriptIndex)).toBe(true);
  });

  it('derives exact visible conquest intro/verdict copy while the share twin stays generic', () => {
    const ordinaryWin = plans({ champion: owned(3), battleId: 'copy-win' });
    const winChronicle = projectCombatChronicleV1(ordinaryWin.settlement, ordinaryWin.cues);
    expect(ordinaryWin.settlement.transcript.winner).toBe('A');
    expect(winChronicle.initialRows[0]).toMatchObject({
      displayText: `The conquest begins — ${ordinaryWin.settlement.champion.name} faces ${ordinaryWin.settlement.encounter.defender.name}…`,
      shareText: 'The duel begins.',
    });
    expect(winChronicle.resultText).toBe(
      `🏴 World settled! ${ordinaryWin.settlement.champion.name} triumphs — bioscans here are safe and ☄ Stardust awaits.`,
    );
    expect(winChronicle.shareText).toContain('\n\nWinner: ');
    expect(winChronicle.shareText).not.toContain('World settled!');

    const guardian = plans({ encounter: target('guardian'), battleId: 'copy-guardian' });
    const guardianChronicle = projectCombatChronicleV1(guardian.settlement, guardian.cues);
    expect(guardian.settlement.encounter.defender.kind).toBe('guardian');
    expect(guardianChronicle.initialRows[0]!.displayText).toBe(
      `👑 ${guardian.settlement.encounter.defender.name} rises. The world itself holds its breath…`,
    );
    const titan = plans({ encounter: target('titan'), battleId: 'copy-titan' });
    expect(titan.settlement.encounter.defender.kind).toBe('titan');
    expect(projectCombatChronicleV1(titan.settlement, titan.cues).initialRows[0]!.displayText)
      .toBe(`👑 ${titan.settlement.encounter.defender.name} rises. The world itself holds its breath…`);

    const weakGenome = makeGenome(1, 'fauna', 0.5);
    const weakBase = battleStats(weakGenome);
    const player: CombatSettlementChampionV1 = {
      kind: 'player', explorerId: 'copy-player', name: 'Copy Player', genomeSeed: 0x50a1e5,
      stats: { ...weakBase, vit: 1, fer: 1, res: 1, agi: 1, ins: 1, total: 5 },
      currentHp: 20,
    };
    const playerLoss = plans({ champion: player, battleId: 'copy-player-loss' });
    expect(playerLoss.settlement.transcript.winner).not.toBe('A');
    expect(projectCombatChronicleV1(playerLoss.settlement, playerLoss.cues).resultText)
      .toBe('💀 You were overpowered. The world holds.');

    const bredLoss = plans({ champion: owned(2, 'Bred Copy'), battleId: 'copy-bred-loss' });
    expect(bredLoss.settlement.injury).toMatchObject({ status: 'set-hurt', reason: 'bred-crawl-home' });
    expect(projectCombatChronicleV1(bredLoss.settlement, bredLoss.cues).resultText)
      .toBe('🩸 Bred Copy was broken — it crawls home Critical. The world holds.');

    const wildGenome = makeGenome(2, 'fauna', 0.5);
    const wild: CombatSettlementChampionV1 = {
      kind: 'owned-fauna', creatureId: 'copy-wild', name: 'Wild Copy', genome: wildGenome,
      legacyBredLineage: false,
    };
    const permanentLoss = plans({ champion: wild, battleId: 'copy-permanent-loss' });
    expect(permanentLoss.settlement.injury.status).toBe('remove-creature');
    expect(projectCombatChronicleV1(permanentLoss.settlement, permanentLoss.cues).resultText)
      .toBe('💀 Wild Copy fell — lost forever. The world holds.');
  });
});

describe('Arc 8 Combat Chronicle detached controller', () => {
  it('owns native accessible HP progress from full health through timed rows and silent Skip', () => {
    vi.useFakeTimers();
    const view = startController();
    const aName = view.chronicle.championName;
    const bName = view.chronicle.defenderName;
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, view.chronicle.maxHpA)).toBe(true);
    expect(hpContract(view.mount, 'B', bName, view.chronicle.maxHpB, view.chronicle.maxHpB)).toBe(true);
    expect(view.mount.querySelectorAll('[data-combat-hp-side]')).toHaveLength(2);
    expect(view.mount.querySelectorAll('progress[data-combat-hp-progress]')).toHaveLength(2);
    expect([...view.mount.querySelectorAll('[data-combat-hp-side]')].every(
      (owner) => owner.querySelectorAll('progress[data-combat-hp-progress]').length === 1,
    )).toBe(true);

    vi.advanceTimersByTime(COMBAT_CHRONICLE_START_DELAY_MS);
    const first = view.chronicle.steps[0]!;
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, first.hpA)).toBe(true);
    expect(hpContract(view.mount, 'B', bName, view.chronicle.maxHpB, first.hpB)).toBe(true);

    view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-skip]')!.click();
    expect(hpContract(
      view.mount, 'A', aName, view.chronicle.maxHpA, view.settlement.transcript.hpA,
    )).toBe(true);
    expect(hpContract(
      view.mount, 'B', bName, view.chronicle.maxHpB, view.settlement.transcript.hpB,
    )).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    const progress = view.mount.querySelector<HTMLProgressElement>('progress[data-combat-hp-progress="A"]')!;
    const output = view.mount.querySelector<HTMLOutputElement>('output[data-combat-hp-current="A"]')!;
    const label = view.mount.querySelector<HTMLElement>('[data-combat-hp-name="A"]')!;
    const finalHp = view.settlement.transcript.hpA;
    progress.removeAttribute('aria-valuenow');
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, finalHp)).toBe(false);
    progress.setAttribute('aria-valuenow', String(finalHp));
    progress.max = view.chronicle.maxHpA + 1;
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, finalHp)).toBe(false);
    progress.max = view.chronicle.maxHpA;
    progress.value = Math.max(0, finalHp - 1);
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, finalHp)).toBe(false);
    progress.value = finalHp;
    output.textContent = 'stale';
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, finalHp)).toBe(false);
    output.textContent = `${finalHp} / ${view.chronicle.maxHpA}`;
    label.textContent = 'Wrong champion';
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, finalHp)).toBe(false);
    label.textContent = aName;
    expect(hpContract(view.mount, 'A', aName, view.chronicle.maxHpA, finalHp)).toBe(true);
  });

  it('uses the legacy 420/240 cadence, native 44px controls, and emits every canonical cue once', () => {
    vi.useFakeTimers();
    const onCue = vi.fn();
    const view = startController({ onCue });
    expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]')).toHaveLength(2);
    expect(view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-skip]')!.style.minHeight)
      .toBe('44px');
    vi.advanceTimersByTime(COMBAT_CHRONICLE_START_DELAY_MS - 1);
    expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]')).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]').length).toBeGreaterThan(2);
    const firstStepRows = view.chronicle.steps[0]!.rows.length;
    expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]')).toHaveLength(2 + firstStepRows);
    vi.advanceTimersByTime(COMBAT_CHRONICLE_ROW_DELAY_MS);
    expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]'))
      .toHaveLength(2 + firstStepRows + view.chronicle.steps[1]!.rows.length);
    vi.runAllTimers();
    expect(onCue).toHaveBeenCalledTimes(view.cues.cues.length);
    for (const [index, call] of onCue.mock.calls.entries()) {
      const emission = call[0] as CombatChronicleCueEmissionV1;
      expect(emission.plan).toBe(view.cues);
      expect(emission.cue).toBe(view.cues.cues[index]);
      expect(emission.counterpart).toEqual({
        counterpartKey: emission.cue.counterparts[0]!.captionToken,
        eventKey: emission.cue.cueId,
        generation: view.generation,
      });
    }
    expect(view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-share]')!.style.minHeight)
      .toBe('44px');
  });

  it('Skip renders every remaining row and the ledger synchronously with zero skipped audio', () => {
    vi.useFakeTimers();
    const onCue = vi.fn();
    let view!: ReturnType<typeof startController>;
    const onStopVoices = vi.fn((reason, generation) => {
      if (reason !== 'skip') return;
      expect(generation).toBe(view.generation);
      expect(view.mount.querySelector('[data-combat-chronicle-share]')).toBeNull();
      expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]'))
        .toHaveLength(view.chronicle.initialRows.length);
    });
    view = startController({ onCue, onStopVoices });
    view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-skip]')!.click();
    expect(onStopVoices).toHaveBeenCalledOnce();
    expect(onStopVoices).toHaveBeenCalledWith('skip', view.generation);
    expect(onCue).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(view.mount.querySelectorAll('[data-combat-chronicle-kind]')).toHaveLength(
      view.chronicle.initialRows.length
        + view.chronicle.steps.reduce((sum, step) => sum + step.rows.length, 0)
        + view.chronicle.statisticsRows.length,
    );
    expect(view.mount.querySelector('[data-combat-chronicle-skip]')).toBeNull();
    expect(view.mount.querySelector('[data-combat-chronicle-share]')).not.toBeNull();
    expect(skipPlaybackCancellationContract(chronicleSource)).toBe(true);
    expect(skipPlaybackCancellationContract(chronicleSource.replace(
      "this.#onStopVoices?.('skip', this.#generation);", '',
    ))).toBe(false);
    expect(skipPlaybackCancellationContract(chronicleSource.replace(
      "this.#onStopVoices?.('skip', this.#generation);\n      skip.remove();",
      "skip.remove();\n      this.#onStopVoices?.('skip', this.#generation);",
    ))).toBe(false);
  });

  it('keeps every cue counterpart bound to its exact visible connected caption generation', () => {
    vi.useFakeTimers();
    const emissions: CombatChronicleCueEmissionV1[] = [];
    const view = startController({
      onCue: (emission) => {
        emissions.push(emission);
        expect(controller!.counterpartIsCurrent(emission.counterpart)).toBe(true);
      },
    });
    vi.runAllTimers();
    expect(emissions.length).toBeGreaterThan(0);
    const receipt = emissions[0]!.counterpart;
    expect(controller!.counterpartIsCurrent(receipt)).toBe(true);
    expect(controller!.counterpartIsCurrent({ ...receipt, generation: receipt.generation + 1 })).toBe(false);
    expect(controller!.counterpartIsCurrent({ ...receipt, eventKey: `${receipt.eventKey}-other` })).toBe(false);
    expect(controller!.counterpartIsCurrent({ ...receipt, counterpartKey: `${receipt.counterpartKey}-other` })).toBe(false);
    const caption = view.mount.querySelector<HTMLElement>(
      `[data-combat-cue-id="${receipt.eventKey}"]`,
    )!;
    caption.hidden = true;
    expect(controller!.counterpartIsCurrent(receipt)).toBe(false);
    caption.hidden = false;
    expect(controller!.counterpartIsCurrent(receipt)).toBe(true);
    caption.remove();
    expect(controller!.counterpartIsCurrent(receipt)).toBe(false);
  });

  it('renders hostile source names as text, never markup, and shares the same literal text', () => {
    vi.useFakeTimers();
    const hostileName = '<img src=x onerror="globalThis.pwned=1"> & Rival';
    const hostileArt = '<svg onload="globalThis.pwned=2">';
    const genome = makeGenome(71, 'fauna', 0.5);
    const base = battleStats(genome);
    const stats: BattleStats = {
      ...base,
      name: hostileName,
      ab: { ...base.ab, n: hostileArt },
    };
    const champion: CombatSettlementChampionV1 = {
      kind: 'player', explorerId: 'hostile-text-fixture', name: hostileName,
      genomeSeed: 71, stats, currentHp: 100,
    };
    const pair = plans({ champion, battleId: 'hostile-text' });
    const chronicle = projectCombatChronicleV1(pair.settlement, pair.cues);
    const view = shell();
    controller = new CombatChronicleController({ root: view.root });
    controller.attach(view.mount);
    controller.start(chronicle, pair.cues);
    view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-skip]')!.click();
    expect(view.mount.querySelector('img')).toBeNull();
    expect(view.mount.querySelector('svg')).toBeNull();
    expect(view.mount.textContent).toContain(hostileName);
    expect(view.mount.textContent).toContain(hostileArt);
    expect(chronicle.shareText).toContain(hostileName);
    expect(chronicle.shareText).toContain(hostileArt);
  });

  it('Share invokes the native callback with the exact completed ledger and never before completion', () => {
    vi.useFakeTimers();
    const onShare = vi.fn();
    const view = startController({ onShare });
    expect(view.mount.querySelector('[data-combat-chronicle-share]')).toBeNull();
    view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-skip]')!.click();
    const share = view.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-share]')!;
    share.click();
    expect(onShare).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledWith(view.chronicle.shareText);
  });

  it.each(['close', 'detach', 'hidden', 'dispose'] as const)(
    '%s cancels pending playback, invalidates captions, and tells the voice owner once',
    (reason) => {
      vi.useFakeTimers();
      const onCue = vi.fn();
      const onStopVoices = vi.fn();
      const view = startController({ onCue, onStopVoices });
      const before = view.mount.textContent;
      if (reason === 'close') controller!.close();
      else if (reason === 'detach') controller!.detach();
      else if (reason === 'hidden') controller!.setHidden(true);
      else controller!.dispose();
      expect(onStopVoices).toHaveBeenCalledOnce();
      expect(onStopVoices).toHaveBeenCalledWith(reason, view.generation);
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(onCue).not.toHaveBeenCalled();
      expect(view.mount.textContent).not.toBe(before);
      expect(view.mount.childElementCount).toBe(0);
      controller = reason === 'dispose' ? null : controller;
    },
  );

  it('replacement stops the old generation and every old counterpart stays stale', () => {
    vi.useFakeTimers();
    const emissions: CombatChronicleCueEmissionV1[] = [];
    const onStopVoices = vi.fn();
    const view = startController({ onCue: (value) => emissions.push(value), onStopVoices });
    while (emissions.length === 0) vi.advanceTimersToNextTimer();
    const old = emissions[0]!.counterpart;
    const nextGeneration = controller!.start(view.chronicle, view.cues);
    expect(nextGeneration).toBe(view.generation + 1);
    expect(onStopVoices).toHaveBeenCalledWith('replace', view.generation);
    expect(controller!.counterpartIsCurrent(old)).toBe(false);
  });
});
