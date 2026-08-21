/* Environment-neutral protocol shared by the DOM app, browser-free tests and
   the dedicated species-art worker. Keep this file free of DOM/WebWorker
   ambient types: the two realms are typechecked as separate programs. */

export const SPECIES_ART_WORKER_REQUEST_SCHEMA = 'cf-v2-species-art-worker-request/v1' as const;
export const SPECIES_ART_WORKER_RESPONSE_SCHEMA = 'cf-v2-species-art-worker-response/v1' as const;

export type SpeciesArtRenderKind = 'thumb132' | 'portrait440';
export type SpeciesArtWorkerPhase =
  | 'import-start'
  | 'import-complete'
  | 'job-start'
  | 'render-complete'
  | 'encode-start'
  | 'encode-complete';

interface SpeciesArtWorkerIdentity {
  readonly documentToken: string;
  readonly producerEpoch: number;
  readonly workerInstanceId: number;
}

export interface SpeciesArtWorkerInitRequest extends SpeciesArtWorkerIdentity {
  readonly schema: typeof SPECIES_ART_WORKER_REQUEST_SCHEMA;
  readonly type: 'init';
}

export interface SpeciesArtWorkerRenderRequest extends SpeciesArtWorkerIdentity {
  readonly schema: typeof SPECIES_ART_WORKER_REQUEST_SCHEMA;
  readonly type: 'render';
  readonly jobId: number;
  readonly kind: SpeciesArtRenderKind;
  readonly key: string;
  readonly genome: Readonly<Record<string, unknown>>;
  readonly testFailureMessage?: string;
}

export type SpeciesArtWorkerRequest = SpeciesArtWorkerInitRequest | SpeciesArtWorkerRenderRequest;

interface SpeciesArtWorkerResponseIdentity extends SpeciesArtWorkerIdentity {
  readonly schema: typeof SPECIES_ART_WORKER_RESPONSE_SCHEMA;
}

export interface SpeciesArtWorkerReadyResponse extends SpeciesArtWorkerResponseIdentity {
  readonly type: 'ready';
}

export interface SpeciesArtWorkerPhaseResponse extends SpeciesArtWorkerResponseIdentity {
  readonly type: 'phase';
  readonly jobId: number;
  readonly kind: SpeciesArtRenderKind;
  readonly key: string;
  readonly phase: SpeciesArtWorkerPhase;
  readonly performanceNow: number;
}

export interface SpeciesArtWorkerResultResponse extends SpeciesArtWorkerResponseIdentity {
  readonly type: 'result';
  readonly jobId: number;
  readonly kind: SpeciesArtRenderKind;
  readonly key: string;
  readonly width: 132 | 440;
  readonly height: 132 | 440;
  readonly url: string;
  readonly encodedBytes: number;
  readonly pngBytes: number;
  readonly decodedPixels: number;
  readonly importDurationMs: number;
  readonly renderDurationMs: number;
  readonly encodeDurationMs: number;
}

export interface SpeciesArtWorkerErrorResponse extends SpeciesArtWorkerResponseIdentity {
  readonly type: 'error';
  readonly jobId: number | null;
  readonly kind: SpeciesArtRenderKind | null;
  readonly key: string | null;
  readonly stage: 'capability' | 'protocol' | 'import' | 'paint' | 'encode';
  readonly code: string;
  readonly message: string;
}

export type SpeciesArtWorkerResponse =
  | SpeciesArtWorkerReadyResponse
  | SpeciesArtWorkerPhaseResponse
  | SpeciesArtWorkerResultResponse
  | SpeciesArtWorkerErrorResponse;

const plainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const exactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
};

const boundedIdentity = (value: Record<string, unknown>): boolean =>
  typeof value.documentToken === 'string' && value.documentToken.length >= 1 && value.documentToken.length <= 160
  && Number.isSafeInteger(value.producerEpoch) && Number(value.producerEpoch) >= 1
  && Number.isSafeInteger(value.workerInstanceId) && Number(value.workerInstanceId) >= 1;

const renderKind = (value: unknown): value is SpeciesArtRenderKind =>
  value === 'thumb132' || value === 'portrait440';

const boundedJob = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 1;
const boundedKey = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 1 && value.length <= 256 * 1024;

