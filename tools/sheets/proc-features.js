// PROCEDURAL CHARACTERISTICS — TAILS, TRAITS, EYES, LIMBS, SKINS. Each row
// isolates one descriptor axis so we can see what currently renders vs. what
// is only text (whip/finned/spiked/stinger tails; crystal-antler / single-horn
// / armored-crest / humped traits; 1/2/4/6/8 eyes; 0/2/4/6/8 limb pairs; skins).
const ROWS = [
  { kind:'tail',  label:'TAIL 1 whip-like',   set:{tail:1} },
  { kind:'tail',  label:'TAIL 2 finned',      set:{tail:2} },
  { kind:'tail',  label:'TAIL 3 spiked',      set:{tail:3} },
  { kind:'tail',  label:'TAIL 4 prehensile',  set:{tail:4} },
  { kind:'tail',  label:'TAIL 5 plumed',      set:{tail:5} },
  { kind:'tail',  label:'TAIL 6 stinger',     set:{tail:6} },
  { kind:'trait', label:'TRAIT crystal antlers', set:{trait:11} },
  { kind:'trait', label:'TRAIT single curved horn', set:{trait:24} },
  { kind:'trait', label:'TRAIT armored crest-plates', set:{trait:15} },
  { kind:'trait', label:'TRAIT humped water-store', set:{trait:17} },
  { kind:'trait', label:'TRAIT whip-like tails', set:{trait:13} },
  { kind:'eyes',  label:'EYES 1',  set:{eyes:4} },
  { kind:'eyes',  label:'EYES 4',  set:{eyes:1} },
  { kind:'eyes',  label:'EYES 8',  set:{eyes:3} },
  { kind:'limbs', label:'LIMB pairs 6', set:{limbs:2} },
  { kind:'limbs', label:'LIMB pairs 8', set:{limbs:3} },
  { kind:'skin',  label:'SKIN crystalline', set:{skin:8} },
  { kind:'skin',  label:'SKIN plated', set:{skin:4} },
];
module.exports = {
  width: 8 * 168 + 250, height: ROWS.length * 150 + 30,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    const ROWS=${JSON.stringify(ROWS)};
    const W=${8 * 168 + 250}, H=${ROWS.length * 150 + 30};
    g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H);
    const SAMPLES=7, cw=150, ch=146, LBL=240;
    ROWS.forEach(function(row,ri){
      const y=10+ri*150;
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(row.label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=61000+ri*1097+s*419;
        const gen={seed:seed, kingdom:'fauna', color:(ri*3+s*5)%17, accent:(ri*5+s*3)%17,
          form:(ri+s)%18, body:(s%3?0:(s%2?11:2)), loco:(s*2)%13, trait:(ri+s)%25, size:(s%4)+2,
          head:6, limbs:(ri+s)%6, skin:(ri+s)%9, tail:(s)%7, pattern:(ri+s)%8,
          eyes:s%6, behavior:s%12, habitat:(ri+s)%19};
        Object.assign(gen, row.set);
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
