export interface AnatomyPresence {readonly schema:'cf.anatomy-presence/v1';readonly absent:readonly string[];}
export function resolveAnatomyInventory<T>(template:T,anatomy:AnatomyPresence|undefined):T;
