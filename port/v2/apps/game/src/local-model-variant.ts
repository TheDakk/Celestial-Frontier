/** Detached browser derivation of the existing exact Q8 block32 variant.
 * No network, model selection, UI or inference. The caller supplies the existing
 * verified delivery owner and an exclusive, quota-admitted new storage transaction.
 * Original model Blobs are immutable and are never written. */
import { PINNED_LOCAL_MODEL_MANIFEST_V1 as MODEL } from './local-model-manifest.js';
import type { LocalModelDeliveryV1, LocalModelFileV1 } from './local-model-delivery.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';

export const LOCAL_MODEL_VARIANT_PLAN_SHA256_V1 = '26263980f6dce7f3578a904aa9fe64649530e43797bfc94a0ddb8b2a3aaace81';
export const LOCAL_MODEL_VARIANT_FILES_V1: readonly LocalModelFileV1[] = Object.freeze([
  Object.freeze({ path: 'transformer-q8-block32.onnx', bytes: 4_991_273,
    sha256: 'cda0a0e0d2778f83236557bcde8d474fed89a2fcbc817ea04f4758d2a064aed8' }),
  Object.freeze({ path: 'repacked-scale-zero.data', bytes: 347_332_608,
    sha256: '5ba0370ea1eb7af85042aea2a143398990d87759efaf5f36857ad019ce066d82' }),
]);
const VARIANT = 'q8-block32-repacked-v1', READ_CHUNK = 65_536, MAX_GRAPH = 8 * 1024 * 1024;
const PAYLOAD_BYTES = 352_323_881, MARKER_BUDGET = 65_536;
const encoder = new TextEncoder();
const digest = (bytes: Uint8Array): string => new LocalModelSha256V1().update(bytes).digestHex();
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const integer = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
interface GraphPatch { readonly offset: number; readonly remove: number; readonly hex: string }
interface ParameterRange { readonly source: string; readonly offset: number; readonly length: number;
  readonly width: 1 | 2; readonly outputOffset: number }
export interface LocalModelVariantPlanV1 {
  readonly schema: 'cf.local-model-variant-plan.v1'; readonly variant: typeof VARIANT;
  readonly parent: { readonly modelId: string; readonly revision: string; readonly sourceManifestSha256: string;
    readonly graph: LocalModelFileV1; readonly shards: readonly LocalModelFileV1[] };
  readonly files: readonly LocalModelFileV1[]; readonly patches: readonly GraphPatch[];
  readonly ranges: readonly ParameterRange[]; readonly qualityAccepted: false; readonly deviceQualified: false;
}
export interface LocalModelVariantReadyV1 {
  readonly schema: 'cf.local-model-variant-ready.v1'; readonly variant: typeof VARIANT;
  readonly planSha256: string; readonly parentManifestSha256: string; readonly parentAttemptId: string;
  readonly sourceManifestSha256: string; readonly files: readonly LocalModelFileV1[];
  readonly payloadBytes: number; readonly qualityAccepted: false; readonly deviceQualified: false;
}
export interface LocalModelVariantTransactionV1 {
  /** Sequential append only. Copy into bounded owned staging before resolving;
   * seal must persist every byte before any readiness publication. */
  write(path: string, offset: number, bytes: Uint8Array<ArrayBuffer>): Promise<void>;
  seal(path: string): Promise<void>;
  open(path: string): Promise<Blob>;
  /** Atomically publish only this new transaction's marker, then allow exact readback. */
  commit(marker: LocalModelVariantReadyV1): Promise<void>;
  readReady(): Promise<unknown>;
  /** Release the successful exclusive lease after final marker/cancellation checks.
   * Failure must retain abort authority. No asynchronous work follows success release. */
  finish(): Promise<void>;
  /** Revoke only this transaction's readiness, including after a failed commit/readback.
   * Preserve diagnostic partial bytes; never change parent or another ready variant. */
  abort(): Promise<void>;
}
export interface LocalModelVariantStorageV1 {
  /** Owner must hold its exclusive lock through commit/abort, refuse existing output,
   * and reserve additional payload + marker budget against all actual origin usage.
   * Estimates are advisory; real quota/write failures still reject. */
  begin(request: { payloadBytes: number; markerBudgetBytes: number; planSha256: string;
    parentManifestSha256: string; parentAttemptId: string }, signal: AbortSignal): Promise<LocalModelVariantTransactionV1>;
}
export interface LocalModelVariantProgressV1 {
  readonly phase: 'graph' | 'parameters' | 'verifying'; readonly writtenPayloadBytes: number;
  readonly verifiedPayloadBytes: number; readonly totalPayloadBytes: number;
}
function freezeTree<T>(value: T): T {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) freezeTree(item); Object.freeze(value); }
  return value;
}

