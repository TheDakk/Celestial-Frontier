import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

const glass = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const frames = readFileSync(new URL('../tools/ui-review-evaluation.mjs', import.meta.url), 'utf8');
const extract = (source: string, start: string, end: string) => {
  expect(source.split(start)).toHaveLength(2); expect(source.split(end)).toHaveLength(2);
  return source.slice(source.indexOf(start), source.indexOf(end)).replace(/^export /gm, '');
};
const helpers = extract(glass, 'export function paintedPostCloseFixedRows(', 'const here = path.dirname(');
const frameOwners = frames.slice(frames.indexOf('export function assessReviewFrameSettlement(')).replace(/^export /gm, '');
const outcomes = extract(glass, 'function exactOwnedStyleProperty(', 'function portraitControlCampaignOutcome(');
const caller = extract(glass, '            const portraitControls = await evalIn(`', '            portraitEligibleBaselineCount += 1;');
const declaration = (name: string) => {
  const matches = [...glass.matchAll(new RegExp('const ' + name + ' = `([\\s\\S]*?)`;', 'g'))];
  expect(matches).toHaveLength(1);
  const body = matches[0]?.[1];
  if (typeof body !== 'string') throw new Error('missing declaration: ' + name);
  return 'const ' + name + ' = `' + body + '`;';
};
const labels = ['portrait.fixture.injected', 'portrait.band.mutated', 'portrait.band.restored',
  'portrait.fallback.mutated', 'portrait.fallback.restored', 'portrait.fixture.cleanup-contained', 'portrait.fixture.native-restored']
  .map(label => label + '.fonts-two-frames');

