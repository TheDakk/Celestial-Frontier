// v1.6 Art Review Pass 4 — catalog-integrity fixes, rendered through the real
// card box-fit. Verifies the P0 routing corrections + new bat/chiton/tardigrade rigs.
module.exports = {
  width: 1320, height: 1180,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1320,1180);
    g.font='13px monospace';
    let seed=95000;
    const cell=(name,col,row)=>{
      const gen={seed:seed++, kingdom:'fauna', color:5, accent:7, form:4, body:2, loco:0,
        trait:3, size:3, head:2, limbs:2, skin:3, tail:2, pattern:1, eyes:2, behavior:1, habitat:8,
        _earthName:name, name:name};
      const G=hdGenesFor(gen);
      const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const x=20+col*216, y=44+row*190, T=170;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,158);
      const tc=document.createElement('canvas'); tc.width=tc.height=T; const tx2=tc.getContext('2d');
      _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(206-T)/2, y-6);
      g.fillStyle='#aab2d8'; g.fillText(name, x+6, y+150);
    };
    const rows=[
      ['BATS  (dedicated mammalian rig: membrane on fingers, ears, feet)',
        ['Fruit Bat','Vampire Bat','Insect-Eating Bat','Horseshoe Bat','Flying Fox']],
      ['WAS serpents/insects -> now mammals',
        ['Wild Boar','Jerboa','Flying Squirrel','Hedgehog','Warthog']],
      ['WAS quadrupeds -> now fish',
        ['Gar','Mudskipper','Fangtooth','Barreleye','Wrasse']],
      ['WAS serpent/mammal -> insect/crust',
        ['Wasp','Water Strider','Giant Water Bug','Water Flea','Cold-Adapted Insect']],
      ['NEW rigs: chiton (plated mollusk) / tardigrade (water bear)',
        ['Chiton','Tardigrade','Dragonfly','Damselfly','Boa Constrictor']],
      ['flora classifier: Date Plum (tree not palm) / Water Hemlock (herb not conifer) refs',
        ['Sculpin','Bowfin','Pacu','Tarpon','Pollock']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*190);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