/** Exact literal plan bytes are pinned independently of any caller-provided metadata. */
export function admitLocalModelVariantPlanV1(planJson: string): LocalModelVariantPlanV1 {
  requireValue(typeof planJson === 'string' && planJson.length <= 524_288, 'Variant plan size');
  const bytes = encoder.encode(planJson);
  requireValue(bytes.length <= 524_288 && digest(bytes) === LOCAL_MODEL_VARIANT_PLAN_SHA256_V1, 'Variant plan SHA');
  const plan = JSON.parse(planJson) as LocalModelVariantPlanV1;
  const graph = MODEL.files.find(row => row.path === 'transformer_q8.onnx')!;
  const shards = MODEL.files.filter(row => /^transformer_q8-\d{5}\.data$/.test(row.path));
  requireValue(plan.schema === 'cf.local-model-variant-plan.v1' && plan.variant === VARIANT
    && plan.qualityAccepted === false && plan.deviceQualified === false
    && same(plan.parent, { modelId: MODEL.modelId, revision: MODEL.revision,
      sourceManifestSha256: MODEL.sourceManifestSha256, graph, shards })
    && same(plan.files, LOCAL_MODEL_VARIANT_FILES_V1), 'Variant pinned model identity');
  requireValue(Array.isArray(plan.patches) && plan.patches.length === 413
    && Array.isArray(plan.ranges) && plan.ranges.length === 206, 'Variant plan geometry');
  let offset = 0;
  for (const row of plan.ranges) {
    const source = shards.find(file => file.path === row.source);
    requireValue(source && integer(row.offset) && integer(row.length) && row.length > 0
      && (row.width === 1 || row.width === 2) && row.offset % row.width === 0 && row.length % row.width === 0
      && row.offset + row.length <= source.bytes && row.outputOffset === offset, 'Variant parameter range');
    offset += row.length * 4;
  }
  requireValue(offset === LOCAL_MODEL_VARIANT_FILES_V1[1]!.bytes, 'Variant parameter byte count');
  return freezeTree(plan);
}

/** Pure byte helpers are separately testable; neither can publish readiness. */
export function applyVariantGraphPatchesV1(source: Uint8Array, patches: readonly GraphPatch[], targetBytes: number): Uint8Array<ArrayBuffer> {
  requireValue(source instanceof Uint8Array && source.length <= MAX_GRAPH && integer(targetBytes)
    && targetBytes > 0 && targetBytes <= MAX_GRAPH && Array.isArray(patches) && patches.length <= 512, 'Graph patch bounds');
  let previous = 0, predicted = source.length, literalBytes = 0;
  for (const patch of patches) {
    requireValue(integer(patch.offset) && integer(patch.remove) && patch.offset >= previous
      && patch.offset + patch.remove <= source.length && typeof patch.hex === 'string'
      && patch.hex.length <= 131_072 && patch.hex.length % 2 === 0 && /^[a-f0-9]*$/.test(patch.hex), 'Invalid graph patch');
    previous = patch.offset + patch.remove; literalBytes += patch.hex.length / 2;
    predicted += patch.hex.length / 2 - patch.remove;
  }
  requireValue(predicted === targetBytes && literalBytes <= 262_144, 'Graph patch output size');
  const output = new Uint8Array(targetBytes); let from = 0, to = 0;
  for (const patch of patches) {
    output.set(source.subarray(from, patch.offset), to); to += patch.offset - from;
    for (let i = 0; i < patch.hex.length; i += 2) output[to++] = Number.parseInt(patch.hex.slice(i, i + 2), 16);
    from = patch.offset + patch.remove;
  }
  output.set(source.subarray(from), to); return output;
}
export function expandVariantOperandsV1(source: Uint8Array, width: 1 | 2): Uint8Array<ArrayBuffer> {
  requireValue(source instanceof Uint8Array && source.length <= READ_CHUNK
    && (width === 1 || width === 2) && source.length % width === 0, 'Variant operand chunk');
  const output = new Uint8Array(source.length * 4);
  for (let at = 0; at < source.length; at += width) {
    for (let repeat = 0; repeat < 4; repeat++) for (let byte = 0; byte < width; byte++) {
      output[at * 4 + repeat * width + byte] = source[at + byte]!;
    }
  }
  return output;
}


