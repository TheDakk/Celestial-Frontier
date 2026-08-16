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
    <div id="dock"><button id="dockatlas">Atlas dock</button></div>
    <div id="raillft"></div><div id="railrgt"><button id="railatlas">Atlas rail</button></div>
    <div id="searchbox"><button>Search</button></div>
    <div id="setpanel"><button>Settings</button></div>
    <div id="guidepanel"><button>Guide</button></div>
    <div id="codexpanel"><button>Codex</button></div>
    <div id="recpanel"><button>Records</button></div>
    <div id="atlaspanel"><button>Earth row</button></div>
    <div id="chpanel"><button>Charters</button></div>
    <div id="survey">
      <button data-sel="title">Earth</button>
      <button data-act="add">Chart</button>
      <button data-act="landcta">Land</button>
    </div>
    <div id="importsheet"><button>Import</button></div>
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

function driveToGraduation(training: typeof import('../apps/game/src/training.js')): void {
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('survey', { planetSeed: 133 });
  document.querySelector<HTMLButtonElement>('[data-sel="tutbtn"]')!.click();
  training.gameEvent('atlas-add', { id: 'p133' });
  training.gameEvent('atlas-open', { open: true });
  training.gameEvent('landfall', { planetSeed: 133 });
  expect(training.trainingStepId()).toBe('grad');
}

beforeEach(() => {
  vi.resetModules();
  installDom();
});

afterEach(() => {
  restoreDom();
});

describe('Field Training completion transaction UI', () => {
  it('keeps the established six live lessons and honest graduation in order', async () => {
    const training = await import('../apps/game/src/training.js');
    const deps: TrainingDeps = {
      explorerName: () => 'Ada',
      isDone: () => false,
      complete: async () => ({ kind: 'completed' }),
      closePanels: () => {},
    };
    expect(training.buildSteps(deps).map((step) => step.id)).toEqual([
      'welcome', 'find-earth', 'survey-tour', 'atlas-add', 'atlas-open', 'land', 'grad',
    ]);
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
