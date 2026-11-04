import { describe, expect, it, vi } from 'vitest';
import { applyCivetPose, createCivetMesh, deformCivetPoint, isPaintedCivetIdentity,
  sampleCivetPose, CIVET_CAPACITY, CIVET_CLIP_MS, CIVET_SOURCE_GENOME_JSON,
  type CivetClip, type CivetMeshData, type CivetPose }
  from '../tools/painted-creature/civet-articulated-rig.js';

// Independent Earth epoch0 fixture. These29 fields are not copied from the
// admitted rig serialization at runtime or reduced to a name/seed phenotype.
const GENOME = Object.freeze({ seed: 3212817920, kingdom: 'fauna', color: 14, form: 12,
  body: 13, loco: 6, trait: 14, size: 4, diet: 5, head: 5, limbs: 3, skin: 8,
  tail: 1, pattern: 0, eyes: 5, behavior: 9, habitat: 5, detail: 4, accent: 3,
  temper: 1, sense: 7, repro: 7, life: 5, metab: 4, lumin: true, gen: 0, heat: 1,
  _earthName: 'Civet', _cradle: 1 });
const REST: CivetPose = { breath: 0, drive: 0, tail: 0 };
const ENABLED = { effectsOn: true, fullMotion: true, visible: true };
const DURATIONS = { breathe: 6000, strike: 1600, recoil: 1100 } as const;
type ActiveClip = keyof typeof DURATIONS;
type Paint = (mesh: CivetMeshData, pose: CivetPose) => void;
type Point = readonly [number, number];
// Independently measured source-pixel paw partitions and lowest solid band.
const PAWS = [[270, 325], [325, 385], [428, 486], [486, 548]] as const;

/** Interpolate actual output triangles at a source landmark, using the retained
 * topology's diagonal. Do not call deformCivetPoint or inspect its skin weights. */
function landmark(mesh: CivetMeshData, x: number, y: number): Point {
  const cx = Math.min(47, Math.floor(x * 48)), cy = Math.min(31, Math.floor(y * 32));
  const u = x * 48 - cx, v = y * 32 - cy, a = cy * 49 + cx, b = a + 1, d = a + 49, c = d + 1;
  const vertices = v <= u ? [a, b, c] : [a, c, d];
  const weights = v <= u ? [1 - u, u - v, v] : [1 - v, u, v - u];
  let px = 0, py = 0;
  for (let i = 0; i < 3; i++) { px += mesh.vertices[vertices[i]! * 2]! * weights[i]!; py += mesh.vertices[vertices[i]! * 2 + 1]! * weights[i]!; }
  return [px, py];
}
const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], (a[1] - b[1]) * 2 / 3);
const bend = (a: Point, b: Point, c: Point): number => {
  const ax = a[0] - b[0], ay = (a[1] - b[1]) * 2 / 3, cx = c[0] - b[0], cy = (c[1] - b[1]) * 2 / 3;
  return Math.atan2(ax * cy - ay * cx, ax * cx + ay * cy);
};
const angleDifference = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

