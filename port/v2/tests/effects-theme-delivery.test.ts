/* Painted-theme delivery validator (Art Kit §4K/§5, Motion Kit §8). The accepted Wild v4.3 set passes every check; each
 * mutant of it fails exactly the check it targets (wrong size, missing phase, broken anchors, off registration, wrong
 * bounds, wrong hash, no alpha, key fringe, accent as body, key in the shape, texture and particle budget overflow).
 * The fringe threshold is also controlled against REAL data: the Wild registered copies the review refused (before the
 * second despill) fail it. Every v4.3 row of painted-themes.json is validated here from its delivered files, and a
 * candidate can be validated before it is registered: THEME_DELIVERY=<repo-relative anchors json> THEME=<theme> npx vitest run tests/effects-theme-delivery.test.ts */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { decodePng } from '../apps/game/src/morph/png-decode.js';
import { DELIVERY_RULES, isKeyTinted, measurePhaseImage, validateThemeDelivery, type DeliveryImage, type ThemeDeliveryInput } from '../apps/game/src/effects/theme-delivery.js';
import { EMITTER_PRESETS } from '../apps/game/src/effects/emitter.js';
import { THEME_MATERIALS } from '../apps/game/src/effects/theme-library.js';
import { paintedAssetPath, parsePaintedThemeManifest } from '../apps/game/src/effects/painted-theme-registry.js';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const ARENA_ROOT = 'audits/ARENA_EFFECTS_V42_PROOF_20260912/';
const WILD_V43 = 'audits/WILD_V43_PROOF_20260913/wild-anchors.json';

async function loadImage(repoPath: string): Promise<DeliveryImage> {
  const bytes = readFileSync(path.join(REPO, repoPath));
  const png = await decodePng(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  return { width: png.width, height: png.height, rgba: png.rgba, hasAlphaChannel: png.colorType === 6 || png.colorType === 4, sha256: createHash('sha256').update(bytes).digest('hex') };
}
/** Everything one anchors JSON delivers, read from disk (image names resolve against the JSON's own directory). */
async function loadDelivery(theme: string, anchorsRepoPath: string): Promise<ThemeDeliveryInput & { images: Map<string, DeliveryImage> }> {
  const anchors = JSON.parse(readFileSync(path.join(REPO, anchorsRepoPath), 'utf8')) as { phases: { keyedImage: string }[] };
  const images = new Map<string, DeliveryImage>();
  for (const p of anchors.phases) images.set(p.keyedImage, await loadImage(paintedAssetPath(anchorsRepoPath, p.keyedImage)));
  return { theme, anchors, images };
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
type RawAnchors = { canvasSize: { width: number; height: number }; phaseOrder: string[]; originAnchor: number[]; phases: Record<string, unknown>[]; theme: string; sequenceId: string };
const checks = (r: ReturnType<typeof validateThemeDelivery>): string[] => [...new Set(r.findings.map((f) => f.check))].sort();
const withImage = (img: DeliveryImage, over: Partial<DeliveryImage>): DeliveryImage => ({ ...img, ...over });
/** Paint `fraction` of the image's edge pixels with the given colour (alpha kept): a keyed copy with fringe left behind. */
function paintEdges(img: DeliveryImage, rgb: readonly [number, number, number], fraction: number): DeliveryImage {
  const { width: w, height: h } = img, px = new Uint8Array(img.rgba), a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.rgba[(y * w + x) * 4 + 3]!);
  let k = 0; const every = Math.max(1, Math.round(1 / fraction));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, al = img.rgba[i + 3]!; if (!al) continue;
    if (al < 255 || !a(x + 1, y) || !a(x - 1, y) || !a(x, y + 1) || !a(x, y - 1)) { if (k++ % every === 0) { px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; } } }
  return { ...img, rgba: px };
}
function recolourSolid(img: DeliveryImage, rgb: readonly [number, number, number], interiorOnly = false, limit = Infinity): DeliveryImage {
  const { width: w, height: h } = img, px = new Uint8Array(img.rgba), a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.rgba[(y * w + x) * 4 + 3]!);
  let n = 0;
  for (let y = 0; y < h && n < limit; y++) for (let x = 0; x < w && n < limit; x++) { const i = (y * w + x) * 4; if (img.rgba[i + 3]! < 128) continue;
    if (interiorOnly && (img.rgba[i + 3]! < 255 || !a(x + 1, y) || !a(x - 1, y) || !a(x, y + 1) || !a(x, y - 1))) continue;
    px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; n++; }
  return { ...img, rgba: px };
}

