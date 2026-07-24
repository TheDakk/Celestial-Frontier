// §22 SHIP HULL TIERS proof sheet — the ship at every refit stage of the
// drive ladder, stacked: scout → Jump (armored spine + nose cap) → +Array
// (dorsal dish) → +IG (luminous seams + wingtip beacons) → +Auto-Extractor
// (ventral drill pod) → +Corona Scoop (the golden ladle). Review lens: the
// hull must visibly GROW in capability stage to stage while the base scout
// silhouette stays recognizable underneath.
module.exports = {
  width: 1400, height: 800,
  // NB: never lift `items` (its const line carries a trailing comment the
  // const-lift regex trips on) — declare the Map as a page global instead;
  // the lifted itemCount resolves it via the global scope chain.
  lift: ['mulberry32', 'hashInt', 'ITEMS', 'ITEM_BY', 'itemCount', '_shipURL', 'shipImage'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1400,800);
    g.font='12px monospace';
    try{
    window.items=new Map();
    let _cap=null; const _ce=document.createElement.bind(document);
    document.createElement=(t)=>{ const el=_ce(t); if(t==='canvas') _cap=el; return el; };
    const stages=[
      ['Scout hull (chapter 1)',                     []],
      ['+ Jump Drive — armored spine, nose cap',     ['jumpdrive']],
      ['+ Long-Range Array — dorsal dish',           ['jumpdrive','array']],
      ['+ Intergalactic Drive — luminous seams',     ['jumpdrive','array','igdrive']],
      ['+ Auto-Extractor — ventral drill pod',       ['jumpdrive','array','igdrive','autoext']],
      ['+ Corona Scoop — the golden ladle',          ['jumpdrive','array','igdrive','autoext','cscoop']],
    ];
    for(let i=0;i<stages.length;i++){
      items.clear(); for(const id of stages[i][1]) items.set(id,1);
      _cap=null; shipImage();
      const x=30+(i%2)*690, y=40+((i/2)|0)*250;
      g.fillStyle='#ffd96a'; g.fillText(stages[i][0], x, y-8);
      if(_cap) g.drawImage(_cap, x, y, 640, 240);
      else { g.fillStyle='#ff6a5a'; g.fillText('no canvas captured', x, y+20); }
    }
    }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 30); }
  }`,
};
