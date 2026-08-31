/* training.ts — FIELD TRAINING, the framework + the first arc (main.js
   TUT_STEPS as behavioral reference). The slice keeps its six hands-on
   navigation lessons — welcome · find-earth · survey-tour · atlas-add ·
   atlas-open · land — then adds bounded READ-ONLY orientation for the live
   Planetside, Engineering, Compendium, Records, sharing, and Guardian/combat
   surfaces. No capture, inventory spend, crafting, companion mutation, or
   combat result may masquerade as Training progress: those lessons require a
   separately versioned sandbox authority before they can become hands-on.
   Carried laws: the lesson card publishes --tut-bot (CF1805-01:
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
  /** Close the read-only board this card was touring before the next lesson. */
  closePanelsAfter?: boolean;
  when?: (t: string, d: Record<string, unknown>) => boolean;
}
export type TrainingEndIntent = 'finish' | 'skip';
export type TrainingEndResult =
  | { kind: 'completed' }
  | { kind: 'deferred'; reason: 'source-error' }
  | {
      kind: 'refused';
      reason: 'unknown-snapshot' | 'write-failed' | 'busy' | 'protected-storage';
    };
export interface TrainingDeps {
  explorerName: () => string;
  isDone: () => boolean;
  complete: (intent: TrainingEndIntent) => Promise<TrainingEndResult>;
  closePanels: () => void;
}

const panelOpened = (id: 'shipyard' | 'codex' | 'rec') => (
  type: string,
  detail: Record<string, unknown>,
): boolean => type === 'panel-open' && detail.id === id && detail.open === true;

