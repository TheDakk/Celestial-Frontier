// The guardian-size look page: rows = the guardian's stand line (0.78 = as shipped, 0.87, 0.95 lower in the foreground),
// columns = turn-0 approach (walking), turn-1 impact (the claw swing on the dodge — the turn-0 impact still is bleached by the hit flash by design), turn-2 victory (idle-50, idle-90). 1024×576 stills at half size.
// Run from port/v2: node ../../audits/BATTLE2_GUARDIAN_SIZE_20260924/sheet.mjs
import fs from 'node:fs'; import path from 'node:path';
import { readPng, writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const O = import.meta.dirname, films = ['bear-stand-0.78', 'bear-stand-0.87', 'bear-stand-0.95'];
const stills = ['turn0-hit-approach-50.png', 'turn1-dodge-impact.png', 'turn2-hit-idle-50.png', 'turn2-hit-idle-90.png'];
const TW = 512, TH = 288, PAD = 6, W = PAD + stills.length * (TW + PAD), H = PAD + films.length * (TH + PAD), out = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) out.set([20, 29, 34, 255], i * 4);
for (const [r, f] of films.entries()) for (const [c, s] of stills.entries()) {
  const p = path.join(O, f, s); if (!fs.existsSync(p)) throw Error('missing still ' + p);
  const img = readPng(fs.readFileSync(p)); if (img.width !== TW * 2 || img.height !== TH * 2) throw Error('unexpected still size ' + p);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const acc = [0, 0, 0]; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = ((y * 2 + dy) * img.width + x * 2 + dx) * 4; for (let k = 0; k < 3; k++) acc[k] += img.data[i + k]; }
    const o = ((PAD + r * (TH + PAD) + y) * W + PAD + c * (TW + PAD) + x) * 4; out.set([acc[0] / 4, acc[1] / 4, acc[2] / 4, 255], o);
  }
}
fs.writeFileSync(path.join(O, 'guardian-size-sheet-01.png'), writePng(W, H, out)); console.log('sheet', W, H);
