// Pass 8 — lineage DRIFT: an Earth-blend lineage grows alien as generation climbs.
module.exports = {
  width: 1320, height: 680,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1320,680);
    g.font='12px monospace';
    let seed=97000;
    const cell=(label,mut,col,row)=>{
      const gen=Object.assign({seed:seed++, kingdom:'fauna', color:11, accent:2, form:4, body:0, loco:0,
        trait:3, size:3, head:5, limbs:2, skin:3, tail:6, pattern:1, eyes:3, behavior:1, habitat:1}, mut);
      const G=hdGenesFor(gen);
      const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const x=20+col*216, y=44+row*208, T=150;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,176);
      const tc=document.createElement('canvas'); tc.width=tc.height=T; const tx2=tc.getContext('2d');
      _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(206-T)/2, y-2);
      g.fillStyle='#aab2d8'; g.fillText(label, x+6, y+168);
    };
    const rows=[
      ['ORGANIC DRIFT — anchor set by the MATE (no toggle). Lion line, breeding choices drive it', [
        ['pure Lion',{_earthName:'Lion'}], ['xEarth kin (.85)',{_earthBlend:'Lion',_anchorVal:0.85}],
        ['xEarth again (.78)',{_earthBlend:'Lion',_anchorVal:0.78}], ['xALIEN (.62)',{_earthBlend:'Lion',_anchorVal:0.62}],
        ['xALIEN again (.40)',{_earthBlend:'Lion',_anchorVal:0.40}] ]],
      ['Deep drift — a Lion line bred repeatedly with aliens (keeps the feline rig)', [
        ['.72',{_earthBlend:'Lion',_anchorVal:0.72}], ['.55',{_earthBlend:'Lion',_anchorVal:0.55}],
        ['.42',{_earthBlend:'Lion',_anchorVal:0.42}], ['.30',{_earthBlend:'Lion',_anchorVal:0.30}], ['.22 floor',{_earthBlend:'Lion',_anchorVal:0.22}] ]],
      ['EAGLE line drift + refs', [
        ['Eagle .82',{_earthBlend:'Eagle',_anchorVal:0.82,head:3,eyes:1}], ['Eagle .55',{_earthBlend:'Eagle',_anchorVal:0.55,head:3,eyes:1}],
        ['Eagle .30',{_earthBlend:'Eagle',_anchorVal:0.30,head:3,eyes:1}], ['pure Eagle',{_earthName:'Eagle'}], ['pure alien',{body:0,head:5,eyes:3,tail:6}] ]],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(row[0], 20, 30+ri*208);
      row[1].forEach((c,ci)=> cell(c[0], c[1], ci, ri));
    });
  }`,
};