function phaseFindings(paint: Paint = applyCivetPose) {
  const mesh = createCivetMesh(GENOME);
  const nose: Point = [.92, .33], chest: Point = [.60, .38], shoulder: Point = [.62, .51];
  const tail: readonly Point[] = [[.225, .54], [.135, .67], [.055, .765]];
  const legs: readonly (readonly Point[])[] = [
    [[.385, .54], [.370, .675], [.39, .79]],
    [[.433, .58], [.435, .695], [.46, .79]],
    [[.568, .55], [.576, .695], [.59, .79]],
    [[.620, .51], [.637, .675], [.66, .79]],
  ];
  const at = (point: Point): Point => landmark(mesh, ...point);
  const restNose = at(nose), restChest = at(chest), restShoulder = at(shoulder), restTail = tail.map(at);
  const restAngles = legs.map(leg => bend(at(leg[0]!), at(leg[1]!), at(leg[2]!)));
  const findings: string[] = [];
  const breatheLifts: number[] = [];
  for (const elapsed of [1500, 4500]) {
    paint(mesh, sampleCivetPose('breathe', elapsed, ENABLED));
    const lift = restChest[1] - at(chest)[1]; breatheLifts.push(lift);
    if (!(lift >= .018 && lift <= .021)) findings.push('breathing chest lift is not readable/bounded');
  }
  paint(mesh, sampleCivetPose('strike', 448, ENABLED));
  const crouch = { noseBack: restNose[0] - at(nose)[0], shoulderDown: at(shoulder)[1] - restShoulder[1] };
  if (!(crouch.noseBack > .018 && crouch.shoulderDown > .010)) findings.push('anticipation does not crouch the chest and draw back the head');
  const legBends = legs.map((leg, i) => angleDifference(bend(at(leg[0]!), at(leg[1]!), at(leg[2]!)), restAngles[i]!));
  if (legBends.some(value => value <= .012)) findings.push('a visible limb has no knee/upper-joint flex');
  paint(mesh, sampleCivetPose('strike', 864, ENABLED));
  const thrust = { noseForward: at(nose)[0] - restNose[0], chestForward: at(chest)[0] - restChest[0] };
  if (!(thrust.noseForward > .025 && thrust.chestForward > .008)) findings.push('forward strike has no distinct head/chest thrust');
  const movedTail = tail.map(at), tailTravel = distance(movedTail[2]!, restTail[2]!);
  const tailBend = angleDifference(bend(...movedTail as [Point, Point, Point]), bend(...restTail as [Point, Point, Point]));
  if (!(tailTravel > .015 && tailBend > .025)) findings.push('low-left tail is frozen or moves as one rigid strip');
  const pawDrift = PAWS.map(([x0, x1]) => {
    const p: Point = [(x0 + x1) / 2 / 768, 405 / 512]; return distance(at(p), p);
  });
  // Interpolation includes stored Float32 UV rounding; compare to that baseline,
  // while the triangle sweep below requires bit-exact fixed support vertices.
  if (pawDrift.some(value => value > 6e-8)) findings.push('planted paw landmarks moved');
  return { findings, breatheLifts, crouch, thrust, legBends, tailTravel, tailBend, pawDrift };
}

function sweep(clip: ActiveClip, paint: Paint = applyCivetPose, sampleSpacing = 8) {
  const mesh = createCivetMesh(GENOME), rest = mesh.rest.slice(), uv = mesh.uvs.slice(), indices = mesh.indices.slice();
  let minArea = Infinity, maximumMotion = 0, supportDrift = 0, headStretch = 0;
  let badFinite = false, endpointChanged = false;
  const supports = [0, 0, 0, 0];
  const headA: Point = [.84, .31], headB: Point = [.94, .43];
  const originalHeadDistance = distance(landmark(mesh, ...headA), landmark(mesh, ...headB));
  const steps = Math.ceil(DURATIONS[clip] / sampleSpacing);
  for (let step = 0; step <= steps; step++) {
    paint(mesh, sampleCivetPose(clip, DURATIONS[clip] * step / steps, ENABLED));
    for (let i = 0; i < rest.length; i += 2) {
      badFinite ||= !Number.isFinite(mesh.vertices[i]) || !Number.isFinite(mesh.vertices[i + 1]);
      maximumMotion = Math.max(maximumMotion, Math.hypot(mesh.vertices[i]! - rest[i]!, mesh.vertices[i + 1]! - rest[i + 1]!));
      if (step === 0 || step === steps) endpointChanged ||= mesh.vertices[i] !== rest[i] || mesh.vertices[i + 1] !== rest[i + 1];
    }
    headStretch = Math.max(headStretch, Math.abs(distance(landmark(mesh, ...headA), landmark(mesh, ...headB)) - originalHeadDistance));
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i]! * 2, b = indices[i + 1]! * 2, c = indices[i + 2]! * 2;
      const area = ((mesh.vertices[b]! - mesh.vertices[a]!) * (mesh.vertices[c + 1]! - mesh.vertices[a + 1]!)
        - (mesh.vertices[b + 1]! - mesh.vertices[a + 1]!) * (mesh.vertices[c]! - mesh.vertices[a]!)) / 2;
      minArea = Math.min(minArea, area);
      const lowX = Math.min(rest[a]!, rest[b]!, rest[c]!), highX = Math.max(rest[a]!, rest[b]!, rest[c]!);
      const lowY = Math.min(rest[a + 1]!, rest[b + 1]!, rest[c + 1]!), highY = Math.max(rest[a + 1]!, rest[b + 1]!, rest[c + 1]!);
      for (let paw = 0; paw < PAWS.length; paw++) if (highX >= PAWS[paw]![0] / 768 && lowX <= PAWS[paw]![1] / 768 && highY >= 393 / 512 && lowY <= 415 / 512) {
        if (step === 0) supports[paw]!++;
        for (const vertex of [a, b, c]) supportDrift = Math.max(supportDrift,
          Math.hypot(mesh.vertices[vertex]! - rest[vertex]!, mesh.vertices[vertex + 1]! - rest[vertex + 1]!));
      }
    }
  }
  return { samples: steps + 1, minArea, maximumMotion, supportDrift, headStretch, badFinite, endpointChanged, supports,
    restUnchanged: mesh.rest.every((value, i) => value === rest[i]), uvUnchanged: mesh.uvs.every((value, i) => value === uv[i]),
    topologyUnchanged: mesh.indices.every((value, i) => value === indices[i]) };
}

