// Invariant checks for the assembled game html (HANDOFF §3/§4):
//   1. extracted <script> passes `node --check`
//   2. CSS braces balance inside <style>
//   3. no duplicate element ids in static markup
//   4. determinism greps: no Math.random()/Date.now() inside domain modules
//      (lines tagged between "@module <name> [domain]" and "@end" banners)
//
// Usage: node tools/checks.js <html>
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
let failed = 0;
function report(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : ''));
  if (!ok) failed++;
}

// 1. node --check on the extracted script
const open = html.indexOf('<script>');
const close = html.lastIndexOf('</script>');
const js = html.slice(open + '<script>'.length, close);
const tmp = path.join(os.tmpdir(), 'cf-syntax-check.js');
fs.writeFileSync(tmp, js);
try {
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  report('script syntax (node --check)', true);
} catch (e) {
  report('script syntax (node --check)', false, String(e.stderr || e.message).slice(0, 400));
}

// 2. CSS brace balance
const styleM = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleM) report('css brace balance', false, 'no <style> block');
else {
  const css = styleM[1];
  const opens = (css.match(/{/g) || []).length;
  const closes = (css.match(/}/g) || []).length;
  report('css brace balance', opens === closes, opens + ' { vs ' + closes + ' }');
}

// 3. duplicate ids in static markup (outside the script)
const markup = html.slice(0, open) + html.slice(close);
const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
report('no duplicate element ids', dup.length === 0, dup.length ? 'dups: ' + [...new Set(dup)].join(',') : ids.length + ' ids');

// 4. determinism greps inside domain-tagged modules
const lines = js.split('\n');
let inDomain = null;
const offenders = [];
lines.forEach((l, i) => {
  const open = l.match(/@module\s+(\S+).*\[domain\]/);
  if (open) inDomain = open[1];
  if (/@end\b/.test(l)) inDomain = null;
  if (inDomain && /(Math\.random|Date\.now)\s*\(/.test(l)) offenders.push(inDomain + ':' + (i + 1));
});
report('no Math.random/Date.now in domain modules', offenders.length === 0, offenders.join(' ') || 'clean');

process.exit(failed ? 1 : 0);
