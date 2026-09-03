import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assessEngineeringDisclosureActivation,
  buildEngineeringDisclosureOutcomeExpression,
  buildEngineeringDisclosureSetupExpression,
} from '../tools/slicesmoke-contract.mjs';

interface TestWindow {
  readonly document: Document;
  readonly HTMLElement: { readonly prototype: HTMLElement };
  readonly KeyboardEvent: typeof KeyboardEvent;
  eval(source: string): unknown;
  close(): void;
}

interface TestDom { readonly window: TestWindow }

type Evidence = {
  sectionId: string;
  before: Record<string, any>;
  after: Record<string, any> & { keys: Array<Record<string, any>> };
};

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);

const cloneEvidence = (value: Evidence): Evidence => JSON.parse(JSON.stringify(value)) as Evidence;

function exerciseDisclosure({
  replace = false,
  dispatchOnBody = false,
  key = 'Enter',
}: Readonly<{
  replace?: boolean;
  dispatchOnBody?: boolean;
  key?: string;
}> = {}): { evidence: Evidence; original: HTMLElement; current: HTMLElement } {
  const dom = new JSDOM(`<!doctype html><body tabindex="-1"><aside id="shipyardpanel">
    <div data-engineering-panel-body>
      <details data-engineering-section="mining">
        <summary tabindex="0" data-focus-key="section:mining">Mining</summary>
      </details>
    </div>
  </aside></body>`, { runScripts: 'outside-only' });
  const view = dom.window;
  Object.defineProperty(view.HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      x: 0, y: 0, left: 0, top: 0, right: 240, bottom: 44,
      width: 240, height: 44, toJSON: () => ({}),
    }),
  });

  const before = view.eval(buildEngineeringDisclosureSetupExpression('mining')) as Record<string, any>;
  const original = view.document.querySelector<HTMLElement>(
    '#shipyardpanel details[data-engineering-section="mining"] > summary',
  )!;
  if (replace) {
    const oldDetails = original.parentElement!;
    const replacement = oldDetails.cloneNode(true) as HTMLElement;
    oldDetails.replaceWith(replacement);
  }
  const current = view.document.querySelector<HTMLElement>(
    '#shipyardpanel details[data-engineering-section="mining"] > summary',
  )!;
  current.focus();
  const event = new view.KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });
  (dispatchOnBody ? view.document.body : current).dispatchEvent(event);
  const details = current.parentElement as HTMLDetailsElement;
  details.open = !before.open;
  const after = view.eval(buildEngineeringDisclosureOutcomeExpression('mining')) as Evidence['after'];
  const evidence = { sectionId: 'mining', before, after };
  dom.window.close();
  return { evidence, original, current };
}

function withNativeTrust(evidence: Evidence): Evidence {
  const result = cloneEvidence(evidence);
  expect(result.after.keys).toHaveLength(1);
  result.after.keys[0]!.trusted = true;
  return result;
}

