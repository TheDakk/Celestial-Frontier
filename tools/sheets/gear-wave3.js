// §22 gear proof sheet — WAVE 3: the NINE SIGNATURE RELICS + SEVEN COSMIC
// pieces. Review lens: every relic tells its Beacon's story on its family
// base with a strong aura; the cosmics look like nothing else in the hold —
// first-matter seams, a corona wreath, leaping plasma, a world being born,
// phase echoes, disagreeing clock hands, an absence that bends light.
module.exports = {
  width: 1400, height: 980,
  lift: ['mulberry32', 'hashInt'],
  liftBetween: ['const _gaSheen=', 'function partIcon('],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1400,980);
    const HUE={'rl-stone':'#c9a878','rl-ocean':'#4fc8e8','rl-flame':'#ff7a4a','rl-sky':'#8fd6ff','rl-life':'#7fe6a0',
      'rl-mind':'#c79fff','rl-star':'#ffd96a','rl-void':'#9a8aff','rl-prism':'#ff7ae8',
      'cg-proto':'#c8e06a','cg-corona':'#ff9d4a','cg-plasma':'#ffe27a','cg-genesis':'#bfeaff',
      'cg-void':'#8a5cff','cg-chron':'#4fe0d0','cg-dark':'#6a4a8a'};
    const NAME={'rl-stone':'Graven Aegis','rl-ocean':'Tidewalker Boots','rl-flame':'Emberforged Gauntlets',
      'rl-sky':'Skysail Module','rl-life':'Verdant Locket','rl-mind':'Mindreader Coil','rl-star':'Starcrowned Helm',
      'rl-void':'Voidwoven Leggings','rl-prism':'Prismatic Lathe',
      'cg-proto':'Protomatter Carapace','cg-corona':'Coronal Aegis','cg-plasma':'Plasma Gauntlets',
      'cg-genesis':'Genesis Locket','cg-void':'Void-Phase Greaves','cg-chron':'Chronal Drive','cg-dark':'Dark Matter Bore'};
    const ROWS=[
      ['THE NINE SIGNATURE RELICS \\u2014 each Beacon\\u2019s story', ['rl-stone','rl-ocean','rl-flame','rl-sky','rl-life','rl-mind']],
      ['', ['rl-star','rl-void','rl-prism']],
      ['THE SEVEN COSMIC PIECES \\u2014 like nothing else in the hold', ['cg-proto','cg-corona','cg-plasma','cg-genesis','cg-void','cg-chron']],
      ['', ['cg-dark']],
    ];
    let y=40;
    for(const row of ROWS){
      const label=row[0], ids=row[1];
      if(label){ g.fillStyle='#8892b8'; g.font='15px monospace'; g.fillText(label, 18, y); y+=16; }
      ids.forEach(function(id,i){
        const x=18+i*228;
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
      y+=label?214:198;
    }
  }`,
};
