/* Motion Kit §4 action libraries for the A11 family templates. Same tunable
 * table style as actions.ts (degrees and body lengths; the timeline converts
 * to radians); each template's numbers sit in ONE object below. Phase times
 * come from timing.ts's tAt so mass scaling never moves a key. Plants get
 * sway / disturb / harvest / grow instead of the fauna set. */
import { type Ease, type KeyPose, type MotionAction, QUADRUPED_ACTIONS } from './actions.js';
import type { FamilyTemplateId } from './family-templates.js';
import {specializedActions} from './specialized-actions.js';
import {ADDITIONAL_ACTIONS} from './additional-actions.js';

import {appendageCounts} from '../../../../tools/creature-animation/repeated-anatomy.mjs';
import type {AnatomyPresence} from '../../../../tools/creature-animation/anatomy-inventory.mjs';
import { tAt } from './timing.js';

type J = Record<string, number>;
const P = (t: number, ease: Ease, joints: J, dx = 0, dy = 0): KeyPose => ({ t, ease, joints, root: { dx, dy } });
const REST: J = {};
const neg = (j: J, k = -1): J => Object.fromEntries(Object.entries(j).map(([n, v]) => [n, v * k]));
const mul = (j: J, k: number): J => neg(j, k);
const pair = (base: string, v: number, suffix = ''): J => ({ [base + 'Far' + suffix]: v, [base + 'Near' + suffix]: v });
const A = (id: string, family: string, poses: KeyPose[], loop = false): MotionAction => ({ id, family, loop, poses });

/* Generic phase-shaped builders (one per §4 verb); every template supplies only the joint dictionaries. */
const loop4 = (a: J, mid: J, b: J, dxA = 0, dyA = 0, dyMid = 0): KeyPose[] => [P(0.25, 'sine-in-out', a, dxA, dyA), P(0.5, 'sine-in-out', mid, 0, dyMid), P(0.75, 'sine-in-out', b, -dxA, dyA), P(1, 'sine-in-out', REST)];
const melee = (anticipation: J, launch: J, strike: J, recover: J, dx: readonly number[] = [-0.04, 0.36, 0.40, 0.10], dy: readonly number[] = [0.03, -0.05, -0.01, 0.01]): KeyPose[] => [
  P(tAt('melee', 'anticipation'), 'ease-in', anticipation, dx[0], dy[0]), P(tAt('melee', 'strike'), 'ease-out', launch, dx[1], dy[1]),
  P(tAt('melee', 'smear'), 'ease-out', strike, dx[2], dy[2]), P(tAt('melee', 'recovery', 0.55), 'back-out', recover, dx[3], dy[3]), P(1, 'ease-out', REST)];
const cast = (rise: J, hold: J, release: J, dy = -0.06): KeyPose[] => [P(tAt('cast', 'rise'), 'ease-in', rise, -0.02, dy), P(tAt('cast', 'hold'), 'sine-in-out', hold, -0.02, dy - 0.004), P(tAt('cast', 'release'), 'ease-out', release, 0.06, dy * 0.5), P(1, 'back-out', REST)];
const hit = (recoil: J, stagger: J, dy = 0.02): KeyPose[] => [P(tAt('hit', 'recoil'), 'ease-out', recoil, -0.08, dy), P(tAt('hit', 'stagger'), 'ease-out', stagger, -0.14, dy * 0.6), P(1, 'back-out', REST)];
const dodge = (out: J, dx = -0.25, dy = -0.04): KeyPose[] => [P(tAt('dodge', 'out'), 'ease-out', out, dx, dy), P(1, 'back-out', REST)];
const faint = (mid: J, end: J, dyMid = 0.10, dyEnd = 0.22): KeyPose[] => [P(0.45, 'ease-in', mid, 0, dyMid), P(1, 'ease-out', end, -0.02, dyEnd)];
const victory = (rear: J, toss: J, dy = -0.08): KeyPose[] => [P(tAt('victory', 'rear'), 'ease-out', rear, 0, dy), P(tAt('victory', 'toss'), 'back-out', toss, 0, dy - 0.004), P(1, 'back-out', REST)];
const tame = (approach: J, lower: J, end: J): KeyPose[] => [P(tAt('tame', 'approach'), 'ease-out', approach, 0.12, -0.008), P(tAt('tame', 'lower'), 'ease-out', lower, 0.12, 0.020), P(1, 'back-out', end, 0.12, 0.004)];
const feed = (down: J, open: J, closed: J): KeyPose[] => [P(tAt('feed', 'down'), 'ease-out', down, 0.02, 0.012), P(tAt('feed', 'chew', 0.5), 'sine-in-out', { ...down, ...open }, 0.02, 0.012),
  P(tAt('feed', 'chew'), 'sine-in-out', { ...down, ...closed }, 0.02, 0.012), P(tAt('feed', 'chew2', 0.5), 'sine-in-out', { ...down, ...open }, 0.02, 0.012), P(tAt('feed', 'chew2'), 'sine-in-out', { ...down, ...closed }, 0.02, 0.012), P(1, 'back-out', REST)];

interface FaunaSpec {
  readonly idle: readonly [J, J, J, number, number, number]; readonly alert: readonly [J, number];
  readonly approach: Readonly<Record<string, KeyPose[]>>; readonly melee: Readonly<Record<string, KeyPose[]>>;
  readonly cast: KeyPose[]; readonly hit: KeyPose[]; readonly dodge: KeyPose[]; readonly faint: KeyPose[]; readonly victory: KeyPose[]; readonly tame: KeyPose[]; readonly feed: KeyPose[];
}
const fauna = (s: FaunaSpec): Readonly<Record<string, MotionAction>> => Object.freeze(Object.fromEntries([
  A('idle', 'idle', loop4(s.idle[0], s.idle[1], s.idle[2], s.idle[3], s.idle[4], s.idle[5]), true), A('alert', 'alert', [P(1, 'back-out', s.alert[0], 0, s.alert[1])]),
  ...Object.entries(s.approach).map(([g, poses]) => A('approach:' + g, 'approach', poses)), ...Object.entries(s.melee).map(([w, poses]) => A('melee:' + w, 'melee', poses)),
  A('cast', 'cast', s.cast), A('hit', 'hit', s.hit), A('dodge', 'dodge', s.dodge), A('faint', 'faint', s.faint), A('victory', 'victory', s.victory), A('tame', 'tame', s.tame), A('feed', 'feed', s.feed),
].map((a) => [a.id, a])));