export function buildSteps(deps: TrainingDeps): TutStep[] {
  return [
    {
      id: 'welcome', btn: 'Begin Training',
      text: () => 'Welcome to <b>Sol</b>, ' + esc(deps.explorerName() || 'Explorer') + ' — humanity’s cradle and your first charter. The order asks one thing of every new Pathfinder first: <b>Field Training</b>.<br>It’s all real practice, and nothing you lose in training follows you out.',
    },
    {
      id: 'find-earth', allow: ['#cosmos', '#survey [data-survey-close]'],
      text: () => 'First, find home. <b>Drag and zoom to Earth</b> — the blue world, third from the Sun — and <b>tap it</b> to open its survey card.',
      when: (t, d) => t === 'survey' && d.planetSeed === 133,
    },
    {
      id: 'survey-tour', spot: '#survey', btn: 'Got It', allow: ['#survey [data-sel="title"]'],
      text: () => 'This is a <b>survey card</b> — every world, star and galaxy has one: atmosphere, climate, life, hazards. The universe is generated, so every explorer sees this exact card at Earth. A card is only the view from orbit — press <b>Land</b> on a world card to make planetfall, and the ground survey opens the rest.',
    },
    {
      id: 'atlas-add', spot: '#survey [data-act="add"]', allow: ['#survey [data-act="add"]'],
      text: () => 'Practice the highlighted <b>Star Atlas</b> action on Earth’s card without changing your expedition’s Atlas. Outside Training, the same action adds a new chart or confirms the one you already carry. The Atlas is how you find your way back across the infinite.',
      when: (t, d) => t === 'atlas-add' && d.id === 'p133',
    },
    {
      id: 'atlas-open', spot: '#dockatlas,#railatlas', allow: ['#dockatlas', '#railatlas', '#atlaspanel'],
      text: () => 'That was the real Atlas action, practiced without changing your expedition’s charts. Open the <b>Star Atlas</b> (the dock — or the right rail on desktop). Outside Training, tapping a charted planet entry returns to its live system survey; <b>Land</b> remains your choice.',
      when: (t, d) => t === 'atlas-open' && !!d.open,
    },
    {
      id: 'land', spot: '#survey [data-act="landcta"]', allow: ['#survey [data-act="landcta"]'],
      text: () => 'Now stand on it. Press <b>Land</b> on Earth’s card. <b>Planetside</b> opens: the world at ground level, painted from its own survey. This development slice does not simulate the mature game’s hostile descent odds or wave-offs yet; the Guide marks those systems as still to come.',
      when: (t, d) => t === 'landfall' && d.planetSeed === 133,
    },
    {
      id: 'planetside-briefing', btn: 'Continue the tour',
      text: () => 'Planetfall reveals the real <b>Planetside</b> biosphere after Training. <b>Tame</b>, <b>Scavenge</b>, and <b>Sample</b> each choose uniformly from the full eligible biosphere — never a preview row — and every hit or miss spends one shared Yield attempt. This card is orientation only: Field Training will not roll a capture or spend Yield.',
    },
    {
      id: 'engineering-open', spot: '#dockshipyard,#railshipyard',
      allow: ['#dockshipyard', '#railshipyard', '#shipyardpanel'],
      text: () => 'Meet the ship’s other half. Open <b>Engineering &amp; Shipyard</b> from the 🛠 control. Opening and inspecting this board changes nothing.',
      when: panelOpened('shipyard'),
    },
    {
      id: 'engineering-tour', spot: '#shipyardpanel', btn: 'Engineering understood',
      allow: ['#shipyardpanel [data-pnx]', '#shipyardpanel details > summary'],
      closePanelsAfter: true,
      text: () => 'Engineering shows only source-proven opportunities. A grounded lifeless world can expose <b>Mine</b>; an eligible star can expose <b>Skim</b>; Research and the fixed Fabricator enable only connected effects. An eligible slotted gear craft made entirely from exceptional direct materials may receive one deterministic <b>Pureforged</b> modifier. You may inspect the sections, but Training keeps every action button locked so no ore, Stardust, recipe, or inventory fact changes.',
    },
    {
      id: 'compendium-open', spot: '#dockcodex,#railcodex',
      allow: ['#dockcodex', '#railcodex', '#codexpanel'],
      text: () => 'Now open the <b>Compendium</b>. It is the bounded catalogue of life you have actually recorded; an empty new expedition is honest, not a training cache.',
      when: panelOpened('codex'),
    },
    {
      id: 'compendium-tour', spot: '#codexpanel', btn: 'Companions understood',
      allow: ['#codexpanel [data-pnx]'],
      closePanelsAfter: true,
      text: () => 'Captured fauna details expose the live exact-instance companion controls after Training: <b>Listen</b>; <b>Feed</b> one eligible companion with one exact flora lot; nonlethal <b>Breed</b> with active-play Recovery; identity-only <b>Rename</b>; and the role-only <b>Field Scout</b> selector. Field Scout can name, switch, or stand down one exact owned companion, but interception, Scout XP, dispatch, missions, care, bond, and friendly duels are not live yet. This tour changes none of those facts.',
    },
    {
      id: 'records-open', spot: '#dockrecords,#railrecords',
      allow: ['#dockrecords', '#railrecords', '#recpanel'],
      text: () => 'Open <b>Expedition Records</b>. This is where durable exploration totals, achievement shelves, rank, and imported Journal history report what the universe has actually verified.',
      when: panelOpened('rec'),
    },
    {
      id: 'records-tour', spot: '#recpanel', btn: 'Records understood',
      allow: ['#recpanel [data-pnx]'],
      closePanelsAfter: true,
      text: () => 'Records are evidence, not a reward fountain: aggregate milestones and the live exact-event achievements appear only after their owning transaction verifies. The remaining event joins and achievement reward claims stay unavailable instead of being guessed from counters.',
    },
    {
      id: 'horizon', spot: '#primechip', btn: 'Show me the horizon',
      text: () => 'Beyond Training, a landed world can offer a deterministic <b>Conquest</b> forecast. Its defender is the eligible Elemental Titan, otherwise the Apex Guardian, otherwise the world’s strongest fauna. A verified win can conquer the world; defeated Guardians and Titans join the Compendium and may return as champions, while losing one of those captured rulers is permanent. Titan victories claim the nine <b>Prime Signatures</b>, and the ninth opens the Frontier. The verified result then plays through the accessible <b>Combat Chronicle</b>; its battle-log Share changes no expedition fact.',
    },
    {
      id: 'grad', btn: 'Finish for now',
      text: () => 'Well flown, Pathfinder. This short drill stays focused on real navigation: chart, travel, and land; its board briefings are read-only. After Finish, a survey card’s <b>Share</b> prepares a verified CF1 world code, and pasting a valid CF1 code into Search follows its source-proven route when your ship and Prime reach allow it. On a living world, use <b>Tame</b>, <b>Scavenge</b>, and <b>Sample</b> after Finish: each chooses uniformly from its eligible species across the full biosphere, not only the at-most-eight-row preview. All three share finite <b>Biosphere Yield</b>; a hit or miss spends 1 attempt, and the pool fully recovers at the next 20-minute active-play cycle, never while the game is closed. The first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol banks that world’s one Chapter 2 life-discovery tick in the same capture transaction. A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing. This is v2’s current replacement for v1.8.9’s separate Discover Life action; Survey Records and accepted or weekly bioscan Charters remain unavailable. A real fauna Compendium detail can <b>Feed</b> one exact unassigned companion below the 200-Meal cap with one exact flora lot through <b>Use 1</b>, <b>Breed</b> two distinct exact owned fauna with nonlethal active-play Recovery, <b>Rename</b> one exact owned companion without changing its creature identity, or name and stand down the role-only <b>Field Scout</b>. This drill performs no capture, meal, breeding, rename, Field Scout change, engineering action, or combat. Tastes, stat or Power growth, injury care, healing, poison, bond, explorer eating, Scout interception or XP, dispatch, friendly duels, and missions remain unavailable.',
    },
  ];
}

