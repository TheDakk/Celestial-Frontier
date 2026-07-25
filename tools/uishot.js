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

/* a POPULATED veteran save (cert gap: Shipyard/inventory/paperdoll proofs need
   real contents): materials across all five families incl. exceptional units,
   crafted parts, a mixed-tier loadout worn (T2 rig/hazmat/visor + T5 cosmic
   gauntlets + relic-free rest), affixes on two pieces. All fields load-clamped. */
const SEED_FULL = `<script>try{ localStorage.clear();
  localStorage.setItem('cfcc_save_v2', JSON.stringify({ me:'Proof Explorer', tut:1, rn:'1.6.4', essence:145,
    cargo:[["Fe",42],["Ti",9],["Si",28],["Al",17],["Cu",14],["W",6],["Cr",5],["H",30],["CH4",12],["H2O",18],["S",8],["O",21],["He3",3],["Au",4],["Pt",2],["Ag",5],["Nd",2],["U",2],["Ir",1],["Vg",1],["Pz",1],["Pls",1],["Pro",1]],
    cgx:[["Fe",5],["Ti",2],["Au",1]],
    items:[["plate",6],["wire",4],["chip",3],["lens",2],["weave",3],["cell",2],["coil",2],["navcore",1],["hullseg",2],["servo",1],["cryogel",1],["jumpdrive",1],["rig2",1],["hazmat",1],["visor",1],["magboots",1],["gripgloves",1],["earpiece",1],["compass",1],["stabil",1],["fieldlegs",1],["cg-plasma",1]],
    eq:{tool:"rig2",suit:"hazmat",helmet:"visor",boots:"magboots",gloves:"cg-plasma",ears:"earpiece",necklace:"compass",module:"stabil",legs:"fieldlegs"},
    ea:{tool:{k:"yield",v:0.22,forId:"rig2"},gloves:{k:"strike",v:0.04,forId:"cg-plasma"}},
    ctb:"mat" }));
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
  { id: 'prime-phone',       w: 390,  h: 844,  act: `document.getElementById('pcdxbtn').click();` },
  { id: 'tray-phone',        w: 390,  h: 844,  act: `document.getElementById('bell').click();` },
  { id: 'main-tablet',       w: 834,  h: 1112, act: `` },
  { id: 'settings-open-desktop', w: 1440, h: 900, act: `document.getElementById('setbtn').click();` },
  { id: 'tray-desktop',      w: 1440, h: 900,  act: `document.getElementById('bell').click();` },
  { id: 'charters-sel-desktop', w: 1440, h: 900, act: `document.getElementById('chbtn').click();` },
  { id: 'search-earth-desktop', w: 1440, h: 900, act: `const si=document.getElementById('searchin'); si.value='earth'; si.dispatchEvent(new Event('input',{bubbles:true}));` },
  { id: 'main-tablet-portrait', w: 834, h: 1112, act: `` },
  /* populated-save proofs (Shipyard + 3-tab inventory + equipped paperdoll) */
  { id: 'shipyard-desktop',  w: 1440, h: 900,  full: 1, act: `document.getElementById('cargobtn').click();` },
  { id: 'shipyard-phone',    w: 390,  h: 844,  full: 1, act: `document.getElementById('cargobtn').click();` },
  { id: 'inv-materials-desktop', w: 1440, h: 900, full: 1, act: `document.getElementById('rank').click();` },
  { id: 'inv-materials-phone',   w: 390,  h: 844, full: 1, act: `document.getElementById('rank').click();` },
  { id: 'inv-craftables-desktop', w: 1440, h: 900, full: 1, act: `document.getElementById('rank').click(); const t=document.querySelector('[data-ivt="craft"]'); if(t) t.click();` },
  { id: 'inv-gear-desktop',  w: 1440, h: 900, full: 1, act: `document.getElementById('rank').click(); const t=document.querySelector('[data-ivt="gear"]'); if(t) t.click();` },
  { id: 'inv-gear-phone',    w: 390,  h: 844, full: 1, act: `document.getElementById('rank').click(); const t=document.querySelector('[data-ivt="gear"]'); if(t) t.click();` },
];

for (const s of SHOTS) {
  let html = game.replace('<body>', '<body>' + (s.full ? SEED_FULL : SEED));
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
