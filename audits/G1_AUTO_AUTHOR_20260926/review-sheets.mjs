/** Full-size review sheets (Claude 2026-10-04): one PNG per native film, so the full-size visual review is one image per subject
 * instead of hand-built crops. Each sheet stacks the three frames that caught every defect in sessions 6-8 at FULL 1024x576 size
 * (turn1-hit-reaction-50, turn3-hit-idle-50 = victory/held faint, turn3-hit-idle-90 = late idle; fliers need full frames), then a 2x
 * zoom of each fighter's band from turn3-hit-idle-50 (where seams, islands and ribbons show). Data only: no verdict.
 * Usage (repo root): node audits/G1_AUTO_AUTHOR_20260926/review-sheets.mjs <outDir> <nativeDir>... -> <outDir>/<name>-frames.png + <name>-zoom.png */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const [out, ...dirs] = process.argv.slice(2); if (!out || !dirs.length) throw Error('usage: review-sheets.mjs <outDir> <nativeDir>...');
fs.mkdirSync(out, { recursive: true });
const FRAMES = ['turn1-hit-reaction-50', 'turn3-hit-idle-50', 'turn3-hit-idle-90'], W = 1024, H = 576;
/* fighter bands: left fighter x 0..512, right 512..1024, rows 150..560 (both land and water arenas) */
const BANDS = [{ left: 0, top: 150, width: 512, height: 410 }, { left: 512, top: 150, width: 512, height: 410 }];
for (const d of dirs) { const name = path.basename(d) === 'native' ? path.basename(path.dirname(d)) : path.basename(d);
  const have = FRAMES.filter((f) => fs.existsSync(path.join(d, f + '.png'))); if (!have.length) { console.log(JSON.stringify({ name, status: 'NO_STILLS' })); continue; }
  const zoomSrc = path.join(d, (have.includes('turn3-hit-idle-50') ? 'turn3-hit-idle-50' : have[0]) + '.png');
  const zooms = await Promise.all(BANDS.map((b) => sharp(zoomSrc).extract(b).resize({ width: b.width * 2, kernel: 'nearest' }).toBuffer()));
  /* two files so a viewer never downscales: <name>-frames.png (full frames) and <name>-zoom.png (both fighters at 2x) */
  await sharp({ create: { width: W, height: have.length * H, channels: 3, background: '#000' } }).composite(have.map((f, i) => ({ input: path.join(d, f + '.png'), left: 0, top: i * H }))).png().toFile(path.join(out, name + '-frames.png'));
  await sharp({ create: { width: 2048, height: 820, channels: 3, background: '#000' } }).composite([{ input: zooms[0], left: 0, top: 0 }, { input: zooms[1], left: 1024, top: 0 }]).png().toFile(path.join(out, name + '-zoom.png'));
  console.log(JSON.stringify({ name, sheets: [name + '-frames.png', name + '-zoom.png'], frames: have })); }
