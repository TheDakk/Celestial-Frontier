// v1.6 task D proof sheet: the new / extended fauna rigs, rendered by the
// game's own art code (lifted verbatim). Each cell is a real Earth species
// pushed through hdGenesFor -> hdBeastBare via its _earthName.
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
    let seed=70000;
    const cell=(name,col,row)=>{
      const gen={seed:seed++, kingdom:'fauna', color:5, accent:7, form:4, body:2, loco:0,
        trait:3, size:3, head:2, limbs:2, skin:3, tail:2, pattern:1, eyes:2, behavior:1, habitat:8,
        _earthName:name, name:name};
      const G=hdGenesFor(gen);
      const cv2=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const x=20+col*216, y=44+row*190;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,158);
      g.drawImage(cv2, x-6, y-14, 200, 200);
      g.fillStyle='#aab2d8'; g.fillText(name, x+6, y+150);
    };
    const rows=[
      ['CEPHALOPOD SPLIT  (octopus / squid / cuttlefish / nautilus)',
        ['Common Octopus','Reef Squid','Broadclub Cuttlefish','Chambered Nautilus','Giant Squid']],
      ['GASTROPODS  (coiled / conch / limpet / slug)',
        ['Garden Snail','Giant Conch','Common Limpet','Sea Slug','Periwinkle']],
      ['CORAL ARCHITECTURES  (brain / staghorn / table / fan / bubble)',
        ['Brain Coral','Staghorn Coral','Table Coral','Fan Coral','Bubble Coral']],
      ['CAT BUILDS  (heavy / speed / mountain / lynx)',
        ['Lion','Cheetah','Cougar','Canada Lynx','Tiger']],
      ['CETACEAN HEADS & DORSALS  (sperm / beluga / orca / dolphin)',
        ['Sperm Whale','Beluga Whale','Killer Whale','Bottlenose Dolphin','Pilot Whale']],
      ['SESSILE  (barnacle cone / urchin / anemone)',
        ['Acorn Barnacle','Sea Urchin','Sea Anemone','Sea Cucumber','Sponge']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*190);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
