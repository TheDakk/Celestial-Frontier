/* AUTO-LIFTED VERBATIM audio stings from main.js @section audio [app] (v1.8.9):
   _sfxBus (13522-13522) · sfxOut (13525-13529) · applySfxGain (13530-13533) · playRaritySting (13700-13755) · playSurveyPing (13756-13772) · playWhoosh (13773-13795).
   body sha256/16 fdfa901072e3cfb8. ⚠ DO NOT EDIT. Regenerate: node tools/lift-audio.mjs
   Browser-only (Web Audio). Free identifiers ac/sndOn/sfxVol are the app
   seam — installed by index.ts initAudio(). */
let _sfxBus=null;
function sfxOut(a){
  /* every synth exits through one shared gain so a single slider rules them all */
  if(!_sfxBus){ _sfxBus=a.createGain(); _sfxBus.connect(a.destination); applySfxGain(); }
  return _sfxBus;
}
function applySfxGain(){
  /* squared taper: the slider tracks how loud it FEELS, not raw amplitude */
  try{ if(_sfxBus) _sfxBus.gain.setValueAtTime(sfxVol*sfxVol, _sfxBus.context.currentTime); }catch(_){}
}
function playRaritySting(tier){
  /* celestial tones: soft detuned sine pairs climbing a pentatonic ladder,
     airy harmonics above, and a deep drone beneath the rarest finds.
     The rarer the discovery, the further the constellation climbs and
     the longer it rings. */
  const a=ac(); if(!a || a.state!=='running') return;
  try{
    const t=a.currentTime+0.02;
    const root=196*Math.pow(2, tier/6);          /* G3, rising with rarity */
    const LADDER=[0,3,5,7,10,12,15,19];          /* open pentatonic climb */
    const steps=Math.min(2+tier, 8);
    const master=a.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.16, t+0.06);
    master.gain.exponentialRampToValueAtTime(0.0001, t+1.5+tier*0.28);
    master.connect(sfxOut(a));
    for(let i=0;i<steps;i++){
      const f=root*Math.pow(2, LADDER[i]/12);
      const t0=t+i*0.095;
      for(const det of [-5, 4]){                 /* detuned pair = shimmer */
        const o=a.createOscillator(), g=a.createGain();
        o.type='sine'; o.frequency.value=f; o.detune.value=det;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.085, t0+0.035);
        g.gain.exponentialRampToValueAtTime(0.0001, t0+1.0+tier*0.2);
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0+1.1+tier*0.22);
      }
      if(tier>=3){                               /* glassy harmonic two octaves up */
        const h=a.createOscillator(), gh=a.createGain();
        h.type='triangle'; h.frequency.value=f*4;
        gh.gain.setValueAtTime(0.0001, t0);
        gh.gain.exponentialRampToValueAtTime(0.016, t0+0.05);
        gh.gain.exponentialRampToValueAtTime(0.0001, t0+0.8);
        h.connect(gh); gh.connect(master);
        h.start(t0); h.stop(t0+0.9);
      }
    }
    if(tier>=5){                                 /* a slow fifth blooming above */
      const b=a.createOscillator(), gb=a.createGain();
      b.type='sine'; b.frequency.value=root*3;
      gb.gain.setValueAtTime(0.0001, t+0.3);
      gb.gain.exponentialRampToValueAtTime(0.035, t+0.7);
      gb.gain.exponentialRampToValueAtTime(0.0001, t+2.2);
      b.connect(gb); gb.connect(master); b.start(t+0.3); b.stop(t+2.3);
    }
    if(tier>=6){                                 /* the deep — a drone under one-of-ones */
      const d=a.createOscillator(), gd=a.createGain();
      d.type='sine'; d.frequency.value=root/2;
      gd.gain.setValueAtTime(0.0001, t);
      gd.gain.exponentialRampToValueAtTime(0.055, t+0.35);
      gd.gain.exponentialRampToValueAtTime(0.0001, t+2.8);
      d.connect(gd); gd.connect(master); d.start(t); d.stop(t+2.9);
    }
  }catch(_){}
}
function playSurveyPing(){
  /* the ACT of surveying answers back: one soft sonar blip on every tap-lock.
     Outcome sounds (discoveries, wins) stay the sting's business. */
  const a=ac(); if(!a || a.state!=='running') return;
  try{
    const t=a.currentTime+0.01;
    const o=a.createOscillator(), g=a.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(740, t);
    o.frequency.exponentialRampToValueAtTime(988, t+0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.28);
    o.connect(g); g.connect(sfxOut(a));
    o.start(t); o.stop(t+0.3);
  }catch(_){}
}
function playWhoosh(){
  /* travel & planetfall: a breath of filtered noise falling through a bandpass.
     Presentation-only, so Math.random here is fine (the domain ban guards
     GENERATION, not sound) — and no assets, per the single-file rule. */
  const a=ac(); if(!a || a.state!=='running') return;
  try{
    const t=a.currentTime+0.01, dur=0.55;
    const n=a.createBufferSource();
    const buf=a.createBuffer(1, Math.ceil(a.sampleRate*dur), a.sampleRate);
    const ch=buf.getChannelData(0);
    for(let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1;
    n.buffer=buf;
    const f=a.createBiquadFilter(); f.type='bandpass'; f.Q.value=0.9;
    f.frequency.setValueAtTime(2200, t);
    f.frequency.exponentialRampToValueAtTime(240, t+dur);
    const g=a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t+0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    n.connect(f); f.connect(g); g.connect(sfxOut(a));
    n.start(t); n.stop(t+dur+0.05);
  }catch(_){}
}
export { sfxOut, applySfxGain, playRaritySting, playSurveyPing, playWhoosh };
