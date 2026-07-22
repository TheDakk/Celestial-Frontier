// Pass 6 verify — eye QA (paired eyes on face-on heads), breed-blend (Earth rig
// + alien palette), four-winged plan 14, six-limbed plan 0.
module.exports = {
  width: 1320, height: 660,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1320,660);
    g.font='12px monospace';
    let seed=99000;
    const cell=(label,mut,col,row)=>{
      const gen=Object.assign({seed:seed++, kingdom:'fauna', color:5, accent:7, form:4, body:2, loco:0,
        trait:3, size:3, head:2, limbs:2, skin:3, tail:2, pattern:1, eyes:2, behavior:1, habitat:8}, mut);
      const G=hdGenesFor(gen);
      const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);
      const x=20+col*216, y=44+row*200, T=150;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,168);
      const tc=document.createElement('canvas'); tc.width=tc.height=T; const tx2=tc.getContext('2d');
      _fitBeast(tx2,bcv,T,G); g.drawImage(tc, x+(206-T)/2, y-4);
      g.fillStyle='#aab2d8'; g.fillText(label, x+6, y+160);
    };
    const rows=[
      ['EYE QA — face-on heads must show a MATCHED PAIR', [
        ['Gorilla',{_earthName:'Gorilla'}], ['Owl',{_earthName:'Owl'}], ['Tree Frog',{_earthName:'Tree Frog'}],
        ['Fruit Bat',{_earthName:'Fruit Bat'}], ['Proboscis Monkey',{_earthName:'Proboscis Monkey'}] ]],
      ['BREED BLEND — Earth rig + ALIEN palette (bred child)', [
        ['blend:Lion',{_earthBlend:'Lion',color:11,accent:2,pattern:5}], ['blend:Wolf',{_earthBlend:'Wolf',color:8,accent:13}],
        ['blend:Eagle',{_earthBlend:'Eagle',color:2,accent:6}], ['blend:Great White Shark',{_earthBlend:'Great White Shark',color:4,accent:9}],
        ['blend:Moose',{_earthBlend:'Moose',color:13,accent:5,lumin:1}] ]],
      ['INTEGRITY — 6-limbed plan0 / 4-winged plan14 (procedural)', [
        ['plan0 land grazer',{body:0,color:1}], ['plan0 land grazer',{body:0,color:9,size:4}],
        ['plan14 four-wing',{body:14,color:3}], ['plan14 four-wing',{body:14,color:12,size:4}],
        ['plan7 one-pair',{body:7,color:6}] ]],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='12px monospace'; g.fillText(row[0], 20, 30+ri*200);
      row[1].forEach((c,ci)=> cell(c[0], c[1], ci, ri));
    });
  }`,
};
