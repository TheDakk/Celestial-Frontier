import { describe,it,expect } from 'vitest';
import { validateAudioProductionCue,readProductionAudio,productionReviewCategory, type AudioProductionCue } from './audio-production-review.js';
import { chooseProductionAudio } from './audio-production-routing.js';
const cue: AudioProductionCue={id:'quadruped.call.1',group:'fictional-voices',kind:'synthetic_fictional',notes:'Not a species recording',
  previewUrl:'/__cf-audio-review/quadruped.call.1.wav',previewSha256:'a'.repeat(64),previewBytes:44,
  requirements:['family.quadruped.call'],layers:[{sourceId:'oga_creatures_1',sha256:'b'.repeat(64)}]};
describe('production audio intake and routing',()=>{
  it('routes combat and weather previews through their category, not the old UI fallback',()=>{
    for (const [group,id,expected] of [['ability-wild','ability.wild.impact.1','combat-gameplay'],['battle-ui','battle.hit.1','combat-gameplay'],['ambience-weather','weather.rain','ambience'],['music-original','music.calm','music'],['battle-ui','ui.click','ui']]) {
      expect(productionReviewCategory({group:group!,id:id!})).toBe(expected);
    }
    expect(productionReviewCategory({group:'ability-wild',id:'ability.wild.impact.1'})).not.toBe('ui');
  });
  it('accepts a local declared cue and refuses remote/traversal/oversized counterparts',()=>{
    expect(validateAudioProductionCue(cue)).toEqual(cue);
    for(const mutation of [{previewUrl:'https://example.com/voice.wav'},{id:'../secret',previewUrl:'/__cf-audio-review/../secret.wav'},
      {previewBytes:9_000_000},{previewSha256:'unknown'},{layers:[{sourceId:'untrusted/path',sha256:'b'.repeat(64)}]}]) {
      expect(()=>validateAudioProductionCue({...cue,...mutation})).toThrow();
    }
  });
  it('accepts exact recorded bytes but rejects a changed byte, truncation and oversized stream',async()=>{
    const bytes=new Uint8Array(44);bytes[0]=82;
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    const own={...cue,previewSha256:hash}; const signal=new AbortController().signal;
    expect(new Uint8Array(await readProductionAudio(new Response(bytes),own,signal))).toEqual(bytes);
    const changed=bytes.slice();changed[12]=1;
    await expect(readProductionAudio(new Response(changed),own,signal)).rejects.toThrow('hash');
    await expect(readProductionAudio(new Response(bytes.slice(1)),own,signal)).rejects.toThrow('truncated');
    await expect(readProductionAudio(new Response(new Uint8Array(45)),own,signal)).rejects.toThrow('size');
    const aborted=new AbortController();aborted.abort();
    await expect(readProductionAudio(new Response(bytes),own,aborted.signal)).rejects.toThrow();
  });
  it('never promotes an unapproved voice or borrows generic family coverage for a named species',()=>{
    const routes=[1,2,3].map(i=>({id:'quadruped.call.'+i,requirements:['family.quadruped.call'],approved:false}));
    expect(chooseProductionAudio(routes,'family.quadruped.call','creature-seed-42',0,null)).toBeNull();
    expect(chooseProductionAudio(routes,'earth.fauna.civet','civet',0,null,true)).toBeNull();
    const selected=chooseProductionAudio(routes,'family.quadruped.call','creature-seed-42',0,null,true)!;
    expect(chooseProductionAudio([...routes].reverse(),'family.quadruped.call','creature-seed-42',0,null,true)).toEqual(selected);
    expect(chooseProductionAudio(routes,'family.quadruped.call','creature-seed-42',1,selected.id,true)?.id).not.toBe(selected.id);
    expect(()=>chooseProductionAudio(routes,'family.quadruped.call','creature-seed-42',NaN,null,true)).toThrow();
    expect(()=>chooseProductionAudio([...routes,routes[0]!],'family.quadruped.call','seed',0,null,true)).toThrow('Duplicate');
  });
});
