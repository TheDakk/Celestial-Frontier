/**
 * Painted desert grazer: a deliberately scene-specific, four-chain walking puppet.
 * Source pixels come only from LOCAL_AI_DESERT_TEST_20260909/raw-output.png.
 * This is an articulated preview, not a generated animation or a universal game rig.
 */
import { cutout, paint, warp, shadow, rotateAt, translate, multiply } from './puppet.mjs';

const TAU = Math.PI * 2;
const PERIOD = 12;
const CYCLE = 1.5;
const STANCE = .73;
const CX = 288;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const time = t => ((t % PERIOD) + PERIOD) % PERIOD;
const point = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];

// The walk starts fully side-on. Narrow, explicitly 2-D turnarounds occur at 3 / 9 s.
// The minimum width prevents a missing animal on the exact turnaround frame.
function path(t) {
  const q = TAU * t / PERIOD, c = Math.cos(q);
  return {
    x: 48 * Math.sin(q), speed: 48 * TAU / PERIOD * c,
    facing: c >= 0 ? 1 : -1,
    width: .18 + .82 * smooth(Math.abs(c) / .19),
    turning: Math.abs(c) < .19,
  };
}

function boneMatrix(fromA, fromB, toA, toB) {
  const a = Math.atan2(toB[1] - toA[1], toB[0] - toA[0]) - Math.atan2(fromB[1] - fromA[1], fromB[0] - fromA[0]);
  const scale = Math.hypot(toB[0] - toA[0], toB[1] - toA[1]) / Math.hypot(fromB[0] - fromA[0], fromB[1] - fromA[1]);
  const c = Math.cos(a) * scale, s = Math.sin(a) * scale;
  return [c, s, -s, c, toA[0] - c * fromA[0] + s * fromA[1], toA[1] - s * fromA[0] - c * fromA[1]];
}

// Analytic two-bone IK: genuine hip / knee / ankle rotation using fixed rest lengths.
// If a planted target exceeds the almost-straight source pose, the lower painted
// segment extends slightly to join the target instead of opening a disconnected seam.
function kneeFor(hip, foot, upperLength, lowerLength, bend) {
  let dx = foot[0] - hip[0], dy = foot[1] - hip[1];
  const requested = Math.hypot(dx, dy);
  const d = clamp(requested, Math.abs(upperLength - lowerLength) + .05, upperLength + lowerLength - .05);
  const ux = dx / (requested || 1), uy = dy / (requested || 1);
  const along = (upperLength ** 2 - lowerLength ** 2 + d ** 2) / (2 * d);
  const side = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2)) * bend;
  return { knee: [hip[0] + ux * along - uy * side, hip[1] + uy * along + ux * side], reached: requested <= upperLength + lowerLength };
}

const LEG_DATA = [
  {
    id: 'far-rear', far: true, offset: .5, bend: -1,
    hip: [261, 401], knee: [269, 427], ankle: [282, 447],
    upper: [[249,391],[269,390],[281,401],[280,416],[276,430],[265,437],[252,425],[246,412]],
    lower: [[262,417],[277,418],[284,431],[296,440],[299,450],[280,456],[268,449],[260,435]],
    foot: [[275,438],[286,438],[295,443],[302,446],[305,452],[304,455],[281,456],[272,451]],
  },
  {
    id: 'far-front', far: true, offset: .75, bend: 1,
    hip: [396, 401], knee: [412, 434], ankle: [426, 465],
    upper: [[379,388],[404,389],[419,407],[425,431],[417,443],[403,435],[392,416]],
    lower: [[404,424],[423,425],[430,442],[435,457],[429,469],[412,469],[404,450]],
    foot: [[413,452],[429,451],[439,455],[445,462],[451,468],[450,473],[434,476],[420,474],[410,469],[407,461]],
  },
  {
    id: 'near-rear', far: false, offset: 0, bend: -1,
    hip: [210, 403], knee: [202, 432], ankle: [209, 459],
    upper: [[195,391],[223,392],[230,407],[222,425],[215,439],[199,441],[188,429],[187,414]],
    lower: [[192,419],[213,421],[219,440],[222,454],[215,465],[200,466],[191,454],[187,437]],
    foot: [[196,449],[213,449],[222,454],[229,456],[233,464],[232,470],[218,471],[205,469],[195,464],[190,456]],
  },
  {
    id: 'near-front', far: false, offset: .25, bend: 1,
    hip: [325, 410], knee: [342, 450], ankle: [353, 480],
    upper: [[313,397],[331,398],[345,413],[352,430],[357,446],[349,459],[337,461],[325,449],[314,431],[307,414]],
    lower: [[336,438],[352,438],[359,451],[359,468],[365,478],[355,489],[340,485],[333,472],[332,454]],
    foot: [[338,467],[353,465],[363,470],[367,475],[373,475],[378,481],[381,485],[384,490],[381,494],[361,494],[348,491],[339,487],[334,478]],
  },
];

