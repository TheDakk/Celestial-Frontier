// Batch 5b-i proof sheet: biome-dressed vistas across the families.
module.exports = {
  width: 1460, height: 1900,
  lift: ['mulberry32', 'hashInt', 'makeNoise'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    // stubs for lifted code paths we do not exercise
    window.battleStats = window.battleStats || (x=>({ab:null}));
    window.FA_HEAD=[]; window.FA_TRAIT=[]; window.tutDone=true;
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.HD_PORTRAITS=true;
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,1420);
    const cases=[
      ['swamp · day',        {seed:8101, era:'none', pal:'day',   wb:'swamp',   moons:1, flora:true}],
      ['marsh · day',        {seed:8102, era:'none', pal:'day',   wb:'marsh',   moons:0, flora:true}],
      ['jungle · day',       {seed:8103, era:'none', pal:'day',   wb:'jungle',  moons:1, flora:true}],
      ['savanna · day',      {seed:8104, era:'none', pal:'day',   wb:'savanna', moons:1, flora:true, herd:4}],
      ['fungal · day',       {seed:8105, era:'none', pal:'day',   wb:'fungal',  moons:1, flora:true}],
      ['crystal steppe · day',{seed:8106,era:'none', pal:'day',   wb:'crystalsteppe', moons:2, flora:true}],
      ['salt flat · day',    {seed:8107, era:'none', pal:'sand',  wb:'saltflat', flora:false}],
      ['glass desert · day', {seed:8108, era:'none', pal:'sand',  wb:'glass',   flora:false}],
      ['oxide waste · day',  {seed:8109, era:'none', pal:'sand',  wb:'oxide',   flora:false}],
      ['canyon · day',       {seed:8110, era:'none', pal:'sand',  wb:'canyon',  flora:false}],
      ['cryogeyser · day',   {seed:8111, era:'none', pal:'ice',   wb:'cryogeyser', flora:false}],
      ['blue ice · day',     {seed:8112, era:'none', pal:'ice',   wb:'blueice', flora:false}],
      ['boulder field',      {seed:8113, era:'none', pal:'grey',  wb:'boulder', flora:false}],
      ['geode world',        {seed:8114, era:'none', pal:'grey',  wb:'geode',   flora:false}],
      ['carbon world',       {seed:8115, era:'none', pal:'grey',  wb:'carbon',  flora:false}],
      ['obsidian world',     {seed:8116, era:'none', pal:'ember', wb:'obsidian', flora:false}],
      ['magma sea',          {seed:8117, era:'none', pal:'ember', wb:'magmasea', flora:false}],
      ['sulfur deck (venus)',{seed:8118, era:'none', pal:'haze',  wb:'sulfurdeck', flora:false}],
      ['TORNADO on temperate', {seed:8301, era:'none', pal:'rain', wb:'temperate', evt:'tornado', wx:'rain', flora:true}],
      ['HABOOB over dunes', {seed:8302, era:'none', pal:'dust', wb:'dunesea', evt:'haboob', wx:'dust', flora:false}],
      ['VOLCANIC LIGHTNING', {seed:8303, era:'none', pal:'ember', wb:'emberfield', evt:'volclightning', wx:'ash', flora:false}],
      ['HURRICANE wall at sea', {seed:8304, era:'none', pal:'rain', biome:'island', wb:'stormsea', evt:'hurricane', wx:'rain', flora:true}],
      ['TITAN breaching savanna', {seed:8305, era:'none', pal:'day', wb:'savanna', titan:true, flora:true, herd:2}],
    ];
    g.font='12px monospace';
    cases.forEach((c,i)=>{
      const x=16+(i%3)*482, y=26+((i/3)|0)*232;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(hdVista(c[1]), x, y, 470, 210); }catch(e){ g.fillStyle="#ff6a5a"; g.fillText(String(e).slice(0,70), x, y+20); }
    });
    // gas biome variants ride the deck scene
    const gcases=[
      ['storm-eye giant', {seed:8201, hue:200, spot:false, ring:false, moons:2, tod:'day', aurora:true, air:0, wb:'stormeye'}],
      ['ember giant (hot glow)', {seed:8202, hue:30, spot:false, ring:true, moons:1, tod:'night', aurora:false, air:0, wb:'hotglow'}],
      ['pastel ammonia', {seed:8203, hue:280, spot:true, spotHue:250, ring:false, moons:3, tod:'day', aurora:true, air:1, wb:'ammonia'}],
    ];
    gcases.forEach((c,i)=>{
      const x=16+(i%3)*482, y=26+6*232;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(_hdDeckScene(c[1]), x, y, 470, 210); }catch(e){ g.fillStyle="#ff6a5a"; g.fillText(String(e).slice(0,70), x, y+20); }
    });
  }`,
};
