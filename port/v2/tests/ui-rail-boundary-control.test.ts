import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const source = readFileSync(new URL('../tools/slicesmoke.mjs', import.meta.url), 'utf8');
const start = '  const railBoundaryRemovalControl = async (';
const end = '  await railBoundaryRemovalControl({';
expect(source.split(start)).toHaveLength(2);
const ownerStart = source.indexOf(start);
const ownerEnd = source.indexOf(end, ownerStart);
expect(ownerEnd).toBeGreaterThan(ownerStart);
const owner = source.slice(ownerStart, ownerEnd);
const globals = ['window', 'document', 'Element', 'HTMLElement', 'getComputedStyle'] as const;
const saved = new Map<string, PropertyDescriptor | undefined>();
let dom: any;

beforeEach(() => {
  vi.resetModules();
  dom = new JSDOM('<nav id="dock" data-panel-boundary="dock-token"><div id="raillft" data-panel-boundary="rail-token"></div></nav><div id="railrgt" data-panel-boundary></div><button id="dockrecords">Records</button><aside id="recpanel"></aside>',
    { url: 'https://rail-control.test/', runScripts: 'outside-only' });
  for (const key of globals) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    const value = key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window)
      : key === 'window' ? dom.window : dom.window[key];
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  Object.defineProperty(dom.window.HTMLElement.prototype, 'getClientRects', {
    configurable: true, value: () => [{ width: 44, height: 44 }],
  });
});
afterEach(() => {
  dom.window.close();
  for (const key of globals) {
    const prior = saved.get(key);
    if (prior) Object.defineProperty(globalThis, key, prior);
    else Reflect.deleteProperty(globalThis, key);
  }
  saved.clear();
});

type Fault = 'ancestor-removal' | 'rail-removal' | 'rail-protection' | 'restoration' | 'untrusted' | 'dispatch' | 'geometry';
async function fixture(fault?: Fault, railId = 'raillft') {
  const panels = await import('../apps/game/src/panels.js');
  const rail = document.getElementById(railId)!;
  const opener = document.getElementById('dockrecords')!;
  panels.registerPanel({ id: 'rec', el: document.getElementById('recpanel')!, btns: [opener] });
  dom.window.__CF_SLICE__ = { api: { state: () => ({ panelOpen: panels.openPanelId(), cardOpen: false }) } };
  if (fault === 'rail-protection') document.addEventListener('pointerdown', event => {
    if (event.target === rail && !document.getElementById('dock')!.hasAttribute('data-panel-boundary')) panels.closePanels();
  });
  const logs: any[] = [];
  let presses = 0;
  const gapCheck = `(()=>{const rail=document.getElementById(${JSON.stringify(railId)});return {
    geometry:${fault !== 'geometry'},ownerId:rail.id,point:{x:64,y:170},boundary:rail.hasAttribute('data-panel-boundary'),
    panelOpen:window.__CF_SLICE__.api.state().panelOpen,cardOpen:false};})()`;
  const evalIn = async (expression: string) => {
    if (fault === 'ancestor-removal' && expression.includes('for(const id of ["dock"])')) return undefined;
    if (fault === 'rail-removal' && expression.startsWith('document.getElementById("raillft")?.removeAttribute')) return undefined;
    const value = dom.window.eval(expression);
    if (fault === 'restoration' && expression.includes("element.setAttribute('data-panel-boundary',prior.value)"))
      rail.setAttribute('data-panel-boundary', 'wrong-restored-bytes');
    return value;
  };
  const run = Function('evalIn', 'openDesktopRailPanel', 'armDesktopPointerReceipt', 'clickDesktopPoint',
    'takeDesktopPointerReceipt', 'closeDesktopPanel', 'failSliceWithoutCascade', 'console',
    owner + '\nreturn railBoundaryRemovalControl;')(
    evalIn,
    async () => { opener.click(); return panels.openPanelId() === 'rec'; },
    async () => undefined,
    async () => {
      presses++;
      if (fault === 'dispatch' && presses === 1) throw new Error('deliberate protocol delivery failure');
      // The real panel manager receives a synthetic DOM pointer. This test models the
      // CDP receipt separately; only the browser run can establish trusted native delivery.
      rail.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true }));
    },
    async () => ({ targetId: railId, trusted: fault !== 'untrusted', pointerType: 'mouse', x: 64, y: 170 }),
    async () => panels.closePanels(),
    (message: string) => { throw new Error(message); },
    { log: (message: string) => logs.push(JSON.parse(message.slice(message.indexOf('CONTROL RECEIPT: ') + 17))) },
  ) as (args: Record<string, unknown>) => Promise<void>;
  return { run: () => run({ railId, gapCheck, buttonId: 'dockrecords', panelId: 'rec', label: 'RAIL BOUNDARY',
    ancestorIds: railId === 'raillft' ? ['dock'] : [] }), logs, rail, panel: panels.openPanelId };
}

