// 2026-07-25 CANOPY UNION proof (Gold Master wave-1 blocker #1) — every form
// that previously piled circles (tree/broad, shrub, juniper-bushy, yew-dense,
// pine-round, baobab, acacia) across seeds, PLUS a 200% zoom row. Acceptance:
// no construction circle individually visible at 100% or 200%.
module.exports = {
  width: 1560, height: 1240,
  lift: ['mulberry32', 'hashInt', 'SP_COLOR', 'SP_HEX', '_floraSpx', 'hdFloraBare'],
  liftBetween: ['function _leafRGBA', 'function _hdStampPlant'],
  draw: `function(g){
    window.TAU=Math.PI*2;
    g.fillStyle='#101624'; g.fillRect(0,0,1560,1240);
    g.font='11px monospace';
    try{
    const CASES=[
      ['tree/broad',   {form:'tree', tform:'broad', leaf:'rgba(64,120,58,0.9)'}],
      ['tree lum',     {form:'tree', tform:'broad', leaf:'rgba(90,80,160,0.9)', lum:'rgba(140,220,255,0.9)'}],
      ['shrub+fruit',  {form:'shrub', fruit:1, leaf:'rgba(58,110,52,0.9)', accent:'#d64a4a'}],
      ['conifer bushy',{form:'conifer', cform:'bushy', leaf:'rgba(52,96,58,0.92)'}],
      ['conifer dense',{form:'conifer', cform:'dense', leaf:'rgba(30,64,38,0.95)'}],
      ['conifer round',{form:'conifer', cform:'round', leaf:'rgba(44,92,50,0.92)'}],
      ['baobab',       {form:'tree', tform:'baobab', leaf:'rgba(96,128,58,0.9)'}],
      ['acacia',       {form:'tree', tform:'acacia', leaf:'rgba(84,118,52,0.9)'}],
    ];
    g.fillStyle='#8892b8'; g.fillText('ROWS 1-3: 100% scale, 3 seeds per form. ROW 4: 200% zoom crops (acceptance check).', 20, 20);
    for(let ci=0; ci<CASES.length; ci++){
      for(let si=0; si<3; si++){
        const x=20+ci*192, y=40+si*230;
        if(si===0){ g.fillStyle='#8892b8'; g.fillText(CASES[ci][0], x+30, y-4); }
        const cv=_hdPlantBare((7700+ci*131+si*977)>>>0, CASES[ci][1]);
        g.drawImage(cv, x, y, 180, 180);
      }
      /* 200% crop of the crown region of seed 0 */
      const cv2=_hdPlantBare((7700+ci*131)>>>0, CASES[ci][1]);
      g.drawImage(cv2, 30,10,120,120, 20+ci*192, 740, 240,240);
    }
    g.fillStyle='#8892b8'; g.fillText('BOTTOM: procedural flora via _floraSpx across 12 seeds (forms roll naturally)', 20, 1005);
    for(let i=0;i<12;i++){
      const gen={seed:52000+i*997, kingdom:'flora', color:i%17, accent:(i*5)%17, form:i%18, body:i%5, trait:i%25, pattern:i%4, lumin:(i%6===0)?1:0};
      const cv3=hdFloraBare(gen);
      g.drawImage(cv3, 20+i*128, 1020, 120, 120);
    }
    }catch(e){ g.fillStyle='#f66'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 40); }
  }`,
};
