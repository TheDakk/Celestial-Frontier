// D2 G7 — one review sheet for the first guardian: the master, the compiler's reading, Codex's hand-fit labels, and the
// film stills (rest fill -01 vs tallest-pose fill -02, and the bear as target). Deterministic box downscale, no library.
// Run from the repo root: node audits/VISION_D2_GUARDIAN_20260921/G7_SHEET/compose.mjs
import fs from 'node:fs'; import path from 'node:path';
import { readPng, writePng } from '../../../port/v2/tools/anatomy-verify/png.mjs';
const R = process.cwd();
const tiles = [
  ['generation-01 master (1254², retained)', 'audits/VISION_D2_GUARDIAN_20260921/generation-01/brown-bear-master.png'],
  ['compiler reading (sheet-01/brown-bear.png)', 'audits/INTAKE_COMPILER_20260921/sheet-01/brown-bear.png'],
  ['Codex hand fit-01 labels (comparison truth)', 'audits/VISION_D2_GUARDIAN_20260921/fit-01/labels.png'],
  ['film -01: rest fill 0.9 (head leaves the frame when rearing)', 'audits/BATTLE2_D2_GUARDIAN_FILM_20260922/bear-vs-crab-01/turn0-hit-approach-50.png'],
  ['film -02: tallest-pose fill 0.96 (rest 0.70), guardian stands', 'audits/BATTLE2_D2_GUARDIAN_FILM_20260922/bear-vs-crab-02/turn0-hit-approach-50.png'],
  ['film: the bear as target (mirrored stands)', 'audits/BATTLE2_D2_GUARDIAN_FILM_20260922/crab-attacks-bear-01/turn0-hit-reaction-50.png'],
];
const TW = 512, TH = 360, PAD = 12, COLS = 3, BG = [20, 29, 34, 255];
const rows = Math.ceil(tiles.length / COLS), W = COLS * (TW + PAD) + PAD, H = rows * (TH + PAD) + PAD;
const out = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) out.set(BG, i * 4);
const box = (img, dw, dh) => { const o = new Uint8Array(dw * dh * 4); const sx = img.width / dw, sy = img.height / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy)); let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * img.width + xx) * 4, al = img.data[i + 3]; r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++; }
    const j = (y * dw + x) * 4; if (a > 0) { o[j] = r / a; o[j + 1] = g / a; o[j + 2] = b / a; o[j + 3] = a / n; } } return o; };
// Codex's labels.png stores part ids as small values (one id per pixel, near-black on screen): colourise by id so the eye
// can read the fit; ids map to hues deterministically (golden-angle), 0 stays background.
const colourise = (img) => { const o = new Uint8Array(img.data.length); for (let i = 0; i < img.width * img.height; i++) { const id = img.data[i * 4], a = img.data[i * 4 + 3]; if (!a || id === 0) continue; const h = (id * 137.508) % 360, f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (0.55 - 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; o[i * 4] = f(0); o[i * 4 + 1] = f(8); o[i * 4 + 2] = f(4); o[i * 4 + 3] = 255; } return { width: img.width, height: img.height, data: o }; };
const manifest = [];
tiles.forEach(([label, rel], k) => { let img = readPng(fs.readFileSync(path.join(R, rel))); if (rel.endsWith('/labels.png')) img = colourise(img); const s = Math.min(TW / img.width, TH / img.height), dw = Math.round(img.width * s), dh = Math.round(img.height * s);
  const t = box(img, dw, dh), ox = PAD + (k % COLS) * (TW + PAD) + ((TW - dw) >> 1), oy = PAD + Math.floor(k / COLS) * (TH + PAD) + ((TH - dh) >> 1);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const i = (y * dw + x) * 4, a = t[i + 3] / 255, j = ((oy + y) * W + ox + x) * 4; for (let c = 0; c < 3; c++) out[j + c] = t[i + c] * a + out[j + c] * (1 - a); out[j + 3] = 255; }
  manifest.push({ tile: k + 1, label, source: rel, size: [img.width, img.height], drawn: [dw, dh], at: [ox, oy] }); });
fs.writeFileSync(path.join(R, 'audits/VISION_D2_GUARDIAN_20260921/G7_SHEET/brown-bear-review-sheet.png'), writePng(W, H, out));
fs.writeFileSync(path.join(R, 'audits/VISION_D2_GUARDIAN_20260921/G7_SHEET/manifest.json'), JSON.stringify({ sheet: 'brown-bear-review-sheet.png', size: [W, H], tiles: manifest }, null, 2) + '\n');
console.log(JSON.stringify({ W, H, tiles: manifest.length }));
