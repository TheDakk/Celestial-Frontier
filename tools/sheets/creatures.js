// Creature review sheet: land / sea / air rows + the rarity-finish ladder.
// battleStats is stubbed (varied ability colors + the tier under review);
// everything else is the game's own code, lifted verbatim.
module.exports = {
  width: 1500, height: 1060,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:120+(x.size||0)*60, tier:x._t||0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1500,1060);
    g.font='12px monospace';
    const mk=(i,loco,hab,extra)=>Object.assign({seed:40000+i*977, kingdom:'fauna',
      color:i%17, accent:(i*3+1)%17, form:i%18, body:(i*5+2)%16, loco:loco, trait:(i*7)%25,
      size:(i%5)+1, head:i%10, limbs:i%6, skin:i%9, tail:i%7, pattern:(i*3)%8, eyes:i%6,
      behavior:i%12, habitat:hab, _t:(i%3)*2}, extra||{});
    const rows=[
      ['LAND — grazers, hunters, climbers', [0,1,2,6,7,12].map((lo,i)=>mk(i+1, lo, [0,1,2,6,11,16][i]))],
      ['SEA — swimmers, filter-feeders, jet-swimmers', [4,9,13,4,9,13].map((lo,i)=>mk(i+11, lo, [3,8,10,15,13,10][i]))],
      ['AIR — gliders, floaters, drifters (+ new winged hunters via EX pools)', [3,5,11,17,3,5].map((lo,i)=>mk(i+21, lo, [7,14,14,7,14,7], i>=4?{x:1,loco:6}:null))],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.fillText(row[0], 20, 30+ri*250);
      row[1].forEach((gen,ci)=>{
        const G=hdGenesFor(gen);
        const cv2=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
        g.fillStyle='#11162a'; g.fillRect(20+ci*245, 40+ri*250, 225, 200);
        g.drawImage(cv2, 20+ci*245, 40+ri*250, 200, 200);
        g.fillStyle='#5c6488';
        g.fillText('c'+gen.color+' a'+gen.accent+' p'+gen.pattern+' t'+(gen._t||0), 26+ci*245, 252+ri*250);
      });
    });
    // the FINISH LADDER: one creature at matte / sheen / iridescent / prismatic
    g.fillStyle='#8892b8'; g.fillText('THE FINISH LADDER — same creature at tier 0 (matte) / 4 (sheen) / 6 (iridescent) / 8 (prismatic pearl)', 20, 790);
    [0,4,6,8].forEach((t,ci)=>{
      const gen=mk(5, 0, 1); gen._t=t;
      const G=hdGenesFor(gen);
      const cv2=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      g.fillStyle='#11162a'; g.fillRect(20+ci*245, 800, 225, 220);
      g.drawImage(cv2, 20+ci*245, 805, 210, 210);
      g.fillStyle='#5c6488'; g.fillText('tier '+t, 26+ci*245, 1035);
    });
    // world camouflage demo: same creature raw vs washed with 3 ground families
    g.fillStyle='#8892b8'; g.fillText('WORLD CAMOUFLAGE — raw, then washed by meadow / sand / snow grounds (field only; the Compendium keeps true colors)', 1020, 790);
    { const gen=mk(7, 2, 2); const G=hdGenesFor(gen);
      const cv2=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const grounds=[null,'#1c3629','#583a1e','#d8e2ea'];
      grounds.forEach((col,ci)=>{
        const c3=col?_hdCamo(cv2,col,ci===3?0.30:0.20):cv2;
        g.fillStyle='#11162a'; g.fillRect(1020+ci*118, 800, 112, 220);
        g.drawImage(c3, 1020+ci*118, 850, 112, 112);
      });
    }
  }`,
};
