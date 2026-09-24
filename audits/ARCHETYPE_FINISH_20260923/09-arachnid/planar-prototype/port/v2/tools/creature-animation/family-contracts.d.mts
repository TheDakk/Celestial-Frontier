import type {SkeletonDefinition} from './skeleton-pose.mjs';
export interface FamilyContract extends SkeletonDefinition {
 readonly id:string;readonly version:number;readonly clipSetId:string;readonly joints:readonly string[];
 readonly legs:readonly string[];readonly hiddenChains?:readonly string[];readonly hiddenJoints?:readonly string[];
 readonly contactStance?:{readonly default:'all'|'hind'|'none';readonly hind?:readonly string[];readonly rootAccommodation?:'planar';readonly gaits?:Readonly<Record<string,'alternating'|'bounding'>>;readonly travel?:Readonly<Record<string,'source-steps'>>;readonly actions:Readonly<Record<string,'all'|'hind'|'none'>>};
 readonly limitsDeg:Readonly<Record<string,{min:number;max:number}>>;
 readonly contactLimitsDeg?:Readonly<Record<string,{min:number;max:number}>>;
 readonly bounds:ReadonlyArray<{id:string;min:number;max:number;kind:string;axis?:readonly [string,string];bones?:readonly string[]}>;
}
export const FAMILY_CONTRACTS:readonly FamilyContract[];
export function familyContract(id:string):FamilyContract;
export function contactStanceForAction(template:Pick<FamilyContract,'contactStance'>,actionId:string):'all'|'hind'|'none';

export function familyContractForRecord(record:{readonly template:{readonly id:string};readonly anatomy?:import('./anatomy-inventory.mjs').AnatomyPresence}):FamilyContract;

export interface ContactChain {readonly id:string;readonly hip:string;readonly knee:string;readonly end:string;readonly terminal:string|null;readonly group:number;}
export function familyContactChains(template:FamilyContract):readonly ContactChain[];
