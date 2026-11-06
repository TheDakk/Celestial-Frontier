import type {FamilyContract} from './family-contracts.mjs';
import type {AnatomyPresence} from './anatomy-inventory.mjs';
export function resolveHiddenPresence<T>(template:T,anatomy:AnatomyPresence|undefined):T;
export function inferHiddenLandmarks(template:FamilyContract,landmarks:Readonly<Record<string,readonly number[]>>):Record<string,number[]>;
export function checkHiddenLandmarks(template:FamilyContract,landmarks:Readonly<Record<string,readonly number[]>>):void;
export function requireVisiblePaintOwner(template:FamilyContract,joint:string):void;