/* ---- hopper: frog/leaper on the quadruped inventory; the hind chain folds (Knee +, Ankle −) and fires (Knee −, Ankle +) ---- */
const hind = (knee: number, ankle: number, paw = 0): J => ({ ...pair('hind', knee, 'Knee'), ...pair('hind', ankle, 'Ankle'), ...pair('hind', paw, 'Paw') });
const fore = (knee: number, ankle = 0): J => ({ ...pair('fore', knee, 'Knee'), ...pair('fore', ankle, 'Ankle') });
const ears = (deg: number): J => pair('ear', deg, 'Tip');
const HOPPER = fauna({
  idle: [{ spine: -1, chest: -2, tail0: 3 }, { neck: -2, head: 1, ...ears(-2) }, { tail0: -3, spine: 1 }, 0.004, -0.003, -0.009],
  alert: [{ neck: -14, head: -10, spine: -4, ...ears(-22), ...hind(-10, 8) }, -0.006],
  approach: { hop: [P(0.3, 'ease-in', { ...hind(50, -60), ...fore(-20), spine: 10, head: 6, tail0: -8 }, 0, 0.050), P(0.55, 'ease-out', { ...hind(-70, 60, 20), ...fore(-35, 10), spine: -10, neck: -8, tail0: -14, root: -8 }, 0.30, -0.180),
    P(0.85, 'ease-in', { ...hind(30, -30), ...fore(30, -20), spine: 8, root: 6 }, 0.50, -0.020), P(1, 'back-out', { ...hind(20, -24), ...fore(-8), spine: 4 }, 0, 0.012)] },
  melee: { kick: melee({ ...hind(60, -70), ...fore(-15), spine: 10, head: 6 }, { ...hind(-90, 80), spine: -8, neck: -6, tail0: -10 }, { hindNearKnee: -105, hindNearAnkle: 95, hindNearPaw: 30, hindFarKnee: -80, hindFarAnkle: 70, root: 8, spine: -4 }, { ...hind(25, -30), spine: 4 }, [-0.06, 0.30, 0.34, 0.10], [0.04, -0.08, -0.03, 0.01]),
    bite: melee({ ...hind(45, -55), spine: 12, neck: 8, head: 10 }, { ...hind(-60, 55), spine: -6, neck: -10, head: -8, jaw: -12, tail0: -10 }, { ...hind(-50, 45), jaw: -28, head: 14, neck: 8, ...fore(-30) }, { ...hind(20, -25), head: 2 }) },
  cast: cast({ ...hind(35, -45), ...fore(-45, 16), pelvis: -5, spine: -18, chest: -15, neck: -12, tail0: 8 }, { ...hind(35, -45), ...fore(-48, 16), pelvis: -5, spine: -18, chest: -15, neck: -14, head: -5, ...ears(-8) }, { ...hind(20, -25), ...fore(-30, 8), spine: -10, neck: 10, head: 25, jaw: -15 }),
  hit: hit({ head: -20, neck: -12, spine: 6, chest: -6, pelvis: -4, jaw: -8, ...ears(12), tail0: 10 }, { head: -8, neck: -6, spine: 3, ...hind(-15, 18), ...fore(10), tail0: 6 }),
  dodge: dodge({ ...hind(-40, 40), ...fore(15), spine: -4, neck: -6 }, -0.30, -0.080),
  faint: faint({ ...hind(45, -55), ...fore(20, 20), spine: 10, head: 10, neck: 10 }, { ...hind(30, -20), ...fore(-25, 50), root: 12, spine: 8, neck: 22, head: 28, tail0: 20, tail1: 12, ...ears(16) }),
  victory: victory({ pelvis: -6, spine: -22, chest: -12, neck: -8, head: -15, jaw: -10, ...fore(-50, 14), ...hind(20, -10), tail0: -12 }, { pelvis: -6, spine: -22, chest: -12, neck: -12, head: -28, ...fore(-50, 14), ...hind(20, -10), tail0: -16, ...ears(-15) }),
  tame: tame({ head: -6, ...hind(15, -18), ...fore(-10) }, { neck: 20, head: 18, spine: 3, ...ears(-10), tail0: 4 }, { head: 6 }),
  feed: feed({ neck: 25, head: 20, ...fore(5) }, { jaw: -14 }, { jaw: -2 }),
});

/* ---- biped-bird ---- */
const legs2 = (far: number, near: number, bend = 0): J => ({ legFarKnee: far, legNearKnee: near, legFarAnkle: -far * 0.8 + bend, legNearAnkle: -near * 0.8 + bend, legFarFoot: far * 0.4, legNearFoot: near * 0.4 });
/** Wing keys: + LIFTS the wing (the bones point backward from the chest, so clockwise-positive raises the tip). */
const wings = (root: number, tip: number): J => ({ ...pair('wing', root, 'Root'), ...pair('wing', tip, 'Tip') });
const neck2 = (a: number, b: number, head = 0): J => ({ neck0: a, neck1: b, head });
const BIRD = fauna({
  idle: [{ ...neck2(-2, 2), tailFan: 3 }, { spine: -2, chest: -2, head: 2, ...wings(2, 0) }, { tailFan: -3, head: -2 }, 0.004, -0.003, -0.010],
  alert: [{ ...neck2(-15, -12, -8), tailFan: -10, ...wings(6, 0), spine: -3 }, -0.010],
  approach: { walk: loop4({ ...legs2(-22, 22, 6), ...neck2(6, -4) }, { ...legs2(0, 0, 14), ...neck2(-4, 3) }, { ...legs2(22, -22, 6), ...neck2(6, -4) }, 0, -0.010, 0.004),
    flight: [P(0.25, 'sine-in-out', { ...wings(65, 35), ...legs2(40, 40, -40), spine: -6, ...neck2(4, 4) }, 0, -0.120), P(0.5, 'sine-in-out', { ...wings(10, -5), ...legs2(40, 40, -40), spine: -4 }, 0, -0.160),
      P(0.75, 'sine-in-out', { ...wings(-45, -40), ...legs2(40, 40, -40), spine: 2, ...neck2(-3, -3) }, 0, -0.120), P(1, 'sine-in-out', { ...wings(20, 10), ...legs2(40, 40, -40), spine: -4 }, 0, -0.100)] },
  melee: { peck: melee({ ...neck2(-22, -18, -10), spine: -4, ...wings(12, 0) }, { ...neck2(25, 20, 15), beak: -10, spine: 6, ...wings(30, 10) }, { ...neck2(35, 30, 25), beak: -25, spine: 8 }, { ...neck2(-5, 0, 2) }, [-0.03, 0.25, 0.30, 0.08]),
    claw: melee({ legNearKnee: -30, spine: -6, ...wings(30, 10), ...neck2(-8, -6) }, { legNearKnee: -60, legNearAnkle: 70, legNearFoot: -30, ...wings(50, 20), spine: -8 }, { legNearKnee: -70, legNearAnkle: 82, legNearFoot: -42, ...wings(55, 25), root: 6, spine: -6 }, { legNearKnee: -15, legNearAnkle: 10 }, [-0.04, 0.28, 0.32, 0.10], [0.02, -0.06, -0.03, 0.01]) },
  cast: cast({ ...wings(80, 50), spine: -12, ...neck2(-10, -8), tailFan: -12 }, { ...wings(85, 55), spine: -12, ...neck2(-12, -10, -5), tailFan: -14 }, { ...wings(-20, -15), ...neck2(15, 12, 20), beak: -15, spine: -6 }, -0.05),
  hit: hit({ ...neck2(-15, -10, -18), spine: 8, chest: -5, ...wings(25, 10), tailFan: 15 }, { ...neck2(-6, -4, -6), legFarKnee: -15, legFarAnkle: 20, spine: 3, tailFan: 6 }),
  dodge: dodge({ ...legs2(20, 20, -30), ...wings(40, 15), spine: -4 }, -0.25, -0.060),
  faint: faint({ ...legs2(40, 40, -50), spine: 8, ...neck2(6, 6, 6) }, { ...legs2(30, 30, -30), root: 14, spine: 10, ...neck2(25, 25, 20), ...wings(-30, -35), tailFan: 20 }, 0.08, 0.20),
  victory: victory({ ...wings(85, 55), spine: -15, ...neck2(-10, -8, -12), tailFan: -15 }, { ...wings(90, 60), spine: -15, ...neck2(-12, -15, -30), tailFan: -25 }, -0.04),
  tame: tame({ ...legs2(-12, 12, 6), head: -4 }, { ...neck2(20, 18, 15), ...wings(-5, 0), tailFan: 5, spine: 2 }, { head: 5 }),
  feed: feed({ ...neck2(30, 30, 20), spine: 4 }, { beak: -12 }, { beak: -2 }),
});

