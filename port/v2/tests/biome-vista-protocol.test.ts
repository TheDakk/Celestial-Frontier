import { describe, expect, it } from 'vitest';
import {
  BIOME_VISTA_WORKER_REQUEST_SCHEMA,
  BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
  validBiomeVistaWorkerRenderMessageV1,
  validBiomeVistaWorkerResponseV1,
} from '../apps/game/src/biome-vista-protocol.js';
import { BIOME_PROFILE_AUTHORITY_V1 } from '@cf/domain-biome-profile';

const environmentIdentity = {
  environmentFingerprint: 'cwe1:42:deadbeef',
  profileSchema: BIOME_PROFILE_AUTHORITY_V1.schema,
  profileDigest: BIOME_PROFILE_AUTHORITY_V1.digest,
};

const genericOptions = {
  seed: 1, era: 'town', pal: 'day', biome: 'land', wx: null, moons: 1,
  aurora: false, nightize: false, duskize: false, flora: true, water: 'liquid',
  genes: [{ bulk: 1.1, base: [100, 120, 140] }], floraGenes: [], ring: false,
  stc: '#fff3d1', herd: 1, aqua: 0, air: 0, wb: 'temperate', evt: null,
  titan: false, salt: 0,
};

const request = {
  schema: BIOME_VISTA_WORKER_REQUEST_SCHEMA,
  type: 'render',
  documentToken: 'doc-1', generation: 1,
  request: {
    worldKey: 'cf1-world-fixture', ...environmentIdentity,
    biomeKey: 'temperate', scene: 'generic',
    options: genericOptions,
  },
};

const gasOptions = {
  seed: 2, hue: 33.5, spot: true, ring: true, moons: 2, tod: 'twilight',
  aurora: true, air: 1, wb: 'stormeye', airGenes: [], aerFlora: [], evt: null,
  titan: false,
};

const requestFor = (biomeKey: string, scene: string, options: Record<string, unknown>) => ({
  ...request,
  request: { worldKey: 'cf1-world-fixture', ...environmentIdentity, biomeKey, scene, options },
});

describe('biome-vista worker protocol', () => {
  it('accepts the exact one-job request and transferable result envelopes', () => {
    expect(validBiomeVistaWorkerRenderMessageV1(request)).toBe(true);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('stormeye', 'gas', gasOptions))).toBe(true);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('stormeye', 'gas', {
      ...gasOptions, spotHue: 0,
    }))).toBe(true);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('abyssal', 'abyss', {
      seed: 3, aqua: 2, genes: [{ bulk: 1 }],
    }))).toBe(true);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('coral', 'reef', {
      seed: 4, genes: [],
    }))).toBe(true);
    expect(validBiomeVistaWorkerResponseV1({
      schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
      type: 'result', documentToken: 'doc-1', generation: 1,
      worldKey: 'cf1-world-fixture', ...environmentIdentity,
      biomeKey: 'temperate', scene: 'generic',
      width: 960, height: 430, bitmap: { width: 960, height: 430, close: () => undefined },
    })).toBe(true);
    expect(validBiomeVistaWorkerResponseV1({
      schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
      type: 'error', documentToken: 'doc-1', generation: 1,
      worldKey: 'cf1-world-fixture', ...environmentIdentity,
      message: 'expected failure',
    })).toBe(true);
  });

  it('rejects extra fields, stale dimensions, missing options and unbounded identities', () => {
    expect(validBiomeVistaWorkerRenderMessageV1({ ...request, extra: true })).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...request, request: { ...request.request, options: undefined },
    })).toBe(false);
    expect(validBiomeVistaWorkerResponseV1({
      schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
      type: 'result', documentToken: 'doc-1', generation: 1,
      worldKey: 'cf1-world-fixture', ...environmentIdentity,
      biomeKey: 'temperate', scene: 'generic',
      width: 512, height: 430, bitmap: {},
    })).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...request, documentToken: 'x'.repeat(161),
    })).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...request, request: { ...request.request, biomeKey: 'not-a-real-biome' },
    })).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...request,
      request: { ...request.request, environmentFingerprint: 'cwe1:42:DEADBEEF' },
    })).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...request,
      request: { ...request.request, profileSchema: 'cf.domain.biome-profile.v0' },
    })).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...request,
      request: { ...request.request, profileDigest: 'bpd1-stale' },
    })).toBe(false);
    for (const missing of ['wb', 'era', 'genes']) {
      const options = Object.fromEntries(
        Object.entries(genericOptions).filter(([key]) => key !== missing),
      );
      expect(validBiomeVistaWorkerRenderMessageV1(requestFor(
        'temperate', 'generic', options,
      )), missing).toBe(false);
    }
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('coral', 'reef', {
      seed: 4,
    }))).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('stormeye', 'gas', {
      ...gasOptions, spotHue: undefined,
    }))).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('stormeye', 'gas', {
      ...gasOptions, hue: Number.NaN,
    }))).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('temperate', 'generic', {
      ...genericOptions, genes: [{ bulk: Number.POSITIVE_INFINITY }],
    }))).toBe(false);
    expect(validBiomeVistaWorkerRenderMessageV1(requestFor('temperate', 'generic', {
      ...genericOptions, era: 'village',
    }))).toBe(false);
    expect(validBiomeVistaWorkerResponseV1({
      schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
      type: 'result', documentToken: 'doc-1', generation: 1,
      worldKey: 'cf1-world-fixture', ...environmentIdentity,
      biomeKey: 'temperate', scene: 'generic',
      width: 960, height: 430, bitmap: { width: 960, height: 430 },
    })).toBe(false);
    expect(validBiomeVistaWorkerResponseV1({
      schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
      type: 'error', documentToken: 'doc-1', generation: 1,
      worldKey: 'cf1-world-fixture', ...environmentIdentity,
      profileDigest: 'bpd1-stale', message: 'expected failure',
    })).toBe(false);
  });
});
