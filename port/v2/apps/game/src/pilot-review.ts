import { getLootCatalogueDefinition } from '@cf/domain-loot';
import type { AudioContextLike } from '@cf/audio';
import { createTameGreetingAudioOwner } from './tame-greeting-audio.js';
import { PILOT_CUES, PILOT_FONT_LICENSE_URL, PILOT_SHIP_IMAGES, PILOT_VISTA_LAYERS } from './pilot-assets.js';
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
html,body{margin:0;background:#080f1b}.cf-pilot{max-width:1180px;margin:auto;padding:16px max(16px,env(safe-area-inset-right)) 32px max(16px,env(safe-area-inset-left))}
#pilot-review>section{margin-top:24px}#pilot-review>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;border-bottom:1px solid #455b76;flex-wrap:wrap}
#pilot-review .p-heading{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:12px;flex-wrap:wrap}#pilot-review .p-heading .p-stack{gap:3px}
#pilot-review .p-lead{max-width:70ch;color:var(--p-muted)}#pilot-review .p-study-links{display:flex;gap:8px;flex-wrap:wrap}#pilot-review .p-study-links a{display:inline-flex;align-items:center;justify-content:center}
#pilot-review .p-art-basin{position:relative;aspect-ratio:16/9;overflow:hidden;background:#101e30}#pilot-review .p-art-basin canvas,#pilot-review .p-art-basin img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
#pilot-review .p-scene-label{padding:10px 12px;border-top:1px solid #455b76;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}#pilot-review .p-scene-label h3{font-size:14px}#pilot-review .p-scene-label p{font-size:12px}
#pilot-review .p-ship-study{display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:12px}#pilot-review .p-ship-study>.p-ship,#pilot-review .p-ship-study>svg{display:block;width:100%;max-width:340px;max-height:280px;height:auto;align-self:center;justify-self:center}
#pilot-review .p-scroll{overflow:auto;padding:16px;max-width:100%;overscroll-behavior-x:contain}#pilot-review .p-native-pair{display:flex;gap:24px;width:max-content;min-width:100%}#pilot-review .p-native-pair>article{flex-shrink:0;display:grid;align-content:start;gap:12px}#pilot-review .p-native-pair h3{font-size:14px}#pilot-review .p-native-pair p{max-width:440px}
#pilot-review .p-fields{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}#pilot-review .p-field{display:grid;gap:4px;min-width:0;flex:1}#pilot-review .p-field:first-child{flex:3;min-width:min(100%,240px)}#pilot-review .p-field select{width:100%;min-width:0;max-width:100%}
#pilot-review .p-audio-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}#pilot-review .p-audio-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid #455b76}#pilot-review .p-audio-card h3{font-size:14px}#pilot-review .p-audio-card .p-stack{gap:3px}#pilot-review .p-audio-card button{max-width:130px}
#pilot-review .p-rule{padding:10px 12px;border-left:2px solid #ddc28a;background:#142238;color:#e2eaf5}#pilot-review .p-code{overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}#pilot-review .p-swatch{width:36px;height:36px;border:1px solid #8ba0b9;border-radius:6px}
#pilot-review .p-ship-views{display:flex;gap:16px;align-items:end;overflow:auto;padding:12px 0}#pilot-review .p-ship-views figure{margin:0;flex-shrink:0}#pilot-review .p-ship-views img{display:block;pointer-events:none}#pilot-review figcaption{font-size:12px;color:var(--p-muted)}
#pilot-review .p-card>svg{display:block;width:100%;height:auto}#pilot-review .p-supporting-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
@media(max-width:640px){#pilot-review{padding:12px max(12px,env(safe-area-inset-right)) 24px max(12px,env(safe-area-inset-left))}#pilot-review>header{align-items:start;gap:10px}#pilot-review>section{margin-top:20px}#pilot-review .p-study-links{width:100%}#pilot-review .p-study-links a{flex:1}#pilot-review .p-study-links a:last-child{flex-basis:100%}#pilot-review .p-grid,#pilot-review .p-audio-grid,#pilot-review .p-supporting-grid{grid-template-columns:1fr}#pilot-review .p-pad{padding:12px}#pilot-review .p-native-pair{gap:24px}}
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
intro.append(make('p', 'p-eyebrow', 'Celestial Frontier · direction review'), make('h1', '', 'Audiovisual pilot'),
  make('p', 'p-muted', 'Earth arrival, the Scout and a restrained listening set. Human approval pending.'));
const links = make('nav', 'p-study-links'); links.setAttribute('aria-label', 'Compare game versions');
const play = make('a', 'p-button p-primary', 'Open playable pilot'); play.href = './?avpilot=1';
const baseline = make('a', 'p-button', 'Current v2 · without pilot'); baseline.href = './';
const production = make('a', 'p-button', 'Production v1.8.9'); production.href = 'https://celestialfrontier.github.io/';
links.append(play, baseline, production); header.append(intro, links); root.append(header);

function section(title: string, eyebrow: string, id: string): HTMLElement {
  const node = make('section'); node.id = id; const heading = make('div', 'p-heading'); const words = make('div', 'p-stack');
  words.append(make('p', 'p-eyebrow', eyebrow), make('h2', '', title)); heading.append(words); node.append(heading); root.append(node); return node;
}
const vistaSection = section('Earth · arrival and surface', 'World direction', 'pilot-earth');
const vistaPair = make('div', 'p-grid'); const vistaCanvases: HTMLCanvasElement[] = [];
for (const enhanced of [false, true]) {
  const card = make('article', 'p-card'); const basin = make('div', 'p-art-basin'); const canvas = make('canvas');
  basin.dataset.pilotStudyVista = enhanced ? 'candidate' : 'current';
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', enhanced ? 'Candidate Earth landscape, with the unchanged canonical vista residents' : 'Current v2 canonical Earth vista');
  vistaCanvases.push(canvas); basin.append(canvas);
  if (enhanced) PILOT_VISTA_LAYERS.forEach((url, index) => {
    const layer = make('img'); layer.src = url; layer.alt = ''; layer.decoding = 'async';
    layer.dataset.depth = index === 0 ? 'far' : index === 1 ? 'middle' : 'near'; basin.append(layer);
  });
  const label = make('div', 'p-scene-label');
  label.append(make('h3', '', enhanced ? 'Candidate landscape' : 'Current v2'), make('p', 'p-muted', 'Earth · temperate'));
  card.append(basin, label); vistaPair.append(card);
}
const vistaStatus = make('p', 'p-muted', 'Loading the same Earth vista in both views…');
vistaStatus.setAttribute('role', 'status'); vistaStatus.setAttribute('aria-live', 'polite');
vistaSection.append(vistaPair, vistaStatus);

const shipSection = section('Scout · hull and material', 'Ship direction', 'pilot-ship');
const shipPair = make('div', 'p-grid');
const oldShip = make('article', 'p-card p-ship-study'); oldShip.dataset.pilotStudyShip = 'current';
oldShip.append(make('h3', '', 'Current v2 Scout'), createShipyardPreview(document, shipVisualStateOf({ items: [], ascCh: 0, liverySeed: 0x5111 })),
  make('p', 'p-muted', 'Chemical drive · no installed hardpoints'));
const nextShip = make('article', 'p-card p-ship-study'); nextShip.dataset.pilotStudyShip = 'candidate'; const image = make('img', 'p-ship');
image.src = PILOT_SHIP_IMAGES[300]; image.alt = 'Candidate chemical Scout at 300 pixels, with no installed hardpoints'; image.width = 300; image.height = 300;
nextShip.append(make('h3', '', 'Candidate Scout'), image, make('p', 'p-muted', 'Compare hull, glass, metal and silhouette.'));
shipPair.append(oldShip, nextShip); shipSection.append(shipPair);
const shipSizes = make('details', 'p-disclosure'); shipSizes.append(make('summary', '', 'Inspect the Scout exports at native sizes'));
const shipViews = make('div', 'p-ship-views'); shipViews.tabIndex = 0; shipViews.setAttribute('role', 'region'); shipViews.setAttribute('aria-label', 'Native ship exports; scroll horizontally');
for (const size of [132, 300, 512] as const) {
  const figure = make('figure'); const view = make('img'); view.src = PILOT_SHIP_IMAGES[size]; view.width = size; view.height = size; view.alt = `${size} pixel candidate Scout`;
  figure.append(view, make('figcaption', '', `${size} px`)); shipViews.append(figure);
}
shipSizes.append(shipViews); shipSection.append(shipSizes);

const specimens = section('Living species · eight body plans', 'Protected portraits', 'pilot-specimens');
specimens.append(make('p', 'p-rule', 'Static fallback for all eight body plans. The protected portraits are unchanged; the second view may move a frame accent only. Anatomical animation remains incomplete.'));
const selectors = make('div', 'p-fields'); const familySelect = make('select'); familySelect.setAttribute('aria-label', 'Body plan specimen');
for (const specimen of PILOT_SPECIMENS_V1) { const option = make('option', '', `${specimen.family} · ${specimen.label}`); option.value = specimen.id; familySelect.append(option); }
const sizeSelect = make('select'); sizeSelect.setAttribute('aria-label', 'Actual portrait size');
for (const size of PILOT_PORTRAIT_SIZES_V1) { const option = make('option', '', `${size} px`); option.value = String(size); option.selected = size === 300; sizeSelect.append(option); }
const familyLabel = make('label', 'p-field'); familyLabel.append(make('span', 'p-muted', 'Body plan'), familySelect);
const sizeLabel = make('label', 'p-field'); sizeLabel.append(make('span', 'p-muted', 'Display size'), sizeSelect);
selectors.append(familyLabel, sizeLabel); specimens.append(selectors);
const portraitScroll = make('div', 'p-scroll p-card'); portraitScroll.tabIndex = 0; portraitScroll.setAttribute('role', 'region'); portraitScroll.setAttribute('aria-label', 'Protected portraits at actual display size; scroll horizontally to compare');
const pair = make('div', 'p-native-pair'); portraitScroll.append(pair); specimens.append(portraitScroll);
const specimenDetails = make('details', 'p-disclosure'); specimenDetails.append(make('summary', '', 'Specimen identity and sizing'));
const identity = make('p', 'p-code p-muted'); const specimenNotes = make('div', 'p-disclosure-body');
specimenNotes.append(make('p', 'p-muted', 'Both views use the same canonical portrait. At 300 px the unchanged 440 px portrait is displayed smaller; 132 and 440 use their native portrait sizes.'), identity);
specimenDetails.append(specimenNotes); specimens.append(specimenDetails);
let portraitReleases: Array<() => void> = [];
function refreshPortraits(): void {
  portraitReleases.forEach((release) => release()); portraitReleases = []; pair.replaceChildren();
  const specimen = PILOT_SPECIMENS_V1.find((row) => row.id === familySelect.value)!;
  const size = Number(sizeSelect.value) as PilotPortraitSizeV1;
  for (const animated of [false, true]) {
    const card = make('article'); card.append(make('h3', '', animated ? 'Frame motion · static anatomy' : 'Protected static portrait'));
    pair.append(card); portraitReleases.push(mountPilotPortrait(loader, card, specimen, size, animated));
  }
  identity.textContent = `${specimen.familyBasis} · Source: ${specimen.source.kind} · ${specimen.visualKey}`;
}
familySelect.addEventListener('change', refreshPortraits); sizeSelect.addEventListener('change', refreshPortraits);
releases.push(() => { portraitReleases.forEach((release) => release()); familySelect.removeEventListener('change', refreshPortraits); sizeSelect.removeEventListener('change', refreshPortraits); });

const audioSection = section('Listening · candidates and current game', 'Sound direction', 'pilot-audio');
audioSection.append(make('p', 'p-lead', 'Compare the current v2 and playable pilot in the same scene, on the same device. Match the listening level manually. These candidate auditions do not supply an automatic or recorded baseline A/B. Creature voices retain their canonical synthesis.'));
const listeningLinks = make('div', 'p-row');
const listenCurrent = make('a', 'p-button', 'Listen in current v2'); listenCurrent.href = './';
const listenPilot = make('a', 'p-button', 'Listen in playable pilot'); listenPilot.href = './?avpilot=1';
listeningLinks.append(listenCurrent, listenPilot); audioSection.append(listeningLinks);
const audioOptions = make('div', 'p-row'); const mono = make('input'); mono.type = 'checkbox'; const soft = make('input'); soft.type = 'checkbox'; soft.checked = true;
for (const [input, labelText] of [[mono, 'Mono'], [soft, 'Reduced intensity']] as const) { const label = make('label', 'p-check', labelText); label.prepend(input); audioOptions.append(label); }
const stop = make('button', '', 'Stop audio'); const full = make('button', 'p-primary', 'Play music + woodland');
audioOptions.append(full, stop); const audioStatus = make('p', 'p-muted', 'Silent until you choose Play.'); audioStatus.setAttribute('role', 'status'); audioStatus.setAttribute('aria-live', 'polite'); audioStatus.setAttribute('aria-atomic', 'true');
audioSection.append(audioOptions, audioStatus); const audioGrid = make('div', 'p-audio-grid'); audioSection.append(audioGrid);
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
  const card = make('article', 'p-audio-card'); const words = make('div', 'p-stack'); const button = make('button', '', 'Play');
  button.setAttribute('aria-label', `Play ${cue.title.toLowerCase()}`); button.dataset.pilotCue = cue.id;
  words.append(make('h3', '', cue.title), make('p', 'p-muted', cue.caption), make('p', 'p-muted', `${cue.durationMs / 1000}s candidate`)); card.append(words, button);
  const click = (event: MouseEvent): void => { void audition(event, [cue.id]); }; button.addEventListener('click', click);
  releases.push(() => button.removeEventListener('click', click)); audioGrid.append(card);
}
const stopAudio = (): void => { audioGeneration++; sound.stop(); audioStatus.textContent = 'Stopped.'; };
const complete = (event: MouseEvent): void => { void audition(event, ['cf-pilot-exploration-music', 'cf-pilot-temperate-bed']); };
stop.addEventListener('click', stopAudio); full.addEventListener('click', complete); mono.addEventListener('change', stopAudio); soft.addEventListener('change', stopAudio);
releases.push(() => { stop.removeEventListener('click', stopAudio); full.removeEventListener('click', complete); mono.removeEventListener('change', stopAudio); soft.removeEventListener('change', stopAudio); });

const mockups = section('Supporting interface sketches', 'Review only', 'pilot-mockups');
mockups.append(make('p', 'p-muted', 'Isolated layout studies. These samples do not change the live Survey, Compendium or Inventory interfaces.'));
const mockDetails = make('details', 'p-disclosure'); mockDetails.append(make('summary', '', 'Survey, Compendium and Inventory sketches'));
const mockGrid = make('div', 'p-grid p-supporting-grid p-disclosure-body');
const survey = make('article', 'p-card p-pad p-stack'); survey.append(make('p', 'p-eyebrow', 'Survey'), make('h3', '', 'Earth'), make('p', 'p-muted', 'Sol · temperate · landed vista'), make('hr', 'p-divider'), make('p', '', 'A quiet interval between canopy and open sky.'));
const compendium = make('article', 'p-card p-pad p-stack'); compendium.append(make('p', 'p-eyebrow', 'Compendium detail'), make('h3', '', PILOT_SPECIMENS_V1[0]!.label), make('p', 'p-muted', 'Canonical catalogue identity · protected portrait'));
const detailMount = make('div'); compendium.append(detailMount);
const gear = getLootCatalogueDefinition('fieldsuit')!;
const inventory = make('article', 'p-card p-pad p-stack'); inventory.append(make('p', 'p-eyebrow', 'Inventory gear detail'), make('h3', '', gear.name), make('p', 'p-muted', gear.description), make('hr', 'p-divider'), make('p', '', 'Base definition study. No rolled item, ownership or equipped state is implied.'));
mockGrid.append(survey, compendium, inventory); mockDetails.append(mockGrid); mockups.append(mockDetails);

const tokens = section('Review notes', 'Scope and provenance', 'pilot-provenance');
const provenance = make('details', 'p-disclosure'); provenance.append(make('summary', '', 'Palette, sources and approval boundary'));
const provenanceBody = make('div', 'p-disclosure-body');
const swatches = make('div', 'p-row');
for (const [name, color] of Object.entries({ space: PILOT_TOKENS.space, panel: PILOT_TOKENS.panel, text: PILOT_TOKENS.text, accent: PILOT_TOKENS.accent, player: PILOT_TOKENS.player, harm: PILOT_TOKENS.harm, gain: PILOT_TOKENS.gain })) {
  const tile = make('div', 'p-stack'); const swatch = make('div', 'p-swatch'); swatch.style.background = color;
  tile.append(swatch, make('p', 'p-code', `${name} ${color}`)); swatches.append(tile);
}
provenanceBody.append(swatches, make('p', 'p-muted', 'Navy glass, gold accents and locally packaged Inter with system fallbacks. One 12/14/16/22px type scale, compact 8px panels and 6px controls retain 44px targets and visible keyboard focus. Semantic and rarity colors keep their existing owners.'),
  make('p', 'p-muted', 'The Earth comparison uses the same canonical temperate roster. The Scout retains its chemical-drive identity without installed hardpoints. Protected creature pixels remain unchanged; frame motion is not anatomical animation. Eight original REAPER/Surge recordings remain listening candidates.'),
  make('p', 'p-rule', 'Human visual and listening review and real iPhone/PWA evidence remain open. This is Phase 1 direction work; Phase 2 top bar, dock and rails still wait for approval.'));
const fontLicense = make('a', 'p-button', 'Inter font license · SIL Open Font License 1.1');
fontLicense.href = PILOT_FONT_LICENSE_URL;
provenanceBody.append(fontLicense);
provenance.append(provenanceBody); tokens.append(provenance);

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
