import type {SkeletonDefinition} from './skeleton-pose.mjs';
export interface FamilyContract extends SkeletonDefinition {
 readonly id:string;readonly version:number;readonly clipSetId:string;readonly joints:readonly string[];
 readonly legs:readonly string[];
 readonly limitsDeg:Readonly<Record<string,{min:number;max:number}>>;
 readonly bounds:ReadonlyArray<{id:string;min:number;max:number;kind:string;axis?:readonly [string,string];bones?:readonly string[]}>;
}
export const FAMILY_CONTRACTS:readonly FamilyContract[];
export function familyContract(id:string):FamilyContract;

export function familyContractForRecord(record:{readonly template:{readonly id:string};readonly anatomy?:import('./anatomy-inventory.mjs').AnatomyPresence}):FamilyContract;
