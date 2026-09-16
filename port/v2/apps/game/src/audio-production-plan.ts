/** Candidate sound direction. Pure projections of resolved anatomy and settled facts.
 * No gameplay RNG, clock, audio context, asset acceptance, or inferred Earth anatomy. */
import {BIOME_PROFILES_V1, type BiomeProfileKeyV1} from '@cf/domain-biome-profile';
import {ABILITY_THEMES} from '@cf/domain-combatcore';
import type {CombatCueFamily} from '@cf/audio';

export const PRODUCTION_FAMILIES = ['quadruped','hopper','biped-bird','fish','insect','arachnid',
  'serpent','myriapod','radial','cephalopod','flyer-membrane','primate',
  'plant-woody','plant-herb','fungal','microbe'] as const;
export type ProductionFamily = typeof PRODUCTION_FAMILIES[number];
export const PRODUCTION_MATERIALS = ['furred','scaled','chitinous','slick and wet','plated','warty',
  'feathered','translucent','crystalline','foliage','wood','fungal','microbial'] as const;
export type ProductionMaterial = typeof PRODUCTION_MATERIALS[number];
export const PRODUCTION_SURFACES = ['soil','grass','leaves','wood','rock','sand','mud','snow','ice','water'] as const;
export type ProductionSurface = typeof PRODUCTION_SURFACES[number];
export type ProductionMedium = 'air'|'water'|'vacuum';
export type ProductionLayer = Readonly<{requirement:string;gain:number;rate:number;delayMs:number;
  role:'voice'|'contact'|'surface'|'material'|'weather'|'bed'|'ability'|'ui'|'music';loop:boolean;gainCurve?:readonly (readonly [number,number])[]}>;
export interface ProductionPlan {
  readonly schema:'cf.audio-production-plan/v2';readonly identity:string;
  readonly layers:readonly ProductionLayer[];readonly notes:readonly string[];
  readonly authenticity:'species_source_required'|'synthetic_fictional'|'environment_design'|'not_applicable';
  readonly accepted:false;
}
export interface ResolvedSoundBody {
  readonly seed:number;readonly speciesVisualKey:string;readonly ownerId:string;
  readonly earthName:string|null;readonly kingdom:'fauna'|'flora'|'fungi'|'microbe';
  readonly family:ProductionFamily;readonly material:ProductionMaterial;
  /** Authored/resolved acoustic size, not an Earth genome's unrelated size roll. */
  readonly size:'tiny'|'small'|'medium'|'large'|'massive'|'titanic';
  readonly medium:ProductionMedium;readonly recipeHash:string;
}
const need=(v:unknown,message:string):void=>{if(!v)throw new TypeError('Production audio: '+message);};
const slug=(s:string):string=>s.toLowerCase().replace(/[^a-z0-9]+/gu,'-').replace(/^-|-$/gu,'');
const hash=(s:string):number=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return n>>>0;};
const layer=(requirement:string,role:ProductionLayer['role'],gain:number,rate=1,delayMs=0,loop=false):ProductionLayer=>
  Object.freeze({requirement,role,gain,rate,delayMs,loop});
const plan=(identity:string,layers:ProductionLayer[],authenticity:ProductionPlan['authenticity'],notes:string[]=[]):ProductionPlan=>
  Object.freeze({schema:'cf.audio-production-plan/v2',identity,layers:Object.freeze(layers),notes:Object.freeze(notes),authenticity,accepted:false});

