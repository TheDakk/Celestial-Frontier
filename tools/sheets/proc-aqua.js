// HABITAT-PRESERVE (v1.6 Batch 15, review §0.5). Each row forces an AQUATIC
// habitat onto a body plan that has defining anatomy, to verify the swimmer
// KEEPS its identity (shell-backed / mineral-plated / tusked / horned / benthic)
// instead of collapsing into a plain fish.
const ROWS = [
  { label:'6 shelled -> shell-backed swimmer',  body:6 },
  { label:'8 crystalline -> mineral-plated',    body:8 },
  { label:'10 tusked -> tusked marine hunter',  body:10 },
  { label:'11 horned -> horned cranial swimmer',body:11 },
  { label:'13 squat -> heavy benthic crawler',  body:13 },
  { label:'0 grazer -> plain pursuit swimmer',  body:0 },
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
    g.fillStyle='#08131c'; g.fillRect(0,0,W,H);
    const SAMPLES=7, cw=150, ch=148, LBL=290;
    ROWS.forEach(function(row,ri){
      const y=10+ri*152;
      g.fillStyle='#8fb2c8'; g.font='12px monospace'; g.fillText(row.label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=81000+ri*1301+s*337;
        // habitat 10 = open ocean, loco 4 = swimmers -> forces the aquatic branch of _procFamily
        const gen={seed:seed, kingdom:'fauna', color:(ri*3+s*5)%17, accent:(ri*5+s*3)%17,
          form:(ri+s)%18, body:row.body, loco:4, trait:(ri+s*4)%25, size:(s%4)+2,
          head:(s%2?0:6), limbs:(ri+s)%6, skin:(ri+s)%9, tail:(s)%7, pattern:(ri+s)%8,
          eyes:s%6, behavior:s%12, habitat:10};
        const x=LBL+s*cw;
        g.fillStyle=(s%2)?'#0b1a26':'#0e2130'; g.fillRect(x,y,cw-6,ch-6);
        try{ const G=hdGenesFor(gen); const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
          const T=142,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
          _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(cw-6-T)/2, y+2);
        }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR',x+6,y+40); }
      }
    });
  }`,
};
