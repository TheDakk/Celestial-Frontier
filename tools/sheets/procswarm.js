// v1.6 V3: a DENSE sweep of procedural (non-Earth) creatures to hunt mistakes.
// 60 creatures across a wide sample of the genome space, 10 cols x 6 rows.
module.exports = {
  width: 1500, height: 940,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:(x._t||0)});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1500,940);
    const COLS=10, ROWS=6, cw=148, ch=150;
    for(let i=0;i<COLS*ROWS;i++){
      const col=i%COLS, row=(i/COLS)|0;
      const gen={seed:12000+i*911, kingdom:'fauna', color:i%17, accent:(i*7+3)%17,
        form:(i*5)%18, body:(i*3+1)%16, loco:(i*2)%13, trait:(i*11)%25, size:(i%5)+1,
        head:i%10, limbs:i%6, skin:i%9, tail:i%7, pattern:(i*3)%8, eyes:i%6, behavior:i%12,
        habitat:i%19, _t:(i%4)*2};
      const x=8+col*cw, y=16+row*ch;
      g.fillStyle=(i%2)?'#0e1424':'#111a2e'; g.fillRect(x,y,cw-6,ch-8);
      try{ const G=hdGenesFor(gen); const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
        const T=138,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
        _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(cw-6-T)/2, y+2); }
      catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR', x+6, y+70); }
      g.fillStyle='#5c6488'; g.font='9px monospace';
      g.fillText('b'+gen.body+' f'+gen.form+' l'+gen.loco+' h'+gen.habitat, x+4, y+ch-14);
    }
  }`,
};
