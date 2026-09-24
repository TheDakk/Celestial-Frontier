export type AnatomyPresence = {readonly schema:'cf.anatomy-presence/v1';readonly absent:readonly string[];readonly growth?:{readonly branches:number}} | {
 readonly schema:'cf.anatomy-presence/v2';readonly absent:readonly string[];
 readonly appendages?:{readonly arms:number;readonly feedingTentacles?:number}|{readonly walkingLegPairs:number;readonly ultimateLegPairs:number};
 readonly hidden?:readonly string[];
 /** Declared painted legs folded against the body; omitted means []. Disjoint from hidden/absent. */
 readonly folded?:readonly string[];readonly growth?:{readonly branches:number};
};
export function resolveAnatomyInventory<T>(template:T,anatomy:AnatomyPresence|undefined):T;
