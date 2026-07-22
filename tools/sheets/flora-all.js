// FULL Earth flora roster, PAGINATED at a readable size. Set PAGE env var.
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', '_earthnames.js'), 'utf8').trim().replace(/,\s*$/, '');
const ROSTER = eval('({' + raw + '})');   // eslint-disable-line no-eval
const NAMES = ROSTER.flora || [];
const COLS = 8, ROWS = 5, PER = COLS * ROWS, CW = 164, CH = 196;
const PAGE = parseInt(process.env.PAGE || '0', 10);
const BASE = PAGE * PER;
const SLICE = NAMES.slice(BASE, BASE + PER);
const TOTAL_PAGES = Math.ceil(NAMES.length / PER);
module.exports = {
  width: COLS * CW + 10,
  height: ROWS * CH + 34,
  lift: ['mulberry32', 'hashInt', 'SP_COLOR', 'SP_HEX', 'floraStat'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    g.fillStyle='#0b120c'; g.fillRect(0,0,${COLS * CW + 10},${ROWS * CH + 34});
    const NAMES=${JSON.stringify(SLICE)}, BASE=${BASE}, COLS=${COLS}, CW=${CW}, CH=${CH};
    g.fillStyle='#6a8050'; g.font='12px monospace';
    g.fillText(${JSON.stringify(`EARTH FLORA  page ${PAGE + 1}/${TOTAL_PAGES}  (plant ${BASE + 1}-${BASE + SLICE.length} of ${NAMES.length})`)}, 6, ${ROWS * CH + 26});
    NAMES.forEach(function(nm,i){
      const gi=BASE+i, col=i%COLS, row=(i/COLS)|0, x=5+col*CW, y=6+row*CH;
      g.fillStyle=(gi%2)?'#0e160e':'#111a10'; g.fillRect(x,y,CW-4,CH-20);
      try{ const ef=_earthFlora(nm);
        const sp=Object.assign({trunk:'#31241a', leaf:'rgba(74,120,64,0.92)', accent:'#b9d68a', spread:0.9, depth:4, lean:0.18}, ef);
        const pcv=_hdPlantBare((30000+gi*541)>>>0, sp);
        const T=CH-20, tc=document.createElement('canvas'); tc.width=tc.height=T; const tx2=tc.getContext('2d');
        _fitPlant(tx2,pcv,T); g.drawImage(tc, x+(CW-4-T)/2, y);
      }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR', x+6, y+40); }
      g.fillStyle='#a8c088'; g.font='10px monospace'; g.fillText(nm.slice(0,20), x+3, y+CH-6);
    });
  }`,
};