/* ---- fish: spine wave runs head→tail; wave(k) scales one authored S-curve ---- */
const wave = (k: number): J => mul({ spine0: -6, spine1: -10, spine2: -4, spine3: 6, spine4: 12, spine5: 16, caudal: 20 }, k);
const pect = (v: number): J => ({ pectoralFar: -v, pectoralNear: v });
const FISH = fauna({
  idle: [wave(0.4), { ...pect(6), dorsal: -3, head: 1 }, wave(-0.4), 0.004, -0.004, -0.008],
  alert: [{ head: -8, dorsal: -12, ...pect(20), spine4: 6, spine5: 10, caudal: 14 }, -0.010],
  approach: { swim: loop4(wave(1), { ...pect(12), dorsal: 4 }, wave(-1), 0, -0.010, -0.014) },
  melee: { bite: melee({ ...wave(-0.8), head: -6, ...pect(-10) }, { ...wave(0.6), head: -4, jaw: -15, ...pect(15) }, { head: 8, jaw: -30, spine0: -6, spine1: -4, ...pect(20) }, { ...wave(0.2), head: 2 }, [-0.05, 0.30, 0.36, 0.10], [0.01, -0.02, -0.01, 0]) },
  cast: cast({ head: -18, spine0: -8, spine1: -6, ...pect(35), dorsal: -10 }, { head: -20, spine0: -8, spine1: -6, ...pect(38), dorsal: -12 }, { head: 22, jaw: -20, spine0: 6, ...pect(10) }, -0.05),
  hit: hit({ head: -14, spine0: 8, spine1: 10, spine2: 6, caudal: -10, ...pect(-15) }, { ...wave(-0.5), root: -6, head: -4 }, 0.01),
  dodge: dodge({ ...wave(1.2), root: -8, ...pect(25) }, -0.20, -0.060),
  faint: faint({ root: 15, ...pect(-10) }, { root: 28, head: 10, ...wave(0.5), ...pect(-20) }, 0.05, 0.20),
  victory: victory({ root: -25, head: -10, ...wave(-0.7), ...pect(40) }, { root: -20, head: -20, ...wave(-0.5), caudal: 35, ...pect(45) }),
  tame: tame(wave(0.6), { head: 15, spine0: 4, ...pect(10) }, { head: 5 }),
  feed: feed({ head: 18, spine0: 6, ...pect(8) }, { jaw: -18 }, { jaw: -3 }),
});

/* ---- insect: tripod gait (FrontFar+MidNear+HindFar swing together) ---- */
const tripodA = ['legFrontFar', 'legMidNear', 'legHindFar'], tripodB = ['legFrontNear', 'legMidFar', 'legHindNear'];
const legSet = (names: readonly string[], knee: number, foot: number): J => Object.fromEntries(names.flatMap((n) => [[n + 'Knee', knee], [n + 'Foot', foot]]));
const tripod = (k: number, f: number): J => ({ ...legSet(tripodA, -k, f), ...legSet(tripodB, k, -f) });
const allLegs6 = (knee: number, foot: number): J => legSet([...tripodA, ...tripodB], knee, foot);
const frontLegs = (knee: number, foot = 0): J => legSet(['legFrontFar', 'legFrontNear'], knee, foot);
const ant = (v: number): J => ({ antennaFar: v, antennaNear: v });
const wing1 = (v: number): J => ({ wingFar: v, wingNear: -v });
const INSECT = fauna({
  idle: [{ abdomen: 3, ...ant(-4) }, { thorax: -1, head: -2, abdomen: -2 }, { abdomen: -3, ...ant(4) }, 0.003, -0.002, -0.006],
  alert: [{ head: -12, ...ant(-30), thorax: -4, ...frontLegs(-20) }, -0.010],
  approach: { crawl: loop4(tripod(25, 15), { ...allLegs6(-4, 6), thorax: -1 }, tripod(-25, -15), 0, -0.006, 0.003),
    flight: [P(0.25, 'sine-in-out', { ...wing1(-70), ...allLegs6(30, -40), abdomen: 8 }, 0, -0.110), P(0.5, 'sine-in-out', { ...wing1(0), ...allLegs6(30, -40), abdomen: 4 }, 0, -0.130), P(0.75, 'sine-in-out', { ...wing1(70), ...allLegs6(30, -40), abdomen: 8 }, 0, -0.110), P(1, 'sine-in-out', { ...wing1(-10), ...allLegs6(30, -40), abdomen: 4 }, 0, -0.100)] },
  melee: { mandible: melee({ head: -15, thorax: 4, ...frontLegs(-25), abdomen: 6 }, { head: 10, mandible: -20, ...frontLegs(-10), thorax: -3 }, { head: 18, mandible: -38, ...frontLegs(30, -10), thorax: -2 }, { head: 2, ...frontLegs(5) }, [-0.04, 0.28, 0.34, 0.10], [0.02, -0.03, -0.01, 0.01]) },
  cast: cast({ thorax: -10, head: -15, abdomen: 20, ...wing1(-60), ...frontLegs(-50), ...legSet(['legMidFar', 'legMidNear'], -25, 10) }, { thorax: -10, head: -18, abdomen: 22, ...wing1(-65), ...frontLegs(-55), ...ant(-20) }, { head: 20, mandible: -15, abdomen: -10, ...wing1(30), ...frontLegs(10) }, -0.04),
  hit: hit({ head: -18, thorax: 6, abdomen: -12, ...ant(25), ...frontLegs(-10) }, { ...legSet(['legHindFar', 'legHindNear'], -20, 25), head: -6, abdomen: -4 }, 0.012),
  dodge: dodge({ ...allLegs6(30, -35), head: -6, abdomen: -8 }, -0.22, -0.030),
  faint: faint({ ...allLegs6(40, -50), thorax: 3 }, { root: 12, thorax: 5, head: 15, abdomen: 20, ...allLegs6(55, -65), ...ant(30) }, 0.06, 0.16),
  victory: victory({ thorax: -12, head: -20, abdomen: 25, ...frontLegs(-55), ...legSet(['legMidFar', 'legMidNear'], -30, 10), ...wing1(-75) }, { thorax: -12, head: -30, abdomen: 25, ...frontLegs(-55), ...ant(-40), ...wing1(-80) }, -0.05),
  tame: tame(tripod(15, 10), { head: 20, thorax: 4, ...ant(15), ...frontLegs(20) }, { head: 5 }),
  feed: feed({ head: 25, thorax: 6, ...frontLegs(15) }, { mandible: -18 }, { mandible: -3 }),
});

