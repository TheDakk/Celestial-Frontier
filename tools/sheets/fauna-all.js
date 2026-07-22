// FULL Earth fauna roster, PAGINATED at a readable size. Set PAGE env var.
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', '_earthnames.js'), 'utf8').trim().replace(/,\s*$/, '');
const ROSTER = eval('({' + raw + '})');   // eslint-disable-line no-eval
const NAMES = ROSTER.fauna || [];
const COLS = 8, ROWS = 6, PER = COLS * ROWS, CW = 164, CH = 176;
const PAGE = parseInt(process.env.PAGE || '0', 10);
const BASE = PAGE * PER;
const SLICE = NAMES.slice(BASE, BASE + PER);
const TOTAL_PAGES = Math.ceil(NAMES.length / PER);
module.exports = {
  width: COLS * CW + 10,
  height: ROWS * CH + 34,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,${COLS * CW + 10},${ROWS * CH + 34});
    const NAMES=${JSON.stringify(SLICE)}, BASE=${BASE}, COLS=${COLS}, CW=${CW}, CH=${CH};
    g.fillStyle='#5c6488'; g.font='12px monospace';
    g.fillText(${JSON.stringify(`EARTH FAUNA  page ${PAGE + 1}/${TOTAL_PAGES}  (species ${BASE + 1}-${BASE + SLICE.length} of ${NAMES.length})`)}, 6, ${ROWS * CH + 26});
    NAMES.forEach(function(nm,i){
      const gi=BASE+i, col=i%COLS, row=(i/COLS)|0, x=5+col*CW, y=6+row*CH;
      g.fillStyle=(gi%2)?'#0e1424':'#111a2e'; g.fillRect(x,y,CW-4,CH-20);
      try{ const gen={seed:30000+gi*541, kingdom:'fauna', color:gi%17, accent:(gi*7)%17, form:gi%18,
        body:(gi*5)%16, loco:gi%13, trait:(gi*3)%25, size:(gi%5)+1, head:gi%10, limbs:gi%6, skin:gi%9,
        tail:gi%7, pattern:(gi*3)%8, eyes:gi%6, behavior:gi%12, habitat:8, _earthName:nm, name:nm};
        const G=hdGenesFor(gen), bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
        const T=CH-20, tc=document.createElement('canvas'); tc.width=tc.height=T; const tx2=tc.getContext('2d');
        _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(CW-4-T)/2, y);
      }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR', x+6, y+40); }
      g.fillStyle='#9aa6cc'; g.font='10px monospace'; g.fillText(nm.slice(0,20), x+3, y+CH-6);
    });
  }`,
};
