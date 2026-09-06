import { getLootCatalogueDefinition } from '@cf/domain-loot';
import type { AudioContextLike } from '@cf/audio';
import { createTameGreetingAudioOwner } from './tame-greeting-audio.js';
import { PILOT_CUES, PILOT_SHIP_IMAGES, PILOT_VISTA_ATMOSPHERE } from './pilot-assets.js';
import { installPilotStyle, mountPilotPortrait, pilotElement } from './pilot-components.js';
import { PILOT_SPECIMENS_V1, PILOT_PORTRAIT_SIZES_V1, type PilotPortraitSizeV1 } from './pilot-specimens.js';
import { SpeciesArtLoader } from './species-art-loader.js';
import { createShipyardPreview } from './shipyard-preview.js';
import { shipVisualStateOf } from '@cf/scene';
import { mountPilotEarthVista } from './pilot-canonical-vista.js';
import { PilotSoundPlayer } from './pilot-sound-player.js';
import { PILOT_TOKENS } from './pilot-tokens.js';

const root = document.getElementById('pilot-review')!;
root.className = 'cf-pilot'; root.dataset.motion = 'static';
const removeStyle = installPilotStyle(document);
const pageStyle = document.createElement('style');
pageStyle.textContent = `
html,body{margin:0;background:#071219}.cf-pilot{max-width:1320px;margin:auto;padding:32px max(20px,env(safe-area-inset-right)) 64px max(20px,env(safe-area-inset-left))}
#pilot-review>section{margin-top:64px}#pilot-review>header{display:grid;grid-template-columns:1.15fr 1fr;gap:32px;align-items:center;padding:20px 0 0}
#pilot-review .p-lead{font-size:18px;max-width:52ch;color:#a3b7b4}#pilot-review .p-heading{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:24px;flex-wrap:wrap}
#pilot-review .p-hero-art{background:radial-gradient(ellipse,#243d2f,#071219 68%);min-width:0}#pilot-review .p-hero-art img{max-height:440px;object-fit:contain}
#pilot-review .p-scroll{overflow:auto;padding:20px;max-width:100%}#pilot-review .p-native-pair{display:flex;gap:32px;width:max-content;min-width:100%}#pilot-review .p-native-pair>article{flex-shrink:0;display:grid;align-content:start;gap:16px}
#pilot-review .p-native-pair p{max-width:440px}#pilot-review .p-art-basin{position:relative;aspect-ratio:960/430;overflow:hidden;background:#10252b}#pilot-review .p-art-basin canvas,#pilot-review .p-art-basin img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
#pilot-review .p-art-basin img{pointer-events:none;opacity:.5}#pilot-review .p-swatch{width:48px;height:48px;border:1px solid #8ba59d;border-radius:10px}#pilot-review .p-code{overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}
#pilot-review .p-audio-card{display:flex;flex-direction:column;gap:12px}#pilot-review .p-audio-card button{align-self:start;margin-top:auto}#pilot-review .p-rule{padding:16px;border-left:2px solid #dcc38d;background:#13252a}
#pilot-review .p-card>svg{display:block;width:100%;height:auto}#pilot-review .p-ship-views{display:flex;gap:24px;align-items:end;overflow:auto;padding:16px}#pilot-review .p-ship-views figure{margin:0;flex-shrink:0}#pilot-review figcaption{font-size:12px;color:#a3b7b4}
@media(max-width:700px){#pilot-review>header{grid-template-columns:1fr}#pilot-review{padding-top:24px}#pilot-review>section{margin-top:48px}#pilot-review .p-hero-art img{max-height:300px}#pilot-review .p-pad{padding:20px}}
`;
document.head.append(pageStyle);
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string) => pilotElement(document, tag, cls, text);
const releases: Array<() => void> = [removeStyle, () => pageStyle.remove()];
const loader = new SpeciesArtLoader('cf-audiovisual-pilot-review-v1');
let hidden = document.visibilityState !== 'visible';
let disposed = false;
const owner = createTameGreetingAudioOwner({ createContext: () => new AudioContext() as unknown as AudioContextLike,
  nowMs: () => performance.now(), readPolicy: () => ({ soundOn: true, creatureVoicesOn: true, visible: !hidden,
    answerable: !disposed, masterGain: .7, routeKey: 'cf-pilot-review' }), verifyCounterpart: () => false });
