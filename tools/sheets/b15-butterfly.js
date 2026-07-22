// v1.6 B15.4 — LEPIDOPTERA ROUTING verification (review 15.2). Proves the classifier
// routes butterflies/moths (incl. name COLLISIONS like "Hawk Moth"/"Peacock Butterfly")
// to the insect rig with a matched frontal eye pair, WHILE bare collision words
// (Peacock/Hawk/Tiger/Butterflyfish) still resolve to their real biological class.
// Row 1 = insect · Row 2 = collision->insect · Row 3 = bare word->its real class.
module.exports = {
  width: 6*190+30, height: 3*190+56,
  lift: ['mulberry32','hashInt','SP_COLOR','SP_HEX','FA_HEAD','FA_TRAIT','FA_PATTERN','FA_SIZE_M','FA_HABITAT','FA_EYES','FA_TAIL','FA_LIMBS','FA_SKIN','FA_DIET','FA_LOCO','EX_LOCO','EX_HABITAT','habOf','locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    const W=6*190+30,H=3*190+56; g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H); g.font='13px monospace';
    const LABELS=['ROW 1 — butterflies/moths -> insect','ROW 2 — name COLLISIONS -> insect (was bird/mammal)','ROW 3 — bare collision word -> its REAL class'];
    const ROWS=[
      ['Butterfly','Moth','Monarch Butterfly','Swallowtail','Luna Moth','Morpho Butterfly'],
      ['Hawk Moth','Peacock Butterfly','Tiger Moth','Elephant Hawk Moth','Owl Butterfly','Painted Lady'],
      ['Peacock','Hawk','Owl','Tiger','Butterflyfish','Leopard'],
    ];
    let seed=95000;
    ROWS.forEach(function(names,row){
      g.fillStyle='#7f8ab0'; g.fillText(LABELS[row], 15, 20+row*190+ (row===0?0:6));
      names.forEach(function(name,col){ const x=15+col*190, y=42+row*190;
        const gg={seed:seed++,kingdom:'fauna',color:(col*3)%17,accent:(col*5)%17,form:4,body:(col*5)%16,loco:3,trait:col%25,size:2,head:col%10,limbs:col%6,skin:col%9,tail:col%7,pattern:col%8,eyes:2,behavior:1,habitat:0,_earthName:name,name:name};
        try{ const G=hdGenesFor(gg); const cv2=hdBeastBare(G,(gg.seed^0x9A11)>>>0);
          g.fillStyle='#11162a'; g.fillRect(x,y,180,150); g.drawImage(cv2,x-4,y-18,190,190);
          g.fillStyle='#aab2d8'; g.fillText(name,x+6,y+144);
        }catch(e){ g.fillStyle='#f66'; g.fillText('ERR '+name,x+6,y+80); } });
    });
  }`,
};
