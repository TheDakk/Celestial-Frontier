// v1.6 V4: a dense sweep of EARTH species across every class, to hunt weak /
// wrong renders (the "slam dunk" pass). 60 named species, 10 cols x 6 rows.
module.exports = {
  width: 1500, height: 940,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1500,940);
    const NAMES=['Lion','Tiger','Wolf','Grizzly Bear','Elephant','Giraffe','Zebra','Rhinoceros','Deer','Moose',
      'Kangaroo','Gorilla','Lemur','Sloth','Bison','Camel','Cheetah','Lynx','Fox','Hippopotamus',
      'Eagle','Owl','Penguin','Flamingo','Ostrich','Toucan','Peacock','Hummingbird','Pelican','Swan',
      'Crocodile','Komodo Dragon','Chameleon','Cobra','Rattlesnake','Sea Turtle','Tortoise','Frog','Axolotl','Salamander',
      'Great White Shark','Manta Ray','Seahorse','Pufferfish','Anglerfish','Clownfish','Blue Whale','Orca','Dolphin','Walrus',
      'Octopus','Nautilus','Jellyfish','Sea Urchin','Starfish','Crab','Lobster','Tarantula','Scorpion','Garden Snail'];
    const COLS=10, cw=148, ch=150;
    NAMES.forEach((nm,i)=>{
      const col=i%COLS, row=(i/COLS)|0;
      const gen={seed:20000+i*617, kingdom:'fauna', color:i%17, accent:(i*7)%17, form:i%18,
        body:(i*5)%16, loco:i%13, trait:(i*3)%25, size:(i%5)+1, head:i%10, limbs:i%6, skin:i%9,
        tail:i%7, pattern:(i*3)%8, eyes:i%6, behavior:i%12, habitat:8, _earthName:nm, name:nm};
      const x=8+col*cw, y=16+row*ch;
      g.fillStyle=(i%2)?'#0e1424':'#111a2e'; g.fillRect(x,y,cw-6,ch-8);
      try{ const G=hdGenesFor(gen); const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
        const T=138,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
        _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(cw-6-T)/2, y+2); }
      catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR '+nm, x+6, y+70); }
      g.fillStyle='#8aa0c8'; g.font='10px monospace';
      g.fillText(nm, x+4, y+ch-13);
    });
  }`,
};
