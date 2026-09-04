/* Internal Arc 5 persistence bridge.

   The public acquisition root intentionally exposes only the V2 codec/read
   surface. Persistence imports this narrow subpath to derive and reconstruct
   the compact Arc 5 delta authority alongside an already-authorized Arc 4
   source successor; it does not expose general V2 writer constructors to the
   application. */
export {
  createOwnershipSourceProjectionSuccessorV2,
} from './model-v2.js';
export {
  EMPTY_OWNERSHIP_DELTA_JSON_V2,
  MAX_OWNERSHIP_DELTA_ROWS_V2,
  OWNERSHIP_DELTA_SCHEMA_V2,
  OWNERSHIP_DELTA_VERSION_V2,
  applyOwnershipDeltaV2,
  decodeOwnershipDeltaV2,
  deriveOwnershipDeltaSuccessorV2,
  deriveOwnershipDeltaV2,
  encodeOwnershipDeltaV2,
  ownershipDeltaDigestV2,
  ownershipDeltaMirrorV2,
} from './model-v2-delta.js';
export type {
  BredAcquisitionDeltaRowV2,
  BredCreatureLiveDeltaRowV2,
  BredCreatureTombstoneDeltaRowV2,
  OwnershipDeltaMirrorV2,
  OwnershipDeltaRowV2,
  OwnershipDeltaV2,
  ScoutOverrideDeltaRowV2,
  SourceCreatureLiveDeltaRowV2,
  SourceCreatureTombstoneDeltaRowV2,
  SourceSpecimenLiveDeltaRowV2,
  SourceSpecimenTombstoneDeltaRowV2,
} from './model-v2-delta.js';
