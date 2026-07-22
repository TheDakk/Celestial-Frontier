// PROCEDURAL CHARACTERISTICS — BODY PLANS. Each row = one body-plan value
// (g.body % 16), 7 procedural (non-Earth) samples varying seed/size/colour.
// Full-size box-fit render, like the Earth catalog. Reveals the silhouette
// family each plan produces so we can do Earth-style morphology passes.
const PLANS = [
  '0 sturdy-limbed land grazer (limb gene sets count)', '1 armored crawler', '2 stilt-legged', '3 tentacled (ceph)',
  '4 serpentine', '5 segmented (many-legged)', '6 shelled', '7 winged',
  '8 crystalline-spined', '9 gelatinous', '10 tusked', '11 heavy-horned',
  '12 stilt-legged (b)', '13 squat', '14 winged (b)', '15 radial',
];
module.exports = {
  width: 8 * 168 + 220, height: PLANS.length * 150 + 30,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:(x._t||0)});
    const PLANS=${JSON.stringify(PLANS)};
    const W=${8 * 168 + 220}, H=${PLANS.length * 150 + 30};
    g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H);
    const SAMPLES=7, cw=150, ch=146, LBL=210;
    PLANS.forEach(function(label,p){
      const y=10+p*150;
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=40000+p*1009+s*263;
        const gen={seed:seed, kingdom:'fauna', color:(p*3+s*5)%17, accent:(p*7+s*3)%17,
          form:(p*5+s)%18, body:p, loco:(p+s*2)%13, trait:(p*11+s*4)%25, size:(s%5)+1,
          head:(p+s)%10, limbs:(p*2+s)%6, skin:(p+s)%9, tail:(p+s*2)%7, pattern:(p*3+s)%8,
          eyes:s%6, behavior:s%12, habitat:(p+s)%19, _t:(s%4)*2};
        const x=LBL+s*cw;
        g.fillStyle=(s%2)?'#0e1424':'#111a2e'; g.fillRect(x,y,cw-6,ch-6);
        try{ const G=hdGenesFor(gen); const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
          const T=140,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
          _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(cw-6-T)/2, y+2);
        }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR',x+6,y+40); }
      }
    });
  }`,
};
