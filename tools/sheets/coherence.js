// Coherence sampler: varied vistas with herds/flora/eras — artifact hunting.
module.exports = {
  width: 1460, height: 1180,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:180, tier:x._t||0});
    const mk=(i,loco,hab)=>({seed:50000+i*977, kingdom:'fauna', color:i%17, accent:(i*3+1)%17,
      body:(i*5+2)%16, loco:loco, trait:(i*7)%25, size:(i%5)+1, head:i%10, limbs:i%6, skin:i%9,
      tail:i%7, pattern:(i*3)%8, eyes:i%6, behavior:i%12, habitat:hab, _t:(i%3)*2});
    const GEN=(i)=>hdGenesFor(mk(i,0,1));
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,1180);
    g.font='12px monospace';
    const cases=[
      ['TITAN v2 · savanna herd',   {seed:8305, era:'none', pal:'day', wb:'savanna', titan:true, flora:true, herd:4, genes:[GEN(1),GEN(2)], moons:1}],
      ['TITAN v2 · night',          {seed:8395, era:'none', pal:'night', wb:'temperate', titan:true, flora:true, genes:[GEN(3)], moons:2}],
      ['TITAN v2 · sea breach',     {seed:8306, era:'none', pal:'day', biome:'island', wb:'opensea', titan:true, flora:true, genes:[GEN(4)], moons:1}],
      ['herds + camo · meadow',     {seed:8307, era:'none', pal:'day', wb:'temperate', flora:true, herd:4, genes:[GEN(5),GEN(6)], moons:0}],
      ['iron-era village · rain',   {seed:8308, era:'iron', pal:'rain', wb:'marsh', wx:'rain', flora:true, genes:[GEN(7)], moons:1}],
      ['spacefaring · twilight',    {seed:8309, era:'space', pal:'twilight', wb:'temperate', flora:true, moons:2}],
      ['jungle density check',      {seed:8310, era:'none', pal:'day', wb:'jungle', flora:true, herd:2, genes:[GEN(8)], moons:1}],
      ['swamp gloom + herd',        {seed:8311, era:'none', pal:'day', wb:'swamp', flora:true, genes:[GEN(9)], moons:0}],
      ['snow tundra + beast',       {seed:8312, era:'none', pal:'snow', wb:'tundra', wx:'snow', flora:true, genes:[GEN(10)], moons:1}],
      ['island night biolume',      {seed:8313, era:'none', pal:'night', biome:'island', wb:'milksea', flora:true, aqua:2, moons:2}],
      ['ember + ash + fauna',       {seed:8314, era:'none', pal:'ember', wb:'emberfield', wx:'ash', flora:false, genes:[GEN(11)], moons:0}],
      ['crystal steppe herd',       {seed:8315, era:'none', pal:'day', wb:'crystalsteppe', flora:true, herd:3, genes:[GEN(12),GEN(13)], moons:1}],
    ];
    cases.forEach((c,i)=>{
      const x=16+(i%3)*482, y=26+((i/3)|0)*288;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(hdVista(c[1]), x, y, 470, 210); }
      catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,70), x, y+20); }
    });
  }`,
};
