import { describe, expect, it, vi } from 'vitest';
import {
  CIVET_CLIP_MS, CIVET_COLUMNS, CIVET_ROWS, CIVET_SOURCE_GENOME_JSON,
  applyCivetPose, createCivetMesh, deformCivetPoint, isPaintedCivetIdentity, sampleCivetPose,
  type CivetClip, type CivetMeshData, type CivetPose,
} from '../tools/painted-creature/civet-rig.js';

// Independent original Earth epoch-0 fixture, retained in
// audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json. Do not derive this
// expected identity from the rig's exported serialization or shortened phenotype.
const canonical: Readonly<Record<string, unknown>> = Object.freeze({
  seed: 3212817920, kingdom: 'fauna', color: 14, form: 12, body: 13, loco: 6,
  trait: 14, size: 4, diet: 5, head: 5, limbs: 3, skin: 8, tail: 1, pattern: 0,
  eyes: 5, behavior: 9, habitat: 5, detail: 4, accent: 3, temper: 1, sense: 7,
  repro: 7, life: 5, metab: 4, lumin: true, gen: 0, heat: 1, _earthName: 'Civet', _cradle: 1,
});
const freshGenome = (): Record<string, unknown> => ({ ...canonical });
const REST: CivetPose = { breath: 0, drive: 0, tail: 0 };
const enabled = { effectsOn: true, fullMotion: true, visible: true } as const;
const clipDurations = { breathe: 4200, strike: 1000, recoil: 700 } as const;
type ActiveClip = keyof typeof clipDurations;
type Paint = (mesh: CivetMeshData, pose: CivetPose) => void;

function rejectGenome(value: unknown): void {
  expect(isPaintedCivetIdentity(value)).toBe(false);
  expect(() => createCivetMesh(value)).toThrow('unsupported painted Civet identity');
}

/** Measure rendered positions, not deformation weights or a claimed pose state.
 * The same acceptor judges the real renderer and all three deliberate faults.
 * Fixed study geometry: the lowest fifth stays planted, while two points in the
 * upper-right head retain their separation. These are normalized projection
 * constraints, not claims of anatomical/art quality or world-scale locomotion.
 */
function inspectGeometry(clip: ActiveClip, paint: Paint = applyCivetPose) {
  const mesh = createCivetMesh(freshGenome());
  const rest = mesh.rest.slice(), uvs = mesh.uvs.slice(), indices = mesh.indices.slice();
  const headA = (12 * 49 + 40) * 2, headB = (18 * 49 + 46) * 2;
  const headDistance = Math.hypot(rest[headA]! - rest[headB]!, rest[headA + 1]! - rest[headB + 1]!);
  let finite = true, fixedUVs = true, fixedRest = true, fixedTopology = true, endpointsRest = true;
  let maxPawDrift = 0, maxPawTriangleDrift = 0, maxHeadDistanceError = 0, minSignedArea = Infinity, maxDisplacement = 0;
  let minAreaAt = { elapsed: -1, triangle: -1 };
  // Cover the whole finite clip, including both endpoints, at <=4 ms spacing.
  const steps = Math.ceil(clipDurations[clip] / 4);
  for (let step = 0; step <= steps; step++) {
    const elapsed = clipDurations[clip] * step / steps;
    paint(mesh, sampleCivetPose(clip, elapsed, enabled));
    for (let i = 0; i < rest.length; i += 2) {
      const x = mesh.vertices[i]!, y = mesh.vertices[i + 1]!;
      finite &&= Number.isFinite(x) && Number.isFinite(y);
      fixedRest &&= mesh.rest[i] === rest[i] && mesh.rest[i + 1] === rest[i + 1];
      fixedUVs &&= mesh.uvs[i] === uvs[i] && mesh.uvs[i + 1] === uvs[i + 1];
      const displacement = Math.hypot(x - rest[i]!, y - rest[i + 1]!);
      maxDisplacement = Math.max(maxDisplacement, displacement);
      if (rest[i + 1]! >= .80) maxPawDrift = Math.max(maxPawDrift, displacement);
      if (step === 0 || step === steps) endpointsRest &&= x === rest[i] && y === rest[i + 1];
    }
    maxHeadDistanceError = Math.max(maxHeadDistanceError, Math.abs(Math.hypot(
      mesh.vertices[headA]! - mesh.vertices[headB]!,
      mesh.vertices[headA + 1]! - mesh.vertices[headB + 1]!,
    ) - headDistance));
    for (let i = 0; i < indices.length; i += 3) {
      fixedTopology &&= mesh.indices[i] === indices[i]
        && mesh.indices[i + 1] === indices[i + 1] && mesh.indices[i + 2] === indices[i + 2];
      const a = mesh.indices[i]! * 2, b = mesh.indices[i + 1]! * 2, c = mesh.indices[i + 2]! * 2;
      const area = ((mesh.vertices[b]! - mesh.vertices[a]!) * (mesh.vertices[c + 1]! - mesh.vertices[a + 1]!)
        - (mesh.vertices[b + 1]! - mesh.vertices[a + 1]!) * (mesh.vertices[c]! - mesh.vertices[a]!)) / 2;
      // Independent measured source paw strip; every vertex of an intersecting
      // triangle must remain fixed, including vertices above the strip itself.
      const ys = [rest[a + 1]!, rest[b + 1]!, rest[c + 1]!];
      if (Math.max(...ys) >= 393 / 512 && Math.min(...ys) <= 415 / 512) {
        for (const v of [a, b, c]) maxPawTriangleDrift = Math.max(maxPawTriangleDrift,
          Math.hypot(mesh.vertices[v]! - rest[v]!, mesh.vertices[v + 1]! - rest[v + 1]!));
      }
      finite &&= Number.isFinite(area);
      if (area < minSignedArea) { minSignedArea = area; minAreaAt = { elapsed, triangle: i / 3 }; }
    }
  }
  const findings: string[] = [];
  if (!finite) findings.push('non-finite position/area');
  if (!fixedUVs) findings.push('source UV changed');
  if (!fixedRest) findings.push('rest coordinates changed');
  if (!fixedTopology) findings.push('topology changed');
  if (!endpointsRest) findings.push('finite endpoint is not rest');
  if (maxPawDrift > 0) findings.push('planted point floated');
  if (maxPawTriangleDrift > 0) findings.push('paw triangle moved');
  if (maxHeadDistanceError > 2e-7) findings.push('rigid head stretched');
  if (!(minSignedArea > 0)) findings.push('triangle folded/collapsed');
  if (!(maxDisplacement > .001)) findings.push('active clip never moved');
  return { findings, samples: steps + 1, maxPawDrift, maxPawTriangleDrift, maxHeadDistanceError, minSignedArea,
    minAreaAt, maxDisplacement, finite, fixedUVs, fixedRest, fixedTopology, endpointsRest };
}

