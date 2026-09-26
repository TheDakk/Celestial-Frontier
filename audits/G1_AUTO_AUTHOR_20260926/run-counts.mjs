/** G1 v3 diagnostic: the independent limb counter on every corpus painting (its own paint only), plus the inventory its own hand
 * polygons name. Run from the worktree root: node audits/G1_AUTO_AUTHOR_20260926/run-counts.mjs → counts-v3.json */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {prepareSubject} from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
import {countVisibleAnatomy, referenceInventory} from '../../port/v2/tools/anatomy-verify/limb-counter.mjs';
const HERE = import.meta.dirname, ROOT = path.resolve(HERE, '../..');
const require = createRequire(path.join(ROOT, 'port/v2/package.json'));
const sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'corpus.json'), 'utf8')).subjects, rows = [];
for (const s of corpus) {
  const dir = path.join(ROOT, s.packet), { data, info } = await sharp(path.join(dir, 'master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const p = prepareSubject(new Uint8ClampedArray(data), info.width, info.height), a = JSON.parse(fs.readFileSync(path.join(dir, 'authoring.json'), 'utf8'));
  const c = countVisibleAnatomy(p.mask, p.w, p.h), inv = referenceInventory(c, a);
  const row = { id: s.id, family: s.family, appendages: c.appendages.length, byClass: c.byClass, detached: c.detached.length, coreRadius: c.coreRadius,
    inventory: inv.map((x) => `${x.names.join('/')}:${x.owners.join('+')}:${(100 * x.frac).toFixed(1)}%`) };
  rows.push(row); console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(HERE, 'counts-v3.json'), JSON.stringify(rows, null, 1) + '\n');