/** image must be the original, loaded 1024 × 576 Image. */
export function createGrazer(image) {
  const body = cutout(image, [
    [190,345],[199,319],[212,298],[232,280],[254,267],[280,258],
    [301,258],[320,256],[343,260],[363,268],[382,282],[397,288],
    [411,305],[421,323],[424,337],[416,355],[409,376],[399,400],
    [379,412],[360,418],[345,406],[333,401],[315,404],[296,402],
    [278,397],[260,393],[243,388],[235,393],[232,406],[221,415],
    [208,413],[199,402],[192,386],[187,364],
  ]);
  const head = cutout(image, [
    [397,326],[415,319],[429,324],[442,334],[453,345],[464,351],
    [476,362],[481,374],[481,383],[472,391],[458,397],[438,400],
    [420,399],[405,393],[396,384],[390,371],[391,349],
  ]);
  const tail = cutout(image, [
    [188,352],[204,367],[200,384],[189,398],[174,408],[160,415],
    [145,419],[131,419],[119,415],[109,409],[99,398],[92,384],
    [83,364],[92,373],[104,387],[116,397],[128,402],[140,404],
    [153,401],[168,394],[179,382],[185,367],
  ]);
  const legs = LEG_DATA.map(leg => ({
    ...leg,
    upperPart: cutout(image, leg.upper), lowerPart: cutout(image, leg.lower), footPart: cutout(image, leg.foot),
    upperLength: Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]),
    lowerLength: Math.hypot(leg.ankle[0] - leg.knee[0], leg.ankle[1] - leg.knee[1]),
  }));

  function pose(t) {
    t = time(t);
    const travel = path(t), gait = TAU * t / CYCLE;
    // Small weight transfer belongs to the torso; feet are solved separately against ground.
    const bob = 5 + 1.3 * Math.sin(gait * 2);
    const torso = multiply(translate(0, bob), rotateAt([292,370], .004 * Math.sin(gait)));
    const world = [travel.facing * travel.width, 0, 0, 1, CX + travel.x - CX * travel.facing * travel.width, 0];
    const posed = legs.map(leg => {
      const cyclePosition = t / CYCLE + leg.offset;
      const fraction = cyclePosition - Math.floor(cyclePosition);
      const touchdownTime = (Math.floor(cyclePosition) - leg.offset) * CYCLE;
      const nextTouchdown = touchdownTime + CYCLE;
      const previous = path(touchdownTime), next = path(nextTouchdown);
      const stance = fraction < STANCE;
      const swing = stance ? 0 : (fraction - STANCE) / (1 - STANCE);
      const safePlant = !travel.turning && !previous.turning && !next.turning
        && previous.facing === travel.facing && next.facing === travel.facing;
      const reach = when => Math.abs(path(when).speed) * CYCLE * STANCE * .48;
      const contactX = when => CX + path(when).x + path(when).facing * (leg.ankle[0] - CX + reach(when));
      let footX;
      if (safePlant) {
        // Fixed world X throughout stance, then one smooth airborne step to the next contact.
        const start = contactX(touchdownTime), end = contactX(nextTouchdown);
        const groundX = stance ? start : start + (end - start) * smooth(swing);
        footX = CX + (groundX - CX - travel.x) / travel.facing;
      } else {
        // Short steps while turning: a single side view cannot supply true rear/front anatomy.
        const stride = 4 + Math.abs(travel.speed) * .2;
        footX = leg.ankle[0] + (stance ? stride * (1 - 2 * fraction / STANCE) : -stride + 2 * stride * smooth(swing));
      }
      const lift = stance ? 0 : (leg.far ? 10 : 15) * Math.sin(Math.PI * swing);
      const ankle = [footX, leg.ankle[1] - lift];
      const hip = point(torso, leg.hip);
      const solution = kneeFor(hip, ankle, leg.upperLength, leg.lowerLength, leg.bend);
      const toeAngle = stance ? 0 : -.22 * Math.sin(TAU * swing);
      const footMatrix = multiply(translate(ankle[0] - leg.ankle[0], ankle[1] - leg.ankle[1]), rotateAt(leg.ankle, toeAngle));
      return { leg, hip, knee: solution.knee, ankle, stance, fraction, lift, safePlant,
        upper: boneMatrix(leg.hip, leg.knee, hip, solution.knee),
        lower: boneMatrix(leg.knee, leg.ankle, solution.knee, ankle), footMatrix,
        worldAnkle: point(world, ankle), worldHip: point(world, hip), worldKnee: point(world, solution.knee),
      };
    });
    return { t, travel, gait, bob, torso, world, legs: posed };
  }

  function drawLeg(ctx, p) {
    paint(ctx, p.leg.upperPart, p.upper);
    paint(ctx, p.leg.lowerPart, p.lower);
    paint(ctx, p.leg.footPart, p.footMatrix);
  }

  function draw(ctx, t) {
    const p = pose(t);
    shadow(ctx, CX + p.travel.x, 465, 145 * p.travel.width, 19, .24);
    for (const leg of p.legs) {
      const [x,y] = leg.worldAnkle;
      shadow(ctx, x, leg.leg.ankle[1] + 6, (leg.leg.far ? 14 : 18) * p.travel.width, 4.5, .24 * (1 - leg.lift / 22));
    }
    ctx.save(); ctx.transform(...p.world);
    for (const leg of p.legs.filter(leg => leg.leg.far)) drawLeg(ctx, leg);
    warp(ctx, tail, ([x,y]) => {
      const d = clamp((196 - x) / 113, 0, 1);
      return point(p.torso, [x + 2 * Math.sin(p.gait * .5 - d * 2) * d, y + 7 * Math.sin(p.gait * .5 - d * 2.7) * d ** 1.2]);
    }, 12);
    // Dynamic limbs extend beneath the original shoulder/thigh plates; torso hides their roots.
    for (const leg of p.legs.filter(leg => !leg.leg.far)) drawLeg(ctx, leg);
    paint(ctx, body, p.torso);
    paint(ctx, head, multiply(p.torso, rotateAt([400,367], .024 * Math.sin(p.gait - .65))));
    ctx.restore();
  }

  function diagnostics(t) {
    const p = pose(t);
    return {
      kind: 'scene-specific-painted-four-leg-walk', period: PERIOD, gaitPeriod: CYCLE,
      travelX: p.travel.x, facing: p.travel.facing, width: p.travel.width, turning: p.travel.turning,
      headAngle: .024 * Math.sin(p.gait - .65), tailPhase: p.gait * .5,
      legs: p.legs.map(leg => ({
        id: leg.leg.id, stance: leg.stance, planted: leg.stance && leg.safePlant,
        hip: leg.worldHip, knee: leg.worldKnee, ankle: leg.worldAnkle, lift: leg.lift,
        upperAngle: Math.atan2(leg.knee[1] - leg.hip[1], leg.knee[0] - leg.hip[0]),
        lowerAngle: Math.atan2(leg.ankle[1] - leg.knee[1], leg.ankle[0] - leg.knee[0]),
        lowerExtension: Math.hypot(leg.ankle[0] - leg.knee[0], leg.ankle[1] - leg.knee[1]) / leg.leg.lowerLength,
      })),
      limitation: 'Manual cutouts for one painted animal; narrow mirrored 2-D turns, no unseen anatomical reconstruction or universal procedural rig.',
    };
  }
  return { draw, diagnostics };
}