describe('theme delivery validator: the accepted Wild v4.3 set', () => {
  let wild: Awaited<ReturnType<typeof loadDelivery>>;
  beforeAll(async () => { wild = await loadDelivery('wild', WILD_V43); });

  it('passes every check, with the measurements the thresholds were derived from', () => {
    const r = validateThemeDelivery(wild);
    expect(r.findings).toEqual([]); expect(r.ok).toBe(true);
    expect(r.sequenceId).toBe('wild-maw-proof-v43'); expect(r.textures).toBe(3); expect(r.particles).toBe(200);
    const m = r.phases;
    // the fringe threshold is 1.5x the worst accepted phase, so a re-derived threshold is visible here first
    const worst = Math.max(m.launch!.fringeRatio, m.travel!.fringeRatio, m.impact!.fringeRatio);
    expect(worst).toBeGreaterThan(0); expect(DELIVERY_RULES.fringe.maxEdgeRatio).toBeGreaterThanOrEqual(1.4 * worst); expect(DELIVERY_RULES.fringe.maxEdgeRatio).toBeLessThanOrEqual(1.6 * worst);
    for (const p of ['launch', 'travel', 'impact'] as const) { expect(m[p]!.keyInShape).toBe(0); expect(m[p]!.borderOpaque).toBe(0); expect(m[p]!.accentShare).toBeLessThan(DELIVERY_RULES.accent.maxShare); }
    // measured 2026-10-01 (the README records them): fringe launch 23/9289, travel 53/28907, impact 23/11791; accent share ≤ 0.025 %
    expect([m.launch!.fringe, m.travel!.fringe, m.impact!.fringe]).toEqual([23, 53, 23]);
  });

  it('REAL negative control: the registered copies the Wild review refused (before the second despill) fail the fringe check only', async () => {
    const before = await loadDelivery('wild', WILD_V43);
    const anchors = clone(before.anchors) as RawAnchors;
    for (const [i, rel] of [[1, 'registered/wild-travel.png'], [2, 'registered/wild-impact.png']] as const) {
      const img = await loadImage('audits/WILD_V43_PROOF_20260913/' + rel);
      anchors.phases[i]!.keyedImage = rel; anchors.phases[i]!.image = rel; anchors.phases[i]!.imageSha256 = img.sha256; before.images.set(rel, img);
    }
    const r = validateThemeDelivery({ ...before, anchors });
    expect(r.findings.filter((f) => f.check !== 'bounds').map((f) => [f.check, f.phase])).toEqual([['fringe', 'travel'], ['fringe', 'impact']]);
    // measured 2026-10-01: travel 206/34594 = 0.595 %, impact 90/14289 = 0.630 %; both well over the 0.375 % threshold
    expect(r.phases.travel!.fringeRatio).toBeGreaterThan(1.5 * DELIVERY_RULES.fringe.maxEdgeRatio); expect(r.phases.impact!.fringeRatio).toBeGreaterThan(1.5 * DELIVERY_RULES.fringe.maxEdgeRatio);
  });

  it('rejects each mutant on exactly its check, with a reason', () => {
    const a = (): RawAnchors => clone(wild.anchors) as RawAnchors;
    const launchName = (wild.anchors as RawAnchors).phases[0]!.keyedImage as string, launch = wild.images.get(launchName)!;
    const run = (over: Partial<ThemeDeliveryInput>, imageOver?: [string, DeliveryImage]) => { const images = new Map(wild.images); if (imageOver) images.set(imageOver[0], imageOver[1]); return validateThemeDelivery({ ...wild, images, ...over }); };
    // wrong size: a 1254 canvas in the anchors, and a delivered image that is not 1024 square
    const big = a(); big.canvasSize = { width: 1254, height: 1254 }; expect(checks(run({ anchors: big }))).toEqual(['size']);
    const small = run({}, [launchName, withImage(launch, { width: 512, height: 2048 })]);
    expect(checks(small)).toContain('size'); expect(small.findings.find((f) => f.check === 'size')!.reason).toMatch(/512x2048, expected 1024 square/);
    // missing phase: no impact in the anchors (the parser refuses), and an anchors-named image not delivered
    const twoPhase = a(); twoPhase.phaseOrder = ['launch', 'travel']; twoPhase.phases = twoPhase.phases.slice(0, 2);
    const r2 = run({ anchors: twoPhase }); expect(checks(r2)).toEqual(['anchors']); expect(r2.findings[0]!.reason).toMatch(/phaseOrder/);
    const missing = new Map(wild.images); missing.delete(launchName);
    const r3 = validateThemeDelivery({ ...wild, images: missing }); expect(checks(r3)).toEqual(['phases']); expect(r3.findings[0]!.reason).toMatch(/was not delivered/);
    // broken anchors: out-of-range anchor, wrong schema, another theme's sequence
    const off = a(); off.originAnchor = [1.5, 0.5]; expect(run({ anchors: off }).findings[0]!.reason).toMatch(/originAnchor: expected \[x, y\] normalized/);
    const schema = a() as unknown as Record<string, unknown>; schema.schema = 'cf.effect-sequence-anchors/v0'; expect(checks(run({ anchors: schema }))).toEqual(['anchors']);
    expect(checks(run({ theme: 'fire' }))).toContain('anchors');
    // registration: one phase's origin moved off the shared origin
    const reg = a(); reg.phases[1]!.originAnchor = [0.3, 0.55]; const rr = run({ anchors: reg }); expect(checks(rr)).toEqual(['registration']); expect(rr.findings[0]!.phase).toBe('travel');
    // bounds: recorded alpha box moved 10 px
    const bnd = a(); const ab = bnd.phases[2]!.alphaBoundsPixels as { x: number }; ab.x += 10; expect(checks(run({ anchors: bnd }))).toEqual(['bounds']);
    // hash: a stale or missing imageSha256
    const hash = a(); hash.phases[0]!.imageSha256 = '0'.repeat(64); expect(checks(run({ anchors: hash }))).toEqual(['hash']);
    const nohash = a(); delete nohash.phases[0]!.imageSha256; expect(checks(run({ anchors: nohash }))).toEqual(['hash']);
    // alpha: an RGB file, a key left in place (no transparent pixel), a shape touching the frame
    expect(checks(run({}, [launchName, withImage(launch, { hasAlphaChannel: false })]))).toEqual(['alpha']);
    const opaque = new Uint8Array(launch.rgba); for (let i = 3; i < opaque.length; i += 4) if (opaque[i] === 0) { opaque[i] = 255; opaque[i - 3] = 255; opaque[i - 2] = 0; opaque[i - 1] = 255; }
    expect(checks(run({}, [launchName, withImage(launch, { rgba: opaque })]))).toEqual(expect.arrayContaining(['alpha']));
    const border = new Uint8Array(launch.rgba); border[3] = 255; expect(checks(run({}, [launchName, withImage(launch, { rgba: border })]))).toEqual(['alpha', 'bounds']);
    // fringe: 2 % of the launch edge left key-pink (a keyer that missed its despill)
    const fr = run({}, [launchName, paintEdges(launch, [230, 40, 220], 0.02)]); expect(checks(fr)).toEqual(['fringe']); expect(fr.findings[0]!.reason).toMatch(/key-tinted/);
    // material: the game hex painted as the body; and the pure key inside the shape
    const body = run({}, [launchName, recolourSolid(launch, [0x9f, 0xb6, 0xd6])]); expect(checks(body)).toEqual(['material']); expect(body.findings[0]!.reason).toMatch(/accent/);
    const keyed = run({}, [launchName, recolourSolid(launch, [255, 0, 255], true, 50)]); expect(checks(keyed)).toEqual(['material']); expect(keyed.findings[0]!.reason).toMatch(/magenta/);
    // budget: 250 particles; and four phase textures (an extra travel frame)
    const over = run({ emitters: { ...EMITTER_PRESETS, impact: { ...EMITTER_PRESETS.impact, maxParticles: 150 } } }); expect(checks(over)).toEqual(['budget']); expect(over.findings[0]!.reason).toMatch(/250 particles/);
    const four = a(); four.phaseOrder = ['launch', 'travel', 'travel', 'impact']; four.phases = [four.phases[0]!, four.phases[1]!, { ...four.phases[1]!, image: 'x/extra.png' }, four.phases[2]!];
    const r4 = run({ anchors: four }); expect(checks(r4)).toEqual(expect.arrayContaining(['budget', 'phases'])); expect(r4.textures).toBe(4);
  });

  it('the key-tint classifier: magenta and keyer-darkened magenta are fringe; every theme accent and the Wild sheen are not', () => {
    for (const [r, g, b] of [[255, 0, 255], [200, 60, 190], [140, 40, 150], [230, 120, 230]]) expect(isKeyTinted(r!, g!, b!)).toBe(true);
    for (const t of Object.values(THEME_MATERIALS)) { const c = [(t.accent >> 16) & 255, (t.accent >> 8) & 255, t.accent & 255]; expect(isKeyTinted(c[0]!, c[1]!, c[2]!)).toBe(false); }
    expect(measurePhaseImage({ width: 1, height: 1, rgba: new Uint8Array([255, 0, 255, 128]), hasAlphaChannel: true, sha256: '' }, 0).fringe).toBe(1);
  });
});