const esc = (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));

let steps: TutStep[] = [];
let stepIdx = -1;
let deps0: TrainingDeps | null = null;
let cardEl: HTMLElement | null = null;
let spotEl: HTMLElement | null = null;
let announceEl: HTMLElement | null = null;
let spotTimer = 0;
let focusTimer = 0;
let announceTimer = 0;
let focusBeforeTraining: HTMLElement | null = null;
let allowedRoots: HTMLElement[] = [];
let redirectingFocus = false;
let finishing = false;

const CHROME = [
  '#dock', '#raillft', '#railrgt', '#searchbox', '#setpanel', '#guidepanel',
  '#codexpanel', '#recpanel', '#atlaspanel', '#chpanel', '#shipyardpanel',
  '#inventorypanel', '#combatpanel', '#survey', '#importsheet',
];
const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),' +
  'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
interface LockState {
  inert: boolean;
  pointerEvents: string;
  opacity: string;
}
const locked = new Map<HTMLElement, LockState>();

export function initTraining(deps: TrainingDeps): void {
  deps0 = deps;
  if (deps.isDone()) return;
  focusBeforeTraining = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement : null;
  steps = buildSteps(deps);
  cardEl = document.createElement('div');
  cardEl.id = 'tutcard';
  cardEl.className = 'glass';
  cardEl.setAttribute('data-sel', 'tutcard');
  cardEl.setAttribute('role', 'region');
  cardEl.setAttribute('aria-label', 'Field Training');
  cardEl.setAttribute('tabindex', '-1');
  cardEl.style.cssText = 'background:rgba(10,16,30,0.96);box-shadow:0 10px 34px rgba(0,0,0,0.55);position:fixed;left:50%;transform:translateX(-50%);' +
    'bottom:calc(var(--safe-bottom,0px) + var(--dock-h,44px) + 40px);' +   /* measured dock + its 12px inset + 28px clearance */
    'width:min(440px,calc(100vw - var(--safe-left,0px) - var(--safe-right,0px) - 16px));box-sizing:border-box;' +
    'max-height:calc(100dvh - var(--safe-top,0px) - var(--safe-bottom,0px) - var(--dock-h,44px) - 56px);overflow:auto;' +
    'z-index:30;border-radius:14px;padding:14px 16px;color:var(--ink,#dbe7f8);font:inherit;line-height:1.55';
  document.body.appendChild(cardEl);
  spotEl = document.createElement('div');
  spotEl.id = 'tutspot';
  spotEl.style.cssText = 'position:fixed;border:2px solid #ffd9a0;border-radius:12px;pointer-events:none;' +
    'z-index:29;box-shadow:0 0 0 4000px rgba(3,5,10,0.25);display:none;transition:all 0.25s';
  document.body.appendChild(spotEl);
  announceEl = document.createElement('div');
  announceEl.id = 'tutlive';
  announceEl.className = 'sr-only';
  announceEl.setAttribute('role', 'status');
  announceEl.setAttribute('aria-live', 'polite');
  announceEl.setAttribute('aria-atomic', 'true');
  document.body.appendChild(announceEl);
  document.body.classList.add('training');
  document.addEventListener('keydown', guardTrainingKeydown, true);
  document.addEventListener('focusin', guardTrainingFocus, true);
  document.addEventListener('pointerdown', guardTrainingPointer, true);
  finishing = false;
  stepIdx = 0;
  renderStep();
  spotTimer = window.setInterval(placeSpot, 300);   /* the spotlight follows layout changes */
}