const sound = new PilotSoundPlayer(owner);

const header = make('header');
const intro = make('div', 'p-stack');
intro.append(make('p', 'p-eyebrow', 'Celestial Frontier / Direction study 01'), make('h1', '', 'A quieter sky.\nA deeper frontier.'),
  make('p', 'p-lead', 'A bounded visual and sound pilot built around the Scout, Earth’s temperate vista and eight existing body plans.'),
  make('p', 'p-muted', 'Candidate direction · human and iPhone acceptance pending'));
const links = make('div', 'p-row');
const play = make('a', 'p-button p-primary', 'Open playable pilot'); play.href = './?avpilot=1';
const baseline = make('a', 'p-button', 'Open current game'); baseline.href = './';
links.append(play, baseline); intro.append(links);
const hero = make('div', 'p-hero-art'); const heroShip = make('img', 'p-ship');
heroShip.src = PILOT_SHIP_IMAGES[512]; heroShip.alt = 'Blender candidate for the canonical chemical Scout, without mounted hardpoints';
hero.append(heroShip); header.append(intro, hero); root.append(header);

function section(title: string, eyebrow: string): HTMLElement {
  const node = make('section'); const heading = make('div', 'p-heading'); const words = make('div', 'p-stack');
  words.append(make('p', 'p-eyebrow', eyebrow), make('h2', '', title)); heading.append(words); node.append(heading); root.append(node); return node;
}
const shipSection = section('The same Scout, in material and light.', '01 / Hull study');
const shipPair = make('div', 'p-grid');
const oldShip = make('article', 'p-card p-pad p-stack');
oldShip.append(make('h3', '', 'Current'), createShipyardPreview(document, shipVisualStateOf({ items: [], ascCh: 0, liverySeed: 0x5111 })));
const nextShip = make('article', 'p-card p-pad p-stack'); const image = make('img', 'p-ship');
image.src = PILOT_SHIP_IMAGES[300]; image.alt = 'Candidate Scout at 300 pixels'; image.width = 300; image.height = 300;
nextShip.append(make('h3', '', 'Candidate'), image, make('p', 'p-muted', 'The existing silhouette and livery remain the input. This stage has no installed hardpoints.'));
shipPair.append(oldShip, nextShip); shipSection.append(shipPair);
const shipViews = make('div', 'p-ship-views');
for (const size of [132, 300, 512] as const) {
  const figure = make('figure'); const view = make('img'); view.src = PILOT_SHIP_IMAGES[size]; view.width = size; view.height = size; view.alt = `${size} pixel Scout`;
  figure.append(view, make('figcaption', '', `${size} px · native export`)); shipViews.append(figure);
}
shipSection.append(shipViews);

const vistaSection = section('Keep the ecology. Shape the atmosphere.', '02 / Temperate light');
const vistaPair = make('div', 'p-grid'); const vistaCanvases: HTMLCanvasElement[] = [];
for (const enhanced of [false, true]) {
  const card = make('article', 'p-card'); const basin = make('div', 'p-art-basin'); const canvas = make('canvas');
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', enhanced ? 'Canonical Earth vista with candidate atmospheric lighting' : 'Unchanged canonical Earth vista');
  vistaCanvases.push(canvas); basin.append(canvas);
  if (enhanced) { const layer = make('img'); layer.src = PILOT_VISTA_ATMOSPHERE; layer.alt = ''; basin.append(layer); }
  card.append(basin, make('h3', 'p-pad', enhanced ? 'Candidate atmosphere' : 'Current canonical vista')); vistaPair.append(card);
}
const vistaStatus = make('p', 'p-muted', 'Rendering the same canonical Earth input in both views…');
vistaSection.append(vistaPair, vistaStatus);

