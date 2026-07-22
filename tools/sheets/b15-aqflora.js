// v1.6 B15 §0.7 — aquatic + aerial flora subfamilies. Each row is one sub-family
// (was: all aquatic -> one kelp, all aerial -> one vine). Renders _hdPlantBare
// directly with the aqsub / aersub markers hdPortraitFlora now sets from the form gene.
const ROWS = [
  { label:'AQ 0 kelp towers',        sp:{form:'seaweed', aqsub:0} },
  { label:'AQ 1 seagrass meadow',    sp:{form:'seaweed', aqsub:1} },
  { label:'AQ 2 reef-builder colony',sp:{form:'seaweed', aqsub:2} },
  { label:'AQ 3 sargassum raft',     sp:{form:'seaweed', aqsub:3} },
  { label:'AQ 4 bloom field (lum)',  sp:{form:'seaweed', aqsub:4, lum:'rgba(120,220,200,0.9)'} },
  { label:'AQ 5 tube garden',        sp:{form:'seaweed', aqsub:5} },
  { label:'AIR 0 aeroplankton veil', sp:{form:'aerial', aersub:0} },
  { label:'AIR 1 drift-spore banner',sp:{form:'aerial', aersub:1} },
  { label:'AIR 2 cloud-garden',      sp:{form:'aerial', aersub:2} },
];
module.exports = {
  width: 8 * 160 + 320, height: ROWS.length * 176 + 30,
  lift: ['mulberry32', 'hashInt', 'SP_COLOR', 'SP_HEX'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    const ROWS=${JSON.stringify(ROWS)};
    const W=${8 * 160 + 320}, H=${ROWS.length * 176 + 30};
    g.fillStyle='#08131c'; g.fillRect(0,0,W,H);
    const hues=['rgba(46,109,90,0.9)','rgba(60,138,120,0.9)','rgba(42,120,140,0.9)','rgba(90,150,110,0.9)',
      'rgba(70,160,150,0.9)','rgba(58,110,138,0.9)','rgba(120,150,170,0.9)','rgba(150,170,190,0.9)'];
    const SAMPLES=8, cw=158, ch=172, LBL=310;
    ROWS.forEach(function(row,ri){
      const y=10+ri*176;
      g.fillStyle='#9fc2d8'; g.font='13px monospace'; g.fillText(row.label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=41000+ri*907+s*311, x=LBL+s*cw;
        g.fillStyle=(s%2)?'#0b1a26':'#0e2130'; g.fillRect(x,y,cw-6,ch-6);
        const sp=Object.assign({leaf:hues[s%hues.length], trunk:'#25302a', accent:hues[(s+3)%hues.length]}, row.sp);
        try{ const cv2=_hdPlantBare(seed, sp);
          g.drawImage(cv2, x+(cw-6-150)/2, y+8, 150, 150);
        }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR',x+6,y+40); }
      }
    });
  }`,
};
