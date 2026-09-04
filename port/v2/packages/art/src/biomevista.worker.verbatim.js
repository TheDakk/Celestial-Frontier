/* AUTO-LIFTED _hdVistaEco atmosphere overlay from main.js (v1.8.9).
   exact source sha256 d45d7b0ba3bf481bb0e4565d8cdeb9c4899dc5d2927e54f8a8d4ff414acc2df7. ⚠ DO NOT EDIT.
   Regenerate: node tools/lift-hdart.mjs
   BIOME_PROFILES and mulberry32 are explicit injected inputs. This is not the
   full hdVista compositor and owns no allocation, lifecycle, effects policy,
   camera motion, geometry placement, fauna, flora, or civilization pass. */
function applyPreservedBiomeVistaEcologyV1(g, W, H, hz, opts, seed, BIOME_PROFILES, mulberry32){
  /* v1.6 VISTA ECOSYSTEM (§G): the landing scene grows the biome's OWN life,
     drawn with the SAME card rigs (_hdPlantBare flora / hdBeastBare fauna) as
     tiny dark silhouettes, so the world you land on and the creatures you catch
     read as one place. Plus biome atmosphere fx (mist/ash/steam/acid/shimmer/
     abyssal beams) keyed on the profile's weather+hazard. Pure render, gated on
     a known BIOME_PROFILE; every draw is defensively wrapped. */
  if(typeof BIOME_PROFILES==='undefined') return;
  const prof=BIOME_PROFILES[opts.wb]; if(!prof) return;
  const r=mulberry32((seed^0x0EC0)>>>0);
  const night=opts.pal==='night'||opts.nightize;
  /* v1.6 (Nick's note): the world's REAL creatures + flora are placed prominently by
     hdVista's own genes/flora pass (colored card art via _hdPlaceBeast, lightly camo'd
     so you clearly SEE them in habitat). This layer is now ATMOSPHERE FX only. */
  // ATMOSPHERE FX by biome weather + hazard
  const wz=(prof.weather||'')+' '+opts.wb, hzd=prof.hazard||'';
  g.save();
  if(/mist|humid|swamp|marsh/.test(wz)){                 // low ground mist
    for(let i=0;i<4;i++){ const my=hz+(H-hz)*(0.18+i*0.18);
      g.fillStyle='rgba('+(night?'120,140,160':'200,210,220')+','+(0.05+r()*0.05).toFixed(3)+')';
      g.beginPath();g.ellipse(W*r(),my,W*(0.3+r()*0.3),9+r()*10,0,0,7);g.fill(); }
  }
  if(/ash|ember/.test(wz+' '+hzd)){                       // drifting ash / embers
    const em=/ember/.test(wz+' '+hzd);
    for(let i=0;i<40;i++){ g.fillStyle=em?'rgba(255,120,50,'+(0.2+r()*0.4).toFixed(2)+')':'rgba(120,116,112,'+(0.2+r()*0.3).toFixed(2)+')';
      g.fillRect(r()*W,hz+r()*(H-hz),1.2,1.2); }
  }
  if(/steam|cryo|geyser/.test(wz)){                       // rising steam plumes
    for(let i=0;i<3;i++){ const sx4=W*(0.2+r()*0.6),sgd=g.createLinearGradient(sx4,H,sx4,hz);
      sgd.addColorStop(0,'rgba(220,230,235,0.10)');sgd.addColorStop(1,'rgba(220,230,235,0)');
      g.fillStyle=sgd;g.beginPath();g.ellipse(sx4,H-20,26,58,0,0,7);g.fill(); }
  }
  if(/acid/.test(hzd)){                                   // acid halo
    const ag=g.createRadialGradient(W/2,hz,20,W/2,hz,W*0.5);
    ag.addColorStop(0,'rgba(180,200,60,0.10)');ag.addColorStop(1,'rgba(180,200,60,0)');
    g.fillStyle=ag;g.fillRect(0,0,W,H);
  }
  if(/salt-glare|mirage/.test(wz)){                       // heat / salt shimmer band
    g.fillStyle='rgba(255,250,230,0.06)';g.fillRect(0,hz,W,(H-hz)*0.3);
  }
  if(opts.wb==='abyssal'||/lightless/.test(wz)){          // abyssal light shafts
    for(let i=0;i<3;i++){ const bx4=W*(0.2+i*0.3+r()*0.1);
      g.save();g.translate(bx4,0);g.rotate((r()-0.5)*0.2);
      const bg2=g.createLinearGradient(0,0,0,H);bg2.addColorStop(0,'rgba(120,180,220,0.10)');bg2.addColorStop(1,'rgba(120,180,220,0)');
      g.fillStyle=bg2;g.fillRect(-20,0,40,H);g.restore(); }
  }
  g.restore();
}
const PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256 = 'd45d7b0ba3bf481bb0e4565d8cdeb9c4899dc5d2927e54f8a8d4ff414acc2df7';
export { applyPreservedBiomeVistaEcologyV1, PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256 };
