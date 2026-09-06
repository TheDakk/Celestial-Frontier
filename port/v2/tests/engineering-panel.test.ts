import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ShipInstalledSystemId, ShipVisualState } from '@cf/scene';
import {
  ENGINEERING_PANEL_READ_MODEL_SCHEMA,
  ENGINEERING_RESEARCH_ORDER,
  EngineeringPanelController,
  type EngineeringPanelActionRequest,
  type EngineeringPanelCosts,
  type EngineeringPanelReadModelV1,
  type EngineeringRowStatus,
  type EngineeringPanelView,
} from '../apps/game/src/engineering-panel.js';

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly HTMLElement: typeof HTMLElement;
  readonly Event: typeof Event;
  readonly KeyboardEvent: typeof KeyboardEvent;
  readonly MouseEvent: typeof MouseEvent;
  close(): void;
}
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));

let dom: TestDom | null = null;
let controller: EngineeringPanelController | null = null;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function shell(): Readonly<{
  document: Document;
  panel: HTMLElement;
  body: HTMLElement;
  opener: HTMLButtonElement;
  close: HTMLButtonElement;
}> {
  dom = new JSDOM(`<!doctype html><html><body>
    <button id="opener">Shipyard</button>
    <aside id="shipyardpanel" aria-label="Shipyard">
      <button type="button" data-pnx="shipyard" aria-label="Close Shipyard">Close</button>
      <div data-engineering-panel-body></div>
    </aside>
  </body></html>`);
  const document = dom.window.document;
  return Object.freeze({
    document,
    panel: document.getElementById('shipyardpanel') as HTMLElement,
    body: document.querySelector('[data-engineering-panel-body]') as HTMLElement,
    opener: document.getElementById('opener') as HTMLButtonElement,
    close: document.querySelector('[data-pnx="shipyard"]') as HTMLButtonElement,
  });
}

function costs(input: Readonly<{
  materials?: readonly Readonly<{ id: string; label: string; required: number; owned: number }>[];
  parts?: readonly Readonly<{ id: string; label: string; required: number; owned: number }>[];
  stardustRequired?: number;
  stardustOwned?: number;
  signature?: Readonly<{ id: string; label: string; owned: boolean }> | null;
  prerequisite?: Readonly<{ id: string; label: string; owned: boolean }> | null;
}> = {}): EngineeringPanelCosts {
  return {
    materials: [...(input.materials ?? [])],
    parts: [...(input.parts ?? [])],
    stardust: { required: input.stardustRequired ?? 0, owned: input.stardustOwned ?? 200 },
    signature: input.signature ?? null,
    prerequisite: input.prerequisite ?? null,
  };
}

function ship(stage: ShipVisualState['chassisStage']): ShipVisualState {
  const installedSystemIds: ShipInstalledSystemId[] = [
    ...(stage >= 1 ? ['jumpdrive' as const] : []),
    ...(stage >= 2 ? ['array' as const] : []),
    ...(stage >= 3 ? ['igdrive' as const] : []),
    ...(stage >= 2 ? ['autoext' as const] : []),
    ...(stage >= 3 ? ['cscoop' as const] : []),
  ];
  return {
    chassisStage: stage,
    hardpoints: {
      array: installedSystemIds.includes('array'),
      autoext: installedSystemIds.includes('autoext'),
      cscoop: installedSystemIds.includes('cscoop'),
    },
    installedSystemIds,
    liverySeed: 0x5111,
    provenance: 'owned-items',
  };
}

function readModel(options: Readonly<{
  stage?: ShipVisualState['chassisStage'];
  miningStatus?: EngineeringPanelReadModelV1['mining']['status'];
  miningDetail?: string;
  miningLocation?: string;
  miningDue?: number | null;
  scanStatus?: EngineeringRowStatus;
  scanReason?: string | null;
  hostileRecipeName?: string;
  exceptionalRecipe?: boolean;
}> = {}): EngineeringPanelReadModelV1 {
  const scanStatus = options.scanStatus ?? 'available';
  const scanReason = options.scanReason === undefined
    ? scanStatus === 'available' ? null : scanStatus === 'owned' ? 'Already researched.' : 'Scanner consumer unavailable.'
    : options.scanReason;
  return deepFreeze({
    schema: ENGINEERING_PANEL_READ_MODEL_SCHEMA,
    ship: ship(options.stage ?? 2),
    mining: {
      locationLabel: options.miningLocation ?? 'Lifeless world 77',
      status: options.miningStatus ?? 'ready',
      detail: options.miningDetail ?? 'One finite pull is ready now.',
      deposits: [
        { id: 'Fe', label: 'Iron', grade: 'Tier 3' },
        { id: 'Si', label: 'Silicon', grade: null },
      ],
      pullsRemaining: 4,
      autoExtractorDue: options.miningDue === undefined ? 0 : options.miningDue,
    },
    skimming: {
      starLabel: 'Helios Prime',
      status: 'ready',
      detail: 'Corona sample is ready.',
      material: 'Coronal Plasma',
      passesRemaining: 2,
      nextDamage: 7,
    },
    research: [
      {
        id: 'scan1', name: 'Deep Scanners', description: 'Reveal mineral veins from orbit.',
        status: scanStatus, reason: scanReason,
        costs: costs({ materials: [{ id: 'Fe', label: 'Iron', required: 6, owned: 8 }, { id: 'Si', label: 'Silicon', required: 4, owned: 3 }], stardustRequired: 20 }),
      },
      {
        id: 'hull1', name: 'Reinforced Hull', description: 'Reduce hostile bioscan damage.',
        status: 'unavailable', reason: 'Gameplay effect is not connected.',
        costs: costs({ materials: [{ id: 'Ti', label: 'Titanium', required: 5, owned: 1 }, { id: 'Fe', label: 'Iron', required: 8, owned: 8 }], stardustRequired: 40 }),
      },
      {
        id: 'lab1', name: 'Xenobotany Lab', description: 'Improve nourishment from flora.',
        status: 'unavailable', reason: 'Flora nourishment consumer is not connected.',
        costs: costs({ materials: [{ id: 'C', label: 'Carbon', required: 6, owned: 6 }], stardustRequired: 60 }),
      },
      {
        id: 'drive1', name: 'Fusion Drive', description: 'Shorten hyperlane travel.',
        status: 'owned', reason: 'Already researched.',
        costs: costs({ materials: [{ id: 'H', label: 'Hydrogen', required: 8, owned: 20 }], stardustRequired: 40 }),
      },
      {
        id: 'drive2', name: 'Antimatter Drive', description: 'Shorten longer hyperlane travel.',
        status: 'unavailable', reason: 'Travel-time research consumer is not connected.',
        costs: costs({ materials: [{ id: 'He3', label: 'Helium-3', required: 6, owned: 2 }], stardustRequired: 120, prerequisite: { id: 'drive1', label: 'Fusion Drive', owned: true } }),
      },
      {
        id: 'drive3', name: 'Warp Fold', description: 'Collapse hyperlane travel time.',
        status: 'unavailable', reason: 'Requires Antimatter Drive; gameplay effect is not connected.',
        costs: costs({ materials: [{ id: 'Pz', label: 'Prismatium', required: 1, owned: 0 }], stardustRequired: 300, prerequisite: { id: 'drive2', label: 'Antimatter Drive', owned: false } }),
      },
    ],
    fabricationGroups: [
      {
        id: 'parts', name: 'Parts', recipes: [
          {
            baseId: 'plate', name: 'Iron Plate', category: 'part', status: 'available', reason: null,
            costs: costs({ materials: [{ id: 'Fe', label: 'Iron', required: 4, owned: 8 }] }),
            effectSupport: 'live', effectDetail: 'Produces one fixed part.', outputKind: 'stackable',
            owned: 2, outputQuantity: 1, capacityRemaining: 999_998,
          },
          {
            baseId: 'wire', name: options.hostileRecipeName ?? 'Aluminium Wire', category: 'part',
            status: 'unavailable', reason: 'Missing 2 Aluminium.',
            costs: costs({ materials: [{ id: 'Al', label: 'Aluminium', required: 3, owned: 1 }] }),
            effectSupport: 'live', effectDetail: 'Produces one fixed part.', outputKind: 'stackable',
            owned: 0, outputQuantity: 1, capacityRemaining: 1_000_000,
          },
        ],
      },
      {
        id: 'systems', name: 'Ship systems', recipes: [
          {
            baseId: 'jumpdrive', name: 'Jump Drive', category: 'sys', status: 'owned', reason: 'Permanent system already built.',
            costs: costs({ parts: [{ id: 'coil', label: 'Drive Coil', required: 2, owned: 2 }, { id: 'navcore', label: 'Nav Core', required: 1, owned: 1 }], stardustRequired: 30 }),
            effectSupport: 'live', effectDetail: 'Interstellar reach is connected.', outputKind: 'permanent-system',
            owned: 1, outputQuantity: 1, capacityRemaining: 0,
          },
          {
            baseId: 'autoext', name: 'Auto-Extractor', category: 'sys', status: 'available', reason: null,
            costs: costs({ parts: [{ id: 'servo', label: 'Servo Rig', required: 2, owned: 2 }], stardustRequired: 40, signature: { id: 'stone', label: 'Stone Signature', owned: true }, prerequisite: { id: 'jumpdrive', label: 'Jump Drive', owned: true } }),
            effectSupport: 'unavailable', effectDetail: 'Background accrual would otherwise be invisible.', outputKind: 'permanent-system',
            owned: 0, outputQuantity: 1, capacityRemaining: 1,
          },
        ],
      },
      ...(options.exceptionalRecipe ? [{
        id: 'gear' as const, name: 'Gear', recipes: [{
          baseId: 'meteor', name: 'Meteorite Pendant', category: 'gear' as const,
          status: 'available' as const, reason: null,
          costs: costs({
            materials: [
              { id: 'Ni', label: 'Nickel', required: 2, owned: 2 },
              { id: 'C', label: 'Carbon', required: 1, owned: 1 },
            ],
          }),
          effectSupport: 'live' as const,
          effectDetail: 'Live effects: rich strike chance.',
          outputKind: 'gear-instance' as const,
          owned: 0, outputQuantity: 1, capacityRemaining: 24,
        }],
      }] : []),
    ],
  } satisfies EngineeringPanelReadModelV1);
}

