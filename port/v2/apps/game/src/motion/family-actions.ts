/* Motion Kit §4 action libraries for the A11 family templates. Same tunable
 * table style as actions.ts (degrees and body lengths; the timeline converts
 * to radians); each template's numbers sit in ONE object below. Phase times
 * come from timing.ts's tAt so mass scaling never moves a key. Plants get
 * sway / disturb / harvest / grow instead of the fauna set. */
import { type Ease, type KeyPose, type MotionAction, QUADRUPED_ACTIONS } from './actions.js';
import type { FamilyTemplateId } from './family-templates.js';
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
const splay = (s0: number, s1: number, s2: number): J => Object.fromEntries([0, 1, 2, 3, 4, 5].flatMap((n) => { const k = n % 2 === 0 ? 1 : -1; return [['arm' + n + 'Seg0', s0 * k], ['arm' + n + 'Seg1', s1 * k], ['arm' + n + 'Seg2', s2 * k]]; }));
const RADIAL = fauna({
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

export const ACTIONS_BY_TEMPLATE: Readonly<Record<'quadruped' | FamilyTemplateId, Readonly<Record<string, MotionAction>>>> = Object.freeze({
  quadruped: QUADRUPED_ACTIONS, hopper: HOPPER, 'biped-bird': BIRD, fish: FISH, insect: INSECT, serpent: SERPENT, arachnid: ARACHNID, radial: RADIAL, 'plant-woody': WOODY, 'plant-herb': HERB,
});
/** Card weapon → the template's melee action name when the family's weapon has its own verb. */
export const MELEE_ALIAS: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  hopper: { claw: 'kick' }, insect: { bite: 'mandible' }, serpent: { bite: 'strike' }, radial: { sting: 'sting-arms', tail: 'sting-arms', bite: 'sting-arms' }, fish: {}, 'biped-bird': {}, arachnid: {}, quadruped: {},
});
export const actionsFor = (templateId: string): Readonly<Record<string, MotionAction>> | undefined => ACTIONS_BY_TEMPLATE[templateId as 'quadruped' | FamilyTemplateId];
/** Gaits (approach:*) and melee verbs (melee:*) a template's library offers, in table order. */
export const templateGaits = (templateId: string): string[] => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith('approach:')).map((k) => k.slice(9));
export const templateMelees = (templateId: string): string[] => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith('melee:')).map((k) => k.slice(6));
