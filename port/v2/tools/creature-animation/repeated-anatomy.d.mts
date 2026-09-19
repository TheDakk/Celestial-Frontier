import type {AnatomyPresence} from './anatomy-inventory.mjs';
export interface AppendageCounts {readonly arms:number;readonly feedingTentacles:number;}
export function appendageCounts(id:string,anatomy:AnatomyPresence|undefined):AppendageCounts|null;
export function expandRepeatedAnatomy<T>(template:T,anatomy:AnatomyPresence|undefined):T;
