import type {FamilyContract} from './family-contracts.mjs';
export type SpecializedTemplateId='brachyuran'|'bivalve'|'gastropod'|'annelid'|'crustacean-clawed'|'crustacean-small'|'sessile-filter'|'colonial-filter'|'barnacle'|'lobopod'|'xiphosuran'|'larva';
export interface SpecializedTemplate extends FamilyContract {
 readonly id:SpecializedTemplateId;readonly version:1;
 readonly roles:Readonly<Record<string,readonly string[]>>;readonly gaits:readonly string[];
 readonly anchored:boolean;readonly rigid:readonly string[];readonly optional:Readonly<Record<string,readonly string[]>>;
 readonly secondaryChains:readonly {id:string;driver:string;joints:readonly string[]}[];
}
export const SPECIALIZED_TEMPLATES:Readonly<Record<SpecializedTemplateId,SpecializedTemplate>>;
export function specializedTemplate(id:string):SpecializedTemplate|null;
