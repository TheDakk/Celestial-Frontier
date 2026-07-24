// 2026-07-24 LIVE-VIEW composite (Nick: "mimicking a live view") — the new
// masters composed the way the game composes them: a system close-up (sun
// corona + granulated surface, HD Earth + moon, ringed giant + HD moons with
// terminator shading), a black-hole system, and a galaxy-interior field
// (starfield + nebula family + wormhole + distant quasar). Not a screenshot —
// a faithful mock of the draw order and scale relationships.
module.exports = {
  width: 1560, height: 1160,
  lift: ['mulberry32', 'hashInt', 'makeNoise', 'clamp', 'hsl', 'mix', 'gasPalette', 'surfaceColor',
         '_starSurfCache', '_starSurf', '_moonSprs', '_moonSpr', '_ringSprCache', '_ringSprite',
         '_bhSprC', '_bhSpr', '_wormSprC', '_wormSpr', '_quasarSprC', '_quasarSpr',
         '_decoSpr', 'decoSprite', '_starSpr', 'starSprite'],
  draw: `function(g){
    window.TAU=Math.PI*2;
    g.fillStyle='#04050c'; g.fillRect(0,0,1560,1160);
    g.font='12px monospace';
    try{
    // ---- the deep starfield every scene sits on ----
    const fr=mulberry32(0xFEE1);
    for(let i=0;i<420;i++){
      const sx=fr()*1560, sy=fr()*1160, ss=fr();
      g.globalAlpha=0.25+ss*0.6;
      g.drawImage(starSprite(ss<0.75?'#cfe4ff':'#ffe9c8', ss>0.97), sx, sy, 2+ss*7, 2+ss*7);
    }
    g.globalAlpha=1;
    // planet rasterizer (verbatim-shape of renderPlanetSprite's scan)
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
    // ════ SCENE A — system close-up ════
    g.fillStyle='#8892b8'; g.fillText('SYSTEM VIEW — sun corona + granulated surface · HD Earth + moon · ringed giant + HD moons', 30, 24);
    // the sun: live-view corona gradient, surface inside
    const SX=210, SY=360, SR=150;
    const cg3=g.createRadialGradient(SX,SY,0,SX,SY,SR*2.4);
    cg3.addColorStop(0,'#ffffff'); cg3.addColorStop(0.25,'#ffe9c8');
    cg3.addColorStop(0.6,'rgba(255,233,200,0.4)'); cg3.addColorStop(1,'rgba(255,233,200,0)');
    g.fillStyle=cg3; g.beginPath(); g.arc(SX,SY,SR*2.4,0,TAU); g.fill();
    g.drawImage(_starSurf(424242,'#ffe9c8',''), SX-SR, SY-SR, SR*2, SR*2);
    // Earth at HD with its moon
    const EARTH={type:'terran',seed:133,seaHue:210,landHue:115,iceAmt:0.5};
    g.drawImage(raster(EARTH,768,{band:'temperate',lush:true,civLights:0.5}), 640, 120, 380, 380);
    g.drawImage(_moonSpr(0,true), 1015, 150, 56, 56);
    { // terminator on the moon, star to the left (live-view grammar)
      g.save(); g.beginPath(); g.arc(1043,178,25,0,TAU); g.clip();
      g.fillStyle='rgba(4,6,18,0.55)'; g.beginPath(); g.arc(1043+14,178,24,0,TAU); g.fill(); g.restore(); }
    // ringed gas giant + two HD moons
    const GAS={type:'gas',seed:136,hue:44,spot:false};
    const rspr=_ringSprite(136,'224,206,166');
    const GX=1300, GY=330, GR=130;
    g.drawImage(rspr, GX-GR*1.7, GY-GR*1.7, GR*3.4, GR*3.4);          // full ring behind
    g.drawImage(raster(GAS,512,null), GX-GR, GY-GR, GR*2, GR*2);      // planet over its back half
    g.save(); g.beginPath(); g.rect(GX-GR*1.7, GY, GR*3.4, GR*1.7); g.clip();
    g.drawImage(rspr, GX-GR*1.7, GY-GR*1.7, GR*3.4, GR*3.4); g.restore();  // front half back on top
    g.drawImage(_moonSpr(1,true), GX-210, GY+120, 44, 44);
    g.drawImage(_moonSpr(2,true), GX+80, GY-215, 36, 36);
    // ════ SCENE B — black-hole system ════
    g.fillStyle='#8892b8'; g.fillText('BLACK-HOLE SYSTEM — baked accretion render + a frozen world', 30, 660);
    g.drawImage(_bhSpr(), 60, 690, 380, 380);
    const ICE={type:'ice',seed:7702,hue:210};
    g.drawImage(raster(ICE,512,null), 500, 850, 150, 150);
    // ════ SCENE C — galaxy interior ════
    g.fillStyle='#8892b8'; g.fillText('GALAXY INTERIOR — nebula nurseries along an arm · wormhole · distant quasar', 760, 660);
    const gr2=mulberry32(0xA37);
    for(let i=0;i<260;i++){ // denser arm starfield
      const sx=760+gr2()*770, sy=680+gr2()*450, ss=gr2();
      g.globalAlpha=0.3+ss*0.55;
      g.drawImage(starSprite(ss<0.7?'#cfe4ff':'#ffd9a8', ss>0.96), sx, sy, 1.5+ss*6, 1.5+ss*6);
    }
    g.globalAlpha=1;
    g.drawImage(decoSprite({k:'h2', x:31, y:77, hue:332}), 780, 700, 260, 260);
    g.drawImage(decoSprite({k:'neb', x:53, y:19, hue:202}), 1000, 820, 220, 220);
    g.drawImage(decoSprite({k:'mol', x:71, y:41}), 1180, 690, 240, 240);
    g.drawImage(decoSprite({k:'rem', x:97, y:63}), 1330, 860, 180, 180);
    g.drawImage(_wormSpr(), 1120, 940, 130, 130);
    g.drawImage(_quasarSpr(), 1420, 680, 120, 120);
    }catch(e){ g.fillStyle='#ff6a5a'; g.fillText('ERROR: '+String(e).slice(0,160), 20, 40); }
  }`,
};
