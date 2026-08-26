import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CAPTURE_CARD_OUTCOME_SCHEMA,
  CAPTURE_CARD_READ_MODEL_SCHEMA,
  CAPTURE_CARD_VERB_ORDER,
  CaptureCardController,
  type CaptureCardActionOutcome,
  type CaptureCardActionRequest,
  type CaptureCardOpportunityReadModel,
  type CaptureCardReadModelV1,
} from '../apps/game/src/capture-card.js';

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly Event: typeof Event;
  readonly HTMLButtonElement: typeof HTMLButtonElement;
  close(): void;
}

interface TestDom { readonly window: TestWindow }

interface CaptureShell {
  readonly document: Document;
  readonly root: HTMLElement;
  readonly close: HTMLButtonElement;
  readonly outside: HTMLButtonElement;
  mount: HTMLElement;
}

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));
const gameIndexSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'index.html'), 'utf8');

const CAPTURE_LANDSCAPE_MEDIA = '(max-width:900px)and(orientation:landscape)';
const CAPTURE_LANDSCAPE_REPAIR = '      .capture-card-action { align-self: center; }\n';

interface CaptureLandscapeCascade {
  readonly alignSelf: string;
  readonly minHeight: string;
  readonly repairOwnerCount: number;
}

function normalizedMediaCondition(value: string): string {
  return value.toLowerCase().replace(/\s+/gu, '');
}

function mediaAppliesAtPhoneLandscape(condition: string): boolean {
  const width = 844;
  const height = 390;
  return condition.split(/\s+and\s+/giu).every((rawTerm) => {
    const term = rawTerm.trim().toLowerCase();
    const widthBound = /^\((min|max)-width:\s*([0-9]+)px\)$/u.exec(term);
    if (widthBound) {
      const bound = Number(widthBound[2]);
      return widthBound[1] === 'min' ? width >= bound : width <= bound;
    }
    const orientation = /^\(orientation:\s*(portrait|landscape)\)$/u.exec(term)?.[1];
    if (orientation) return orientation === (width > height ? 'landscape' : 'portrait');
    return false;
  });
}

function captureLandscapeCascade(source: string): CaptureLandscapeCascade {
  const sourceDom = new JSDOM(source);
  const applicableRules: string[] = [];
  let repairOwnerCount = 0;

  const visit = (rules: CSSRuleList, mediaStack: readonly string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule.type === 4) {
        const mediaRule = rule as CSSMediaRule;
        if (mediaAppliesAtPhoneLandscape(mediaRule.conditionText)) {
          visit(mediaRule.cssRules, [...mediaStack, mediaRule.conditionText]);
        }
        continue;
      }
      if (rule.type !== 1) continue;
      const styleRule = rule as CSSStyleRule;
      applicableRules.push(styleRule.cssText);
      const exactLandscapeOwner = mediaStack.some(
        (condition) => normalizedMediaCondition(condition) === CAPTURE_LANDSCAPE_MEDIA,
      );
      const exactSelector = styleRule.selectorText.split(',').map((selector) => selector.trim())
        .includes('.capture-card-action');
      if (exactLandscapeOwner && exactSelector
        && styleRule.style.getPropertyValue('align-self').trim() === 'center') {
        repairOwnerCount++;
      }
    }
  };

  for (const sheet of Array.from(sourceDom.window.document.styleSheets)) {
    visit(sheet.cssRules, []);
  }

  const cascadeDom = new JSDOM(`<!doctype html><html><head><style>${applicableRules.join('\n')}</style></head>
    <body class="surface-mode"><aside id="survey"><section data-capture-card-body>
      <div class="capture-card-row"><button class="capture-card-action" type="button">Tame</button></div>
    </section></aside></body></html>`);
  const target = cascadeDom.window.document.querySelector('.capture-card-action')!;
  const computed = cascadeDom.window.getComputedStyle(target);
  const result = {
    alignSelf: computed.alignSelf,
    minHeight: computed.minHeight,
    repairOwnerCount,
  };
  cascadeDom.window.close();
  sourceDom.window.close();
  return result;
}

