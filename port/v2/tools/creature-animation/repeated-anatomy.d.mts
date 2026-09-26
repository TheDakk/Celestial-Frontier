import type {AnatomyPresence} from './anatomy-inventory.mjs';
export type AppendageCounts = {readonly arms:number;readonly feedingTentacles:number}|{readonly walkingLegPairs:number;readonly ultimateLegPairs:number};
export function appendageCounts(id:string,anatomy:AnatomyPresence|undefined):AppendageCounts|null;
export function expandRepeatedAnatomy<T>(template:T,anatomy:AnatomyPresence|undefined):T;
