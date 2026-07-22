// v1.6 Art Review Pass 3 — the open correction lane, rendered by the game's
// own art code. Each cell is a real Earth species pushed through
// hdGenesFor -> hdBeastBare via its _earthName, through the card box-fit.
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
    let seed=90000;
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
      ['1-2 BISON / MOOSE  (one hump, heavy front, short legs / palmate antler)',
        ['American Bison','Water Buffalo','Moose','Elk','Yak']],
      ['3 CHAMELEON + 6 WALRUS BODY  (curled tail, casque, grasp / low horizontal)',
        ['Veiled Chameleon','Panther Chameleon','Walrus','Green Iguana','Komodo Dragon']],
      ['4 CORAL SCALE  (should fill the box as living colonies)',
        ['Brain Coral','Staghorn Coral','Table Coral','Fan Coral','Bubble Coral']],
      ['4b SESSILE SCALE  (barnacle / urchin / anemone / star)',
        ['Acorn Barnacle','Sea Urchin','Sea Anemone','Sea Star','Tube Sponge']],
      ['5 CEPHALOPODS  (horizontal squid / broad cuttlefish / irregular octopus)',
        ['Reef Squid','Giant Squid','Broadclub Cuttlefish','Common Octopus','Chambered Nautilus']],
      ['ref: cetaceans + camel  (length/taper watch)',
        ['Blue Whale','Killer Whale','Bottlenose Dolphin','Dromedary Camel','Bactrian Camel']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*190);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
