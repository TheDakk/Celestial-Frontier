import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import { resolve } from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
registerHooks({ resolve });
const { decodePng } = await import('../../port/v2/apps/game/src/morph/png-decode.ts');
const { validateThemeDelivery } = await import('../../port/v2/apps/game/src/effects/theme-delivery.ts');
const base = import.meta.dirname, root = path.resolve(base, '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const themes = [...new Set(JSON.parse(fs.readFileSync(path.join(base, 'requests.json'))).rows.map(r => r.theme))];
const rows = [];
for (const theme of themes) {
  const folder = path.join(base, theme, theme==='stone'?'shards':['storm','void','sand','psionic'].includes(theme) ? 'final' : '');
  const anchorsPath = path.join(folder, 'anchors.json');
  const anchors = JSON.parse(fs.readFileSync(anchorsPath)), images = new Map();
  for (const p of anchors.phases) {
    const bytes = fs.readFileSync(path.join(folder, p.keyedImage));
    const png = await decodePng(new Uint8Array(bytes));
    images.set(p.keyedImage, { width: png.width, height: png.height, rgba: png.rgba,
      hasAlphaChannel: png.colorType === 6 || png.colorType === 4, sha256: sha(bytes) });
  }
  const report = validateThemeDelivery({ theme, anchors, images });
  rows.push({ anchors: path.relative(root, anchorsPath), ...report });
}
const validator = 'port/v2/apps/game/src/effects/theme-delivery.ts';
const report = { schema: 'cf.c132-effect-deliveries/v1', validator,
  validatorSha256: sha(fs.readFileSync(path.join(root, validator))), visualAcceptance: false,
  nativeProof: 'NOT_RUN', rows };
if (process.argv.includes('--write')) fs.writeFileSync(path.join(base, 'delivery-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(rows.map(r => ({ theme: r.theme, ok: r.ok, findings: r.findings,
  phases: Object.fromEntries(Object.entries(r.phases).map(([p, m]) => [p, { fringeRatio: m.fringeRatio, accentShare: m.accentShare, keyInShape: m.keyInShape }])) })), null, 2));
process.exitCode = rows.every(r => r.ok) ? 0 : 1;
