import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const start = source.indexOf('        const compactCharts = ');
const end = source.indexOf("        addOutcome(vp.label, 'hud-controls', 'SURVEY_DISCLOSURE_STATE'", start);
expect(start).toBeGreaterThan(0); expect(end).toBeGreaterThan(start);
const routine = source.slice(start, end);
const compactDeclaration = routine.slice(0, routine.indexOf('        const auditChartsControl'));
const hudRoute = source.split('\n').filter(line => line.includes("if (!compactCharts) await auditChartsControl('#dockcharts'"));
const settingsRoute = source.split('\n').filter(line => line.includes("if (compactCharts) await auditChartsControl('#setcharts'"));
expect(hudRoute).toHaveLength(1); expect(settingsRoute).toHaveLength(1);
expect(source.indexOf(settingsRoute[0]!)).toBeGreaterThan(source.indexOf("await waitFor('Settings open'"));
expect(source.indexOf(settingsRoute[0]!)).toBeLessThan(source.indexOf('const recordSettingsAudioPhase ='));
class ProductFault extends Error {}

type Fault = 'native' | 'instrument' | 'toggle' | 'pressed-restore' | 'scroll-restore' | 'pressed-and-scroll';
function fixture(width = 320, height = 568, fault?: Fault) {
  const vp = { width, height, dpr: 1, label: 'fixture' };
  const compact = Function('vp', `${compactDeclaration}return compactCharts;`)(vp) as boolean;
  let on = true, revealed = false, docLeft = 7, docTop = 9, activations = 0;
  const panel = { scrollLeft: 3, scrollTop: 11 };
  const original = { ...panel, docLeft, docTop };
  const productFailure = new ProductFault('pressed state failed');
  const button = { scrollIntoView: () => { revealed = true; panel.scrollTop = 240; docLeft = 0; docTop = 5; },
    click: () => { on = !on; } };
  const dock = { getClientRects: () => compact ? [] : [{}] };
  const document = { getElementById: (id: string) => id === 'setpanel' ? panel : id === 'dockcharts' ? dock : null,
    querySelector: (selector: string) => selector === '#setcharts' || selector === '#dockcharts' ? button : null };
  const window = { __CF_SLICE__: { api: { state: () => ({ chartsOn: on }) } }, __CF_GLASS_AUDIT__: {
    pressedOutcome: (_selector: string, expected: boolean) => ({ ok: on === expected
      && !((fault === 'pressed-restore' || fault === 'pressed-and-scroll') && activations === 2) }),
  } };
  const evalIn = async (expression: string) => Function('scope', `with(scope){return (${expression});}`)({
    window, document, getComputedStyle: () => ({ display: compact ? 'none' : 'block' }),
    requestAnimationFrame: (callback: () => void) => callback(),
    scrollTo: (left: number, top: number) => { if (fault !== 'scroll-restore' && fault !== 'pressed-and-scroll') { docLeft = left; docTop = top; } },
    get scrollX() { return docLeft; }, get scrollY() { return docTop; },
  });
  const waitFor = async (_label: string, expression: string) => { if (!await evalIn(expression)) throw new Error('chart toggle did not settle'); };
  const audit = vi.fn(async (options: { root: string; targetFloor: number; contrastSelectors: string[] }) => {
    expect(options.root).toBe(compact ? '#setcharts' : '#dockcharts');
    expect(options.targetFloor).toBe(44); expect(options.contrastSelectors).toEqual([options.root]);
    if (compact && !revealed) throw new Error('audited an unrevealed Settings control');
    return [];
  });
  const activate = vi.fn(async () => {
    activations++; revealed = false;
    if (fault !== 'toggle') on = !on;
    return { instrumentOk: fault !== 'instrument', productOk: fault !== 'native' };
  });
  const recordControls = vi.fn(), log = vi.fn();
  const addOutcome = (...args: unknown[]) => { if (!(args[4] as { ok: boolean }).ok) throw productFailure; };
  const control = Function('vp', 'evalIn', 'waitFor', 'audit', 'add', 'addOutcome', 'targetFloor', 'recordControls', 'ProductAnswerabilityFinding', 'console',
    `${routine}return auditChartsControl;`)(vp, evalIn, waitFor, audit, () => {}, addOutcome, 44, recordControls, ProductFault, { log }) as (selector: string, activate: unknown) => Promise<void>;
  const run = (phase: 'hud' | 'settings') => Function('vp', 'auditChartsControl', 'activateRealSettingsControl', 'evalIn',
    `return (async()=>{${compactDeclaration}${phase === 'hud' ? hudRoute[0] : settingsRoute[0]}})();`)(vp, control, activate, evalIn) as Promise<void>;
  return { run, wrongRoute: () => control('#dockcharts', activate), audit, activate, recordControls, log, productFailure,
    setCurrent: (value: boolean) => { on = value; }, current: () => on, original,
    scroll: () => ({ ...panel, docLeft, docTop }) };
}

it.each([{ width: 320, height: 568 }, { width: 414, height: 896 }, { width: 844, height: 390 }, { width: 900, height: 500 }])(
  'uses visible Settings Charts for compact $width x $height and captures state at phase entry', async ({ width, height }) => {
    const f = fixture(width, height); await f.run('hud'); expect(f.audit).not.toHaveBeenCalled();
    f.setCurrent(false); await f.run('settings');
    expect(f.audit).toHaveBeenCalledTimes(2); expect(f.activate).toHaveBeenCalledTimes(2);
    expect(f.current()).toBe(false); expect(f.scroll()).toEqual(f.original);
    expect(f.recordControls).toHaveBeenCalledExactlyOnceWith('control-on-off-contrast');
    expect(JSON.parse(String(f.log.mock.calls[0]![0]).split(': ').slice(1).join(': '))).toMatchObject({ initial: false, restoredPressed: { ok: true }, restoration: { ok: true } });
  },
);
it('keeps wide Charts at the HUD and skips the later Settings route', async () => {
  const f = fixture(1024, 768); await f.run('hud'); await f.run('settings');
  expect(f.audit).toHaveBeenCalledTimes(2); expect(f.activate).not.toHaveBeenCalled();
  expect(f.current()).toBe(true); expect(f.recordControls).toHaveBeenCalledOnce();
});
it('rejects the hidden compact dock route before any audit or activation', async () => {
  const f = fixture(); await expect(f.wrongRoute()).rejects.toThrow('hidden route');
  expect(f.audit).not.toHaveBeenCalled(); expect(f.activate).not.toHaveBeenCalled();
});
it.each(['native', 'instrument', 'toggle', 'pressed-restore', 'scroll-restore'] as const)('rejects %s failure without recording a green control', async fault => {
  const f = fixture(320, 568, fault); await expect(f.run('settings')).rejects.toThrow();
  expect(f.recordControls).not.toHaveBeenCalled(); expect(f.log).not.toHaveBeenCalled();
  if (fault !== 'scroll-restore') expect(f.scroll()).toEqual(f.original);
  expect(f.activate.mock.calls.length).toBe(fault.endsWith('restore') ? 2 : 1);
});
it('keeps the first product failure identity when later scroll cleanup also fails', async () => {
  const f = fixture(320, 568, 'pressed-and-scroll');
  await expect(f.run('settings')).rejects.toBe(f.productFailure);
  expect(f.productFailure.message).toContain('Charts cleanup also failed');
  expect(f.recordControls).not.toHaveBeenCalled();
});
