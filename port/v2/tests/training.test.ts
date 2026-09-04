import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  TrainingDeps,
  TrainingEndIntent,
  TrainingEndResult,
} from '../apps/game/src/training.js';

interface TestWindow extends Window {
  close: () => void;
  HTMLElement: typeof HTMLElement;
  MouseEvent: typeof MouseEvent;
  KeyboardEvent: typeof KeyboardEvent;
}
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const GLOBAL_KEYS = [
  'window', 'document', 'HTMLElement', 'MouseEvent', 'getComputedStyle',
] as const;
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
let dom: TestDom;

function setGlobal(key: string, value: unknown): void {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}

function installDom(): void {
  for (const key of GLOBAL_KEYS) originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  dom = new JSDOM(`<!doctype html><html><body>
    <button id="prior">Prior focus</button>
    <div id="dock">
      <button id="dockatlas">Atlas dock</button>
      <button id="dockshipyard">Shipyard dock</button>
      <button id="dockcodex">Compendium dock</button>
      <button id="dockrecords">Records dock</button>
    </div>
    <div id="raillft"><button id="railcodex">Compendium rail</button></div>
    <div id="railrgt">
      <button id="railatlas">Atlas rail</button>
      <button id="railshipyard">Shipyard rail</button>
      <button id="railrecords">Records rail</button>
    </div>
    <div id="searchbox"><button>Search</button></div>
    <div id="setpanel"><button>Settings</button></div>
    <div id="guidepanel"><button>Guide</button></div>
    <div id="codexpanel">
      <button data-pnx="codex">Close Compendium</button>
      <button data-arc5-feed-confirm>Feed</button>
      <button data-arc5-breed-confirm>Breed</button>
      <button data-arc5-rename-confirm>Rename</button>
      <button data-arc5-scout-confirm>Field Scout</button>
    </div>
    <div id="recpanel"><button data-pnx="rec">Close Records</button><button>Records row</button></div>
    <div id="atlaspanel">
      <div class="centry atlas-entry" data-sel="atlas-entry" data-aid="p133">
        <b>Earth</b>
        <div class="atlas-entry-actions">
          <button type="button" data-atlas-travel="p133" aria-label="Travel to Earth">Travel</button>
          <button type="button" data-atlas-favorite="p133" aria-label="Favorite Earth">Favorite</button>
        </div>
      </div>
    </div>
    <div id="chpanel"><button>Charters</button></div>
    <div id="shipyardpanel">
      <button data-pnx="shipyard">Close Shipyard</button>
      <details><summary>Fabricator</summary><button class="engineering-action">Craft</button></details>
    </div>
    <div id="inventorypanel"><button>Inventory action</button></div>
    <div id="combatpanel"><button>Chronicle action</button></div>
    <div id="survey">
      <button data-sel="title">Earth</button>
      <button data-act="add">Chart</button>
      <button data-act="landcta">Land</button>
    </div>
    <div id="importsheet"><button>Import</button></div>
    <span id="primechip">Prime Codex · 0 / 9</span>
    <canvas tabindex="0"></canvas>
  </body></html>`, { url: 'https://example.test/' });
  setGlobal('window', dom.window);
  setGlobal('document', dom.window.document);
  setGlobal('HTMLElement', dom.window.HTMLElement);
  setGlobal('MouseEvent', dom.window.MouseEvent);
  setGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));
  Object.defineProperty(dom.window.HTMLElement.prototype, 'getClientRects', {
    configurable: true,
    value: () => [{ left: 0, top: 0, right: 100, bottom: 44, width: 100, height: 44 }],
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => {},
  });
}

function restoreDom(): void {
  dom.window.close();
  for (const key of GLOBAL_KEYS) {
    const original = originalGlobals.get(key);
    if (original) Object.defineProperty(globalThis, key, original);
    else Reflect.deleteProperty(globalThis, key);
  }
  originalGlobals.clear();
}

