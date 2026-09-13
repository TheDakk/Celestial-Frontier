/* Finite battle blocking over an already-committed Chronicle. This owner never
 * simulates combat, changes HP/rewards, owns a replay clock, or deforms art.
 * Whole-portrait attack/reaction translation is not anatomical animation. */
import { isCombatSettlementPlanV1, type CombatSettlementPlanV1 } from '@cf/domain-combatcore';
import { isCombatCuePlanV1, type CombatCuePlanV1, type CombatCueSide } from '@cf/audio';
import { isCombatChronicleV1, type CombatChronicleV1, type CombatChronicleCueEmissionV1,
  type CombatChronicleStopReasonV1 } from './combat-chronicle.js';
import { bindSpeciesThumb, SpeciesThumbLeaseGroup, type SpeciesArtLoader } from './species-art-loader.js';
import { resolveVisualEffectPolicyV1, type VisualEffectPolicyInputV1 } from './visual-effect-policy.js';
import { COMBAT_BATTLE_SCENE_CSS } from './combat-battle-scene-style.js';

export const COMBAT_BATTLE_MOTION_MS = 200 as const;
export interface CombatBattleSceneStart {
  readonly mount: HTMLElement;
  readonly settlement: CombatSettlementPlanV1;
  readonly chronicle: CombatChronicleV1;
  readonly cuePlan: CombatCuePlanV1;
  readonly generation: number;
}

export class CombatBattleSceneController {
  readonly #root: HTMLElement;
  readonly #art: SpeciesArtLoader;
  readonly #counterpartIsCurrent: (receipt: CombatChronicleCueEmissionV1['counterpart']) => boolean;
  readonly #leases = new SpeciesThumbLeaseGroup(2);
  readonly #animations = new Set<Animation>();
  readonly #figures = new Map<CombatCueSide, HTMLElement>();
  readonly #observer: MutationObserver;
  readonly #style: HTMLStyleElement;
  #scene: HTMLElement | null = null;
  #caption: HTMLElement | null = null;
  #input: CombatBattleSceneStart | null = null;
  #policy: VisualEffectPolicyInputV1 = { effectsOn: false, motion: 'reduced', deviceTier: 'low' };
  #lastOrdinal = -1;
  #stopped = false;
  #disposed = false;

