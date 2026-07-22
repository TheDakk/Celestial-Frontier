// The no-flora worlds: gas decks, lava, venus, ice, rocky — sky coherence review.
module.exports = {
  width: 1460, height: 1180,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#6fd3ff'}, vit:180, tier:0});
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,1180);
    g.font='12px monospace';
    const D=(o)=>_hdDeckScene(o), V=(o)=>hdVista(o);
    const cases=[
      ['deck · amber day · ring + spot + auroras', ()=>D({seed:9101,hue:30,spot:true,spotHue:55,ring:true,moons:3,tod:'day',aurora:true,air:0})],
      ['deck · cyan night · moons + drifters',      ()=>D({seed:9102,hue:200,spot:false,ring:false,moons:6,tod:'night',aurora:true,air:2})],
      ['deck · STORM-EYE giant',                    ()=>D({seed:9106,hue:210,spot:false,ring:false,moons:2,tod:'day',aurora:true,air:0,wb:'stormeye'})],
      ['deck · EMBER giant night (hot glow)',       ()=>D({seed:9107,hue:30,spot:false,ring:true,moons:1,tod:'night',aurora:false,air:0,wb:'hotglow'})],
      ['deck · pastel ammonia + iron rain',         ()=>D({seed:9108,hue:280,spot:true,spotHue:250,ring:false,moons:3,tod:'day',aurora:true,air:1,wb:'ammonia',evt:'ironrain'})],
      ['obsidian world (lava)',                     ()=>V({seed:9110,era:'none',pal:'ember',wb:'obsidian',flora:false,moons:1})],
      ['magma sea + fire whirls',                   ()=>V({seed:9111,era:'none',pal:'ember',wb:'magmasea',evt:'firewhirl',flora:false})],
      ['ash waste + volcanic lightning',            ()=>V({seed:9112,era:'none',pal:'ember',wb:'ashwaste',wx:'ash',evt:'volclightning',flora:false})],
      ['venus sulfur deck + virga',                 ()=>V({seed:9113,era:'none',pal:'haze',wb:'sulfurdeck',evt:'virga',flora:false})],
      ['blue-ice night (nightize + moons)',         ()=>V({seed:9114,era:'none',pal:'ice',wb:'blueice',nightize:true,moons:3,flora:false})],
      ['cryogeyser eruption · day',                 ()=>V({seed:9115,era:'none',pal:'ice',wb:'cryogeyser',evt:'cryoeruption',flora:false})],
      ['rocky night · canyon strata (graben)',      ()=>V({seed:9116,era:'none',pal:'grey',wb:'graben',nightize:true,moons:2,flora:false})],
    ];
    cases.forEach((c,i)=>{
      const x=16+(i%3)*482, y=26+((i/3)|0)*288;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(c[1](), x, y, 470, 210); }
      catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,70), x, y+20); }
    });
  }`,
};