describe('articulated Civet exact identity and owned capacity', () => {
  it('retains the independent complete identity and fixed connected mesh', () => {
    expect(CIVET_SOURCE_GENOME_JSON).toBe(JSON.stringify(GENOME)); expect(Object.keys(GENOME)).toHaveLength(29);
    const a = createCivetMesh(GENOME), b = createCivetMesh({ ...GENOME });
    expect(a.vertices.length).toBe(1617 * 2); expect(a.indices.length).toBe(3072 * 3);
    expect(new Set(a.indices).size).toBe(1617); expect(a.uvs).toEqual(a.rest); expect(a.vertices).toEqual(a.rest);
    expect(a.vertices.byteLength + a.rest.byteLength + a.uvs.byteLength + a.indices.byteLength + a.bones.byteLength).toBe(76248);
    expect(CIVET_CAPACITY.ownedTypedArrayBytes).toBe(76248);
    expect(new Set([a.vertices.buffer, a.rest.buffer, a.uvs.buffer, a.indices.buffer, a.bones.buffer,
      b.vertices.buffer, b.rest.buffer, b.uvs.buffer, b.indices.buffer, b.bones.buffer]).size).toBe(10);
  });
  it.each(Object.keys(GENOME))('refuses changed/missing field %s through the new factory', key => {
    const changed: Record<string, unknown> = { ...GENOME }, missing: Record<string, unknown> = { ...GENOME };
    const value = changed[key]; changed[key] = typeof value === 'number' ? value + 1 : typeof value === 'boolean' ? !value : String(value) + '!';
    delete missing[key];
    for (const item of [changed, missing]) { expect(isPaintedCivetIdentity(item)).toBe(false); expect(() => createCivetMesh(item)).toThrow(); }
  });
  it('rejects getter/hook identities without executing them', () => {
    const hook = vi.fn(() => GENOME), getter = { ...GENOME };
    Object.defineProperty(getter, 'seed', { get: hook, enumerable: true });
    for (const item of [getter, { ...GENOME, toJSON: hook }, { seed: GENOME.seed, _earthName: 'Civet' }, null]) expect(() => createCivetMesh(item)).toThrow();
    expect(hook).not.toHaveBeenCalled();
  });
});