const specimens = section('Eight body plans. Every fallback visible.', '03 / Living-species comparison');
specimens.append(make('p', 'p-rule', 'Anatomical animation is incomplete for all eight specimens. Both views retain the protected portrait; only a separate frame accent may move. This is not a rig or a living-animation pass.'));
const selectors = make('div', 'p-row'); const familySelect = make('select'); familySelect.setAttribute('aria-label', 'Body plan specimen');
for (const specimen of PILOT_SPECIMENS_V1) { const option = make('option', '', `${specimen.family} · ${specimen.label}`); option.value = specimen.id; familySelect.append(option); }
const sizeSelect = make('select'); sizeSelect.setAttribute('aria-label', 'Actual portrait size');
for (const size of PILOT_PORTRAIT_SIZES_V1) { const option = make('option', '', `${size} px`); option.value = String(size); option.selected = size === 300; sizeSelect.append(option); }
selectors.append(familySelect, sizeSelect); specimens.append(selectors);
const portraitScroll = make('div', 'p-scroll p-card'); const pair = make('div', 'p-native-pair'); portraitScroll.append(pair); specimens.append(portraitScroll);
const identity = make('p', 'p-code p-muted'); specimens.append(identity);
let portraitReleases: Array<() => void> = [];
function refreshPortraits(): void {
  portraitReleases.forEach((release) => release()); portraitReleases = []; pair.replaceChildren();
  const specimen = PILOT_SPECIMENS_V1.find((row) => row.id === familySelect.value)!;
  const size = Number(sizeSelect.value) as PilotPortraitSizeV1;
  for (const animated of [false, true]) {
    const card = make('article'); card.append(make('h3', '', animated ? 'Animated presentation / static anatomy' : 'Static presentation / static anatomy'));
    pair.append(card); portraitReleases.push(mountPilotPortrait(loader, card, specimen, size, animated));
  }
  identity.textContent = `${specimen.familyBasis} · Source: ${specimen.source.kind} · ${specimen.visualKey}`;
}
familySelect.addEventListener('change', refreshPortraits); sizeSelect.addEventListener('change', refreshPortraits);
releases.push(() => { portraitReleases.forEach((release) => release()); familySelect.removeEventListener('change', refreshPortraits); sizeSelect.removeEventListener('change', refreshPortraits); });

const audioSection = section('Sound with room for silence.', '04 / Listening set');
audioSection.append(make('p', 'p-muted', 'Original REAPER / Surge candidates. Play at a comfortable level; musical identity, comfort and phone-speaker performance need your review. Creature voices retain their canonical synthesis.'));
const audioOptions = make('div', 'p-row'); const mono = make('input'); mono.type = 'checkbox'; const soft = make('input'); soft.type = 'checkbox'; soft.checked = true;
for (const [input, labelText] of [[mono, 'Mono'], [soft, 'Reduced intensity']] as const) { const label = make('label', 'p-row', labelText); label.prepend(input); audioOptions.append(label); }
const stop = make('button', '', 'Stop all'); const full = make('button', 'p-primary', 'Play complete scene');
audioOptions.append(full, stop); const audioStatus = make('p', 'p-muted', 'Silent until you choose Play.'); audioStatus.setAttribute('role', 'status');
audioSection.append(audioOptions, audioStatus); const audioGrid = make('div', 'p-grid'); audioSection.append(audioGrid);
let audioGeneration = 0;
async function audition(event: MouseEvent, ids: readonly string[]): Promise<void> {
  if (!event.isTrusted || disposed) return;
  sound.stop(); if (!owner.armNativePilotGesture()) return;
  const generation = ++audioGeneration; audioStatus.textContent = 'Loading the selected sound…';
  const results = await Promise.all(ids.map((id) => sound.play(id, { mono: mono.checked, reducedIntensity: soft.checked })));
  if (generation !== audioGeneration || disposed) return;
  audioStatus.textContent = results.every(Boolean) ? 'Playing. The phrase returns to silence when it finishes.' : 'Audio unavailable; this listening item is incomplete.';
}
for (const cue of PILOT_CUES) {
  const card = make('article', 'p-card p-pad p-audio-card'); const button = make('button', '', `Play ${cue.title.toLowerCase()}`);
  card.append(make('h3', '', cue.title), make('p', 'p-muted', cue.caption), make('p', 'p-code', `${cue.category} · ${cue.durationMs / 1000}s`), button);
  const click = (event: MouseEvent): void => { void audition(event, [cue.id]); }; button.addEventListener('click', click);
  releases.push(() => button.removeEventListener('click', click)); audioGrid.append(card);
}
const stopAudio = (): void => { audioGeneration++; sound.stop(); audioStatus.textContent = 'Stopped.'; };
const complete = (event: MouseEvent): void => { void audition(event, ['cf-pilot-exploration-music', 'cf-pilot-temperate-bed']); };
stop.addEventListener('click', stopAudio); full.addEventListener('click', complete); mono.addEventListener('change', stopAudio); soft.addEventListener('change', stopAudio);
releases.push(() => { stop.removeEventListener('click', stopAudio); full.removeEventListener('click', complete); mono.removeEventListener('change', stopAudio); soft.removeEventListener('change', stopAudio); });

