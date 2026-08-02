/* proportioncheck.mjs — THE PROPORTION INSTRUMENT (wave 22).

   Nick, looking at a wave-21 strip: "the bodies on a lot of the creatures are
   not proportionate… some seem way too elongated, especially on mammals."

   Every other instrument on this project answers a yes/no about ONE asset —
   did it paint, is it a duplicate, does it clip. None of them can see a shape
   that is wrong across a whole family, because each animal looks individually
   fine until you line its aspect ratio up against its relatives. This renders
   a whole kingdom, measures each subject's ink bounding box, and reports the
   distribution plus every outlier against a plausible envelope.

   The fit pass scales UNIFORMLY, so aspect ratio survives it: what this
   measures is the proportion the painter actually drew.
   Usage: node tools/proportioncheck.mjs [fauna|flora|fungi|microbe] [--json out.json] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const kingdom = process.argv[2] || 'fauna';
const jsonIx = process.argv.indexOf('--json');
const jsonOut = jsonIx > 0 ? process.argv[jsonIx + 1] : null;

execSync('npx vite build', { cwd: appDir, stdio: 'ignore' });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html?prop=' + encodeURIComponent(kingdom);

const udd = path.join(os.tmpdir(), 'cf-prop-' + process.pid);
const port = 9733 + (process.pid % 100);
const edge = spawn(EDGE, ['--headless=new', '--no-sandbox', '--no-first-run',
  '--disable-component-extensions-with-background-pages', '--disable-component-update', '--disable-background-networking',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let ws0 = null;
for (let t = 0; t < 50 && !ws0; t++) { await sleep(400); try { ws0 = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl; } catch { /* boot */ } }
if (!ws0) { console.error('no CDP'); edge.kill(); process.exit(2); }
const ws = new WebSocket(ws0);
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })); });
const t0 = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t0.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
const errs = [];
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Runtime.exceptionThrown') errs.push(String(m.params?.exceptionDetails?.exception?.description || 'exception')); });
await send('Page.navigate', { url: URL0 }, sess);
const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || '').slice(0, 200));
  return r.result.value;
};
let data = null;
for (let s = 0; s < 900 && !data; s++) { await sleep(300); data = await evalIn('(window.__CF_PROP__&&window.__CF_PROP__.done)?window.__CF_PROP__:null'); }
if (!data) { console.error('proportions never measured'); ws.close(); edge.kill(); server.close(); process.exit(1); }
ws.close(); edge.kill(); server.close();

const rows = data.rows;
rows.sort((a, b) => b.aspect - a.aspect);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1));

/* THE ENVELOPE. A land vertebrate drawn in profile — head, body, legs and tail
   inside one frame — lands between about 1.1 and 2.8 wide-to-tall. Snakes,
   eels, worms and whales legitimately run far longer, and bats/jellies far
   taller, so the envelope is applied per SHAPE CLASS, not to everything. */
const LONG = /Snake|Python|Boa|Cobra|Viper|Adder|Mamba|Anaconda|Eel|Worm|Lamprey|Oarfish|Whale|Dolphin|Porpoise|Shark|Ray|Fish|Tuna|Marlin|Sailfish|Swordfish|Barracuda|Pike|Gar|Sturgeon|Salmon|Trout|Cod|Herring|Sardine|Anchovy|Mackerel|Wahoo|Bonefish|Dugong|Manatee|Narwhal|Beluga|Orca|Seal|Sea Lion|Walrus|Otter|Weasel|Ferret|Stoat|Mink|Marten|Millipede|Centipede|Caterpillar|Larva|Grub|Newt|Salamander|Skink|Monitor|Iguana|Crocodile|Alligator|Gharial|Caiman|Tuatara|Axolotl|Siren|Caecilian|Leech|Pipefish|Seahorse|Needlefish|Halfbeak|Ribbonfish|Cusk|Hagfish|Snipe Eel|Gulper|Arowana|Arapaima|Remora|Minnow|Char|Bowfin|Tarpon|Walleye|Pollock|Wrasse|Mullet|Blenny|Goby|Loach|Tetra|Barb|Danio|Rasbora|Guppy|Molly|Perch|Bass|Carp|Catfish|Grouper|Snapper|Sole|Flounder|Halibut|Turbot|Plaice|Slug|Chiton|Harvestman|Sea Spider|Camel Spider|Whip Spider|Cricket|Stick Insect|Mantis|Damselfly|Mayfly|Stonefly|Scorpionfly|Dobsonfly|Caddisfly|Earwig|Silverfish|Firebrat|Stonefish|Weevil/i;
const TALL = /Bat|Jelly|Medusa|Siphonophore|Anemone|Coral|Sponge|Crinoid|Feather Star|Sea Pen|Hydra|Man o|Salp|Pyrosome|Barnacle|Tube Worm|Squirt/i;

