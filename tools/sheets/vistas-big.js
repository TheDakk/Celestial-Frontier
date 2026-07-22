// Full-size landing vistas (native 960x430), WITH the world's real creatures placed
// in habitat. Set EMPTY=1 to render the SAME vistas with NO creatures (landscape only).
const EMPTY = process.env.EMPTY === '1';
module.exports = {
  width: 980, height: 8 * 452 + 24,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf', 'BIOME_PROFILES'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const EMPTY=${EMPTY ? 'true' : 'false'};
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    g.fillStyle='#05060a'; g.fillRect(0,0,980,${8 * 452 + 24});
    g.font='14px monospace';
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
      const y=20+i*452;
      const genes=EMPTY?[]:(c[5]||[]).map(mk);
      let vc; try{
        if(c[1]==='abyssal'){ vc=_hdAbyssScene({seed:1000+i*97, aqua:1, genes:genes}); }   // the game routes abyssal to its OWN sub-surface scene, not hdVista
        else if(c[1]==='coral'){ vc=_hdReefScene({seed:1000+i*97, genes:genes}); }          // coral -> dedicated reef scene (B15)
        else vc=hdVista({seed:1000+i*97, pal:c[2], wb:c[1], biome:c[3], flora:true,
          water:c[4], moons:1, era:'none', genes:genes, herd:genes.length}); }
        catch(e){ g.fillStyle='#f66';g.fillText('ERR '+c[1]+': '+e.message, 16, y+40); return; }
      g.drawImage(vc, 10, y, 960, 430);
      g.fillStyle='#cbd4f0'; g.fillText(c[0]+'  ['+c[1]+']'+(EMPTY?'  (landscape only)':'  — '+(c[5]||[]).join(', ')), 16, y+448);
    });
  }`,
};
