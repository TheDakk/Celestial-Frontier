// HD coverage pass proof sheet: every formerly-flat body in its baked form —
// ring systems, typed moons, dwarfs, the interstellar visitor, comet coma,
// wormhole lensing, quasar, planetary-nebula deco.
module.exports = {
  width: 1240, height: 620,
  lift: ['mulberry32', 'hashInt', '_ringSprCache', '_ringSprite',
         '_moonSprs', '_moonSpr', '_dwarfSprs', '_dwarfSpr',
         '_visitorSprC', '_visitorSpr', '_comaSprC', '_comaSpr',
         '_wormSprC', '_wormSpr', '_quasarSprC', '_quasarSpr',
         '_decoSpr', 'decoSprite'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1240,620);
    g.fillStyle='#8892b8'; g.font='12px monospace';
    // ring systems at 3 seeds, both hue families, tilted like the live view
    g.fillText('planet rings (baked bands + gap; was one stroked arc)', 20, 22);
    [[424242,'224,206,166'],[999,'224,206,166'],[133777,'188,212,232']].forEach((sh,i)=>{
      g.save(); g.translate(120+i*220, 100); g.rotate(0.45); g.scale(1,0.42);
      g.drawImage(_ringSprite(sh[0], sh[1]), -95, -95, 190, 190);
      g.restore();
      // a placeholder planet disc so the ring reads in context
      const pg=g.createRadialGradient(120+i*220-8,92,2,120+i*220,100,26);
      pg.addColorStop(0,'#cfa878'); pg.addColorStop(1,'#3a2c1c');
      g.fillStyle=pg; g.beginPath(); g.arc(120+i*220,100,26,0,7); g.fill();
    });
    // moons + dwarfs
    g.fillText('typed moons (rocky/icy/volcanic/captured) + dwarf planets', 720, 22);
    for(let t=0;t<4;t++) g.drawImage(_moonSpr(t), 720+t*64, 50, 52, 52);
    for(let v=0;v<3;v++) g.drawImage(_dwarfSpr(v), 1000+v*62, 50, 48, 48);
    // visitor + coma
    g.fillText('interstellar visitor (tumbling sliver) / comet coma', 20, 230);
    g.save(); g.translate(120,280); g.rotate(-0.4); g.drawImage(_visitorSpr(), -60, -22, 120, 44); g.restore();
    g.drawImage(_comaSpr(), 260, 250, 60, 60);
    // wormhole + quasar
    g.fillText('wormhole lensing (was stroked ellipses)', 420, 230);
    g.drawImage(_wormSpr(), 430, 245, 130, 130);
    g.fillText('quasar (host + core + jets; was dot + line)', 640, 230);
    g.drawImage(_quasarSpr(), 650, 235, 170, 170);
    // planetary nebula deco (the new 'plan' branch) at 3 positions/seeds
    g.fillText('planetary nebula deco (was stroked circles)', 900, 230);
    [[3,7],[11,-5],[-9,13]].forEach((xy,i)=>{
      const dc={x:xy[0], y:xy[1], k:'plan'};
      g.drawImage(decoSprite(dc), 900+i*110, 250, 100, 100);
    });
  }`,
};
