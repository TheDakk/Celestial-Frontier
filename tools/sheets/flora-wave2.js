// 2026-07-25 FLORA IDENTITY WAVE 2 proof (Gold Master wave-1 blocker #2) —
// the 7 repeated templates die: spice row (cinnamon/cardamom/black pepper/
// vanilla/chili), fruit trees w/ per-species organs, nut trees, root kinds
// (carrot/onion/potato/ginger/beet), herb structures (lettuce/rosemary/dill/
// mint), grain kinds (rice/barley/sorghum/wheat), sheet algae. Review lens:
// each cell must be identifiable WITHOUT its label.
module.exports = {
  width: 1560, height: 1100,
  lift: ['mulberry32', 'hashInt', 'SP_COLOR', 'SP_HEX', '_earthFlora', '_floraSpx', 'hdFloraBare', 'floraStat', 'STAT_KEYS'],
  liftBetween: ['function _leafRGBA', 'function _hdStampPlant'],
  draw: `function(g){
    window.TAU=Math.PI*2;
    g.fillStyle='#101624'; g.fillRect(0,0,1560,1100);
    g.font='10px monospace';
    try{
    const ROWS=[
      ['SPICES',   ['Cinnamon','Cardamom','Black Pepper','Vanilla Orchid','Chili Pepper','Wild Mustard','Clove','Nutmeg','Ginger','Turmeric']],
      ['FRUIT',    ['Apple','Pear','Wild Cherry','Olive','Orange','Lemon','Plum','Peach','Pomegranate','Persimmon']],
      ['NUT+VINE', ['Walnut','Hazelnut','Chestnut','Cashew','Grape','Passionflower','Tamarind','Starfruit','Fig','Mulberry']],
      ['ROOTS',    ['Carrot','Wild Onion','Wild Garlic','Potato','Wild Yam','Taro','Ginseng','Arrowroot','Prairie Turnip','Radish']],
      ['HERBS',    ['Lettuce','Sea Kale','Watercress','Rosemary','Wild Thyme','Dill','Fennel','Yarrow','Mint','Basil']],
      ['GRAIN+SEA',['Wheat','Barley','Wild Rice','Sorghum','Quinoa','Buckwheat','Kelp','Sea Lettuce','Red Algae','Eelgrass']],
    ];
    for(let ri=0;ri<ROWS.length;ri++){
      g.fillStyle='#ffd96a'; g.fillText(ROWS[ri][0], 10, 26+ri*178);
      for(let ci=0;ci<ROWS[ri][1].length;ci++){
        const nm=ROWS[ri][1][ci], x=64+ci*149, y=12+ri*178;
        g.fillStyle='#8892b8'; g.fillText(nm, x+6, y+12);
        try{
          const gen={seed:61000+ri*1000+ci*97, kingdom:'flora', color:5, accent:8, form:1, body:1, trait:2, pattern:0, _earthName:nm, name:nm};
          g.drawImage(hdFloraBare(gen), x, y+16, 140, 140);
        }catch(e){ g.fillStyle='#f66'; g.fillText(String(e).slice(0,26), x+4, y+60); }
      }
    }
    }catch(e){ g.fillStyle='#f66'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 40); }
  }`,
};
