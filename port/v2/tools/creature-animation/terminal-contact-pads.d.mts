import type {ContactChain} from './family-contracts.mjs';
export interface TerminalContactPads {
 readonly schema:'cf.terminal-pad-support/v1';
 readonly kind:'adhesive';
 readonly points:Readonly<Record<string,readonly [number,number]>>;
}
/** Undefined only when the record has no own geometry.contactPads declaration.
 * Alpha, when supplied, is an exact width*height source-alpha buffer; every
 * declared point must sample a positive byte, including retained alpha=1.
 * This validates source anchors only, not skin pinning or terrain clearance.
 */
export function validateTerminalContactPads(record:unknown,chains:readonly ContactChain[],alpha?:Uint8Array):TerminalContactPads|undefined;