describe('Slice Shipyard disclosure semantic keyboard identity', () => {
  it('wires setup -> native Enter -> live outcome -> pure assessment in the real Slice owner', () => {
    const ownerStart = sliceSource.indexOf('    const toggleEngineeringDisclosure = async (id) => {');
    const ownerEnd = sliceSource.indexOf('    const shipyardDisclosureReceipts = [];', ownerStart);
    expect(ownerStart).toBeGreaterThan(-1);
    expect(ownerEnd).toBeGreaterThan(ownerStart);
    const owner = sliceSource.slice(ownerStart, ownerEnd);
    const setupAt = owner.indexOf('buildEngineeringDisclosureSetupExpression(id)');
    const dispatchAt = owner.indexOf("send('Input.dispatchKeyEvent'");
    const outcomeAt = owner.indexOf('buildEngineeringDisclosureOutcomeExpression(id)');
    const assessAt = owner.indexOf('assessEngineeringDisclosureActivation({ sectionId: id, before, after })');
    expect([setupAt, dispatchAt, outcomeAt, assessAt].every((at) => at >= 0)).toBe(true);
    expect(setupAt).toBeLessThan(dispatchAt);
    expect(dispatchAt).toBeLessThan(outcomeAt);
    expect(outcomeAt).toBeLessThan(assessAt);
    expect(owner).not.toContain("summary?.addEventListener('keydown'");
  });

  it('accepts the current semantic successor after forced body replacement', () => {
    const { evidence: raw, original, current } = exerciseDisclosure({ replace: true });
    expect(original).not.toBe(current);
    expect(original.isConnected).toBe(false);
    expect(raw.before.originalConnected).toBe(true);
    expect(raw.after.replacementObserved).toBe(true);
    expect(raw.after.originalConnected).toBe(false);
    expect(raw.after.keys[0]).toMatchObject({
      trusted: false,
      sectionId: 'mining',
      currentSectionId: 'mining',
      targetSectionId: 'mining',
      currentFocusKey: 'section:mining',
      targetFocusKey: 'section:mining',
      targetWasCurrent: true,
      activeWasCurrent: true,
      targetConnected: true,
      currentConnected: true,
      sameDocument: true,
    });
    expect(assessEngineeringDisclosureActivation(raw).reasons).toEqual(['trustedEnter']);
    expect(assessEngineeringDisclosureActivation(withNativeTrust(raw))).toMatchObject({
      ok: true,
      reasons: [],
    });
  });

  it('also accepts the connected original when no heartbeat replaces it', () => {
    const { evidence: raw, original, current } = exerciseDisclosure();
    expect(original).toBe(current);
    expect(raw.after.replacementObserved).toBe(false);
    expect(raw.after.originalConnected).toBe(true);
    expect(assessEngineeringDisclosureActivation(withNativeTrust(raw)).ok).toBe(true);
  });

  it('negative-controls wrong target, key, focus, current identity, and replacement lineage', () => {
    const baseline = withNativeTrust(exerciseDisclosure({ replace: true }).evidence);
    const cases: ReadonlyArray<readonly [string, (candidate: Evidence) => void, string]> = [
      ['wrong target', (candidate) => { candidate.after.keys[0]!.targetWasCurrent = false; }, 'liveTargetIdentity'],
      ['wrong key', (candidate) => { candidate.after.keys[0]!.key = 'Space'; }, 'trustedEnter'],
      ['lost focus', (candidate) => { candidate.after.keys[0]!.activeWasCurrent = false; }, 'liveFocus'],
      ['wrong focus key', (candidate) => { candidate.after.keys[0]!.currentFocusKey = 'section:research'; }, 'liveTargetIdentity'],
      ['stale replacement lineage', (candidate) => { candidate.after.originalConnected = true; }, 'replacementLineage'],
      ['missing receipt', (candidate) => { candidate.after.keys = []; }, 'oneReceipt'],
    ];
    for (const [label, mutate, reason] of cases) {
      const candidate = cloneEvidence(baseline);
      mutate(candidate);
      const assessment = assessEngineeringDisclosureActivation(candidate);
      expect(assessment.ok, label).toBe(false);
      expect(assessment.reasons, label).toContain(reason);
    }

    const wrongOrigin = withNativeTrust(exerciseDisclosure({
      replace: true,
      dispatchOnBody: true,
    }).evidence);
    const wrongOriginAssessment = assessEngineeringDisclosureActivation(wrongOrigin);
    expect(wrongOriginAssessment.ok).toBe(false);
    expect(wrongOriginAssessment.reasons).toContain('liveTargetIdentity');
  });

  it('rejects empty section identities before creating browser expressions', () => {
    expect(() => buildEngineeringDisclosureSetupExpression('')).toThrow(TypeError);
    expect(() => buildEngineeringDisclosureOutcomeExpression('')).toThrow(TypeError);
  });
});
