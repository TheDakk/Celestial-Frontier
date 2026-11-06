/** Source-request vocabulary only; selecting a family grants no painter admission. */
export interface SourceProfileSignature {readonly id?:string;readonly candidateTemplates?:readonly string[];}
export function sourceProfileFamily(profile:SourceProfileSignature|null|undefined,species:{readonly name?:string}|null|undefined):string|null;
export function sourceProfileLayout(profile:{readonly id:string;readonly candidateTemplates:readonly string[]},species:{readonly name:string;readonly mustRead:readonly string[];readonly note?:string}):{legs:number|null;accuracy:string;layout:string}|null;