function fixture(options: { badInjected?: boolean; failedLabels?: string[]; manualFrames?: boolean } = {}) {
  let at = 0, sideTop = 160, headerHeight = 60;
  const events: string[] = [], callbacks: Array<() => void> = [], nodes = new Map<string, any>();
  const window: any = { dispatchEvent: () => events.push('resize') };
  const lastFrame = () => window.__cfU1ReviewFrameSettlements?.invocations?.at(-1);
  const box = (left: number, top: number, width: number, height: number) => ({ left, top, right: left + width, bottom: top + height, width, height });
  const fallback = () => nodes.get('html').style.getPropertyValue('--safe-bottom') !== '';
  function node(id: string, rect: () => any) {
    let attribute: string | null = null;
    const props = new Map<string, { value: string; priority: string }>();
    const el: any = { id, children: [], textContent: id, scrollTop: 0, clientHeight: 72, scrollHeight: 72,
      display: 'block', opacity: '1', pointerEvents: 'auto', visibility: 'visible',
      style: {
        setProperty: (key: string, value: string, priority = '') => {
          props.set(key, { value, priority }); attribute = [...props].map(([k, p]) => k + ':' + p.value + (p.priority ? '!important' : '')).join(';');
        },
        removeProperty: (key: string) => { props.delete(key); attribute = [...props].map(([k, p]) => k + ':' + p.value).join(';'); },
        getPropertyValue: (key: string) => props.get(key)?.value ?? '',
        getPropertyPriority: (key: string) => props.get(key)?.priority ?? '',
      },
      getBoundingClientRect: () => {
        if (lastFrame()?.status === 'pending') throw new Error('geometry read before named boundary');
        return rect();
      },
      hasAttribute: () => attribute !== null,
      getAttribute: () => attribute,
      setAttribute: (_key: string, value: string) => { attribute = value; props.clear(); },
      removeAttribute: () => { attribute = null; props.clear(); },
      contains: (other: any) => other === el || el.children.includes(other),
      querySelector: () => null,
    };
    nodes.set(id, el); return el;
  }
  const html = node('html', () => box(0, 0, 320, 568));
  const header = node('topbar', () => box(0, 0, 320, headerHeight)); header.pointerEvents = 'none';
  const player = node('playerchip', () => box(10, 10, 100, 44));
  const hp = node('hpbar', () => box(120, 10, 90, 44));
  const objective = node('objchip', () => box(220, 10, 90, 44));
  const search = node('searchbox', () => box(0, 0, 0, 0)); search.display = 'none';
  const actions = node('sceneactions', () => box(0, 0, 0, 0)); actions.display = 'none';
  const trail = node('trail', () => {
    if (trail.style.getPropertyValue('display') === '' || fallback()) return box(0, 0, 0, 0);
    return box(parseFloat(trail.style.getPropertyValue('left')) || 0, parseFloat(trail.style.getPropertyValue('top')) || 0,
      parseFloat(trail.style.getPropertyValue('width')) || 280, parseFloat(trail.style.getPropertyValue('height')) || 24);
  });
  trail.querySelector = () => ({ textContent: 'Earth' }); trail.textContent = 'Sol › Earth'; header.children = [player, hp, trail];
  const sideRect = () => {
    const transform = nodes.get('planetside').style.getPropertyValue('transform');
    const dy = transform ? parseFloat(transform.slice('translateY('.length)) : 0;
    const short = options.badInjected && lastFrame()?.label === labels[0];
    return box(10, sideTop + dy, 300, short ? 60 : 72);
  };
  const side = node('planetside', sideRect);
  const heading = node('heading', () => box(20, sideRect().top + 8, 100, 20));
  const specimen = node('specimen', () => box(20, sideRect().top + 32, 100, 30));
  side.firstElementChild = heading; side.querySelector = () => specimen;
  const fonts = { status: 'loaded', get ready() {
    const label = lastFrame()?.label;
    return options.failedLabels?.includes(label) ? Promise.reject(new Error('font failure: ' + label)) : Promise.resolve();
  } };
  const document = { documentElement: html, fonts, visibilityState: 'visible',
    body: { classList: { contains: (name: string) => name === 'surface-trail-yield' && fallback() } },
    getElementById: (id: string) => nodes.get(id) ?? null };
  const context: any = { document, window, innerWidth: 320, innerHeight: 568, Event: class {},
    performance: { now: () => ++at, timeOrigin: 1000 },
    requestAnimationFrame: (callback: () => void) => {
      const turn = () => { events.push('frame:' + lastFrame()?.label); callback(); };
      if (options.manualFrames) callbacks.push(turn); else queueMicrotask(turn);
    },
    getComputedStyle: (el: any) => ({ display: el === trail ? (fallback() ? 'none' : trail.style.getPropertyValue('display') || 'none') : el.display,
      opacity: el.opacity, pointerEvents: el.pointerEvents, visibility: el.visibility, overflowY: 'auto',
      transform: el.style.getPropertyValue('transform') || 'none',
      getPropertyValue: (key: string) => key === '--surface-chrome-bottom' ? headerHeight + 'px' : el.style.getPropertyValue(key) || '0px' }),
  };
  const exported = runInNewContext(frameOwners + helpers + outcomes + '\n({paintedPostCloseFixedRows,postCloseFrameSettlement,assessPostCloseFrameSettlement,reviewFrameSettlement,readReviewFrameSettlements,portraitBandControlOutcome,portraitFallbackControlOutcome})', context);
  const expressions = runInNewContext(declaration('topChromeFixedRows') + declaration('topChromeFrameOwner')
    + declaration('portraitBandCheck') + declaration('portraitNativeCheck') + declaration('topChromeCheck')
    + '\n({topChromeFixedRows,topChromeFrameOwner,portraitBandCheck,portraitNativeCheck,topChromeCheck})', exported);
  const evaluate = (expression: string) => runInNewContext(expression, context);
  const runCaller = async (mutate?: (controls: any) => void) => {
    let controls: any, verdictCalls = 0;
    try {
      await runInNewContext('(async()=>{' + caller + '})()', {
        ...expressions, vp: { label: 'small-phone' },
        evalIn: async (expression: string) => { controls = await evaluate(expression); mutate?.(controls); return controls; },
        topChromeFrameValid: (receipt: any) => exported.assessPostCloseFrameSettlement(receipt, { width: 320, height: 568 }),
        portraitBandControlOutcome: (control: any) => { verdictCalls++; return exported.portraitBandControlOutcome(control); },
        portraitFallbackControlOutcome: (control: any) => { verdictCalls++; return exported.portraitFallbackControlOutcome(control); },
        stopInstrumentControl: (message: string) => { throw new Error(message); },
      });
      return { controls, verdictCalls, error: null };
    } catch (cause) { return { controls, verdictCalls, error: String(cause) }; }
  };
  return { nodes, events, callbacks, exported, expressions, evaluate, runCaller,
    setSideTop: (value: number) => { sideTop = value; }, setHeaderHeight: (value: number) => { headerHeight = value; } };
}

