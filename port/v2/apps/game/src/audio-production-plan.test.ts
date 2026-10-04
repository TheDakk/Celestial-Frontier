import {describe,it,expect} from 'vitest';
import {BIOME_PROFILE_KEYS_V1,BIOME_PROFILES_V1} from '@cf/domain-biome-profile';
import {ABILITY_THEMES} from '@cf/domain-combatcore';
import {compileProductionVoice,compileProductionContact,compileProductionEnvironment,compileProductionAbility,
  compileProductionBattle,productionMusicTransition,PRODUCTION_FAMILIES,PRODUCTION_MATERIALS,PRODUCTION_SURFACES,
  PRODUCTION_MUSIC_STATES,PRODUCTION_COMBAT_ROLES,PRODUCTION_BIOME_BEDS,type ResolvedSoundBody} from './audio-production-plan.js';
const body:ResolvedSoundBody={seed:133,speciesVisualKey:'procedural:133',ownerId:'painter:quadruped',earthName:null,
  kingdom:'fauna',family:'quadruped',material:'translucent',size:'medium',medium:'air',recipeHash:'a'.repeat(64)};
describe('resolved production sound plans',()=>{
  it('keeps named Earth anatomy and authentic behavior outside fictional genome transformations',()=>{
    const named={...body,earthName:'Civet',material:'furred' as const};
    const a=compileProductionVoice(named,'call'),b=compileProductionVoice({...named,size:'titanic'},'call');
    expect(a.layers).toEqual(b.layers);expect(a.layers[0]?.requirement).toBe('earth.fauna.civet.call');
    expect(a.authenticity).toBe('species_source_required');expect(a.layers[0]?.rate).toBe(1);
    expect(compileProductionVoice(body,'call').layers[0]?.requirement).toBe('family.quadruped.call');
    expect(compileProductionVoice({...body,size:'tiny'},'call').layers[0]?.rate).toBeGreaterThan(compileProductionVoice({...body,size:'titanic'},'call').layers[0]!.rate);
    expect(compileProductionVoice(body,'call').layers[0]?.rate).toBe(compileProductionVoice(body,'hurt').layers[0]?.rate);
    expect(()=>compileProductionVoice({...body,recipeHash:'bad'},'call')).toThrow('hash');
  });
  it('uses the actually resolved material and separate contact/surface layers across the full declared vocabulary',()=>{
    for(const family of PRODUCTION_FAMILIES){
      const kingdom=family.startsWith('plant-')?'flora':family==='fungal'?'fungi':family==='microbe'?'microbe':'fauna';
      for(const material of PRODUCTION_MATERIALS)for(const surface of PRODUCTION_SURFACES){
        const p=compileProductionContact({...body,family,kingdom,material},surface,'land');
        expect(p.layers.map(l=>l.requirement)).toContain('material.'+material);
        expect(p.layers.map(l=>l.requirement)).toContain('movement.surface.'+surface);
        expect(p.layers.length).toBe(3);
      }
    }
    expect(compileProductionContact(body,'grass','step').layers[2]?.requirement).not.toBe('material.furred');
    expect(compileProductionContact(body,'grass','wingbeat').layers).toEqual([]);
    expect(compileProductionContact({...body,family:'biped-bird'},'grass','wingbeat').layers[0]?.requirement).toContain('wing-feather');
    expect(()=>compileProductionVoice({...body,family:'plant-herb'},'call')).toThrow('kingdom');
  });
  it('resolves every canonical biome and refuses terrestrial weather in water and vacuum',()=>{
    const card={worldKey:'world:133',seed:133,biome:'temperate' as const,weather:'rain',medium:'air' as const,timeOfDay:'day' as const};
    expect(compileProductionEnvironment(card).layers.map(l=>l.requirement)).toContain('environment.rain');
    for(const biome of BIOME_PROFILE_KEYS_V1){
      const result=compileProductionEnvironment({...card,biome,weather:BIOME_PROFILES_V1[biome].weather});
      expect(result.layers.length<=4).toBe(true);expect(result.accepted).toBe(false);
    }
    expect(compileProductionEnvironment({...card,medium:'water'}).layers.map(l=>l.requirement)).toEqual(['environment.underwater']);
    expect(compileProductionEnvironment({...card,medium:'vacuum'}).layers).toEqual([]);
    expect(Object.keys(PRODUCTION_BIOME_BEDS).sort()).toEqual([...BIOME_PROFILE_KEYS_V1].sort());
    // Failing old control: every unmapped gas world inherited the foliage bed.
    for(const biome of ['banded','ammonia','stormeye','hotglow'] as const){
      const requirements=compileProductionEnvironment({...card,biome}).layers.map(l=>l.requirement);
      expect(requirements).not.toContain('environment.foliage');
      expect(requirements.some(r=>r==='environment.pressure'||r==='environment.ice-cloud')).toBe(true);
    }
    expect(compileProductionEnvironment({...card,biome:'cratered',weather:'clear'}).layers).toEqual([]);
    expect(compileProductionEnvironment({...card,biome:'karst'}).layers[0]?.requirement).toBe('environment.cave');
    expect(compileProductionEnvironment({...card,biome:'glacier'}).layers[0]?.requirement).toBe('environment.glacier');
    expect(()=>compileProductionEnvironment({...card,weather:'invented'})).toThrow('weather');
    expect(()=>compileProductionEnvironment({...card,seed:NaN})).toThrow('seed');
  });
  it('covers actual combat families and ability roles without increasing primary loudness',()=>{
    for(const event of Object.keys(PRODUCTION_COMBAT_ROLES) as (keyof typeof PRODUCTION_COMBAT_ROLES)[])expect(compileProductionBattle(event,'settlement:133').layers).toHaveLength(1);
    for(const theme of Object.keys(ABILITY_THEMES)){
      for(const phase of ['cast','impact','sustain','release','shield','heal','tick'] as const)expect(compileProductionAbility(theme,phase,1,'battle:133').layers).toHaveLength(1);
      const a=compileProductionAbility(theme,'impact',1,'battle:133'),b=compileProductionAbility(theme,'impact',3,'battle:133');
      expect(b.layers).toHaveLength(3);expect(a.layers[0]?.gain).toBe(b.layers[0]?.gain);expect(b.layers[2]?.delayMs).toBe(170);
    }
    expect(()=>compileProductionAbility('unregistered','impact',1,'id')).toThrow('theme');
  });
  it('uses explicit musical transport, complementary fades and stable repeated evaluation',()=>{
    for(const from of PRODUCTION_MUSIC_STATES)for(const to of PRODUCTION_MUSIC_STATES){
      const p=productionMusicTransition(from,to,1300);
      expect(p.boundaryMs).toBeGreaterThanOrEqual(1300);
      for(const t of [0,p.boundaryMs,p.boundaryMs+500,p.boundaryMs+p.crossfadeMs]){
        const g=p.gains(t);expect(g[0]+g[1]).toBeCloseTo(1);expect(g).toEqual(p.gains(t));
      }
    }
    const p=productionMusicTransition('calm','battle',1300);
    expect(p.boundaryMs).toBe(3000);expect(p.gains(4500)).toEqual([0,1]);
    expect(()=>productionMusicTransition('calm','battle',NaN)).toThrow('transport');
  });
});
