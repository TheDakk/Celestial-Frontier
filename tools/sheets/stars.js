// Star catalog audit: every spectral class thumbnail + a couple of full
// galaxy-field star renders, so the whole stellar palette can be eyeballed at
// once (colors, coronae, remnant/exotic forms) for artifacts & coherence.
module.exports = {
  width: 1180, height: 460,
  lift: ['mulberry32', 'hashInt', 'starClass', 'starThumb', 'KIND_DESC', '_thumbSet', 'thumbCache'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1180,460);
    g.font='12px monospace';
    g.fillStyle='#8892b8'; g.fillText('star thumbnails — every spectral class (starThumb)', 16, 22);
    // starThumb returns a dataURL; capture the canvas it builds instead
    let _cap=null; const _ce=document.createElement.bind(document);
    document.createElement=(t)=>{ const el=_ce(t); if(t==='canvas') _cap=el; return el; };
    const shot=(k,c,bc)=>{ _cap=null; thumbCache.delete('s'+k+c+(bc?'~'+bc:'')); starThumb(k,c,bc); return _cap; };
    const classes=[['M','#ff9a6a'],['K','#ffd9a0'],['G','#fff4d8'],['A','#e8efff'],['B','#9ab8ff'],
      ['RG','#ff8a4a'],['SG','#ff7a50'],['BD','#c98a6a'],['WD','#eef4ff'],['NS','#dceaff'],
      ['MAG','#cfe0ff'],['BH','#9a86c8'],['PROTO','#ff9a5a']];
    classes.forEach((c,i)=>{
      const x=24+(i%7)*162, y=54+((i/7)|0)*196;
      try{ const cv=shot(c[0],c[1],null); if(cv) g.drawImage(cv, x, y, 128, 128);
        g.fillStyle='#c8d0e2'; g.font='12px monospace'; g.fillText(c[0], x+4, y+146);
      }catch(e){ g.fillStyle='#ff6a5a'; g.fillText(c[0]+': '+String(e).slice(0,30), x, y+60); }
    });
    try{ const cv=shot('G','#fff4d8','#ff9a6a'); if(cv) g.drawImage(cv, 24+6*162, 250, 128, 128);
      g.fillStyle='#c8d0e2'; g.fillText('G binary', 24+6*162+4, 250+146); }catch(e){}
  }`,
};