it('executes painted clearance with transparent header children, blocking wrappers and invisible opposite controls', () => {
  const f = fixture(); f.setHeaderHeight(180);
  expect(f.evaluate(f.expressions.topChromeCheck).ok).toBe(true);
  const rows = f.exported.paintedPostCloseFixedRows();
  expect(rows.find((row: any) => row.id === 'topbar')).toMatchObject({ excluded: true, visible: false });
  expect(rows.find((row: any) => row.id === 'playerchip').visible).toBe(true);
  f.nodes.get('topbar').pointerEvents = 'auto';
  expect(f.evaluate(f.expressions.topChromeCheck).ok).toBe(false);
  f.nodes.get('topbar').opacity = '0';
  expect(f.evaluate(f.expressions.topChromeCheck).ok).toBe(true);
  f.nodes.get('topbar').pointerEvents = 'none'; f.nodes.get('topbar').opacity = '1'; f.setSideTop(40);
  expect(f.evaluate(f.expressions.topChromeCheck).ok).toBe(false);
  for (const id of ['playerchip', 'hpbar', 'objchip']) f.nodes.get(id).opacity = '0';
  expect(f.evaluate(f.expressions.topChromeCheck).ok).toBe(true);
});

it('excludes the floating trail only from band fixed rows and keeps it in the actual product collision reader', () => {
  const f = fixture(), trail = f.nodes.get('trail');
  trail.style.setProperty('display', 'flex'); trail.style.setProperty('top', '170px');
  expect(f.evaluate(f.expressions.topChromeCheck)).toMatchObject({ ok: false });
  const band = f.evaluate(f.expressions.portraitBandCheck);
  expect(band.fixedRows.some((row: any) => row.id === 'trail')).toBe(false);
  expect(band.fixedChromeBottom).toBe(54); expect(band.gap).toBe(-34); expect(band.ok).toBe(false);
  f.setSideTop(200);
  expect(f.evaluate(f.expressions.portraitBandCheck)).toMatchObject({ ok: true, gap: 6, fixedChromeBottom: 54 });
  trail.opacity = '0';
  expect(f.evaluate(f.expressions.topChromeCheck).rows.find((row: any) => row.id === 'trail').visible).toBe(false);
});

it('uses the real font then two-frame owner and rejects corrupt label/id/overflow/phase/viewport receipts', async () => {
  const f = fixture({ manualFrames: true });
  const pending = f.exported.postCloseFrameSettlement(f.exported.reviewFrameSettlement, f.exported.readReviewFrameSettlements, labels[0]);
  expect(f.callbacks).toHaveLength(0); await Promise.resolve(); expect(f.callbacks).toHaveLength(1);
  f.callbacks.shift()!(); expect(f.callbacks).toHaveLength(1); f.callbacks.shift()!();
  const receipt = JSON.parse(JSON.stringify(await pending));
  const assess = (value: any) => f.exported.assessPostCloseFrameSettlement(value, { width: 320, height: 568 });
  expect(assess(receipt)).toEqual({ ok: true, errors: [] });
  expect(receipt.frame.phases.map((phase: any) => phase.phase)).toEqual(['fonts-wait', 'fonts-ready', 'frame1', 'frame2', 'settled']);
  for (const mutate of [(r: any) => { r.frame.id++; }, (r: any) => { r.frame.label = 'wrong'; },
    (r: any) => { r.overflow = true; }, (r: any) => { r.frame.phases.splice(2, 1); },
    (r: any) => { r.frame.phases.at(-1).viewport.width++; }, (r: any) => { r.error = 'failed'; }]) {
    const broken = structuredClone(receipt); mutate(broken); expect(assess(broken).ok).toBe(false);
  }
});