function fullView(model: EngineeringPanelReadModelV1): EngineeringPanelView {
  return Object.freeze({ ship: model.ship, engineering: model, reason: null });
}

function protectedView(
  stage: ShipVisualState['chassisStage'] = 2,
  reason = 'Engineering details and actions are unavailable while this expedition is protected.',
): EngineeringPanelView {
  const standaloneShip = deepFreeze(ship(stage));
  return Object.freeze({ ship: standaloneShip, engineering: null, reason });
}

function setFullView(model: EngineeringPanelReadModelV1): void {
  controller!.setView(fullView(model));
}

function open(view: ReturnType<typeof shell>): void {
  view.opener.focus();
  controller!.registration().onOpen();
}

function exactRules(source: string, selector: string): readonly string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...source.matchAll(new RegExp(`^[ \\t]*${escaped}[ \\t]*\\{([^}]+)\\}`, 'gms'))]
    .map((match) => match[1]!);
}

function exactRule(source: string, selector: string): string {
  return exactRules(source, selector).at(-1) ?? '';
}

function touchFloorContract(source: string, selector: string): boolean {
  const rule = exactRule(source, selector);
  return /min-height:\s*44px/.test(rule) && /box-sizing:\s*border-box/.test(rule);
}

function bounded320Contract(source: string): Readonly<{
  valid: boolean;
  viewportWidth: 320;
  panelBorderBoxWidth: number;
  panelContentWidth: number;
}> {
  const parsed = new JSDOM(source);
  const document = parsed.window.document;
  const panelRule = exactRule(source, '.panel');
  const shipyardRule = exactRule(source, '#shipyardpanel');
  const bodyRules = exactRules(source, '.engineering-panel-body').join('\n');
  const actionRule = exactRule(source, '#shipyardpanel button.engineering-action');
  const narrowRule = source.match(
    /@media\s*\(max-width:\s*360px\)\s*\{\s*#shipyardpanel,\s*\.engineering-panel-body,\s*\.engineering-ship-overview,\s*\.engineering-section,\s*\.engineering-row-list,\s*\.engineering-fabrication-groups,\s*\.engineering-fabrication-group,\s*\.engineering-row\s*\{([^}]+)\}/s,
  )?.[1] ?? '';
  const boundedSelectors = new Set([
    '#shipyardpanel',
    '.engineering-panel-body',
    '.engineering-ship-overview',
    '.engineering-section',
    '.engineering-row-list',
    '.engineering-fabrication-groups',
    '.engineering-fabrication-group',
    '.engineering-row',
  ]);
  const boundedMinWidths: string[] = [];
  const mediaApplies = (condition: string, width: number): boolean => {
    for (const match of condition.matchAll(/min-width:\s*(\d+)px/g)) {
      if (width < Number(match[1])) return false;
    }
    for (const match of condition.matchAll(/max-width:\s*(\d+)px/g)) {
      if (width > Number(match[1])) return false;
    }
    return true;
  };
  const collectRules = (rules: CSSRuleList, applies: boolean): void => {
    for (const raw of Array.from(rules)) {
      const rule = raw as CSSRule & {
        readonly selectorText?: string;
        readonly style?: CSSStyleDeclaration;
        readonly cssRules?: CSSRuleList;
        readonly media?: MediaList;
      };
      const nestedApplies = applies && (rule.media ? mediaApplies(rule.media.mediaText, 320) : true);
      if (nestedApplies && rule.selectorText && rule.style) {
        const minWidth = rule.style.getPropertyValue('min-width').trim();
        if (minWidth && rule.selectorText.split(',').some((selector) => boundedSelectors.has(selector.trim()))) {
          boundedMinWidths.push(minWidth);
        }
      }
      if (rule.cssRules) collectRules(rule.cssRules, nestedApplies);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) collectRules(sheet.cssRules, true);
  /* With zero safe-area side insets, the real .panel equation yields a 304px
     border box at 320px. Border-box padding/borders leave 274px to the owned
     body. The narrow rule's explicit zero min prevents min-width from beating
     max-width and forcing any owned container beyond that box. */
  const viewportWidth = 320 as const;
  const panelBorderBoxWidth = viewportWidth - 16;
  const panelContentWidth = panelBorderBoxWidth - (14 * 2) - (1 * 2);
  const valid = document.querySelectorAll('#shipyardpanel').length === 1
    && document.querySelectorAll('#shipyardpanel > [data-engineering-panel-body]').length === 1
    && /width:\s*min\(360px,\s*calc\(100vw\s*-\s*var\(--safe-left\)\s*-\s*var\(--safe-right\)\s*-\s*16px\)\)/.test(panelRule)
    && /padding:\s*14px/.test(panelRule)
    && /box-sizing:\s*border-box/.test(panelRule)
    && /overflow-x:\s*hidden/.test(shipyardRule)
    && /overflow-y:\s*auto/.test(shipyardRule)
    && /overflow-wrap:\s*anywhere/.test(bodyRules)
    && /max-width:\s*100%/.test(actionRule)
    && /white-space:\s*normal/.test(actionRule)
    && /min-width:\s*0/.test(narrowRule)
    && /max-width:\s*100%/.test(narrowRule)
    && boundedMinWidths.length > 0
    && boundedMinWidths.every((value) => value === '0' || value === '0px')
    && panelBorderBoxWidth <= viewportWidth
    && panelContentWidth > 0;
  parsed.window.close();
  return Object.freeze({ valid, viewportWidth, panelBorderBoxWidth, panelContentWidth });
}

function browserFocusEligible(element: HTMLElement): boolean {
  if (!element.isConnected) return false;
  if (element instanceof element.ownerDocument.defaultView!.HTMLButtonElement && element.disabled) return false;
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (ancestor instanceof element.ownerDocument.defaultView!.HTMLDetailsElement && !ancestor.open) {
      const summary = ancestor.querySelector<HTMLElement>(':scope > summary');
      if (summary !== element && !summary?.contains(element)) return false;
    }
  }
  return true;
}

function emulateBrowserFocusLossWhenDisabled(document: Document): void {
  const view = document.defaultView!;
  const prototype = view.HTMLButtonElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'disabled');
  if (!descriptor?.get || !descriptor.set || descriptor.configurable !== true) {
    throw new Error('button disabled accessor is unavailable');
  }
  Object.defineProperty(prototype, 'disabled', {
    configurable: true,
    enumerable: descriptor.enumerable ?? false,
    get: descriptor.get,
    set(this: HTMLButtonElement, value: boolean): void {
      /* Real browsers move focus to BODY as soon as a focused native button
         becomes disabled. jsdom retains the impossible disabled focus unless
         this lifecycle boundary is modeled explicitly. */
      if (value && document.activeElement === this) this.blur();
      descriptor.set!.call(this, value);
    },
  });
}

