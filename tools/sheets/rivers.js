// River-variety audit: 12 different seeds, same temperate-day biome, so the
// ONLY variable is the world seed — the river course must differ world to
// world (Nick: "a lot of the rivers are the same"). Also watches river/road
// non-overlap and the blend-into-distance tail.
module.exports = {
  width: 1460, height: 1180,
  lift: ['mulberry32', 'hashInt', 'makeNoise'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#6fd3ff'}, vit:180, tier:0});
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,1180);
    g.font='12px monospace';
    const seeds=[101,202,333,404,555,666,747,808,919,1024,1177,1288];
    seeds.forEach((s,i)=>{
      const x=16+(i%3)*482, y=26+((i/3)|0)*288;
      g.fillStyle='#8892b8'; g.fillText('river seed '+s+(i%2?' · iron village (road+river)':' · wild'), x, y-6);
      try{ g.drawImage(hdVista({seed:s, era:(i%2?'iron':'none'), pal:'day', wb:'temperate', flora:true, moons:1}), x, y, 470, 210); }
      catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,70), x, y+20); }
    });
  }`,
};
