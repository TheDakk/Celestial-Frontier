// Art-review sheet (standing release step, artwork-team lens):
// targeted at the director's field findings — skyline/formation layers not
// seated on their ground, and light-on-land reflections reading wrong —
// plus the reflective-surface family for comparison. Reviewed by vision
// before every deploy.
module.exports = {
  width: 1460, height: 1180,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#6fd3ff'}, vit:180, tier:0});
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,1180);
    g.font='12px monospace';
    const cases=[
      ['sulfurdeck twilight rain (the postcard)', {seed:9101, era:'none', pal:'twilight', wb:'sulfurdeck', wx:'rain', moons:0, water:'none'}],
      ['VIRGA on sulfurdeck (the pillar fix)',       {seed:9113, era:'none', pal:'twilight', wb:'sulfurdeck', evt:'virga', moons:0, water:'none'}],
      ['sulfurdeck day',                          {seed:9102, era:'none', pal:'day', wb:'sulfurdeck', moons:1, water:'none'}],
      ['sulfurdeck night',                        {seed:9103, era:'none', pal:'night', wb:'sulfurdeck', moons:1, water:'none'}],
      ['space-era skyline · temperate day',       {seed:9104, era:'space', pal:'day', wb:'temperate', flora:true, moons:1}],
      ['space-era skyline · twilight',            {seed:9105, era:'space', pal:'twilight', wb:'savanna', flora:true, moons:2}],
      ['iron-era village · marsh rain',           {seed:9106, era:'iron', pal:'rain', wb:'marsh', wx:'rain', flora:true, moons:1}],
      ['open sea day (reference reflections)',    {seed:9107, era:'none', pal:'day', biome:'island', wb:'opensea', flora:true, moons:1}],
      ['saltflat day (land-sheen suspect)',       {seed:9108, era:'none', pal:'day', wb:'saltflat', moons:0, water:'none'}],
      ['blueice + snow (ice sheen)',              {seed:9109, era:'none', pal:'snow', wb:'blueice', wx:'snow', moons:1}],
      ['glass desert day (by-design shine)',      {seed:9110, era:'none', pal:'day', wb:'glass', moons:0, water:'none'}],
      ['magmasea (glow on ground)',               {seed:9111, era:'none', pal:'ember', wb:'magmasea', moons:0, water:'none'}],
      ['dunesea twilight',                        {seed:9112, era:'none', pal:'twilight', wb:'dunesea', moons:2, water:'none'}],
    ];
    cases.forEach((c,i)=>{
      const x=16+(i%3)*482, y=26+((i/3)|0)*288;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(hdVista(c[1]), x, y, 470, 210); }
      catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,70), x, y+20); }
    });
  }`,
};