describe('finite articulated action and motion policy', () => {
  it('provides two six-second breathing peaks and bounded action phases', () => {
    expect(CIVET_CLIP_MS).toEqual({ rest: 0, ...DURATIONS });
    for (const elapsed of [1500, 4500]) expect(sampleCivetPose('breathe', elapsed, ENABLED).breath).toBeCloseTo(1, 12);
    expect(sampleCivetPose('breathe', 3000, ENABLED).breath).toBeLessThan(1e-20);
    expect(sampleCivetPose('strike', 448, ENABLED).drive).toBeCloseTo(-.85, 12);
    expect(sampleCivetPose('strike', 864, ENABLED).drive).toBeCloseTo(1, 12);
    for (const [clip, duration] of Object.entries(DURATIONS) as [ActiveClip, number][]) {
      for (const elapsed of [0, duration, duration + 10, Number.MAX_VALUE]) expect(sampleCivetPose(clip, elapsed, ENABLED)).toEqual(REST);
      for (let i = 0; i <= 256; i++) {
        const pose = sampleCivetPose(clip, duration * i / 256, ENABLED);
        expect(Object.values(pose).every(Number.isFinite)).toBe(true);
        expect(pose.breath >= 0 && pose.breath <= 1 && Math.abs(pose.drive) <= 1 && Math.abs(pose.tail) <= 1).toBe(true);
      }
    }
  });
  it.each(['effectsOn', 'fullMotion', 'visible'] as const)('settles the actual mesh exactly when %s is false', flag => {
    const mesh = createCivetMesh(GENOME), buffers = [mesh.vertices.buffer, mesh.bones.buffer];
    for (const clip of Object.keys(DURATIONS) as ActiveClip[]) {
      applyCivetPose(mesh, sampleCivetPose(clip, DURATIONS[clip] * .27, ENABLED)); expect(mesh.vertices).not.toEqual(mesh.rest);
      applyCivetPose(mesh, sampleCivetPose(clip, DURATIONS[clip] * .54, { ...ENABLED, [flag]: false }));
      expect(mesh.vertices).toEqual(mesh.rest); expect([mesh.vertices.buffer, mesh.bones.buffer]).toEqual(buffers);
    }
  });
  it('rejects malformed samples/poses before changing output', () => {
    for (const elapsed of [-1, NaN, Infinity]) expect(() => sampleCivetPose('breathe', elapsed, ENABLED)).toThrow(TypeError);
    for (const clip of ['walk', '__proto__', 'constructor']) expect(() => sampleCivetPose(clip as CivetClip, 100, ENABLED)).toThrow(TypeError);
    const mesh = createCivetMesh(GENOME), before = mesh.vertices.slice();
    for (const pose of [{ breath: NaN, drive: 0, tail: 0 }, { breath: 0, drive: Infinity, tail: 0 },
      { breath: 0, drive: 0, tail: NaN }, { breath: 1.01, drive: 0, tail: 0 }, { breath: 0, drive: -1.01, tail: 0 }]) {
      expect(() => applyCivetPose(mesh, pose)).toThrow(TypeError); expect(mesh.vertices).toEqual(before);
    }
    expect(() => deformCivetPoint(NaN, .5, REST)).toThrow(TypeError);
  });
});