describe('one-view painted Civet exact identity', () => {
  it('admits the complete original genome without changing its data', () => {
    const genome = freshGenome(), before = JSON.stringify(genome);
    expect(CIVET_SOURCE_GENOME_JSON).toBe(JSON.stringify(canonical));
    expect(isPaintedCivetIdentity(canonical)).toBe(true);
    expect(isPaintedCivetIdentity(genome)).toBe(true);
    expect(createCivetMesh(genome).vertices.length).toBe(49 * 33 * 2);
    expect(JSON.stringify(genome)).toBe(before);
    expect(Object.keys(canonical)).toHaveLength(29);
  });

  it.each(Object.keys(canonical))('rejects a changed original field: %s', key => {
    const genome = freshGenome(), value = genome[key];
    genome[key] = typeof value === 'number' ? value + 1 : typeof value === 'boolean' ? !value : `${value}-changed`;
    rejectGenome(genome);
  });

  it.each(Object.keys(canonical))('rejects a missing original field: %s', key => {
    const genome = freshGenome(); delete genome[key]; rejectGenome(genome);
  });

  it.each(Object.keys(canonical))('rejects a hostile getter without reads: %s', key => {
    const genome = freshGenome();
    const getter = vi.fn(() => { throw new Error('hostile getter executed'); });
    Object.defineProperty(genome, key, { enumerable: true, configurable: true, get: getter });
    rejectGenome(genome);
    expect(getter).not.toHaveBeenCalled();
  });

  it('rejects unknown, shortened, hidden, symbolic and non-finite identities', () => {
    const hidden = freshGenome(); Object.defineProperty(hidden, 'hidden', { value: true });
    const symbolic = freshGenome(); Object.defineProperty(symbolic, Symbol('identity'), { value: true });
    const cyclic = freshGenome(); cyclic.loop = cyclic;
    for (const genome of [
      null, undefined, [], 'Civet', 3212817920, { seed: 3212817920, _earthName: 'Civet' },
      { ...canonical, unknown: true }, { ...canonical, _earthName: 'Platypus' },
      { ...canonical, gen: -0 }, { ...canonical, seed: NaN }, { ...canonical, seed: Infinity },
      hidden, symbolic, cyclic,
    ]) rejectGenome(genome);
  });

  it('rejects serialization hooks and inherited identities without executing them', () => {
    const hook = vi.fn(() => freshGenome());
    const own = freshGenome(); own.toJSON = hook;
    const getter = freshGenome();
    Object.defineProperty(getter, 'toJSON', { enumerable: true, get: hook });
    rejectGenome(own); rejectGenome(getter);
    rejectGenome(Object.assign(Object.create({ toJSON: hook }), canonical));
    rejectGenome(Object.create(canonical));
    expect(hook).not.toHaveBeenCalled();
  });
});

