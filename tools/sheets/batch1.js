// Batch 1 proof sheet: remnant deco sprites, supernova-site shells,
// GW ripple, BH disc, protostar glow — the whole death family, no circles.
module.exports = {
  width: 1200, height: 620,
  lift: ['mulberry32', 'hashInt', '_decoSpr', 'decoSprite',
         '_snSprCache', 'snSiteSprite', '_bhDisc', '_bhDiscSpr',
         '_proto', '_protoSpr', '_gwRipple', '_gwRippleSpr'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1200,620);
    g.fillStyle='#8892b8'; g.font='13px monospace';
    // row 1: remnant DECO sprites (the "little lines" fix) at 3 seeds, 220px
    g.fillText('deco k=rem (was: 26 stroked dashes)', 20, 24);
    [[3,7],[11,-5],[-9,13]].forEach((xy,i)=>{
      const dc={x:xy[0], y:xy[1], k:'rem'};
      g.drawImage(decoSprite(dc), 20+i*230, 40, 220, 220);
    });
    // row 1b: supernova SITE shells at 3 seeds
    g.fillText('supernova site shells (was: gradient + stroked ring)', 720, 24);
    [424242, 999, 133777].forEach((s,i)=>{
      g.drawImage(snSiteSprite(s), 720+i*160, 60, 150, 150);
    });
    // row 2: GW ripple at 3 growth phases (was: 3 stroked circles)
    g.fillStyle='#8892b8';
    g.fillText('gravitational-wave ripple, 3 phases (was: stroked rings)', 20, 320);
    [0.35, 0.65, 1.0].forEach((p,i)=>{
      const R=40+p*90;
      g.globalAlpha=1-p*0.55;
      g.drawImage(_gwRippleSpr(), 130+i*260-R, 460-R, R*2, R*2);
      g.globalAlpha=1;
    });
    // row 2b: BH disc + protostar
    g.fillText('BH disc / protostar', 880, 320);
    g.save(); g.translate(940,450); g.rotate(0.6); g.scale(1,0.5);
    g.drawImage(_bhDiscSpr(), -60, -60, 120, 120); g.restore();
    g.drawImage(_protoSpr(), 1040, 400, 90, 90);
  }`,
};
