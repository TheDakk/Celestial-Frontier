// UI SCREENSHOT RIG (2026-07-25, Nick: "show me proofs of the UI — the
// different screens, everything that changed"). Wraps the BUILT game html:
// a pre-script seeds a veteran save (absent-safe fields ⇒ tutorial done, no
// intro), a post-script clicks a target after boot, headless Edge shoots it.
// Usage: node tools/uishot.js <outDir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const outDir = process.argv[2] || path.join(__dirname, 'uishots');
fs.mkdirSync(outDir, { recursive: true });

const game = fs.readFileSync(path.join(__dirname, '..', 'celestial-frontier.html'), 'utf8');

/* a minimal veteran save: absent fields default safely (CLAUDE.md rule 5);
   tut absent = training done, so the live UI boots directly */
const SEED = `<script>try{ localStorage.clear();
  localStorage.setItem('cfcc_save_v2', JSON.stringify({ me:'Proof Explorer', tut:1, rn:'1.6.4' }));
}catch(e){}</script>`;

const SHOTS = [
  { id: 'main-desktop',      w: 1440, h: 900,  act: `` },
  { id: 'main-phone',        w: 390,  h: 844,  act: `` },
  { id: 'settings-desktop',  w: 1440, h: 900,  act: `document.getElementById('setbtn').click();` },
  { id: 'settings-phone',    w: 390,  h: 844,  act: `document.getElementById('setbtn').click();` },
  { id: 'charters-desktop',  w: 1440, h: 900,  act: `document.getElementById('chbtn').click();` },
  { id: 'charters-phone',    w: 390,  h: 844,  act: `document.getElementById('chbtn').click();` },
  { id: 'compendium-desktop',w: 1440, h: 900,  act: `document.getElementById('codexbtn').click();` },
  { id: 'compendium-phone',  w: 390,  h: 844,  act: `document.getElementById('codexbtn').click();` },
  { id: 'atlas-desktop',     w: 1440, h: 900,  act: `document.getElementById('logbtn').click();` },
  { id: 'records-desktop',   w: 1440, h: 900,  act: `document.getElementById('recbtn').click();` },
  { id: 'prime-desktop',     w: 1440, h: 900,  act: `document.getElementById('pcdxbtn').click();` },
  { id: 'guide-desktop',     w: 1440, h: 900,  act: `document.getElementById('helpbtn').click();` },
  { id: 'guide-phone',       w: 390,  h: 844,  act: `document.getElementById('helpbtn').click();` },
  { id: 'atlas-phone',       w: 390,  h: 844,  act: `document.getElementById('logbtn').click();` },
  { id: 'records-phone',     w: 390,  h: 844,  act: `document.getElementById('recbtn').click();` },
  { id: 'tray-phone',        w: 390,  h: 844,  act: `document.getElementById('bell').click();` },
  { id: 'main-tablet',       w: 834,  h: 1112, act: `` },
  { id: 'settings-open-desktop', w: 1440, h: 900, act: `document.getElementById('setbtn').click();` },
  { id: 'tray-desktop',      w: 1440, h: 900,  act: `document.getElementById('bell').click();` },
  { id: 'charters-sel-desktop', w: 1440, h: 900, act: `document.getElementById('chbtn').click();` },
];

for (const s of SHOTS) {
  let html = game.replace('<body>', '<body>' + SEED);
  const act = `<script>setTimeout(function(){ try{ ${s.act} }catch(e){} }, 1400);</script>`;
  html = html.replace('</body>', act + '</body>');
  const page = path.join(__dirname, '_uishot_page.html');
  fs.writeFileSync(page, html);
  /* window-size is unreliable on scaled-display Windows — an exactly-sized
     IFRAME gives the game a true CSS viewport; the PNG (requested size)
     captures precisely that region from the top-left */
  const frame = path.join(__dirname, '_uishot_frame.html');
  fs.writeFileSync(frame, '<!doctype html><html><body style="margin:0;background:#04040c">'+
    '<iframe src="_uishot_page.html" style="width:'+s.w+'px;height:'+s.h+'px;border:0;display:block"></iframe></body></html>');
  const out = path.join(outDir, `ui-${s.id}.png`);
  try {
    execFileSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1',
      `--window-size=${s.w},${s.h}`, '--virtual-time-budget=6000',
      `--screenshot=${out}`, 'file:///' + frame.replace(/\\/g, '/'),
    ], { stdio: 'pipe', timeout: 90000 });
    console.log('shot:', s.id);
  } catch (e) { console.error('FAIL', s.id, String(e).slice(0, 120)); }
  fs.unlinkSync(page); try{ fs.unlinkSync(frame); }catch(e){}
}
console.log('ui shots →', outDir);