async function turn(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function boot(complete: TrainingDeps['complete']) {
  const training = await import('../apps/game/src/training.js');
  const prior = document.querySelector<HTMLButtonElement>('#prior')!;
  prior.focus();
  const closePanels = vi.fn();
  training.initTraining({
    explorerName: () => 'Ada',
    isDone: () => false,
    complete,
    closePanels,
  });
  await turn();
  return { training, prior, closePanels };
}

function driveToPlanetsideBriefing(training: typeof import('../apps/game/src/training.js')): void {
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('survey', { planetSeed: 133 });
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('atlas-add', { id: 'p133' });
  training.gameEvent('atlas-open', { open: true });
  training.gameEvent('landfall', { planetSeed: 133 });
  expect(training.trainingStepId()).toBe('planetside-briefing');
}

function driveToGraduation(training: typeof import('../apps/game/src/training.js')): void {
  driveToPlanetsideBriefing(training);
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('panel-open', { id: 'shipyard', open: true });
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('panel-open', { id: 'codex', open: true });
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('panel-open', { id: 'rec', open: true });
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  expect(training.trainingStepId()).toBe('grad');
}

function graduationCopyIsTruthful(html: string): boolean {
  const copy = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1').trim();
  return /short drill stays focused on real navigation/i.test(copy)
    && /board briefings are read-only/i.test(copy)
    && /survey card’s Share prepares a verified CF1 world code/i.test(copy)
    && /pasting a valid CF1 code into Search follows its source-proven route when your ship and Prime reach allow it/i.test(copy)
    && /use Tame, Scavenge, and Sample after Finish/i.test(copy)
    && /each chooses uniformly from its eligible species across the full biosphere, not only the at-most-eight-row preview/i.test(copy)
    && /All three share finite Biosphere Yield/i.test(copy)
    && /hit or miss spends 1 attempt/i.test(copy)
    && /pool fully recovers at the next 20-minute active-play cycle/i.test(copy)
    && /never while the game is closed/i.test(copy)
    && /first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol banks that world’s one Chapter 2 life-discovery tick in the same capture transaction/i.test(copy)
    && /A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing/i.test(copy)
    && /v2’s current replacement for v1\.8\.9’s separate Discover Life action/i.test(copy)
    && /Survey Records and accepted or weekly bioscan Charters remain unavailable/i.test(copy)
    && /real fauna Compendium detail can Feed one exact unassigned companion below the 200-Meal cap with one exact flora lot through Use 1/i.test(copy)
    && /Breed two distinct exact owned fauna with nonlethal active-play Recovery/i.test(copy)
    && /Rename one exact owned companion without changing its creature identity/i.test(copy)
    && /name and stand down the role-only Field Scout/i.test(copy)
    && /This drill performs no capture, meal, breeding, rename, Field Scout change, engineering action, or combat/i.test(copy)
    && /Tastes, stat or Power growth, injury care, healing, poison, bond, explorer eating, Scout interception or XP, dispatch, friendly duels, and missions remain unavailable/i.test(copy)
    && !/(?:Surveying|landing)[^.!?]{0,80}(?:discovers|captures) (?:its )?life/i.test(copy)
    && !/(?:you|the player|the explorer)[^.!?]{0,32}(?:choose|select|target)[^.!?]{0,64}(?:species|row|life-form)/i.test(copy)
    && !/miss(?:es)?[^.!?]{0,48}(?:cost|spend)s? (?:nothing|no Yield|zero)/i.test(copy)
    && !/(?:pool|Yield)[^.!?]{0,64}(?:recovers?|refills?)[^.!?]{0,32}(?:while|when)[^.!?]{0,32}(?:closed|offline)/i.test(copy)
    && !/(?:drill|Training)[^.!?]{0,64}(?:makes|performs) a capture attempt/i.test(copy)
    && !/(?:drill|Training)[^.!?]{0,64}(?:makes|performs) a meal/i.test(copy)
    && !/(?:assigned|recovering|capped) companions?[^.!?]{0,80}(?:can|may) (?:still )?be fed/i.test(copy)
    && !/Both parents are consumed|Recovery advances while the game is closed|Breed automatically retries/i.test(copy)
    && !/Rename changes (?:the )?(?:creature |companion )?(?:genome|species|lineage)|Rename automatically retries/i.test(copy)
    && !/Field Scout (?:intercepts?|redirects?)[^.!?]{0,64}(?:harm|injury|damage)|Field Scout (?:earns?|gains?)[^.!?]{0,32}XP/i.test(copy)
    && !/(?:taste|flavou?r|stats?|Power|injury|healing|poison|bond|explorer eating)[^.!?]{0,80}(?:is|are) (?:now )?(?:live|available|changed|increased|discovered|healed)/i.test(copy)
    && !/(?:Capture|Tame|Scavenge|Sample)(?![^.!?]{0,160}\bsource-proven world beyond Sol\b)[^.!?]{0,160}(?:banks?|advances?|counts?)[^.!?]{0,64}(?:Charter|bioscan|life-discovery)/i.test(copy)
    && !/(?:every|any) (?:capture|Tame|Scavenge|Sample)[^.!?]{0,64}(?:banks|advances|counts)[^.!?]{0,48}(?:Charter|bioscan|life-discovery)/i.test(copy)
    && !/(?:miss|later success|repeat|stale tab|failed write)[^.!?]{0,96}(?:banks|advances|counts) (?:a|the|one)[^.!?]{0,48}(?:Charter|bioscan|life-discovery)/i.test(copy)
    && !/\b(?:on|in) Sol\b[^.!?]{0,96}(?:banks|advances|counts) (?:a|the|one)[^.!?]{0,48}(?:Charter|bioscan|life-discovery)/i.test(copy)
    && !/(?:all|every) Research[^.!?]{0,80}(?:available|purchasable)/i.test(copy);
}

function curriculumCopyIsTruthful(steps: readonly { id: string; text: () => string }[]): boolean {
  const text = (id: string): string => steps.find((step) => step.id === id)?.text() ?? '';
  return /without changing your expedition’s Atlas/i.test(text('atlas-add'))
    && /Outside Training.*adds a new chart or confirms/i.test(text('atlas-add'))
    && /practiced without changing your expedition’s charts/i.test(text('atlas-open'))
    && /Outside Training.*charted planet entry returns to its live system survey/i.test(text('atlas-open'))
    && !/Earth is charted|Atlas’s first entry/i.test(text('atlas-open'))
    && /will not roll a capture or spend Yield/i.test(text('planetside-briefing'))
    && /Opening and inspecting this board changes nothing/i.test(text('engineering-open'))
    && /Training keeps every action button locked/i.test(text('engineering-tour'))
    && /deterministic <b>Pureforged<\/b> modifier/i.test(text('engineering-tour'))
    && /an empty new expedition is honest, not a training cache/i.test(text('compendium-open'))
    && /role-only <b>Field Scout<\/b> selector/i.test(text('compendium-tour'))
    && /interception, Scout XP, dispatch, missions, care, bond, and friendly duels are not live yet/i.test(text('compendium-tour'))
    && /Records are evidence, not a reward fountain/i.test(text('records-tour'))
    && /losing one of those captured rulers is permanent/i.test(text('horizon'))
    && /battle-log Share changes no expedition fact/i.test(text('horizon'))
    && !/(?:Training|tour)[^.!?]{0,80}(?:rolls?|spends?|crafts?|feeds?|breeds?|renames?|fights?)[^.!?]{0,80}(?:for you|automatically)/i.test(
      steps.map((step) => step.text()).join(' '),
    );
}

beforeEach(() => {
  vi.resetModules();
  installDom();
});

afterEach(() => {
  restoreDom();
});

describe('Field Training completion transaction UI', () => {
  it('keeps the six hands-on lessons, bounded read-only tour, and honest graduation in order', async () => {
    const training = await import('../apps/game/src/training.js');
    const deps: TrainingDeps = {
      explorerName: () => 'Ada',
      isDone: () => false,
      complete: async () => ({ kind: 'completed' }),
      closePanels: () => {},
    };
    const steps = training.buildSteps(deps);
    expect(steps.map((step) => step.id)).toEqual([
      'welcome', 'find-earth', 'survey-tour', 'atlas-add', 'atlas-open', 'land',
      'planetside-briefing', 'engineering-open', 'engineering-tour',
      'compendium-open', 'compendium-tour', 'records-open', 'records-tour',
      'horizon', 'grad',
    ]);
    expect(curriculumCopyIsTruthful(steps)).toBe(true);
    expect(curriculumCopyIsTruthful(steps.map((step) => step.id === 'atlas-open'
      ? { ...step, text: () => 'Earth is charted — your Atlas’s first entry.' }
      : step))).toBe(false);
    const graduation = steps.find((step) => step.id === 'grad')!.text();
    expect(graduationCopyIsTruthful(graduation)).toBe(true);
    expect(graduationCopyIsTruthful(
      graduation.replace(
        'a survey card’s <b>Share</b> prepares a verified CF1 world code',
        'Share always teleports you',
      ),
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Surveying a living world captures its life.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation.replace(
        'each chooses uniformly from its eligible species across the full biosphere',
        'each targets the selected preview row',
      ),
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation.replace('a hit or miss spends 1 attempt', 'misses spend nothing'),
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' The Yield pool recovers while the game is closed.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Capture advances the Charter bioscan milestone.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Every Research row is now purchasable.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation.replace(
        'one exact unassigned companion below the 200-Meal cap with one exact flora lot through <b>Use 1</b>',
        'any companion with any flora',
      ),
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Assigned companions can still be fed.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Stats are now increased by feeding.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation.replace(
        'two distinct exact owned fauna with nonlethal active-play Recovery',
        'two owned creatures',
      ),
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Both parents are consumed.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation.replace(
        'one exact owned companion without changing its creature identity',
        'a companion',
      ),
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Rename changes the companion genome.',
    )).toBe(false);
    expect(graduationCopyIsTruthful(
      graduation + ' Field Scout intercepts injury and earns XP.',
    )).toBe(false);

    const forgedCurriculum = steps.map((step) => step.id === 'compendium-tour'
      ? { ...step, text: () => step.text().replace(
          'interception, Scout XP, dispatch, missions, care, bond, and friendly duels are not live yet',
          'Field Scout automatically intercepts injury and earns XP',
        ) }
      : step);
    expect(curriculumCopyIsTruthful(forgedCurriculum)).toBe(false);
  });

  it('advances board orientation only from exact real open lifecycles and locks every mutation', async () => {
    const complete = vi.fn<TrainingDeps['complete']>(async () => ({ kind: 'completed' }));
    const { training, closePanels } = await boot(complete);
    driveToPlanetsideBriefing(training);
    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    expect(training.trainingStepId()).toBe('engineering-open');

    for (const [type, detail] of [
      ['crafted', { id: 'shipyard', open: true }],
      ['panel-open', { id: 'codex', open: true }],
      ['panel-open', { id: 'shipyard', open: false }],
      ['panel-open', { id: 'shipyard', open: 1 }],
    ] as const) {
      training.gameEvent(type, detail);
      expect(training.trainingStepId()).toBe('engineering-open');
    }
    training.gameEvent('panel-open', { id: 'shipyard', open: true });
    expect(training.trainingStepId()).toBe('engineering-tour');
    expect(document.querySelector('[data-pnx="shipyard"]')?.closest('[inert]')).toBeNull();
    expect(document.querySelector('#shipyardpanel summary')?.closest('[inert]')).toBeNull();
    expect(document.querySelector('.engineering-action')?.closest('[inert]'))
      .toBe(document.querySelector('.engineering-action'));

    training.gameEvent('crafted', { id: 'iron-plate' });
    expect(training.trainingStepId()).toBe('engineering-tour');
    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    expect(closePanels).toHaveBeenCalledTimes(1);
    expect(training.trainingStepId()).toBe('compendium-open');

    training.gameEvent('panel-open', { id: 'rec', open: true });
    training.gameEvent('panel-open', { id: 'codex', open: 'true' });
    expect(training.trainingStepId()).toBe('compendium-open');
    training.gameEvent('panel-open', { id: 'codex', open: true });
    expect(training.trainingStepId()).toBe('compendium-tour');
    expect(document.querySelector('[data-pnx="codex"]')?.closest('[inert]')).toBeNull();
    for (const selector of [
      '[data-arc5-feed-confirm]', '[data-arc5-breed-confirm]',
      '[data-arc5-rename-confirm]', '[data-arc5-scout-confirm]',
    ]) {
      const control = document.querySelector(selector);
      expect(control?.closest('[inert]'), selector).toBe(control);
    }
    for (const mutationEvent of ['fed', 'bred', 'renamed', 'scout-changed']) {
      training.gameEvent(mutationEvent, { committed: true });
      expect(training.trainingStepId()).toBe('compendium-tour');
    }
    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    expect(closePanels).toHaveBeenCalledTimes(2);
    expect(training.trainingStepId()).toBe('records-open');

    training.gameEvent('panel-open', { id: 'rec', open: true });
    expect(training.trainingStepId()).toBe('records-tour');
    expect(document.querySelector('[data-pnx="rec"]')?.closest('[inert]')).toBeNull();
    expect(document.querySelector('#recpanel button:not([data-pnx])')?.closest('[inert]'))
      .toBe(document.querySelector('#recpanel button:not([data-pnx])'));
    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    expect(closePanels).toHaveBeenCalledTimes(3);
    expect(training.trainingStepId()).toBe('horizon');
    training.gameEvent('conquest', { committed: true });
    expect(training.trainingStepId()).toBe('horizon');
  });

  it('latches a mixed Finish/Skip activation to one Finish transaction and outcome', async () => {
    let resolve!: (result: TrainingEndResult) => void;
    const pending = new Promise<TrainingEndResult>((done) => { resolve = done; });
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(() => pending);
    const { training } = await boot(complete);
    driveToGraduation(training);
    const finish = document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!;
    const skip = document.querySelector<HTMLButtonElement>('[data-sel="tutskip"]')!;

    finish.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    skip.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    finish.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith('finish');
    resolve({ kind: 'completed' });
    await turn();
    expect(training.trainingActive()).toBe(false);
  });

  it('rebinds lesson locks and focus when Survey replaces its action nodes', async () => {
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(
      async () => ({ kind: 'completed' }),
    );
    const { training } = await boot(complete);
    const survey = document.querySelector<HTMLElement>('#survey')!;
    const replaceSurvey = () => {
      survey.innerHTML = `
        <h2 data-sel="title">Earth</h2>
        <button data-act="add">Chart</button>
        <button data-act="landcta">Land</button>`;
    };

    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    training.gameEvent('survey', { planetSeed: 133 });
    await turn();
    expect(training.trainingStepId()).toBe('survey-tour');
    const gotIt = document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!;
    const skip = document.querySelector<HTMLButtonElement>('[data-sel="tutskip"]')!;
    skip.focus();
    replaceSurvey();
    const tourLand = survey.querySelector<HTMLButtonElement>('[data-act="landcta"]')!;
    expect(tourLand.closest('[inert]')).toBeNull();
    expect(training.refreshTrainingScope()).toBe(true);
    expect(tourLand.closest('[inert]')).toBe(tourLand);
    expect(tourLand.style.pointerEvents).toBe('none');
    expect(survey.querySelector('[data-sel="title"]')?.closest('[inert]')).toBeNull();
    await turn();
    expect(document.activeElement).toBe(skip);

    gotIt.click();
    await turn();
    expect(training.trainingStepId()).toBe('atlas-add');
    replaceSurvey();
    const atlasAdd = survey.querySelector<HTMLButtonElement>('[data-act="add"]')!;
    const atlasLand = survey.querySelector<HTMLButtonElement>('[data-act="landcta"]')!;
    expect(atlasLand.closest('[inert]')).toBeNull();
    expect(training.refreshTrainingScope()).toBe(true);
    await turn();
    expect(atlasAdd.closest('[inert]')).toBeNull();
    expect(atlasLand.closest('[inert]')).toBe(atlasLand);
    expect(document.activeElement).toBe(atlasAdd);

    training.gameEvent('atlas-add', { id: 'p133' });
    training.gameEvent('atlas-open', { open: true });
    await turn();
    expect(training.trainingStepId()).toBe('land');
    replaceSurvey();
    const landingAdd = survey.querySelector<HTMLButtonElement>('[data-act="add"]')!;
    const landingLand = survey.querySelector<HTMLButtonElement>('[data-act="landcta"]')!;
    expect(landingLand.closest('[inert]')).toBeNull();
    expect(training.refreshTrainingScope()).toBe(true);
    await turn();
    expect(landingLand.closest('[inert]')).toBeNull();
    expect(landingAdd.closest('[inert]')).toBe(landingAdd);
    expect(document.activeElement).toBe(landingLand);
  });

  it('keeps a wrong-world find-earth Survey closable without exposing its actions', async () => {
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(
      async () => ({ kind: 'completed' }),
    );
    const { training } = await boot(complete);
    const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
    const survey = document.querySelector<HTMLElement>('#survey')!;
    const hideWrongSurvey = vi.fn(() => {
      survey.style.display = 'none';
      survey.setAttribute('aria-hidden', 'true');
      canvas.focus();
    });
    survey.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('[data-survey-close]')) hideWrongSurvey();
    });
    const showWrongSurvey = () => {
      survey.innerHTML = `
        <h2 data-sel="title">Mercury</h2>
        <button data-survey-close>Close Survey</button>
        <button data-act="add">Chart</button>
        <button data-act="landcta">Land</button>
        <button data-act="share">Share</button>`;
      survey.style.display = 'block';
      survey.setAttribute('aria-hidden', 'false');
      expect(training.refreshTrainingScope()).toBe(true);
    };

    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    await turn();
    expect(training.trainingStepId()).toBe('find-earth');
    showWrongSurvey();
    const close = survey.querySelector<HTMLButtonElement>('[data-survey-close]')!;
    const actions = [...survey.querySelectorAll<HTMLButtonElement>('[data-act]')];
    expect(close.closest('[inert]')).toBeNull();
    expect(close.style.pointerEvents).not.toBe('none');
    expect(actions).toHaveLength(3);
    expect(actions.every((action) => action.closest('[inert]') === action)).toBe(true);
    expect(actions.every((action) => action.style.pointerEvents === 'none')).toBe(true);

    close.focus();
    expect(document.activeElement).toBe(close);
    close.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(hideWrongSurvey).toHaveBeenCalledTimes(1);
    expect(survey.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(canvas);
    expect(training.trainingStepId()).toBe('find-earth');

    showWrongSurvey();
    const escape = new dom.window.KeyboardEvent('keydown', {
      key: 'Escape', code: 'Escape', bubbles: true, cancelable: true,
    });
    const dispatched = document.dispatchEvent(escape);
    await turn();
    expect(dispatched).toBe(false);
    expect(escape.defaultPrevented).toBe(true);
    expect(hideWrongSurvey).toHaveBeenCalledTimes(2);
    expect(survey.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(canvas);
    expect(training.trainingStepId()).toBe('find-earth');

    training.gameEvent('survey', { planetSeed: 133 });
    expect(training.trainingStepId()).toBe('survey-tour');
  });

  it('disables the card, removes a lesson canvas allowance, and ignores events while awaiting', async () => {
    let resolve!: (result: TrainingEndResult) => void;
    const pending = new Promise<TrainingEndResult>((done) => { resolve = done; });
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(() => pending);
    const { training } = await boot(complete);
    document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
    expect(training.trainingStepId()).toBe('find-earth');
    await turn();
    const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
    expect(canvas.hasAttribute('inert')).toBe(false);
    const skip = document.querySelector<HTMLButtonElement>('[data-sel="tutskip"]')!;
    skip.focus();
    skip.click();

    expect(complete).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledWith('skip');
    expect(document.querySelector('#tutcard')?.getAttribute('aria-busy')).toBe('true');
    expect(skip.disabled).toBe(true);
    expect(canvas.hasAttribute('inert')).toBe(true);
    expect(canvas.style.pointerEvents).toBe('none');
    training.gameEvent('survey', { planetSeed: 133 });
    expect(training.trainingStepId()).toBe('find-earth');

    resolve({ kind: 'refused', reason: 'write-failed' });
    await turn();
    expect(training.trainingStepId()).toBe('find-earth');
    expect(skip.disabled).toBe(false);
    expect(canvas.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(skip);
  });

  it.each([
    ['unknown-snapshot', /checkpoint is not recognized/i],
    ['write-failed', /could not be saved/i],
    ['busy', /replacement is still underway/i],
    ['protected-storage', /storage is protected/i],
  ] as const)('retains the exact lesson and retry focus after %s refusal', async (reason, copy) => {
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(async () => ({
      kind: 'refused', reason,
    }));
    const { training, closePanels } = await boot(complete);
    const skip = document.querySelector<HTMLButtonElement>('[data-sel="tutskip"]')!;
    skip.focus();
    skip.click();
    await turn();

    expect(training.trainingActive()).toBe(true);
    expect(training.trainingStepId()).toBe('welcome');
    expect(document.querySelector('#tutcard')).not.toBeNull();
    expect(document.querySelector('#tutcard')?.hasAttribute('aria-busy')).toBe(false);
    expect(skip.disabled).toBe(false);
    expect(document.activeElement).toBe(skip);
    expect(document.querySelector('[data-sel="tutstatus"]')?.textContent).toMatch(copy);
    expect(closePanels).not.toHaveBeenCalled();
  });

  it('turns a thrown completion into a visible retryable write refusal', async () => {
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(async () => {
      throw new Error('injected write failure');
    });
    const { training } = await boot(complete);
    document.querySelector<HTMLButtonElement>('[data-sel="tutskip"]')!.click();
    await turn();
    expect(training.trainingActive()).toBe(true);
    expect(document.querySelector('[data-sel="tutstatus"]')?.textContent).toMatch(/could not be saved/i);
  });

  it.each([
    ['completed', { kind: 'completed' }],
    ['durably deferred source error', { kind: 'deferred', reason: 'source-error' }],
  ] as const)('tears down only after a %s result', async (_label, result) => {
    const complete = vi.fn<(intent: TrainingEndIntent) => Promise<TrainingEndResult>>(async () => result);
    const { training, prior, closePanels } = await boot(complete);
    document.querySelector<HTMLButtonElement>('[data-sel="tutskip"]')!.click();
    await turn();
    await turn();

    expect(training.trainingActive()).toBe(false);
    expect(document.querySelector('#tutcard')).toBeNull();
    expect(document.body.classList.contains('training')).toBe(false);
    expect(closePanels).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(prior);
  });
});
