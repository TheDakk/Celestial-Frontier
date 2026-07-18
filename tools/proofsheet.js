// Proof-sheet renderer: lifts named functions VERBATIM from main.js into a
// standalone page, runs a scene script against them, and screenshots the
// result with headless Edge. Art review happens here before Nick sees it.
//
// Usage: node tools/proofsheet.js <sheet.js> <out.png>
//   sheet.js exports: { lift: ['fnName', ...], draw: stringified fn (page-side),
//                       width, height }
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

const sheet = require(path.resolve(process.argv[2]));
const out = path.resolve(process.argv[3] || 'proof.png');

// lift a top-level `function name(){...}` or `const name=...;` by brace/paren scan
function lift(name) {
  let i = main.indexOf('function ' + name + '(');
  if (i >= 0) {
    let d = 0, j = main.indexOf('{', i);
    for (let k = j; k < main.length; k++) {
      if (main[k] === '{') d++;
      else if (main[k] === '}') { d--; if (!d) return main.slice(i, k + 1); }
    }
  }
  i = main.search(new RegExp('\\n(const|let) ' + name + '[=\\s]'));
  if (i >= 0) {
    const end = main.indexOf(';\n', i);
    return main.slice(i + 1, end + 1);
  }
  throw new Error('cannot lift: ' + name);
}

let lifted = (sheet.lift || []).map(lift).join('\n');
if (sheet.liftBetween) {
  const [a, b] = sheet.liftBetween;
  const i = main.indexOf(a), j = main.indexOf(b, i + a.length);
  if (i < 0 || j < 0) throw new Error('liftBetween markers not found');
  lifted += '\n' + main.slice(i, j);
}
const html = `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#07080f">
<canvas id="cv" width="${sheet.width}" height="${sheet.height}"></canvas>
<script>
const TAU=Math.PI*2;
${lifted}
(${sheet.draw})(document.getElementById('cv').getContext('2d'));
</script></body>`;
const page = path.join(__dirname, '_proof_page.html');
fs.writeFileSync(page, html);
execFileSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--no-sandbox',
  `--window-size=${sheet.width},${sheet.height}`,
  `--screenshot=${out}`, 'file:///' + page.replace(/\\/g, '/'),
], { stdio: 'pipe', timeout: 60000 });
fs.unlinkSync(page);
console.log('proof sheet written:', out);
