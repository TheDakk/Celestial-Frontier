// One review page: per film, the turn-0 approach and impact and the turn-1 impact (1024×576 stills at half size), rows = films.
// Run from port/v2: node ../../audits/BATTLE2_LIBRARY_20260924/sheet.mjs <take, e.g. 02>  (films <pair>-<take>)
import fs from 'node:fs'; import path from 'node:path';
import { readPng, writePng } from '../../port/v2/tools/anatomy-verify/png.mjs';
const O = import.meta.dirname, take = process.argv[2] ?? '01', films = ['python-vs-tarantula', 'eagle-vs-beetle', 'chimpanzee-vs-centipede', 'treefrog-vs-fruitbat'].map((f) => f + '-' + take), stills = ['turn0-hit-approach-50.png', 'turn0-hit-impact.png', 'turn1-hit-impact.png'];
const TW = 512, TH = 288, PAD = 6, W = PAD + stills.length * (TW + PAD), H = PAD + films.length * (TH + PAD), out = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) out.set([20, 29, 34, 255], i * 4);
for (const [r, f] of films.entries()) for (const [c, s] of stills.entries()) { const p = path.join(O, f, s); if (!fs.existsSync(p)) continue; const img = readPng(fs.readFileSync(p));
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { let acc = [0, 0, 0]; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = ((y * 2 + dy) * img.width + x * 2 + dx) * 4; for (let k = 0; k < 3; k++) acc[k] += img.data[i + k]; } const j = ((PAD + r * (TH + PAD) + y) * W + PAD + c * (TW + PAD) + x) * 4; for (let k = 0; k < 3; k++) out[j + k] = acc[k] / 4; } }
fs.writeFileSync(path.join(O, 'library-battles-sheet-' + take + '.png'), writePng(W, H, out)); console.log('sheet', W, H);