describe('finite painted Civet sample policy', () => {
  it('pins finite clip durations and exact rest before/after each active clip', () => {
    expect(CIVET_CLIP_MS).toEqual({ rest: 0, ...clipDurations });
    for (const [clip, duration] of Object.entries(clipDurations) as [ActiveClip, number][]) {
      for (const elapsed of [0, duration, duration + 1, duration * 1000]) {
        expect(sampleCivetPose(clip, elapsed, enabled)).toEqual(REST);
      }
      for (let step = 0; step <= 256; step++) {
        const pose = sampleCivetPose(clip, duration * step / 256, enabled);
        expect(Object.values(pose).every(Number.isFinite)).toBe(true);
        expect(pose.breath).toBeGreaterThanOrEqual(0); expect(pose.breath).toBeLessThanOrEqual(1);
        expect(Math.abs(pose.drive)).toBeLessThanOrEqual(1); expect(Math.abs(pose.tail)).toBeLessThanOrEqual(1);
      }
    }
    expect(sampleCivetPose('rest', Number.MAX_VALUE, enabled)).toEqual(REST);
  });

  it.each(['effectsOn', 'fullMotion', 'visible'] as const)('returns rest when %s is false', flag => {
    for (const [clip, duration] of Object.entries(clipDurations) as [ActiveClip, number][]) {
      const mesh = createCivetMesh(freshGenome());
      applyCivetPose(mesh, sampleCivetPose(clip, duration * .48, enabled));
      expect(mesh.vertices).not.toEqual(mesh.rest);
      for (const elapsed of [duration * .24, duration * .48, duration * .75]) {
        const stopped = sampleCivetPose(clip, elapsed, { ...enabled, [flag]: false });
        expect(stopped).toEqual(REST); applyCivetPose(mesh, stopped);
        expect(mesh.vertices).toEqual(mesh.rest);
      }
    }
  });

  it.each([NaN, Infinity, -Infinity, -1])('rejects invalid elapsed time %s', elapsed => {
    expect(() => sampleCivetPose('strike', elapsed, enabled)).toThrow(TypeError);
  });

  it.each(['walk', '', '__proto__', 'constructor'])('rejects unknown clip %s', clip => {
    expect(() => sampleCivetPose(clip as CivetClip, 100, enabled)).toThrow(TypeError);
  });

  it('rejects non-finite/out-of-range point inputs and deformation amplitudes', () => {
    for (const [x, y] of [[NaN, .5], [.5, Infinity], [-.01, .5], [1.01, .5], [.5, -.01], [.5, 1.01]]) {
      expect(() => deformCivetPoint(x!, y!, REST)).toThrow(TypeError);
    }
    for (const pose of [
      { breath: NaN, drive: 0, tail: 0 }, { breath: 0, drive: Infinity, tail: 0 },
      { breath: 0, drive: 0, tail: NaN }, { breath: -.01, drive: 0, tail: 0 },
      { breath: 1.01, drive: 0, tail: 0 }, { breath: 0, drive: -1.01, tail: 0 },
      { breath: 0, drive: 0, tail: 1.01 },
    ]) {
      expect(() => deformCivetPoint(.5, .5, pose)).toThrow(TypeError);
      const mesh = createCivetMesh(freshGenome()), before = mesh.vertices.slice();
      expect(() => applyCivetPose(mesh, pose)).toThrow(TypeError);
      expect(mesh.vertices).toEqual(before);
    }
  });
});

