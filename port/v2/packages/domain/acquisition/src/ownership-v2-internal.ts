/* Internal Arc 5 persistence bridge.

   The public acquisition root intentionally exposes only the V2 codec/read
   surface. Persistence imports this narrow subpath to advance a digest-only
   Arc 5 certificate alongside one already-authorized Arc 4 source successor;
   it does not expose the general V2 writer constructors to the application. */
export {
  createOwnershipSourceProjectionSuccessorV2,
} from './model-v2.js';
