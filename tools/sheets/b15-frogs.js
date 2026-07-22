// v1.6 B15 §0.2 — frog pupil/iris check. Named frogs pushed through the real
// art code; verifies the iris+pupil now reads on top of the body texture.
module.exports = {
  width: 6 * 190 + 30, height: 3 * 190 + 40,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    const W=6*190+30, H=3*190+40;
    g.fillStyle='#0a0e18'; g.fillRect(0,0,W,H); g.font='13px monospace';
    const NAMES=['Tree Frog','Poison Dart Frog','Bullfrog','Red-Eyed Tree Frog','Common Toad','Glass Frog',
      'Goliath Frog','Natterjack','Spring Peeper','Tomato Frog','Pacman Frog','Wood Frog',
      'Green Tree Frog','Golden Poison Frog','Cane Toad','Leopard Frog','Fire-Bellied Toad','Marsh Frog'];
    let seed=90000;
    NAMES.forEach(function(name,i){
      const col=i%6, row=(i/6)|0, x=15+col*190, y=30+row*190;
      const gen={seed:seed++, kingdom:'fauna', color:(i*3)%17, accent:(i*5)%17, form:4, body:13, loco:0,
        trait:(i)%25, size:2, head:2, limbs:2, skin:3, tail:1, pattern:(i)%8, eyes:2, behavior:1, habitat:4,
        _earthName:name, name:name};
      try{ const G=hdGenesFor(gen); const cv2=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
        g.fillStyle='#11162a'; g.fillRect(x,y,180,160); g.drawImage(cv2, x-4, y-16, 190, 190);
        g.fillStyle='#aab2d8'; g.fillText(name, x+6, y+152);
      }catch(e){ g.fillStyle='#f66'; g.fillText('ERR '+name, x+6, y+80); }
    });
  }`,
};
