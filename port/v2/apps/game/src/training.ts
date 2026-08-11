/* training.ts — FIELD TRAINING, the framework + the first arc (main.js
   TUT_STEPS, texts VERBATIM). The slice runs the six lessons its systems
   support today — welcome · find-earth · survey-tour · atlas-add ·
   atlas-open · land — then graduates with an honest note; the cache/feed/
   breed/duel/heal arc resumes when the Compendium's live systems arrive
   (Phase 5). Carried laws: the lesson card publishes --tut-bot (CF1805-01:
   any surface that can rise above the card must clear it) and NEVER covers
   the dock (CF1806-02's family); a `spot` gets the spotlight ring; `allow`
   locks the chrome down to the lesson's own affordances (the canvas stays
   free when '#cosmos' is allowed); "Skip training" loses nothing (the
   game's own promise) and Settings can restart it any day the step arc
   grows. Steps advance on REAL gameEvents — the same events live play
   emits — never on a timer. */

export interface TutStep {
  id: string;
  text: () => string;
  btn?: string;
  spot?: string;
  allow?: string[];
  when?: (t: string, d: Record<string, unknown>) => boolean;
}
export interface TrainingDeps {
  explorerName: () => string;
  isDone: () => boolean;
  setDone: (v: boolean) => void;
  persist: () => void;
}

export function buildSteps(deps: TrainingDeps): TutStep[] {
  return [
    {
      id: 'welcome', btn: 'Begin Training',
      text: () => 'Welcome to <b>Sol</b>, ' + esc(deps.explorerName() || 'Explorer') + ' — humanity’s cradle and your first charter. The order asks one thing of every new Pathfinder first: <b>Field Training</b>.<br>It’s all real practice, and nothing you lose in training follows you out.',
    },
    {
      id: 'find-earth', allow: ['#cosmos'],
      text: () => 'First, find home. <b>Drag and zoom to Earth</b> — the blue world, third from the Sun — and <b>tap it</b> to open its survey card.',
      when: (t, d) => t === 'survey' && d.planetSeed === 133,
    },
    {
      id: 'survey-tour', spot: '#survey', btn: 'Got It', allow: ['#survey'],
      text: () => 'This is a <b>survey card</b> — every world, star and galaxy has one: atmosphere, climate, life, hazards. The universe is generated, so every explorer sees this exact card at Earth. A card is only the view from orbit — dive toward a world and confirm the descent to land, and the ground survey opens the rest.',
    },
    {
      id: 'atlas-add', spot: '#survey [data-act="add"]', allow: ['#survey'],
      text: () => 'Chart it. Tap <b>+ Add to Star Atlas</b> on Earth’s card — the Atlas is how you find your way back across the infinite.',
      when: (t, d) => t === 'atlas-add' && d.id === 'p133',
    },
    {
      id: 'atlas-open', spot: '#dockatlas', allow: ['#dockatlas', '#railatlas', '#atlaspanel'],
      text: () => 'Earth is charted — your Atlas’s first entry. Open the <b>Star Atlas</b> (the dock — or the right rail on desktop). Tapping any entry travels there instantly.',
      when: (t, d) => t === 'atlas-open' && !!d.open,
    },
    {
      id: 'land', spot: '#survey [data-act="landcta"]', allow: ['#survey', '#cosmos'],
      text: () => 'Now stand on it. Press <b>Land</b> on Earth’s card — home never waves you off. <b>Planetside</b> opens: the world at ground level, painted from its own survey. Out there, hostile worlds fight the descent — the card always shows your odds first.',
      when: (t, d) => t === 'landfall' && d.planetSeed === 133,
    },
    {
      id: 'grad', btn: 'Finish for now',
      text: () => 'Well flown, Pathfinder. The next lessons — the training cache, feeding, breeding, your first duel, the scratch and the heal — arrive with the living Compendium (they train the systems, so they wait for the systems). Everything you just learned is the real game: chart, travel, land. The infinite is open.',
    },
  ];
}

const esc = (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));

let steps: TutStep[] = [];
let stepIdx = -1;
let deps0: TrainingDeps | null = null;
let cardEl: HTMLElement | null = null;
let spotEl: HTMLElement | null = null;
let spotTimer = 0;

export function initTraining(deps: TrainingDeps): void {
  deps0 = deps;
  if (deps.isDone()) return;
  steps = buildSteps(deps);
  cardEl = document.createElement('div');
  cardEl.id = 'tutcard';
  cardEl.className = 'glass';
  cardEl.setAttribute('data-sel', 'tutcard');
  cardEl.style.cssText = 'background:rgba(10,16,30,0.96);box-shadow:0 10px 34px rgba(0,0,0,0.55);position:fixed;left:50%;transform:translateX(-50%);' +
    'bottom:calc(env(safe-area-inset-bottom,0px) + var(--dock-h,44px) + 40px);' +   /* measured dock + its 12px inset + 28px clearance */
    'width:min(440px,92vw);z-index:30;border-radius:14px;padding:14px 16px;color:#dbe7f8;font:13px/1.55 system-ui,sans-serif';
  document.body.appendChild(cardEl);
  spotEl = document.createElement('div');
  spotEl.id = 'tutspot';
  spotEl.style.cssText = 'position:fixed;border:2px solid #ffd9a0;border-radius:12px;pointer-events:none;' +
    'z-index:29;box-shadow:0 0 0 4000px rgba(3,5,10,0.25);display:none;transition:all 0.25s';
  document.body.appendChild(spotEl);
  document.body.classList.add('training');
  stepIdx = 0;
  renderStep();
  spotTimer = window.setInterval(placeSpot, 300);   /* the spotlight follows layout changes */
}

