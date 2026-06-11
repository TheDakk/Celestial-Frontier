// Produces a probe build of the game html: injects a window.__PROBE_HOOK__
// export just before the game IIFE's closing `})();` so the harness probe can
// reach otherwise-private bindings. Works on both the original and refactored
// file as long as the probed names stay visible at the IIFE's top scope.
//
// Usage: node tools/make-probe-build.js <in.html> <out.html>
'use strict';
const fs = require('fs');
const path = require('path');
const names = JSON.parse(fs.readFileSync(path.join(__dirname, 'probe-names.json'), 'utf8'));
const input = fs.readFileSync(process.argv[2], 'utf8');
const CLOSE = '\n})();\n</script>';
const at = input.lastIndexOf(CLOSE);
if (at < 0) { console.error('IIFE close not found'); process.exit(1); }
const hook = '\ntry{ window.__PROBE_HOOK__ = { ' + names.join(', ') + ' }; }' +
  'catch(e){ window.__PROBE_HOOK_ERR__ = String(e); }\n';
const out = input.slice(0, at) + hook + input.slice(at);
fs.writeFileSync(process.argv[3], out);
console.log('probe build written:', process.argv[3], '(', names.length, 'hooked names )');
