/** Legacy review marks are anatomical-end vertices. They cannot certify the
 * explicit terminal-pad interpolation used by newer records. Reject that mode
 * before loading a rig or reporting contact results; absent records retain the
 * exact original object and continue through their existing admission path. */
export function assertLegacyContactObserver(record){
 if(record?.geometry&&Object.hasOwn(record.geometry,'contactPads'))
  throw Error('Legacy contact observer: terminal contact pads are unsupported; use a rendered terminal-pad observer');
 return record;
}
