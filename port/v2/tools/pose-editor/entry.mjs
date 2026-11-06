/* Dev pose editor (A7). Edits ONE template action's key-pose table as an overlay (motion/overlay.ts),
 * previews it through the compiler's own timeline sampler on a landmark record's skeleton and, when the
 * record and keyed cut-out load, on the landmark-cut fixture rig over the painted parts (canvas 2D).
 * Never imported by the game; exports nothing but window.cfPoseEditor for the capture runner.
 * Playback uses the real clock (preview only); validation and hashing are the pure overlay module. */
import { keyAndDespill } from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import { compileBodyCard, EASES, KNOWN_TEMPLATE_IDS, QUADRUPED_ACTIONS, resolveTemplate, sampleTimeline } from '../../apps/game/src/motion/index.ts';
import { applyActionOverlay, buildActionTimeline, overlayFromAction, validateActionOverlay } from '../../apps/game/src/motion/overlay.ts';
import { createFixtureRig, cutFixtureParts, solvePose } from '../../apps/game/src/battle2/fixture-rig.ts';

const $ = (id) => document.getElementById(id), S = 440, COLOR = { body: '#7fb3ff', head: '#9ad0ff', legs: '#5fd3b8', tail: '#ff9a6b', ears: '#ffcf70' };
const TABLES = { quadruped: QUADRUPED_ACTIONS };
const state = { status: 'LOADING', templateId: 'quadruped', actionId: 'idle', sel: 0, overlay: null, result: null, timeline: null, error: null, playing: false, painted: false, scrubMs: 0 };
let template = resolveTemplate('quadruped'), table = TABLES.quadruped, card = null, record = null, rig = null, rigRoot = null, raf = 0;
window.cfPoseEditor = { state };
const clone = (o) => JSON.parse(JSON.stringify(o));
const fmt = (n, d = 3) => (Math.round(n * 10 ** d) / 10 ** d).toString();
const say = (text, bad = false) => { const el = $('status'); el.textContent = text; el.className = bad ? 'bad' : ''; };