describe('connected painted Civet projection geometry', () => {
  it('allocates independent buffers with fixed source UVs and complete connected topology', () => {
    expect([CIVET_COLUMNS, CIVET_ROWS]).toEqual([48, 32]);
    const a = createCivetMesh(freshGenome()), b = createCivetMesh(freshGenome());
    expect(a.rest.length).toBe(49 * 33 * 2); expect(a.indices.length).toBe(48 * 32 * 6);
    expect(a.vertices).toEqual(a.rest); expect(a.uvs).toEqual(a.rest);
    expect(new Set([a.vertices.buffer, a.rest.buffer, a.uvs.buffer, b.vertices.buffer, b.rest.buffer, b.uvs.buffer]).size).toBe(6);
    expect(new Set(a.indices).size).toBe(49 * 33);
    for (let row = 0; row <= 32; row++) for (let column = 0; column <= 48; column++) {
      const i = (row * 49 + column) * 2;
      expect(a.uvs[i]).toBe(Math.fround(column / 48)); expect(a.uvs[i + 1]).toBe(Math.fround(row / 32));
    }
    expect(a.indices).toEqual(b.indices);
  });

  it.each(Object.keys(clipDurations) as ActiveClip[])('keeps every triangle positive, paws planted and head rigid throughout %s', clip => {
    const report = inspectGeometry(clip);
    expect(report.findings, JSON.stringify(report)).toEqual([]);
    expect(report.samples).toBe(Math.ceil(clipDurations[clip] / 4) + 1);
  });

  it('preserves exact off-grid planted points, including the contact boundary', () => {
    for (const pose of [{ breath: 1, drive: 1, tail: 1 }, { breath: 1, drive: -1, tail: -1 }, REST]) {
      for (const x of [0, .317, .449, .623, .771, 1]) for (const y of [.80, .827, .941, 1]) {
        expect(deformCivetPoint(x, y, pose)).toEqual([x, y]);
      }
    }
  });

  it('is repeatable after other poses and does not accumulate vertex/UV drift', () => {
    const mesh = createCivetMesh(freshGenome()), rest = mesh.rest.slice(), uvs = mesh.uvs.slice();
    for (const clip of Object.keys(clipDurations) as ActiveClip[]) {
      const expectedPose = sampleCivetPose(clip, clipDurations[clip] * .48, enabled);
      applyCivetPose(mesh, expectedPose); const expectedVertices = mesh.vertices.slice();
      for (let run = 0; run < 8; run++) {
        applyCivetPose(mesh, sampleCivetPose('recoil', 300 + run, enabled));
        const repeated = sampleCivetPose(clip, clipDurations[clip] * .48, enabled);
        expect(repeated).toEqual(expectedPose); applyCivetPose(mesh, repeated);
        expect(mesh.vertices).toEqual(expectedVertices);
        expect(mesh.rest).toEqual(rest); expect(mesh.uvs).toEqual(uvs);
      }
    }
    applyCivetPose(mesh, REST); expect(mesh.vertices).toEqual(rest);
  });

  it('rejects actual floating points with the same geometry acceptor', () => {
    const report = inspectGeometry('strike', (mesh, pose) => {
      applyCivetPose(mesh, pose);
      if (pose.drive) for (let i = 1; i < mesh.vertices.length; i += 2) mesh.vertices[i] = mesh.vertices[i]! - .01;
    });
    expect(report.findings).toEqual(['planted point floated', 'paw triangle moved']);
    expect(report.maxPawDrift).toBeGreaterThan(.009);
  });

  it('rejects sub-contact triangle motion even with exact planted sample points', () => {
    const report = inspectGeometry('strike', (mesh, pose) => {
      applyCivetPose(mesh, pose);
      if (pose.drive) for (let i = 1; i < mesh.vertices.length; i += 2) {
        if (mesh.rest[i] === 25 / 32) mesh.vertices[i] = mesh.vertices[i]! - .0001;
      }
    });
    expect(report.maxPawDrift).toBe(0);
    expect(report.findings).toEqual(['paw triangle moved']);
  });

  it('rejects an actual vertex fold with the same geometry acceptor', () => {
    const report = inspectGeometry('strike', (mesh, pose) => {
      applyCivetPose(mesh, pose);
      if (pose.drive) {
        const b = mesh.indices[1]! * 2, c = mesh.indices[2]! * 2;
        const x = mesh.vertices[b]!, y = mesh.vertices[b + 1]!;
        mesh.vertices[b] = mesh.vertices[c]!; mesh.vertices[b + 1] = mesh.vertices[c + 1]!;
        mesh.vertices[c] = x; mesh.vertices[c + 1] = y;
      }
    });
    expect(report.findings).toEqual(['triangle folded/collapsed']);
    expect(report.minSignedArea).toBeLessThan(0);
    expect(report.minAreaAt.elapsed).toBeGreaterThan(0);
  });

  it('rejects a constant-rest renderer with the same geometry acceptor', () => {
    const report = inspectGeometry('strike', mesh => { mesh.vertices.set(mesh.rest); });
    expect(report.findings).toEqual(['active clip never moved']);
    expect(report.maxDisplacement).toBe(0);
    expect(report.minSignedArea).toBeGreaterThan(0);
    expect(report.maxPawDrift).toBe(0);
  });
});
