export type FixedPivotMap=Readonly<Record<string,readonly [number,number]>>;
export interface FixedAttachmentDefinition {readonly id?:string;readonly anatomyModel?:string;readonly graph:ReadonlyArray<readonly [string,string]>;readonly legs?:readonly string[];readonly fixedPivots?:FixedPivotMap;}
export interface FixedAttachmentRecord {readonly geometry?:{readonly fixedAttachments?:Readonly<Record<string,readonly number[]>>;readonly width?:number;readonly height?:number};}
export function validateFixedPivots(definition:FixedAttachmentDefinition):FixedPivotMap|null;
export function resolveFixedAttachments<T extends FixedAttachmentDefinition>(definition:T,record:FixedAttachmentRecord,alpha?:Uint8Array):T&{readonly fixedPivots?:FixedPivotMap};
