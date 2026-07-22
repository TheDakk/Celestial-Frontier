// Pass 5 — iconic species morphology verification, box-fit card render.
module.exports = {
  width: 1320, height: 990,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1320,990);
    g.font='13px monospace';
    let seed=98000;
    const cell=(name,col,row)=>{
      const gen={seed:seed++, kingdom:'fauna', color:5, accent:7, form:4, body:2, loco:0,
        trait:3, size:3, head:2, limbs:2, skin:3, tail:2, pattern:1, eyes:2, behavior:1, habitat:8,
        _earthName:name, name:name};
      const G=hdGenesFor(gen);
      const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const x=20+col*216, y=44+row*156, T=140;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,132);
      const tc=document.createElement('canvas'); tc.width=tc.height=T; const tx2=tc.getContext('2d');
      _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(206-T)/2, y-6);
      g.fillStyle='#aab2d8'; g.fillText(name, x+6, y+126);
    };
    const rows=[
      ['ANTEATER / PANGOLIN / ARMADILLO', ['Giant Anteater','Tamandua','Pangolin','Nine-Banded Armadillo','Aardvark']],
      ['SPINES', ['Porcupine','Hedgehog','Echidna','Crested Porcupine','European Hedgehog']],
      ['SEMI-AQUATIC / GLIDERS', ['Beaver','Platypus','Flying Squirrel','Sugar Glider','Colugo']],
      ['DRAGONFLY / FRILL / PRIMATES', ['Dragonfly','Damselfly','Frilled Lizard','Gorilla','Gibbon']],
      ['PRIMATES 2', ['Orangutan','Proboscis Monkey','Mandrill','Spider Monkey','Aye-Aye']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*156);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
