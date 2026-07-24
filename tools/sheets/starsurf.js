// 2026-07-24 UNIVERSE-CRISPNESS proof — the zoomed-in star's new SURFACE
// (granulation + limb darkening + core lift) across classes, plus the HD
// moon masters vs their 28px far-view versions. Review lens: a close star
// must read as a boiling sphere, not a gradient blob; giants churn huge
// cells; a close moon shows a real crater field / stripe network.
module.exports = {
  width: 1500, height: 1240,
  lift: ['mulberry32', 'hashInt', 'makeNoise', 'clamp', '_starSurfCache', '_starSurf', '_moonSprs', '_moonSpr',
         '_ringSprCache', '_ringSprite'],
  draw: `function(g){
    window.TAU=Math.PI*2;
    g.fillStyle='#07080f'; g.fillRect(0,0,1500,1240);
    g.font='12px monospace';
    try{
    const stars=[
      ['G sun-like', 424242, '#ffe9c8', ''],
      ['B blue-hot', 9001,   '#cfe0ff', ''],
      ['M red dwarf',7013,   '#ffb2a0', ''],
      ['RG red giant',5555,  '#ff9a6a', 'RG'],
      ['SG supergiant',808,  '#ffd2a0', 'SG'],
      ['WD white dwarf',311, '#e8f0ff', 'WD'],
    ];
    for(let i=0;i<stars.length;i++){
      const x=30+(i%6)*245, y=40;
      g.fillStyle='#8892b8'; g.fillText(stars[i][0], x, y-8);
      g.drawImage(_starSurf(stars[i][1], stars[i][2], stars[i][3]), x, y, 225, 225);
    }
    g.fillStyle='#ffd96a'; g.fillText('MOONS — far 28px master (top) vs close HD 160px master (bottom): rocky · icy · volcanic · captured', 30, 330);
    const names=['rocky','icy','volcanic','captured'];
    for(let ti=0;ti<4;ti++){
      const x=30+ti*250;
      g.fillStyle='#8892b8'; g.fillText(names[ti], x, 352);
      g.drawImage(_moonSpr(ti,false), x, 360, 220, 220);
      g.drawImage(_moonSpr(ti,true),  x, 600, 220, 220);
    }
    g.fillStyle='#ffd96a'; g.fillText('RINGS — 512 masters (band recipes are per-seed: count, widths, Cassini gap; sand vs ice hue)', 30, 880);
    const rseeds=[[136,'224,206,166'],[9021,'224,206,166'],[5150,'188,212,232'],[777,'188,212,232']];
    for(let i2=0;i2<rseeds.length;i2++){
      const x=30+i2*370;
      g.fillStyle='#8892b8'; g.fillText('seed '+rseeds[i2][0]+(i2>1?' (icy)':' (sandy)'), x, 900);
      g.drawImage(_ringSprite(rseeds[i2][0], rseeds[i2][1]), x, 908, 340, 340);
    }
    }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 40); }
  }`,
};