export function trainingActive(): boolean { return stepIdx >= 0 && stepIdx < steps.length; }
export function trainingStepId(): string | null { return trainingActive() ? steps[stepIdx]!.id : null; }

function renderStep(): void {
  if (!cardEl || !deps0) return;
  if (stepIdx >= steps.length) return;
  const st = steps[stepIdx]!;
  cardEl.innerHTML =
    `<div id="tutstephead" style="color:var(--faint,#8fa3c4);font-size:.85em;letter-spacing:0.06em;margin-bottom:4px">FIELD TRAINING · ${stepIdx + 1} / ${steps.length}</div>` +
    `<div id="tutsteptext" data-sel="tuttext">${st.text()}</div>` +
    '<div style="display:flex;gap:10px;align-items:center;margin-top:10px">' +
    (st.btn ? `<button data-sel="tutbtn" style="background:#1d3a5e;color:var(--ink,#eaf2ff);border:1px solid #caa24f;border-radius:9px;padding:9px 16px;cursor:pointer;min-height:44px;font:inherit">${esc(st.btn)}</button>` : '') +
    '<button data-sel="tutskip" style="background:none;border:0;color:var(--dim,#7f96ba);cursor:pointer;font:inherit;font-size:.9em;text-decoration:underline;min-height:44px">Skip training — you lose nothing, and Settings can restart it</button>' +
    '</div>' +
    '<div data-sel="tutstatus" role="status" aria-live="polite" hidden style="color:var(--dim,#7f96ba);font-size:.9em;margin-top:8px"></div>';
  cardEl.scrollTop = 0;
  cardEl.setAttribute('aria-labelledby', 'tutstephead');
  cardEl.setAttribute('aria-describedby', 'tutsteptext');
  cardEl.querySelector('[data-sel=tutbtn]')?.addEventListener('click', () => advance());
  cardEl.querySelector('[data-sel=tutskip]')!.addEventListener('click', () => { void finish('skip'); });
  applyAllow(st);
  if (st.id === 'land') {
    /* `atlas-open` advances from inside the panel's onOpen callback. Close on
       the next turn, after openPanel has finished displaying Atlas, so the
       inert chart cannot survive over the Earth Land action or later tour. */
    window.setTimeout(() => {
      if (trainingActive() && steps[stepIdx] === st) deps0?.closePanels();
    }, 0);
  }
  placeSpot();
  queueLessonFocus(st);
  queueLessonAnnouncement(st);
  /* CF1805-01: publish where the card TOP sits, so raisable surfaces clear it */
  document.documentElement.style.setProperty('--tut-bot', Math.round(cardEl.getBoundingClientRect().top) + 'px');
}
function lessonSpotTargets(st: TutStep): HTMLElement[] {
  if (!st.spot) return [];
  try { return [...document.querySelectorAll<HTMLElement>(st.spot)]; }
  catch { return []; }
}
function lessonSpotTarget(st: TutStep): HTMLElement | null {
  const targets = lessonSpotTargets(st);
  return targets.find((target) => target.offsetParent !== null) ?? targets[0] ?? null;
}
function placeSpot(): void {
  if (!spotEl || !trainingActive()) return;
  const st = steps[stepIdx]!;
  const t = lessonSpotTarget(st);
  if (!t || t.offsetParent === null) { spotEl.style.display = 'none'; return; }
  const r = t.getBoundingClientRect();
  spotEl.style.display = 'block';
  spotEl.style.left = (r.left - 6) + 'px';
  spotEl.style.top = (r.top - 6) + 'px';
  spotEl.style.width = (r.width + 12) + 'px';
  spotEl.style.height = (r.height + 12) + 'px';
}
function applyAllow(st: TutStep): void {
  /* Training is a two-part keyboard scope: its own card plus the current
     lesson surface. Pointer blocking alone left every forbidden control in
     the Tab order, so disallowed roots now become natively inert. When an
     allowed control lives inside a shared rail/dock, only its siblings are
     inert; this keeps the desktop Atlas button as real as the phone one. */
  restoreLocks();
  const allow = st.allow || [];
  allowedRoots = [];
  for (const sel of allow) {
    if (sel === '#cosmos') {
      const canvas = document.querySelector('canvas') as HTMLElement | null;
      if (canvas) allowedRoots.push(canvas);
      continue;
    }
    for (const node of document.querySelectorAll<HTMLElement>(sel)) allowedRoots.push(node);
  }
  allowedRoots = [...new Set(allowedRoots)];

  for (const sel of CHROME) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) continue;
    const rootAllowed = allowedRoots.some((root) => root === el || root.contains(el));
    const hasAllowedDescendant = allowedRoots.some((root) => el.contains(root));
    if (rootAllowed) continue;
    if (!hasAllowedDescendant) {
      lockElement(el, 0.45);
      continue;
    }
    /* A shared container (dock/rail) cannot itself be inert when one of its
       children is today's control. Lock every other keyboard control. */
    for (const control of el.querySelectorAll<HTMLElement>(FOCUSABLE)) {
      if (!allowedRoots.some((root) => root === control || root.contains(control) || control.contains(root))) {
        lockElement(control, 0.35);
      }
    }
  }
  const canvas = document.querySelector('canvas') as HTMLElement | null;
  if (canvas && !allowedRoots.includes(canvas)) lockElement(canvas, 1);
}
function clearAllow(): void {
  restoreLocks();
  allowedRoots = [];
}
/** Rebind the current lesson after its owning surface replaces DOM nodes.
 * Survey legitimately rebuilds its action row after reopen, chart, and Land;
 * stale node identities must not turn those fresh controls into an escape
 * from the lesson's pointer and keyboard scope. */
