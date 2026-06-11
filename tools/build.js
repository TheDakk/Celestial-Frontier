// Reassembles the game html from main.js (splices the script body between the
// page's <script> and </script> tags), then leaves validation to checks.js.
//
// Usage: node tools/build.js [--template <html>] [--js <main.js>] [--out <html>]
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : dflt;
}
const tpl = arg('--template', path.join(root, 'celestial-frontier.html'));
const jsPath = arg('--js', path.join(root, 'main.js'));
const out = arg('--out', path.join(root, 'celestial-frontier.html'));

const html = fs.readFileSync(tpl, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
const open = html.indexOf('<script>');
const close = html.lastIndexOf('</script>');
if (open < 0 || close < 0 || close < open) { console.error('script tags not found'); process.exit(1); }
const assembled = html.slice(0, open + '<script>'.length) + js + html.slice(close);
fs.writeFileSync(out, assembled);
console.log('assembled', out, '(', assembled.length, 'chars )');