describe('shipped Slice rail boundary fault sequence', () => {
  it.each(['', 'rail-token'])('proves rail-only protection, unprotected dismissal and exact restoration of %j', async value => {
    document.getElementById('raillft')!.setAttribute('data-panel-boundary', value);
    const f = await fixture();
    await f.run();
    expect(f.logs[0].stages.map((s: any) => [s.name, s.boundary.chain, s.after])).toEqual([
      ['rail-only-protection', ['raillft'], 'rec'], ['unprotected-dismissal', [], null],
      ['restored-protection', ['raillft', 'dock'], 'rec'],
    ]);
    expect(f.logs[0].firstFailure).toBeNull();
    expect(f.logs[0].restorationFailure).toBeNull();
    expect(f.logs[0].restored).toEqual(f.logs[0].prior);
    expect(f.rail.getAttribute('data-panel-boundary')).toBe(value);
    expect(document.getElementById('dock')!.getAttribute('data-panel-boundary')).toBe('dock-token');
    expect(f.panel()).toBeNull();
  });
  it('keeps the independent right rail control with no ancestor boundary', async () => {
    const f = await fixture(undefined, 'railrgt');
    await f.run();
    expect(f.logs[0].stages.map((s: any) => s.after)).toEqual(['rec', null, 'rec']);
    expect(f.logs[0].restored).toEqual(f.logs[0].prior);
  });
  it.each([
    ['ancestor-removal', 'effective boundary chain mismatch'],
    ['rail-removal', 'effective boundary chain mismatch'],
    ['rail-protection', 'panel dismissal/preservation outcome mismatch'],
    ['untrusted', 'exact trusted gap delivery missing'],
    ['geometry', 'measured gap/panel predecessor missing'],
    ['dispatch', 'deliberate protocol delivery failure'],
  ] as const)('rejects %s without erasing the first failure during restoration', async (fault, reason) => {
    const f = await fixture(fault);
    await expect(f.run()).rejects.toThrow(reason);
    expect(f.logs[0].firstFailure).toContain(reason);
    expect(f.logs[0].restored).toEqual(f.logs[0].prior);
    expect(f.rail.getAttribute('data-panel-boundary')).toBe('rail-token');
  });
  it('rejects wrong restoration bytes even after both action outcomes pass', async () => {
    const f = await fixture('restoration');
    await expect(f.run()).rejects.toThrow('exact boundary restoration failed');
    expect(f.logs[0].firstFailure).toBeNull();
    expect(f.logs[0].restorationFailure).toContain('exact boundary restoration failed');
  });
  it('rejects missing rail ownership before its ancestor can mask the fault', async () => {
    const f = await fixture();
    f.rail.removeAttribute('data-panel-boundary');
    await expect(f.run()).rejects.toThrow('boundary ownership setup mismatch');
    expect(f.logs[0].stages).toHaveLength(0);
    expect(f.rail.hasAttribute('data-panel-boundary')).toBe(false);
  });
});
