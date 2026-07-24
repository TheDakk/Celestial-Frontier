// SIGNATURE MARKINGS test (ProofSet-2 review R1) — panda mask+limbs, okapi leg
// stripes, orca eye patch + white belly, badger/raccoon/meerkat masks, red
// panda, skunk contrast, spectacled bear spectacles; Tiger as the control.
module.exports = {
  width: 1560, height: 560,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#ffd96a'}, vit:150, tier:0});
    g.fillStyle='#101624'; g.fillRect(0,0,1560,560);
    g.font='11px monospace';
    const NAMES=['Elephant','Asian Elephant','Forest Elephant','Giant Panda','Okapi','Walrus','Gorilla','Orangutan','Warthog','Kudu'];
    NAMES.forEach(function(nm,i){
      const x=8+(i%5)*310, y=20+((i/5)|0)*270;
      g.fillStyle='#8892b8'; g.fillText(nm, x+8, y-4);
      try{
        const gen={seed:30000+i*977, kingdom:'fauna', color:i%17, accent:(i*3)%17, form:i%18, body:0, loco:0,
          trait:i%25, size:3, head:0, limbs:0, skin:1, tail:2, pattern:0, eyes:0, behavior:0, habitat:8, _earthName:nm, name:nm};
        const G=hdGenesFor(gen), cvb=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
        const T=240, tc=document.createElement('canvas'); tc.width=tc.height=T;
        _fitBeast(tc.getContext('2d'),cvb,T,G);
        g.drawImage(tc, x+30, y);
      }catch(e){ g.fillStyle='#f66'; g.fillText(String(e).slice(0,40), x+8, y+40); }
    });
  }`,
};