export function validateResolvedSoundBody(body:ResolvedSoundBody):void {
  need(body&&Number.isInteger(body.seed)&&body.seed>=0&&body.seed<=0xffffffff,'uint32 identity seed');
  need(typeof body.speciesVisualKey==='string'&&body.speciesVisualKey.length>0&&body.speciesVisualKey.length<=4096,'species identity');
  need(typeof body.ownerId==='string'&&body.ownerId.length>0&&body.ownerId.length<=192,'painter owner');
  need(/^[a-f0-9]{64}$/u.test(body.recipeHash),'resolved anatomy hash');
  need(PRODUCTION_FAMILIES.includes(body.family)&&PRODUCTION_MATERIALS.includes(body.material),'resolved family/material');
  need(['tiny','small','medium','large','massive','titanic'].includes(body.size),'resolved size');
  need(['air','water','vacuum'].includes(body.medium),'medium');
  need(['fauna','flora','fungi','microbe'].includes(body.kingdom),'kingdom');
  need(body.earthName===null||(typeof body.earthName==='string'&&body.earthName.length>0&&body.earthName.length<=128),'Earth identity');
  const botanical=body.family==='plant-woody'||body.family==='plant-herb';
  need((body.kingdom==='flora')===botanical&&(body.kingdom==='fungi')===(body.family==='fungal')
    &&(body.kingdom==='microbe')===(body.family==='microbe'),'kingdom/family disagreement');
}
export const PRODUCTION_VOICE_CUES = ['call','alert','attack-vocal','hurt','faint','victory','breath-idle','land-thud'] as const;
export function compileProductionVoice(body:ResolvedSoundBody,cue:typeof PRODUCTION_VOICE_CUES[number]):ProductionPlan {
  validateResolvedSoundBody(body);need(PRODUCTION_VOICE_CUES.includes(cue),'voice cue');
  const identity=JSON.stringify([body.speciesVisualKey,body.seed,body.recipeHash,cue]);
  if(body.medium==='vacuum')return plan(identity,[],'not_applicable',['No external acoustic transmission in vacuum; suit/UI/music remain separate.']);
  if(body.earthName!==null&&body.kingdom==='fauna')return plan(identity,
    [layer('earth.fauna.'+slug(body.earthName)+'.'+cue,'voice',.35)],'species_source_required',
    ['Missing authentic behavior stays a gap. Do not retime or substitute a family performance for a named Earth recording.']);
  const sizeRate={tiny:1.2,small:1.1,medium:1,large:.92,massive:.84,titanic:.78}[body.size];
  const identityRate=.985+(hash(JSON.stringify([body.speciesVisualKey,body.seed,'voice']))%301)/10000;
  const nonAnimal=body.kingdom!=='fauna';
  return plan(identity,[layer('family.'+body.family+'.'+cue,'voice',cue==='breath-idle'?.13:.32,sizeRate*identityRate)],
    'synthetic_fictional',[nonAnimal?'Explicit botanical/colony sonification, not a natural vocal recording.':
      'Fictional performance bank; rate changes pitch and speed together. Identity is fixed across behavior changes.']);
}
const CONTACTS:Record<ProductionFamily,string>={quadruped:'paw',hopper:'paw','biped-bird':'claw',fish:'fin',insect:'claw',
  arachnid:'claw',serpent:'body',myriapod:'claw',radial:'body',cephalopod:'tentacle','flyer-membrane':'claw',primate:'paw',
  'plant-woody':'root','plant-herb':'root',fungal:'body',microbe:'body'};
export type ProductionMovement = 'step'|'land'|'takeoff'|'wingbeat'|'jump'|'fall'|'bite'|'swipe'|'swim'|'burrow'|'slither'|'crawl';
export function compileProductionContact(body:ResolvedSoundBody,surface:ProductionSurface,event:ProductionMovement):ProductionPlan {
  validateResolvedSoundBody(body);need(PRODUCTION_SURFACES.includes(surface),'surface');
  need(['step','land','takeoff','wingbeat','jump','fall','bite','swipe','swim','burrow','slither','crawl'].includes(event),'movement');
  const identity=JSON.stringify([body.speciesVisualKey,body.seed,body.recipeHash,surface,event]);
  if(body.medium==='vacuum')return plan(identity,[],'not_applicable',['External contact sound has no transmission medium.']);
  if(event==='wingbeat'||event==='takeoff') {
    const wing=body.family==='biped-bird'?'wing-feather':body.family==='flyer-membrane'?'wing-membrane':body.family==='insect'?'wing-insect':null;
    return wing?plan(identity,[layer('movement.contact.'+wing,'contact',.28)],'synthetic_fictional'):
      plan(identity,[],'not_applicable',['Resolved family declares no wing; wing sound refused.']);
  }
  const wet=body.medium==='water'||event==='swim';
  const impact=event==='land'||event==='fall';
  return plan(identity,[layer('movement.contact.'+(wet?'fin':CONTACTS[body.family]),'contact',impact?.28:.16),
    layer('movement.surface.'+(wet?'water':surface),'surface',impact?.3:.2,1,12),
    layer('material.'+body.material,'material',impact?.15:.09,1,25)],'synthetic_fictional',
    ['Three separate contact, surface and body-material layers; no biological recording claim.']);
}

