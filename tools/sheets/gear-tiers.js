// §22 gear proof sheet — every crafted item's icon, grouped by tier band, so
// the tier-dress reads in one glance: T1 matte parts → T2 components glinting
// → T3 systems/relics aglow → cosmic gear (rar 7-9) wearing the starlight
// orbit. Review lens: richness must CLIMB left-to-right band by band, and no
// two same-family items should be indistinguishable at 96px.
module.exports = {
  width: 1220, height: 1210,
  lift: ['mulberry32', 'hashInt', 'ITEMS', 'ITEM_BY',
         'ELEM_NAME', 'EC', 'MAT_FAMILY', 'MATERIALS', 'matName', 'matColor', 'matFamily',
         'partIcon', '_partIcons'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1220,1210);
    let _cap=null; const _ce=document.createElement.bind(document);
    document.createElement=(t)=>{ const el=_ce(t); if(t==='canvas') _cap=el; return el; };
    const bands=[
      ['T1 — Basic Parts (matte)',        it=>it.tier===1&&!it.slot&&it.cat!=='sys'],
      ['T2 — Components (first glints)',  it=>it.tier===2&&it.cat==='comp'],
      ['T3 — Ship Systems (aglow)',       it=>it.cat==='sys'],
      ['Explorer Gear (tier-dressed)',    it=>it.cat==='gear'&&(it.rar==null||it.rar<7)],
      ['Signature Relics',                it=>it.cat==='relic'],
      ['COSMIC GEAR (rar 7-9 — starlight orbit)', it=>it.cat==='gear'&&it.rar>=7],
    ];
    let y=30;
    for(const [label,test] of bands){
      const list=ITEMS.filter(test);
      g.fillStyle='#8892b8'; g.font='14px monospace';
      g.fillText(label+'  ('+list.length+')', 16, y);
      y+=10;
      list.forEach((it,i)=>{
        const x=16+(i%9)*133, yy=y+((i/9)|0)*122;
        try{
          _cap=null; _partIcons.delete(it.id); partIcon(it.id);
          if(_cap) g.drawImage(_cap, x, yy, 96, 96);
          g.fillStyle='#c8d0e2'; g.font='10px monospace';
          g.fillText(it.name.slice(0,17), x, yy+108);
        }catch(e){ g.fillStyle='#ff6a5a'; g.fillText(it.id+': '+String(e).slice(0,30), x, yy+50); }
      });
      y+=Math.ceil(list.length/9)*122+28;
    }
  }`,
};
