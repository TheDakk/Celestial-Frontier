import type {FamilyContract} from './family-contracts.mjs';
export function checkFamilyGeometry(record:unknown,alpha?:Uint8Array):unknown;
export function measureFamilyBounds(template:FamilyContract,landmarks:Readonly<Record<string,readonly [number,number]>>):{boneLengths:Record<string,number>;measures:Record<string,number>};
export function sealFamilyRecord(input:unknown):Promise<any>;
export function admitFamilyRecord(record:unknown,cutoutBytes:Uint8Array,alpha?:Uint8Array):Promise<FamilyContract>;
