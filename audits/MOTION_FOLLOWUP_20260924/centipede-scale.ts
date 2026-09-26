import {writeFileSync} from 'node:fs';
/** The painted LIBRARY in the arena (2026-09-24, Nick: "I really want to get this going"): every archetype that ships a
 * card also FIGHTS — its real paint-skin rig, loaded exactly as the study loads it, plays seeded turns on the real stage
 * at 30 Hz as ATTACKER (with its own compiled anatomy attack in its own medium) and as TARGET: zero rig refusals, no
 * exception reaches tick. The list is the card registry (one source), so a new archetype is tested the day it ships. */
import { readFileSync } from 'node:fs';
import { compileAnatomyAttack } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/anatomy-attacks.js';
import { resolvePhysicalHabitat } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle-habitat.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/effects/anchors.js';
import type { EffectTextureLike } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/effects/pixi-adapter.js';
import { CARD_ARCHETYPES } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/morph/card-archetypes.js';
import { COMBATANT_WIDTH_FRACTION_MAX, composeArena } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/arena.js';
import { BAND_FILL, defaultArenaWorld, selectHabitatArena } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/habitat-arena.js';
import type { ArenaWorld } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle-habitat.js';
import type { TurnAttack, TurnPlanInput } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/choreography.js';
import { createPortraitRig } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/fixture-rig.js';
import { REPO_ROOT, loadFitDir } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/parts-rig.fixtures.js';
import { BattleStage, SHORE_FADE, WATER_BANDS, combatantPresentation, standCentreShift, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from '/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src/battle2/stage.js';

class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; text = ''; readonly scale = { set: () => {} }; readonly anchor = { set: () => {} }; rects: [number, number, number, number][] = []; fills: number[] = [];
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() { this.rects = []; this.fills = []; } rect(x: number, y: number, w: number, h: number) { this.rects.push([x, y, w, h]); } fill(st: { color: number }) { this.fills.push(st.color); } destroy() { this.destroyed = true; } }
const factory: BattleStageFactory = { container: () => new Node(), sprite: (): StageSpriteLike => new Node(), text: (t): StageTextLike => { const n = new Node(); n.text = t; return n; }, graphics: (): StageGraphicsLike => new Node() };
const rigFactory = { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:platypus', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 }, factory: rigFactory });
const FRAME = { width: 1024, height: 576 }, TEX: EffectTextureLike = { width: 1672, height: 941 };
const layout = composeArena({ id: 'library', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const ctx = (me: 'A' | 'B', name: string, mass: number, card: TurnOutcomeContext['A']['card'], attackFor: TurnOutcomeContext['attackFor'] | undefined, seed: number): TurnOutcomeContext => {
  const mine = { side: me, name, mass, card, theme: 'wild', seed: 1 } as const, other = { side: me === 'A' ? 'B' : 'A', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 2 } as const;
  return { A: (me === 'A' ? mine : other) as TurnOutcomeContext['A'], B: (me === 'B' ? mine : other) as TurnOutcomeContext['B'], arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300, ...(attackFor ? { attackFor } : {}) };
};
const turn = (c: TurnOutcomeContext, row: Record<string, unknown>, i: number): TurnPlanInput => { const t = turnPlanInputFromTranscriptEvent(row, c, i); if (t.kind !== 'turn') throw new Error(t.reason); return t.input; };
const fitDirOf = (shippedDir: string): string => (JSON.parse(readFileSync(new URL(shippedDir + 'SOURCE.json', REPO_ROOT), 'utf8')) as { fitDir: string }).fitDir;

    const found: string[] = [], lines: string[] = [], observations:any[]=[];
    for (const a of CARD_ARCHETYPES.filter(a=>a.earthName==='Centipede')) for (const k of [0.85, 1, 1.15]) {
      const { rig, card } = await loadFitDir(fitDirOf(a.dir),undefined,process.argv[3]==='observed'?'observed':undefined), mass = card.massClass.multiplier, medium = resolvePhysicalHabitat((await loadFitDir(fitDirOf(a.dir),undefined,process.argv[3]==='observed'?'observed':undefined)).record as never).preferred;
      const base = combatantPresentation(rig, mass, FRAME, layout.stands.left.y).scale;
      const row:any={scale:k,firstRefusal:null};observations.push(row);const originalApply=rig.applyPose.bind(rig);rig.applyPose=(pose,context)=>{const prior=rig.refusals();originalApply(pose,context);if(rig.refusals()>prior&&!row.firstRefusal)row.firstRefusal={pose,context,error:rig.lastRefusal()};};
      const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; try { const r = compileAnatomyAttack(card, medium, ordinal); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; } catch { return null; } };
      let now = 0; const stage = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: mass, right: 0.85 }, presentationScales: { left: base * k, right: combatantPresentation(portraitRig(), 0.85, FRAME, layout.stands.right.y).scale } });
      const bout = [{ side: 'A', an: a.earthName, dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, { side: 'B', an: 'Platypus', dn: a.earthName, dmg: 4, crit: true, hpA: 26, hpB: 20 }, { an: a.earthName, dn: 'Platypus', dodge: true }, { side: 'A', an: a.earthName, dn: 'Platypus', dmg: 20, crit: true, hpA: 26, hpB: 0 }];
      for (const [i, r] of bout.entries()) { now = 0; const plan = stage.play(turn(ctx('A', a.earthName, mass, card, attackFor, (0xC33 + i * 7919) >>> 0), r, i)); for (let ms = 0; ms < plan.beats.end; ms += 1000 / 30) { now = ms; stage.tick(); } now = plan.beats.end; if (!stage.tick()?.done) throw new Error('turn never reached its end'); }
      const n = rig.refusals(); if (n) found.push(`${a.earthName} ×${k}: ${n} (${(rig.lastRefusal() ?? '').slice(0, 90)})`); lines.push(`${a.earthName} ×${k}: ${n}`); stage.dispose();
    }
    writeFileSync(process.argv[2]!,JSON.stringify({scope:'Read-only Claude stage/fixture diagnostic; optional explicit local motion/contact overlay. Not integrated source certification.',found,lines,observations},null,2)+'\n');console.log(JSON.stringify({found,lines}));
