import type {AnatomyPresence} from './anatomy-inventory.mjs';
export function representationRemoved(template:{id:string},anatomy:AnatomyPresence|undefined):string[];
export function representedPose<T extends Record<string,number>>(joints:T,anatomy:AnatomyPresence|undefined):T;