export function refreshTrainingScope(): boolean {
  if (!trainingActive() || finishing) return false;
  const st = steps[stepIdx]!;
  const active = document.activeElement instanceof HTMLElement
    ? document.activeElement : null;
  const activeWasOwned = active !== null && active.isConnected
    && inTrainingScope(active);
  applyAllow(st);
  placeSpot();
  if (!activeWasOwned || active === null || !active.isConnected
    || !inTrainingScope(active)) queueLessonFocus(st);
  return true;
}
function lockElement(el: HTMLElement, opacity: number): void {
  if (!locked.has(el)) {
    locked.set(el, {
      inert: el.hasAttribute('inert'),
      pointerEvents: el.style.pointerEvents,
      opacity: el.style.opacity,
    });
  }
  el.setAttribute('inert', '');
  el.style.pointerEvents = 'none';
  if (opacity < 1) el.style.opacity = String(opacity);
}
function restoreLocks(): void {
  for (const [el, state] of locked) {
    if (!state.inert) el.removeAttribute('inert');
    el.style.pointerEvents = state.pointerEvents;
    el.style.opacity = state.opacity;
  }
  locked.clear();
}
function visible(el: HTMLElement): boolean {
  if (!el.isConnected || el.closest('[inert]')) return false;
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}
function focusablesWithin(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  if (root.matches(FOCUSABLE)) out.push(root);
  out.push(...root.querySelectorAll<HTMLElement>(FOCUSABLE));
  return out.filter(visible);
}
function trainingFocusables(): HTMLElement[] {
  const out: HTMLElement[] = [];
  if (cardEl) out.push(...focusablesWithin(cardEl));
  for (const root of allowedRoots) out.push(...focusablesWithin(root));
  return [...new Set(out)];
}
function inTrainingScope(el: HTMLElement): boolean {
  return !!cardEl?.contains(el) || allowedRoots.some((root) => root === el || root.contains(el));
}
function focusWithoutScroll(el: HTMLElement | null): boolean {
  if (!el || !visible(el)) return false;
  try { el.focus({ preventScroll: true }); } catch { el.focus(); }
  /* The lesson itself may scroll on short landscape screens. Keep the page
     fixed, but reveal the newly focused lesson action inside that bounded
     card; preventScroll alone can focus a completely clipped button. */
  if (cardEl?.contains(el)) {
    const er = el.getBoundingClientRect(), cr = cardEl.getBoundingClientRect();
    if (er.top < cr.top || er.bottom > cr.bottom) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  return document.activeElement === el;
}
function preferredLessonFocus(st: TutStep): HTMLElement | null {
  const primary = cardEl?.querySelector<HTMLElement>('[data-sel="tutbtn"]');
  if (primary && visible(primary)) return primary;
  for (const spot of lessonSpotTargets(st)) {
    if (spot) {
      const target = focusablesWithin(spot)[0];
      if (target) return target;
    }
  }
  for (const root of allowedRoots) {
    const target = focusablesWithin(root)[0];
    if (target) return target;
  }
  return cardEl?.querySelector<HTMLElement>('[data-sel="tutskip"]') || cardEl;
}
function queueLessonFocus(st: TutStep): void {
  clearTimeout(focusTimer);
  /* Let the game-event caller finish its own DOM choreography first. This
     matters when Atlas onOpen advances the lesson before the panel manager
     seats and focuses its close button. The lesson wins on the same turn. */
  focusTimer = window.setTimeout(() => {
    if (!trainingActive() || steps[stepIdx] !== st) return;
    focusWithoutScroll(preferredLessonFocus(st));
  }, 0);
}
function queueLessonAnnouncement(st: TutStep): void {
  clearTimeout(announceTimer);
  const lessonText = cardEl?.querySelector<HTMLElement>('[data-sel="tuttext"]')?.textContent?.trim() || '';
  announceTimer = window.setTimeout(() => {
    if (!announceEl || !trainingActive() || steps[stepIdx] !== st) return;
    announceEl.textContent = `Field Training, step ${stepIdx + 1} of ${steps.length}. ${lessonText}`;
  }, 0);
}
function retainLessonSurface(st: TutStep): void {
  /* Survey lessons are authoritative over their card. Escape is captured
     before the global card-close/ascent handler, so this is normally only a
     retention check. If another same-turn action hid the card, ask its
     existing dock event to reopen the last valid survey instead of mutating
     card state here and bypassing main.ts's navigation guards. */
  const survey = document.querySelector<HTMLElement>('#survey');
  if (st.id === 'find-earth') {
    /* A wrong-world survey is a valid exploration outcome, but it must not
       become a modal dead end. Invoke the card's one real Close owner; its
       delegated handler preserves Sol and returns focus to the canvas. */
    const close = survey?.querySelector<HTMLElement>('[data-survey-close]');
    if (survey && close && visible(survey)
      && survey.getAttribute('aria-hidden') !== 'true' && visible(close)) close.click();
    return;
  }
  if (st.id !== 'survey-tour' && st.id !== 'atlas-add' && st.id !== 'land') return;
  if (survey && visible(survey) && survey.getAttribute('aria-hidden') !== 'true') return;
  document.getElementById('docksurvey')?.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  }));
}
function guardTrainingKeydown(event: KeyboardEvent): void {
  if (!trainingActive()) return;
  const st = steps[stepIdx]!;
  if (event.key === 'Escape') {
    /* Training owns Escape while a lesson is active. Letting the global
       handler close the required survey or ascend strands the lesson while
       its event target is no longer reachable. Capture and consume the key
       completely, retain the required lesson surface, then restore the
       lesson's preferred keyboard target after this event turn. */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    retainLessonSurface(st);
    queueLessonFocus(st);
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = trainingFocusables();
  if (!focusable.length) {
    event.preventDefault();
    focusWithoutScroll(cardEl);
    return;
  }
  const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const at = current ? focusable.indexOf(current) : -1;
  if (at < 0 || (!event.shiftKey && at === focusable.length - 1) || (event.shiftKey && at === 0)) {
    event.preventDefault();
    focusWithoutScroll(event.shiftKey ? focusable[focusable.length - 1]! : focusable[0]!);
  }
}
function guardTrainingFocus(event: FocusEvent): void {
  if (!trainingActive() || redirectingFocus || !(event.target instanceof HTMLElement) || inTrainingScope(event.target)) return;
  redirectingFocus = true;
  focusWithoutScroll(preferredLessonFocus(steps[stepIdx]!));
  redirectingFocus = false;
}
function guardTrainingPointer(event: PointerEvent): void {
  if (!trainingActive() || !(event.target instanceof HTMLElement) || inTrainingScope(event.target)) return;
  /* Native inert correctly suppresses activation, but a pointer press on an
     inert surface can still blur the lesson action to <body> without firing
     focusin. Consume that press and restore the current logical lesson
     focus so the next keyboard action remains deterministic. */
  event.preventDefault();
  event.stopPropagation();
  focusWithoutScroll(preferredLessonFocus(steps[stepIdx]!));
}
function restoreFocusAfterTraining(): void {
  const prior = focusBeforeTraining;
  focusBeforeTraining = null;
  if (focusWithoutScroll(prior)) return;
  const surveyAction = document.querySelector<HTMLElement>('#survey button:not([disabled])');
  if (focusWithoutScroll(surveyAction)) return;
  focusWithoutScroll(document.querySelector('canvas') as HTMLElement | null);
}
function advance(): void {
  if (finishing || !trainingActive()) return;
  if (stepIdx === steps.length - 1) {
    void finish('finish');
    return;
  }
  const completed = steps[stepIdx]!;
  if (completed.closePanelsAfter) deps0?.closePanels();
  stepIdx++;
  renderStep();
}
function completionStatus(): HTMLElement | null {
  return cardEl?.querySelector<HTMLElement>('[data-sel="tutstatus"]') || null;
}
function setCompletionBusy(busy: boolean): void {
  if (!cardEl) return;
  if (busy) cardEl.setAttribute('aria-busy', 'true');
  else cardEl.removeAttribute('aria-busy');
  for (const button of cardEl.querySelectorAll<HTMLButtonElement>('button')) button.disabled = busy;
  const status = completionStatus();
  if (!status || !busy) return;
  status.hidden = false;
  status.textContent = 'Securing your expedition before Field Training closes…';
}
function refusalMessage(reason: Extract<TrainingEndResult, { kind: 'refused' }>['reason']): string {
  if (reason === 'unknown-snapshot') {
    return 'This saved Training checkpoint is not recognized. Nothing changed; keep this lesson open and retry after updating.';
  }
  if (reason === 'busy') {
    return 'Another save replacement is still underway. Nothing changed; wait for it to finish, then retry.';
  }
  if (reason === 'protected-storage') {
    return 'This expedition’s storage is protected. Nothing changed; recover the save, then retry.';
  }
  return 'The expedition could not be saved. Nothing changed; retry when storage is available.';
}
function restoreAfterRefusal(
  st: TutStep,
  focusTarget: HTMLElement | null,
  reason: Extract<TrainingEndResult, { kind: 'refused' }>['reason'],
): void {
  finishing = false;
  setCompletionBusy(false);
  const status = completionStatus();
  if (status) {
    status.hidden = false;
    status.textContent = refusalMessage(reason);
  }
  applyAllow(st);
  if (!focusWithoutScroll(focusTarget)) focusWithoutScroll(preferredLessonFocus(st));
}
function teardownTraining(): void {
  stepIdx = steps.length;
  finishing = false;
  clearTimeout(focusTimer);
  clearTimeout(announceTimer);
  document.removeEventListener('keydown', guardTrainingKeydown, true);
  document.removeEventListener('focusin', guardTrainingFocus, true);
  document.removeEventListener('pointerdown', guardTrainingPointer, true);
  clearAllow();
  cardEl?.remove(); cardEl = null;
  spotEl?.remove(); spotEl = null;
  announceEl?.remove(); announceEl = null;
  clearInterval(spotTimer);
  document.body.classList.remove('training');
  document.documentElement.style.removeProperty('--tut-bot');
  deps0?.closePanels();
  window.setTimeout(restoreFocusAfterTraining, 0);
}
async function finish(intent: TrainingEndIntent): Promise<void> {
  if (finishing || !trainingActive() || !deps0) return;
  finishing = true;
  const completingDeps = deps0;
  const completingStep = steps[stepIdx]!;
  const focusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  clearTimeout(focusTimer);
  setCompletionBusy(true);
  /* A live lesson may deliberately allow the canvas or one piece of chrome.
     Persistence owns the whole expedition while completion is pending, so
     even that lesson affordance must become inert until commit or refusal. */
  applyAllow({ id: 'completion-pending', text: () => '' });

  let result: TrainingEndResult;
  try {
    result = await completingDeps.complete(intent);
  } catch {
    result = { kind: 'refused', reason: 'write-failed' };
  }

  /* Completion is owned by the exact live Training instance and step that
     requested it. A future restart must never receive this promise's late
     UI outcome. */
  if (deps0 !== completingDeps || !trainingActive() || steps[stepIdx] !== completingStep) return;
  if (result.kind === 'completed' || (result.kind === 'deferred' && result.reason === 'source-error')) {
    teardownTraining();
    return;
  }
  if (result.kind === 'refused') {
    restoreAfterRefusal(completingStep, focusTarget, result.reason);
    return;
  }
  restoreAfterRefusal(completingStep, focusTarget, 'write-failed');
}

/** the live-play event bus — training listens to the SAME events the game emits */
export function gameEvent(type: string, detail: Record<string, unknown>): void {
  if (!trainingActive() || finishing) return;
  const st = steps[stepIdx]!;
  if (st.when && st.when(type, detail)) advance();
}
