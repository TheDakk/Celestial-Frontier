export type AnatomyPresence = {readonly schema:'cf.anatomy-presence/v1';readonly absent:readonly string[];readonly growth?:{readonly branches:number}} | {
 readonly schema:'cf.anatomy-presence/v2';readonly absent:readonly string[];
 readonly appendages?:{readonly arms:number;readonly feedingTentacles?:number};
 readonly hidden?:readonly string[];readonly growth?:{readonly branches:number};
};
export function resolveAnatomyInventory<T>(template:T,anatomy:AnatomyPresence|undefined):T;
