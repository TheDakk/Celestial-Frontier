// v1.7 WINGED PASS proof sheet — Nick's catalog flag: "gas fliers read as
// floating quads". Rows: plan 7 (winged pair) and plan 14 (four-winged), each
// AIRBORNE (loco=gliders → tucked 2-leg flight stance + dominant wings) and
// GROUNDED (full limb count kept — gryphon grammar). Review lens: an airborne
// winged creature must read FLIER at a glance — wings carry the silhouette,
// no quadruped stance; grounded winged still read winged-but-standing.
const ROWS = [
  ['plan 7 winged — AIRBORNE (flight stance)', 7, 3],
  ['plan 7 winged — grounded (keeps limbs)',   7, 0],
  ['plan 14 four-winged — AIRBORNE',           14, 3],
  ['plan 14 four-winged — grounded',           14, 0],
];
module.exports = {
  width: 8 * 168 + 300, height: ROWS.length * 152 + 30,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    const ROWS=${JSON.stringify(ROWS)};
    const W=${8 * 168 + 300}, H=${ROWS.length * 152 + 30};
    g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H);
    const SAMPLES=7, cw=150, ch=148, LBL=290;
    ROWS.forEach(function(row,ri){
      const y=10+ri*152;
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(row[0], 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=81000+ri*1409+s*373;
        const gen={seed:seed, kingdom:'fauna', color:(ri*3+s*5)%17, accent:(ri*5+s*3)%17,
          form:(ri+s)%18, body:row[1], loco:row[2], trait:(ri+s*4)%25, size:(s%4)+2,
          head:(s*3)%10, limbs:(ri+s)%6, skin:(s*2)%9, tail:s%7, pattern:(ri+s)%8,
          eyes:s%6, behavior:s%12, habitat:(row[2]===3?12:(ri+s)%10)};
        const x=LBL+s*cw;
        g.fillStyle=(s%2)?'#0e1424':'#111a2e'; g.fillRect(x,y,cw-6,ch-6);
        try{ const G=hdGenesFor(gen); const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
          const T=142,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
          _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(cw-6-T)/2, y+2);
        }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText(String(e).slice(0,20),x+6,y+40); }
      }
    });
  }`,
};