const checkSignal = (signal: AbortSignal): void => {
  if (signal.aborted) throw new DOMException('Variant derivation canceled', 'AbortError');
};
/** Stream one operand range; this helper has no storage/readiness authority. */
export async function streamVariantParameterRangeV1(source: Blob, row: ParameterRange, signal: AbortSignal,
  consume: (offset: number, bytes: Uint8Array<ArrayBuffer>) => Promise<void>): Promise<number> {
  requireValue(source instanceof Blob && integer(row.offset) && integer(row.length) && row.length > 0
    && integer(row.outputOffset) && (row.width === 1 || row.width === 2)
    && row.offset % row.width === 0 && row.length % row.width === 0
    && row.offset + row.length <= source.size, 'Variant source range');
  let written = 0;
  for (let offset = 0; offset < row.length; offset += READ_CHUNK) {
    checkSignal(signal); const length = Math.min(READ_CHUNK, row.length - offset);
    const bytes = new Uint8Array(await source.slice(row.offset + offset, row.offset + offset + length).arrayBuffer());
    checkSignal(signal); requireValue(bytes.length === length, 'Variant source slice truncated');
    const expanded = expandVariantOperandsV1(bytes, row.width);
    await consume(row.outputOffset + offset * 4, expanded); checkSignal(signal); written += expanded.length;
  }
  return written;
}
export async function verifyVariantBlobV1(blob: Blob, expected: LocalModelFileV1, signal: AbortSignal,
  onChunk: (bytes: number) => void = () => {}): Promise<void> {
  requireValue(blob instanceof Blob && blob.size === expected.bytes, 'Variant output readback size');
  const readback = new LocalModelSha256V1();
  for (let offset = 0; offset < blob.size; offset += READ_CHUNK) {
    checkSignal(signal); const bytes = new Uint8Array(await blob.slice(offset, offset + READ_CHUNK).arrayBuffer());
    checkSignal(signal); requireValue(bytes.length === Math.min(READ_CHUNK, blob.size - offset), 'Variant output readback truncated');
    readback.update(bytes); onChunk(bytes.length);
  }
  checkSignal(signal); requireValue(readback.digestHex() === expected.sha256, 'Variant output readback SHA');
}


/** Storage primitive shared by real derivation and tiny exact-byte outcome controls.
 * This does not admit a model/plan or choose a runtime. The public derivation owner
 * supplies its admitted marker; the producer can append bytes but cannot publish it. */
export async function runVerifiedVariantTransactionV1(options: {
  readonly marker: LocalModelVariantReadyV1; readonly storage: LocalModelVariantStorageV1;
  readonly signal: AbortSignal; readonly check?: () => void;
  readonly produce: (append: (path: string, offset: number, bytes: Uint8Array<ArrayBuffer>) => Promise<void>) => Promise<void>;
  readonly onProgress?: (progress: LocalModelVariantProgressV1) => void;
}): Promise<{ readonly writtenPayloadBytes: number; readonly verifiedPayloadBytes: number }> {
  const marker = freezeTree(JSON.parse(JSON.stringify(options.marker)) as LocalModelVariantReadyV1);
  const files = marker.files;
  requireValue(Array.isArray(files) && files.length > 0 && files.length <= 2
    && files.every(file => /^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(file.path)
      && integer(file.bytes) && file.bytes > 0 && /^[a-f0-9]{64}$/.test(file.sha256))
    && new Set(files.map(file => file.path)).size === files.length
    && files.reduce((sum, file) => sum + file.bytes, 0) === marker.payloadBytes
    && integer(marker.payloadBytes) && marker.payloadBytes <= PAYLOAD_BYTES
    && encoder.encode(JSON.stringify(marker)).length <= MARKER_BUDGET, 'Variant transaction manifest');
  const check = (): void => { checkSignal(options.signal); options.check?.(); };
  let transaction: LocalModelVariantTransactionV1 | null = null;
  let writtenPayloadBytes = 0, verifiedPayloadBytes = 0, index = 0, fileOffset = 0;
  let writeHash = new LocalModelSha256V1();
  const report = (phase: LocalModelVariantProgressV1['phase']): void => options.onProgress?.({ phase,
    writtenPayloadBytes, verifiedPayloadBytes, totalPayloadBytes: marker.payloadBytes });
  try {
    check(); transaction = await options.storage.begin({ payloadBytes: marker.payloadBytes, markerBudgetBytes: MARKER_BUDGET,
      planSha256: marker.planSha256, parentManifestSha256: marker.parentManifestSha256,
      parentAttemptId: marker.parentAttemptId }, options.signal); check();
    await options.produce(async (path, offset, chunk) => {
      check(); const file = files[index];
      requireValue(file && path === file.path && offset === fileOffset && chunk instanceof Uint8Array
        && chunk.length > 0 && chunk.length <= READ_CHUNK * 4 && offset + chunk.length <= file.bytes, 'Variant sequential write');
      writeHash.update(chunk); await transaction!.write(path, offset, chunk); check();
      fileOffset += chunk.length; writtenPayloadBytes += chunk.length;
      if (fileOffset === file.bytes) {
        requireValue(writeHash.digestHex() === file.sha256, 'Variant parameter output SHA');
        await transaction!.seal(path); check(); index++; fileOffset = 0; writeHash = new LocalModelSha256V1();
        report(index === 1 ? 'graph' : 'parameters');
      }
    }); check();
    requireValue(index === files.length && fileOffset === 0 && writtenPayloadBytes === marker.payloadBytes, 'Variant incomplete output');
    for (const file of files) {
      const blob = await transaction.open(file.path); check();
      await verifyVariantBlobV1(blob, file, options.signal, bytes => { check(); verifiedPayloadBytes += bytes; });
      check(); report('verifying');
    }
    await transaction.commit(marker); check();
    const retainedMarker = await transaction.readReady(); check();
    requireValue(same(retainedMarker, marker), 'Variant readiness readback mismatch');
    check(); await transaction.finish();
    // Successful release is the final boundary. No later await/check can revoke an
    // already released lease or turn a concurrent subsequent cancellation into failure.
    return Object.freeze({ writtenPayloadBytes, verifiedPayloadBytes });
  } catch (error) {
    if (transaction) {
      try { await transaction.abort(); }
      catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Variant failed and owned readiness cleanup failed'); }
    }
    throw error;
  }
}

