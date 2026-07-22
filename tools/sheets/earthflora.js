// v1.6 task G flora assessment: the current _earthFlora -> _hdPlantBare
// botanical rigs, one real plant per cell (its own form/fruit/flower flags).
module.exports = {
  width: 1320, height: 1360,
  lift: ['mulberry32', 'hashInt'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    g.fillStyle='#0d130c'; g.fillRect(0,0,1320,1360);
    g.font='13px monospace';
    let seed=90000;
    const cell=(name,col,row)=>{
      const ef=_earthFlora(name);
      const sp=Object.assign({trunk:'#31241a', leaf:'rgba(74,120,64,0.92)', accent:'#b9d68a',
        spread:0.9, depth:4, lean:0.18}, ef);
      const cv2=_hdPlantBare((seed++^0x717)>>>0, sp);
      const x=20+col*216, y=44+row*216;
      g.fillStyle='#0f1a10'; g.fillRect(x,y,206,184);
      const T=182,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
      _fitPlant(tx2,cv2,T); g.drawImage(tc, x+(206-T)/2, y);
      g.fillStyle='#a8c88a'; g.fillText(name+'  ['+(ef.form||'herb')+']', x+6, y+176);
    };
    const rows=[
      ['TREES  (form fixes: willow droop / redwood columnar / baobab trunk / acacia flat-top)',
        ['Oak','Redwood','Willow','Baobab','Acacia']],
      ['TROPICAL / FRUIT',
        ['Coconut','Banana','Mango','Fig','Eucalyptus']],
      ['CONIFERS',
        ['Cedar','Pinyon Pine','Spruce Tips','Juniper','Yew']],
      ['FLOWERS  (sunflower disc / orchid asymmetric / lavender spikes)',
        ['Sunflower','Vanilla Orchid','Lavender','Poppy','Water Lily']],
      ['CROPS / GRASS  (corn stalk+ear / cattail head / bamboo)',
        ['Corn','Wheat','Bamboo Shoots','Cattail','Papyrus']],
      ['SUCCULENTS / CACTI  (aloe rosette)',
        ['Aloe','Prickly Pear','Agave','Yucca','Barrel Cactus Fruit']],
      ['FERN / MOSS / VINE  (reindeer lichen / spanish moss)',
        ['Sword Fern','Reindeer Lichen','Ivy','Grape','Rattan']],
      ['AQUATIC / CARNIVOROUS  (duckweed mat / venus flytrap)',
        ['Kelp','Lotus','Duckweed','Venus Flytrap','Pitcher Plant']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8fb06a'; g.fillText(row[0], 20, 30+ri*216);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
