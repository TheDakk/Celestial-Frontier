// 2026-07-24 planet-blend proof — Nick's screenshot fixes: (1) polar caps
// follow a NOISE coastline, sea-ice blue-grey vs land-snow warm-white, no
// detached blobs; (2) limb atmosphere haze hides the ortho noise-stretch
// "artifacts going around"; (3) the HD master (top row = 1024) is what a
// zoomed-in phone shows. Review lens: Earth reads smooth and blended —
// coasts, caps, clouds, limb — at FULL size.
module.exports = {
  width: 1560, height: 1080,
  lift: ['mulberry32', 'hashInt', 'makeNoise', 'clamp', 'hsl', 'mix', 'gasPalette', 'surfaceColor'],
  liftBetween: ['const CARD_FACTS=new Map();', 'function _cardFactsSet'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1560,1080);
    g.font='12px monospace';
    try{
    // re-implement the rasterizer verbatim-shape (private in ThumbArt): disc scan
    function raster(P, PX, fx){
      const c=document.createElement('canvas'); c.width=c.height=PX;
      const gg=c.getContext('2d'); const img=gg.createImageData(PX,PX); const d=img.data;
      const fbm=makeNoise(P.seed); const R0=PX/2;
      for(let y=0;y<PX;y++){ const dy=(y-R0)/R0;
        for(let x=0;x<PX;x++){ const dx=(x-R0)/R0, rr2=dx*dx+dy*dy, i=(y*PX+x)*4;
          if(rr2>1){ d[i+3]=0; continue; }
          const z=Math.sqrt(1-rr2), u=Math.atan2(dx,z)*1.4;
          const col=surfaceColor(P,u,dy,fbm,fx);
          let cr=col[0], cg2=col[1], cb=col[2];
          if(P.type==='terran'||P.type==='ocean'){
            const cl=fbm(u*2.6+40, dy*2.6-17, 5);
            if(cl>0.55){ const ca=Math.min((cl-0.55)*3.2,0.85);
              cr=cr*(1-ca)+250*ca; cg2=cg2*(1-ca)+252*ca; cb=cb*(1-ca)+255*ca; } }
          const shade=Math.max(dx*-0.42 + dy*-0.30 + z*0.86, 0);
          let lum=0.20+0.88*shade;
          const rr=Math.sqrt(rr2);
          if(rr>0.90){ const lt=(rr-0.90)/0.10;
            const hasAir=(P.type==='terran'||P.type==='ocean'||P.type==='venus'||P.type==='gas');
            if(hasAir){ const ar2=P.type==='venus'?[236,214,170]:(P.type==='gas'?[228,222,236]:[188,214,240]);
              const aa2=lt*lt*0.55;
              cr=cr*(1-aa2)+ar2[0]*aa2; cg2=cg2*(1-aa2)+ar2[1]*aa2; cb=cb*(1-aa2)+ar2[2]*aa2; } }
          d[i]=clamp(cr*lum,0,255); d[i+1]=clamp(cg2*lum,0,255); d[i+2]=clamp(cb*lum,0,255);
          d[i+3]= rr>0.97 ? Math.max(0,Math.round(255*(1-rr)/0.03)) : 255;
      } }
      gg.putImageData(img,0,0); return c;
    }
    const EARTH={type:'terran',seed:133,seaHue:210,landHue:115,iceAmt:0.5};
    // top: Earth at the new HD 1024, shown big (the phone's zoomed view)
    g.fillStyle='#ffd96a'; g.fillText('EARTH — 1024 HD master at full-screen scale (caps blended, limb haze, smooth coasts)', 20, 20);
    g.drawImage(raster(EARTH,1024,{band:'temperate',lush:true,civLights:0.5}), 20, 30, 620, 620);
    // beside it: three more terrans + an ocean + a cold terran (cap variety)
    const others=[
      ['terran temperate', {type:'terran',seed:5077,seaHue:195,landHue:95, iceAmt:0.3}, {band:'temperate',lush:true}],
      ['terran icy (iceAmt .9)', {type:'terran',seed:9241,seaHue:215,landHue:130,iceAmt:0.9}, {band:'temperate',lush:true}],
      ['terran cold band', {type:'terran',seed:733, seaHue:205,landHue:110,iceAmt:0.6}, {band:'cold'}],
      ['ocean world', {type:'ocean', seed:4111,seaHue:200,landHue:120,iceAmt:0.4}, {band:'temperate'}],
      ['venus (limb haze)', {type:'venus', seed:611, hue:44}, null],
      ['gas (limb haze)', {type:'gas', seed:135, hue:32, spot:true, spotHue:12}, null],
    ];
    for(let i=0;i<others.length;i++){
      const x=660+(i%3)*300, y=40+((i/3)|0)*330;
      g.fillStyle='#8892b8'; g.fillText(others[i][0], x, y-6);
      g.drawImage(raster(others[i][1],512,others[i][2]), x, y, 280, 280);
    }
    // bottom: cap close-up strip — Earth's north cap at 3 ice amounts
    g.fillStyle='#ffd96a'; g.fillText('CAP EDGE CLOSE-UP — noise coastline, sea-ice vs snow (iceAmt .2 / .5 / .9)', 20, 690);
    [0.2,0.5,0.9].forEach(function(ia,i){
      const P={type:'terran',seed:133,seaHue:210,landHue:115,iceAmt:ia};
      const cv2=raster(P,512,{band:'temperate',lush:true});
      // crop the top third (the cap) and blow it up
      g.drawImage(cv2, 96,0,320,170, 20+i*510, 700, 500, 266);
    });
    }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 40); }
  }`,
};