export async function deriveLocalModelVariantV1(options: {
  readonly planJson: string; readonly parent: Pick<LocalModelDeliveryV1, 'manifest' | 'manifestSha256' | 'status' | 'openFile'>;
  readonly storage: LocalModelVariantStorageV1; readonly signal: AbortSignal;
  readonly onProgress?: (progress: LocalModelVariantProgressV1) => void;
}): Promise<{ readonly status: 'ready'; readonly marker: LocalModelVariantReadyV1;
  readonly writtenPayloadBytes: number; readonly verifiedPayloadBytes: number }> {
  const plan = admitLocalModelVariantPlanV1(options.planJson), parent = options.parent;
  const parentManifestSha256 = digest(encoder.encode(JSON.stringify(MODEL)));
  requireValue(same(parent.manifest, MODEL) && parent.manifestSha256 === parentManifestSha256, 'Variant parent manifest');
  const parentAttemptId = parent.status().attemptId;
  requireValue(typeof parentAttemptId === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(parentAttemptId), 'Variant parent attempt');
  const check = (): void => {
    if (options.signal.aborted) throw new DOMException('Variant derivation canceled', 'AbortError');
    const status = parent.status();
    requireValue(parent.manifestSha256 === parentManifestSha256 && status.manifestSha256 === parentManifestSha256
      && status.ready && status.phase === 'ready' && status.error === null && status.attemptId === parentAttemptId
      && status.totalBytes === MODEL.totalBytes && status.verifiedBytes === MODEL.totalBytes
      && status.verifiedFiles === MODEL.files.length && status.totalFiles === MODEL.files.length, 'Variant parent is not verified');
  };
  check();
  const sources = new Map<string, Blob>();
  for (const file of [plan.parent.graph, ...plan.parent.shards]) {
    const blob = await parent.openFile(file.path); check();
    requireValue(blob instanceof Blob && blob.size === file.bytes, 'Variant parent Blob size'); sources.set(file.path, blob);
  }
  const original = new Uint8Array(await sources.get(plan.parent.graph.path)!.arrayBuffer()); check();
  requireValue(digest(original) === plan.parent.graph.sha256, 'Variant parent graph SHA');
  const graph = applyVariantGraphPatchesV1(original, plan.patches, plan.files[0]!.bytes);
  requireValue(digest(graph) === plan.files[0]!.sha256, 'Variant derived graph SHA'); check();
  const marker: LocalModelVariantReadyV1 = freezeTree({ schema: 'cf.local-model-variant-ready.v1', variant: VARIANT,
    planSha256: LOCAL_MODEL_VARIANT_PLAN_SHA256_V1, parentManifestSha256, parentAttemptId,
    sourceManifestSha256: MODEL.sourceManifestSha256, files: plan.files, payloadBytes: PAYLOAD_BYTES,
    qualityAccepted: false, deviceQualified: false });
  const counts = await runVerifiedVariantTransactionV1({ marker, storage: options.storage, signal: options.signal,
    check, ...(options.onProgress ? { onProgress: options.onProgress } : {}),
    produce: async append => {
      const graphFile = plan.files[0]!, dataFile = plan.files[1]!;
      for (let offset = 0; offset < graph.length; offset += READ_CHUNK) {
        check(); await append(graphFile.path, offset, graph.slice(offset, Math.min(graph.length, offset + READ_CHUNK))); check();
      }
      for (const row of plan.ranges) {
        await streamVariantParameterRangeV1(sources.get(row.source)!, row, options.signal,
          (offset, expanded) => append(dataFile.path, offset, expanded)); check();
      }
    } });
  return Object.freeze({ status: 'ready', marker, ...counts });
}