export function trainingActive(): boolean { return stepIdx >= 0 && stepIdx < steps.length; }
export function trainingStepId(): string | null { return trainingActive() ? steps[stepIdx]!.id : null; }

function renderStep(): void {
  if (!cardEl || !deps0) return;
  if (stepIdx >= steps.length) { finish(false); return; }
  const st = steps[stepIdx]!;
  cardEl.innerHTML =
    `<div style="color:#8fa3c4;font-size:11px;letter-spacing:0.06em;margin-bottom:4px">FIELD TRAINING · ${stepIdx + 1} / ${steps.length}</div>` +
    `<div data-sel="tuttext">${st.text()}</div>` +
    '<div style="display:flex;gap:10px;align-items:center;margin-top:10px">' +
    (st.btn ? `<button data-sel="tutbtn" style="background:#1d3a5e;color:#eaf2ff;border:1px solid #caa24f;border-radius:9px;padding:9px 16px;cursor:pointer;min-height:44px;font:12.5px system-ui">${esc(st.btn)}</button>` : '') +
    '<button data-sel="tutskip" style="background:none;border:0;color:#7f96ba;cursor:pointer;font:11.5px system-ui;text-decoration:underline;min-height:44px">Skip training — you lose nothing, and Settings can restart it</button>' +
    '</div>';
  cardEl.querySelector('[data-sel=tutbtn]')?.addEventListener('click', () => advance());
  cardEl.querySelector('[data-sel=tutskip]')!.addEventListener('click', () => finish(true));
  applyAllow(st);
  placeSpot();
  /* CF1805-01: publish where the card TOP sits, so raisable surfaces clear it */
  document.documentElement.style.setProperty('--tut-bot', Math.round(cardEl.getBoundingClientRect().top) + 'px');
}
function placeSpot(): void {
  if (!spotEl || !trainingActive()) return;
  const st = steps[stepIdx]!;
  const t = st.spot ? (document.querySelector(st.spot) as HTMLElement | null) : null;
  if (!t || t.offsetParent === null) { spotEl.style.display = 'none'; return; }
  const r = t.getBoundingClientRect();
  spotEl.style.display = 'block';
  spotEl.style.left = (r.left - 6) + 'px';
  spotEl.style.top = (r.top - 6) + 'px';
  spotEl.style.width = (r.width + 12) + 'px';
  spotEl.style.height = (r.height + 12) + 'px';
}
function applyAllow(st: TutStep): void {
  /* the focus lockdown, light edition: chrome outside the lesson's allow
     list goes inert; the canvas stays free only when '#cosmos' is allowed */
  const chrome = ['#dock', '#raillft', '#railrgt', '#searchbox', '#setpanel', '#codexpanel', '#recpanel', '#atlaspanel', '#survey'];
  const allow = st.allow || [];
  for (const sel of chrome) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) continue;
    const allowed = allow.some((a) => a === sel || a.startsWith(sel + ' ') || sel === '#dock' && allow.some((x) => x.startsWith('#dock')));
    el.style.pointerEvents = allowed || allow.includes(sel) ? '' : 'none';
    el.style.opacity = allowed || allow.includes(sel) ? '' : '0.45';
  }
  /* per-button dock allowance (e.g. only the Atlas button glows open) */
  for (const b of document.querySelectorAll('#dock button')) {
    const el = b as HTMLElement;
    const id = '#' + el.id;
    const on = allow.includes(id);
    if (allow.some((a) => a.startsWith('#dock') && a !== '#dock')) {
      el.style.pointerEvents = on ? '' : 'none';
      el.style.opacity = on ? '' : '0.35';
      (document.getElementById('dock') as HTMLElement).style.pointerEvents = '';
      (document.getElementById('dock') as HTMLElement).style.opacity = '';
    }
  }
  const canvas = document.querySelector('canvas') as HTMLElement | null;
  if (canvas) canvas.style.pointerEvents = allow.includes('#cosmos') || !trainingActive() ? '' : 'none';
}
function clearAllow(): void {
  for (const sel of ['#dock', '#raillft', '#railrgt', '#searchbox', '#setpanel', '#codexpanel', '#recpanel', '#atlaspanel', '#survey']) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) { el.style.pointerEvents = ''; el.style.opacity = ''; }
  }
  for (const b of document.querySelectorAll('#dock button')) { (b as HTMLElement).style.pointerEvents = ''; (b as HTMLElement).style.opacity = ''; }
  const canvas = document.querySelector('canvas') as HTMLElement | null;
  if (canvas) canvas.style.pointerEvents = '';
}
function advance(): void {
  stepIdx++;
  if (stepIdx >= steps.length) { finish(false); return; }
  renderStep();
}
function finish(skipped: boolean): void {
  stepIdx = steps.length;
  clearAllow();
  cardEl?.remove(); cardEl = null;
  spotEl?.remove(); spotEl = null;
  clearInterval(spotTimer);
  document.body.classList.remove('training');
  document.documentElement.style.removeProperty('--tut-bot');
  deps0?.setDone(true);
  deps0?.persist();
  void skipped;
}

/** the live-play event bus — training listens to the SAME events the game emits */
export function gameEvent(type: string, detail: Record<string, unknown>): void {
  if (!trainingActive()) return;
  const st = steps[stepIdx]!;
  if (st.when && st.when(type, detail)) advance();
}