export interface ProductionEnvironment {
  readonly worldKey:string;readonly seed:number;readonly biome:BiomeProfileKeyV1;
  readonly weather:string;readonly medium:ProductionMedium;readonly timeOfDay:'day'|'night'|'twilight';
}
/** Exhaustive canonical profiles: a new biome cannot silently inherit forest cloth.
 * These are designed acoustic ingredients, not claims of recordings on alien worlds. */
export const PRODUCTION_BIOME_BEDS:Readonly<Record<BiomeProfileKeyV1,readonly [string,string?]>>=Object.freeze({
  temperate:['foliage'],savanna:['grass'],jungle:['canopy'],marsh:['wetland'],swamp:['wetland','foliage'],mangrove:['estuary'],
  tundra:['tundra'],karst:['cave'],saltflat:['salt'],fungal:['spore'],crystalsteppe:['crystal'],
  opensea:['coast'],archipelago:['coast','wind'],coral:['coast','reef'],stormsea:['coast'],volcisle:['coast','thermal'],
  abyssal:['underwater'],milksea:['coast','bioluminescent'],glacier:['glacier'],packice:['packice'],cryogeyser:['ice-jet'],blueice:['blueice'],
  dunesea:['dunes'],canyon:['canyon'],saltpan:['salt'],oxide:['dust'],glass:['glass'],cratered:['silence'],
  boulder:['rock'],graben:['fault'],geode:['crystal','cave'],carbon:['carbon'],sulfurdeck:['sulfur'],acidhaze:['acid'],
  abyssgreen:['pressure','thermal'],ashwaste:['ash'],emberfield:['embers'],obsidian:['glass','thermal'],magmasea:['magma'],
  banded:['pressure'],ammonia:['ice-cloud'],stormeye:['pressure'],hotglow:['thermal','pressure'],
});
export function compileProductionEnvironment(card:ProductionEnvironment):ProductionPlan {
  need(card&&Object.hasOwn(BIOME_PROFILES_V1,card.biome),'canonical biome');
  need(typeof card.worldKey==='string'&&card.worldKey.length>0&&card.worldKey.length<=256,'world identity');
  need(Number.isInteger(card.seed)&&card.seed>=0&&card.seed<=0xffffffff,'world seed');
  need(['air','water','vacuum'].includes(card.medium)&&['day','night','twilight'].includes(card.timeOfDay),'environment medium/time');
  const known=new Set([...Object.values(BIOME_PROFILES_V1).map(p=>p.weather),'rain','storm','snow','dust','sand','ice','clear','haze','ember','grey','twilight','night','day']);
  need(typeof card.weather==='string'&&known.has(card.weather),'registered weather');
  const identity=JSON.stringify(['environment',card.worldKey,card.seed,card.biome,card.weather,card.medium,card.timeOfDay]);
  if(card.medium==='vacuum'||card.weather==='airless'||card.biome==='cratered')return plan(identity,[],'not_applicable',['Airless environmental bed; music and suit audio are separate.']);
  if(card.medium==='water'||card.biome==='abyssal')return plan(identity,[layer('environment.underwater','bed',.16,1,0,true)],'environment_design',
    ['No above-water rain/wind or terrestrial wildlife below the surface.']);
  const [base,detail]=PRODUCTION_BIOME_BEDS[card.biome];
  const layers=[layer('environment.'+base,'bed',card.timeOfDay==='night'?.09:.14,1,0,true)];
  if(detail)layers.push(layer('environment.'+detail,'bed',.05,1,0,true));
  const weather=/rain|storm|squall|cyclone/u.test(card.weather)?'rain':/snow|cold|ice/u.test(card.weather)?'snow':/dust|sand|dry|ash/u.test(card.weather)?'dust':/wind|cloud/u.test(card.weather)?'wind':/steam|heat|haze|ember|sulfur|greenhouse/u.test(card.weather)?'thermal':null;
  if(weather)layers.push(layer('environment.'+weather,'weather',weather==='rain'?.18:.1,1,0,true));
  if(/storm|squall|cyclone/u.test(card.weather))layers.push(layer('environment.thunder','weather',.2,1,1600));
  return plan(identity,layers,'environment_design',['Wildlife requires a separate exact local species/context selection; none is invented from a biome name.']);
}