/* ---- serpent: seg0 is nearest the head; wave(k) is one slither S-curve ---- */
const swave = (k: number): J => mul({ seg0: 8, seg1: 14, seg2: 8, seg3: -8, seg4: -14, seg5: -8, seg6: 8, seg7: 14, seg8: 8, seg9: -8 }, k);
const SERPENT = fauna({
  idle: [{ head: -2, seg0: 2, seg1: 3 }, { head: 2, seg8: 3, seg9: 4 }, { head: -1, seg0: -2, seg1: -3 }, 0.003, -0.002, -0.004],
  alert: [{ head: -25, seg0: -15, seg1: -10, seg2: -4 }, -0.030],
  approach: { slither: loop4(swave(1), { head: 2, seg0: 2 }, swave(-1), 0, -0.004, 0) },
  melee: { strike: melee({ head: -20, seg0: -18, seg1: -12, seg2: -6, seg3: 6, seg4: 8 }, { head: 5, seg0: -5, seg1: 5, seg2: 12, seg3: 4, jaw: -20 }, { head: 15, jaw: -42, seg0: 4, seg1: 2 }, { head: -5, seg0: -10, seg1: -8 }, [-0.08, 0.40, 0.48, 0.12], [0.01, -0.03, -0.01, 0]),
    constrict: melee({ ...swave(1), head: -10 }, { seg0: 20, seg1: 30, seg2: 35, seg3: 30, seg4: 20, seg5: 10, head: 10 }, { seg0: 30, seg1: 42, seg2: 44, seg3: 40, seg4: 32, seg5: 25, seg6: 15, head: 20, jaw: -10 }, { seg0: 15, seg1: 20, seg2: 22, seg3: 20, seg4: 15, head: 8 }, [-0.05, 0.30, 0.34, 0.14], [0.01, -0.02, 0, 0]) },
  cast: cast({ head: -30, seg0: -30, seg1: -25, seg2: -15, seg3: -5 }, { head: -32, seg0: -30, seg1: -25, seg2: -15, seg3: -5, jaw: -8 }, { head: 25, jaw: -30, seg0: 5, seg1: 5 }),
  hit: hit({ head: -28, seg0: -12, seg1: 6, seg2: 10, seg3: 6 }, { head: -10, seg0: -5, ...swave(-0.4) }, 0.012),
  dodge: dodge({ head: -15, seg0: -20, seg1: -15, seg2: -5, seg3: 10, seg4: 12 }, -0.20, -0.020),
  faint: faint({ head: 10, seg0: 8 }, { root: 8, head: 30, seg0: 12, ...swave(0.3) }, 0.04, 0.12),
  victory: victory({ head: -35, seg0: -35, seg1: -30, seg2: -18, seg3: -6 }, { head: -45, jaw: -20, seg0: -30, seg1: -25, seg2: -18, seg3: -6 }),
  tame: tame(swave(0.5), { head: 20, seg0: 8 }, { head: 6 }),
  feed: feed({ head: 25, seg0: 8 }, { jaw: -30 }, { jaw: -5 }),
});

/* ---- arachnid: alternating tetrapod (leg1Far, leg2Near, leg3Far, leg4Near swing together) ---- */
const tetA = ['leg1Far', 'leg2Near', 'leg3Far', 'leg4Near'], tetB = ['leg1Near', 'leg2Far', 'leg3Near', 'leg4Far'];
const tetrapod = (k: number, f: number): J => ({ ...legSet(tetA, -k, f), ...legSet(tetB, k, -f) });
const allLegs8 = (knee: number, foot: number): J => legSet([...tetA, ...tetB], knee, foot);
const leg1 = (knee: number, foot = 0): J => legSet(['leg1Far', 'leg1Near'], knee, foot);
const leg2 = (knee: number, foot = 0): J => legSet(['leg2Far', 'leg2Near'], knee, foot);
const chel = (v: number): J => pair('chelicera', v);
const ARACHNID = fauna({
  idle: [{ abdomen: 3, ...chel(-3) }, { cephalothorax: -1, abdomen: -2 }, { abdomen: -3, ...chel(3) }, 0.003, -0.002, -0.006],
  alert: [{ cephalothorax: -5, abdomen: 10, sting: -20, ...chel(-20), ...leg1(-30) }, -0.010],
  approach: { scuttle: loop4(tetrapod(25, 15), { ...allLegs8(-4, 6), cephalothorax: -1 }, tetrapod(-25, -15), 0, -0.006, 0.003) },
  melee: { sting: melee({ abdomen: 20, sting: 25, cephalothorax: 3, ...leg1(-15) }, { abdomen: 55, sting: 50, cephalothorax: -6, ...leg1(-25) }, { abdomen: 62, sting: 68, cephalothorax: -10, ...leg1(-35, -10) }, { abdomen: 20, sting: 10 }, [-0.04, 0.18, 0.26, 0.08], [0.02, -0.02, -0.01, 0.01]),
    bite: melee({ cephalothorax: 6, ...chel(-30), ...leg1(-25) }, { cephalothorax: -4, ...chel(-10), ...leg1(-10) }, { cephalothorax: 8, ...chel(40), ...leg1(20, -10) }, { cephalothorax: 2, ...chel(5) }, [-0.04, 0.26, 0.32, 0.10], [0.02, -0.03, -0.01, 0.01]) },
  cast: cast({ cephalothorax: -12, ...leg1(-60, 10), ...leg2(-35, 10), abdomen: 25, sting: 30 }, { cephalothorax: -12, ...leg1(-62, 10), ...leg2(-38, 10), abdomen: 28, sting: 34, ...chel(-15) }, { cephalothorax: 10, ...chel(30), ...leg1(10), abdomen: -10, sting: -10 }, -0.04),
  hit: hit({ cephalothorax: -10, abdomen: -15, sting: -25, ...chel(20), ...leg1(-10) }, { ...legSet(['leg4Far', 'leg4Near'], -20, 25), cephalothorax: -4, abdomen: -5 }, 0.012),
  dodge: dodge({ ...allLegs8(30, -35), cephalothorax: -5, abdomen: -8 }, -0.22, -0.030),
  faint: faint({ ...allLegs8(40, -50), cephalothorax: 3 }, { root: 10, cephalothorax: 5, ...allLegs8(60, -70), abdomen: 15, sting: 20, ...chel(15) }, 0.05, 0.14),
  victory: victory({ cephalothorax: -14, ...leg1(-60, 10), ...leg2(-40, 10), abdomen: 35, sting: 45, ...chel(-30) }, { cephalothorax: -12, ...leg1(-60, 10), ...leg2(-40, 10), abdomen: 35, sting: 60, ...chel(30) }, -0.05),
  tame: tame(tetrapod(15, 10), { cephalothorax: 12, ...leg1(15), ...chel(10), abdomen: -5 }, { cephalothorax: 4 }),
  feed: feed({ cephalothorax: 15, ...leg1(20) }, { cheliceraFar: -20, cheliceraNear: 20 }, { cheliceraFar: -4, cheliceraNear: 4 }),
});

