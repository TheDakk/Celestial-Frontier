/* D16 parity — travel to a species' origin world (v1 `data-go` → `travelTo(sp.where)`) — INVENTORY row #38.
 *
 * The exact shipped Main sections run type-stripped: the #codexpanel click listener and `runCompendiumOriginTravel`. The press goes to
 * the one proven-route owner (`searchTravel`, recorded here), so the OUTCOME is the exact world the explorer is flown to:
 * - a species' saved `where` (the legacy world view the catalogue writes) survives the save codec (export → import) and flies back to
 *   that exact world, then the panels close and v1's "Course Plotted" toast speaks;
 * - a hybrid (bred) never travels, nor does an installed measurement fixture; a refused route does not close the panel.
 * The detail card renders the control only under the same rule (source-checked; the detail card itself is covered by its own tests). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { exportSaveV2, importSaveV2, projectLegacyGuardianWorldWhereV1, type ContentRegistry, type SaveStateV2 } from '@cf/persistence';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import { primeClaimWorldAddressV1 } from '../apps/game/src/prime-travel.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };
const section = (source: string, start: string, end: string): string => {
  if (source.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = source.indexOf(start), right = source.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return source.slice(left, right);
};
const LISTENER = (source = MAIN) => section(source, '/* codex list rows open the detail card', '\n/* ---- THE SEARCH BAR');

let MARS: ReturnType<typeof resolveCF1WorldAddress> = { ok: false, reason: 'not-yet' } as unknown as ReturnType<typeof resolveCF1WorldAddress>;
beforeAll(() => { installCaptureHooks(); MARS = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 134 } }); });

function saveWithCatch(): SaveStateV2 {
  if (!MARS.ok) throw new Error(MARS.reason);
  const imported = importSaveV2('{}', REGISTRY, NOW); if (!imported.ok) throw new Error(imported.reason);
  const save = imported.state, where = projectLegacyGuardianWorldWhereV1(MARS.address) as unknown as Record<string, unknown>;
  // a real genome: the codec stores {g, f, w} and rebuilds the page (id 's'+seed, name and kind from the genome)
  save.codex.push(['s77', { id: 's77', name: '', kind: 'Fauna', tier: null, realm: '', sapient: 0, from: 'Mars', hybrid: false, g: makeGenome(77, 'fauna', 0.5) as unknown as Record<string, unknown>, where } as never]);
  const reloaded = importSaveV2(exportSaveV2(save, NOW), REGISTRY, NOW); if (!reloaded.ok) throw new Error(reloaded.reason);
  const wild = reloaded.state.codex.find(([k]) => k === 's77'); if (!wild) throw new Error('the codec dropped the catch');
  // a bred page: same world, but a hybrid has no origin world to return to
  reloaded.state.codex.push(['bred', { ...wild[1], id: 'bred', hybrid: true }]);
  return reloaded.state;
}

function mount(save: SaveStateV2, opts: { fixture?: boolean; routeOk?: boolean; source?: string } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><aside id="codexpanel"></aside></body></html>');
  const doc = dom.window.document;
  const jumps: CanonicalCF1WorldAddress[] = [];
  const env: Record<string, unknown> = {
    document: doc, save, compendiumFixtureRows: opts.fixture ? [...save.codex] : null, codexView: null, codexOpenShelves: new Set(),
    activeCodexSource: () => save.codex, primeClaimWorldAddressV1, codexChipPressV1: () => null, fillCodex: vi.fn(), fillCodexDetail: vi.fn(),
    closePanels: vi.fn(), toast: vi.fn(), CSS: { escape: (v: string) => v },
    searchTravel: { jumpToCanonicalAddress: vi.fn(async (address: CanonicalCF1WorldAddress) => { jumps.push(address); return opts.routeOk !== false; }) },
  };
  const out = transformSync('main-d16-origin.ts', LISTENER(opts.source));
  if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  new Function('env', `with (env) { ${out.code} }`)(env);
  const panel = doc.getElementById('codexpanel')!;
  const press = (index: number) => { panel.innerHTML = `<button type="button" class="codex-origin" data-codex-origin="${index}">Travel ↗</button>`; panel.querySelector<HTMLElement>('[data-codex-origin]')!.click(); };
  return { dom, env, jumps, press };
}
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); };
const indexOf = (save: SaveStateV2, id: string) => save.codex.findIndex(([k]) => k === id);

describe('D16 — Compendium origin travel (v1 #38)', () => {
  it('v1 parity: the catalogue page travels to sp.where with the "Course Plotted" toast', () => {
    const v1 = readTrackedV1Source().script;
    expect(v1).toContain('travelTo(sp.where);');
    expect(v1).toContain("toast('Course Plotted','Returning to '+sp.from+' — where you first catalogued '+sp.name+'.');");
  });

  it('OUTCOME: a wild catch flies back to its exact saved world (through the save codec), closes the panels and speaks', async () => {
    const save = saveWithCatch(), m = mount(save);
    expect(save.codex[indexOf(save, 's77')]![1].where).not.toBeNull(); // the codec kept the world
    m.press(indexOf(save, 's77')); await settle();
    expect(m.jumps).toHaveLength(1);
    if (!MARS.ok) throw new Error('no Mars');
    expect(m.jumps[0]).toEqual(MARS.address);
    expect(m.env.closePanels).toHaveBeenCalledTimes(1);
    const name = save.codex[indexOf(save, 's77')]![1].name; expect(name.length).toBeGreaterThan(0);
    expect(m.env.toast).toHaveBeenCalledWith('Course Plotted', `Returning to Mars — where you first catalogued ${name}.`);
    m.dom.window.close();
  });

  it('a hybrid never travels; a fixture never travels; a refused route keeps the panel open and says nothing', async () => {
    const save = saveWithCatch();
    { const m = mount(save); m.press(indexOf(save, 'bred')); await settle(); expect(m.jumps).toEqual([]); m.dom.window.close(); }
    { const m = mount(save, { fixture: true }); m.press(indexOf(save, 's77')); await settle(); expect(m.jumps).toEqual([]); m.dom.window.close(); }
    { const m = mount(save, { routeOk: false }); m.press(indexOf(save, 's77')); await settle(); expect(m.jumps).toHaveLength(1); expect(m.env.closePanels).not.toHaveBeenCalled(); expect(m.env.toast).not.toHaveBeenCalled(); m.dom.window.close(); }
  });

  it('the detail card renders the control only for a wild catch with a resolvable world, outside fixtures', () => {
    const detail = section(MAIN, 'function fillCodexDetail(', '\nfunction fillRecords(');
    expect(detail).toContain('(!e.hybrid && e.from && compendiumFixtureRows === null && primeClaimWorldAddressV1(e.where) !== null');
    expect(detail).toContain('data-codex-origin="${idx}">Travel to ${esc(e.from)} ↗</button>');
  });

  it('MUTATION CONTROLS: an unwired button and a runner that skips the proven route each fail the outcome', async () => {
    const unwired = MAIN.replace('  if (origin) { void runCompendiumOriginTravel(+origin.dataset.codexOrigin!); return; }', '');
    expect(unwired).not.toBe(MAIN);
    { const save = saveWithCatch(), m = mount(save, { source: unwired }); m.press(indexOf(save, 's77')); await settle(); expect(m.jumps).toEqual([]); m.dom.window.close(); }
    const skipsRoute = MAIN.replace('  const moved = await searchTravel.jumpToCanonicalAddress(address);', '  const moved = true;');
    expect(skipsRoute).not.toBe(MAIN);
    { const save = saveWithCatch(), m = mount(save, { source: skipsRoute }); m.press(indexOf(save, 's77')); await settle(); expect(m.jumps).toEqual([]); expect(m.env.toast).toHaveBeenCalled(); m.dom.window.close(); }
  });
});
