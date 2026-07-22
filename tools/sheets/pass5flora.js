// Pass 5 flora rerouting check — the iconic plants that were generic stems.
module.exports = {
  width: 1320, height: 700,
  lift: ['mulberry32', 'hashInt'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    g.fillStyle='#0d130c'; g.fillRect(0,0,1320,700);
    g.font='13px monospace';
    let seed=91000;
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
      ['REROUTED ICONICS (were generic herb stems)',
        ['Rafflesia','Pineapple','Joshua Tree','Dragon Fruit','Angel\\'s Trumpet']],
      ['REROUTED VINES / CROPS',
        ['Passionfruit','Watermelon','Kiwi Fruit','Oats','Bromeliad']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8aa87a'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*216);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