/* ---- radial: arms 0/2/4 hang to the right of centre and 1/3/5 to the left, so splay(+) opens all six ---- */
function radialActions(arms=6):Readonly<Record<string,MotionAction>>{
const splay = (s0: number, s1: number, s2: number): J => Object.fromEntries(Array.from({length:arms},(_,i)=>i).flatMap((n) => { const k = n % 2 === 0 ? 1 : -1; return [['arm' + n + 'Seg0', s0 * k], ['arm' + n + 'Seg1', s1 * k], ['arm' + n + 'Seg2', s2 * k]]; }));
return fauna({
  idle: [{ bell: 3, ...splay(3, 4, 5) }, { bell: -4, centre: 1, ...splay(-2, -3, -4) }, { bell: 3, ...splay(2, 3, 4) }, 0, -0.006, -0.012],
  alert: [{ bell: -12, centre: -3, ...splay(-15, -20, -25) }, -0.020],
  approach: { drift: loop4({ ...splay(6, 9, 12), bell: 2 }, { ...splay(-3, -5, -8), bell: -3 }, { ...splay(5, 8, 11), bell: 2 }, 0.02, -0.020, -0.030),
    pulse: [P(0.3, 'ease-in', { bell: -18, centre: -2, ...splay(-30, -35, -40) }, 0, -0.100), P(0.6, 'ease-out', { bell: 15, centre: 2, ...splay(20, 25, 30) }, 0, -0.040), P(0.85, 'sine-in-out', { bell: 4, ...splay(8, 10, 12) }, 0, -0.020), P(1, 'sine-in-out', REST, 0, -0.010)] },
  melee: { 'sting-arms': melee({ bell: -10, ...splay(-20, -30, -35) }, { bell: 15, root: 10, ...splay(35, 45, 50) }, { root: 14, bell: 12, ...splay(40, 52, 55) }, { bell: 4, ...splay(10, 15, 20) }, [-0.03, 0.22, 0.28, 0.08], [0.01, -0.02, -0.01, 0]) },
  cast: cast({ bell: -20, root: -15, ...splay(-30, -40, -45) }, { bell: -22, root: -15, ...splay(-32, -42, -48) }, { bell: 18, root: 5, ...splay(30, 40, 45) }, -0.08),
  hit: hit({ bell: 12, centre: -8, root: -12, ...splay(-15, -25, -30) }, { root: -6, ...splay(10, 15, 20) }),
  dodge: dodge({ bell: -15, root: -20, ...splay(-25, -35, -40) }, -0.20, -0.060),
  faint: faint({ bell: 10, ...splay(15, 20, 25) }, { root: 30, bell: 20, ...splay(30, 40, 45) }, 0.06, 0.18),
  victory: victory({ bell: -20, root: -25, ...splay(-35, -45, -50) }, { bell: 15, root: -10, ...splay(30, 45, 50) }, -0.10),
  tame: tame({ ...splay(6, 9, 12), bell: 2 }, { bell: 8, ...splay(15, 20, 25) }, { bell: 3 }),
  feed: feed({ bell: 5, ...splay(30, 40, 45) }, splay(40, 52, 55), splay(25, 35, 40)),
});

}
const RADIAL=radialActions();

/* ---- myriapod (B3): alternating tetrapod on four pairs, a segment wave through the body; forcipule bite, rear sting ---- */
const myA = ['legAFar', 'legBNear', 'legCFar', 'legDNear'], myB = ['legANear', 'legBFar', 'legCNear', 'legDFar'];
const mtripod = (k: number, f: number): J => ({ ...legSet(myA, -k, f), ...legSet(myB, k, -f) });
const allLegsM = (knee: number, foot: number): J => legSet([...myA, ...myB], knee, foot);
const legA = (knee: number, foot = 0): J => legSet(['legAFar', 'legANear'], knee, foot);
const mwave = (k: number): J => mul({ seg0: 6, seg1: 10, seg2: 6, seg3: -6, seg4: -10, seg5: -6, seg6: 6, seg7: 10 }, k);
const MYRIAPOD = fauna({
  idle: [{ ...mwave(0.3), ...ant(-3) }, { head: -2, seg7: 3 }, { ...mwave(-0.3), ...ant(3) }, 0.003, -0.002, -0.005],
  alert: [{ head: -15, ...ant(-30), seg0: -8, seg1: -4, ...legA(-20) }, -0.008],
  approach: { crawl: loop4({ ...mtripod(22, 12), ...mwave(0.6) }, allLegsM(-3, 5), { ...mtripod(-22, -12), ...mwave(-0.6) }, 0, -0.005, 0.003) },
  melee: { mandible: melee({ head: -14, seg0: -10, seg1: -6, ...legA(-25) }, { head: 12, mandible: -20, seg0: 6, ...legA(-10) }, { head: 20, mandible: -38, seg0: 8, seg1: 4, ...legA(28, -10) }, { head: 2, ...legA(5) }, [-0.04, 0.28, 0.34, 0.10], [0.02, -0.03, -0.01, 0.01]),
    sting: melee(mwave(0.5), { seg5: 20, seg6: 35, seg7: 45 }, { seg4: 15, seg5: 30, seg6: 42, seg7: 55, head: -8 }, { seg6: 10, seg7: 15 }, [-0.03, 0.20, 0.26, 0.08], [0.01, -0.02, -0.01, 0]) },
  cast: cast({ head: -18, seg0: -20, seg1: -12, ...legA(-45, 10), ...ant(-15) }, { head: -20, seg0: -22, seg1: -12, ...legA(-48, 10), ...ant(-25) }, { head: 18, mandible: -15, seg0: 6, ...legA(10) }, -0.04),
  hit: hit({ head: -20, seg0: 8, seg1: 10, seg2: 6, ...ant(25), ...legA(-10) }, { head: -6, ...mwave(-0.4) }, 0.01),
  dodge: dodge({ ...allLegsM(28, -32), head: -5, ...mwave(0.8) }, -0.22, -0.030),
  faint: faint({ ...allLegsM(35, -45), head: 6 }, { root: 10, head: 20, ...allLegsM(55, -65), ...mwave(0.3), ...ant(30) }, 0.05, 0.14),
  victory: victory({ head: -25, seg0: -25, seg1: -15, seg2: -6, ...legA(-55, 10), ...ant(-35) }, { head: -32, mandible: -15, seg0: -25, seg1: -15, seg2: -6, ...legA(-55, 10), ...ant(-45) }, -0.05),
  tame: tame(mtripod(12, 8), { head: 18, seg0: 6, ...ant(12), ...legA(15) }, { head: 5 }),
  feed: feed({ head: 22, seg0: 6, ...legA(12) }, { mandible: -20 }, { mandible: -3 }),
});

