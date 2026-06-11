// Lists top-level declarations in main.js with line numbers.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const lines = src.split('\n');
const out = [];
lines.forEach((l, i) => {
  const m =
    l.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/) ||
    l.match(/^class\s+([A-Za-z_$][\w$]*)/) ||
    l.match(/^(?:const|let|var)\s+/);
  if (m) out.push((i + 1) + '\t' + l.slice(0, 110).trim());
});
console.log(out.length + ' top-level declarations');
fs.writeFileSync(path.join(__dirname, 'structure.txt'), out.join('\n'));
