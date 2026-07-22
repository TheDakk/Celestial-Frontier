// Clip check for tall birds + ornament mammals: RAW hdBeastBare (no box-fit),
// red frame = 300px canvas bounds. size gene maxed to hit worst case.
module.exports = {
  width: 1320, height: 990,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:200, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1320,990);
    g.font='13px monospace';
    const cell=(name,col,row)=>{
      const gi=col*5+row*11+2;
      const gen={seed:31000+gi*613, kingdom:'fauna', color:gi%17, accent:(gi*7)%17, form:gi%18,
        body:(gi*5)%16, loco:gi%13, trait:(gi*3)%25, size:5, head:9, limbs:gi%6, skin:gi%9,
        tail:gi%7, pattern:(gi*3)%8, eyes:gi%6, behavior:gi%12, habitat:8, _earthName:name, name:name};
      const G=hdGenesFor(gen);
      const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const x=20+col*216, y=44+row*156, T=140;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,132);
      g.drawImage(bcv, x+(206-T)/2, y-4, T, T);
      g.strokeStyle='rgba(255,80,80,0.6)'; g.lineWidth=1; g.strokeRect(x+(206-T)/2, y-4, T, T);
      g.fillStyle='#aab2d8'; g.fillText(name, x+6, y+126);
    };
    const rows=[
      ['WADERS', ['Flamingo','Crane','Grey Heron','Stork','Great Egret']],
      ['WADERS 2', ['Ibis','Spoonbill','Bittern','White Stork','Sandhill Crane']],
      ['TALL BIRDS', ['Ostrich','Secretary Bird','Cassowary','Peacock','Swan']],
      ['LONG-BILL / RAPTOR', ['Pelican','Toucan','Hornbill','Bald Eagle','Marabou Stork']],
      ['ORNAMENT MAMMALS', ['Moose','Elk','Irish Elk','Kudu','Arabian Oryx']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*156);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