/* ---- cephalopod (B3): arms 0..3 hang left (sign −) and 4..7 right (sign +), so csplay(+) opens the crown; the front pair (3, 4) lashes ---- */
function cephalopodActions(arms=8,feedingTentacles=0):Readonly<Record<string,MotionAction>>{
const cephArmsA=Array.from({length:arms},(_,i)=>'arm'+i),tentacles=Array.from({length:feedingTentacles},(_,i)=>'tentacle'+i);
const csplay = (s0: number, s1: number, s2: number): J => Object.fromEntries([...cephArmsA,...tentacles].flatMap((a, n) => { const k = n<arms?(n<arms/2?-1:1):(n-arms<feedingTentacles/2?-1:1); return [[a + 'Seg0', s0 * k], [a + 'Seg1', s1 * k], [a + 'Seg2', s2 * k]]; }));
const calt = (s0: number, s1: number, s2: number): J => Object.fromEntries([...cephArmsA,...tentacles].flatMap((a, n) => { const k = n % 2 === 0 ? 1 : -1; return [[a + 'Seg0', s0 * k], [a + 'Seg1', s1 * k], [a + 'Seg2', s2 * k]]; }));
// Feeding tentacles own a squid's reach; otherwise use the two central arms.
const front = (a:number,b:number,c:number):J=>Object.fromEntries((tentacles.length?tentacles:[cephArmsA[Math.floor((arms-1)/2)]!,cephArmsA[Math.ceil((arms-1)/2)]!]).flatMap(n=>[[n+'Seg0',a],[n+'Seg1',b],[n+'Seg2',c]]));
const fins = (v: number): J => ({ finFar: -v, finNear: v });
const eyes = (v: number): J => ({ eyeFar: v, eyeNear: v });
return fauna({
  idle: [{ mantle: 2, ...csplay(3, 4, 5) }, { head: -2, ...fins(6), siphon: -4 }, { mantle: -2, ...csplay(-2, -3, -4) }, 0.002, -0.005, -0.010],
  alert: [{ mantle: -10, head: -5, ...csplay(-15, -20, -25), ...eyes(-8), ...fins(20) }, -0.020],
  approach: { jet: [P(0.3, 'ease-in', { mantle: -12, siphon: 25, ...csplay(-28, -34, -40) }, 0, -0.060), P(0.6, 'ease-out', { mantle: 10, siphon: -10, ...csplay(18, 24, 30), ...fins(15) }, 0.30, -0.120), P(0.85, 'sine-in-out', { mantle: 3, ...csplay(6, 8, 10) }, 0.45, -0.050), P(1, 'sine-in-out', REST, 0, -0.020)],
    crawl: loop4(calt(20, 25, 30), { mantle: -2, ...fins(5) }, calt(-20, -25, -30), 0, -0.004, 0.002) },
  melee: { lash: melee({ mantle: -6, ...front(-40, -50, -55), ...eyes(-5) }, { mantle: 8, root: 6, ...front(45, 60, 70) }, { root: 10, mantle: 10, ...front(40, 60, -80) }, { mantle: 3, ...front(10, 15, 20) }, [-0.04, 0.28, 0.34, 0.10], [0.02, -0.03, -0.01, 0.01]),
    bite: melee({ head: -10, mantle: -4, ...csplay(-10, -15, -20) }, { head: 8, root: 4, ...csplay(15, 20, 25) }, { head: 15, root: 8, ...csplay(25, 35, 40), ...eyes(6) }, { head: 2 }, [-0.04, 0.26, 0.32, 0.10], [0.02, -0.03, -0.01, 0.01]) },
  cast: cast({ mantle: -18, head: -8, ...csplay(-30, -40, -45), ...fins(25), siphon: 15 }, { mantle: -20, head: -10, ...csplay(-32, -42, -48), ...fins(28), siphon: 18 }, { mantle: 12, head: 6, ...csplay(28, 38, 42), siphon: -20 }, -0.08),
  hit: hit({ mantle: 12, head: -10, root: -10, ...csplay(-12, -20, -25), ...eyes(-8) }, { root: -5, ...csplay(8, 12, 15) }),
  dodge: dodge({ mantle: -12, root: -18, siphon: 30, ...csplay(-25, -35, -40) }, -0.22, -0.070),
  faint: faint({ mantle: 8, ...csplay(12, 18, 22) }, { root: 28, mantle: 18, head: 10, ...csplay(28, 38, 45), ...fins(-15) }, 0.06, 0.18),
  victory: victory({ mantle: -18, root: -22, ...csplay(-35, -45, -50), ...fins(30) }, { mantle: 12, root: -8, ...csplay(30, 42, 50), ...fins(35), ...eyes(10) }, -0.10),
  tame: tame({ ...csplay(5, 8, 10), mantle: 2 }, { head: 8, ...csplay(14, 20, 24) }, { head: 3 }),
  feed: feed({ head: 5, ...csplay(28, 38, 42) }, csplay(40, 50, 55), csplay(24, 32, 38)),
});

}
const CEPHALOPOD=cephalopodActions();

