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
/* Locating the IIFE by an exact-byte anchor made this tool checkout-dependent: a
   CRLF clone (Git for Windows defaults core.autocrlf=true) has no "\n})();\n"
   anywhere, so this exited "IIFE close not found" and took validate.js, smoke,
   the fingerprint and the deploy gate down with it — a fresh clone could not
   verify anything. .gitattributes now pins LF; this fallback means a stray CRLF
   checkout degrades to "still works" instead of "nothing runs".
   Found 2026-07-29 by cloning the repo cold and running the battery. */
const CLOSE = '\n})();\n</script>';
let at = input.lastIndexOf(CLOSE);
if (at < 0) {
  const CRLF = '\r\n})();\r\n</script>';
  at = input.lastIndexOf(CRLF);
  if (at >= 0) console.warn('warning: CRLF checkout detected — see .gitattributes (the shipped html should be LF)');
}
if (at < 0) { console.error('IIFE close not found (searched both LF and CRLF forms)'); process.exit(1); }
/* live getters, not a snapshot: scalar `let` bindings (sfxVol, motionMode, …)
   change after boot, and the smoke suite asserts on their CURRENT values */
const hook = '\ntry{ window.__PROBE_HOOK__ = { ' +
  names.map(n => 'get ' + n + '(){ return ' + n + '; }').join(', ') + ' }; }' +
  'catch(e){ window.__PROBE_HOOK_ERR__ = String(e); }\n';
const out = input.slice(0, at) + hook + input.slice(at);
fs.writeFileSync(process.argv[3], out);
console.log('probe build written:', process.argv[3], '(', names.length, 'hooked names )');
