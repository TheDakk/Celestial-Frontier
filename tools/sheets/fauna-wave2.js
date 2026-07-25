// 2026-07-25 FAUNA IDENTITY WAVE 2 proof (Gold Master high-priority #5) —
// frogs (dart patches/glass venter/tree pads/bullfrog bulk), bird sub-rigs
// (raptor hook+chest+talons, puffin bill, swan S-neck, hummingbird scale,
// macaw tail), ungulate horns (kudu corkscrew, impala lyre, gerenuk,
// pronghorn fork, warthog mane+tusks), small mammals (meerkat sentinel,
// sloth hang, pika, red panda), turtle splayed feet. Identifiable UNLABELED.
module.exports = {
  width: 1560, height: 940,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#ffd96a'}, vit:150, tier:0});
    g.fillStyle='#101624'; g.fillRect(0,0,1560,940);
    g.font='10px monospace';
    const ROWS=[
      ['FROGS+TURTLE', ['Poison Dart Frog','Glass Frog','Tree Frog','Bullfrog','Box Turtle','Tortoise','Snapping Turtle']],
      ['BIRDS',        ['Eagle','Puffin','Penguin','Swan','Hummingbird','Macaw','Toucan']],
      ['UNGULATES',    ['Kudu','Impala','Gerenuk','Pronghorn','Warthog','Wild Boar','Ibex']],
      ['SMALL MAMMALS',['Meerkat','Sloth','Pika','Red Panda','Raccoon','Skunk','Badger']],
    ];
    for(let ri=0;ri<ROWS.length;ri++){
      g.fillStyle='#ffd96a'; g.fillText(ROWS[ri][0], 8, 26+ri*228);
      for(let ci=0;ci<ROWS[ri][1].length;ci++){
        const nm=ROWS[ri][1][ci], x=118+ci*205, y=14+ri*228;
        g.fillStyle='#8892b8'; g.fillText(nm, x+8, y+10);
        try{
          const gen={seed:41000+ri*1000+ci*977, kingdom:'fauna', color:(ri*3+ci)%17, accent:(ci*5)%17, form:ci%18, body:0, loco:0,
            trait:ci%25, size:3, head:0, limbs:0, skin:1, tail:2, pattern:0, eyes:0, behavior:0, habitat:8, _earthName:nm, name:nm};
          const G=hdGenesFor(gen), cvb=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
          const T=200, tc=document.createElement('canvas'); tc.width=tc.height=T;
          _fitBeast(tc.getContext('2d'),cvb,T,G);
          g.drawImage(tc, x, y+14, 195, 195);
        }catch(e){ g.fillStyle='#f66'; g.fillText(String(e).slice(0,30), x+8, y+60); }
      }
    }
  }`,
};