/* ---- flyer-membrane (B3): + LIFTS a wing (bones point backward from the chest, like the bird); crawl is the folded-wing scramble ---- */
const bw = (root: number, elbow: number, wrist: number, tip: number): J => ({ ...pair('wing', root, 'Root'), ...pair('wing', elbow, 'Elbow'), ...pair('wing', wrist, 'Wrist'), ...pair('wing', tip, 'Tip') });
const bl = (knee: number, foot: number): J => ({ ...pair('leg', knee, 'Knee'), ...pair('leg', foot, 'Foot') });
const bears = (v: number): J => pair('ear', v, 'Tip');
const FLYER = fauna({
  idle: [{ spine: -1, chest: -2, ...bw(2, -2, 0, 0) }, { neck: -2, head: 1, ...bears(-3) }, { ...bw(-2, 2, 0, 0), tail0: 2 }, 0.003, -0.004, -0.010],
  alert: [{ neck: -14, head: -10, ...bears(-25), ...bw(20, -10, 0, 5), spine: -3 }, -0.010],
  approach: { flight: [P(0.25, 'sine-in-out', { ...bw(70, -30, -20, -10), ...bl(30, -30), spine: -6, neck: 4 }, 0, -0.120), P(0.5, 'sine-in-out', { ...bw(10, 10, 15, 20), ...bl(30, -30), spine: -4 }, 0, -0.160),
      P(0.75, 'sine-in-out', { ...bw(-50, 40, 35, 30), ...bl(30, -30), spine: 2, neck: -3 }, 0, -0.120), P(1, 'sine-in-out', { ...bw(20, 0, 0, 5), ...bl(30, -30), spine: -4 }, 0, -0.100)],
    crawl: loop4({ ...bw(-30, 30, 20, 10), ...bl(-20, 15), spine: 4 }, { ...bw(-25, 25, 15, 5), ...bl(0, 10) }, { ...bw(-35, 35, 25, 15), ...bl(20, -15), spine: 4 }, 0, -0.006, 0.004) },
  melee: { bite: melee({ neck: -20, head: -16, spine: -4, ...bw(30, -15, 0, 0), ...bears(-15) }, { neck: 22, head: 14, jaw: -15, spine: 6, ...bw(45, -10, 0, 5) }, { neck: 30, head: 20, jaw: -35, spine: 8, ...bw(50, -5, 0, 10) }, { neck: -4, head: 2 }, [-0.03, 0.26, 0.30, 0.08]),
    claw: melee({ ...bl(-30, 20), spine: -6, ...bw(35, -15, 0, 0) }, { legNearKnee: -60, legNearFoot: 35, ...bw(55, -10, 0, 5), spine: -8 }, { legNearKnee: -68, legNearFoot: 48, ...bw(60, -5, 0, 10), root: 6 }, { legNearKnee: -15, legNearFoot: 10 }, [-0.04, 0.28, 0.32, 0.10], [0.02, -0.06, -0.03, 0.01]) },
  cast: cast({ ...bw(85, -40, -30, -20), spine: -12, neck: -10, tail0: -10 }, { ...bw(90, -45, -35, -25), spine: -12, neck: -12, head: -5, ...bears(-10) }, { ...bw(-20, 20, 15, 10), neck: 15, head: 20, jaw: -15, spine: -6 }, -0.05),
  hit: hit({ neck: -15, head: -18, spine: 8, chest: -5, ...bw(25, -10, 0, 0), ...bears(12), tail0: 10 }, { neck: -6, head: -6, legFarKnee: -15, legFarFoot: 20, spine: 3 }),
  dodge: dodge({ ...bl(20, -30), ...bw(40, -15, 0, 5), spine: -4 }, -0.25, -0.060),
  faint: faint({ ...bl(40, -50), spine: 8, neck: 6, head: 6 }, { ...bl(30, -30), root: 14, spine: 10, neck: 22, head: 20, ...bw(-30, -30, -20, -10), tail0: 20 }, 0.08, 0.20),
  victory: victory({ ...bw(85, -45, -35, -25), spine: -15, neck: -10, head: -12, tail0: -15 }, { ...bw(90, -50, -40, -30), spine: -15, neck: -12, head: -30, jaw: -10, ...bears(-20) }, -0.04),
  tame: tame({ ...bl(-12, 10), head: -4 }, { neck: 20, head: 18, ...bw(-5, 0, 0, 0), spine: 2, ...bears(-8) }, { head: 5 }),
  feed: feed({ neck: 30, head: 20, spine: 4 }, { jaw: -14 }, { jaw: -2 }),
});

/* ---- primate (B3): arms and legs alternate in the knuckle-walk; punch drives the near arm; climb reaches overhead ---- */
const pa = (sh: number, el: number, hand: number): J => ({ ...pair('arm', sh, 'Shoulder'), ...pair('arm', el, 'Elbow'), ...pair('arm', hand, 'Hand') });
const pl = (hip: number, knee: number, foot: number): J => ({ ...pair('leg', hip, 'Hip'), ...pair('leg', knee, 'Knee'), ...pair('leg', foot, 'Foot') });
const alt = (base: string, v: number, suffix: string): J => ({ [base + 'Far' + suffix]: -v, [base + 'Near' + suffix]: v });
const tail3 = (a: number, b: number, c: number): J => ({ tail0: a, tail1: b, tail2: c });
const climbA: J = { armFarShoulder: -70, armFarElbow: 45, armNearShoulder: -40, armNearElbow: 30, legFarHip: 20, legFarKnee: -45, legNearHip: 40, legNearKnee: -60, spine: -6 };
const climbB: J = { armFarShoulder: -40, armFarElbow: 30, armNearShoulder: -70, armNearElbow: 45, legFarHip: 40, legFarKnee: -60, legNearHip: 20, legNearKnee: -45, spine: -6 };
const PRIMATE = fauna({
  idle: [{ spine: -2, chest: -1, ...tail3(3, 4, 5) }, { neck: -2, head: 2, ...pa(2, -3, 0) }, { spine: 1, ...tail3(-3, -4, -5) }, 0.003, -0.003, -0.008],
  alert: [{ neck: -12, head: -10, spine: -6, chest: -4, ...pa(-20, -15, 0), ...tail3(-15, -10, -5) }, -0.010],
  approach: { walk: loop4({ ...pa(0, 10, 0), ...pl(0, -15, 5), ...alt('arm', 25, 'Shoulder'), ...alt('leg', 25, 'Hip'), spine: 3 }, { ...pa(0, 15, 0), ...pl(0, -10, 10) }, { ...pa(0, 10, 0), ...pl(0, -15, 5), ...alt('arm', -25, 'Shoulder'), ...alt('leg', -25, 'Hip'), spine: 3 }, 0, -0.008, 0.004),
    climb: loop4(climbA, { ...pa(-50, 35, 0), ...pl(30, -50, 10), spine: -4 }, climbB, 0, -0.050, -0.030) },
  melee: { punch: melee({ armNearShoulder: 35, armNearElbow: -80, spine: -6, chest: -4, ...pl(10, -15, 0) }, { armNearShoulder: -60, armNearElbow: -20, armNearHand: -10, spine: 8, chest: 6 }, { armNearShoulder: -75, armNearElbow: -5, armNearHand: -20, spine: 10, chest: 8, root: 4, head: 4 }, { armNearShoulder: -20, armNearElbow: -25, spine: 3 }, [-0.05, 0.30, 0.36, 0.10], [0.02, -0.03, -0.01, 0.01]),
    bite: melee({ neck: -18, head: -14, spine: -6, ...pa(-15, -20, 0) }, { neck: 18, head: 12, jaw: -14, spine: 8, ...pa(-30, -15, 0) }, { neck: 26, head: 18, jaw: -32, spine: 10, ...pa(-35, -10, 0) }, { neck: -3, head: 2 }, [-0.04, 0.26, 0.32, 0.10]) },
  cast: cast({ ...pa(-95, -30, -20), spine: -15, chest: -10, neck: -10, head: -8, ...tail3(-10, -8, -5) }, { ...pa(-100, -35, -25), spine: -15, chest: -10, neck: -12, head: -10 }, { ...pa(-40, -10, 15), neck: 12, head: 15, jaw: -10, spine: 4 }, -0.06),
  hit: hit({ neck: -16, head: -18, spine: 8, chest: -6, ...pa(20, -25, 0), ...tail3(10, 8, 5) }, { neck: -6, head: -6, spine: 3, ...pl(-10, -15, 10) }),
  dodge: dodge({ ...pl(25, -40, 10), ...pa(-30, -20, 0), spine: -6, neck: -6 }, -0.25, -0.050),
  faint: faint({ ...pl(30, -45, 10), ...pa(20, -30, 0), spine: 8, head: 6 }, { ...pl(40, -30, 20), ...pa(35, -40, 10), root: 14, spine: 12, neck: 22, head: 26, ...tail3(15, 12, 8) }, 0.08, 0.20),
  victory: victory({ ...pa(-100, -40, -20), spine: -18, chest: -10, neck: -8, head: -12, ...tail3(-12, -10, -6) }, { ...pa(-100, -45, -25), spine: -18, chest: -10, neck: -12, head: -28, jaw: -12, ...tail3(-16, -12, -8) }, -0.06),
  tame: tame({ ...pl(-10, -12, 5), head: -4, ...pa(-8, -10, 0) }, { neck: 20, head: 18, spine: 3, ...pa(-15, -30, 10), ...tail3(4, 3, 2) }, { head: 5 }),
  feed: feed({ neck: 24, head: 18, ...pa(-40, -70, 15) }, { jaw: -14 }, { jaw: -2 }),
});

