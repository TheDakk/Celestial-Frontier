// v1.6 vista sheet: landing vistas WITH the world's real creatures placed in
// habitat (opts.genes -> _hdPlaceBeast), now lightly camo'd + enlarged so you
// actually see them. Earth species for Earth-like biomes.
module.exports = {
  width: 960, height: 892,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf', 'BIOME_PROFILES'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    g.fillStyle='#05060a'; g.fillRect(0,0,960,892);
    g.font='13px monospace';
    let sd=5000;
    const mk=(nm)=>{ const gg={seed:sd++, kingdom:'fauna', color:(sd*3)%17, accent:(sd*5)%17,
      form:sd%18, body:(sd*5)%16, loco:sd%13, trait:(sd*7)%25, size:2, head:sd%10,
      limbs:sd%6, skin:sd%9, tail:sd%7, pattern:(sd*3)%8, eyes:sd%6, behavior:sd%12, habitat:8};
      const big=/whale|elephant|giraffe|orca|squid|camel|shark|mammoth|hippo|rhino/i;
      const mid=/lion|jaguar|deer|ostrich|dolphin|turtle|bear|horse|zebra|kangaroo/i;
      const small=/beetle|scorpion|clownfish|toucan|fox|snake|frog|crab/i;
      gg.size = big.test(nm)?5:(mid.test(nm)?3:(small.test(nm)?0:2));
      if(nm){ gg._earthName=nm; gg.name=nm; } const G=hdGenesFor(gg); G.size=gg.size; return G; };
    const cells=[
      ['Temperate forest','temperate','day','land','liquid',['Red Deer','Fox']],
      ['Jungle','jungle','day','land','liquid',['Jaguar','Toucan']],
      ['Savanna','savanna','sand','land','liquid',['Lion','Ostrich']],
      ['Coral shallows','coral','day','island','liquid',['Sea Turtle','Clownfish']],
      ['Abyssal deep','abyssal','night','island','liquid',['Anglerfish','Giant Squid']],
      ['Dune sea','dunesea','dust','land','none',['Camel','Rattlesnake']],
      ['Ash waste','ashwaste','ember','land','none',['Beetle','Scorpion']],
      ['Glacier','glacier','snow','land','frozen',['Polar Bear','Arctic Fox']],
    ];
    cells.forEach((c,i)=>{
      const col=i%2, row=(i/2)|0;
      const genes=(c[5]||[]).map(mk);
      let vc; try{ vc=hdVista({seed:1000+i*97, pal:c[2], wb:c[1], biome:c[3], flora:true,
        water:c[4], moons:1, era:'none', genes:genes, herd:genes.length}); }
        catch(e){ g.fillStyle='#f66';g.fillText('ERR '+c[1]+': '+e.message, 16+col*472, 40+row*216); return; }
      const x=16+col*472, y=26+row*216;
      g.drawImage(vc, x, y, 456, 204);
      g.fillStyle='#aab2d8'; g.fillText(c[0]+'  ['+c[1]+']  '+(c[5]||[]).join(', '), x+6, y+200);
    });
  }`,
};
