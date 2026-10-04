/* Local study only. One renderer, one finite RAF owner, four meshes sharing one
 * decoded creature texture. Not imported by the game or a native battle owner. */
import { Application, Container, ImageSource, MeshSimple, Rectangle, Sprite, Texture }
  from 'pixi.js';
import { applyCivetPose, createCivetMesh, sampleCivetPose, CIVET_CLIP_MS, CIVET_RIG_VERSION,
  CIVET_SOURCE_GENOME_JSON, type CivetClip, type CivetMeshData, type CivetPose }
  from '../../port/v2/tools/painted-creature/civet-rig.js';

type Bounds = { x0: number; y0: number; x1: number; y1: number };
interface AssetManifest { path: string; sha256: string; width: number; height: number; alphaBounds: Bounds; contactY: number }
interface SceneAsset { path: string; sha256: string; width: number; height: number }
declare const __CF_CIVET_ASSET__: AssetManifest;
declare const __CF_CIVET_SCENE__: { background: SceneAsset; residents: SceneAsset };
const manifest = Object.freeze({ ...__CF_CIVET_ASSET__, alphaBounds: Object.freeze({ ...__CF_CIVET_ASSET__.alphaBounds }) });
const sceneManifest = Object.freeze(__CF_CIVET_SCENE__);
const genome = JSON.parse(CIVET_SOURCE_GENOME_JSON) as Record<string, unknown>;
const identityBefore = JSON.stringify(genome), recipeBefore = JSON.stringify(manifest);
const assert = (ok: unknown, why: string): void => { if (!ok) throw Error(why); };
const digest = async (bytes: BufferSource) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
const view = document.getElementById('study-view')!;
const status = document.getElementById('status')!;
const effects = document.getElementById('effects') as HTMLInputElement;
const reduced = document.getElementById('reduced') as HTMLInputElement;
const controlIds = ['breathe', 'strike', 'recoil', 'rest', 'hide', 'dispose'] as const;
const buttons = new Map(controlIds.map(id => [id, document.getElementById(id) as HTMLButtonElement]));
const win = window as unknown as Record<string, unknown>;
const journal: Record<string, unknown>[] = [];
const failures: string[] = [];
const listeners: Array<() => void> = [];
const resources: Array<{ name: string; bitmap: ImageBitmap; texture: Texture; source: ImageSource; disposed: boolean }> = [];
const counters = { decodedCreature: 0, creatureTextures: 0, creatureSources: 0, rafRequested: 0, frames: 0, started: 0, completed: 0, cancelled: 0, meshesDestroyed: 0, geometriesDestroyed: 0, texturesDestroyed: 0, sourcesDestroyed: 0, bitmapsClosed: 0, renders: 0 };
const app = new Application();
let initialized = false, disposed = false, raf = 0, clip: CivetClip = 'rest', startMs = 0, lastElapsed = 0, sequence = 0;
let currentPose: CivetPose = { breath: 0, drive: 0, tail: 0 };
let lastCancellation = '', creatureBytes: ArrayBuffer;
type Actor = { size: number; root: Container; mesh: MeshSimple; geometry: MeshSimple['geometry']; data: CivetMeshData; k: number; sourceX: number; sourceY: number };
const actors: Actor[] = [];
let earth: Container, earthActor: Actor;
const sceneSprites: Sprite[] = [];
const visible = (): boolean => {
  if (disposed || document.hidden || !view.isConnected) return false;
  for (let node: HTMLElement | null = view; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (node.hidden || node.hasAttribute('inert') || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  }
  return true;
};
const policy = () => ({ effectsOn: effects.checked, fullMotion: !reduced.checked, visible: visible() });
function listen(target: EventTarget, event: string, listener: EventListener) { target.addEventListener(event, listener); listeners.push(() => target.removeEventListener(event, listener)); }
function inspectAlpha(bitmap: ImageBitmap, expected: AssetManifest) {
  assert(bitmap.width === expected.width && bitmap.height === expected.height, 'Decoded creature dimensions differ from immutable manifest');
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), context = canvas.getContext('2d')!;
  try {
    context.drawImage(bitmap, 0, 0); const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let x0 = bitmap.width, y0 = bitmap.height, x1 = -1, y1 = -1, contactY = -1, zero = 0, solid = 0, partial = 0, border = 0;
    for (let y = 0; y < bitmap.height; y++) for (let x = 0; x < bitmap.width; x++) {
      const a = rgba[(y * bitmap.width + x) * 4 + 3]!;
      if (a === 0) zero++; else if (a < 255) partial++;
      if (a >= 230) { solid++; contactY = y; }
      if (a > 12) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      if (a > 0 && (x === 0 || y === 0 || x === bitmap.width - 1 || y === bitmap.height - 1)) border++;
    }
    assert(zero > bitmap.width * bitmap.height * .1 && solid > 100 && partial > 0 && border === 0, 'Creature must have real transparent margins and antialiased visible ink; opaque/matte/edge-clipped asset refused');
    assert(JSON.stringify({ x0, y0, x1, y1 }) === JSON.stringify(expected.alphaBounds), 'Native alpha>12 bounds changed');
    assert(contactY === expected.contactY, 'Native alpha>=230 contact row changed');
    return { x0, y0, x1, y1, contactY, zero, solid, partial, border };
  } finally { canvas.width = canvas.height = 1; }
}
async function validateHash(bytes: ArrayBuffer, expected: string) { assert(await digest(bytes) === expected, 'Immutable texture SHA-256 mismatch'); }
async function loadTexture(name: string, input: SceneAsset | AssetManifest, creature = false) {
  assert(input.path.startsWith('./study-assets/') && !input.path.includes('..'), 'Only fixed local study assets are admitted');
  const response = await fetch(input.path, { cache: 'no-store' }); assert(response.ok, 'Required local texture unavailable: ' + name);
  const bytes = await response.arrayBuffer(); await validateHash(bytes, input.sha256);
  let bitmap: ImageBitmap | null = await createImageBitmap(new Blob([bytes]));
  try {
    assert(bitmap.width === input.width && bitmap.height === input.height, 'Texture dimensions changed: ' + name);
    if (creature) { inspectAlpha(bitmap, input as AssetManifest); creatureBytes = bytes; counters.decodedCreature++; }
    const source = new ImageSource({ resource: bitmap, scaleMode: 'linear', autoGenerateMipmaps: false, alphaMode: 'premultiply-alpha-on-upload' });
    const texture = new Texture({ source });
    resources.push({ name, bitmap, source, texture, disposed: false }); bitmap = null;
    if (creature) { counters.creatureTextures++; counters.creatureSources++; }
    return texture;
  } finally { bitmap?.close(); }
}
function addActor(texture: Texture, size: number, parent: Container): Actor {
  const data = createCivetMesh(genome), mesh = new MeshSimple({ texture, vertices: data.vertices, uvs: data.uvs, indices: data.indices });
  mesh.autoUpdate = true; mesh.eventMode = 'none'; mesh.label = 'canonical-civet-' + size;
  const root = new Container(); root.eventMode = 'none'; parent.addChild(root); root.addChild(mesh);
  const b = manifest.alphaBounds, w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
  const k = Math.min(size * .90 / w, size * .90 / h), sourceX = size / 2 - (b.x0 + w / 2) * k, sourceY = size / 2 - (b.y0 + h / 2) * k;
  mesh.scale.set(manifest.width * k, manifest.height * k); mesh.position.set(sourceX, sourceY);
  const actor = { size, root, mesh, geometry: mesh.geometry, data, k, sourceX, sourceY }; actors.push(actor); return actor;
}
function render() { if (initialized && !disposed) { app.render(); counters.renders++; } }
function pose(value: CivetPose, mutation: 'constant-rest' | 'shift-paws' | null = null) {
  currentPose = value;
  for (const actor of actors) {
    applyCivetPose(actor.data, mutation === 'constant-rest' ? { breath: 0, drive: 0, tail: 0 } : value);
    if (mutation === 'shift-paws') for (let i = 0; i < actor.data.vertices.length; i += 2) {
      if (actor.data.rest[i + 1]! >= (manifest.contactY - manifest.height * .06) / manifest.height) actor.data.vertices[i + 1]! += .008;
    }
    actor.mesh.vertices = actor.data.vertices;
  }
  render();
}
function rest(reason: string, completed = false) {
  if (raf) cancelAnimationFrame(raf); raf = 0;
  if (clip !== 'rest') { if (completed) counters.completed++; else counters.cancelled++; }
  clip = 'rest'; startMs = 0; lastElapsed = 0; lastCancellation = reason;
  if (!disposed) pose({ breath: 0, drive: 0, tail: 0 });
  journal.push({ event: completed ? 'settled' : 'rest', reason, sequence });
  status.textContent = disposed ? 'Study disposed.' : 'At rest · ' + reason;
}
function animate(now: number) {
  raf = 0;
  if (!visible() || !effects.checked || reduced.checked) { rest('motion policy or visibility changed'); return; }
  if (clip === 'rest' || disposed) return;
  if (!startMs) startMs = now;
  const elapsed = now - startMs; lastElapsed = elapsed; counters.frames++;
  if (elapsed >= CIVET_CLIP_MS[clip]) { rest('finite movement completed', true); return; }
  pose(sampleCivetPose(clip, elapsed, policy()));
  if (journal.length < 128) journal.push({ event: 'frame', sequence, clip, elapsed, pose: currentPose });
  raf = requestAnimationFrame(animate); counters.rafRequested++;
}
function start(next: Exclude<CivetClip, 'rest'>, trusted: boolean) {
  if (!initialized || disposed) return;
  rest('new movement');
  journal.push({ event: 'request', clip: next, trusted, policy: policy() });
  if (!visible() || !effects.checked || reduced.checked) { status.textContent = 'Static pose retained by motion preference.'; return; }
  clip = next; sequence++; counters.started++; status.textContent = next === 'strike' ? 'Finite brace and neck thrust…' : 'Finite ' + next + '…';
  raf = requestAnimationFrame(animate); counters.rafRequested++;
}
function layout() {
  if (!initialized || disposed) return;
  rest('layout settled');
  const width = Math.max(280, Math.min(1000, view.clientWidth)), gap = 16;
  let x = gap, y = 28, rowHeight = 0;
  for (const actor of actors.slice(0, 3)) {
    const display = Math.min(actor.size, width - gap * 2);
    if (x > gap && x + display + gap > width) { x = gap; y += rowHeight + 30; rowHeight = 0; }
    actor.root.position.set(x, y); actor.root.scale.set(display / actor.size); x += display + gap; rowHeight = Math.max(rowHeight, display);
  }
  y += rowHeight + 36;
  const scale = Math.min(1, (width - gap * 2) / 960); earth.position.set((width - 960 * scale) / 2, y); earth.scale.set(scale);
  app.renderer.resize(width, Math.ceil(y + 430 * scale + 16));
  document.getElementById('scale-labels')!.textContent = 'Portrait views: 440 / 300 / 132 px (large views fit this screen). Earth inset preserves the existing relative placement; this is not a metre-scale ecology claim.';
  render();
}
function snapshot() {
  const creature = resources.find(row => row.name === 'creature');
  return { ready: initialized && !disposed, disposed, clip, elapsed: lastElapsed, pendingRaf: raf !== 0, currentPose, sequence, policy: policy(), counters: { ...counters }, lastCancellation, failures: [...failures], journal: [...journal], sourceIdentityUnchanged: JSON.stringify(genome) === identityBefore && JSON.stringify(manifest) === recipeBefore,
    allActorsShareOneCreatureTexture: actors.length === 4 && !disposed && actors.every(actor => actor.mesh.texture === creature?.texture),
    actors: actors.map(actor => ({ size: actor.size, vertices: actor.data.vertices.length, restExact: actor.data.vertices.every((v, i) => v === actor.data.rest[i]), meshDestroyed: actor.mesh.destroyed, geometryDestroyed: actor.geometry.buffers === null, position: actor.mesh.destroyed ? null : { x: actor.mesh.x, y: actor.mesh.y }, scale: actor.mesh.destroyed ? null : { x: actor.mesh.scale.x, y: actor.mesh.scale.y } })),
    resources: resources.map(row => ({ name: row.name, disposed: row.disposed, textureDestroyed: row.texture.destroyed, sourceDestroyed: row.source.destroyed, bitmapWidth: row.bitmap.width, bitmapHeight: row.bitmap.height })),
    canvas: !disposed && initialized ? { width: app.canvas.width, height: app.canvas.height, css: app.canvas.getBoundingClientRect().toJSON() } : null };
}
function captureActor(actor: Actor) {
  // Explicit local frame keeps the ruler independent of deformed mesh bounds.
  const original = { x: actor.root.x, y: actor.root.y, scaleX: actor.root.scale.x, scaleY: actor.root.scale.y };
  actor.root.position.set(0, 0); actor.root.scale.set(1);
  try { return app.renderer.extract.pixels({ target: actor.root, frame: new Rectangle(0, 0, actor.size, actor.size), resolution: 1, antialias: true }); }
  finally { actor.root.position.set(original.x, original.y); actor.root.scale.set(original.scaleX, original.scaleY); }
}
function png(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d')!; context.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);
  try { return canvas.toDataURL('image/png'); } finally { canvas.width = canvas.height = 1; }
}
function comparePixels(actor: Actor, baseline: Uint8Array | Uint8ClampedArray, changed: Uint8Array | Uint8ClampedArray) {
  const stats = { all: 0, head: 0, body: 0, contact: 0, headInk: 0, bodyInk: 0, contactInk: 0, maximumChannelDelta: 0 };
  // Two source rows above the measured final solid contact, independent of
  // the rig's foot-lock constant. Upper leg movement is not ground sliding.
  const footY = (manifest.contactY - 2) / manifest.height;
  for (let y = 0; y < actor.size; y++) for (let x = 0; x < actor.size; x++) {
    const i = (y * actor.size + x) * 4;
    const u = (x - actor.sourceX) / actor.k / manifest.width, v = (y - actor.sourceY) / actor.k / manifest.height;
    const delta = Math.max(...[0, 1, 2, 3].map(channel => Math.abs(baseline[i + channel]! - changed[i + channel]!)));
    const painted = baseline[i + 3]! >= 230;
    const head = u >= .70 && v < .72, body = u >= .30 && u < .64 && v < .72, contact = v >= footY && v <= (manifest.contactY + 2) / manifest.height;
    if (painted) { if (head) stats.headInk++; if (body) stats.bodyInk++; if (contact) stats.contactInk++; }
    if (delta > 0) { stats.all++; if (head) stats.head++; if (body) stats.body++; if (contact) stats.contact++; }
    stats.maximumChannelDelta = Math.max(stats.maximumChannelDelta, delta);
  }
  return stats;
}
async function probe(next: CivetClip, elapsed: number, mutation: 'constant-rest' | 'shift-paws' | null = null) {
  assert(initialized && !disposed && visible(), 'Cannot probe inactive study'); rest('deterministic review sample');
  const bases = actors.slice(0, 3).map(actor => captureActor(actor));
  try {
    pose(sampleCivetPose(next, elapsed, policy()), mutation);
    const outputs = actors.slice(0, 3).map((actor, index) => {
      const sample = captureActor(actor), base = bases[index]!;
      return { size: actor.size, width: sample.width, height: sample.height, png: png(sample.pixels, sample.width, sample.height), baselinePng: png(base.pixels, base.width, base.height), delta: comparePixels(actor, base.pixels, sample.pixels) };
    });
    const sourceFixed = JSON.stringify(genome) === identityBefore && JSON.stringify(manifest) === recipeBefore;
    const prior = { x: earth.x, y: earth.y, sx: earth.scale.x, sy: earth.scale.y };
    let scenePng: string;
    earth.position.set(0, 0); earth.scale.set(1);
    try { const p = app.renderer.extract.pixels({ target: earth, frame: new Rectangle(0, 0, 960, 430), resolution: 1, antialias: true }); scenePng = png(p.pixels, p.width, p.height); }
    finally { earth.position.set(prior.x, prior.y); earth.scale.set(prior.sx, prior.sy); }
    return { clip: next, elapsed, mutation, sourceFixed, pose: currentPose, outputs, scenePng };
  } finally { rest('review sample restored'); }
}
async function assetControls() {
  const mutated = creatureBytes.slice(0); new Uint8Array(mutated)[0]! ^= 1;
  let hashRejected = false, opaqueRejected = false;
  try { await validateHash(mutated, manifest.sha256); } catch { hashRejected = true; }
  const canvas = new OffscreenCanvas(manifest.width, manifest.height), context = canvas.getContext('2d')!;
  context.fillStyle = '#444'; context.fillRect(0, 0, canvas.width, canvas.height); const opaque = canvas.transferToImageBitmap();
  try { try { inspectAlpha(opaque, manifest); } catch { opaqueRejected = true; } }
  finally { opaque.close(); canvas.width = canvas.height = 1; }
  return { hashRejected, opaqueRejected, immutableGenome: JSON.stringify(genome) === identityBefore };
}
function dispose() {
  if (disposed) return snapshot();
  rest('disposed'); disposed = true;
  for (const remove of listeners.splice(0)) try { remove(); } catch (error) { failures.push(String(error)); }
  observer.disconnect(); resizeObserver.disconnect();
  for (const actor of actors) {
    try { actor.mesh.destroy({ texture: false, textureSource: false }); counters.meshesDestroyed++; } catch (error) { failures.push(String(error)); }
    try { actor.geometry.destroy(true); counters.geometriesDestroyed++; } catch (error) { failures.push(String(error)); }
    try { actor.root.destroy({ children: false }); } catch (error) { failures.push(String(error)); }
  }
  for (const sprite of sceneSprites) try { sprite.destroy({ texture: false, textureSource: false }); } catch (error) { failures.push(String(error)); }
  for (const resource of resources) {
    if (resource.disposed) continue;
    try { resource.texture.destroy(false); counters.texturesDestroyed++; } catch (error) { failures.push(String(error)); }
    try { resource.source.destroy(); counters.sourcesDestroyed++; } catch (error) { failures.push(String(error)); }
    try { resource.bitmap.close(); counters.bitmapsClosed++; } catch (error) { failures.push(String(error)); }
    resource.disposed = true;
  }
  if (initialized) try { app.destroy({ removeView: true }, { children: false, texture: false, textureSource: false }); } catch (error) { failures.push(String(error)); }
  for (const button of buttons.values()) button.disabled = true;
  effects.disabled = reduced.disabled = true; status.textContent = 'Study disposed · owned mesh and texture resources retired.';
  return snapshot();
}
const observer = new MutationObserver(() => { if (initialized && !disposed && !visible()) rest('hidden ancestor'); });
const resizeObserver = new ResizeObserver(() => { if (initialized && !disposed && visible()) layout(); });
const ready = (async () => {
  assert(/^[a-f0-9]{64}$/.test(manifest.sha256), 'Asset SHA-256 missing');
  assert(Number.isInteger(manifest.width) && Number.isInteger(manifest.height) && manifest.width * manifest.height <= 2_000_000, 'Asset dimensions exceed this bounded study');
  await app.init({ width: 1000, height: 900, backgroundAlpha: 0, antialias: true, preference: 'webgl', resolution: Math.min(devicePixelRatio, 2), autoDensity: true, autoStart: false, sharedTicker: false });
  app.stop(); initialized = true; view.append(app.canvas);
  const texture = await loadTexture('creature', manifest, true);
  const background = await loadTexture('background', sceneManifest.background);
  const residents = await loadTexture('residents', sceneManifest.residents);
  for (const size of [440, 300, 132]) addActor(texture, size, app.stage);
  earth = new Container(); earth.eventMode = 'none'; app.stage.addChild(earth);
  for (const item of [background, residents]) { const sprite = new Sprite(item); sprite.eventMode = 'none'; earth.addChild(sprite); sceneSprites.push(sprite); }
  earthActor = addActor(texture, 960, earth);
  const bounds = manifest.alphaBounds, width = bounds.x1 - bounds.x0 + 1, k = .15 * 960 / width;
  earthActor.mesh.scale.set(manifest.width * k, manifest.height * k);
  earthActor.mesh.position.set(.72 * 960 - (bounds.x0 + width / 2) * k, .77 * 430 - (manifest.contactY + 1) * k);
  earthActor.k = k; earthActor.sourceX = earthActor.mesh.x; earthActor.sourceY = earthActor.mesh.y;
  for (const next of ['breathe', 'strike', 'recoil'] as const) listen(buttons.get(next)!, 'click', event => start(next, event.isTrusted));
  listen(buttons.get('rest')!, 'click', event => { journal.push({ event: 'native-rest', trusted: event.isTrusted }); rest('Rest selected'); });
  listen(buttons.get('hide')!, 'click', event => { view.hidden = !view.hidden; buttons.get('hide')!.textContent = view.hidden ? 'Show study' : 'Hide study'; journal.push({ event: 'visibility-control', hidden: view.hidden, trusted: event.isTrusted }); if (view.hidden) rest('study hidden'); else layout(); });
  listen(buttons.get('dispose')!, 'click', event => { journal.push({ event: 'dispose-control', trusted: event.isTrusted }); dispose(); });
  for (const input of [effects, reduced]) listen(input, 'change', event => { journal.push({ event: 'policy-control', id: input.id, trusted: event.isTrusted, checked: input.checked }); rest('motion preference changed'); });
  listen(document, 'visibilitychange', () => { if (document.hidden) rest('document hidden'); });
  listen(window, 'pagehide', () => dispose());
  for (let node: HTMLElement | null = view; node; node = node.parentElement) observer.observe(node, { attributes: true, attributeFilter: ['hidden', 'inert', 'style', 'class'] });
  resizeObserver.observe(view);
  for (const button of buttons.values()) button.disabled = false;
  document.getElementById('identity')!.textContent = JSON.stringify({ recipe: CIVET_RIG_VERSION, genome, texture: manifest.sha256, sourcePixels: [manifest.width, manifest.height], sharedCreatureTexture: 1, scene: { x: .72, groundY: .77, width: .15 } }, null, 2);
  layout();
  return snapshot();
})().catch(error => { failures.push(String(error?.stack || error)); status.textContent = 'Study refused: ' + String(error); try { dispose(); } catch (cleanup) { failures.push(String(cleanup)); } throw error; });
win.__CF_CIVET_STUDY__ = Object.freeze({ ready, snapshot, probe, assetControls, dispose });
