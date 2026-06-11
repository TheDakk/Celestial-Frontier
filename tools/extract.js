// Extracts the game's <script> body from the html into main.js for editing.
// Counterpart of build.js (which splices main.js back in).
//
// Usage: node tools/extract.js [<html>] [<out.js>]
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = process.argv[2] || path.join(root, 'celestial-frontier.html');
const outPath = process.argv[3] || path.join(root, 'main.js');
const html = fs.readFileSync(htmlPath, 'utf8');
const open = html.indexOf('<script>');
const close = html.lastIndexOf('</script>');
if (open < 0 || close < 0) { console.error('script tags not found'); process.exit(1); }
fs.writeFileSync(outPath, html.slice(open + '<script>'.length, close));
console.log('extracted', outPath);
