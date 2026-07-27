// §22 gear proof sheet — WAVE 2: modules, ears, necklaces, gloves, legs,
// boots (the 14 remaining regular pieces) + the wave-1 REVIEW FIXES rerun
// (suit shoulders / hazmat hood seating / voidglass stars). Review lens:
// every silhouette distinct at card size; T3 pieces (anchor, prismpendant)
// announce themselves; pairs (gloves/legs/boots) read as worn equipment.
module.exports = {
  width: 1180, height: 1120,
  lift: ['mulberry32', 'hashInt'],
  liftBetween: ['const _gaSheen=', 'function partIcon('],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1180,1120);
    const HUE={struts:'#aab2c2',stabil:'#ffd96a',anchor:'#3fe8c8',
      earpiece:'#7fd0ff',resonator:'#b58cff',
      meteor:'#ffd96a',compass:'#7fd0ff',diplobeacon:'#cdbcff',prismpendant:'#ff7ae8',
      gripgloves:'#c2a878',surgeon:'#7fe6a0',fieldlegs:'#9fb6d6',greaves:'#ffd96a',magboots:'#aab2c2',
      fieldsuit:'#9fb6d6',hazmat:'#9fe06a',voidhelm:'#3fe8c8'};
    const NAME={struts:'Landing Struts',stabil:'Descent Stabilizers',anchor:'Gravitic Anchor',
      earpiece:'Comms Earpiece',resonator:'Vein Resonator',
      meteor:'Meteorite Pendant',compass:'Star Compass',diplobeacon:'Diplomat\\u2019s Beacon',prismpendant:'Prismatic Pendant',
      gripgloves:'Grip Gloves',surgeon:'Surgeon\\u2019s Gloves',fieldlegs:'Field Leggings',greaves:'Stabilizer Greaves',magboots:'Mag-Boots',
      fieldsuit:'Field Suit (fix rerun)',hazmat:'Hazmat Suit (fix rerun)',voidhelm:'Voidglass (fix rerun)'};
    const ROWS=[
      ['MODULES \\u2014 struts, stabilizers, the gravitic anchor', ['struts','stabil','anchor']],
      ['EARS + NECKLACES', ['earpiece','resonator','meteor','compass']],
      ['NECKLACES II + GLOVES', ['diplobeacon','prismpendant','gripgloves','surgeon']],
      ['LEGS + BOOTS', ['fieldlegs','greaves','magboots']],
      ['WAVE-1 REVIEW FIXES', ['fieldsuit','hazmat','voidhelm']],
    ];
    let y=40;
    for(const row of ROWS){
      const label=row[0], ids=row[1];
      g.fillStyle='#8892b8'; g.font='15px monospace';
      g.fillText(label, 18, y);
      y+=16;
      ids.forEach(function(id,i){
        const x=18+i*230;
        try{
          const S=144, cv=document.createElement('canvas'); cv.width=cv.height=S;
          const c2=cv.getContext('2d');
          const hue=HUE[id]||'#aab2c2';
          const n=parseInt(hue.slice(1),16), cr=(n>>16)&255, cg=(n>>8)&255, cb=n&255;
          const K=function(k,a){ return 'rgba('+Math.min(255,(cr*k)|0)+','+Math.min(255,(cg*k)|0)+','+Math.min(255,(cb*k)|0)+','+(a==null?1:a)+')'; };
          c2.fillStyle='rgba(0,0,0,0.35)'; c2.beginPath(); c2.ellipse(S*0.5,S*0.85,S*0.30,S*0.05,0,0,TAU); c2.fill();
          _GEAR_ART[id](c2,S,K);
          g.drawImage(cv, x, y, 144, 144);
          g.drawImage(cv, x+152, y+96, 48, 48);
        }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERR '+id+' '+String(e).slice(0,40), x, y+70); }
        g.fillStyle='#cfd6f2'; g.font='12px monospace';
        g.fillText(NAME[id]||id, x, y+162);
      });
      y+=210;
    }
  }`,
};