describe('every v4.3 row of painted-themes.json passes the delivery validator from its delivered files', () => {
  const rows = parsePaintedThemeManifest(JSON.parse(readFileSync(new URL('../apps/game/src/effects/painted-themes.json', import.meta.url), 'utf8')));
  const v43 = rows.filter((r) => r.contract === 'v4.3');
  it('lists the registered rows (Wild is grandfathered at v4.2 and ships unchanged)', () => {
    expect(rows.find((r) => r.theme === 'wild')).toMatchObject({ contract: 'v4.2-grandfathered', required: true, anchors: 'wild-anchors.json' });
  });
  for (const row of v43) it(`${row.theme}: ${row.anchors}`, async () => {
    const repoPath = paintedAssetPath(ARENA_ROOT + 'x', row.anchors);
    const r = validateThemeDelivery(await loadDelivery(row.theme, repoPath));
    expect(r.findings).toEqual([]);
  });
  const candidate = process.env.THEME_DELIVERY, candidateTheme = process.env.THEME;
  it.runIf(candidate !== undefined)(`candidate ${candidate ?? ''} (${candidateTheme ?? '?'})`, async () => {
    expect(candidateTheme, 'set THEME=<theme> beside THEME_DELIVERY').toBeTruthy(); expect(existsSync(path.join(REPO, candidate!))).toBe(true);
    const r = validateThemeDelivery(await loadDelivery(candidateTheme!, candidate!));
    console.log(JSON.stringify({ ok: r.ok, theme: r.theme, sequenceId: r.sequenceId, textures: r.textures, particles: r.particles, findings: r.findings, phases: r.phases }, null, 1));
    expect(r.findings).toEqual([]);
  });
});