function replaceExactOnce(source: string, needle: string, replacement: string): string {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`expected one exact source match for ${JSON.stringify(needle)}`);
  }
  return `${source.slice(0, first)}${replacement}${source.slice(first + needle.length)}`;
}

let dom: TestDom | null = null;
let controller: CaptureCardController | null = null;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function row(
  verb: CaptureCardOpportunityReadModel['verb'],
  status: CaptureCardOpportunityReadModel['status'],
  eligibleCount: number,
  overallChance: number | null,
  chanceMin: number | null,
  chanceMax: number | null,
): CaptureCardOpportunityReadModel {
  return {
    verb,
    status,
    eligibleCount,
    overallChance,
    chanceMin,
    chanceMax,
    detail: `${verb} authority detail.`,
  };
}

function readModel(options: Readonly<{
  contextKey?: string;
  summary?: string;
  noBudget?: boolean;
}> = {}): CaptureCardReadModelV1 {
  if (options.noBudget === true) {
    return deepFreeze({
      schema: CAPTURE_CARD_READ_MODEL_SCHEMA,
      contextKey: options.contextKey ?? 'world:7:epoch:2',
      summary: options.summary ?? 'A surveyed temperate biosphere.',
      budget: null,
      rows: [
        row('tame', 'unavailable', 3, null, null, null),
        row('scavenge', 'unavailable', 2, null, null, null),
        row('sample', 'unavailable', 0, null, null, null),
      ],
    });
  }
  return deepFreeze({
    schema: CAPTURE_CARD_READ_MODEL_SCHEMA,
    contextKey: options.contextKey ?? 'world:7:epoch:2',
    summary: options.summary ?? 'A surveyed temperate biosphere.',
    budget: {
      yield: 5,
      used: 1,
      remaining: 4,
      cycle: 3,
      recoveryRemainingActivePlayMs: 12_000,
      recoveryDetail: 'The next attempt recovers after 12 seconds of active play.',
    },
    rows: [
      row('tame', 'ready', 4, 0.5, 0.4, 0.6),
      row('scavenge', 'ready', 2, 0.7, 0.65, 0.75),
      row('sample', 'empty', 0, null, null, null),
    ],
  });
}

function outcome(options: Readonly<{
  kind?: CaptureCardActionOutcome['kind'];
  verb?: CaptureCardActionOutcome['verb'];
  convergence?: CaptureCardActionOutcome['convergence'];
  title?: string;
  detail?: string;
}> = {}): CaptureCardActionOutcome {
  return deepFreeze({
    schema: CAPTURE_CARD_OUTCOME_SCHEMA,
    kind: options.kind ?? 'committed-miss',
    verb: options.verb ?? 'tame',
    convergence: options.convergence ?? 'none',
    title: options.title ?? 'Tame missed.',
    detail: options.detail ?? 'The durable attempt spent one charge and captured nothing.',
  });
}

function shell(): CaptureShell {
  dom = new JSDOM(`<!doctype html><html><body>
    <button id="outside" type="button">Outside</button>
    <aside id="survey" aria-label="Survey" style="display:block">
      <button type="button" data-survey-close>Close</button>
      <div data-capture-card-body></div>
    </aside>
  </body></html>`);
  const document = dom.window.document;
  return {
    document,
    root: document.getElementById('survey') as HTMLElement,
    close: document.querySelector('[data-survey-close]') as HTMLButtonElement,
    outside: document.getElementById('outside') as HTMLButtonElement,
    mount: document.querySelector('[data-capture-card-body]') as HTMLElement,
  };
}

function replaceMount(view: CaptureShell): HTMLElement {
  controller!.detach();
  view.mount.remove();
  const next = view.document.createElement('div');
  next.setAttribute('data-capture-card-body', '');
  view.root.append(next);
  view.mount = next;
  controller!.attach(next);
  return next;
}

function button(view: CaptureShell, verb: string): HTMLButtonElement {
  return view.mount.querySelector<HTMLButtonElement>(`[data-capture-action="${verb}"]`)!;
}