/* ---- plants: branch/stem n alternates side (even right, odd left); sway(k) bends every chain base→tip ---- */
const wsway = (k: number): J => ({ trunk: 0.3 * k, ...Object.fromEntries([0, 1, 2].flatMap((n) => { const s = n === 1 ? -1 : 1; return [['branch' + n + 'Base', k * s], ['branch' + n + 'Tip', 1.5 * k * s], ['leaf' + n, 2 * k * s]]; })) });
const hsway = (k: number): J => Object.fromEntries([0, 1, 2, 3].flatMap((n) => { const s = n % 2 === 0 ? 1 : -1; return [['stem' + n + 'Seg0', 0.6 * k * s], ['stem' + n + 'Seg1', k * s], ['stem' + n + 'Seg2', 1.4 * k * s], ['frond' + n, 2 * k * s]]; }));
const plant = (sway: (k: number) => J, leaves: J): Readonly<Record<string, MotionAction>> => Object.freeze(Object.fromEntries([
  A('sway', 'sway', [P(0.25, 'sine-in-out', sway(6)), P(0.5, 'sine-in-out', sway(1)), P(0.75, 'sine-in-out', sway(-5)), P(1, 'sine-in-out', REST)], true),
  A('disturb', 'disturb', [P(tAt('disturb', 'recoil'), 'ease-out', { ...sway(-14), ...mul(leaves, -1) }, -0.01), P(tAt('disturb', 'settle', 0.5), 'sine-in-out', sway(6)), P(1, 'back-out', REST)]),
  A('harvest', 'harvest', [P(tAt('harvest', 'shake'), 'ease-in', sway(12)), P(tAt('harvest', 'detach'), 'ease-out', { ...sway(-10), ...leaves }, 0, 0.004), P(tAt('harvest', 'settle', 0.5), 'sine-in-out', sway(4)), P(1, 'back-out', REST)]),
  A('grow', 'grow', [P(0.02, 'ease-out', mul(leaves, -1.2), 0, 0.30), P(tAt('grow', 'rise'), 'ease-out', mul(leaves, -0.4), 0, -0.030), P(tAt('grow', 'overshoot'), 'back-out', { ...sway(3), ...mul(leaves, 0.3) }, 0, -0.050), P(1, 'sine-in-out', REST)]),
].map((a) => [a.id, a])));
const WOODY = plant(wsway, { leaf0: 30, leaf1: -30, leaf2: 30 });
const HERB = plant(hsway, { frond0: 35, frond1: -35, frond2: 35, frond3: -35 });

const BASE_ACTIONS_BY_TEMPLATE: Readonly<Record<'quadruped' | FamilyTemplateId, Readonly<Record<string, MotionAction>>>> = Object.freeze({
  quadruped: QUADRUPED_ACTIONS, hopper: HOPPER, 'biped-bird': BIRD, fish: FISH, insect: INSECT, serpent: SERPENT, arachnid: ARACHNID, radial: RADIAL, 'plant-woody': WOODY, 'plant-herb': HERB,
  myriapod: MYRIAPOD, cephalopod: CEPHALOPOD, 'flyer-membrane': FLYER, primate: PRIMATE,
});
export const ACTIONS_BY_TEMPLATE = Object.freeze(Object.fromEntries(Object.entries(BASE_ACTIONS_BY_TEMPLATE).map(([id,actions])=>[id,Object.freeze({...actions,...ADDITIONAL_ACTIONS[id]})]))) as Readonly<Record<'quadruped'|FamilyTemplateId,Readonly<Record<string,MotionAction>>>>;
/** Card weapon → the template's melee action name when the family's weapon has its own verb. */
export const MELEE_ALIAS: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  hopper: { claw: 'kick' }, insect: { bite: 'mandible' }, serpent: { bite: 'strike' }, radial: { sting: 'sting-arms', tail: 'sting-arms', bite: 'sting-arms' }, fish: {}, 'biped-bird': {}, arachnid: {}, quadruped: {},
  myriapod: { bite: 'mandible' }, cephalopod: { constrict: 'lash', tail: 'lash' }, 'flyer-membrane': {}, primate: { claw: 'punch' },
});
export function actionsFor(templateId:string,anatomy?:AnatomyPresence):Readonly<Record<string,MotionAction>>|undefined{
 const counts=appendageCounts(templateId,anatomy);
 if(counts)return Object.freeze({...templateId==='radial'?radialActions(counts.arms):cephalopodActions(counts.arms,counts.feedingTentacles),...ADDITIONAL_ACTIONS[templateId]});
 return ACTIONS_BY_TEMPLATE[templateId as 'quadruped'|FamilyTemplateId]??specializedActions(templateId);
}
/** Gaits (approach:*) and melee verbs (melee:*) a template's library offers, in table order. */
export const templateGaits = (templateId: string): string[] => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith('approach:')).map((k) => k.slice(9));
export const templateMelees = (templateId: string): string[] => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith('melee:')).map((k) => k.slice(6));
