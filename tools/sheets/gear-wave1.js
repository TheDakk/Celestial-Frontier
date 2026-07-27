// §22 gear proof sheet — WAVE 1: the rig line (T1→T3), the five suits, the
// three helms. Review lens: (1) TIER READS AS RICHNESS — rig1 worn/plain,
// rig3 announcing itself with plasma; (2) each suit is a TRUE IDENTITY on the
// shared chassis (seals / heat channels / pressure ribs / frost), never a
// recolor; (3) helm line escalates lamp → readout band → voidglass starfield.
module.exports = {
  width: 1180, height: 700,
  lift: ['mulberry32', 'hashInt'],
  // helpers + registry as ONE verbatim block — the simple const-lift truncates
  // multi-statement arrow consts at inner semicolons (materials47's lesson)
  liftBetween: ['const _gaSheen=', 'function partIcon('],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1180,700);
    let _cap=null; const _ce=document.createElement.bind(document);
    document.createElement=(t)=>{ const el=_ce(t); if(t==='canvas') _cap=el; return el; };
    const HUE={rig1:'#c2a878',rig2:'#ffd96a',rig3:'#ff7ae8',
      fieldsuit:'#9fb6d6',hazmat:'#9fe06a',thermal:'#ff8a72',presshull:'#cdb8ec',cryoline:'#8fd6ff',
      headlamp:'#ffd96a',visor:'#9fdfe8',voidhelm:'#3fe8c8'};
    const NAME={rig1:'Mining Rig I',rig2:'Mining Rig II',rig3:'Plasma Bore III',
      fieldsuit:'Field Suit',hazmat:'Hazmat Suit',thermal:'Thermal Weave',presshull:'Pressure Shell',cryoline:'Cryo Lining',
      headlamp:'Miner\\u2019s Headlamp',visor:'Scout Visor',voidhelm:'Voidglass Visor'};
    const ROWS=[
      ['THE RIG LINE \\u2014 tier must read as richness', ['rig1','rig2','rig3']],
      ['THE SUITS \\u2014 five identities, one chassis', ['fieldsuit','hazmat','thermal','presshull','cryoline']],
      ['THE HELMS \\u2014 lamp, visor, voidglass', ['headlamp','visor','voidhelm']],
    ];
    let y=40;
    for(const row of ROWS){
      const label=row[0], ids=row[1];
      g.fillStyle='#8892b8'; g.font='15px monospace';
      g.fillText(label, 18, y);
      y+=16;
      ids.forEach(function(id,i){
        const x=18+i*220;
        try{
          const S=144, cv=document.createElement('canvas'); cv.width=cv.height=S;
          const c2=cv.getContext('2d');
          const hue=HUE[id]||'#aab2c2';
          const n=parseInt(hue.slice(1),16), cr=(n>>16)&255, cg=(n>>8)&255, cb=n&255;
          const K=function(k,a){ return 'rgba('+Math.min(255,(cr*k)|0)+','+Math.min(255,(cg*k)|0)+','+Math.min(255,(cb*k)|0)+','+(a==null?1:a)+')'; };
          c2.fillStyle='rgba(0,0,0,0.35)'; c2.beginPath(); c2.ellipse(S*0.5,S*0.85,S*0.30,S*0.05,0,0,TAU); c2.fill();
          _GEAR_ART[id](c2,S,K);
          g.drawImage(cv, x, y, 144, 144);
          g.drawImage(cv, x+152, y+96, 48, 48);   // card-size check
        }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERR '+id+' '+String(e).slice(0,40), x, y+70); }
        g.fillStyle='#cfd6f2'; g.font='12px monospace';
        g.fillText(NAME[id]||id, x, y+162);
      });
      y+=200;
    }
  }`,
};
