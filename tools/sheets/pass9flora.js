// Pass 9 flora — harvest-item organs + procedural text↔visual alignment.
module.exports = {
  width: 1320, height: 480,
  lift: ['mulberry32', 'hashInt'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    g.fillStyle='#0d130c'; g.fillRect(0,0,1320,480);
    g.font='13px monospace';
    let seed=93000;
    const cell=(name,col,row)=>{
      const ef=_earthFlora(name);
      const sp=Object.assign({trunk:'#6b4a2a', leaf:'rgba(120,150,70,0.95)', accent:'#d08a3a',
        spread:0.9, depth:4, lean:0.18}, ef);
      const cv2=_hdPlantBare((seed++^0x717)>>>0, sp);
      const x=20+col*162, y=44+row*216;
      g.fillStyle='#0f1a10'; g.fillRect(x,y,152,184);
      const T=176,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
      _fitPlant(tx2,cv2,T); g.drawImage(tc, x+(152-T)/2, y);
      g.fillStyle='#a8c88a'; g.font='11px monospace'; g.fillText(name.slice(0,18)+' ['+(ef.form||'?')+']', x+4, y+178);
    };
    const rows=[
      ['HARVEST ITEMS — render as the ORGAN, not a full plant',
        ['Maple Sap','Pine Nuts','Bamboo Shoots','Lotus Root','Juniper Berries','Orchid Pods','Barrel Cactus Fruit','Acorn']],
      ['SOURCE plants (for contrast — still full plants)',
        ['Maple','Pine','Bamboo','Lotus','Juniper','Orchid','Barrel Cactus','Oak']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8aa87a'; g.font='13px monospace'; g.fillText(row[0], 20, 30+ri*216);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
