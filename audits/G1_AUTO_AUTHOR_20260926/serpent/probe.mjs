/** Measures only: serpentProfile on each painting (no authoring). Usage (repo root): node .../serpent/probe.mjs <master.png> ... */
import path from 'node:path'; import { createRequire } from 'node:module';
import { serpentProfile } from '../../../port/v2/tools/anatomy-verify/serpent-author.mjs';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
for (const f of process.argv.slice(2)) { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const P = serpentProfile(data, info.width, info.height); console.log(JSON.stringify({ f: f.split('/').slice(-2, -1)[0], ok: P.ok, reasons: P.reasons, m: P.measures })); }