it('executes the complete fixture caller through all seven boundaries, rejects the band collision and restores native styles', async () => {
  const f = fixture(), result = await f.runCaller();
  expect(result.error).toBeNull(); expect(result.verdictCalls).toBe(2);
  expect(result.controls.settlements.map((row: any) => row.label)).toEqual(labels);
  expect(result.controls.band.mutation.outcome).toMatchObject({ ok: false, trailVisible: true, gap: -1 });
  expect(result.controls.fallback.mutation.outcome).toMatchObject({ ok: true, fallback: true, fixedClear: true });
  expect(result.controls.band.fixture).toMatchObject({ error: null, cleanupErrors: [], originalStyle: { present: false, value: null },
    restoredStyle: { present: false, value: null }, nativeRestored: { ok: true, canonicalHidden: true } });
  expect(f.events.filter(event => event.startsWith('frame:'))).toHaveLength(14);
});

it('surfaces the original injected-fixture error before missing labels or outcome checks despite later cleanup failure', async () => {
  const f = fixture({ badInjected: true, failedLabels: [labels[5]!] }), result = await f.runCaller();
  expect(result.error).toContain('portrait fixture failed: labelled floating-trail fixture did not establish a usable visible predecessor');
  expect(result.error).not.toContain('portrait fixture settlement evidence failed'); expect(result.verdictCalls).toBe(0);
  const witness = result.controls.band.fixture;
  expect(witness.error).toBe('labelled floating-trail fixture did not establish a usable visible predecessor');
  expect(witness.cleanupErrors).toEqual(['font failure: ' + labels[5]]); expect(witness.nativeRestored).toBeNull();
  expect(witness.restoredStyle).toEqual({ present: false, value: null });
  expect(result.controls.settlements.map((row: any) => row.label)).toEqual([labels[0], labels[5], labels[6]]);
  expect(result.controls.settlements[1]).toMatchObject({ error: 'font failure: ' + labels[5], frame: { status: 'error' } });
});

it('preserves a mutation boundary failure through failed restoration and never starts the fallback control', async () => {
  const f = fixture({ failedLabels: [labels[1]!, labels[2]!] }), result = await f.runCaller();
  expect(result.error).toContain('portrait fixture failed: font failure: ' + labels[1]); expect(result.verdictCalls).toBe(0);
  expect(result.controls.band.fixture.cleanupErrors).toEqual(['font failure: ' + labels[2]]);
  expect(result.controls.settlements.map((row: any) => row.label)).toEqual([labels[0], labels[1], labels[2], labels[5], labels[6]]);
  expect(f.nodes.get('planetside').style.getPropertyValue('transform')).toBe('');
});

it('requires the exact seven valid settlement labels before product assessments when there is no earlier fixture error', async () => {
  for (const mutate of [(controls: any) => { controls.settlements.pop(); },
    (controls: any) => { controls.settlements[0].frame.id++; },
    (controls: any) => { controls.settlements[0].label = labels[1]; },
    (controls: any) => { controls.settlements[0].overflow = true; }]) {
    const result = await fixture().runCaller(mutate);
    expect(result.controls.band.fixture.error).toBeNull(); expect(result.verdictCalls).toBe(0);
    expect(result.error).toContain('portrait fixture settlement evidence failed');
  }
});
