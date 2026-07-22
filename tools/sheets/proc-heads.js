// PROCEDURAL CHARACTERISTICS — HEAD DESCRIPTORS. Each row fixes g.head to one
// FA_HEAD descriptor (holding a standard quad body) and shows 7 samples. This
// ISOLATES what each head gene currently draws — revealing where the art still
// renders a generic head+one-eye instead of the descriptor (fangs, mandibles,
// frills, tendrils, multiple eyes) — the Earth-style pass opportunity.
const HEADS = ['0 blunt-snouted','1 beaked','2 eyeless & smooth','3 crested','4 mandibled',
  '5 tendril-fringed','6 horned','7 domed & bulbous','8 fanged','9 frilled'];
module.exports = {
  width: 8 * 168 + 240, height: HEADS.length * 152 + 30,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    const HEADS=${JSON.stringify(HEADS)};
    const W=${8 * 168 + 240}, H=${HEADS.length * 152 + 30};
    g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H);
    const SAMPLES=7, cw=150, ch=148, LBL=230;
    HEADS.forEach(function(label,hd){
      const y=10+hd*152;
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=52000+hd*1301+s*337;
        // hold a mid quad body so the HEAD is the variable; vary eyes to expose eye-count
        const gen={seed:seed, kingdom:'fauna', color:(hd*3+s*5)%17, accent:(hd*5+s*3)%17,
          form:(hd+s)%18, body:(s%2?0:11), loco:(s*2)%13, trait:(hd+s*4)%25, size:(s%4)+2,
          head:hd, limbs:(hd+s)%6, skin:(hd+s)%9, tail:(s)%7, pattern:(hd+s)%8,
          eyes:s%6, behavior:s%12, habitat:(hd+s)%19};
        const x=LBL+s*cw;
        g.fillStyle=(s%2)?'#0e1424':'#111a2e'; g.fillRect(x,y,cw-6,ch-6);
        try{ const G=hdGenesFor(gen); const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
          const T=142,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
          _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(cw-6-T)/2, y+2);
        }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR',x+6,y+40); }
      }
    });
  }`,
};