export const PRODUCTION_ABILITY_PHASES=['cast','impact','sustain','release','shield','heal','tick'] as const;
export function compileProductionAbility(theme:string,phase:typeof PRODUCTION_ABILITY_PHASES[number],magnitude:1|2|3,identity:string):ProductionPlan {
  need(Object.hasOwn(ABILITY_THEMES,theme),'registered ability theme');
  need(PRODUCTION_ABILITY_PHASES.includes(phase)&&[1,2,3].includes(magnitude)&&identity.length>0&&identity.length<=256,'ability projection');
  const layers=[layer('ability.'+theme+'.'+phase,'ability',.32,1,0,phase==='sustain')];
  // Larger attacks add later material events, rather than louder copies of the same strike.
  if(magnitude>=2&&phase==='impact')layers.push(layer('ability.'+theme+'.release','ability',.13,1,70));
  if(magnitude===3&&phase==='impact')layers.push(layer('ability.'+theme+'.tick','ability',.1,1,170));
  return plan(JSON.stringify([identity,theme,phase,magnitude]),layers,'synthetic_fictional');
}
export const PRODUCTION_COMBAT_ROLES:Readonly<Record<CombatCueFamily,string>>={
  'guardian-entrance':'alert',initiative:'ready',dodge:'miss','stun-skipped':'deny',damage:'impact',critical:'critical',
  'first-strike':'strike',execute:'heavy-impact',thorns:'recoil',lifesteal:'heal','stun-applied':'status',burn:'tick',regen:'heal',
  defeat:'defeat','guardian-phase':'alert',resolution:'resolve','guardian-victory':'victory','guardian-defeat':'defeat'};
export const PRODUCTION_SETTLED_CUES={selected:'call','feed-completed':'call','injury-applied':'hurt',
  'care-completed':'breath-idle','taming-succeeded':'victory','mission-returned':'alert'} as const;
export function compileProductionBattle(event:CombatCueFamily,identity:string):ProductionPlan {
  need(Object.hasOwn(PRODUCTION_COMBAT_ROLES,event)&&identity.length>0,'settled combat event');
  return plan(JSON.stringify([identity,event]),[layer('battle-role.'+PRODUCTION_COMBAT_ROLES[event],'ui',event==='critical'?.3:.2)],'not_applicable');
}
export const PRODUCTION_MUSIC_STATES=['menu','calm','wonder','tension','battle','major-battle','victory-discovery'] as const;
export type ProductionMusicState=typeof PRODUCTION_MUSIC_STATES[number];
/** Transport in caller-owned elapsed milliseconds. No scheduling from the wall clock. */
export function productionMusicTransition(from:ProductionMusicState,to:ProductionMusicState,elapsedMs:number) {
  need(PRODUCTION_MUSIC_STATES.includes(from)&&PRODUCTION_MUSIC_STATES.includes(to),'music state');
  need(Number.isFinite(elapsedMs)&&elapsedMs>=0,'music transport');
  const beatMs=from==='battle'||from==='major-battle'?500:750;
  const boundaryMs=Math.ceil(elapsedMs/(beatMs*4))*beatMs*4;
  return Object.freeze({from,to,boundaryMs,crossfadeMs:beatMs*2,unchanged:from===to,
    gains:(atMs:number):readonly [number,number]=>{need(Number.isFinite(atMs)&&atMs>=0,'transition transport');
      if(from===to)return [1,0];const t=Math.max(0,Math.min(1,(atMs-boundaryMs)/(beatMs*2)));return [1-t,t];}});
}


/** Eight-second review sequence; the transport controls musical boundaries, not the clock. */
export function compileProductionMusic(from:ProductionMusicState,to:ProductionMusicState):ProductionPlan {
  const t=productionMusicTransition(from,to,1300);
  if(from===to)return plan('music:'+from,[layer('music.'+from,'music',.3,1,0,true)],'synthetic_fictional');
  return plan('music:'+from+'->'+to,[
    {...layer('music.'+from,'music',.3,1,0,true),gainCurve:[[0,1],[t.boundaryMs,1],[t.boundaryMs+t.crossfadeMs,0]]},
    {...layer('music.'+to,'music',.3,1,t.boundaryMs,true),gainCurve:[[0,0],[t.boundaryMs,0],[t.boundaryMs+t.crossfadeMs,1]]},
  ],'synthetic_fictional',['Explicit musical bar boundary; complementary fades preserve mix headroom. Arrangement and seam quality remain unreviewed.']);
}