const mockups = section('One language, three small surfaces.', '05 / Component mockups');
mockups.append(make('p', 'p-muted', 'Isolated layout studies. These samples do not change the live Survey, Compendium or Inventory interfaces.'));
const mockGrid = make('div', 'p-grid');
const survey = make('article', 'p-card p-pad p-stack'); survey.append(make('p', 'p-eyebrow', 'Survey'), make('h3', '', 'Earth'), make('p', 'p-muted', 'Sol · temperate · landed vista'), make('hr', 'p-divider'), make('p', '', 'A quiet interval between canopy and open sky.'));
const compendium = make('article', 'p-card p-pad p-stack'); compendium.append(make('p', 'p-eyebrow', 'Compendium detail'), make('h3', '', PILOT_SPECIMENS_V1[0]!.label), make('p', 'p-muted', 'Canonical catalogue identity · protected portrait'));
const detailMount = make('div'); compendium.append(detailMount);
const gear = getLootCatalogueDefinition('fieldsuit')!;
const inventory = make('article', 'p-card p-pad p-stack'); inventory.append(make('p', 'p-eyebrow', 'Inventory gear detail'), make('h3', '', gear.name), make('p', 'p-muted', gear.description), make('hr', 'p-divider'), make('p', '', 'Base definition study. No rolled item, ownership or equipped state is implied.'));
mockGrid.append(survey, compendium, inventory); mockups.append(mockGrid);

const tokens = section('A small, reusable palette.', '06 / Candidate styleguide');
const swatches = make('div', 'p-row');
for (const [name, color] of Object.entries({ space: PILOT_TOKENS.space, panel: PILOT_TOKENS.panel, text: PILOT_TOKENS.text, accent: PILOT_TOKENS.accent, player: PILOT_TOKENS.player, harm: PILOT_TOKENS.harm, gain: PILOT_TOKENS.gain })) {
  const tile = make('div', 'p-stack'); const swatch = make('div', 'p-swatch'); swatch.style.background = color;
  tile.append(swatch, make('p', 'p-code', `${name} ${color}`)); swatches.append(tile);
}
tokens.append(swatches, make('p', 'p-muted', 'Display: platform Georgia serif. Body: platform system sans. No external font requests. 4/8-point spacing, 16px corners, 44px targets and visible keyboard focus. Semantic and rarity colors retain their existing owners.'));
const footer = section('The pilot ends at your review.', 'Approval boundary');
footer.append(make('p', 'p-rule', 'No Phase 2 expansion, top bar, dock or rails migration has started. Visual direction, living animation, listening comfort and real iPhone/PWA evidence remain approval items.'));

function visibility(): void { hidden = document.visibilityState !== 'visible'; owner.setHidden(hidden); if (hidden) stopAudio(); }
document.addEventListener('visibilitychange', visibility);
releases.push(() => document.removeEventListener('visibilitychange', visibility));
const release = (): void => {
  if (disposed) return; disposed = true; releases.forEach((item) => item()); sound.dispose(); void owner.dispose(); loader.dispose('pilot review closed');
};
addEventListener('pagehide', (event) => { if (!(event as PageTransitionEvent).persisted) release(); });
requestAnimationFrame(() => setTimeout(() => {
  if (disposed) return;
  loader.activate(); refreshPortraits();
  releases.push(mountPilotPortrait(loader, detailMount, PILOT_SPECIMENS_V1[0]!, 132, false));
  try { releases.push(mountPilotEarthVista(vistaCanvases, vistaStatus)); }
  catch { vistaStatus.textContent = 'Canonical vista unavailable; comparison incomplete.'; }
  root.dataset.pilotReview = 'ready';
}, 0));