describe('observable articulation and fixed source contacts', () => {
  it('has readable breathing, anticipation/thrust, four limb bends and a curved low-left tail', () => {
    const result = phaseFindings(); expect(result.findings, JSON.stringify(result)).toEqual([]);
  });
  it.each(Object.keys(DURATIONS) as ActiveClip[])('keeps all triangles positive and every measured paw triangle fixed throughout %s', clip => {
    const report = sweep(clip);
    expect(report.badFinite, JSON.stringify(report)).toBe(false); expect(report.endpointChanged).toBe(false);
    expect(report.minArea, JSON.stringify(report)).toBeGreaterThan(0);
    expect(report.supports.every(count => count > 0)).toBe(true); expect(report.supportDrift).toBe(0);
    expect(report.headStretch).toBeLessThan(2e-7); expect(report.maximumMotion).toBeGreaterThan(.018); expect(report.maximumMotion).toBeLessThan(.14);
    expect(report.restUnchanged && report.uvUnchanged && report.topologyUnchanged).toBe(true);
  });
  it('makes the same triangle/support ruler reject collapsed triangles and moving paw vertices', () => {
    const accept = (report: ReturnType<typeof sweep>) => ({ unfolded: report.minArea > 0, planted: report.supportDrift === 0 });
    const clean = sweep('strike', applyCivetPose, 400); expect(accept(clean)).toEqual({ unfolded: true, planted: true });
    const collapsed = sweep('strike', (mesh, pose) => {
      applyCivetPose(mesh, pose); mesh.vertices[2] = mesh.vertices[0]!; mesh.vertices[3] = mesh.vertices[1]!;
    }, 400);
    expect(accept(collapsed).unfolded).toBe(false);
    const drifting = sweep('strike', (mesh, pose) => {
      applyCivetPose(mesh, pose); mesh.vertices[(25 * 49 + 18) * 2 + 1]! += .004;
    }, 400);
    expect(accept(drifting).planted).toBe(false);
    expect(accept(sweep('strike', applyCivetPose, 400))).toEqual({ unfolded: true, planted: true });
  });
  it('locks off-grid paw support while allowing the tail at the same height to move', () => {
    const pose = sampleCivetPose('strike', 864, ENABLED);
    for (const x of [1 / 3, .352, .45, .6, .713, 1]) for (const y of [.75, 393 / 512, .8, 1]) expect(deformCivetPoint(x, y, pose)).toEqual([x, y]);
    expect(distance(deformCivetPoint(.055, .765, pose), [.055, .765])).toBeGreaterThan(.015);
  });
  it('rejects frozen output, the former dead-tail strip and missing limb bends with the same landmark acceptor', () => {
    const controls: Array<{ name: string; paint: Paint; failure: string }> = [
      { name: 'constant rest', paint: mesh => mesh.vertices.set(mesh.rest), failure: 'breathing chest lift' },
      { name: 'frozen low-left tail', paint: (mesh, pose) => {
        applyCivetPose(mesh, pose); for (let i = 0; i < mesh.vertices.length; i += 2) if (mesh.rest[i]! < .30) { mesh.vertices[i] = mesh.rest[i]!; mesh.vertices[i + 1] = mesh.rest[i + 1]!; }
      }, failure: 'low-left tail' },
      { name: 'frozen limb region', paint: (mesh, pose) => {
        applyCivetPose(mesh, pose); for (let i = 0; i < mesh.vertices.length; i += 2) if (mesh.rest[i]! >= 1 / 3 && mesh.rest[i]! < .71 && mesh.rest[i + 1]! > .48) { mesh.vertices[i] = mesh.rest[i]!; mesh.vertices[i + 1] = mesh.rest[i + 1]!; }
      }, failure: 'visible limb' },
    ];
    expect(phaseFindings().findings).toEqual([]);
    for (const control of controls) {
      const result = phaseFindings(control.paint); expect(result.findings.some(finding => finding.includes(control.failure)), control.name + JSON.stringify(result)).toBe(true);
    }
    expect(phaseFindings().findings).toEqual([]);
  });
  it('restores exactly after repeated differing poses without reallocating or accumulating drift', () => {
    const mesh = createCivetMesh(GENOME), rest = mesh.rest.slice(), uv = mesh.uvs.slice(), buffers = [mesh.vertices.buffer, mesh.bones.buffer];
    const pose = sampleCivetPose('strike', 864, ENABLED); applyCivetPose(mesh, pose); const expected = mesh.vertices.slice();
    for (let n = 0; n < 8; n++) for (const clip of Object.keys(DURATIONS) as ActiveClip[]) applyCivetPose(mesh, sampleCivetPose(clip, DURATIONS[clip] * .28, ENABLED));
    applyCivetPose(mesh, pose); expect(mesh.vertices).toEqual(expected); applyCivetPose(mesh, REST);
    expect(mesh.vertices).toEqual(rest); expect(mesh.rest).toEqual(rest); expect(mesh.uvs).toEqual(uv); expect([mesh.vertices.buffer, mesh.bones.buffer]).toEqual(buffers);
  });
});
