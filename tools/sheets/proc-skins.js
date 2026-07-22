// PROCEDURAL CHARACTERISTICS — STRUCTURAL SKIN (v1.6 Batch 15). Each row fixes
// g.skin to one FA_SKIN material and shows 7 samples over a mid land body, so we
// can verify the skin gene now changes the MATERIAL LANGUAGE (scale rows / fur
// fringe / chitin bands / armour plates / warts / wet sheen / feathers / internal
// channels / crystal facets) — review §0.6, not just colour.
const SKINS = ['0 scaled','1 furred','2 chitinous','3 slick & wet','4 plated',
  '5 warty','6 feathered','7 translucent','8 crystalline'];
module.exports = {
  width: 8 * 168 + 240, height: SKINS.length * 152 + 30,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    const SKINS=${JSON.stringify(SKINS)};
    const W=${8 * 168 + 240}, H=${SKINS.length * 152 + 30};
    g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H);
    const SAMPLES=7, cw=150, ch=148, LBL=230;
    SKINS.forEach(function(label,sk){
      const y=10+sk*152;
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=73000+sk*1301+s*337;
        // hold a mid land body so SKIN is the variable; vary plan a little to prove it masks to any silhouette
        const gen={seed:seed, kingdom:'fauna', color:(sk*3+s*5)%17, accent:(sk*5+s*3)%17,
          form:(sk+s)%18, body:(s%3===0?0:(s%3===1?11:1)), loco:(s*2)%13, trait:(sk+s*4)%25, size:(s%4)+2,
          head:(s%2?0:7), limbs:(sk+s)%6, skin:sk, tail:(s)%7, pattern:(sk+s)%8,
          eyes:s%6, behavior:s%12, habitat:(sk+s)%19};
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
