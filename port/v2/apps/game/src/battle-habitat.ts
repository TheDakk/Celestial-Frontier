/** Physical battle placement, separate from rarity/sapience display realms.
 * This compiler never rerolls worlds, grants capabilities, or changes combat. */
import {habOf,locoOf} from '@cf/domain-speciestraits';
import {BIOME_PROFILES_V1,type BiomeProfileKeyV1} from '@cf/domain-biome-profile';
export type BattleMedium='ground'|'air'|'water';
export type PhysicalRealm='land'|'aerial'|'aquatic'|'amphibious'|'gas-giant';
export interface HabitatDeclaration {readonly realm:PhysicalRealm;readonly gait?:string;readonly source:string;readonly liquid?:string;}
export interface HabitatRecord {readonly template:{readonly id:string};readonly identity:{readonly earthName:string|null};readonly habitat?:HabitatDeclaration;}
export interface PhysicalHabitat {readonly realm:PhysicalRealm;readonly preferred:BattleMedium;readonly allowed:readonly BattleMedium[];readonly source:string;readonly liquid:string|null;}
const REALMS:readonly PhysicalRealm[]=['land','aerial','aquatic','amphibious','gas-giant'];
const KNOWN_EARTH:Readonly<Record<string,PhysicalRealm>>=Object.freeze({Civet:'land','Red Fox':'land',Fox:'land',Frog:'amphibious',Platypus:'amphibious',Pheasant:'aerial',Penguin:'amphibious',Ostrich:'land',Emu:'land',Cassowary:'land',Kiwi:'land',Kakapo:'land'});
const FAMILY:Readonly<Record<string,PhysicalRealm>>=Object.freeze({quadruped:'land',hopper:'amphibious','biped-bird':'aerial',fish:'aquatic',insect:'land',serpent:'land',arachnid:'land',radial:'aquatic','plant-woody':'land','plant-herb':'land',myriapod:'land',cephalopod:'aquatic','flyer-membrane':'aerial',primate:'land'});
export function resolvePhysicalHabitat(record:HabitatRecord,genome?:Readonly<Record<string,unknown>>):PhysicalHabitat{
 let realm:PhysicalRealm|undefined,source:string,liquid:string|null=null;
 if(record.habitat){const h=record.habitat;if(!REALMS.includes(h.realm)||!h.source?.trim())throw Error('Habitat: invalid source declaration');realm=h.realm;source=h.source;liquid=h.liquid??null;
 }else if(record.identity.earthName){realm=KNOWN_EARTH[record.identity.earthName];source='named Earth natural history';
 }else if(genome){
  if(genome.kingdom!==undefined&&genome.kingdom!=='fauna')throw Error('Habitat: non-fauna needs a source habitat declaration');
  // Read actual habitat/locomotion before classifyRealm's megafauna/sapience
  // labels can hide water/air. These accessors also route extremophile genes.
  const habitat=String(habOf(genome as never)),loco=String(locoOf(genome as never));
  realm=/cloud deck/.test(habitat)?'gas-giant':/swim|jet|current/.test(loco)||/ocean|reef|shallows|vent field|methane lake|ammonia-sea/.test(habitat)?'aquatic':/glid|float|drift/.test(loco)?'aerial':/wetland|delta|mangrove/.test(habitat)?'amphibious':FAMILY[record.template.id];
  liquid=/methane/.test(habitat)?'methane':/ammonia/.test(habitat)?'ammonia':null;source='source genome habitat/locomotion + resolved anatomy';
 }else{realm=FAMILY[record.template.id];source='resolved anatomy family';}
 if(!realm)throw Error('Habitat: unresolved physical realm; source declaration required');
 const allowed:readonly BattleMedium[]=realm==='aquatic'?['water']:realm==='aerial'||realm==='gas-giant'?['air']:realm==='amphibious'?['ground','water']:['ground'];
 return Object.freeze({realm,preferred:allowed[0]!,allowed:Object.freeze(allowed),source,liquid:allowed.includes('water')?(liquid??'water'):null});
}
export interface ArenaWorld {readonly key:string;readonly biome:BiomeProfileKeyV1;readonly seed:number;readonly solid:boolean;readonly atmosphere:boolean;readonly liquid:string|null;readonly surfaceWater:boolean;readonly signature:string;readonly cardHash:string;}
export interface HabitatBattleInput {readonly contextId:string;readonly seed:number;readonly round:number;readonly kind:'wild'|'guardian'|'duel';readonly home:ArenaWorld;readonly visitor:ArenaWorld;readonly left:PhysicalHabitat;readonly right:PhysicalHabitat;}
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
function checkWorld(w:ArenaWorld){if(!w?.key||!Object.hasOwn(BIOME_PROFILES_V1,w.biome)||!Number.isSafeInteger(w.seed)||typeof w.solid!=='boolean'||typeof w.atmosphere!=='boolean'||typeof w.surfaceWater!=='boolean'||!(w.liquid===null||typeof w.liquid==='string'&&w.liquid.length>0)||!w.cardHash)throw Error('Habitat: invalid source world');}
export function compileHabitatBattle(input:HabitatBattleInput){
 if(!input.contextId||!Number.isSafeInteger(input.seed)||!Number.isInteger(input.round)||input.round<0||!['wild','guardian','duel'].includes(input.kind))throw Error('Habitat: invalid battle context');checkWorld(input.home);checkWorld(input.visitor);
 const first=hash(input.contextId+':'+input.seed)%2,world=input.kind==='duel'&&((input.round+first)%2===1)?input.visitor:input.home;
 const seed=hash(JSON.stringify([input.contextId,input.seed,input.round,world.key,world.seed,world.cardHash])),available:BattleMedium[]=[];
 if(world.solid)available.push('ground');if(world.atmosphere)available.push('air');if(world.liquid)available.push('water');
 const select=(h:PhysicalHabitat)=>{const compatible=h.allowed.filter(m=>available.includes(m)&&(m!=='water'||h.liquid===world.liquid));return compatible.includes(h.preferred)?h.preferred:compatible[0];};
 const left=select(input.left),right=select(input.right);
 if(!left||!right)return {status:'UNSUPPORTED' as const,reason:'Selected home arena cannot support both organisms; no habitat or biome substitution',worldKey:world.key,seed};
 if((left==='water')!==(right==='water')&&!world.surfaceWater)return {status:'UNSUPPORTED' as const,reason:'No surface interface between this deep-water arena and the other medium',worldKey:world.key,seed};
 const surfaceY=.52,groundY=.86,band=(medium:BattleMedium)=>medium==='air'?{minY:.08,maxY:.46}:medium==='water'?{minY:.57,maxY:.86}:{minY:.64,maxY:groundY};
 return {status:'READY' as const,schema:'cf.battle-habitat/v1' as const,worldKey:world.key,biome:world.biome,cardHash:world.cardHash,signature:world.signature,seed,round:input.round,surfaceY,groundY,
  left:{medium:left,band:band(left),x:.30},right:{medium:right,band:band(right),x:.70},interaction:left===right?'same-medium' as const:'surface-ranged' as const,
  recipeKey:'habitat-v1-'+hash(JSON.stringify([seed,left,right,world])).toString(16)};
}
/** Place the entire painted bounding box, not just its root. No clipping a fish
 * at the waterline to hide a bad pose. Overlarge geometry must fail visibly. */
export function containHabitatBody(band:{minY:number;maxY:number},wantedCentreY:number,paintedHeight:number){
 if(![band.minY,band.maxY,wantedCentreY,paintedHeight].every(Number.isFinite)||paintedHeight<=0||band.minY<0||band.maxY>1||band.minY>=band.maxY||paintedHeight>band.maxY-band.minY)throw Error('Habitat: organism cannot fit its medium');
 return Math.max(band.minY+paintedHeight/2,Math.min(band.maxY-paintedHeight/2,wantedCentreY));
}
