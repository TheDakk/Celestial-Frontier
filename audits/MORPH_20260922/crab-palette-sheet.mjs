// M-E sheet (MORPH_SYSTEM_DESIGN §3): the crab archetype beside 12 palette morphs from 12 seeds, remapped on the
// painter MASTER by part role (labels.png → declaration part → body-card group → base/accent). Deterministic.
// Run from port/v2: node --experimental-strip-types ../../audits/MORPH_20260922/crab-palette-sheet.mjs
import fs from 'node:fs'; import path from 'node:path';
import { readPng, writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const { morphParamsV1 } = await import('../../port/v2/apps/game/src/morph/morph-params.ts');
const { remapAtlasPaletteV1, paletteRoleOfGroup, paletteConservationV1 } = await import('../../port/v2/apps/game/src/morph/morph-palette.ts');
const { compileBodyCard } = await import('../../port/v2/apps/game/src/motion/body-card.ts');
const R = path.resolve(import.meta.dirname, '../..'), fit = path.join(R, 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/');
const record = JSON.parse(fs.readFileSync(fit + 'record.json')), decl = JSON.parse(fs.readFileSync(fit + 'declaration.json')), card = compileBodyCard(record, record.genome);
const master = readPng(fs.readFileSync(path.join(R, record.source))), labels = readPng(fs.readFileSync(fit + 'labels.png'));
const groupOf = new Map(card.parts.map((p) => [p.joint, p.group]));
// label value → role: the declaration lists parts in label order (value = index + 1; 0 = none)
const roleOfLabel = new Map(); decl.parts.forEach((p, i) => roleOfLabel.set(i + 1, paletteRoleOfGroup(groupOf.get(p.joint))));
const seen = new Set(); for (let i = 0; i < labels.width * labels.height; i++) seen.add(labels.data[i * 4]);
console.log(JSON.stringify({ labelValues: [...seen].sort((a, b) => a - b), parts: decl.parts.length }));
// one frame per pixel would be silly: build per-ROLE masks and remap the whole master three times (base / accent), then composite by mask
const W = master.width, H = master.height, roles = ['base', 'accent'];
const remapFor = (params) => { const out = new Uint8Array(master.data);
  for (const role of roles) { const full = remapAtlasPaletteV1(master.data, W, H, [{ x: 0, y: 0, width: W, height: H, role }], params);
    for (let i = 0; i < W * H; i++) if (roleOfLabel.get(labels.data[i * 4]) === role) { out[i * 4] = full[i * 4]; out[i * 4 + 1] = full[i * 4 + 1]; out[i * 4 + 2] = full[i * 4 + 2]; } }
  return out; };
const TW = 300, COLS = 4, seeds = 12, tiles = [];
// crop to the master's alpha box (the crab is a small part of its 1254² canvas), then box-downscale the crop
let bx0 = W, by0 = H, bx1 = -1, by1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (master.data[(y * W + x) * 4 + 3] > 8) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
const CW = bx1 - bx0 + 1, CH = by1 - by0 + 1, side = Math.max(CW, CH), cx = bx0 + CW / 2, cy = by0 + CH / 2, X0 = Math.max(0, Math.round(cx - side / 2)), Y0 = Math.max(0, Math.round(cy - side / 2)), S = Math.min(side, W - X0, H - Y0);
const box = (data, dw, dh) => { const o = new Uint8Array(dw * dh * 4), sx = S / dw, sy = S / dh; for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const x0 = X0 + Math.floor(x * sx), x1 = Math.max(x0 + 1, X0 + Math.floor((x + 1) * sx)), y0 = Y0 + Math.floor(y * sy), y1 = Math.max(y0 + 1, Y0 + Math.floor((y + 1) * sy)); let r = 0, g = 0, b = 0, a = 0, n = 0; for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * W + xx) * 4, al = data[i + 3]; r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al; n++; } const j = (y * dw + x) * 4; if (a > 0) { o[j] = r / a; o[j + 1] = g / a; o[j + 2] = b / a; o[j + 3] = a / n; } } return o; };
const rows = Math.ceil((seeds + 1) / COLS), SW = COLS * (TW + 10) + 10, SH = rows * (TW + 10) + 10, sheet = new Uint8Array(SW * SH * 4); for (let i = 0; i < SW * SH; i++) sheet.set([20, 29, 34, 255], i * 4);
const blit = (data, k) => { const t = box(data, TW, TW), ox = 10 + (k % COLS) * (TW + 10), oy = 10 + Math.floor(k / COLS) * (TW + 10); for (let y = 0; y < TW; y++) for (let x = 0; x < TW; x++) { const i = (y * TW + x) * 4, a = t[i + 3] / 255, j = ((oy + y) * SW + ox + x) * 4; for (let c = 0; c < 3; c++) sheet[j + c] = t[i + c] * a + sheet[j + c] * (1 - a); } };
blit(master.data, 0); tiles.push({ tile: 0, label: 'archetype as painted' });
for (let s = 1; s <= seeds; s++) { const genome = { seed: 1000 + s * 7919, color: (s * 5) % 17, accent: (s * 11 + 3) % 17 }; const params = morphParamsV1(genome, record.recipeHash); const out = remapFor(params);
  const c = paletteConservationV1(master.data, out, W, H, [{ x: 0, y: 0, width: W, height: H, role: 'base' }]); blit(out, s); tiles.push({ tile: s, genome, base: params.base, accent: params.accent, conservation: c }); }
fs.writeFileSync(path.join(import.meta.dirname, 'crab-palette-sheet-01.png'), writePng(SW, SH, sheet));
fs.writeFileSync(path.join(import.meta.dirname, 'crab-palette-sheet-01.json'), JSON.stringify({ archetype: record.recipeHash, master: record.source, crop: { x: X0, y: Y0, size: S }, tiles }, null, 1) + '\n');
console.log('sheet', SW, SH, 'tiles', tiles.length);