function emulateDeferredBrowserFocusLossWhenDisabled(document: Document): () => void {
  const view = document.defaultView!;
  const prototype = view.HTMLButtonElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'disabled');
  if (!descriptor?.get || !descriptor.set || descriptor.configurable !== true) {
    throw new Error('button disabled accessor is unavailable');
  }
  const pending = new Set<HTMLButtonElement>();
  Object.defineProperty(prototype, 'disabled', {
    configurable: true,
    enumerable: descriptor.enumerable ?? false,
    get: descriptor.get,
    set(this: HTMLButtonElement, value: boolean): void {
      /* Edge may complete the focused-button -> BODY transition only after
         its trusted click listener returns. Retain that boundary instead of
         giving jsdom the old synchronous false-green behavior. */
      if (value && document.activeElement === this) pending.add(this);
      descriptor.set!.call(this, value);
    },
  });
  return (): void => {
    for (const button of pending) {
      if (document.activeElement === button) {
        document.body.tabIndex = -1;
        document.body.focus();
      }
    }
    pending.clear();
  };
}

function ownsExactSettlementFocus(
  document: Document,
  semanticKey: string,
  focusKey: string | null,
): boolean {
  const view = document.defaultView;
  const active = document.activeElement;
  if (!view || !(active instanceof view.HTMLElement) || !browserFocusEligible(active)) return false;
  const semantic = active.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey ?? null;
  return semantic === semanticKey
    && (focusKey === null ? active.dataset.semanticKey === semanticKey : active.dataset.focusKey === focusKey);
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 3 Engineering/Shipyard presentation controller', () => {
  it('opts into compact Shipyard hierarchy without losing facts, actions, the native Close, or current-look fallback', () => {
    const view = shell();
    const onAction = vi.fn();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, openers: [view.opener], onAction });
    setFullView(readModel({ stage: 0 }));
    open(view);
    const facts = (): string[] => [...view.body.querySelectorAll<HTMLElement>(
      '[data-ship-hardpoint], [data-ship-system], [data-research-id], [data-recipe-id], [data-engineering-fact], [data-engineering-deposits]',
    )].map((node) => node.outerHTML).sort();
    const originalFacts = facts();
    const originalActions = [...view.body.querySelectorAll<HTMLButtonElement>('[data-engineering-action]')]
      .map((node) => node.outerHTML).sort();
    const originalRole = view.body.querySelector('.engineering-ship-role')!.textContent;
    expect(view.body.querySelector('[data-engineering-pilot-style]')).toBeNull();
    expect(view.body.querySelector('[data-shipyard-candidate]')).toBeNull();
    controller.setPresentation({ mode: 'audiovisual-pilot', starterScoutImageUrl: '/assets/scout.webp' });
    expect(view.body.dataset.engineeringPresentation).toBe('audiovisual-pilot');
    expect([...view.body.querySelectorAll<HTMLDetailsElement>('[data-engineering-section]')]
      .map((node) => node.dataset.engineeringSection)).toEqual(['ship-details', 'fabricator', 'research', 'mining', 'skimming']);
    expect(view.body.querySelector('[data-engineering-section="fabricator"] > summary')!.textContent).toBe('Fabricator · 1 available');
    expect(view.body.querySelector('[data-engineering-section="research"] > summary')!.textContent).toBe('Research Bench · 1 available');
    expect(view.body.querySelector('.engineering-ship-role')!.textContent).toBe(originalRole);
    expect(facts()).toEqual(originalFacts);
    expect([...view.body.querySelectorAll<HTMLButtonElement>('[data-engineering-action]')]
      .map((node) => node.outerHTML).sort()).toEqual(originalActions);
    const details = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="ship-details"]')!;
    const provenance = details.querySelector<HTMLElement>('.engineering-ship-provenance')!;
    const mountRow = details.querySelector<HTMLElement>('[data-ship-hardpoint]')!;
    expect(details.open).toBe(false);
    expect(browserFocusEligible(provenance)).toBe(false);
    expect(browserFocusEligible(mountRow)).toBe(false);
    expect(browserFocusEligible(details.querySelector<HTMLElement>('summary')!)).toBe(true);
    details.open = true;
    expect(browserFocusEligible(provenance)).toBe(true);
    expect(browserFocusEligible(mountRow)).toBe(true);
    const recipeDetails = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!;
    const action = recipeDetails.querySelector<HTMLButtonElement>('[data-recipe-id="plate"] button')!;
    expect(browserFocusEligible(action)).toBe(false);
    recipeDetails.open = true;
    expect(browserFocusEligible(action)).toBe(true);
    action.click();
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ operation: 'fabricate', id: 'plate' });
    expect(Object.isFrozen(onAction.mock.calls[0]![0])).toBe(true);
    expect([...view.body.querySelectorAll<HTMLButtonElement>('[data-engineering-action]')].every((node) => node.disabled)).toBe(true);
    expect(view.panel.querySelectorAll('[data-pnx="shipyard"]')).toHaveLength(1);
    expect(view.panel.querySelector('[data-pnx="shipyard"]')).toBe(view.close);
    expect(view.close.disabled).toBe(false);
    controller.setPending(null);
    controller.setPresentation(null);
    expect(view.body.dataset.engineeringPresentation).toBeUndefined();
    expect(view.body.querySelector('[data-engineering-pilot-style]')).toBeNull();
    expect(view.body.querySelector('[data-shipyard-candidate]')).toBeNull();
    expect([...view.body.querySelectorAll('details > summary')].map((node) => node.textContent))
      .toEqual(['Mining', 'Stellar Skimming', 'Research Bench', 'Fabricator']);
    expect(facts()).toEqual(originalFacts);
    controller.registration().onClose();
    expect(view.document.activeElement).toBe(view.opener);
    expect(controller.diagnostics()).toMatchObject({ activeCount: 0, retainedDomCount: 0, activePreviewCount: 0, retainedPreviewCount: 0 });
  });

  it('retains pilot disclosure, exact focus and native reading position across heartbeat and releases missing summary focus to Close', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, openers: [view.opener], onAction: vi.fn() });
    const presentation = { mode: 'audiovisual-pilot' as const, starterScoutImageUrl: '/assets/scout.webp' };
    controller.setPresentation(presentation);
    setFullView(readModel({ stage: 0 }));
    expect(controller.diagnostics().retainedDomCount).toBe(0);
    open(view);
    const details = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="ship-details"]')!;
    details.open = true;
    const firstSummary = details.querySelector<HTMLElement>('summary')!;
    firstSummary.focus();
    view.panel.scrollTop = 71; view.panel.scrollLeft = 2;
    const focus = vi.spyOn(dom!.window.HTMLElement.prototype, 'focus');
    const firstPreview = view.body.querySelector('[data-cf-shipyard-preview]');
    controller.setPresentation({ ...presentation });
    expect(view.body.querySelector('[data-cf-shipyard-preview]')).toBe(firstPreview);
    setFullView(readModel({ stage: 0, miningDue: 3 }));
    const nextDetails = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="ship-details"]')!;
    expect(nextDetails.open).toBe(true);
    expect(nextDetails.querySelector('summary')).not.toBe(firstSummary);
    expect(view.document.activeElement).toBe(nextDetails.querySelector('summary'));
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
    expect(view.panel.scrollTop).toBe(71); expect(view.panel.scrollLeft).toBe(2);
    controller.setPresentation(null);
    expect(view.document.activeElement).toBe(view.close);
    expect(view.panel.scrollTop).toBe(71); expect(view.panel.scrollLeft).toBe(2);
    focus.mockRestore();
    controller.registration().onClose();
    expect(view.document.activeElement).toBe(view.opener);
  });

  it('leaves ordinary focus scrolling authoritative before and after the pilot comparison', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, openers: [view.opener], onAction: vi.fn() });
    setFullView(readModel({ stage: 0 }));
    open(view);
    const research = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')!;
    research.open = true;
    research.querySelector<HTMLElement>('summary')!.focus();
    const nativeFocus = dom!.window.HTMLElement.prototype.focus;
    const focus = vi.spyOn(dom!.window.HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement, options?: FocusOptions) {
      nativeFocus.call(this, options);
      // Model the browser's lawful focus scroll, which jsdom does not perform.
      if (view.body.contains(this) && options?.preventScroll !== true) {
        view.panel.scrollTop = 9; view.panel.scrollLeft = 1;
      }
    });
    try {
      view.panel.scrollTop = 71; view.panel.scrollLeft = 2;
      setFullView(readModel({ stage: 0, miningDue: 3 }));
      expect(focus).toHaveBeenLastCalledWith();
      expect(view.panel.scrollTop).toBe(9); expect(view.panel.scrollLeft).toBe(1);
      view.panel.scrollTop = 71; view.panel.scrollLeft = 2;
      controller.setPresentation({ mode: 'audiovisual-pilot', starterScoutImageUrl: '/assets/scout.webp' });
      expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
      expect(view.panel.scrollTop).toBe(71); expect(view.panel.scrollLeft).toBe(2);
      controller.setPresentation(null);
      expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
      expect(view.panel.scrollTop).toBe(71); expect(view.panel.scrollLeft).toBe(2);
      view.panel.scrollTop = 93; view.panel.scrollLeft = 3;
      setFullView(readModel({ stage: 0, miningDue: 4 }));
      expect(focus).toHaveBeenLastCalledWith();
      expect(view.panel.scrollTop).toBe(9); expect(view.panel.scrollLeft).toBe(1);
      expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')!.open).toBe(true);
      expect(view.document.activeElement).toBe(view.body.querySelector('[data-engineering-section="research"]>summary'));
    } finally { focus.mockRestore(); }
  });

  it('keeps protected pilot inspection independently available and switches upgraded ships back to their native preview', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    controller.setPresentation({ mode: 'audiovisual-pilot', starterScoutImageUrl: '/assets/scout.webp' });
    controller.setView(protectedView(0));
    open(view);
    expect(view.body.querySelector('[data-shipyard-candidate]')).not.toBeNull();
    expect(view.body.querySelectorAll('[data-engineering-action]')).toHaveLength(0);
    expect(view.body.querySelector('[data-engineering-state="unavailable"]')!.textContent)
      .toBe('Engineering details and actions are unavailable while this expedition is protected.');
    setFullView(readModel({ stage: 2 }));
    expect(view.body.querySelector('[data-shipyard-candidate]')).toBeNull();
    expect([...view.body.querySelectorAll('[data-hardpoint]')].map((node) => node.getAttribute('data-hardpoint')))
      .toEqual(['array', 'autoext']);
    expect(controller.diagnostics()).toMatchObject({ activeCount: 1, activePreviewCount: 1, retainedPreviewCount: 0, faultCount: 0 });
    expect(() => controller!.setPresentation({ mode: 'audiovisual-pilot', starterScoutImageUrl: ' ' })).toThrow('nonempty image URL');
    expect(view.body.querySelector('[data-shipyard-candidate]')).toBeNull();
  });


  it('owns one static shell with independent action, summary, and 320px bounds controls', () => {
    const index = fs.readFileSync(path.join(here, '../apps/game/index.html'), 'utf8');
    expect(touchFloorContract(index, '#shipyardpanel button.engineering-action')).toBe(true);
    expect(touchFloorContract(index, '#shipyardpanel details.engineering-section > summary')).toBe(true);
    expect(bounded320Contract(index)).toEqual({
      valid: true,
      viewportWidth: 320,
      panelBorderBoxWidth: 304,
      panelContentWidth: 274,
    });

    const shortAction = index.replace(
      'max-width: 100%; min-width: 44px; min-height: 44px;',
      'max-width: 100%; min-width: 44px; min-height: 43px;',
    );
    expect(shortAction).not.toBe(index);
    expect(touchFloorContract(shortAction, '#shipyardpanel button.engineering-action')).toBe(false);
    expect(touchFloorContract(shortAction, '#shipyardpanel details.engineering-section > summary')).toBe(true);
    expect(bounded320Contract(shortAction).valid).toBe(true);

    const shortSummary = index.replace(
      'min-height: 44px; box-sizing: border-box; padding: 7px 10px; cursor: pointer;',
      'min-height: 43px; box-sizing: border-box; padding: 7px 10px; cursor: pointer;',
    );
    expect(shortSummary).not.toBe(index);
    expect(touchFloorContract(shortSummary, '#shipyardpanel details.engineering-section > summary')).toBe(false);
    expect(touchFloorContract(shortSummary, '#shipyardpanel button.engineering-action')).toBe(true);
    expect(bounded320Contract(shortSummary).valid).toBe(true);

    const forcedWideAt320 = index.replace(
      '</style>',
      '  @media (max-width: 360px) { .engineering-row { min-width: 380px; } }\n  </style>',
    );
    expect(forcedWideAt320).not.toBe(index);
    expect(bounded320Contract(forcedWideAt320).valid).toBe(false);
    expect(touchFloorContract(forcedWideAt320, '#shipyardpanel button.engineering-action')).toBe(true);
    expect(touchFloorContract(forcedWideAt320, '#shipyardpanel details.engineering-section > summary')).toBe(true);

    const missingBody = index.replace(
      '<div class="engineering-panel-body" data-engineering-panel-body></div>',
      '',
    );
    expect(missingBody).not.toBe(index);
    expect(bounded320Contract(missingBody).valid).toBe(false);
  });

  it('renders all native groups in model order with exact costs, reasons, and dormant-effect refusal', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    setFullView(readModel());
    open(view);

    expect([...view.body.querySelectorAll('details > summary')].map((summary) => summary.textContent))
      .toEqual(['Mining', 'Stellar Skimming', 'Research Bench', 'Fabricator']);
    expect([...view.body.querySelectorAll<HTMLElement>('[data-research-id]')].map((row) => row.dataset.researchId))
      .toEqual(ENGINEERING_RESEARCH_ORDER);
    expect([...view.body.querySelectorAll<HTMLElement>('[data-fabrication-group]')].map((row) => row.dataset.fabricationGroup))
      .toEqual(['parts', 'systems']);
    expect([...view.body.querySelectorAll<HTMLElement>('[data-recipe-id]')].map((row) => row.dataset.recipeId))
      .toEqual(['plate', 'wire', 'jumpdrive', 'autoext']);

    const scan = view.body.querySelector<HTMLElement>('[data-research-id="scan1"]')!;
    expect(scan.textContent).toContain('Iron (Fe) — 6 required / 8 owned');
    expect(scan.textContent).toContain('Silicon (Si) — 4 required / 3 owned');
    expect(scan.textContent).toContain('Stardust: 20 required / 200 owned');
    expect(scan.textContent).toContain('Signature: None');
    expect(scan.textContent).toContain('Prerequisite: None');

    const hull = view.body.querySelector<HTMLElement>('[data-research-id="hull1"]')!;
    const hullButton = hull.querySelector<HTMLButtonElement>('[data-engineering-action="research"]')!;
    expect(hull.querySelector('[data-engineering-unavailable]')?.getAttribute('data-engineering-unavailable'))
      .toBe('Gameplay effect is not connected.');
    expect(hullButton.disabled).toBe(true);
    expect(hullButton.title).toBe('Gameplay effect is not connected.');

    const autoExtractor = view.body.querySelector<HTMLElement>('[data-recipe-id="autoext"]')!;
    const autoButton = autoExtractor.querySelector<HTMLButtonElement>('[data-engineering-action="fabricate"]')!;
    expect(autoExtractor.dataset.status).toBe('available');
    expect(autoExtractor.querySelector('[data-effect-support="unavailable"]')?.textContent)
      .toBe('Gameplay effect is not connected; fabrication is unavailable. Background accrual would otherwise be invisible.');
    expect(autoButton.disabled).toBe(true);
    expect(autoButton.title).toBe('Gameplay effect is not connected; fabrication is unavailable.');
    expect(autoExtractor.textContent).toContain('Servo Rig (servo) — 2 required / 2 owned');
    expect(autoExtractor.textContent).toContain('Signature: Stone Signature (stone) — owned');
    expect(autoExtractor.textContent).toContain('Prerequisite: Jump Drive (jumpdrive) — owned');
    expect(autoExtractor.textContent).toContain('Output: 1 × Auto-Extractor (permanent-system) · Owned: 0 · Capacity remaining: 1');
  });

  it('preserves conditional zero/null facts and escapes hostile model text through DOM construction', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    setFullView(readModel({
      miningStatus: 'waiting',
      miningDetail: 'Next active-play cadence has not settled.',
      miningLocation: '<img id="hostile-location" src=x onerror=alert(1)>',
      miningDue: 0,
      hostileRecipeName: '<script id="hostile-recipe">window.pwned=1</script>',
    }));
    open(view);

    expect(view.body.querySelector('#hostile-location')).toBeNull();
    expect(view.body.querySelector('#hostile-recipe')).toBeNull();
    expect(view.body.textContent).toContain('<img id="hostile-location" src=x onerror=alert(1)>');
    expect(view.body.textContent).toContain('<script id="hostile-recipe">window.pwned=1</script>');
    expect(view.body.querySelector('[data-engineering-fact="auto-extractor-due"]')?.textContent)
      .toBe('Auto-Extractor due: 0');
    expect(view.body.querySelectorAll('[data-deposit-grade]')).toHaveLength(1);
    expect(view.body.querySelector('[data-deposit-id="Si"] [data-deposit-grade]')).toBeNull();
    expect(view.body.querySelector('[data-engineering-status="mining"]')?.textContent)
      .toBe('Waiting · Next active-play cadence has not settled.');
    const mine = view.body.querySelector<HTMLButtonElement>('[data-engineering-action="mine"]')!;
    expect(mine.disabled).toBe(true);
    expect(mine.title).toBe('Next active-play cadence has not settled.');
  });

  it('routes an available fully exceptional gear row through the native Fabricate action', () => {
    const view = shell();
    const onAction = vi.fn();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction });
    setFullView(readModel({ exceptionalRecipe: true }));
    open(view);
    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!.open = true;
    const row = view.body.querySelector<HTMLElement>('[data-recipe-id="meteor"]')!;
    const button = row.querySelector<HTMLButtonElement>('[data-engineering-action="fabricate"]')!;
    expect(row.dataset.status).toBe('available');
    expect(button.disabled).toBe(false);
    button.click();
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith({ operation: 'fabricate', id: 'meteor' });
  });

  it('emits identical frozen requests for pointer and keyboard-native clicks and latches double activation', () => {
    const requests: EngineeringPanelActionRequest[] = [];
    const onAction = vi.fn((request: EngineeringPanelActionRequest) => requests.push(request));
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction });
    setFullView(readModel());
    open(view);
    const scan = view.body.querySelector<HTMLButtonElement>(
      '[data-research-id="scan1"] [data-engineering-action="research"]',
    )!;

    scan.dispatchEvent(new dom!.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    scan.dispatchEvent(new dom!.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(requests[0]).toEqual({ operation: 'research', id: 'scan1' });
    expect(Object.isFrozen(requests[0])).toBe(true);
    expect(controller.diagnostics().pendingWork).toBe(1);

    controller.setPending(null);
    scan.dispatchEvent(new dom!.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onAction).toHaveBeenCalledTimes(1);
    scan.dispatchEvent(new dom!.window.MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(requests[1]).toEqual(requests[0]);
    expect(Object.isFrozen(requests[1])).toBe(true);
  });

  it('keeps all facts and the exact preview unmodified while a request awaits external settlement', () => {
    const onAction = vi.fn();
    const view = shell();
    const model = readModel();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction });
    setFullView(model);
    open(view);
    const beforeModel = JSON.stringify(model);
    const preview = view.body.querySelector('[data-cf-shipyard-preview="v1"]');
    const remaining = view.body.querySelector('[data-engineering-fact="mining-remaining"]')?.textContent;
    const output = view.body.querySelector('[data-recipe-id="plate"] [data-output-kind]')?.textContent;
    const mine = view.body.querySelector<HTMLButtonElement>('[data-engineering-action="mine"]')!;

    mine.click();
    expect(onAction).toHaveBeenCalledOnce();
    expect(view.body.querySelector('[data-cf-shipyard-preview="v1"]')).toBe(preview);
    expect(view.body.querySelector('[data-engineering-fact="mining-remaining"]')?.textContent).toBe(remaining);
    expect(view.body.querySelector('[data-recipe-id="plate"] [data-output-kind]')?.textContent).toBe(output);
    expect(view.body.querySelector('[data-engineering-status="mining"]')?.getAttribute('data-status')).toBe('ready');
    expect(JSON.stringify(model)).toBe(beforeModel);
    expect(Object.isFrozen(model)).toBe(true);
  });

  it('keeps one capability-derived preview while protected across full, close, reopen, and full restoration', () => {
    const onAction = vi.fn();
    const view = shell();
    controller = new EngineeringPanelController({
      panel: view.panel,
      body: view.body,
      openers: [view.opener],
      onAction,
    });
    setFullView(readModel({ stage: 2 }));
    open(view);
    const fullPreview = view.body.querySelector<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')!;
    const stateKey = fullPreview.dataset.stateKey!;
    expect(view.body.querySelectorAll('[data-engineering-section]')).toHaveLength(4);
    expect(view.body.querySelectorAll('[data-engineering-action]').length).toBeGreaterThan(0);
    expect(controller.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      previewStateKey: stateKey,
      retainedPreviewCount: 0,
      faultCount: 0,
    });

    const protectedReason = 'Engineering details and actions are unavailable while this expedition is protected.';
    controller.setView(protectedView(2, protectedReason));
    const protectedPreview = view.body.querySelector<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')!;
    expect(protectedPreview).not.toBe(fullPreview);
    expect(fullPreview.isConnected).toBe(false);
    expect(protectedPreview.dataset.stateKey).toBe(stateKey);
    expect(view.body.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    expect(view.body.querySelectorAll('[data-engineering-section]')).toHaveLength(0);
    expect(view.body.querySelectorAll('[data-engineering-action]')).toHaveLength(0);
    expect(view.body.querySelector('[data-engineering-state="unavailable"]')?.textContent)
      .toBe(protectedReason);
    expect(view.body.querySelector('[data-engineering-unavailable]')?.getAttribute('data-engineering-unavailable'))
      .toBe(protectedReason);
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 1,
      actionControlCount: 0,
      activePreviewCount: 1,
      previewStateKey: stateKey,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
    expect(onAction).not.toHaveBeenCalled();

    controller.registration().onClose();
    expect(protectedPreview.isConnected).toBe(false);
    expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(0);
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 0,
      activePreviewCount: 0,
      previewStateKey: null,
      retainedPreviewCount: 0,
      faultCount: 0,
    });

    open(view);
    const reopenedPreview = view.body.querySelector<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')!;
    expect(reopenedPreview.dataset.stateKey).toBe(stateKey);
    expect(view.body.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    expect(view.body.querySelectorAll('[data-engineering-action]')).toHaveLength(0);
    expect(controller.diagnostics().previewStateKey).toBe(stateKey);

    setFullView(readModel({ stage: 2 }));
    expect(reopenedPreview.isConnected).toBe(false);
    expect(view.body.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    expect(view.body.querySelectorAll('[data-engineering-section]')).toHaveLength(4);
    expect(view.body.querySelectorAll('[data-engineering-action]').length).toBeGreaterThan(0);
    expect(view.body.querySelector('[data-engineering-state="unavailable"]')).toBeNull();
    expect(controller.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      previewStateKey: stateKey,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
  });

  it('rejects mismatched or internally contradictory atomic views before replacing protected paint', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    controller.setView(protectedView(1));
    open(view);
    const protectedPreview = view.body.querySelector<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')!;
    const protectedKey = protectedPreview.dataset.stateKey!;
    const engineering = readModel({ stage: 2 });
    const mismatched = Object.freeze({
      ship: deepFreeze(ship(3)),
      engineering,
      reason: null,
    } satisfies EngineeringPanelView);

    expect(() => controller!.setView(mismatched))
      .toThrow('engineering model ship must match the standalone capability-derived ship');
    expect(view.body.querySelector('[data-cf-shipyard-preview="v1"]')).toBe(protectedPreview);
    expect(controller.diagnostics().previewStateKey).toBe(protectedKey);
    expect(view.body.querySelectorAll('[data-engineering-action]')).toHaveLength(0);

    expect(() => controller!.setView(Object.freeze({
      ship: deepFreeze(ship(1)),
      engineering: null,
      reason: null,
    } as unknown as EngineeringPanelView))).toThrow('requires a precise unavailable reason');
    expect(() => controller!.setView(Object.freeze({
      ship: engineering.ship,
      engineering,
      reason: 'contradictory protected reason',
    }))).toThrow('must have a null unavailable reason');
    expect(view.body.querySelector('[data-cf-shipyard-preview="v1"]')).toBe(protectedPreview);
    expect(controller.diagnostics()).toMatchObject({
      previewStateKey: protectedKey,
      activePreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
  });

  it('reports only an agreeing live preview-owner/DOM key and exposes tamper or duplicate controls', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    controller.setView(protectedView(2));
    open(view);
    const preview = view.body.querySelector<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')!;
    const stateKey = preview.dataset.stateKey!;
    expect(controller.diagnostics()).toMatchObject({
      previewStateKey: stateKey,
      activePreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 0,
    });

    preview.dataset.stateKey = 'forged-preview-key';
    expect(controller.diagnostics()).toMatchObject({
      previewStateKey: null,
      activePreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 1,
    });
    preview.dataset.stateKey = stateKey;
    expect(controller.diagnostics()).toMatchObject({ previewStateKey: stateKey, faultCount: 0 });

    const duplicate = preview.cloneNode(true) as SVGSVGElement;
    preview.parentElement!.append(duplicate);
    const duplicated = controller.diagnostics();
    expect(duplicated.previewStateKey).toBeNull();
    expect(duplicated.activePreviewCount).toBe(1);
    expect(duplicated.retainedPreviewCount).toBe(1);
    expect(duplicated.faultCount).toBeGreaterThan(0);

    controller.setView(protectedView(2));
    expect(view.body.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    expect(controller.diagnostics()).toMatchObject({
      previewStateKey: stateKey,
      activePreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
  });

  it('rejects a same-key clone substituted for the exact owned preview and cleans both on Close', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    controller.setView(protectedView(2));
    open(view);
    const preview = view.body.querySelector<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')!;
    const mount = preview.parentElement!;
    const substitute = preview.cloneNode(true) as SVGSVGElement;

    mount.remove();
    view.body.append(substitute);
    expect(preview.parentElement).toBe(mount);
    expect(preview.isConnected).toBe(false);
    expect(substitute.isConnected).toBe(true);
    expect(substitute.dataset.stateKey).toBe(preview.dataset.stateKey);
    expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    expect(controller.diagnostics()).toMatchObject({
      previewStateKey: null,
      activePreviewCount: 0,
      retainedPreviewCount: 1,
    });
    expect(controller.diagnostics().faultCount).toBeGreaterThan(0);

    controller.registration().onClose();
    expect(preview.isConnected).toBe(false);
    expect(preview.parentElement).toBeNull();
    expect(substitute.isConnected).toBe(false);
    expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(0);
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 0,
      previewStateKey: null,
      activePreviewCount: 0,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
  });

  it.each([
    ['pointer click', 1],
    ['Enter-native click', 0],
  ] as const)('parks its exact %s action before a deferred native blur and restores it after settlement', (
    _activation,
    detail,
  ) => {
    const view = shell();
    const flushDeferredBrowserBlur = emulateDeferredBrowserFocusLossWhenDisabled(view.document);
    const negativeControl = view.document.createElement('button');
    view.document.body.append(negativeControl);
    negativeControl.focus();
    negativeControl.disabled = true;
    expect(view.document.activeElement === negativeControl).toBe(true);
    flushDeferredBrowserBlur();
    expect(view.document.activeElement === view.document.body).toBe(true);
    negativeControl.remove();
    const onAction = vi.fn((request: EngineeringPanelActionRequest) => controller!.setPending(request));
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction });
    setFullView(readModel());
    open(view);
    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!.open = true;
    const plate = view.body.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    plate.focus();
    plate.dispatchEvent(new dom!.window.MouseEvent('click', { bubbles: true, detail }));
    expect(plate.disabled).toBe(true);
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    flushDeferredBrowserBlur();
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);

    controller.setPending(null);
    expect(plate.disabled).toBe(false);
    expect(ownsExactSettlementFocus(
      view.document,
      'recipe:plate',
      'action:fabricate:plate',
    )).toBe(true);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('rejects unrelated BODY focus when no disable transition proved its ownership', () => {
    const view = shell();
    const onAction = vi.fn((request: EngineeringPanelActionRequest) => controller!.setPending(request));
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction });
    setFullView(readModel());
    open(view);
    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!.open = true;
    const plate = view.body.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    plate.focus();
    plate.click();
    /* The controller owns the semantic parking target. A later user move to
       BODY is unrelated to the native action transition and must not be used
       as authority to restore the exact action. */
    expect(plate.disabled).toBe(true);
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    view.document.body.tabIndex = -1;
    view.document.body.focus();
    expect(view.document.activeElement === view.document.body).toBe(true);

    controller.setPending(null);
    expect(plate.disabled).toBe(false);
    expect(view.document.activeElement === view.document.body).toBe(true);
    expect(ownsExactSettlementFocus(
      view.document,
      'recipe:plate',
      'action:fabricate:plate',
    )).toBe(false);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('clears pending focus ownership on close and dispose while the exact opener wins', () => {
    const onAction = vi.fn();
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    controller = new EngineeringPanelController({
      panel: view.panel,
      body: view.body,
      openers: [view.opener],
      onAction,
    });
    setFullView(readModel());
    open(view);
    const firstMine = view.body.querySelector<HTMLButtonElement>('[data-engineering-action="mine"]')!;
    firstMine.focus();
    firstMine.click();
    expect(view.document.activeElement === view.document.body).toBe(true);
    controller.setPending({ operation: 'mine' });
    expect(view.body.querySelectorAll('button[data-engineering-action]:not(:disabled)')).toHaveLength(0);
    expect(view.close.disabled).toBe(false);

    controller.registration().onClose();
    expect(view.document.activeElement).toBe(view.opener);
    expect(view.body.childElementCount).toBe(0);
    expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(0);
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 0,
      retainedDomCount: 0,
      pendingWork: 1,
      actionControlCount: 0,
      activePreviewCount: 0,
      previewStateKey: null,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
    expect(onAction).toHaveBeenCalledOnce();

    open(view);
    expect(view.body.getAttribute('aria-busy')).toBe('true');
    expect(view.body.querySelector('[data-engineering-pending]')?.hasAttribute('hidden')).toBe(false);
    expect(view.body.querySelectorAll('button[data-engineering-action]:not(:disabled)')).toHaveLength(0);
    expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    view.body.querySelector<HTMLButtonElement>('[data-engineering-action="mine"]')!
      .dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).toHaveBeenCalledOnce();

    controller.setPending(null);
    expect(view.body.getAttribute('aria-busy')).toBe('false');
    expect(view.body.querySelector<HTMLButtonElement>('[data-engineering-action="mine"]')?.disabled).toBe(false);
    expect(view.document.activeElement === view.opener).toBe(true);

    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!.open = true;
    const pendingPlate = view.body.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    pendingPlate.focus();
    pendingPlate.click();
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    controller.setPending({ operation: 'fabricate', id: 'plate' });
    controller.dispose();
    expect(view.document.activeElement === view.opener).toBe(true);
    expect(view.body.childElementCount).toBe(0);
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 0,
      pendingWork: 0,
      actionControlCount: 0,
      delegatedListenerCount: 0,
      lastRequest: null,
    });
  });

  it('reopens native disclosure owners before focus restoration and restores the opener on close', () => {
    const view = shell();
    controller = new EngineeringPanelController({
      panel: view.panel,
      body: view.body,
      openers: [view.opener],
      onAction: vi.fn(),
    });
    setFullView(readModel());
    open(view);
    const mining = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="mining"]')!;
    const research = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')!;
    const fabricator = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!;
    const firstScan = view.body.querySelector<HTMLButtonElement>(
      '[data-research-id="scan1"] [data-engineering-action="research"]',
    )!;
    /* jsdom will focus a descendant of closed <details>; a browser will not.
       Keep that historical false-green state as the deliberate red control. */
    expect(research.open).toBe(false);
    expect(browserFocusEligible(firstScan)).toBe(false);
    mining.open = false;
    research.open = true;
    fabricator.open = true;
    expect(browserFocusEligible(firstScan)).toBe(true);
    firstScan.focus();
    expect(view.document.activeElement).toBe(firstScan);
    setFullView(readModel({ miningDue: 3 }));
    const secondScan = view.body.querySelector<HTMLButtonElement>(
      '[data-research-id="scan1"] [data-engineering-action="research"]',
    )!;
    expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="mining"]')?.open).toBe(false);
    expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')?.open).toBe(true);
    expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')?.open).toBe(true);
    expect(browserFocusEligible(secondScan)).toBe(true);
    expect(secondScan).not.toBe(firstScan);
    expect(view.document.activeElement).toBe(secondScan);

    setFullView(readModel({ scanStatus: 'owned', scanReason: 'Already researched.' }));
    const semanticRow = view.body.querySelector<HTMLElement>('[data-semantic-key="research:scan1"]')!;
    expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')?.open).toBe(true);
    expect(browserFocusEligible(semanticRow)).toBe(true);
    expect(view.document.activeElement).toBe(semanticRow);
    expect(semanticRow.querySelector<HTMLButtonElement>('[data-engineering-action="research"]')?.disabled).toBe(true);

    controller.registration().onClose();
    expect(view.document.activeElement).toBe(view.opener);
  });

  it('retains one pre-disable action identity through repeated busy settlement renders', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    const onAction = vi.fn((request: EngineeringPanelActionRequest) => controller!.setPending(request));
    controller = new EngineeringPanelController({
      panel: view.panel,
      body: view.body,
      openers: [view.opener],
      onAction,
    });
    setFullView(readModel());
    open(view);
    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!.open = true;
    const firstPlate = view.body.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    firstPlate.focus();
    firstPlate.click();
    expect(onAction).toHaveBeenLastCalledWith({ operation: 'fabricate', id: 'plate' });
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    let priorPlate = firstPlate;
    let settledPlate: HTMLButtonElement | null = null;
    for (const miningDue of [3, 4, 5]) {
      setFullView(readModel({ miningDue }));
      const plateRow = view.body.querySelector<HTMLElement>('[data-semantic-key="recipe:plate"]')!;
      settledPlate = plateRow.querySelector<HTMLButtonElement>('[data-engineering-action="fabricate"]')!;
      expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')?.open).toBe(true);
      expect(settledPlate !== priorPlate).toBe(true);
      expect(settledPlate.disabled).toBe(true);
      expect(view.document.activeElement === plateRow).toBe(true);
      priorPlate = settledPlate;
    }
    const finalPlate = settledPlate!;
    const wrongSemanticOwner = view.body.querySelector<HTMLElement>('[data-semantic-key="research:hull1"]')!;
    const duplicateKeyWrongRow = finalPlate.cloneNode(true) as HTMLButtonElement;
    wrongSemanticOwner.prepend(duplicateKeyWrongRow);
    controller.setPending(null);
    expect(finalPlate.disabled).toBe(false);
    expect(duplicateKeyWrongRow.disabled).toBe(false);
    expect(ownsExactSettlementFocus(
      view.document,
      'recipe:plate',
      'action:fabricate:plate',
    )).toBe(true);
    expect(view.document.activeElement === duplicateKeyWrongRow).toBe(false);
    duplicateKeyWrongRow.remove();

    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')!.open = true;
    const firstScan = view.body.querySelector<HTMLButtonElement>(
      '[data-research-id="scan1"] [data-engineering-action="research"]',
    )!;
    firstScan.focus();
    firstScan.click();
    expect(onAction).toHaveBeenLastCalledWith({ operation: 'research', id: 'scan1' });
    expect(ownsExactSettlementFocus(view.document, 'research:scan1', null)).toBe(true);
    let settledScan: HTMLButtonElement | null = null;
    for (const miningDue of [6, 7, 8]) {
      setFullView(readModel({
        miningDue,
        scanStatus: 'owned',
        scanReason: 'Already researched.',
      }));
      const scanRow = view.body.querySelector<HTMLElement>('[data-semantic-key="research:scan1"]')!;
      settledScan = scanRow.querySelector<HTMLButtonElement>('[data-engineering-action="research"]')!;
      expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="research"]')?.open).toBe(true);
      expect(settledScan.disabled).toBe(true);
      expect(ownsExactSettlementFocus(view.document, 'research:scan1', null)).toBe(true);
    }
    controller.setPending(null);
    expect(settledScan!.disabled).toBe(true);
    expect(ownsExactSettlementFocus(view.document, 'research:scan1', null)).toBe(true);
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('does not steal settlement focus after the player moves to a sibling, summary, or outside control', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    const onAction = vi.fn((request: EngineeringPanelActionRequest) => controller!.setPending(request));
    controller = new EngineeringPanelController({
      panel: view.panel,
      body: view.body,
      openers: [view.opener],
      onAction,
    });
    setFullView(readModel());
    open(view);
    view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!.open = true;

    const startPlate = (miningDue: number): void => {
      const action = view.body.querySelector<HTMLButtonElement>(
        '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
      )!;
      action.focus();
      action.click();
      expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
      setFullView(readModel({ miningDue }));
      expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    };

    startPlate(10);
    view.body.querySelector<HTMLElement>('[data-semantic-key="recipe:wire"]')!.focus();
    setFullView(readModel({ miningDue: 11 }));
    const replacementWire = view.body.querySelector<HTMLElement>('[data-semantic-key="recipe:wire"]')!;
    expect(view.document.activeElement === replacementWire).toBe(true);
    controller.setPending(null);
    expect(view.document.activeElement === replacementWire).toBe(true);
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', 'action:fabricate:plate')).toBe(false);

    const preRenderPlate = view.body.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    preRenderPlate.focus();
    preRenderPlate.click();
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    view.body.querySelector<HTMLElement>('[data-engineering-section="fabricator"] > summary')!.focus();
    setFullView(readModel({ miningDue: 13 }));
    const replacementSummary = view.body.querySelector<HTMLElement>(
      '[data-engineering-section="fabricator"] > summary',
    )!;
    expect(view.document.activeElement === replacementSummary).toBe(true);
    controller.setPending(null);
    expect(view.document.activeElement === replacementSummary).toBe(true);
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', 'action:fabricate:plate')).toBe(false);

    startPlate(14);
    view.opener.focus();
    setFullView(readModel({ miningDue: 15 }));
    expect(view.document.activeElement === view.opener).toBe(true);
    controller.setPending(null);
    expect(view.document.activeElement === view.opener).toBe(true);
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', 'action:fabricate:plate')).toBe(false);
    expect(onAction).toHaveBeenCalledTimes(3);
  });

  it('keeps a player-closed pending disclosure closed without hidden focus restoration', () => {
    const view = shell();
    emulateBrowserFocusLossWhenDisabled(view.document);
    const onAction = vi.fn((request: EngineeringPanelActionRequest) => controller!.setPending(request));
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction });
    setFullView(readModel());
    open(view);
    const fabricator = view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')!;
    fabricator.open = true;
    const plate = fabricator.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    plate.focus();
    plate.click();
    expect(ownsExactSettlementFocus(view.document, 'recipe:plate', null)).toBe(true);
    const liveSummary = fabricator.querySelector<HTMLElement>(':scope > summary')!;
    liveSummary.focus();
    fabricator.open = false;

    setFullView(readModel({ miningDue: 20 }));
    expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')?.open).toBe(false);
    const closedSummary = view.body.querySelector<HTMLElement>(
      '[data-engineering-section="fabricator"] > summary',
    )!;
    expect(browserFocusEligible(closedSummary)).toBe(true);
    expect(view.document.activeElement).toBe(closedSummary);
    setFullView(readModel({ miningDue: 21 }));
    expect(view.body.querySelector<HTMLDetailsElement>('[data-engineering-section="fabricator"]')?.open).toBe(false);
    const replacementSummary = view.body.querySelector<HTMLElement>(
      '[data-engineering-section="fabricator"] > summary',
    )!;
    expect(browserFocusEligible(replacementSummary)).toBe(true);
    expect(view.document.activeElement === replacementSummary).toBe(true);
    controller.setPending(null);
    const hiddenReplacement = view.body.querySelector<HTMLButtonElement>(
      '[data-recipe-id="plate"] [data-engineering-action="fabricate"]',
    )!;
    expect(hiddenReplacement.disabled).toBe(false);
    expect(browserFocusEligible(hiddenReplacement)).toBe(false);
    expect(view.document.activeElement === replacementSummary).toBe(true);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('retains all four chassis through the real preview owner and reaches zero ownership on close/dispose', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    const expected = ['scout-chemical', 'jump-interstellar', 'survey-cruiser-array', 'frontier-intergalactic'];
    setFullView(readModel({ stage: 0 }));
    open(view);
    for (let stage = 0; stage < 4; stage++) {
      setFullView(readModel({ stage: stage as ShipVisualState['chassisStage'] }));
      expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
      expect(view.panel.querySelector('[data-layer="chassis"]')?.getAttribute('data-silhouette')).toBe(expected[stage]);
      expect(controller.diagnostics()).toMatchObject({
        activeCount: 1,
        activePreviewCount: 1,
        retainedPreviewCount: 0,
        faultCount: 0,
      });
    }
    controller.registration().onClose();
    expect(view.panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')).toHaveLength(0);
    controller.dispose();
    expect(controller.diagnostics()).toEqual({
      schema: 'cf-v2-engineering-panel-diagnostics/v1',
      activeCount: 0,
      retainedDomCount: 0,
      pendingWork: 0,
      actionControlCount: 0,
      activePreviewCount: 0,
      previewStateKey: null,
      retainedPreviewCount: 0,
      delegatedListenerCount: 0,
      faultCount: 0,
      lastRequest: null,
    });
  });

  it('rejects shallow/deep mutable, incomplete, or reordered projections before misleading paint', () => {
    const view = shell();
    controller = new EngineeringPanelController({ panel: view.panel, body: view.body, onAction: vi.fn() });
    const mutable = JSON.parse(JSON.stringify(readModel())) as EngineeringPanelReadModelV1;
    expect(() => setFullView(mutable)).toThrow('must be deeply frozen');

    const base = readModel();
    const mutableNestedStardust = {
      required: base.research[0]!.costs.stardust.required,
      owned: base.research[0]!.costs.stardust.owned,
    };
    const deepMutable = Object.freeze({
      ...base,
      research: Object.freeze([
        Object.freeze({
          ...base.research[0]!,
          costs: Object.freeze({
            ...base.research[0]!.costs,
            stardust: mutableNestedStardust,
          }),
        }),
        ...base.research.slice(1),
      ]),
    }) as EngineeringPanelReadModelV1;
    expect(Object.isFrozen(deepMutable)).toBe(true);
    expect(Object.isFrozen(mutableNestedStardust)).toBe(false);
    expect(() => setFullView(deepMutable)).toThrow('must be deeply frozen');

    const missingResearch = deepFreeze({
      ...JSON.parse(JSON.stringify(readModel())),
      research: JSON.parse(JSON.stringify(readModel().research.slice(0, 5))),
    }) as EngineeringPanelReadModelV1;
    expect(() => setFullView(missingResearch)).toThrow('all six ids in canonical order');

    const reordered = JSON.parse(JSON.stringify(readModel())) as EngineeringPanelReadModelV1;
    const first = reordered.research[0]!;
    (reordered.research as EngineeringPanelReadModelV1['research'][number][])[0] = reordered.research[1]!;
    (reordered.research as EngineeringPanelReadModelV1['research'][number][])[1] = first;
    expect(() => setFullView(deepFreeze(reordered))).toThrow('all six ids in canonical order');
    expect(view.body.childElementCount).toBe(0);
  });
});
