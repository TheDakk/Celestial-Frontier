// §22 materials proof sheet — ALL 47 material icons, grouped by family.
// Bespoke-cosmics review lens: the 7 cosmics must each read as WHAT THEY ARE
// (star / bound loop / first-matter / ancient ice / absence / time / unseen
// mass) and none may look like a recolor of another or of the gem exotics.
module.exports = {
  width: 1180, height: 1260,
  lift: ['mulberry32', 'hashInt',
         'ELEM_NAME', 'EC', 'ELEM_ICES', 'ELEM_GAS', 'ELEM_EXO', '_ELEM_ICEHD',
         'MAT_FAMILY', 'MATERIALS', 'matName', 'matColor', 'matFamily',
         '_hdElemIcon'],
  // the registry const holds ';' inside its draw fns — the simple const-lift
  // truncates it, so grab the whole block verbatim
  liftBetween: ['const _MAT_ART=', 'function _hdElemIcon('],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1180,1260);
    // capture the icon canvas synchronously (no data-URL decode race)
    let _cap=null; const _ce=document.createElement.bind(document);
    document.createElement=(t)=>{ const el=_ce(t); if(t==='canvas') _cap=el; return el; };
    const fams=['base','volatile','precious','exotic','cosmic'];
    let y=34;
    for(const f of fams){
      const keys=Object.keys(MATERIALS).filter(k=>MATERIALS[k].fam===f);
      g.fillStyle='#8892b8'; g.font='15px monospace';
      g.fillText(MAT_FAMILY[f].label+'  ('+keys.length+')', 18, y);
      y+=12;
      keys.forEach((k,i)=>{
        const x=18+(i%8)*145, yy=y+((i/8)|0)*118;
        try{
          _cap=null; _hdElemIcon(k);
          if(_cap) g.drawImage(_cap, x, yy, 96, 96);
          g.fillStyle='#c8d0e2'; g.font='11px monospace';
          g.fillText(matName(k), x, yy+108);
        }catch(e){ g.fillStyle='#ff6a5a'; g.fillText(k+': '+String(e).slice(0,40), x, yy+50); }
      });
      y+=Math.ceil(keys.length/8)*118+30;
    }
  }`,
};
