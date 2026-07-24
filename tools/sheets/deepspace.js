// 2026-07-24 DEEP-SPACE CRISPNESS proof — the follow-up pass Nick asked for:
// the black hole's new baked accretion render (Doppler-beamed disc, lensed
// far-side arcs, photon ring, punched horizon), the wormhole throat at 192,
// the quasar at 320, and the nebula family at 256 (h2 nursery, blue
// reflection, molecular dark cloud, supernova remnant shell). Review lens:
// the BH must read cinematic (Interstellar silhouette); nebulae must hold
// soft cloud structure at large scale, no chunky blobs.
module.exports = {
  width: 1560, height: 1000,
  lift: ['mulberry32', 'hashInt', 'clamp', '_bhSprC', '_bhSpr', '_wormSprC', '_wormSpr',
         '_quasarSprC', '_quasarSpr', '_decoSpr', 'decoSprite'],
  draw: `function(g){
    window.TAU=Math.PI*2;
    g.fillStyle='#07080f'; g.fillRect(0,0,1560,1000);
    g.font='12px monospace';
    try{
    g.fillStyle='#ffd96a'; g.fillText('BLACK HOLE — baked accretion render (Doppler side, lensed arcs, photon ring, horizon)', 30, 24);
    g.drawImage(_bhSpr(), 30, 40, 440, 440);
    g.fillStyle='#ffd96a'; g.fillText('WORMHOLE — 192 throat', 520, 24);
    g.drawImage(_wormSpr(), 520, 40, 440, 440);
    g.fillStyle='#ffd96a'; g.fillText('QUASAR — 320 master (host haze, twin jets, blinding core)', 1010, 24);
    g.drawImage(_quasarSpr(), 1010, 40, 440, 440);
    g.fillStyle='#ffd96a'; g.fillText('NEBULAE — 256 masters: H II nursery · blue reflection · molecular dark cloud · supernova remnant', 30, 530);
    const decos=[
      ['H II star nursery',   {k:'h2',  x:31, y:77, hue:332}],
      ['blue reflection',     {k:'neb', x:53, y:19, hue:202}],
      ['molecular dark cloud',{k:'mol', x:71, y:41}],
      ['supernova remnant',   {k:'rem', x:97, y:63}],
    ];
    for(let i=0;i<decos.length;i++){
      const x=30+i*385;
      g.fillStyle='#8892b8'; g.fillText(decos[i][0], x, 552);
      /* molecular clouds DIM light — give them a starfield to sit on */
      if(decos[i][1].k==='mol'){
        const r2=mulberry32(77);
        g.save();
        for(let s2=0;s2<160;s2++){ g.globalAlpha=0.2+r2()*0.6; g.fillStyle='#fff';
          g.fillRect(x+r2()*360, 560+r2()*360, 1.1, 1.1); }
        g.restore(); g.globalAlpha=1;
      }
      g.drawImage(decoSprite(decos[i][1]), x, 560, 360, 360);
    }
    }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 40); }
  }`,
};