  constructor(options: Readonly<{
    root: HTMLElement;
    artLoader: SpeciesArtLoader;
    counterpartIsCurrent: (receipt: CombatChronicleCueEmissionV1['counterpart']) => boolean;
  }>) {
    this.#root = options.root;
    this.#art = options.artLoader;
    this.#counterpartIsCurrent = options.counterpartIsCurrent;
    const document = this.#root.ownerDocument;
    this.#style = document.createElement('style');
    this.#style.dataset.combatBattleStyle = '';
    this.#style.textContent = COMBAT_BATTLE_SCENE_CSS;
    document.head.append(this.#style);
    this.#observer = new document.defaultView!.MutationObserver(() => {
      if (this.#scene && !this.#visible()) this.stop('hidden');
      else if (!this.#allowsMotion()) this.#cancelMotion();
    });
    this.#observer.observe(this.#root, { attributes: true, attributeFilter: ['hidden', 'inert', 'aria-hidden', 'style', 'class'] });
    this.#observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', this.#visibility);
  }

  setPolicy(policy: VisualEffectPolicyInputV1): void {
    this.#assertLive();
    this.#policy = resolveVisualEffectPolicyV1(policy).input;
    if (!this.#allowsMotion()) this.#cancelMotion();
  }

  start(input: CombatBattleSceneStart): void {
    this.#assertLive();
    if (!isCombatSettlementPlanV1(input.settlement) || !isCombatChronicleV1(input.chronicle)
      || !isCombatCuePlanV1(input.cuePlan)
      || input.chronicle.battleId !== input.settlement.battleId || input.cuePlan.battleId !== input.settlement.battleId
      || input.chronicle.transcriptFingerprint !== input.settlement.transcriptFingerprint
      || input.cuePlan.transcriptFingerprint !== input.settlement.transcriptFingerprint
      || !Number.isSafeInteger(input.generation) || input.generation < 1
      || !this.#root.contains(input.mount) || !input.mount.isConnected
      || input.mount.dataset.combatChronicleGeneration !== String(input.generation)
      || !input.mount.querySelector('[data-combat-chronicle-log]')) {
      throw new TypeError('battle scene requires the current registered settlement, Chronicle and cue plan');
    }
    this.stop('replace');
    this.#input = input;
    this.#lastOrdinal = -1;
    this.#stopped = false;
    const document = this.#root.ownerDocument, scene = document.createElement('section');
    scene.dataset.combatBattleScene = 'true';
    scene.dataset.battleId = input.settlement.battleId;
    scene.dataset.battleGeneration = String(input.generation);
    scene.setAttribute('aria-label', 'Battle scene');
    const stage = document.createElement('div'); stage.dataset.battleStage = 'true';
    scene.append(stage);
    const participants = [
      { side: 'A' as const, name: input.chronicle.championName,
        genome: input.settlement.champion.kind === 'owned-fauna' ? input.settlement.champion.genome : null },
      { side: 'B' as const, name: input.chronicle.defenderName, genome: input.settlement.encounter.defender.battleGenome },
    ];
    for (const participant of participants) {
      const figure = document.createElement('figure'), actor = document.createElement('div'), label = document.createElement('figcaption');
      figure.dataset.battleSide = participant.side;
      actor.dataset.battleActor = participant.side;
      actor.style.setProperty('--battle-direction', participant.side === 'A' ? '1' : '-1');
      label.textContent = participant.name;
      if (participant.genome) {
        const image = document.createElement('img'); image.width = 132; image.height = 132;
        image.dataset.battlePortrait = participant.side; actor.append(image);
      } else {
        const nameplate = document.createElement('span'); nameplate.dataset.battlePlayerNameplate = 'true';
        nameplate.textContent = participant.name; actor.append(nameplate);
      }
      figure.append(actor, label); stage.append(figure); this.#figures.set(participant.side, actor);
    }
    const caption = document.createElement('p'); caption.dataset.battleCue = 'ready';
    // The existing Chronicle log owns the accessible announcement.
    caption.setAttribute('aria-hidden', 'true');
    caption.textContent = `${input.chronicle.championName} versus ${input.chronicle.defenderName}`;
    scene.append(caption); input.mount.prepend(scene); this.#scene = scene; this.#caption = caption;
    if (!this.#visible()) { this.stop('hidden'); return; }
    for (const participant of participants) {
      if (!participant.genome) continue;
      const image = scene.querySelector<HTMLImageElement>(`[data-battle-portrait="${participant.side}"]`)!;
      this.#leases.add(bindSpeciesThumb(this.#art, { image, genome: participant.genome as Record<string, unknown>,
        owner: `battle:${input.generation}:${participant.side}`,
        isCurrent: () => this.#input === input && this.#scene === scene && this.#visible() }));
    }
  }

  presentCue(emission: CombatChronicleCueEmissionV1): boolean {
    if (this.#disposed || this.#stopped || !this.#input || !this.#scene || !this.#caption) return false;
    if (!this.#visible()) { this.stop('hidden'); return false; }
    const input = this.#input, cue = emission.cue;
    if (emission.plan !== input.cuePlan || !input.cuePlan.cues.includes(cue)
      || emission.counterpart.generation !== input.generation
      || emission.counterpart.eventKey !== cue.cueId
      || !cue.counterparts.some(part => part.captionToken === emission.counterpart.counterpartKey)
      || !this.#counterpartIsCurrent(emission.counterpart) || cue.ordinal <= this.#lastOrdinal) return false;
    this.#lastOrdinal = cue.ordinal;
    const step = cue.transcriptIndex === null ? null : input.chronicle.steps.find(row => row.transcriptIndex === cue.transcriptIndex);
    const kind = cue.families.includes('damage') ? 'damage' : cue.families.includes('dodge') ? 'dodge'
      : cue.families.includes('stun-skipped') ? 'stun' : cue.stage === 'resolution' ? 'result'
        : cue.families.includes('burn') || cue.families.includes('regen') ? 'tick' : null;
    if (kind === null) return false;
    const row = step?.rows.find(entry => entry.kind === kind);
    if (kind !== 'result' && !row) return false;
    this.#cancelMotion();
    this.#caption.dataset.battleCue = kind;
    this.#caption.textContent = kind === 'result' ? input.chronicle.resultText : row!.displayText;
    this.#scene.dataset.battleCueId = cue.cueId;
    if (cue.transcriptIndex !== null) this.#scene.dataset.battleTranscriptIndex = String(cue.transcriptIndex);
    // Static cue labels remain visible with Effects Off or reduced motion.
    if (cue.actorSide) this.#figures.get(cue.actorSide)!.dataset.battleAction = kind === 'stun' ? 'staggered' : 'acting';
    if (cue.targetSide && (kind === 'damage' || kind === 'dodge'))
      this.#figures.get(cue.targetSide)!.dataset.battleAction = kind === 'damage' ? 'hit' : 'evades';
    if (!this.#allowsMotion()) return true;
    if (kind === 'damage' || kind === 'dodge') {
      this.#move(cue.actorSide, 'attack');
      this.#move(cue.targetSide, kind === 'damage' ? 'recoil' : 'dodge');
    } else if (kind === 'stun') this.#move(cue.actorSide, 'stun');
    return true;
  }

  stop(reason: CombatChronicleStopReasonV1 = 'close'): void {
    this.#cancelMotion();
    this.#stopped = true;
    if (reason === 'skip' && this.#scene && this.#input) {
      if (this.#caption) { this.#caption.dataset.battleCue = 'result'; this.#caption.textContent = this.#input.chronicle.resultText; }
      return; // A visible skipped result retains its two static portrait leases.
    }
    this.#leases.clear();
    this.#scene?.remove(); this.#scene = null; this.#caption = null; this.#input = null;
    this.#figures.clear();
  }

  dispose(): void {
    if (this.#disposed) return;
    this.stop('dispose'); this.#observer.disconnect(); this.#style.remove();
    this.#root.ownerDocument.removeEventListener('visibilitychange', this.#visibility);
    this.#disposed = true;
  }

  readonly #visibility = (): void => { if (this.#root.ownerDocument.hidden) this.stop('hidden'); };
  #visible(): boolean {
    if (!this.#scene?.isConnected || !this.#root.contains(this.#scene) || this.#root.ownerDocument.hidden) return false;
    const view = this.#root.ownerDocument.defaultView!;
    for (let node: HTMLElement | null = this.#scene; node; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      if (node.hidden || node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true'
        || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') <= 0) return false;
    }
    return true;
  }
  #allowsMotion(): boolean {
    // Two finite compositor translations have no particle/bloom allocation.
    // Touch is tier low in Main, so use its resolved motion preference rather
    // than the optional-particle tier, just like the existing pilot accent.
    const policy = resolveVisualEffectPolicyV1(this.#policy).input;
    return policy.effectsOn && policy.motion === 'full'
      && !this.#root.ownerDocument.body.classList.contains('motion-reduced');
  }
  #move(side: CombatCueSide | null, action: 'attack' | 'recoil' | 'dodge' | 'stun'): void {
    const actor = side ? this.#figures.get(side) : null;
    if (!actor || typeof actor.animate !== 'function') return;
    const direction = side === 'A' ? 1 : -1;
    const frames: Keyframe[] = action === 'attack'
      ? [{ transform: 'translate(0,0)' }, { transform: `translate(${direction * 12}px,-2px)`, offset: 0.45 }, { transform: 'translate(0,0)' }]
      : action === 'recoil' ? [{ transform: 'translate(0,0)' }, { transform: `translate(${direction * -7}px,2px)`, offset: 0.35 }, { transform: 'translate(0,0)' }]
        : action === 'dodge' ? [{ transform: 'translate(0,0)' }, { transform: `translate(${direction * -8}px,-8px)`, offset: 0.5 }, { transform: 'translate(0,0)' }]
          : [{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,0)' }, { transform: 'translate(3px,0)' }, { transform: 'translate(0,0)' }];
    try {
      const animation = actor.animate(frames, { duration: COMBAT_BATTLE_MOTION_MS, easing: 'ease-out', iterations: 1 });
      this.#animations.add(animation);
      animation.onfinish = () => { this.#animations.delete(animation); try { animation.cancel(); } catch { /* Static cue remains. */ } };
    } catch { /* Optional compositor failure cannot interrupt Chronicle HP/text. */ }
  }
  #cancelMotion(): void {
    for (const animation of this.#animations) { animation.onfinish = null; try { animation.cancel(); } catch { /* Never interrupt native Close. */ } }
    this.#animations.clear();
    for (const actor of this.#figures.values()) delete actor.dataset.battleAction;
  }
  #assertLive(): void { if (this.#disposed) throw new Error('battle scene is disposed'); }
}