export function validSpeciesArtWorkerRequest(value: unknown): value is SpeciesArtWorkerRequest {
  if (!plainObject(value) || value.schema !== SPECIES_ART_WORKER_REQUEST_SCHEMA || !boundedIdentity(value)) return false;
  if (value.type === 'init') {
    return exactKeys(value, ['schema', 'type', 'documentToken', 'producerEpoch', 'workerInstanceId']);
  }
  const hasTestFailure = Object.prototype.hasOwnProperty.call(value, 'testFailureMessage');
  return value.type === 'render'
    && exactKeys(value, [
      'schema', 'type', 'documentToken', 'producerEpoch', 'workerInstanceId',
      'jobId', 'kind', 'key', 'genome', ...(hasTestFailure ? ['testFailureMessage'] : []),
    ])
    && boundedJob(value.jobId)
    && renderKind(value.kind)
    && boundedKey(value.key)
    && plainObject(value.genome)
    && (!hasTestFailure || (typeof value.testFailureMessage === 'string'
      && value.testFailureMessage.length >= 1 && value.testFailureMessage.length <= 512));
}

const validResponseBase = (value: Record<string, unknown>): boolean =>
  value.schema === SPECIES_ART_WORKER_RESPONSE_SCHEMA && boundedIdentity(value);

export function validSpeciesArtWorkerResponse(value: unknown): value is SpeciesArtWorkerResponse {
  if (!plainObject(value) || !validResponseBase(value)) return false;
  if (value.type === 'ready') {
    return exactKeys(value, ['schema', 'type', 'documentToken', 'producerEpoch', 'workerInstanceId']);
  }
  if (value.type === 'phase') {
    return exactKeys(value, [
      'schema', 'type', 'documentToken', 'producerEpoch', 'workerInstanceId',
      'jobId', 'kind', 'key', 'phase', 'performanceNow',
    ])
      && boundedJob(value.jobId) && renderKind(value.kind) && boundedKey(value.key)
      && ['import-start', 'import-complete', 'job-start', 'render-complete', 'encode-start', 'encode-complete']
        .includes(String(value.phase))
      && Number.isFinite(value.performanceNow) && Number(value.performanceNow) >= 0;
  }
  if (value.type === 'result') {
    const expectedSize = value.kind === 'thumb132' ? 132 : value.kind === 'portrait440' ? 440 : null;
    return exactKeys(value, [
      'schema', 'type', 'documentToken', 'producerEpoch', 'workerInstanceId',
      'jobId', 'kind', 'key', 'width', 'height', 'url', 'encodedBytes', 'pngBytes',
      'decodedPixels', 'importDurationMs', 'renderDurationMs', 'encodeDurationMs',
    ])
      && boundedJob(value.jobId) && renderKind(value.kind) && boundedKey(value.key)
      && expectedSize !== null && value.width === expectedSize && value.height === expectedSize
      && typeof value.url === 'string' && value.url.startsWith('data:image/png;base64,')
      && value.url.length > 'data:image/png;base64,'.length
      && Number.isSafeInteger(value.encodedBytes) && Number(value.encodedBytes) > 0
      && Number.isSafeInteger(value.pngBytes) && Number(value.pngBytes) > 0
      && value.decodedPixels === expectedSize * expectedSize
      && [value.importDurationMs, value.renderDurationMs, value.encodeDurationMs]
        .every((duration) => Number.isFinite(duration) && Number(duration) >= 0);
  }
  return value.type === 'error'
    && exactKeys(value, [
      'schema', 'type', 'documentToken', 'producerEpoch', 'workerInstanceId',
      'jobId', 'kind', 'key', 'stage', 'code', 'message',
    ])
    && (value.jobId === null || boundedJob(value.jobId))
    && (value.kind === null || renderKind(value.kind))
    && (value.key === null || boundedKey(value.key))
    && ['capability', 'protocol', 'import', 'paint', 'encode'].includes(String(value.stage))
    && typeof value.code === 'string' && /^[a-z0-9-]{1,48}$/.test(value.code)
    && typeof value.message === 'string' && value.message.length >= 1 && value.message.length <= 512;
}

export function speciesArtWorkerIdentityMatches(
  response: SpeciesArtWorkerResponse,
  expected: SpeciesArtWorkerIdentity,
): boolean {
  return response.documentToken === expected.documentToken
    && response.producerEpoch === expected.producerEpoch
    && response.workerInstanceId === expected.workerInstanceId;
}
