// v1.6 B15.4 — BIOME COVERAGE (all 43 BIOME_PROFILES = 39 surface/ocean + 4 gas).
// Renders every biome as a landing vista in one of three MODES:
//   MODE=proc  (default) — POPULATED with PROCEDURAL life (as on an exotic world)
//   MODE=earth            — POPULATED with EARTH species matching the biome (as on a cradle world)
//   EMPTY=1               — empty landscapes (dressing only)
// Aquatic biomes get swimmers/jelly/ceph; coral->reef scene, abyssal->deep scene, gas->deck scene.
// Each life-bearing biome gets a clearly-sized ANCHOR organism + a SECONDARY cue (ecosystem read).
const EMPTY = process.env.EMPTY === '1';
const EARTH = process.env.MODE === 'earth';
// biome -> [pal, worldBiome(land|island), water, floraOn, [earthAnchor, earthSecondary]]  ('' pair = intentionally fauna-free)
const B = [
  ['temperate','day','land','liquid',1,['Red Deer','Red Fox']],['savanna','sand','land','liquid',1,['Lion','Ostrich']],['jungle','day','land','liquid',1,['Jaguar','Toucan']],
  ['marsh','day','land','liquid',1,['Grey Heron','Bullfrog']],['swamp','day','land','liquid',1,['Alligator','Water Snake']],['mangrove','day','land','liquid',1,['Mudskipper','Fiddler Crab']],
  ['tundra','ice','land','frozen',1,['Musk Ox','Snowy Owl']],['karst','day','land','liquid',1,['Cave Bat','Cave Spider']],['saltflat','sand','land','none',1,['Darkling Beetle','Desert Scorpion']],
  ['fungal','night','land','liquid',1,['Land Snail','Cave Salamander']],['crystalsteppe','day','land','liquid',1,['Steppe Gazelle','Jewel Beetle']],
  ['opensea','day','island','liquid',1,['Bluefin Tuna','Blue Marlin']],['archipelago','day','island','liquid',1,['Green Sea Turtle','Coconut Crab']],['coral','day','island','liquid',1,['Green Sea Turtle','Clownfish']],
  ['stormsea','rain','island','liquid',1,['Wandering Albatross','Mackerel']],['volcisle','day','island','liquid',1,['Coconut Crab','Reef Fish']],['abyssal','night','island','liquid',0,['Anglerfish','Giant Squid']],
  ['milksea','night','island','liquid',1,['Moon Jellyfish','Vampire Squid']],
  ['glacier','snow','land','frozen',1,['Polar Bear','Arctic Fox']],['packice','ice','island','frozen',0,['Weddell Seal','Emperor Penguin']],['cryogeyser','ice','land','frozen',1,['Ice Crab','Icefish']],['blueice','ice','island','frozen',0,['Leopard Seal','Icefish']],
  ['dunesea','dust','land','none',1,['Dromedary Camel','Sidewinder Rattlesnake']],['canyon','sand','land','none',1,['Bighorn Sheep','Golden Eagle']],['saltpan','sand','land','none',1,['Brine Shrimp','Sandpiper']],['oxide','sand','land','none',1,['Desert Iguana','Rust Scorpion']],['glass','sand','land','none',0,['Glass Spider','Silverfish']],
  ['cratered','grey','land','none',1,['Rock Scorpion','Cave Beetle']],['boulder','grey','land','none',1,['Rock Lizard','Rock Spider']],['graben','grey','land','none',1,['Fault Scorpion','Cave Cricket']],['geode','grey','land','none',0,['Crystal Beetle','Cave Spider']],['carbon','grey','land','none',0,['Soot Beetle','Black Widow']],
  ['sulfurdeck','haze','land','none',0,['Sulfur Beetle','']],['acidhaze','haze','land','none',0,['','']],['abyssgreen','haze','land','none',0,['','']],
  ['ashwaste','ember','land','none',0,['Ash Scorpion','Cinder Beetle']],['emberfield','ember','land','none',0,['Ember Beetle','']],['obsidian','ember','land','none',0,['Obsidian Spider','']],['magmasea','ember','land','none',0,['Lava Crab','Magma Beetle']],
];
const GAS = [['stormeye',200,false],['hotglow',30,true],['ammonia',280,true],['banded',50,false]];
const AQ = ['opensea','archipelago','coral','stormsea','volcisle','abyssal','milksea','packice','blueice','cryogeyser','glacier','mangrove','marsh','swamp'];
const COLS = 3, CW = 482, CH = 232, ROWS = Math.ceil((B.length + GAS.length) / COLS);
module.exports = {
  width: COLS * CW + 16, height: ROWS * CH + 40,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    const B=${JSON.stringify(B)}, GAS=${JSON.stringify(GAS)}, AQ=${JSON.stringify(AQ)}, EMPTY=${EMPTY ? 'true' : 'false'}, EARTH=${EARTH ? 'true' : 'false'};
    const COLS=${COLS}, CW=${CW}, CH=${CH}, W=${COLS * CW + 16}, H=${ROWS * CH + 40};
    g.fillStyle='#06070d'; g.fillRect(0,0,W,H); g.font='12px monospace';
    const MODE = EMPTY?'empty':(EARTH?'earth':'procedural');
    // a PROCEDURAL creature biased to the biome's environment; anchor(i=0) is large, secondary small
    const mkProc=(sd, biome, i)=>{ const aq=AQ.indexOf(biome)>=0, landPlans=[0,1,5,7,11,13], aqPlans=[3,6,8,9,10];
      const gg={seed:sd, kingdom:'fauna', color:(sd*3)%17, accent:(sd*5)%17, form:sd%18,
        body:(aq?aqPlans:landPlans)[(sd+i)%5], loco:aq?4:((sd*2)%13), trait:(sd*7)%25, size:i===0?4:2,
        head:(sd+i)%10, limbs:(sd+i)%6, skin:(sd+i*3)%9, tail:(sd+i)%7, pattern:(sd*3)%8, eyes:(sd+i)%6, behavior:sd%12, habitat:aq?10:((sd+i)%19)};
      const G=hdGenesFor(gg); G.size=gg.size; return G; };
    const mkEarth=(nm, sd, i)=>{ if(!nm) return null;
      const gg={seed:sd, kingdom:'fauna', color:(sd*3)%17, accent:(sd*5)%17, form:sd%18, body:(sd*5)%16, loco:sd%13,
        trait:(sd*7)%25, size:i===0?4:2, head:sd%10, limbs:sd%6, skin:sd%9, tail:sd%7, pattern:(sd*3)%8, eyes:sd%6, behavior:sd%12, habitat:8, _earthName:nm, name:nm};
      const G=hdGenesFor(gg); G.size=gg.size; return G; };
    let idx=0;
    const cell=(label, cv, x, y)=>{ g.fillStyle='#8892b8'; g.fillText(label, x, y-6);
      try{ g.drawImage(cv, x, y, CW-12, CH-28); }catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,60), x, y+20); } };
    B.forEach((c)=>{ const x=12+(idx%COLS)*CW, y=30+((idx/COLS)|0)*CH; idx++;
      const [biome,pal,wbiome,water,flora,pair]=c; const sd=9000+idx*131;
      let genes=[];
      if(!EMPTY){ if(EARTH){ genes=[mkEarth(pair[0],sd,0), mkEarth(pair[1],sd+57,1)].filter(Boolean); }
                  else { genes=[mkProc(sd,biome,0), mkProc(sd+57,biome,1)]; } }
      let cv;
      try{
        if(biome==='abyssal'){ cv=_hdAbyssScene({seed:sd, aqua:genes.length, genes:genes}); }
        else if(biome==='coral'){ cv=_hdReefScene({seed:sd, genes:genes}); }
        else cv=hdVista({seed:sd, pal:pal, wb:biome, biome:wbiome, water:water, flora:flora?true:false,
          moons:1, era:'none', genes:genes, herd:genes.length});
      }catch(e){ g.fillStyle='#ff6a5a'; g.fillText(biome+': '+String(e).slice(0,50), x, y+20); return; }
      const lifeless=(pair[0]===''&&pair[1]==='');
      cell(biome+'  ['+MODE+(lifeless?' · fauna-free':'')+']', cv, x, y);
    });
    GAS.forEach((c)=>{ const x=12+(idx%COLS)*CW, y=30+((idx/COLS)|0)*CH; idx++;
      const [wb,hue,ring]=c; const sd=9500+idx*97;
      // GAS POLICY (RC3 Gold blocker 3, Option A): gas giants carry NATIVE AERIAL life only; EARTH life
      // is UNSUPPORTED (Earth animals don't inhabit a gas-giant atmosphere). So air fires only in the
      // procedural pass -> empty == Earth (no life) != procedural (aerial life).
      const gasAir = (EMPTY||EARTH) ? 0 : 3;
      const gasLabel = EMPTY?'empty':(EARTH?'Earth life: unsupported':'aerial life');
      try{ const cv=_hdDeckScene({seed:sd, hue:hue, ring:ring, moons:2, tod:'day', aurora:true, air:gasAir, wb:wb});
        cell('gas: '+wb+'  ['+gasLabel+']', cv, x, y);
      }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('gas '+wb+': '+String(e).slice(0,50), x, y+20); }
    });
  }`,
};
