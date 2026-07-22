// Clip check: render RAW hdBeastBare (no box-fit) with the 300px canvas bounds
// drawn as a red frame. Any silhouette touching the top/edge = source clipping
// that box-fit cannot recover (Nick: camel heads look cut off).
module.exports = {
  width: 1320, height: 1180,
  lift: ['mulberry32', 'hashInt',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd0ff'}, vit:150, tier:0});
    g.fillStyle='#0a0e18'; g.fillRect(0,0,1320,1180);
    g.font='13px monospace';
    // vary size/head genes to hit worst cases, like the full catalog does
    const cell=(name,col,row)=>{
      const gi=col*7+row*13+3;
      const gen={seed:30000+gi*541, kingdom:'fauna', color:gi%17, accent:(gi*7)%17, form:gi%18,
        body:(gi*5)%16, loco:gi%13, trait:(gi*3)%25, size:5, head:gi%10, limbs:gi%6, skin:gi%9,
        tail:gi%7, pattern:(gi*3)%8, eyes:gi%6, behavior:gi%12, habitat:8, _earthName:name, name:name};
      const G=hdGenesFor(gen);
      const bcv=hdBeastBare(G,(gen.seed^0x9A11)>>>0);  // 300px
      const x=20+col*216, y=44+row*190, T=170;
      g.fillStyle='#11162a'; g.fillRect(x,y,206,158);
      // draw the RAW 300 canvas scaled into T; red frame = the 300px bounds
      g.drawImage(bcv, x+(206-T)/2, y-6, T, T);
      g.strokeStyle='rgba(255,80,80,0.55)'; g.lineWidth=1; g.strokeRect(x+(206-T)/2, y-6, T, T);
      g.fillStyle='#aab2d8'; g.fillText(name, x+6, y+150);
    };
    const rows=[
      ['LONG NECKS', ['Dromedary Camel','Bactrian Camel','Llama','Alpaca','Guanaco']],
      ['LONG NECKS 2', ['Vicuna','Gerenuk','Ostrich','Giraffe','Okapi']],
      ['TALL ORNAMENTS', ['Moose','Elk','Caribou','Ibex','Markhor']],
      ['TALL ORNAMENTS 2', ['Kudu','Oryx','Gemsbok','Addax','Sable Antelope']],
      ['BIG/TALL', ['Horse','Zebra','Wildebeest','Bison','Yak']],
      ['MISC TALL', ['Flamingo','Secretary Bird','Crane','Peacock','Kangaroo']],
    ];
    rows.forEach((row,ri)=>{
      g.fillStyle='#8892b8'; g.font='13px monospace';
      g.fillText(row[0], 20, 30+ri*190);
      row[1].forEach((nm,ci)=> cell(nm, ci, ri));
    });
  }`,
};
