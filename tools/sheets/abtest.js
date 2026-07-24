// A/B: does the EARTH-name path still get the painterly hide texture?
module.exports = {
  width: 1000, height: 520,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#ffd96a'}, vit:150, tier:0});
    g.fillStyle='#101624'; g.fillRect(0,0,1000,520);
    g.font='12px monospace';
    const base={seed:30541, kingdom:'fauna', color:3, accent:7, form:2, body:5, loco:0, trait:3,
      size:3, head:0, limbs:0, skin:1, tail:2, pattern:3, eyes:0, behavior:0, habitat:8};
    try{
      const A=hdGenesFor(Object.assign({}, base, {_earthName:'Tiger', name:'Tiger'}));
      const B=hdGenesFor(base);
      g.fillStyle='#ffd96a'; g.fillText('EARTH path: Tiger', 40, 24); g.fillText('PROCEDURAL path: same genes, no name', 540, 24);
      const ca=hdBeastBare(A,(30541^0x9A11)>>>0), cb=hdBeastBare(B,(30541^0x9A11)>>>0);
      const t1=document.createElement('canvas'); t1.width=t1.height=440; _fitBeast(t1.getContext('2d'),ca,440,A);
      const t2=document.createElement('canvas'); t2.width=t2.height=440; _fitBeast(t2.getContext('2d'),cb,440,B);
      g.drawImage(t1, 30, 40); g.drawImage(t2, 530, 40);
      const rec=_earthArt('Tiger');
      g.fillStyle='#7fe6a0'; g.fillText('rec: '+(rec?JSON.stringify(rec).slice(0,160):'NULL'), 20, 500);
      g.fillText('A.rig='+A.rig+' A.stripes='+A.stripes+' A.base='+JSON.stringify(A.base), 20, 484);
    }catch(e){ g.fillStyle='#f66'; g.fillText('ERR '+String(e).slice(0,120), 20, 60); }
  }`,
};