const hi = [], lo = [];
let skipped = 0;
for (const r of rows) {
  if (LONG.test(r.name) || TALL.test(r.name)) { skipped++; continue; }
  if (r.aspect > 2.80) hi.push(r);
  if (r.aspect < 0.75) lo.push(r);
}
const asp = rows.map((r) => r.aspect).sort((a, b) => a - b);
const q = (p) => asp[Math.min(asp.length - 1, Math.floor(asp.length * p))];
console.log(`PROPORTION CHECK — ${kingdom}: ${rows.length} measured`);
console.log(`  ${skipped} subjects excluded as legitimately long- or tall-bodied forms (NOT silently — they are simply not held to the land-vertebrate envelope)`);
console.log(`  aspect (w/h)  min ${q(0).toFixed(2)}  p25 ${q(0.25).toFixed(2)}  median ${q(0.5).toFixed(2)}  p75 ${q(0.75).toFixed(2)}  p95 ${q(0.95).toFixed(2)}  max ${q(1).toFixed(2)}`);
if (hi.length) {
  console.log(`\n  ★ ${hi.length} TOO ELONGATED (aspect > 2.80, and not a legitimately long-bodied form):`);
  for (const r of hi.slice(0, 40)) console.log(`      ${r.aspect.toFixed(2)}  ${r.name}  (${r.w}x${r.h})`);
  if (hi.length > 40) console.log(`      … and ${hi.length - 40} more`);
}
if (lo.length) {
  console.log(`\n  ★ ${lo.length} TOO TALL/NARROW (aspect < 0.75):`);
  for (const r of lo.slice(0, 20)) console.log(`      ${r.aspect.toFixed(2)}  ${r.name}  (${r.w}x${r.h})`);
}
/* ★ INTERNAL PROPORTION (wave 22b). Aspect ratio measures the WHOLE subject and
   is blind to a head twice the size it should be — the bbox is identical either
   way. `lobe` is the tallest end-of-body ink divided by the tallest trunk ink:
   above ~1.15 an end lobe is out-massing the body it hangs off. Upright animals
   (apes, penguins, birds on legs) and things that are ALL head (jellies, crabs,
   pufferfish) legitimately exceed it, so they are named out — and counted. */
const HEADY = /Ape|Gorilla|Chimp|Bonobo|Orangutan|Gibbon|Monkey|Macaque|Baboon|Lemur|Loris|Tarsier|Penguin|Auk|Puffin|Owl|Bat|Jelly|Medusa|Anemone|Coral|Sponge|Crab|Lobster|Shrimp|Krill|Prawn|Crayfish|Barnacle|Urchin|Star|Cucumber|Squirt|Pufferfish|Sunfish|Boxfish|Frogfish|Anglerfish|Batfish|Seahorse|Snail|Nautilus|Ammonite|Clam|Oyster|Scallop|Mussel|Abalone|Squid|Octopus|Cuttlefish|Man-of-War|Salp|Pyrosome|Tardigrade|Mite|Tick|Spider|Scorpion|Frog|Toad|Tadpole|Beetle|Weevil|Ant|Bee|Wasp|Fly|Moth|Butterfly|Cicada|Aphid|Hopper|Bug|Roach|Termite|Mantis|Dragonfly|Damselfly|Lacewing|Earwig|Louse|Flea/i;
let heady = 0;
const bigHead = [];
for (const r of rows) {
  if (r.lobe === undefined) continue;
  if (HEADY.test(r.name)) { heady++; continue; }
  if (r.lobe > 1.15) bigHead.push(r);
}
bigHead.sort((a, b) => b.lobe - a.lobe);
console.log(`\n  ${heady} subjects excluded from the end-lobe check as legitimately head-dominant or upright`);
if (bigHead.length) {
  console.log(`  ★ ${bigHead.length} END LOBE OUT-MASSES THE TRUNK (lobe > 1.15 — a head or rump bigger than the body it hangs off):`);
  for (const r of bigHead.slice(0, 40)) console.log(`      ${r.lobe.toFixed(2)}  ${r.name}`);
  if (bigHead.length > 40) console.log(`      … and ${bigHead.length - 40} more`);
} else console.log('  clean: no end lobe out-masses its trunk');
if (!hi.length && !lo.length) console.log('  clean: every measured subject sits inside the envelope for its shape class');
process.exit(errs.length ? 1 : 0);
