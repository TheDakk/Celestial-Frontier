/* A5 gap #11 — Settings identity UI OUTCOME test (browser-free).

   CLAUDE.md rule 7: assert the OUTCOME, not the code path. This file never
   calls the explorer-name or nameplate action directly. It executes the
   exact shipped Main sections that own the Settings controls
   (`fillSettings`, `runArc9ExplorerNameChange`, `runArc9NameplateChoice`),
   presses the rendered controls with JSDOM events, and then reads the
   COMMITTED durable save back through a real memory backend + `readSaveV5`
   (and the raw `player` segment row: `me` = explorerName, `nh` = nameHue).

   Stubbed externals only: the panel manager's `fillPanel` (DOM innerHTML),
   toast/chips/reload presentation hooks, and the idle write-authority flags.
   The F4 runtime, repository, backend, product-action coordinator and both
   action owners are the real modules.

   Negative controls mutate the executed Main source by unique exact-string
   replacement and prove the same scenario then FAILS with a named message. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import {
  ARC9_EXPLORER_NAME_MAX_CHARS_V1,
  ARC9_EXPLORER_NAME_OPERATION_V1,
  commitArc9ExplorerNameChangeV1,
  prepareArc9ExplorerNameChangeV1,
} from '../apps/game/src/arc9-explorer-name-action.js';
import {
  ARC9_NAMEPLATE_CHOICE_OPERATION_V1,
  commitArc9NameplateChoiceV1,
} from '../apps/game/src/arc9-nameplate-action.js';
import {
  assessArc9ExplorerNameDraftV1,
  projectArc9ExplorerNameSettingsV1,
  renderArc9ExplorerNameSettingV1,
} from '../apps/game/src/explorer-name-settings.js';
import {
  projectArc9NameplateSettingsV1,
  renderArc9NameplateSettingV1,
} from '../apps/game/src/nameplate-settings.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_090_000;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');

interface TestWindow extends Window {
  readonly Event: typeof Event;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

type Mutation = readonly [needle: string, replacement: string];

function exactMainSection(start: string, end: string): string {
  for (const marker of [start, end]) {
    const count = MAIN_SOURCE.split(marker).length - 1;
    if (count !== 1) throw new Error(`Main Settings section marker must be unique (${count}): ${marker}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Settings section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

/** The exact shipped Main Settings owner + both identity runners. */
function executedMainSource(mutations: readonly Mutation[]): string {
  let source = [
    exactMainSection('function fillSettings(): void {', '\n/* ---- GUIDE + RELEASE HISTORY'),
    exactMainSection(
      'async function runArc9ExplorerNameChange(rawName: string): Promise<void> {',
      '\nasync function runArc9FrontierEndingChoice(',
    ),
    exactMainSection(
      'async function runArc9NameplateChoice(requestedChoiceIndex: number): Promise<void> {',
      '\n/** A capture can queue this aggregate follow-up',
    ),
  ].join('\n');
  for (const [needle, replacement] of mutations) {
    const count = source.split(needle).length - 1;
    if (count !== 1) throw new Error(`negative-control needle must match exactly once (${count}): ${needle}`);
    source = source.replace(needle, () => replacement);
  }
  return source;
}

interface ExecutableMainSettings {
  readonly fillSettings: () => void;
}

function executableMainSettings(
  env: Record<string, unknown>,
  mutations: readonly Mutation[],
): ExecutableMainSettings {
  const transformed = transformSync('main-settings-identity.ts', executedMainSource(mutations));
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    fillSettings,
  }; }`)(env) as ExecutableMainSettings;
}

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`A5 Settings identity base save failed: ${imported.reason}`);
  imported.state.explorerName = 'Nova';
  imported.state.stats.bestRank = 3;
  imported.state.nameHue = -1;
  return imported.state;
}

async function fixture() {
  const state = baseState();
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA5000011).state(),
  );
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`A5 Settings fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions: f4.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'a5-settings-identity-tab',
    token: 'a5-settings-identity-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`A5 Settings lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, live: structuredClone(initial.canonicalState) };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