function status(view: CaptureShell): HTMLElement {
  return view.mount.querySelector<HTMLElement>('[data-capture-status]')!;
}

function emulateBrowserFocusLossWhenDisabled(document: Document): void {
  const prototype = document.defaultView!.HTMLButtonElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'disabled');
  if (!descriptor?.get || !descriptor.set || descriptor.configurable !== true) {
    throw new Error('button disabled accessor is unavailable');
  }
  Object.defineProperty(prototype, 'disabled', {
    configurable: true,
    enumerable: descriptor.enumerable ?? false,
    get: descriptor.get,
    set(this: HTMLButtonElement, value: boolean): void {
      if (value && document.activeElement === this) this.blur();
      descriptor.set!.call(this, value);
    },
  });
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 4 Capture card controller', () => {
  it('keeps the 44px capture action centered in the final short-landscape cascade', () => {
    expect(captureLandscapeCascade(gameIndexSource)).toEqual({
      alignSelf: 'center',
      minHeight: '44px',
      repairOwnerCount: 1,
    });

    const missing = replaceExactOnce(gameIndexSource, CAPTURE_LANDSCAPE_REPAIR, '');
    expect(captureLandscapeCascade(missing)).toMatchObject({
      alignSelf: 'stretch',
      repairOwnerCount: 0,
    });

    const early = replaceExactOnce(
      missing,
      '    .capture-card-action { grid-column: 2;',
      `    @media (max-width: 900px) and (orientation: landscape) {\n${CAPTURE_LANDSCAPE_REPAIR}    }\n    .capture-card-action { grid-column: 2;`,
    );
    expect(captureLandscapeCascade(early)).toMatchObject({
      alignSelf: 'stretch',
      repairOwnerCount: 1,
    });

    const overridden = replaceExactOnce(
      gameIndexSource,
      CAPTURE_LANDSCAPE_REPAIR,
      `${CAPTURE_LANDSCAPE_REPAIR}      .capture-card-action { align-self: stretch; }\n`,
    );
    expect(captureLandscapeCascade(overridden)).toMatchObject({
      alignSelf: 'stretch',
      repairOwnerCount: 1,
    });

    const wrongScope = replaceExactOnce(gameIndexSource, CAPTURE_LANDSCAPE_REPAIR, '');
    const portraitScoped = replaceExactOnce(
      wrongScope,
      '    @media (max-width: 900px) and (orientation: portrait) {\n',
      `    @media (max-width: 900px) and (orientation: portrait) {\n${CAPTURE_LANDSCAPE_REPAIR}`,
    );
    expect(captureLandscapeCascade(portraitScoped)).toMatchObject({
      alignSelf: 'stretch',
      repairOwnerCount: 0,
    });

    const undersized = replaceExactOnce(
      gameIndexSource,
      '      min-width: 88px; min-height: 44px;',
      '      min-width: 88px; min-height: 20px;',
    );
    expect(captureLandscapeCascade(undersized)).toMatchObject({
      alignSelf: 'center',
      minHeight: '20px',
      repairOwnerCount: 1,
    });
  });

  it('renders the frozen canonical three-row random-pool read model without owning Close', () => {
    const view = shell();
    const onAction = vi.fn();
    controller = new CaptureCardController({ root: view.root, onAction });
    const model = readModel();
    controller.setState(model);
    controller.attach(view.mount);

    expect(Object.isFrozen(model)).toBe(true);
    expect(CAPTURE_CARD_VERB_ORDER).toEqual(['tame', 'scavenge', 'sample']);
    expect([...view.mount.querySelectorAll<HTMLElement>('[data-capture-row]')]
      .map((element) => element.dataset.captureRow)).toEqual(CAPTURE_CARD_VERB_ORDER);
    expect([...view.mount.querySelectorAll<HTMLButtonElement>('[data-capture-action]')]
      .map((element) => [element.dataset.captureAction, element.textContent, element.disabled]))
      .toEqual([
        ['tame', 'Tame', false],
        ['scavenge', 'Scavenge', false],
        ['sample', 'Sample', true],
      ]);
    expect(view.mount.querySelector('[data-capture-odds="tame"]')?.textContent).toBe(
      'One of 4 eligible fauna is selected at random. Overall success chance 50%; individual odds range 40%–60%.',
    );
    expect(view.mount.querySelector('[data-capture-odds="scavenge"]')?.textContent).toContain(
      'One of 2 eligible flora or fungi is selected at random.',
    );
    expect(view.mount.querySelector('[data-capture-row-status="sample"]')?.textContent)
      .toBe('No eligible microbes');
    expect(view.mount.querySelector<HTMLElement>('[data-capture-budget]')?.dataset).toMatchObject({
      yield: '5', used: '1', remaining: '4', cycle: '3',
      recoveryRemainingActivePlayMs: '12000',
    });
    expect(status(view).getAttribute('role')).toBe('status');
    expect(status(view).getAttribute('aria-live')).toBe('polite');
    expect(status(view).getAttribute('aria-atomic')).toBe('true');
    expect(status(view).hidden).toBe(true);
    expect(view.root.querySelectorAll('[data-survey-close]')).toHaveLength(1);
    expect(view.close.disabled).toBe(false);
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 1,
      pendingWork: 0,
      convergenceLatched: false,
      actionControlCount: 3,
      delegatedListenerCount: 1,
      contextKey: 'world:7:epoch:2',
      lastRequest: null,
      lastOutcome: null,
    });
  });

  it('rejects mutable, reordered, and internally contradictory read models', () => {
    const view = shell();
    controller = new CaptureCardController({ root: view.root, onAction: vi.fn() });
    controller.attach(view.mount);

    const mutable = { ...readModel(), summary: 'Mutable shell.' };
    expect(() => controller!.setState(mutable)).toThrow(/deeply frozen/);

    const valid = readModel();
    const reordered = deepFreeze({
      ...valid,
      rows: [valid.rows[1]!, valid.rows[0]!, valid.rows[2]!],
    });
    expect(() => controller!.setState(reordered)).toThrow(/canonical order/);

    const missingBudget = deepFreeze({ ...valid, budget: null });
    expect(() => controller!.setState(missingBudget)).toThrow(/unavailable status/);

    const outOfRange = deepFreeze({
      ...valid,
      rows: [
        { ...valid.rows[0]!, overallChance: 0.9 },
        valid.rows[1]!,
        valid.rows[2]!,
      ],
    });
    expect(() => controller!.setState(outOfRange)).toThrow(/inside its range/);
  });

  it('locks all capture verbs locally before one synchronous immutable request escapes', () => {
    const view = shell();
    let observed: CaptureCardActionRequest | null = null;
    const onNativeTameGesture = vi.fn();
    const onAction = vi.fn((request: CaptureCardActionRequest) => {
      observed = request;
      expect(Object.isFrozen(request)).toBe(true);
      expect(view.mount.getAttribute('aria-busy')).toBe('true');
      expect([...view.mount.querySelectorAll<HTMLButtonElement>('[data-capture-action]')]
        .every((control) => control.disabled && control.getAttribute('aria-disabled') === 'true'))
        .toBe(true);
      expect(status(view).textContent).toContain('No capture, attempt spend, Compendium page or reward is published');
    });
    controller = new CaptureCardController({ root: view.root, onNativeTameGesture, onAction });
    controller.setState(readModel());
    controller.attach(view.mount);
    const beforeBudget = view.mount.querySelector('[data-capture-budget]')?.textContent;

    button(view, 'tame').click();
    button(view, 'scavenge').dispatchEvent(new dom!.window.Event('click', { bubbles: true }));

    expect(onAction).toHaveBeenCalledOnce();
    /* jsdom .click() is deliberately untrusted: diagnostics and synthetic
       callers still exercise presentation, but can never arm Web Audio. */
    expect(onNativeTameGesture).not.toHaveBeenCalled();
    expect(observed).toEqual({ verb: 'tame' });
    expect(view.mount.querySelector('[data-capture-budget]')?.textContent).toBe(beforeBudget);
    expect(view.close.disabled).toBe(false);
    controller.setPending(observed);
    expect(() => controller!.setPending({ verb: 'scavenge' })).toThrow(/replace a pending action/);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 1,
      lastRequest: { verb: 'tame' },
      lastOutcome: null,
    });
  });

  it('retains pending and outcome presentation across dynamic hide/reopen mounts without stale DOM', () => {
    const view = shell();
    const onAction = vi.fn();
    controller = new CaptureCardController({ root: view.root, onAction });
    controller.setState(readModel());
    controller.attach(view.mount);
    button(view, 'tame').click();

    const firstMount = view.mount;
    controller.detach();
    expect(firstMount.childElementCount).toBe(0);
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 0,
      retainedDomCount: 0,
      pendingWork: 1,
      actionControlCount: 0,
      delegatedListenerCount: 1,
    });
    firstMount.remove();
    const nextMount = view.document.createElement('div');
    nextMount.setAttribute('data-capture-card-body', '');
    view.root.append(nextMount);
    view.mount = nextMount;
    controller.attach(nextMount);
    expect(nextMount.getAttribute('aria-busy')).toBe('true');
    expect(status(view).textContent).toContain('Tame attempt pending');
    expect(nextMount.querySelectorAll('button[data-capture-action]:not(:disabled)')).toHaveLength(0);
    expect(view.root.querySelectorAll('[data-survey-close]')).toHaveLength(1);

    controller.settle(outcome());
    expect(status(view).textContent).toBe(
      'Tame missed. The durable attempt spent one charge and captured nothing.',
    );
    replaceMount(view);
    expect(view.mount.getAttribute('aria-busy')).toBe('false');
    expect(status(view).textContent).toContain('The durable attempt spent one charge');
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('follows a native disable-to-BODY lineage through rerender and back to the exact verb', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    controller = new CaptureCardController({ root: view.root, onAction: vi.fn() });
    controller.setState(readModel());
    controller.attach(view.mount);
    const firstTame = button(view, 'tame');
    firstTame.focus();
    expect(view.document.activeElement).toBe(firstTame);

    firstTame.click();
    expect(view.document.activeElement).toBe(view.document.body);
    expect(controller.diagnostics().pendingDisabledBodyFocusOwned).toBe(true);
    controller.setState(readModel({ summary: 'Fresh authority while the write settles.' }));
    expect(controller.diagnostics().pendingDisabledBodyFocusOwned).toBe(false);
    expect(view.document.activeElement).toBe(
      view.mount.querySelector('[data-semantic-key="capture:tame"]'),
    );
    controller.settle(outcome());
    const settledTame = button(view, 'tame');
    expect(settledTame).not.toBe(firstTame);
    expect(view.document.activeElement).toBe(settledTame);
    expect(view.close.disabled).toBe(false);
  });

  it('falls back to the live outcome when the originating control and row disappear', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    controller = new CaptureCardController({ root: view.root, onAction: vi.fn() });
    controller.setState(readModel());
    controller.attach(view.mount);
    const tame = button(view, 'tame');
    tame.focus();
    tame.click();
    expect(view.document.activeElement).toBe(view.document.body);

    controller.setState(null);
    expect(view.mount.querySelector('[data-capture-action]')).toBeNull();
    expect(view.document.activeElement).toBe(status(view));
    controller.settle(outcome());
    expect(view.document.activeElement).toBe(status(view));
    expect(status(view).textContent).toContain('Tame missed.');
  });

  it('never steals focus while hidden or after the user moves elsewhere', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    controller = new CaptureCardController({ root: view.root, onAction: vi.fn() });
    controller.setState(readModel());
    controller.attach(view.mount);
    const tame = button(view, 'tame');
    tame.focus();
    tame.click();
    view.root.style.display = 'none';
    view.root.setAttribute('aria-hidden', 'true');
    view.outside.focus();
    expect(controller.diagnostics().pendingDisabledBodyFocusOwned).toBe(false);

    controller.setState(readModel({ summary: 'Hidden authority refresh.' }));
    controller.settle(outcome());
    expect(view.document.activeElement).toBe(view.outside);
    replaceMount(view);
    expect(view.document.activeElement).toBe(view.outside);
    view.root.style.display = 'block';
    view.root.setAttribute('aria-hidden', 'false');
    expect(view.document.activeElement).toBe(view.outside);
    expect(status(view).textContent).toContain('Tame missed.');
  });

  it('clears idle receipts only across context identity and rejects replacement while busy', () => {
    const view = shell();
    controller = new CaptureCardController({ root: view.root, onAction: vi.fn() });
    controller.setState(readModel());
    controller.attach(view.mount);
    button(view, 'tame').click();
    controller.settle(outcome());
    expect(status(view).hidden).toBe(false);
    expect(controller.diagnostics().lastRequest).toEqual({ verb: 'tame' });

    controller.setState(readModel({ summary: 'Same world refresh.' }));
    expect(status(view).textContent).toContain('Tame missed.');
    controller.setState(null);
    controller.setState(readModel({ contextKey: 'world:8:epoch:1' }));
    expect(status(view).hidden).toBe(true);
    expect(controller.diagnostics()).toMatchObject({
      contextKey: 'world:8:epoch:1',
      lastRequest: null,
      lastOutcome: null,
    });

    button(view, 'scavenge').click();
    expect(() => controller!.setState(readModel({ contextKey: 'world:9:epoch:1' })))
      .toThrow(/replace its context while work is pending/);
    expect(controller.diagnostics()).toMatchObject({
      contextKey: 'world:8:epoch:1',
      pendingWork: 1,
      lastRequest: { verb: 'scavenge' },
    });
  });

  it('latches unknown commit convergence across replacement and cannot be unlocked or retargeted', () => {
    const view = shell();
    const onAction = vi.fn();
    controller = new CaptureCardController({ root: view.root, onAction });
    controller.setState(readModel());
    controller.attach(view.mount);
    button(view, 'tame').click();
    const uncertain = outcome({
      kind: 'committed-unknown',
      convergence: 'read-only-reload',
      title: 'Capture result uncertain.',
      detail: 'Reload to converge with durable truth before another attempt.',
    });
    controller.settle(uncertain);

    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 1,
      convergenceLatched: true,
      lastOutcome: uncertain,
    });
    expect(status(view).dataset.convergence).toBe('read-only-reload');
    expect(view.mount.getAttribute('aria-busy')).toBe('true');
    controller.setPending(null);
    controller.settle(uncertain);
    replaceMount(view);
    expect(view.mount.querySelectorAll('button[data-capture-action]:not(:disabled)')).toHaveLength(0);
    expect(status(view).textContent).toContain('Reload to converge');
    expect(() => controller!.setPending({ verb: 'scavenge' })).toThrow(/converging action/);
    expect(() => controller!.setState(readModel({ contextKey: 'world:9:epoch:1' })))
      .toThrow(/replace its context while work is pending/);
    expect(() => controller!.settle(outcome({ title: 'Different.' })))
      .toThrow(/terminal/);
    button(view, 'tame').dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(controller.diagnostics().convergenceLatched).toBe(true);
  });

  it('rolls back the local lock and exact focus when synchronous emission throws', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    const failure = new Error('coordinator rejected synchronously');
    controller = new CaptureCardController({
      root: view.root,
      onAction: () => { throw failure; },
    });
    controller.setState(readModel());
    controller.attach(view.mount);
    const tame = button(view, 'tame');
    let reported: unknown = null;
    view.document.defaultView!.addEventListener('error', (event) => {
      reported = (event as ErrorEvent).error;
      event.preventDefault();
    });
    tame.focus();

    tame.click();
    expect(reported).toBe(failure);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      lastRequest: null,
      lastOutcome: null,
    });
    expect(button(view, 'tame').disabled).toBe(false);
    expect(view.document.activeElement).toBe(button(view, 'tame'));
  });
});
