/* CONTENT REGISTRY — capture/verify the load-path validation surface
   (port Phase 2: importSaveV2's id sets, maps and clamp bounds).

   USAGE
     node tools/contentregistry.js --capture
     node tools/contentregistry.js --check     # a GATE

   ⚠ Unlike the parity fixtures, this file legitimately CHANGES when content
   ships (a new item, a new tech). --check failing after a content change is
   the tool working: re-capture IN THE SAME BATCH as the content change, the
   same discipline as the system docs. Never re-capture to hide an
   UNINTENDED difference. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootProbe, root } = require('./_probeboot.js');

const OUT = path.join(root, 'port', 'baseline-v1.8.9', 'content-registry.json');
const CAPTURE = process.argv.includes('--capture');
const CHECK = process.argv.includes('--check');
if (!CAPTURE && !CHECK) { console.error('usage: node tools/contentregistry.js --capture | --check'); process.exit(2); }

bootProbe({ probe: 'contentregistry-probe.js', global: '__CONTENTREG__', quiet: true }).then(({ value, errors }) => {
  if (!value || value.error) { console.error('probe failed: ' + JSON.stringify(value || errors.slice(0, 3))); process.exit(1); }
  const body = { _comment: 'Load-path VALIDATION SURFACE for importSaveV2 (id sets / maps / clamp bounds loadSave consumes). Changes legitimately with shipped content — re-capture in the same batch as a content change; never to hide an unintended diff.', capturedAgainst: 'v' + value.gameVersion, ...value };
  if (CAPTURE) {
    fs.writeFileSync(OUT, JSON.stringify(body, null, 1));
    console.log('CONTENT REGISTRY captured -> ' + path.relative(root, OUT) +
      ' (' + Object.keys(value.items).length + ' items, ' + value.materials.length + ' materials, ' +
      value.techs.length + ' techs, tierMax ' + value.tierMax + ')');
    process.exit(0);
  }
  const want = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const a = JSON.stringify({ ...want, _comment: 0, capturedAgainst: 0 });
  const b = JSON.stringify({ ...body, _comment: 0, capturedAgainst: 0 });
  if (a !== b) { console.error('CONTENT REGISTRY: FAIL — surface drifted from the fixture. If a content change shipped this batch, re-capture WITH it; otherwise investigate.'); process.exit(1); }
  console.log('CONTENT REGISTRY: PASS — validation surface identical');
  process.exit(0);
});