function harness(f: Fixture, mutations: readonly Mutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <aside id="setpanel" aria-label="Settings" style="display:block"></aside>
  </body></html>`);
  const document = dom.window.document;
  const toast = vi.fn();
  const updateChips = vi.fn();
  const scheduleReload = vi.fn();
  const queueProgressionRefresh = vi.fn();
  const env = {
    document,
    save: f.live,
    audioAccessibility: Object.freeze({ mono: false, reducedIntensity: false }),
    surveyFoldsOn: false, // D18: the folded survey card option (device preference; default off)
    pwaUpdateControl: null,
    /* panels.ts fillPanel minus the sticky close seat: a true DOM external. */
    fillPanel: (id: string, html: string) => {
      document.getElementById(`${id}panel`)!.innerHTML = html;
    },
    openPanelId: () => 'set',
    projectArc9ExplorerNameSettingsV1,
    renderArc9ExplorerNameSettingV1,
    assessArc9ExplorerNameDraftV1,
    projectArc9NameplateSettingsV1,
    renderArc9NameplateSettingV1,
    prepareArc9ExplorerNameChangeV1,
    commitArc9ExplorerNameChangeV1,
    commitArc9NameplateChoiceV1,
    ARC9_EXPLORER_NAME_OPERATION_V1,
    ARC9_NAMEPLATE_CHOICE_OPERATION_V1,
    arc9ExplorerNameEditing: false,
    arc9ExplorerNamePending: false,
    lastArc9ExplorerNameOutcome: null as string | null,
    arc9NameplateChoicePending: false,
    lastArc9NameplateOutcome: null as string | null,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (candidate: unknown) => candidate === f.runtime,
    activePersist: null as Promise<boolean> | null,
    importWriteInFlight: false,
    replacementTransaction: null as object | null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    ecologyEpochBlocksActions: () => false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 23 }),
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null as string | null,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    queueArc9ProgressionRefresh: queueProgressionRefresh,
    toast,
    updateChips,
  };
  const main = executableMainSettings(env, mutations);
  main.fillSettings();
  const panel = document.getElementById('setpanel')!;
  const q = <T extends Element>(selector: string): T | null => panel.querySelector<T>(selector);
  return {
    dom, document, env, main, panel, q, toast, updateChips, scheduleReload, queueProgressionRefresh,
    type(input: HTMLInputElement, value: string) {
      input.value = value;
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    },
    choose(select: HTMLSelectElement, value: string) {
      select.value = value;
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    },
  };
}
type Harness = ReturnType<typeof harness>;

async function settle(condition: () => boolean, turns = 400): Promise<void> {
  for (let turn = 0; turn < turns && !condition(); turn++) {
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
  }
}
const nameSettled = (h: Harness) => () => h.env.arc9ExplorerNamePending === false
  && h.env.lastArc9ExplorerNameOutcome !== null && h.env.lastArc9ExplorerNameOutcome !== 'pending';
const plateSettled = (h: Harness) => () => h.env.arc9NameplateChoicePending === false
  && h.env.lastArc9NameplateOutcome !== null && h.env.lastArc9NameplateOutcome !== 'pending';

/** The committed durable save, read back twice (a second read must agree). */
async function durable(f: Fixture) {
  const first = await readSaveV5(f.backend, REGISTRY, NOW);
  if (first.kind !== 'loaded') throw new Error(`durable save read was ${first.kind}`);
  const second = await readSaveV5(f.backend, REGISTRY, NOW);
  if (second.kind !== 'loaded') throw new Error(`durable save re-read was ${second.kind}`);
  expect(JSON.stringify(second.state), 'durable save re-read diverged from first read')
    .toBe(JSON.stringify(first.state));
  const playerRaw = await f.backend.get('player', 'v5:player');
  const player = JSON.parse(playerRaw ?? '{}') as { data?: Record<string, unknown> };
  return {
    state: first.state,
    me: player.data?.me,
    nh: player.data?.nh,
    revision: await f.repository.revision(),
    receipts: (await f.backend.keys('receipts')).length,
  };
}

async function openEditor(h: Harness) {
  const open = h.q<HTMLButtonElement>('[data-arc9-explorer-name-open]');
  expect(open, 'Settings must render the shipped Change name control').not.toBeNull();
  expect(open!.getAttribute('aria-expanded')).toBe('false');
  open!.click();
  expect(h.env.arc9ExplorerNameEditing, 'Change name press must open the editor').toBe(true);
  const editor = h.q<HTMLFormElement>('[data-arc9-explorer-name-editor]')!;
  expect(editor, 'Change name press must render the editor form').not.toBeNull();
  const input = editor.querySelector<HTMLInputElement>('[data-arc9-explorer-name-input]')!;
  const saveName = editor.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-save]')!;
  const help = editor.querySelector<HTMLElement>('[data-arc9-explorer-name-help]')!;
  expect(input.value).toBe(h.env.save.explorerName);
  expect(saveName.disabled, 'Save name starts disabled on the durable name').toBe(true);
  return { editor, input, saveName, help };
}

/** Case 1/3 scenario: type → press Save name → durable successor. */
async function renameScenario(
  mutations: readonly Mutation[],
  typed: string,
  expected: string,
): Promise<void> {
  const f = await fixture();
  const h = harness(f, mutations);
  try {
    const before = await durable(f);
    expect(before.me).toBe('Nova');
    const unlockedBefore = [...before.state.unlocked];
    expect(unlockedBefore).not.toContain('namer');

    const { input, saveName, help } = await openEditor(h);
    h.type(input, typed);
    expect(saveName.disabled, 'a changed, cleanable name must enable Save name').toBe(false);
    expect(help.textContent).toBe(`Ready to save “${expected}”.`);
    saveName.click();
    await settle(nameSettled(h));

    const after = await durable(f);
    expect(after.me, 'durable explorerName (player segment key `me`) after pressing Save name')
      .toBe(expected);
    expect(after.state.explorerName, 'readSaveV5 explorerName after pressing Save name')
      .toBe(expected);
    expect(after.revision, 'exactly one durable revision for one rename').toBe(before.revision + 1);
    expect(after.receipts, 'exactly one immutable rename receipt').toBe(before.receipts + 1);
    expect(after.state.unlocked, 'self-rename must not unlock the discovery `namer` achievement')
      .not.toContain('namer');
    expect(after.state.unlocked, 'self-rename changes no achievement').toEqual(unlockedBefore);
    expect({ ...after.state, explorerName: 'Nova' }, 'self-rename is identity-only')
      .toEqual(before.state);

    /* Live publication must equal the durable fixed point, never the raw draft. */
    expect(h.env.save.explorerName, 'live explorerName published after commit')
      .toBe(after.state.explorerName);
    expect(h.env.save.unlocked, 'live achievements after self-rename').not.toContain('namer');
    expect(h.env.lastArc9ExplorerNameOutcome).toBe(`committed:Nova->${expected}`);
    expect(h.env.lastPersistenceOutcome).toBe(`arc9-explorer-name-committed:${after.revision}`);
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.toast).toHaveBeenCalledWith(
      `Welcome, ${expected}`,
      'Your expedition record and future shares now carry this name.',
    );
    expect(h.env.arc9ExplorerNameEditing, 'editor closes after a durable rename').toBe(false);
    expect(h.q('[data-arc9-explorer-name-value]')?.textContent,
      'Settings summary after rename').toBe(expected);
    expect(h.env.productActionCoordinator.diagnostics()).toMatchObject({ busy: false });

    /* Survives a re-read: a fresh Settings render from the reloaded save. */
    h.env.save = structuredClone(after.state);
    h.main.fillSettings();
    expect(h.q('[data-arc9-explorer-name-value]')?.textContent,
      'Settings summary rendered from the reloaded durable save').toBe(expected);
  } finally {
    h.dom.window.close();
    await f.runtime.release();
  }
}

/** Case 2 scenario: whitespace-only and unchanged drafts write nothing. */
async function noWriteScenario(mutations: readonly Mutation[]): Promise<string[]> {
  const f = await fixture();
  const h = harness(f, mutations);
  const outcomes: string[] = [];
  try {
    const before = await durable(f);
    for (const [draft, helpText] of [
      ['   \t  ', 'Those characters cannot ride in a name. Try letters, numbers, or an emoji.'],
      [' <>&"\' ', 'Those characters cannot ride in a name. Try letters, numbers, or an emoji.'],
      ['  Nova  ', 'Enter a different name. Unsafe punctuation is removed; 24 characters maximum.'],
    ] as const) {
      if (!h.env.arc9ExplorerNameEditing) await openEditor(h);
      const editor = h.q<HTMLFormElement>('[data-arc9-explorer-name-editor]')!;
      const input = editor.querySelector<HTMLInputElement>('[data-arc9-explorer-name-input]')!;
      const saveName = editor.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-save]')!;
      h.type(input, draft);
      expect(saveName.disabled, `Save name must stay disabled for ${JSON.stringify(draft)}`).toBe(true);
      expect(editor.querySelector('[data-arc9-explorer-name-help]')?.textContent).toBe(helpText);
      saveName.click();  /* a disabled native button: no submission */
      /* Force the form's submit (Enter key / devtools) past the disabled button. */
      editor.dispatchEvent(new h.dom.window.Event('submit', { bubbles: true, cancelable: true }));
      await settle(nameSettled(h), 40);
      outcomes.push(String(h.env.lastArc9ExplorerNameOutcome));
      const after = await durable(f);
      expect(after.revision, `durable revision after submitting ${JSON.stringify(draft)}`)
        .toBe(before.revision);
      expect(after.receipts, `receipts after submitting ${JSON.stringify(draft)}`)
        .toBe(before.receipts);
      expect(after.me, `durable explorerName after submitting ${JSON.stringify(draft)}`).toBe('Nova');
      expect(JSON.stringify(after.state), 'no-op draft left the durable save byte-identical')
        .toBe(JSON.stringify(before.state));
      expect(h.env.save.explorerName, 'live explorerName after a no-op draft').toBe('Nova');
    }
    expect(h.scheduleReload).not.toHaveBeenCalled();
    return outcomes;
  } finally {
    h.dom.window.close();
    await f.runtime.release();
  }
}

/** Case 4 scenario: earned hue commits; locked hue is not offered and refuses. */
async function nameplateScenario(mutations: readonly Mutation[]): Promise<void> {
  const f = await fixture();
  const h = harness(f, mutations);
  try {
    const before = await durable(f);
    expect(before.nh).toBe(-1);
    const select = h.q<HTMLSelectElement>('[data-arc9-nameplate-choice]')!;
    expect(select, 'Settings must render the shipped nameplate selector').not.toBeNull();
    const offered = [...select.options].map((option) => option.value);
    expect(offered, 'only Auto and colors through the durable best rank (3) are offered')
      .toEqual(['-1', '0', '1', '2', '3']);
    expect(select.value).toBe('-1');

    h.choose(select, '2');
    expect(select.value, 'the native select restores the durable value until the receipt proves')
      .toBe('-1');
    expect(select.disabled).toBe(true);
    await settle(plateSettled(h));

    const committed = await durable(f);
    expect(committed.nh, 'durable nameHue (player segment key `nh`) after choosing hue 2').toBe(2);
    expect(committed.state.nameHue, 'readSaveV5 nameHue after choosing hue 2').toBe(2);
    expect(committed.revision, 'one durable revision for one nameplate choice')
      .toBe(before.revision + 1);
    expect({ ...committed.state, nameHue: -1 }, 'nameplate choice changes only nameHue')
      .toEqual(before.state);
    expect(h.env.save.nameHue, 'live nameHue published after commit').toBe(2);
    expect(h.env.lastArc9NameplateOutcome).toBe('committed:-1->2');
    expect(h.queueProgressionRefresh).toHaveBeenCalledWith(ARC9_NAMEPLATE_CHOICE_OPERATION_V1);
    const rerendered = h.q<HTMLSelectElement>('[data-arc9-nameplate-choice]')!;
    expect(rerendered.value, 'Settings selector after the durable choice').toBe('2');
    expect(rerendered.disabled).toBe(false);

    /* A locked (future-rank) value is never offered; forcing one refuses. */
    const forced = h.document.createElement('option');
    forced.value = '4';
    forced.textContent = 'Forced future rank';
    rerendered.append(forced);
    h.env.lastArc9NameplateOutcome = null;
    h.choose(rerendered, '4');
    await settle(plateSettled(h));
    expect(h.env.lastArc9NameplateOutcome, 'forced locked hue outcome')
      .toBe('refused:preflight:choice-locked');
    expect(h.toast).toHaveBeenLastCalledWith('Nameplate unavailable', 'That color has not been earned yet.');
    const refused = await durable(f);
    expect(refused.revision, 'a locked hue writes no revision').toBe(committed.revision);
    expect(refused.receipts, 'a locked hue writes no receipt').toBe(committed.receipts);
    expect(refused.nh, 'durable nameHue after a forced locked hue').toBe(2);
    expect(h.env.save.nameHue, 'live nameHue after a forced locked hue').toBe(2);
    expect([...h.q<HTMLSelectElement>('[data-arc9-nameplate-choice]')!.options]
      .map((option) => option.value), 'the refusal re-renders only earned choices')
      .toEqual(['-1', '0', '1', '2', '3']);

    /* Survives a re-read. */
    h.env.save = structuredClone(refused.state);
    h.main.fillSettings();
    expect(h.q<HTMLSelectElement>('[data-arc9-nameplate-choice]')!.value,
      'Settings selector rendered from the reloaded durable save').toBe('2');
    expect(h.scheduleReload).not.toHaveBeenCalled();
  } finally {
    h.dom.window.close();
    await f.runtime.release();
  }
}

const FORTY = 'Abcdefghij'.repeat(4);

describe('A5 #11 Settings identity — pressed controls, committed durable save', () => {
  it('(1) Change name → type → Save name commits the sanitized name as `me` and never unlocks namer', async () => {
    await renameScenario([], '  <Sol>&"\' Pathfinder  ', 'Sol Pathfinder');
  });

  it('(2) whitespace-only, cleaned-empty and unchanged drafts write nothing', async () => {
    const outcomes = await noWriteScenario([]);
    /* The Settings guard holds before the runner is ever reached. */
    expect(outcomes).toEqual(['null', 'null', 'null']);
  });

  it('(3) a 40-character name is capped at 24 by the shipped sanitizer', async () => {
    expect(FORTY).toHaveLength(40);
    expect(ARC9_EXPLORER_NAME_MAX_CHARS_V1).toBe(24);
    await renameScenario([], FORTY, FORTY.slice(0, 24));
  });

  it('(3b) the rendered input advertises the same 24-character cap', async () => {
    const f = await fixture();
    const h = harness(f);
    try {
      const { input } = await openEditor(h);
      expect(input.maxLength).toBe(24);
    } finally {
      h.dom.window.close();
      await f.runtime.release();
    }
  });

  it('(4) an earned nameplate hue commits; a locked hue is not offered and a forced value refuses', async () => {
    await nameplateScenario([]);
  });
});

describe('A5 #11 negative controls — mutated Main must turn the outcome test red', () => {
  it('rejects every mutation needle that is not a unique exact match', () => {
    expect(() => executedMainSource([['save.explorerName = rawName;', 'x']]))
      .toThrow(/must match exactly once \(0\)/u);
    expect(() => executedMainSource([['save.nameHue = ', 'x']]))
      .toThrow(/must match exactly once \([2-9]\)/u);
  });

  it('drop the rename commit (optimistic live-only rename) → durable `me` stays Nova → FAILS', async () => {
    await expect(renameScenario([[
      'void runArc9ExplorerNameChange(rawName);',
      'save.explorerName = rawName; arc9ExplorerNameEditing = false; lastArc9ExplorerNameOutcome = "optimistic";',
    ]], '  <Sol>&"\' Pathfinder  ', 'Sol Pathfinder'))
      .rejects.toThrow(/durable explorerName \(player segment key `me`\) after pressing Save name/u);
  });

  it('publish the raw draft instead of the sanitized fixed point → FAILS on live vs durable', async () => {
    await expect(renameScenario([[
      'save.explorerName = outcome.explorerName;',
      'save.explorerName = rawName;',
    ]], '  <Sol>&"\' Pathfinder  ', 'Sol Pathfinder'))
      .rejects.toThrow(/live explorerName published after commit/u);
  });

  it('publish the raw draft on a 40-character name (cap bypassed in live chrome) → FAILS', async () => {
    await expect(renameScenario([[
      'save.explorerName = outcome.explorerName;',
      'save.explorerName = rawName;',
    ]], FORTY, FORTY.slice(0, 24)))
      .rejects.toThrow(/live explorerName published after commit/u);
  });

  it('a no-op draft that reaches the store (guard dropped + draft altered) → FAILS on revision', async () => {
    await expect(noWriteScenario([
      ['if (!assessment.saveable) {', 'if (false) {'],
      ['const rawName = input.value;', 'const rawName = input.value + "Z";'],
    ])).rejects.toThrow(/durable revision after submitting/u);
  });

  it('dropping only the Settings guard still writes nothing (runner + owner preflight hold)', async () => {
    /* Opposite direction: an irrelevant mutation must NOT turn the test red.
       The runner's own no-op preflight answers instead of the Settings guard. */
    const outcomes = await noWriteScenario([['if (!assessment.saveable) {', 'if (false) {']]);
    expect(outcomes).toEqual(['noop:cleaned-empty', 'noop:cleaned-empty', 'noop:unchanged']);
  });

  it('off-by-one nameplate change handler → wrong durable hue → FAILS', async () => {
    await expect(nameplateScenario([[
      'const requestedChoiceIndex = Number(nameplateControl.value);',
      'const requestedChoiceIndex = Number(nameplateControl.value) + 1;',
    ]])).rejects.toThrow(/durable nameHue \(player segment key `nh`\) after choosing hue 2/u);
  });

  it('drop the nameplate commit (optimistic live-only hue) → durable `nh` stays Auto → FAILS', async () => {
    await expect(nameplateScenario([[
      'void runArc9NameplateChoice(requestedChoiceIndex);',
      'save.nameHue = requestedChoiceIndex; lastArc9NameplateOutcome = "optimistic";',
    ]])).rejects.toThrow(/durable nameHue \(player segment key `nh`\) after choosing hue 2/u);
  });
});