/* ---------- assets: record + keyed master → fixture rig with one canvas per part ---------- */
const json = (p) => fetch(p).then((r) => { if (!r.ok) throw Error(p + ' ' + r.status); return r.json(); });
const image = async (p) => { const r = await fetch(p); if (!r.ok) throw Error(p + ' ' + r.status); const bm = await createImageBitmap(await r.blob()); const c = Object.assign(document.createElement('canvas'), { width: bm.width, height: bm.height }); c.getContext('2d').drawImage(bm, 0, 0); bm.close(); return c; };
async function loadAssets() {
  record = await json('assets/record.json'); card = compileBodyCard(record);
  try {
    const master = await image('assets/master.png'), W = master.width, H = master.height;
    const raw = master.getContext('2d').getImageData(0, 0, W, H), keyed = keyAndDespill(raw.data, W, H), cut = cutFixtureParts(keyed.alpha, W, H, record);
    const partSprite = (part) => {
      const c = Object.assign(document.createElement('canvas'), { width: Math.max(1, part.box.width), height: Math.max(1, part.box.height) }), g = c.getContext('2d'), img = g.createImageData(c.width, c.height);
      for (let y = 0; y < part.box.height; y++) for (let x = 0; x < part.box.width; x++) { if (!part.mask[y * part.box.width + x]) continue; const s = ((part.box.y + y) * W + part.box.x + x) * 4; img.data.set(keyed.rgba.subarray(s, s + 4), (y * c.width + x) * 4); }
      g.putImageData(img, 0, 0);
      return { canvas: c, ax: 0, ay: 0, x: 0, y: 0, rotation: 0, visible: true, anchor: { set(ax, ay) { this.ax = ax; this.ay = ay; } }, destroy() {} };
    };
    const container = () => ({ x: 0, y: 0, rotation: 0, visible: true, children: [], addChild(c) { this.children.push(c); }, removeChild(c) { this.children = this.children.filter((x) => x !== c); }, destroy() {} });
    rig = createFixtureRig({ record, cut, factory: { container, partSprite } }); rigRoot = rig.root; state.painted = true; state.paintedLabel = `${rig.label} · ${rig.parts.length} parts · ${cut.alphaCount} px`;
  } catch (e) { state.painted = false; state.paintedLabel = 'painted preview unavailable: ' + String(e.message ?? e); }
}
/* ---------- overlay → action → timeline (the compiler's own construction, hashed) ---------- */
function derive() {
  try { state.result = applyActionOverlay(table, state.overlay); state.timeline = buildActionTimeline(card, state.result.action, record.identity.seed >>> 0); state.error = null; }
  catch (e) { state.error = String(e.message ?? e); }
  const r = state.result, tl = state.timeline, edited = r && r.hash !== applyActionOverlay(table, overlayFromAction(template, table[state.actionId])).hash;
  say(state.error ? `REFUSED — ${state.error}\n(last valid: action ${r?.hash ?? '—'})` : `${state.templateId}/${state.actionId} · ${r.action.poses.length} poses · action hash ${r.hash} · overlay hash ${r.overlayHash} · timeline hash ${tl.hash} · body ${fmt(tl.bodyMs, 1)} ms / total ${fmt(tl.durationMs, 1)} ms · clamped ${tl.clamped.length ? tl.clamped.join(' ') : 'none'} · ${edited ? 'EDITED vs table' : 'equals table'}\n${state.paintedLabel}`, !!state.error);
  renderPoseList(); renderControls(); frame(state.scrubMs);
}
const rigPose = (pose) => { const p = { root: { rotation: pose.root.rotation, dx: pose.root.dx, dy: pose.root.dy } }; for (const [j, r] of Object.entries(pose.joints)) if (j !== 'root') p[j] = { rotation: r }; return p; };
function frame(ms) {
  const tl = state.timeline; if (!tl) return;
  state.scrubMs = Math.max(0, Math.min(tl.durationMs, ms)); $('scrub').value = Math.round(state.scrubMs / tl.durationMs * 1000); $('scrubOut').value = fmt(state.scrubMs, 1) + ' ms';
  const pose = sampleTimeline(tl, state.scrubMs), rp = rigPose(pose), solved = solvePose(record, card.bodyLength, rp);
  const gy = record.geometry.groundLineY * S, cx = solved.position.root[0] * S, K = 0.72, rx = record.landmarks.root[0] * S;
  // View: the rest root sits at centre, the ground line at 78% height, 72% zoom, so a lunge or fall stays inside the box.
  const view = (g) => { g.translate(S / 2 - rx * K, S * 0.78 - gy * K); g.scale(K, K); };
  const ground = (g) => { g.strokeStyle = '#6d5a4a'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(-S, gy); g.lineTo(2 * S, gy); g.stroke(); g.setLineDash([]); };
  const deform = (g) => { g.translate(cx, gy); g.scale(pose.scale.x, pose.scale.y); g.translate(-cx, -gy); };
  const sk = $('skeleton').getContext('2d'); sk.clearRect(0, 0, S, S); sk.save(); view(sk); ground(sk); deform(sk); sk.lineCap = 'round';
  for (const p of card.parts) { const a = solved.position[p.parent], b = solved.position[p.joint]; sk.strokeStyle = COLOR[p.group]; sk.lineWidth = p.group === 'body' ? 5 : 2.5; sk.beginPath(); sk.moveTo(a[0] * S, a[1] * S); sk.lineTo(b[0] * S, b[1] * S); sk.stroke(); }
  for (const j of solved.order) { const [x, y] = solved.position[j]; sk.fillStyle = j === 'root' ? '#fff' : '#141a20'; sk.strokeStyle = '#ddd'; sk.lineWidth = 1; sk.beginPath(); sk.arc(x * S, y * S, j === 'root' ? 4 : 2.6, 0, Math.PI * 2); sk.fill(); sk.stroke(); }
  sk.restore(); sk.fillStyle = '#9fb3c8'; sk.font = '11px ui-monospace,monospace'; sk.fillText(`${state.actionId} · ${fmt(state.scrubMs, 1)} ms · t=${fmt(state.scrubMs / tl.bodyMs)} · dx ${fmt(pose.root.dx)} dy ${fmt(pose.root.dy)} · scale ${fmt(pose.scale.x, 2)}/${fmt(pose.scale.y, 2)}`, 6, S - 8);
  const pc = $('painted').getContext('2d'); pc.clearRect(0, 0, S, S);
  if (!rig) { pc.fillStyle = '#9fb3c8'; pc.font = '12px system-ui'; pc.fillText(state.paintedLabel ?? 'no painted preview', 10, 24); return; }
  rig.applyPose(rp); pc.save(); view(pc); ground(pc); deform(pc); pc.scale(S / rig.cutout.width, S / rig.cutout.height);
  for (const s of rigRoot.children) { if (!s.visible) continue; pc.save(); pc.translate(s.x, s.y); pc.rotate(s.rotation); pc.drawImage(s.canvas, -s.ax * s.canvas.width, -s.ay * s.canvas.height); pc.restore(); }
  pc.restore(); pc.fillStyle = '#9fb3c8'; pc.font = '11px ui-monospace,monospace'; pc.fillText(rig.label, 6, S - 8);
}
/* ---------- pose list, per-pose controls, joint sliders ---------- */
const poses = () => state.overlay.poses, selected = () => poses()[state.sel];
function renderPoseList() {
  const ol = $('poses'); ol.replaceChildren(...poses().map((p, i) => { const li = document.createElement('li'); li.className = i === state.sel ? 'sel' : ''; const span = document.createElement('span'); span.textContent = `${i} · t=${fmt(p.t)} · ${p.ease ?? 'inherit'} · ${Object.keys(p.joints).length} joints`; li.append(span); li.onclick = () => selectPose(i); return li; }));
}
function renderControls() {
  const p = selected(), i = state.sel, prev = poses()[i - 1]?.t ?? 0, next = poses()[i + 1]?.t ?? 1, last = i === poses().length - 1;
  $('t').value = p.t; $('t').min = prev + 0.001; $('t').max = last ? 1 : next - 0.001; $('t').disabled = last; $('tOut').value = last ? 'end' : '< ' + fmt(next);
  $('ease').value = p.ease ?? EASES[0]; $('dx').value = p.root.dx; $('dxOut').value = fmt(p.root.dx); $('dy').value = p.root.dy; $('dyOut').value = fmt(p.root.dy);
  for (const j of template.joints) { const row = $('j-' + j), v = p.joints[j] ?? 0; row.querySelector('input').value = v; row.querySelector('output').value = fmt(v, 1) + '°'; row.className = 'j' + (v !== 0 ? ' edited' : ''); }
}
function buildJointRows() {
  $('joints').replaceChildren(...template.joints.map((j) => {
    const lim = template.limitsDeg[j], row = document.createElement('div'); row.id = 'j-' + j; row.className = 'j';
    row.innerHTML = `<label title="[${lim.min}, ${lim.max}]">${j}</label><input type="range" min="${lim.min}" max="${lim.max}" step="0.5"><output></output>`;
    row.querySelector('input').oninput = (e) => setJoint(j, Number(e.target.value)); return row;
  }));
  $('ease').replaceChildren(...EASES.map((e) => new Option(e, e)));
}
/* ---------- edits (every edit re-derives; sliders cannot leave the template limits) ---------- */
function setJoint(name, deg) { const lim = template.limitsDeg[name]; deg = Math.max(lim.min, Math.min(lim.max, deg)); const p = selected(); if (deg === 0) delete p.joints[name]; else p.joints[name] = deg; derive(); }
function setRoot(k, v) { selected().root[k] = Math.max(-1, Math.min(1, v)); derive(); }
function setT(v) { const i = state.sel, prev = poses()[i - 1]?.t ?? 0, next = poses()[i + 1]?.t ?? 1; if (i === poses().length - 1) return; selected().t = Math.max(prev + 0.001, Math.min(next - 0.001, v)); derive(); }
function setEase(e) { selected().ease = e; derive(); }
function selectPose(i) { stop(); state.sel = Math.max(0, Math.min(poses().length - 1, i)); const tl = state.timeline; derive(); frame(selected().t * (tl?.bodyMs ?? 0)); }
function addPose() {
  const ps = poses(), i = state.sel, isLast = i === ps.length - 1, lo = isLast ? (ps[i - 1]?.t ?? 0) : ps[i].t, hi = isLast ? 1 : ps[i + 1].t, t = (lo + hi) / 2;
  if (ps.length >= 16) return say('REFUSED — 16 poses is the table ceiling', true);
  if (hi - lo < 0.01) return say('REFUSED — no room between neighbouring poses', true);
  const copy = { ...clone(ps[i]), t }; ps.splice(isLast ? i : i + 1, 0, copy); selectPose(isLast ? i : i + 1);
}
function removePose() { const ps = poses(); if (ps.length === 1) return say('REFUSED — an action keeps at least one pose', true); if (state.sel === ps.length - 1) return say('REFUSED — the t=1 pose anchors the return; edit it instead', true); ps.splice(state.sel, 1); selectPose(Math.min(state.sel, ps.length - 1)); }
function movePose(dir) { const ps = poses(), i = state.sel, j = i + dir; if (j < 0 || j >= ps.length) return; const [a, b] = [ps[i], ps[j]]; [a.t, b.t] = [b.t, a.t]; ps[i] = b; ps[j] = a; selectPose(j); }
function selectAction(id) { stop(); if (!table[id]) return say(`REFUSED — no action "${id}"`, true); state.actionId = id; $('action').value = id; state.overlay = clone(overlayFromAction(template, table[id])); state.sel = 0; derive(); frame(0); }
function importOverlay(obj) { try { const ov = validateActionOverlay(obj, table); stop(); state.actionId = ov.actionId; $('action').value = ov.actionId; state.overlay = clone(ov); state.sel = 0; derive(); frame(0); return true; } catch (e) { say('IMPORT REFUSED — ' + String(e.message ?? e), true); return false; } }
const exportOverlay = () => state.result ? clone(state.result.overlay) : null;
/* ---------- playback (real clock, preview only) ---------- */
function play() { if (state.playing || !state.timeline) return; state.playing = true; $('play').className = 'on'; const start = performance.now() - state.scrubMs, tl = state.timeline, span = tl.loop ? tl.bodyMs : tl.durationMs + 400; const tick = () => { if (!state.playing) return; frame(((performance.now() - start) % span)); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }
function stop() { state.playing = false; $('play').className = ''; cancelAnimationFrame(raf); }
/* ---------- wiring ---------- */
try {
  $('template').replaceChildren(...KNOWN_TEMPLATE_IDS.filter((id) => TABLES[id]).map((id) => new Option(id, id))); // only templates with an action table $('action').replaceChildren(...Object.keys(table).map((id) => new Option(id, id)));
  buildJointRows(); await loadAssets();
  $('template').onchange = (e) => { template = resolveTemplate(e.target.value); table = TABLES[e.target.value]; state.templateId = e.target.value; buildJointRows(); selectAction(Object.keys(table)[0]); };
  $('action').onchange = (e) => selectAction(e.target.value); $('play').onclick = () => (state.playing ? stop() : play()); $('reset').onclick = () => selectAction(state.actionId);
  $('add').onclick = addPose; $('remove').onclick = removePose; $('up').onclick = () => movePose(-1); $('down').onclick = () => movePose(1);
  $('t').onchange = (e) => setT(Number(e.target.value)); $('ease').onchange = (e) => setEase(e.target.value); $('dx').oninput = (e) => setRoot('dx', Number(e.target.value)); $('dy').oninput = (e) => setRoot('dy', Number(e.target.value));
  $('scrub').oninput = (e) => { stop(); frame(Number(e.target.value) / 1000 * state.timeline.durationMs); };
  $('export').onclick = () => { const ov = exportOverlay(); if (!ov) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(ov, null, 1) + '\n'], { type: 'application/json' })); a.download = `${ov.templateId}.${ov.actionId.replace(':', '-')}.overlay.json`; a.click(); URL.revokeObjectURL(a.href); };
  $('importBtn').onclick = () => $('import').click(); $('import').onchange = async (e) => { const f = e.target.files[0]; if (f) importOverlay(JSON.parse(await f.text())); e.target.value = ''; };
  selectAction('idle'); state.status = 'READY';
  Object.assign(window.cfPoseEditor, { selectAction, selectPose, setJoint, setRoot, setT, setEase, addPose, removePose, movePose, frame, play, stop, exportOverlay, importOverlay });
} catch (e) { state.status = 'FAIL'; state.error = String(e.stack ?? e); say('FAIL — ' + state.error, true); }
