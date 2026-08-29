/* AUTO-LIFTED portable vista compositor. exact selected-source sha256 00e5195ec2e83aed84bf4e1116fe1b7ebb8d163a5ae469c16ad2f712211852d3. ⚠ DO NOT EDIT.
   Regenerate: node tools/lift-hdart.mjs. UI lifecycle, app state and presentation copy excluded. */
import { createSpeciesCanvas } from './speciescanvas.js';
import { mulberry32, clamp, TAU } from '@cf/domain-rand';
import { FA_SIZE_M } from '@cf/domain-speciestraits';
import { hdBeastBare, _hdPlantBare, hdFloraBare, _hdCamo, _hdStampPlant, _hdPlaceBeast, _hdHash, _hdFbm, _hdSm, HD_PALS } from './hdportrait.worker.verbatim.js';

function _hdVolcano(g,W,hz,seed,r,vx0){
  const vx=vx0||W*0.62, vy=hz-88, bw=150, by2=hz+18;
  g.fillStyle='#301410';
  g.beginPath();g.moveTo(vx-bw,by2);
  g.quadraticCurveTo(vx-bw*0.28,vy+26,vx-16,vy);
  g.lineTo(vx+13,vy+2);
  g.quadraticCurveTo(vx+bw*0.30,vy+30,vx+bw*0.94,by2);
  g.closePath();g.fill();
  g.fillStyle='rgba(122,44,24,0.32)';
  g.beginPath();g.moveTo(vx-2,vy+3);g.lineTo(vx+13,vy+2);
  g.quadraticCurveTo(vx+bw*0.30,vy+30,vx+bw*0.94,by2);
  g.lineTo(vx+bw*0.5,by2);g.quadraticCurveTo(vx+bw*0.16,vy+42,vx-2,vy+3);g.closePath();g.fill();
  g.save();g.globalCompositeOperation='lighter';
  const cg2=g.createRadialGradient(vx,vy+2,2,vx,vy+2,46);
  cg2.addColorStop(0,'rgba(255,180,90,0.85)');cg2.addColorStop(0.35,'rgba(255,110,40,0.35)');cg2.addColorStop(1,'rgba(255,110,40,0)');
  g.fillStyle=cg2;g.beginPath();g.arc(vx,vy+2,46,0,7);g.fill();
  const trickle=()=>{g.beginPath();g.moveTo(vx-4,vy+4);
    g.quadraticCurveTo(vx+9,vy+40,vx-2,vy+62);
    g.quadraticCurveTo(vx-11,vy+84,vx+6,by2-6);g.stroke();};
  g.strokeStyle='rgba(255,110,40,0.28)';g.lineWidth=5.5;trickle();
  g.strokeStyle='rgba(255,152,62,0.85)';g.lineWidth=2.2;trickle();
  g.restore();
  for(let sp=0;sp<9;sp++){const t=sp/8;
    g.fillStyle='rgba(20,12,12,'+(0.34*(1-t*0.7)).toFixed(3)+')';
    g.beginPath();g.ellipse(vx+2-t*70-r()*10, vy-8-t*88, 10+t*34, 7+t*20, -0.3, 0, 7);g.fill();
    if(sp<3){g.fillStyle='rgba(255,120,50,'+(0.10*(1-t)).toFixed(3)+')';
      g.beginPath();g.ellipse(vx+1-t*20, vy-4-t*26, 8+t*12, 5+t*8, 0, 0, 7);g.fill();}
  }
}
/* the master vista: opts={seed, biome:'land'|'island', era:'none'|'iron'|'space',
   pal key, wx: the card's weather token|null, moons, aurora:bool (the card's
   magnetosphere — auroras crown the poles), genes:[fauna genes]|null} */
/* WEATHER EVENTS (v1.3.5 Batch 5b-ii) — the Weather row has promised
   "endless hurricanes" and "planet-circling dust storms" since launch;
   now the sky pays up. The same seeded ~90s spell mechanism as wxNow,
   rarer odds, honest to type + biome + the weather actually falling.
   Airless rocky worlds stay weatherless forever. */

const WX_EVENT_WORD={tornado:'a tornado on the horizon', hurricane:'a hurricane wall closing in',
  haboob:'a sand wall rolling in', icestorm:'an ice storm glazing everything',
  cryoeruption:'a cryogeyser in full eruption', virga:'acid rain dying in the air',
  volclightning:'volcanic lightning in the ash', firewhirl:'fire whirls walking the fields',
  ironrain:'iron rain glowing as it falls'};
/* the showpiece painters — one scene-sized statement each, all seeded */
function _hdWxEvent(g, evt, seed, hz, W, H, night){
  const r=mulberry32((seed^0xE7A2)>>>0);
  const A=night?0.7:1;
  /* the big shapes blur into the air; lightning and rain streaks stay sharp */
  if(evt==='tornado'){
    try{ g.filter='blur(2px)'; }catch(_){ }
    const x=W*(0.55+r()*0.3), top=hz*0.30, w0=34+r()*20;
    const tg=g.createLinearGradient(0,top,0,hz);
    tg.addColorStop(0,'rgba(40,42,52,'+(0.75*A)+')'); tg.addColorStop(1,'rgba(30,30,38,'+(0.55*A)+')');
    g.fillStyle=tg; g.beginPath();
    g.moveTo(x-w0,top); g.quadraticCurveTo(x-w0*0.2, hz*0.6, x-4+(r()-0.5)*10, hz);
    g.lineTo(x+6+(r()-0.5)*10, hz); g.quadraticCurveTo(x+w0*0.3, hz*0.6, x+w0*1.1, top);
    g.closePath(); g.fill();
    g.fillStyle='rgba(46,46,56,'+(0.8*A)+')'; g.beginPath(); g.ellipse(x,top,w0*2.4,14,0,0,TAU); g.fill();
    const dg4=g.createRadialGradient(x,hz,0,x,hz,50);
    dg4.addColorStop(0,'rgba(90,84,70,'+(0.45*A)+')'); dg4.addColorStop(1,'rgba(90,84,70,0)');
    g.fillStyle=dg4; g.beginPath(); g.arc(x,hz,50,0,TAU); g.fill();
  } else if(evt==='hurricane'){
    try{ g.filter='blur(5px)'; }catch(_){ }
    const cx3=W*(0.28+r()*0.44);
    for(let k=0;k<4;k++){
      const rr2=60+k*46, a0=r()*TAU;
      const ag2=g.createRadialGradient(cx3,hz,rr2-26,cx3,hz,rr2+18);
      ag2.addColorStop(0,'rgba(70,78,92,0)');
      ag2.addColorStop(0.55,'rgba(70,78,92,'+((0.34-k*0.06)*A)+')');
      ag2.addColorStop(1,'rgba(70,78,92,0)');
      g.fillStyle=ag2; g.beginPath(); g.arc(cx3,hz,rr2+18,Math.PI+a0*0.04,TAU-0.2); g.fill();
    }
    const wg2=g.createLinearGradient(0,hz*0.55,0,hz);
    wg2.addColorStop(0,'rgba(52,58,72,0)'); wg2.addColorStop(1,'rgba(52,58,72,'+(0.5*A)+')');
    g.fillStyle=wg2; g.fillRect(0,hz*0.55,W,hz*0.45);
  } else if(evt==='haboob'){
    try{ g.filter='blur(5px)'; }catch(_){ }
    const x0=W*(0.5+r()*0.3);
    const hg2=g.createLinearGradient(x0,0,W,0);
    hg2.addColorStop(0,'rgba(150,110,60,0)'); hg2.addColorStop(0.35,'rgba(150,110,60,'+(0.65*A)+')');
    hg2.addColorStop(1,'rgba(120,86,44,'+(0.9*A)+')');
    g.fillStyle=hg2; g.fillRect(x0,hz*0.18,W-x0,H-hz*0.18);
    for(let i=0;i<8;i++){
      const bx=x0+(W-x0)*r(), by=hz*(0.2+r()*0.5), br=20+r()*36;
      const bg5=g.createRadialGradient(bx,by,0,bx,by,br);
      bg5.addColorStop(0,'rgba(160,120,70,'+(0.5*A)+')'); bg5.addColorStop(1,'rgba(160,120,70,0)');
      g.fillStyle=bg5; g.beginPath(); g.arc(bx,by,br,0,TAU); g.fill();
    }
  } else if(evt==='icestorm'){
    g.strokeStyle='rgba(220,236,250,'+(0.5*A)+')'; g.lineWidth=1.1;
    for(let i=0;i<60;i++){
      const x=r()*W, y=r()*H*0.9, ln=8+r()*14;
      g.beginPath(); g.moveTo(x,y); g.lineTo(x-ln*0.5,y+ln); g.stroke();
    }
    for(let i=0;i<26;i++){
      g.fillStyle='rgba(235,247,255,'+(0.35+r()*0.5).toFixed(2)+')';
      g.fillRect(r()*W, hz+(H-hz)*r(), 2, 1.4);
    }
  } else if(evt==='cryoeruption'){
    try{ g.filter='blur(3px)'; }catch(_){ }
    const x=W*(0.3+r()*0.4), h=hz*0.85;
    const pg2=g.createLinearGradient(x,hz,x,hz-h);
    pg2.addColorStop(0,'rgba(240,248,255,'+(0.75*A)+')'); pg2.addColorStop(1,'rgba(240,248,255,0)');
    g.fillStyle=pg2; g.beginPath();
    g.moveTo(x-4,hz); g.quadraticCurveTo(x-14,hz-h*0.55,x-30,hz-h);
    g.lineTo(x+30,hz-h); g.quadraticCurveTo(x+14,hz-h*0.55,x+4,hz); g.closePath(); g.fill();
    const fog=g.createRadialGradient(x,hz-h,0,x,hz-h,80);
    fog.addColorStop(0,'rgba(230,242,252,'+(0.4*A)+')'); fog.addColorStop(1,'rgba(230,242,252,0)');
    g.fillStyle=fog; g.beginPath(); g.arc(x,hz-h,80,0,TAU); g.fill();
  } else if(evt==='virga'){
    /* Safari/iOS has no ctx.filter — the old blur(3px) silently no-oped
       there and the shafts rendered as hard flat-topped slabs that read
       as a city skyline (Nick's Venus postcard). Feather by hand: an
       offscreen shaft faded on BOTH axes, stamped with a slight lean —
       rain dying in the air on every browser. */
    const vc=createSpeciesCanvas(1, 1); vc.width=32; vc.height=96;
    const vgc=vc.getContext('2d');
    if(vgc){
      const vv=vgc.createLinearGradient(0,0,0,96);
      vv.addColorStop(0,'rgba(210,200,160,0)'); vv.addColorStop(0.18,'rgba(210,200,160,'+(0.38*A)+')');
      vv.addColorStop(1,'rgba(210,200,160,0)');
      vgc.fillStyle=vv; vgc.fillRect(0,0,32,96);
      const vh=vgc.createLinearGradient(0,0,32,0);
      vh.addColorStop(0,'rgba(0,0,0,0)'); vh.addColorStop(0.5,'rgba(0,0,0,1)'); vh.addColorStop(1,'rgba(0,0,0,0)');
      vgc.globalCompositeOperation='destination-in';
      vgc.fillStyle=vh; vgc.fillRect(0,0,32,96);
      for(let i=0;i<7;i++){
        const x=W*(0.08+r()*0.84), top=hz*0.28+r()*20, fall=hz*0.30, w=16+r()*14;
        g.save(); g.translate(x,top); g.rotate((r()-0.5)*0.10);
        g.drawImage(vc,-w/2,0,w,fall);
        g.restore();
      }
    }
  } else if(evt==='volclightning'){
    const x=W*(0.3+r()*0.4), top=hz*0.12;
    g.strokeStyle='rgba(210,225,255,'+(0.85*A)+')'; g.lineWidth=1.6;
    for(let k2=0;k2<3;k2++){
      let cx4=x+(r()-0.5)*60, cy4=top+r()*20;
      g.beginPath(); g.moveTo(cx4,cy4);
      for(let s3=0;s3<5;s3++){ cx4+=(r()-0.5)*34; cy4+=hz*0.10; g.lineTo(cx4,cy4); }
      g.stroke();
    }
    const lg3=g.createRadialGradient(x,top+30,0,x,top+30,110);
    lg3.addColorStop(0,'rgba(190,210,255,'+(0.30*A)+')'); lg3.addColorStop(1,'rgba(190,210,255,0)');
    g.fillStyle=lg3; g.beginPath(); g.arc(x,top+30,110,0,TAU); g.fill();
  } else if(evt==='firewhirl'){
    try{ g.filter='blur(3px)'; }catch(_){ }
    for(let i=0;i<2;i++){
      const x=W*(0.25+r()*0.5), h=60+r()*50, y=hz+(H-hz)*(0.25+r()*0.3);
      const fg2=g.createLinearGradient(x,y,x+(r()-0.5)*16,y-h);
      fg2.addColorStop(0,'rgba(255,140,50,0.8)'); fg2.addColorStop(0.7,'rgba(255,90,30,0.35)'); fg2.addColorStop(1,'rgba(255,90,30,0)');
      g.fillStyle=fg2; g.beginPath();
      g.moveTo(x-3,y); g.quadraticCurveTo(x-8,y-h*0.5,x-4,y-h);
      g.lineTo(x+4,y-h); g.quadraticCurveTo(x+8,y-h*0.5,x+3,y); g.closePath(); g.fill();
    }
  } else if(evt==='ironrain'){
    g.strokeStyle='rgba(255,150,70,0.75)'; g.lineWidth=1.4;
    for(let i=0;i<40;i++){
      const x=r()*W, y=r()*H*0.8, ln=10+r()*16;
      g.beginPath(); g.moveTo(x,y); g.lineTo(x-2,y+ln); g.stroke();
    }
  }
  try{ g.filter='none'; }catch(_){ }
}
/* COLOSSAL WANDERERS — when a world's own roster carries a titanic
   creature, a rare roll shows it at true scale: a back breaking the
   horizon, and the scene is suddenly very small. Card-honest since
   launch (FA_SIZE has always said 'titanic'). */
function _hdTitan(g, mode, seed, hz, W, H, night){
  const r=mulberry32((seed^0x717A)>>>0);
  const x=W*(0.30+r()*0.40), span=W*(0.28+r()*0.14);
  const col=night?'rgba(8,10,16,0.92)':'rgba(16,18,26,0.85)';
  if(mode==='deck'){
    g.fillStyle=col;
    g.beginPath(); g.ellipse(x, hz*0.5, span*0.5, span*0.09, -0.06, 0, TAU); g.fill();
    for(let f=0;f<3;f++){ const fx=x-span*0.3+f*span*0.3;
      g.beginPath(); g.moveTo(fx,hz*0.5); g.lineTo(fx+span*0.05,hz*0.5-span*0.10); g.lineTo(fx+span*0.10,hz*0.5); g.closePath(); g.fill(); }
    return;
  }
  try{ g.filter='blur(1.2px)'; }catch(_){ }
  /* land/sea: ONE long living back arcing through the ground line — a
     continuous spine, not floating domes (Nick's globes report). The
     silhouette rises to a shoulder, runs a ridge of plates, and sinks
     to a tail; distance haze blends it into the scene's air. */
  const hh=22+r()*16, x0=x-span*0.55, x1=x+span*0.55;
  g.fillStyle=col;
  g.beginPath(); g.moveTo(x0,hz+3);
  const segs=7;
  for(let s4=0;s4<=segs;s4++){
    const t2=s4/segs, sx4=x0+(x1-x0)*t2;
    /* two rolling crests along one body, tallest a third of the way in */
    const env2=Math.sin(t2*Math.PI);
    const crest=(Math.sin(t2*Math.PI*2.2+0.4)*0.30+0.70);
    g.lineTo(sx4, hz+3-hh*env2*crest);
  }
  g.lineTo(x1,hz+3); g.closePath(); g.fill();
  /* ridge plates along the spine */
  for(let p2=1;p2<6;p2++){
    const t3=p2/6, sx5=x0+(x1-x0)*t3;
    const top=hz+3-(22+r()*16)*Math.sin(t3*Math.PI)*0.92;
    g.beginPath(); g.moveTo(sx5-5,top+4); g.lineTo(sx5+(r()-0.5)*4,top-6-r()*5); g.lineTo(sx5+5,top+4);
    g.closePath(); g.fill();
  }
  /* spray or dust where the body breaks the surface — both ends AND two
     mid-body breaths (art audit: with contact only at the ends, the long
     straight belly read as a floating slab against the bright haze band) */
  for(const tq of [0.06, 0.38, 0.66, 0.94]){
    const ex=x0+(x1-x0)*tq, er2=tq>0.2&&tq<0.8?16:26;
    const sg3=g.createRadialGradient(ex,hz+2,0,ex,hz+2,er2);
    sg3.addColorStop(0, mode==='sea'?'rgba(210,230,240,'+(tq>0.2&&tq<0.8?0.28:0.45)+')':'rgba(120,100,70,'+(tq>0.2&&tq<0.8?0.24:0.40)+')');
    sg3.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=sg3; g.beginPath(); g.arc(ex,hz+2,er2,0,TAU); g.fill();
  }
  /* the contact SKIRT — a low lap of spray/dust along the whole belly, so
     the baseline is SEATED in the surface instead of ruled across it */
  {const sk2=g.createLinearGradient(0,hz-3,0,hz+9);
   const skc=mode==='sea'?'196,220,236':'134,116,86';
   sk2.addColorStop(0,'rgba('+skc+',0)');sk2.addColorStop(0.5,'rgba('+skc+','+(night?0.10:0.20)+')');sk2.addColorStop(1,'rgba('+skc+',0)');
   g.fillStyle=sk2; g.fillRect(x0-6,hz-3,(x1-x0)+12,12);}
  /* at sea, the mass DARKENS the water beneath it — a soft mirrored shadow
     (a body that big reflects; a body with no reflection floats) */
  if(mode==='sea'){
    const rf2=g.createLinearGradient(0,hz+4,0,hz+20);
    rf2.addColorStop(0,'rgba(8,10,16,'+(night?0.30:0.22)+')');rf2.addColorStop(1,'rgba(8,10,16,0)');
    g.fillStyle=rf2;
    g.beginPath(); g.moveTo(x0+span*0.04,hz+4);
    for(let s5=0;s5<=segs;s5++){ const t6=s5/segs;
      g.lineTo(x0+(x1-x0)*t6, hz+4+hh*0.5*Math.sin(t6*Math.PI)); }
    g.lineTo(x1-span*0.04,hz+4); g.closePath(); g.fill();
  }
  /* distance haze — the air between you and it */
  const hzW=g.createLinearGradient(0,hz-hh-14,0,hz+6);
  hzW.addColorStop(0,'rgba(150,165,190,'+(night?0.06:0.14)+')');
  hzW.addColorStop(1,'rgba(150,165,190,0)');
  g.fillStyle=hzW; g.fillRect(x0-10,hz-hh-14,(x1-x0)+20,hh+20);
  try{ g.filter='none'; }catch(_){ }
}
/* THE DEEP — the Abyssal world's vista goes beneath the waves: the first
   sub-surface vantage (the cloud deck set the precedent — the vantage
   follows the card's truth). No sky, no weather; biolume is the light. */
function renderPreservedAbyssVistaV1(o){
  const W=960,H=430,cv=createSpeciesCanvas(1, 1);cv.width=W;cv.height=H;
  const g=cv.getContext('2d'), r=mulberry32((o.seed^0xAB55)>>>0);
  const sea=g.createLinearGradient(0,0,0,H);
  sea.addColorStop(0,'#0a2236'); sea.addColorStop(0.4,'#05131f'); sea.addColorStop(1,'#01060a');
  g.fillStyle=sea; g.fillRect(0,0,W,H);
  /* the dim ceiling of the sea — light shafts losing the argument */
  for(let i=0;i<5;i++){
    const x=W*(0.1+r()*0.8), w2=30+r()*50;
    const shaft=g.createLinearGradient(x,0,x+(r()-0.5)*30,H*0.5);
    shaft.addColorStop(0,'rgba(120,180,210,0.10)'); shaft.addColorStop(1,'rgba(120,180,210,0)');
    g.fillStyle=shaft; g.fillRect(x-w2/2,0,w2,H*0.5);
  }
  /* biolume motes and drifting blooms */
  for(let i=0;i<120;i++){
    const x=r()*W, y=H*0.15+r()*H*0.8;
    g.fillStyle='rgba('+(r()<0.6?'120,230,255':'170,140,255')+','+(0.15+r()*0.5).toFixed(2)+')';
    g.fillRect(x,y,1.4+r()*1.4,1.2);
  }
  /* the vents far below — warm light through black water */
  for(let i=0;i<3;i++){
    const x=W*(0.15+r()*0.7), y=H*(0.86+r()*0.1);
    const vg3=g.createRadialGradient(x,y,0,x,y,60+r()*40);
    vg3.addColorStop(0,'rgba(255,120,60,0.30)'); vg3.addColorStop(1,'rgba(255,120,60,0)');
    g.fillStyle=vg3; g.beginPath(); g.arc(x,y,60+r()*40,0,TAU); g.fill();
  }
  /* the world's OWN deep-sea life — the actual genes drawn as pressure-DARK silhouettes with a local
     bioluminescent lure, so an Earth abyss (anglerfish / giant squid) and a procedural abyss read as
     DIFFERENT life, and an EMPTY abyss (no genes) carries no fauna at all (RC3 Gold blockers 1/2/3). */
  const genes=o.genes||[];
  genes.slice(0,3).forEach((G,i)=>{ if(!G) return; try{
    const anchor=(i===0), sc=anchor?196:112, gx=W*(anchor?0.34:(i===1?0.68:0.5)), gy=H*(anchor?0.5:0.36+i*0.05);
    const bcv=hdBeastBare(G,(((o.seed||0)^(i*0x51))>>>0));
    const work=createSpeciesCanvas(1, 1);work.width=work.height=bcv.width;const wgc=work.getContext('2d');
    wgc.drawImage(bcv,0,0);wgc.globalCompositeOperation='source-atop';wgc.fillStyle='rgba(2,10,16,0.82)';wgc.fillRect(0,0,bcv.width,bcv.width);   // pressure-dark
    g.drawImage(work, gx-sc/2, gy-sc/2, sc, sc);
    const lr=anchor?12:7, lx=gx+sc*0.16, ly=gy-sc*0.1;   // a controlled local glow (lure / biolume)
    const lg4=g.createRadialGradient(lx,ly,0,lx,ly,lr);
    lg4.addColorStop(0,'rgba(150,240,255,0.85)'); lg4.addColorStop(1,'rgba(150,240,255,0)');
    g.fillStyle=lg4; g.beginPath(); g.arc(lx,ly,lr,0,TAU); g.fill();
  }catch(_){ } });
  const vg4=g.createRadialGradient(W/2,H*0.45,H*0.3,W/2,H*0.5,W*0.62);
  vg4.addColorStop(0,'rgba(0,0,0,0)'); vg4.addColorStop(1,'rgba(0,2,5,0.5)');
  g.fillStyle=vg4; g.fillRect(0,0,W,H);
  return cv;
}
/* THE REEF — the Coral-Shallows world's vista goes beneath the bright shallows
   (v1.6 B15, review §5.4: it was reading as a beach). A sunlit turquoise water
   column, caustic rays, a sandy substrate crowded with coral colonies + fish
   schools, and the world's own creatures swimming in-column. No sky, no beach. */
function renderPreservedReefVistaV1(o){
  const W=960,H=430,cv=createSpeciesCanvas(1, 1);cv.width=W;cv.height=H;
  const g=cv.getContext('2d'), r=mulberry32(((o.seed||0)^0x8EEF)>>>0);
  const sea=g.createLinearGradient(0,0,0,H);
  sea.addColorStop(0,'#8fe8e4'); sea.addColorStop(0.35,'#39bcc4'); sea.addColorStop(0.72,'#1c8698'); sea.addColorStop(1,'#0e5e72');
  g.fillStyle=sea; g.fillRect(0,0,W,H);
  const surf=g.createLinearGradient(0,0,0,H*0.13);           // the bright underside of the surface
  surf.addColorStop(0,'rgba(232,255,255,0.55)'); surf.addColorStop(1,'rgba(232,255,255,0)');
  g.fillStyle=surf; g.fillRect(0,0,W,H*0.13);
  g.save(); g.globalCompositeOperation='lighter';            // sunlit caustic rays from above
  for(let i=0;i<7;i++){ const x=W*(0.05+r()*0.9), w2=18+r()*36;
    const ray=g.createLinearGradient(x,0,x+(r()-0.5)*80,H*0.82);
    ray.addColorStop(0,'rgba(205,255,248,0.16)'); ray.addColorStop(1,'rgba(205,255,248,0)');
    g.fillStyle=ray; g.beginPath();g.moveTo(x-w2/2,0);g.lineTo(x+w2/2,0);g.lineTo(x+w2,H*0.85);g.lineTo(x-w2*0.6,H*0.85);g.closePath();g.fill(); }
  g.restore();
  for(let i=0;i<55;i++){ g.fillStyle='rgba(222,255,250,'+(0.08+r()*0.22).toFixed(2)+')'; g.fillRect(r()*W,r()*H*0.9,1.2,1.2); }   // drifting motes
  const floorY=H*0.80;                                       // sandy reef substrate
  const sand=g.createLinearGradient(0,floorY,0,H);
  sand.addColorStop(0,'#d0be8e'); sand.addColorStop(1,'#9c8862');
  g.fillStyle=sand; g.beginPath();g.moveTo(0,floorY);
  for(let x=0;x<=W;x+=60){ g.lineTo(x,floorY+Math.sin(x*0.02)*8+(r()-0.5)*6); }
  g.lineTo(W,H);g.lineTo(0,H);g.closePath();g.fill();
  const CC=['#e07a6a','#e6a24a','#c86ad0','#5ac8b4','#e0c04a','#e88fb0'];   // coral colonies: branching / brain / fan
  for(let i=0;i<10;i++){ const cx=W*(0.045+i*0.098+(r()-0.5)*0.03), cy=floorY+(r()-0.2)*10, sc=0.65+r()*0.85, col=CC[(i+((r()*6)|0))%CC.length], k=i%3;
    if(k===0){ g.strokeStyle=col; g.lineCap='round';
      const br=(x,y,ang,len,d)=>{ if(d>3||len<6)return; const ex=x+Math.cos(ang)*len,ey=y+Math.sin(ang)*len;
        g.lineWidth=(7-d*1.5)*sc; g.beginPath();g.moveTo(x,y);g.lineTo(ex,ey);g.stroke(); br(ex,ey,ang-0.5,len*0.72,d+1);br(ex,ey,ang+0.45,len*0.72,d+1); };
      br(cx,cy,-1.5708,26*sc,0);
    } else if(k===1){ g.fillStyle=col; g.beginPath();g.ellipse(cx,cy-8*sc,24*sc,16*sc,0,Math.PI,0);g.fill();
      g.strokeStyle='rgba(0,0,0,0.2)';g.lineWidth=1.4; for(let j=1;j<4;j++){ g.beginPath();g.arc(cx,cy-8*sc,(24*sc)*(1-j*0.25),Math.PI,0);g.stroke(); }
    } else { g.fillStyle=col; g.save();g.globalAlpha=0.85;
      g.beginPath();g.moveTo(cx,cy);g.quadraticCurveTo(cx-22*sc,cy-40*sc,cx,cy-46*sc);g.quadraticCurveTo(cx+22*sc,cy-40*sc,cx,cy);g.closePath();g.fill();g.restore(); } }
  const genes=o.genes||[];                                   // the world's own creatures, swimming in-column
  if(genes.length){ for(let s=0;s<3;s++){ const bx=W*(0.2+r()*0.6), by=H*(0.3+r()*0.32), dir=r()<0.5?1:-1;   // fish schools (FAUNA -> populated only; empty reef is coral + water only, RC3 Gold blocker 1)
    g.fillStyle='rgba(30,54,64,0.5)';
    for(let f=0;f<12;f++){ const fx=bx+(r()-0.5)*90, fy=by+(r()-0.5)*40; g.beginPath();g.ellipse(fx,fy,4,2,0,0,7);g.fill();
      g.beginPath();g.moveTo(fx-dir*4,fy);g.lineTo(fx-dir*7,fy-2);g.lineTo(fx-dir*7,fy+2);g.closePath();g.fill(); } } }
  genes.slice(0,2).forEach((G,i)=>{ if(!G)return; try{
    const bcv=hdBeastBare(G,(((o.seed||0)^(i*0x51))>>>0)), sc=(i===0?168:104);
    const gx=W*(i===0?0.34:0.68), gy=H*(i===0?0.52:0.4);
    const work=createSpeciesCanvas(1, 1);work.width=work.height=bcv.width;const wgc=work.getContext('2d');
    wgc.drawImage(bcv,0,0);wgc.globalCompositeOperation='source-atop';wgc.fillStyle='rgba(120,205,212,0.26)';wgc.fillRect(0,0,bcv.width,bcv.width);
    g.drawImage(work, gx-sc/2, gy-sc/2, sc, sc);
  }catch(_){ } });
  const vg=g.createRadialGradient(W/2,H*0.4,H*0.32,W/2,H*0.52,W*0.62);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(2,26,34,0.4)');
  g.fillStyle=vg; g.fillRect(0,0,W,H);
  return cv;
}
/* the biome dressing (v1.3.5 Batch 5b) — the Biome row's words painted
   into the scene. One compact painter per feature family, all seeded, no
   strokes-for-glow, layered before the near-ground fringe so the vignette
   still grades everything as one picture. */
function _hdBiomeDress(g, o, seed, hz, W, H, BIOME_PROFILES){
  const r=mulberry32((seed^0xD135)>>>0), wb=o.wb;
  const night=o.pal==='night'||o.nightize;
  const A=night?0.55:1;                          /* the dark knocks features back */
  const groundY=k=>hz+(H-hz)*k;
  const wash=(col,a)=>{ const wg=g.createLinearGradient(0,hz,0,H);
    wg.addColorStop(0,'rgba('+col+','+(a*0.55).toFixed(3)+')');
    wg.addColorStop(1,'rgba('+col+','+a.toFixed(3)+')');
    g.fillStyle=wg; g.fillRect(0,hz,W,H-hz); };
  const spires=(col,glow,n,hMin,hMax)=>{ for(let i=0;i<n;i++){
    const x=W*(0.08+r()*0.84), y=groundY(0.25+r()*0.55), h=hMin+r()*(hMax-hMin), w2=h*(0.16+r()*0.12);
    g.fillStyle=col; g.beginPath(); g.moveTo(x-w2,y); g.lineTo(x+(r()-0.5)*w2*0.6,y-h); g.lineTo(x+w2,y); g.closePath(); g.fill();
    if(glow){ const gg2=g.createRadialGradient(x,y-h*0.55,0,x,y-h*0.55,h*0.7);
      gg2.addColorStop(0,glow); gg2.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gg2; g.beginPath(); g.arc(x,y-h*0.55,h*0.7,0,TAU); g.fill(); } } };
  const boulders=(col,n)=>{ for(let i=0;i<n;i++){
    const x=W*r(), y=groundY(0.3+r()*0.6), rr=3+r()*10*(0.5+(y-hz)/(H-hz));
    g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rr,rr*0.62,0,0,TAU); g.fill();
    g.fillStyle='rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x,y+rr*0.5,rr,rr*0.2,0,0,TAU); g.fill(); } };
  const ridges=(col,n)=>{ try{ g.filter='blur(3px)'; }catch(_){ } for(let i=0;i<n;i++){
    const y=groundY(0.18+i*(0.5/n)), amp=6+r()*10;
    g.fillStyle=col; g.beginPath(); g.moveTo(0,y);
    for(let x2=0;x2<=W;x2+=40) g.lineTo(x2, y+Math.sin(x2*0.01+i*2+r()*2)*amp);
    g.lineTo(W,y+amp+8); g.lineTo(0,y+amp+8); g.closePath(); g.fill(); } try{ g.filter='none'; }catch(_){ } };
  const veins=(col,n)=>{ g.lineWidth=1.4;
    for(let i=0;i<n;i++){ const x=W*r(), y=groundY(0.25+r()*0.6);
      g.strokeStyle=col; g.beginPath(); g.moveTo(x,y);
      let cx2=x, cy2=y;
      for(let s2=0;s2<4;s2++){ cx2+=(r()-0.5)*40; cy2+=(r()*10); g.lineTo(cx2,cy2); }
      g.stroke(); } };
  const shimmer=(col,n)=>{ for(let i=0;i<n;i++){
    g.fillStyle='rgba('+col+','+(0.2+r()*0.45).toFixed(2)+')';
    g.fillRect(W*r(), groundY(0.2+r()*0.7), 1.6+r()*2, 1.2); } };
  const mist=(col,a,y0,h2)=>{ const mg=g.createLinearGradient(0,y0,0,y0+h2);
    mg.addColorStop(0,'rgba('+col+',0)'); mg.addColorStop(0.5,'rgba('+col+','+a.toFixed(2)+')'); mg.addColorStop(1,'rgba('+col+',0)');
    g.fillStyle=mg; g.fillRect(0,y0,W,h2); };
  const plumes=(n)=>{ for(let i=0;i<n;i++){
    const x=W*(0.12+r()*0.76), y=groundY(0.25+r()*0.4), h=30+r()*60;
    const pg=g.createLinearGradient(x,y,x+(r()-0.5)*14,y-h);
    pg.addColorStop(0,'rgba(235,244,252,'+(0.5*A)+')'); pg.addColorStop(1,'rgba(235,244,252,0)');
    g.fillStyle=pg; g.beginPath();
    g.moveTo(x-2,y); g.quadraticCurveTo(x-4-r()*6, y-h*0.6, x-8-r()*8, y-h);
    g.lineTo(x+8+r()*8, y-h); g.quadraticCurveTo(x+4+r()*6, y-h*0.6, x+2,y); g.closePath(); g.fill(); } };
  const towers=(capCol,stalkCol,n)=>{ for(let i=0;i<n;i++){
    const x=W*(0.06+r()*0.88), y=groundY(0.3+r()*0.55), h=(14+r()*30)*(0.5+(y-hz)/(H-hz)), w2=h*0.16;
    g.fillStyle=stalkCol; g.fillRect(x-w2/2, y-h, w2, h);
    g.fillStyle=capCol; g.beginPath(); g.ellipse(x, y-h, h*0.4, h*0.18, 0, Math.PI, 0); g.fill(); } };
  const devils=(n)=>{ for(let i=0;i<n;i++){
    const x=W*(0.15+r()*0.7), y=groundY(0.3+r()*0.3), h=36+r()*50;
    const dg3=g.createLinearGradient(x,y,x+(r()-0.5)*20,y-h);
    dg3.addColorStop(0,'rgba(190,150,100,'+(0.35*A)+')'); dg3.addColorStop(1,'rgba(190,150,100,0)');
    g.fillStyle=dg3; g.beginPath();
    g.moveTo(x-3,y); g.quadraticCurveTo(x-10, y-h*0.5, x-14, y-h);
    g.lineTo(x+14, y-h); g.quadraticCurveTo(x+10, y-h*0.5, x+3, y); g.closePath(); g.fill(); } };
  switch(wb){
    /* terran */
    case 'savanna':  wash('150,118,34',0.42); boulders('rgba(70,52,26,0.55)',4); break;
    case 'jungle':   wash('8,46,12',0.46); towers('rgba(16,52,20,0.9)','rgba(20,34,14,0.9)',24); mist('160,190,150',0.14*A,hz+4,34);
      { /* v1.6 B15 (review 5.2): a dense CANOPY ceiling + hanging vines + foreground broadleaf so the scene reads as jungle, not open field */
        g.fillStyle='rgba(9,38,13,'+(0.94*A).toFixed(2)+')';                      // canopy ceiling across the top of the frame
        for(let i=0;i<30;i++){ const cx=W*(i/29)+((r()-0.5)*46), cy=hz*(0.02+r()*0.30), cr=26+r()*34;
          g.beginPath();g.ellipse(cx,cy,cr,cr*0.60,0,0,7);g.fill(); }
        g.strokeStyle='rgba(8,34,12,'+(0.7*A).toFixed(2)+')';g.lineWidth=2;g.lineCap='round';   // vines dangling from the canopy
        for(let i=0;i<8;i++){ const vx=W*(0.06+r()*0.88); g.beginPath();g.moveTo(vx,hz*(0.12+r()*0.16));
          g.quadraticCurveTo(vx+(r()-0.5)*34,hz*0.45,vx+(r()-0.5)*44,hz*0.6+r()*46);g.stroke(); }
        g.fillStyle='rgba(11,42,15,'+(0.95*A).toFixed(2)+')';                     // foreground broadleaf fronds rising from the near ground
        for(let i=0;i<11;i++){ const bx=W*(i/10)+((r()-0.5)*54), bh=52+r()*74;
          for(let l=0;l<5;l++){ const a=-2.0+l*0.5, lx=bx+Math.cos(a)*bh*0.5, ly=H-Math.abs(Math.sin(a))*bh;
            g.save();g.translate(lx,ly);g.rotate(a+1.5708);g.beginPath();g.ellipse(0,0,bh*0.34,bh*0.13,0,0,7);g.fill();g.restore(); } } }
      break;
    case 'marsh':    wash('44,72,40',0.30); mist('180,200,180',0.20*A,groundY(0.45),48); spires('rgba(52,74,40,0.7)',null,14,6,16); break;
    case 'swamp':    /* R3: standing water + dead snags, not just dark hills */
      wash('8,14,8',0.52); towers('rgba(30,40,22,0.85)','rgba(18,22,12,0.9)',9); mist('120,140,110',0.26*A,groundY(0.3),64);
      for(let i=0;i<6;i++){ const px2=W*(0.06+r()*0.88), py2=groundY(0.35+r()*0.5), pw=55+r()*75, ph=9+r()*6;
        const wg2=g.createRadialGradient(px2,py2,0,px2,py2,pw);
        wg2.addColorStop(0,'rgba(24,32,30,'+(0.85*A).toFixed(2)+')');
        wg2.addColorStop(0.7,'rgba(24,32,30,'+(0.45*A).toFixed(2)+')');
        wg2.addColorStop(1,'rgba(24,32,30,0)');
        g.save();g.translate(px2,py2);g.scale(1,ph/pw);g.translate(-px2,-py2);
        g.fillStyle=wg2;g.beginPath();g.arc(px2,py2,pw,0,7);g.fill();g.restore();
        g.fillStyle='rgba(130,160,150,'+(0.14*A).toFixed(2)+')';g.beginPath();g.ellipse(px2,py2-1,pw*0.6,2,0,0,7);g.fill(); }
      break;
    case 'mangrove': /* R3: tidal channels + stilt roots */
      wash('26,40,26',0.26); towers('rgba(24,48,26,0.9)','rgba(30,26,14,0.95)',7);
      g.fillStyle='rgba(70,110,116,'+(0.5*A).toFixed(2)+')';
      for(let i=0;i<4;i++){ const cy2=groundY(0.3+i*0.18);
        g.beginPath();g.moveTo(0,cy2);
        for(let x2=0;x2<=W;x2+=60) g.lineTo(x2,cy2+Math.sin(x2*0.02+i*2)*7);
        g.lineTo(W,cy2+9+r()*5);g.lineTo(0,cy2+9+r()*5);g.closePath();g.fill(); }
      g.strokeStyle='rgba(34,30,16,'+(0.9*A).toFixed(2)+')';g.lineWidth=2;g.lineCap='round';
      for(let i=0;i<12;i++){ const rx=W*(0.05+r()*0.9), ry=groundY(0.35+r()*0.45);
        for(const sg2 of [-1,0,1]){ g.beginPath();g.moveTo(rx,ry-16-r()*10);g.quadraticCurveTo(rx+sg2*7,ry-6,rx+sg2*12,ry+3);g.stroke(); } }
      break;
    case 'tundra':   /* R3: tundra READS SNOW — pale strong wash, drifts, frost haze */
      wash('212,220,230',0.55); boulders('rgba(96,104,112,0.55)',4); mist('225,235,245',0.30*A,hz+6,40);
      /* Nick 2026-07-24: snow is BLENDED MASS, not stamped circles — layered
         radial gradients fading into the ground, wider than they are tall */
      for(let i=0;i<11;i++){ const dx=W*(i/10)+((r()-0.5)*70), dy=groundY(0.25+r()*0.6), dw=50+r()*70, dh=10+r()*8;
        const sg4=g.createRadialGradient(dx,dy,0,dx,dy,dw);
        sg4.addColorStop(0,'rgba(240,245,250,'+(0.55*A).toFixed(2)+')');
        sg4.addColorStop(0.55,'rgba(232,240,248,'+(0.28*A).toFixed(2)+')');
        sg4.addColorStop(1,'rgba(232,240,248,0)');
        g.save();g.translate(dx,dy);g.scale(1,dh/dw);g.translate(-dx,-dy);
        g.fillStyle=sg4;g.beginPath();g.arc(dx,dy,dw,0,7);g.fill();g.restore(); }
      break;
    case 'karst':    ridges('rgba(60,64,58,0.35)',2); spires('rgba(52,58,50,0.8)',null,5,18,42); break;
    case 'saltflat': wash('230,232,228',0.55); shimmer('255,255,255',55);   /* v1.6 B15.4: dry white crust + POLYGONAL cracking + mirage (distinct from saltpan) */
      g.strokeStyle='rgba(150,156,150,0.4)';g.lineWidth=1;
      for(let i=0;i<15;i++){ const cx6=W*r(), cy6=groundY(0.42+r()*0.52), rr=16+r()*30; g.beginPath();
        for(let k=0;k<=5;k++){ const a=k/5*TAU+r()*0.3, px=cx6+Math.cos(a)*rr, py=cy6+Math.sin(a)*rr*0.4; k?g.lineTo(px,py):g.moveTo(px,py); } g.closePath();g.stroke(); }
      mist('235,240,240',0.16*A,groundY(0.32),30); break;
    case 'saltpan': wash('210,220,222',0.42);   /* v1.6 B15.4: shallow reflective BRINE + evaporite terraces */
      for(let i=0;i<4;i++){ const py=groundY(0.5+i*0.11), pg2=g.createLinearGradient(0,py,0,py+16);
        pg2.addColorStop(0,'rgba(180,212,222,0.5)');pg2.addColorStop(1,'rgba(180,212,222,0)'); g.fillStyle=pg2;g.fillRect(0,py,W,16); }
      g.strokeStyle='rgba(222,216,200,0.5)';g.lineWidth=2;
      for(let i=0;i<5;i++){ const y6=groundY(0.5+r()*0.38); g.beginPath();g.moveTo(0,y6); for(let x6=0;x6<=W;x6+=50)g.lineTo(x6,y6+Math.sin(x6*0.02+i)*4);g.stroke(); }
      shimmer('255,255,255',36); break;
    case 'fungal':   towers('rgba(150,110,160,'+(0.85*A)+')','rgba(90,74,96,0.9)',9); mist('150,120,160',0.08*A,groundY(0.4),40); break;
    case 'crystalsteppe': spires('rgba(120,150,190,0.55)','rgba(150,190,240,'+(0.10*A)+')',7,16,46); break;
    /* ocean */
    case 'coral':    /* R3: a reef shelf — turquoise shallows + coral forms */
      wash('30,150,150',0.30); shimmer('160,240,230',48);
      for(let i=0;i<5;i++){ const px3=W*(0.05+r()*0.9), py3=groundY(0.3+r()*0.55), pw3=60+r()*75, ph3=10+r()*7;
        const cg4=g.createRadialGradient(px3,py3,0,px3,py3,pw3);
        cg4.addColorStop(0,'rgba(110,215,215,'+(0.40*A).toFixed(2)+')');
        cg4.addColorStop(0.65,'rgba(90,200,205,'+(0.20*A).toFixed(2)+')');
        cg4.addColorStop(1,'rgba(90,200,205,0)');
        g.save();g.translate(px3,py3);g.scale(1,ph3/pw3);g.translate(-px3,-py3);
        g.fillStyle=cg4;g.beginPath();g.arc(px3,py3,pw3,0,7);g.fill();g.restore(); }
      g.lineCap='round';
      for(let i=0;i<10;i++){ const cx2=W*(0.04+r()*0.92), cy3=groundY(0.4+r()*0.5), ch2=10+r()*14;
        g.strokeStyle=['rgba(235,120,110,0.85)','rgba(240,170,90,0.85)','rgba(210,90,150,0.85)'][i%3]; g.lineWidth=2.4;
        for(const a2 of [-0.5,-0.1,0.35]){ g.beginPath();g.moveTo(cx2,cy3);
          g.quadraticCurveTo(cx2+a2*ch2,cy3-ch2*0.6,cx2+a2*ch2*1.6,cy3-ch2);g.stroke(); } }
      break;
    case 'stormsea': mist('90,100,110',0.22*A,hz-40,50); break;
    case 'volcisle': spires('rgba(26,14,12,0.9)','rgba(255,120,50,'+(0.10*A)+')',3,30,60); veins('rgba(255,110,40,'+(0.5*A)+')',4); break;
    case 'milksea':  shimmer('140,230,255',70); mist('120,220,250',0.10,groundY(0.2),50); break;
    /* ice */
    case 'packice':  ridges('rgba(190,215,235,0.30)',3); break;
    case 'cryogeyser': plumes(3); break;
    case 'blueice':  ridges('rgba(80,140,210,0.35)',2); spires('rgba(90,150,220,0.5)','rgba(120,190,255,'+(0.12*A)+')',4,22,50); break;
    /* desert */
    case 'canyon':   wash('116,62,30',0.18);   /* v1.6 B15.4: actual VERTICAL canyon walls + strata (was reading as low hills) */
      for(const side of [0,1]){ const wx=side?W:0, dir=side?-1:1;
        g.fillStyle='rgba(70,34,18,0.92)'; g.beginPath(); g.moveTo(wx,hz);
        g.lineTo(wx+dir*W*(0.16+r()*0.06),hz); g.lineTo(wx+dir*W*(0.20+r()*0.06),groundY(0.55)); g.lineTo(wx+dir*W*0.10,H); g.lineTo(wx,H); g.closePath(); g.fill();
        g.strokeStyle='rgba(40,18,10,0.5)';g.lineWidth=2;                        // exposed strata bands
        for(let s2=0;s2<6;s2++){ const yy=hz+(H-hz)*(0.12+s2*0.15); g.beginPath();g.moveTo(wx,yy);g.lineTo(wx+dir*W*(0.14+r()*0.05),yy+ (r()-0.5)*8);g.stroke(); } }
      ridges('rgba(96,48,26,0.6)',2); break;
    case 'oxide':    wash('120,50,20',0.18); devils(2+((r()<0.5)?1:0)); break;
    case 'glass':    wash('150,170,175',0.10); shimmer('230,250,255',60);   /* v1.6 B15.4: large translucent GLASS shards + refraction (was reading as sand + sparkles) */
      for(let i=0;i<7;i++){ const gx=W*(0.06+r()*0.88), gy=groundY(0.4+r()*0.5), gh=26+r()*44, gw=gh*(0.12+r()*0.1);
        const gg3=g.createLinearGradient(gx,gy,gx,gy-gh); gg3.addColorStop(0,'rgba(180,220,235,0.5)'); gg3.addColorStop(1,'rgba(220,245,255,0.14)');
        g.fillStyle=gg3; g.beginPath();g.moveTo(gx-gw,gy);g.lineTo(gx+(r()-0.5)*gw,gy-gh);g.lineTo(gx+gw,gy);g.closePath();g.fill();
        g.strokeStyle='rgba(240,252,255,0.55)';g.lineWidth=1;g.beginPath();g.moveTo(gx-gw*0.3,gy);g.lineTo(gx+(r()-0.5)*gw*0.5,gy-gh*0.96);g.stroke(); }
      break;
    /* rocky (v1.6 B15.3: the grey worlds read too samey/bland — stronger, biome-specific dressing) */
    case 'cratered': boulders('rgba(78,78,84,0.8)',10);   /* impact-crater rings so an airless rock reads as cratered */
      g.lineWidth=2; for(let i=0;i<4;i++){ const cx4=W*(0.12+r()*0.76), cy4=groundY(0.4+r()*0.45), rr=14+r()*34;
        g.strokeStyle='rgba(28,28,34,0.6)'; g.beginPath();g.ellipse(cx4,cy4,rr,rr*0.4,0,0,TAU);g.stroke();
        g.strokeStyle='rgba(160,160,170,0.28)'; g.beginPath();g.ellipse(cx4,cy4-2,rr*0.9,rr*0.36,0,0,TAU);g.stroke(); } break;
    case 'boulder':  boulders('rgba(64,64,74,0.88)',18); boulders('rgba(94,94,106,0.6)',8); break;   /* a dense, layered boulder field */
    case 'graben':   ridges('rgba(40,40,50,0.55)',4); veins('rgba(22,22,30,0.65)',4); break;          /* fault ridges + rift cracks */
    case 'geode':    wash('40,26,60',0.18);                                                            /* an amethyst world: crystals everywhere */
      spires('rgba(140,90,190,0.75)','rgba(180,130,250,'+(0.20*A)+')',8,16,44); veins('rgba(185,135,250,'+(0.5*A)+')',4);
      { g.fillStyle='rgba(160,110,220,0.72)';g.strokeStyle='rgba(212,172,255,0.5)';g.lineWidth=1;      /* a foreground crystal cluster */
        const cx5=W*(0.2+r()*0.58), cy5=groundY(0.72);
        for(let i=0;i<6;i++){ const a=-1.95+i*0.33, hh=18+r()*22, tx=cx5+Math.cos(a)*10;
          g.beginPath();g.moveTo(tx-5,cy5);g.lineTo(tx+Math.cos(a)*hh*0.3,cy5-hh);g.lineTo(tx+5,cy5);g.closePath();g.fill();g.stroke(); } } break;
    case 'carbon':   wash('6,6,9',0.46); shimmer('220,235,255',34);                                    /* a sootier black world + graphite spires */
      { g.fillStyle='rgba(14,14,18,0.92)';for(let i=0;i<7;i++){ const x5=W*(0.08+r()*0.84), y5=groundY(0.42+r()*0.48), hh=16+r()*28;
        g.beginPath();g.moveTo(x5-hh*0.14,y5);g.lineTo(x5+(r()-0.5)*hh*0.3,y5-hh);g.lineTo(x5+hh*0.14,y5);g.closePath();g.fill(); } } break;
    /* venus */
    case 'sulfurdeck': wash('140,120,20',0.20); mist('190,170,60',0.16,hz-30,60); break;
    case 'abyssgreen': wash('10,20,10',0.35); mist('40,70,40',0.20,hz-20,70); break;
    /* lava */
    case 'ashwaste': wash('60,58,56',0.28); mist('120,116,112',0.16,groundY(0.3),50); break;
    case 'obsidian': wash('6,4,8',0.35); veins('rgba(255,90,30,'+(0.55*A)+')',6); shimmer('200,180,255',18); break;
    case 'magmasea': { const mg2=g.createLinearGradient(0,groundY(0.35),0,H);
      mg2.addColorStop(0,'rgba(255,120,40,0)'); mg2.addColorStop(1,'rgba(255,120,40,0.30)');
      g.fillStyle=mg2; g.fillRect(0,groundY(0.35),W,H-groundY(0.35));
      veins('rgba(255,150,60,0.7)',8); break; }
  }
}
function _vistaSizeScale(gn){
  /* v1.6 (Nick): in the VISTA, creatures scale by their REAL size so a whale
     looms and a beetle is a speck — the opposite of the card's box-fit (which
     normalizes for readability). Size from the size gene (FA_SIZE_M meters) or,
     failing that, bulk. Clamped 0.5-1.8x so nothing clips the frame or vanishes. */
  if(!gn) return 1;
  const sz=(gn.size!=null)?FA_SIZE_M[gn.size%FA_SIZE_M.length]:null;
  let f=(sz!=null)?(0.55+(sz-0.28)/0.97*1.05):(0.5+(((gn.bulk!=null?gn.bulk:0.9)-0.6)/1.1)*1.1);
  return clamp(f, 0.55, 1.4);   /* v1.6 B15 (review 0.1): pull the top down — heroes (deer/lion/camel/bear) read oversized; lift the floor so secondary fauna don't vanish */
}
function _hdVistaEco(g, W, H, hz, opts, seed, BIOME_PROFILES){
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
function renderPreservedGenericVistaV1(opts, BIOME_PROFILES){
  const W=960,H=430,cv=createSpeciesCanvas(1, 1);cv.width=W;cv.height=H;
  const g=cv.getContext('2d'),seed=opts.seed>>>0,r=mulberry32((seed^0x9d7)>>>0);
  const P=HD_PALS[opts.pal]||HD_PALS.day, desert=opts.pal==='dust'||opts.pal==='sand';
  const ember=opts.pal==='ember', dusk=opts.pal==='twilight', sea=opts.biome==='island', wx=opts.wx||null;
  /* worlds whose type-pal has no clock of its own (ice/rocky/venus/desert)
     honor the card's clock with a grade: nightize = starlight over the
     type's own scene, duskize = the dusk grade. The caption must never
     say "local night" over a daylight picture. */
  const nightize=!!opts.nightize, duskize=!!opts.duskize;
  /* the card's Life row decides whether anything green stands anywhere;
     the Water row decides the river: 'liquid' | 'frozen' | 'none' */
  const flora=opts.flora!==false;
  const water=opts.water||'liquid';
  const civ=opts.era||'none';
  /* THE INFINITY DIALS (L1): every fixed anchor becomes a seeded
     parameter — two worlds of the same type stop being the same
     painting. All presentation-layer; determinism holds per seed. */
  const rL=mulberry32((seed^0x1A70)>>>0);
  const hz=H*(0.465+rL()*0.075);
  const sx=civ==='none'?W*(0.24+rL()*0.54):W*(0.60+rL()*0.24);   /* keep the sun off the skyline */
  const sy=(dusk||opts.duskize)?hz-32:H*0.15;   /* twilight suns sit LOW everywhere (round-2 audit) */
  const cmpFlip=rL()<0.5, cmpShift=(rL()-0.5)*W*0.22;
  const rX=x=>cmpFlip?W-x:x;
  /* wonder rolls (L3) — rare, card-derived: rings overhead, a looming
     primary moon, bioluminescent shores; combinations rarer still */
  const rW=mulberry32((seed^0x0B0E)>>>0);
  const bigMoon=(opts.moons||0)>0 && rW()<0.06;
  const bioLume=rW()<0.10 && flora && (opts.pal==='night');
  const ringSky=!!opts.ring;
  /* the star's own light (I2): blend its color into sun + crest */
  let sunC='#fff6dc', sunHalo='255,246,220';
  if(opts.stc){
    const sn=parseInt(String(opts.stc).slice(1),16);
    const sr=(sn>>16)&255, sg9=(sn>>8)&255, sb=sn&255;
    const bl=(a,b2)=>Math.round(a*0.42+b2*0.58);
    sunHalo=bl(sr,255)+','+bl(sg9,246)+','+bl(sb,220);
    sunC='rgb('+bl(sr,255)+','+bl(sg9,246)+','+bl(sb,220)+')';
  }
  const sky=g.createLinearGradient(0,0,0,hz+8);
  sky.addColorStop(0,P.skyTop);sky.addColorStop(0.62,P.skyMid);sky.addColorStop(1,P.skyHz);
  g.fillStyle=sky;g.fillRect(0,0,W,hz+8);
  if(opts.pal==='night'){
    for(let s5=0;s5<220;s5++){g.fillStyle='rgba(255,255,255,'+(0.15+r()*0.6)+')';
      g.fillRect(r()*W,r()*hz*1.1,1.1+(r()<0.06?1:0),1.1);}
    const mns=opts.moons||0,mpx=W*0.15,mpy=bigMoon?H*0.16:H*0.10;
    for(let mn=0;mn<Math.min(mns,3);mn++){
      /* the wonder roll: ~6% of moonlit worlds hang a LOOMING primary */
      const mxx=mn===0?mpx:W*(0.30+mn*0.09),myy=mn===0?mpy:H*(0.07+mn*0.04),mr=mn===0?(bigMoon?30:13):6-mn;
      const mg3=g.createRadialGradient(mxx,myy,2,mxx,myy,mr*(mn===0?(bigMoon?5:11):6));
      mg3.addColorStop(0,'rgba(216,230,252,'+(mn===0?0.55:0.3)+')');
      mg3.addColorStop(0.3,'rgba(190,208,240,'+(mn===0?0.18:0.08)+')');
      mg3.addColorStop(1,'rgba(190,208,240,0)');
      g.fillStyle=mg3;g.beginPath();g.arc(mxx,myy,mr*(mn===0?(bigMoon?5:11):6),0,7);g.fill();
      g.fillStyle=mn===0?'#e9f0fa':'#c4d0e4';g.beginPath();g.arc(mxx,myy,mr,0,7);g.fill();
      g.fillStyle='rgba(150,168,196,0.55)';
      g.beginPath();g.arc(mxx-mr*0.3,myy-mr*0.2,mr*0.22,0,7);g.fill();
      g.beginPath();g.arc(mxx+mr*0.35,myy+mr*0.3,mr*0.16,0,7);g.fill();
    }
    if(wx==='rain'||wx==='snow'){ /* precipitation needs a cloud deck, even at night */
      g.fillStyle='rgba(10,14,24,0.55)';
      for(let nc=0;nc<7;nc++){g.beginPath();g.ellipse(r()*W,hz*(0.08+r()*0.5),90+r()*150,12+r()*16,0,0,7);g.fill();}
    }
  }
  if(dusk){ /* the first stars of the evening */
    for(let s6=0;s6<70;s6++){const syy=r()*hz*0.55;
      g.fillStyle='rgba(255,255,255,'+(0.08+r()*0.3*(1-syy/(hz*0.55))).toFixed(3)+')';
      g.fillRect(r()*W,syy,1,1);}
  }
  if(ringSky){
    /* the world's own rings arc across its sky — the card fact P.ring,
       finally visible from the ground (I3) */
    const ra2=(rL()-0.5)*0.5, rw2=H*(0.05+rL()*0.05), rcy=hz*(0.40+rL()*0.30);
    g.save();g.translate(W*0.5,rcy);g.rotate(ra2*0.5);
    const band=g.createLinearGradient(0,-rw2,0,rw2);
    const rA=opts.pal==='night'?0.20:(dusk?0.16:0.11);
    band.addColorStop(0,'rgba(220,228,244,0)');
    band.addColorStop(0.5,'rgba(220,228,244,'+rA+')');
    band.addColorStop(1,'rgba(220,228,244,0)');
    g.fillStyle=band;g.fillRect(-W*0.8,-rw2,W*1.6,rw2*2);
    g.strokeStyle='rgba(235,240,250,'+(rA*0.9).toFixed(3)+')';g.lineWidth=1.1;
    g.beginPath();g.moveTo(-W*0.8,-rw2*0.25);g.lineTo(W*0.8,-rw2*0.25);g.stroke();
    g.restore();
  }
  if(opts.aurora&&opts.pal==='night'){
    /* auroras crown magnetized worlds at night — hue pair now SEEDED per
       world (infinity L1): most wear the classic green/violet family,
       but teal, blue, rose and gold veils are out there */
    /* hues draw from real auroral families (greens/cyans/violets/roses) —
       an unconstrained roll lands on olive and reads as murk, not aurora */
    /* feature-local stream: the aurora's rolls never shift the herd or
       the flock when weather suppresses it (round-2 audit) */
    const rA=mulberry32((seed^0xA0A1)>>>0);
    const AURF=[132,158,185,205,275,295,318,345];
    const ah1=AURF[(rA()*AURF.length)|0]+(rA()-0.5)*14;
    const ah2=AURF[(rA()*AURF.length)|0]+(rA()-0.5)*14;
    g.save();g.globalCompositeOperation='lighter';
    try{ g.filter='blur(5px)'; }catch(_){ }   /* one veil, never columns */
    for(const[hue,off,amp,al] of [[ah1,H*0.06,30,0.15],[ah2,H*0.15,42,0.10]]){
      const ph1=rA()*TAU, ph2=rA()*TAU;
      for(let ax=-3;ax<=W;ax+=3){
        const base=off+Math.sin(ax*0.011+ph1)*amp*0.55+Math.sin(ax*0.0042+ph2)*amp*0.45
          +_hdFbm(ax*0.006,hue,seed+hue,3)*amp*0.5;
        const len=34+_hdFbm(ax*0.013,7,seed+hue*3,3)*90;
        const cg=g.createLinearGradient(0,base,0,base+len);
        cg.addColorStop(0,'hsla('+hue+',85%,66%,'+(al*0.75).toFixed(3)+')');
        cg.addColorStop(0.35,'hsla('+hue+',85%,60%,'+(al*0.5).toFixed(3)+')');
        cg.addColorStop(1,'hsla('+hue+',85%,55%,0)');
        g.fillStyle=cg;g.fillRect(ax,base,6,len);
      }
    }
    g.restore();
  }
  if(P.sun>0&&!nightize){
    const hRad=dusk?200:(sea?110:150);   /* the open-sea sky can't hide a heavy glare */
    const hK=(sea&&!dusk?0.62:1)*P.sun;
    const halo=g.createRadialGradient(sx,sy,4,sx,sy,hRad);
    /* clear-day sunlight carries the STAR's color (I2): a red dwarf's
       noon is amber-rose, an A-star's is white glare */
    const hc=dusk?'255,166,96':(desert?'236,200,150':sunHalo);
    const hc2b=dusk?'255,140,80':'255,236,190';
    halo.addColorStop(0,'rgba('+hc+','+(0.9*hK).toFixed(3)+')');halo.addColorStop(0.25,'rgba('+hc2b+','+(0.5*hK).toFixed(3)+')');halo.addColorStop(1,'rgba('+hc2b+',0)');
    g.fillStyle=halo;g.beginPath();g.arc(sx,sy,hRad,0,7);g.fill();
    g.globalAlpha=desert?0.7:(P.sun<0.4?0.4:1);
    g.fillStyle=dusk?'#ffce8e':(desert?'#f0dcb4':sunC);
    g.beginPath();g.arc(sx,sy,dusk?15:13,0,7);g.fill();g.globalAlpha=1;
  }
  if(opts.pal==='rain'){
    const bp=g.createRadialGradient(sx,sy+20,5,sx,sy+20,120);
    bp.addColorStop(0,'rgba(210,216,222,0.5)');bp.addColorStop(1,'rgba(210,216,222,0)');
    g.fillStyle=bp;g.fillRect(0,0,W,hz);
  }
  if(P.sun>0.6&&!desert&&!nightize&&opts.pal!=='grey'){
    /* clouds — never on an airless rock; at dusk they turn:
       dark bellies, sun-struck undersides */
    const cShad=dusk?'rgba(255,172,122,0.9)':'rgba(150,168,198,0.55)';
    const cBody=dusk?'rgba(52,36,72,0.9)':'rgba(255,252,244,0.95)';
    const puff=(cx,cy,s2,al)=>{g.globalAlpha=al;
      g.fillStyle=cShad;
      for(let j=0;j<6;j++){g.beginPath();g.ellipse(cx+(j-2.5)*s2*14,cy+3,s2*16,s2*7,0,0,7);g.fill();}
      g.fillStyle=cBody;
      for(let j2=0;j2<5;j2++){g.beginPath();g.ellipse(cx+(j2-2)*s2*13+s2*4,cy-4-((j2%2)*4)*s2,s2*13,s2*8,0,0,7);g.fill();}
      g.globalAlpha=1;};
    puff(W*0.16,H*0.14,1.2,0.8);puff(W*0.42,H*0.22,0.8,0.6);puff(W*0.88,H*0.24,0.9,0.55);
  }
  if(ember){ /* smoke rides an ember world's sky; the underlit banks glow */
    for(let sb=0;sb<6;sb++){const sy2=hz*(0.12+r()*0.55);
      g.fillStyle='rgba(16,8,8,'+(0.25+r()*0.25).toFixed(3)+')';
      g.beginPath();g.ellipse(r()*W,sy2,90+r()*160,10+r()*16,0,0,7);g.fill();
      g.fillStyle='rgba(255,90,40,'+(0.04+r()*0.05).toFixed(3)+')';
      g.beginPath();g.ellipse(r()*W,hz*(0.6+r()*0.35),80+r()*120,8+r()*10,0,0,7);g.fill();}
  }
  if(opts.pal==='rain'){g.fillStyle='rgba(70,80,90,0.5)';
    for(let rc=0;rc<8;rc++){g.globalAlpha=0.3+r()*0.3;
      g.beginPath();g.ellipse(r()*W,hz*(0.1+r()*0.5),70+r()*130,12+r()*14,0,0,7);g.fill();}g.globalAlpha=1;}
  const LAY=[
    {col:P.layers[0],base:hz-46,amp:desert?14:22,oct:3},
    {col:P.layers[1],base:hz-18,amp:desert?24:38,oct:desert?3:4},
    {col:P.layers[2],base:hz+14,amp:desert?34:56,oct:desert?3:5,plateau:true},
    {col:P.layers[3],base:hz+52,amp:desert?26:40,oct:desert?3:5}
  ];
  const zx0=W*0.34,zx1=W*0.70;let plat=0,ridge2=[];
  if(!sea)LAY.forEach(function(Ly,li){
    if(ember&&li===2)_hdVolcano(g,W,hz,seed,r,rX(W*(0.42+((seed>>>4)%100)/100*0.34)));
    const ys=[],platY=Ly.base-Ly.amp*0.55;
    for(let x=0;x<=W;x+=4){
      let y=Ly.base-_hdFbm(x*(desert?0.003:0.004)+li*13+seed%97,li*7,seed+li,Ly.oct)*Ly.amp*2+Ly.amp*0.6;
      if(Ly.plateau&&civ!=='none'){const t=_hdSm((x-zx0)/56)*_hdSm((zx1-x)/56);y=y+(platY-y)*t;}
      ys.push(y);
    }
    if(Ly.plateau){plat=platY;ridge2=ys;}
    g.fillStyle=Ly.col;g.beginPath();g.moveTo(0,H);
    ys.forEach(function(y,i2){g.lineTo(i2*4,y)});
    g.lineTo(W,H);g.closePath();g.fill();
    if((P.sun>0&&!nightize)||opts.pal==='night'){
      g.lineWidth=1.6;
      for(let i3=1;i3<ys.length;i3++){
        const xx=i3*4,alp=clamp(1-Math.abs(xx-(opts.pal==='night'?W*0.15:sx))/(W*0.75),0,1)*(opts.pal==='night'?0.22:0.5)*(1-li*0.16);
        if(alp<0.04)continue;
        g.strokeStyle='rgba('+P.crest+','+alp.toFixed(3)+')';
        g.beginPath();g.moveTo(xx-4,ys[i3-1]);g.lineTo(xx,ys[i3]);g.stroke();
      }
    }
    const hzA=desert?0.5:(opts.pal==='rain'?0.4:0.30);
    if(li<3){const fg=g.createLinearGradient(0,Ly.base-26,0,Ly.base+34);
      const hc2=desert?'236,196,140':(opts.pal==='night'?'40,56,88':'226,236,248');
      fg.addColorStop(0,'rgba('+hc2+',0)');fg.addColorStop(1,'rgba('+hc2+','+(hzA-li*0.08)+')');
      g.fillStyle=fg;g.fillRect(0,Ly.base-26,W,60);}
  });
  const ridgeY=x=>{const i2=clamp(Math.round(x/4),0,ridge2.length-1);return ridge2[i2]||plat};
  /* the world grows its OWN flora species (infinity L2): a leaf-hue
     family (chlorophyll common; golden 4.5% / copper 3.5% / violet 1.5%
     rare), seeded shape genes, and two species per world */
  const rP=mulberry32((seed^0xF10A)>>>0);
  let leafHue=98+rP()*44;
  const morph=rP();
  if(morph>0.985) leafHue=265+rP()*40;
  else if(morph>0.950) leafHue=8+rP()*22;
  else if(morph>0.905) leafHue=44+rP()*16;
  const mkSp=()=>({
    trunk:'hsl('+(((leafHue+140+rP()*60)%360)|0)+',20%,'+((10+rP()*8)|0)+'%)',
    leaf:'hsla('+((leafHue+(rP()-0.5)*18)|0)+','+((40+rP()*30)|0)+'%,'+((28+rP()*16)|0)+'%,0.9)',
    spread:0.8+rP()*0.7, depth:3+((rP()*2.4)|0), lean:0.1+rP()*0.5});
  /* v1.7 (Nick: "plants as well — consistent across the game"): when the world
     carries flora genes, the vista's plants ARE those species (hdFloraBare, the
     same growth-form resolver as their Compendium portrait) — a desert's cacti,
     a jungle's broadleaves — instead of a generic canopy. Flora-less worlds keep
     the tuned generic dressing (no regression). */
  const _fg=opts.floraGenes||[];
  const pcv =_fg[0]?hdFloraBare(_fg[0]):_hdPlantBare(seed+2, mkSp());
  const pcv2=_fg[1]?hdFloraBare(_fg[1]):(_fg[0]?hdFloraBare(_fg[0],seed+9):_hdPlantBare(seed+9, mkSp()));
  /* plant grading shared by every scene: winter frosts them, night turns
     them to silhouettes, dusk steeps them violet */
  const frost=opts.pal==='snow'?0.35:0;
  const pd=opts.pal==='night'?0.6:(dusk?0.42:0), pdc=dusk?'30,18,44':'8,12,20';
  if(!sea){
    /* a lifeless world's ground is soil and stone — meadow green would
       promise a biosphere the card denies (snow/ice/rock pals keep their
       own mineral grounds) */
    const barren=!flora&&!desert&&!ember&&opts.pal!=='ice'&&opts.pal!=='grey'&&opts.pal!=='haze'&&opts.pal!=='snow';
    const gnd=barren?[P.ground[0],'#473827','#241b0f']:P.ground;
    const gr=g.createLinearGradient(0,hz+40,0,H);
    gr.addColorStop(0,gnd[0]);gr.addColorStop(0.35,gnd[1]);gr.addColorStop(1,gnd[2]);
    g.fillStyle=gr;g.fillRect(0,hz+58,W,H);
    const fleck=desert?'#2c1c0c':(ember?'#2a0f08':(opts.pal==='snow'?'#8ea2b4':(barren?'#332818':'#08160c')));
    for(let t3=0;t3<(desert?200:380);t3++){const tx=r()*W,ty=hz+64+Math.pow(r(),1.5)*(H-hz-70),sc=(ty-hz)/(H-hz);
      g.globalAlpha=0.12;g.fillStyle=fleck;g.fillRect(tx,ty,2+sc*7,1+sc*2);}
    g.globalAlpha=1;
  }
  let _rivMouthX=null;   /* set when a river reaches the near field — the road keeps to the other bank */
  if(!desert&&!sea&&!ember&&opts.pal!=='ice'&&opts.pal!=='grey'&&opts.pal!=='haze'){
    /* the river no longer vanishes when a civilization stands here (V7) —
       the road keeps to the river's other bank now (art audit: "roads aren't
       intersecting with rivers" — the old fixed course crossed the widening
       near-field water with plain dirt, no ford, on many seeds). The course
       itself is seeded: mirrored and shifted per world (L1). */
    /* the source sits in the VALLEY between hill bands, not on the ridge
       face — the tail must never read as running into the mountain (Nick) */
    /* the COURSE is SEEDED now (Nick: "a lot of the rivers are the same" — the
       old control points were HARDCODED, so every world drew one S-curve, only
       mirrored/shifted). A feature-local stream re-shapes the spring point, the
       meander direction+depth, and the mouth per world: some run near-straight,
       some ox-bow hard, some enter left and exit right. */
    const rvQ=mulberry32((seed^0x81FE)>>>0);
    let rvTop=0.40+rvQ()*0.34;                   /* where it springs on the ridge */
    let rvMth=0.20+rvQ()*0.52;                   /* where it exits the near field */
    let rvBow=(rvQ()-0.5)*0.40;                  /* meander throw + direction */
    let rvBow2=(rvQ()-0.5)*0.24;                 /* second, gentler bend */
    /* SETTLED worlds (Nick's field report: "the rivers go right through the
       roads… and the farmlands"): when a road will draw (iron/town), the river
       keeps to its OWN BANK the whole way down — spring pulled to the mouth's
       side of the frame and the meanders damped so no bow can swing the course
       across the road or its field quads. Wild worlds keep the full meander. */
    if(civ==='iron'||civ==='town'){
      const rvSide=rvMth<0.5?-1:1;
      rvTop=0.5+rvSide*(0.10+Math.abs(rvTop-0.5)*0.55);
      rvMth=0.5+rvSide*(0.16+Math.abs(rvMth-0.5)*0.8);
      rvBow=rvSide*Math.abs(rvBow)*0.45;         /* bow OUTWARD only, gently */
      rvBow2=rvSide*Math.abs(rvBow2)*0.4;
    }
    const rp=[[rX(W*rvTop)+cmpShift,hz+40+rvQ()*14],
              [rX(W*(rvTop+rvBow))+cmpShift,hz+86+rvQ()*26],
              [rX(W*(rvMth+(rvTop-rvMth)*0.42+rvBow2))+cmpShift,H*(0.70+rvQ()*0.14)],
              [rX(W*rvMth)+cmpShift,H+20]];
    if(water!=='none') _rivMouthX=rp[3][0];   /* the road reads this to keep to the other bank (audit: they used to cross in the near field) */
    const riverAt=t=>{const a=rp[0],b=rp[1],c=rp[2],d=rp[3];
      return[(1-t)*(1-t)*(1-t)*a[0]+3*(1-t)*(1-t)*t*b[0]+3*(1-t)*t*t*c[0]+t*t*t*d[0],
             (1-t)*(1-t)*(1-t)*a[1]+3*(1-t)*(1-t)*t*b[1]+3*(1-t)*t*t*c[1]+t*t*t*d[1]]};
    if(water!=='none'){
      g.beginPath();
      for(let t4=0;t4<=1.001;t4+=0.03){const p2=riverAt(t4),w2=2+t4*t4*74;
        if(t4===0)g.moveTo(p2[0]-w2/2,p2[1]);else g.lineTo(p2[0]-w2/2,p2[1]);}
      for(let t5=1;t5>=-0.001;t5-=0.03){const p3=riverAt(t5),w3=2+t5*t5*74;g.lineTo(p3[0]+w3/2,p3[1]);}
      g.closePath();
      /* the river wears the sky — and the card's Water row: frozen worlds
         (and deep winter) carry an ice ribbon, not open water */
      const frozen=opts.pal==='snow'||water==='frozen';
      const RIV=frozen?['#dfe9f2','#b9cede','#8fa9c0']
        :({night:['#3a4a66','#22344c','#101d30'],twilight:['#e8a06a','#7a5674','#2a1c40']}
          [opts.pal]||['#b9d3e4','#7fa2c4','#37587c']);   /* day top de-glared — water, not a light smear (art review) */
      /* the far end DISSOLVES into the distance haze instead of springing
         from a hard point on the ridge (Nick's art pass — same seating
         law as the buildings): the top of the fill fades in from nothing */
      const _rvA=(hex,a)=>{const n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')';};
      const rg2=g.createLinearGradient(0,hz+46,0,H);
      rg2.addColorStop(0,_rvA(RIV[0],0));rg2.addColorStop(0.10,_rvA(RIV[0],0));
      rg2.addColorStop(0.32,_rvA(RIV[0],0.9));
      rg2.addColorStop(0.55,RIV[1]);rg2.addColorStop(1,RIV[2]);
      g.fillStyle=rg2;g.fill();
      /* birth-mist: a breath of valley haze pooled where the water first
         shows, so the tail is born from air, not cut into a hillside */
      {const p0=riverAt(0.16);
       const mist=g.createRadialGradient(p0[0],p0[1],0,p0[0],p0[1],46);
       mist.addColorStop(0,_rvA(RIV[0],0.16));mist.addColorStop(1,_rvA(RIV[0],0));
       g.fillStyle=mist;g.beginPath();g.ellipse(p0[0],p0[1],46,15,0,0,TAU);g.fill();}
      if(!frozen&&(P.sun>0||(opts.pal==='night'&&(opts.moons||0)>0))){g.globalCompositeOperation='lighter';
        /* night glints are MOONLIGHT — a moonless card gets a dark river */
        const gcv=opts.pal==='night'?'205,220,255':(dusk?'255,206,142':'255,244,210');
        const gka=opts.pal==='night'?0.4:1;
        for(let gl=0;gl<26;gl++){const t6=0.22+r()*0.58,p4=riverAt(t6);   /* no sparkle in the fade-in zone */
          /* sparkles stay INSIDE the water: offset and dash length are
             clamped to the river's true width at this bend (Nick's
             "reflections way off" report — they used to land on grass) */
          const rw6=2+t6*t6*74;
          g.fillStyle='rgba('+gcv+','+((0.25+r()*0.4)*gka).toFixed(3)+')';
          g.fillRect(p4[0]+(r()-0.5)*rw6*0.66, p4[1]+(r()-0.5)*4,
            Math.min(2+r()*7, rw6*0.4), 1.4);}
        g.globalCompositeOperation='source-over';}
      if(!frozen&&(opts.aqua||0)>0){
        /* the card's swimmers surface in the river too — own stream so
           the herd never reshuffles with the weather (round-2 audit) */
        const rQ2=mulberry32((seed^0x515E)>>>0);
        const t9=0.55+rQ2()*0.2, p9=riverAt(t9), rw9=(2+t9*t9*74)*0.5;
        const asz2=Math.min(rw9*0.5,7);
        g.fillStyle='rgba(10,16,26,0.8)';
        g.beginPath();g.moveTo(p9[0]-asz2,p9[1]);g.quadraticCurveTo(p9[0],p9[1]-asz2*0.8,p9[0]+asz2,p9[1]);g.closePath();g.fill();
        g.strokeStyle='rgba(230,240,250,0.22)';g.lineWidth=1;
        g.beginPath();g.ellipse(p9[0],p9[1]+1,asz2*1.8,1.8,0,0,7);g.stroke();
      }
      if(frozen){ /* pressure cracks in the ice ribbon */
        g.strokeStyle='rgba(116,146,170,0.5)';g.lineWidth=1;
        for(let fc=0;fc<5;fc++){const t7=0.2+r()*0.65,p7=riverAt(t7),w8=(2+t7*t7*74)*0.4;
          g.beginPath();g.moveTo(p7[0]-w8,p7[1]+(r()-0.5)*4);
          g.lineTo(p7[0]+(r()-0.5)*w8,p7[1]+(r()-0.5)*6);
          g.lineTo(p7[0]+w8,p7[1]+(r()-0.5)*4);g.stroke();}
      }
    }
    if(civ==='none'){
      const nightAmb=opts.pal==='night'?0.18:0;   /* moonlight knocks the near life back */
      const bs=cmpFlip?-1:1;                       /* herd side follows the course */
      if(opts.genes&&opts.genes.length){
        const bcv=_hdCamo(hdBeastBare(opts.genes[0],(seed^0x8EA)>>>0), P.ground[1], 0.06);
        const tB=0.62+rL()*0.14, pBank=riverAt(tB);
        _hdPlaceBeast(g,bcv,pBank[0]+66*bs,pBank[1]+8,(0.44+rL()*0.10)*_vistaSizeScale(opts.genes[0]),!cmpFlip,nightAmb,P.sun>0?0.10:0);
        const pFar=riverAt(0.24+rL()*0.10);
        _hdPlaceBeast(g,bcv,pFar[0]-64*bs,pFar[1]+10,0.17*_vistaSizeScale(opts.genes[0]),!cmpFlip,0.26,0.05);
        if(opts.genes[1]){
          const bcv2=_hdCamo(hdBeastBare(opts.genes[1],(seed^0x77F)>>>0), P.ground[1], 0.10);
          _hdPlaceBeast(g,bcv2,pFar[0]-110*bs,pFar[1]+4,0.14*_vistaSizeScale(opts.genes[1]),!cmpFlip,0.30,0.04);
        }
        /* teeming worlds show it (L1): extra herd silhouettes when the
           roster runs deep */
        if((opts.herd||0)>2){
          for(let hx=0;hx<Math.min((opts.herd||0)-2,2);hx++){
            const bcvH=_hdCamo(hdBeastBare(opts.genes[(hx+1)%opts.genes.length],(seed^(0x51+hx*7))>>>0), P.ground[1], 0.12);
            const pH=riverAt(0.16+_hdHash(hx,seed,21)*0.16);
            _hdPlaceBeast(g,bcvH,pH[0]+(50+hx*46)*bs*-1,pH[1]+6,0.11*_vistaSizeScale(opts.genes[(hx+1)%opts.genes.length]),!cmpFlip,0.32,0.03);
          }
        }
      }
      if(flora){
        for(let tp2=0;tp2<8;tp2++){
          const px5=(tp2+0.5)*(W/8)+(_hdHash(tp2,seed,3)-0.5)*40;
          _hdStampPlant(g,tp2%2?pcv2:pcv,px5,ridgeY(px5)+7,0.24+_hdHash(tp2,seed,5)*0.14,0.62+frost*0.3,pd,pdc);
        }
        _hdStampPlant(g,pcv,rX(W*0.085),H*0.90,0.95,frost,pd*0.9,pdc);
        _hdStampPlant(g,pcv2,rX(W*0.90),H*0.94,1.15,frost,pd*0.9,pdc);
      }
    }
  }
  if(desert&&flora){
    /* the card said "Sparse, hardy vegetation" — the dunes agree (V3):
       dry-country shrubs, olive-tan leaves, plus the world's own beasts */
    const dpv=_hdPlantBare(seed+5,{trunk:'#2a2014',leaf:'rgba(130,120,66,0.85)',spread:1.5,depth:3});
    for(let dp2=0;dp2<6;dp2++){
      const dx2=W*(0.06+dp2*0.16)+(_hdHash(dp2,seed,11)-0.5)*50;
      _hdStampPlant(g,dpv,dx2,ridgeY(dx2)+7,0.10+_hdHash(dp2,seed,13)*0.08,0.55,pd,pdc);
    }
    _hdStampPlant(g,dpv,W*0.12,H*0.90,0.5,0,pd*0.9,pdc);
    _hdStampPlant(g,dpv,W*0.83,H*0.94,0.62,0,pd*0.9,pdc);
    if(opts.genes&&opts.genes.length){
      const bcv=_hdCamo(hdBeastBare(opts.genes[0],(seed^0x8EA)>>>0), P.ground[1], 0.06);
      _hdPlaceBeast(g,bcv,W*0.55,H*0.86,0.42*_vistaSizeScale(opts.genes[0]),true,0,P.sun>0?0.12:0,'96,78,40');
      if(opts.genes[1]){
        const bcv2=_hdCamo(hdBeastBare(opts.genes[1],(seed^0x77F)>>>0), P.ground[1], 0.10);
        _hdPlaceBeast(g,bcv2,W*0.30,hz+96,0.14*_vistaSizeScale(opts.genes[1]),false,0.24,0.06,'96,78,40');
      }
    }
  }
  if(ember){
    /* the lava flow — the same course a river would cut, running molten.
       Bright at the far bend, white-gold where it pools near the viewer. */
    /* lava obeys the OPPOSITE law to water: it is born FROM the mountain —
       the source stays at the ridge, where the volcano stands */
    const rp=[[rX(W*0.60)+cmpShift,hz+30],[rX(W*0.52)+cmpShift,hz+90],[rX(W*0.62)+cmpShift,H*0.78],[rX(W*0.40)+cmpShift,H+20]];
    const lavaAt=t=>{const a=rp[0],b=rp[1],c=rp[2],d=rp[3];
      return[(1-t)*(1-t)*(1-t)*a[0]+3*(1-t)*(1-t)*t*b[0]+3*(1-t)*t*t*c[0]+t*t*t*d[0],
             (1-t)*(1-t)*(1-t)*a[1]+3*(1-t)*(1-t)*t*b[1]+3*(1-t)*t*t*c[1]+t*t*t*d[1]]};
    g.beginPath();
    for(let t4=0;t4<=1.001;t4+=0.03){const p2=lavaAt(t4),w2=2+t4*t4*74;
      if(t4===0)g.moveTo(p2[0]-w2/2,p2[1]);else g.lineTo(p2[0]-w2/2,p2[1]);}
    for(let t5=1;t5>=-0.001;t5-=0.03){const p3=lavaAt(t5),w3=2+t5*t5*74;g.lineTo(p3[0]+w3/2,p3[1]);}
    g.closePath();
    const lg=g.createLinearGradient(0,hz+30,0,H);
    lg.addColorStop(0,'#8a2410');lg.addColorStop(0.35,'#e2591c');lg.addColorStop(0.75,'#ffb03c');lg.addColorStop(1,'#ffdf7a');
    g.fillStyle=lg;g.fill();
    for(let cp=0;cp<40;cp++){const tc=0.15+r()*0.8,pc=lavaAt(tc),w6=2+tc*tc*70;
      g.fillStyle='rgba(30,10,6,'+(0.35+r()*0.35).toFixed(3)+')';    /* cooling crust plates */
      g.beginPath();g.ellipse(pc[0]+(r()-0.5)*w6*0.8,pc[1]+(r()-0.5)*6,2+r()*8*tc+1,1+r()*3,0,0,7);g.fill();}
    g.save();g.globalCompositeOperation='lighter';
    for(let gl2=0;gl2<22;gl2++){const tg2=0.06+r()*0.9,pg=lavaAt(tg2),w7=8+tg2*tg2*90;
      const gg2=g.createRadialGradient(pg[0],pg[1],1,pg[0],pg[1],w7);
      gg2.addColorStop(0,'rgba(255,120,40,'+(0.10+tg2*0.12).toFixed(3)+')');gg2.addColorStop(1,'rgba(255,120,40,0)');
      g.fillStyle=gg2;g.beginPath();g.arc(pg[0],pg[1],w7,0,7);g.fill();}
    /* emissive ground cracks vein the basalt */
    for(let ck=0;ck<8;ck++){
      let cx2=W*(0.04+r()*0.9), cy2=hz+80+r()*(H-hz-100);
      const segs=3+(r()*3|0), sc3=(cy2-hz)/(H-hz);
      if(Math.abs(cx2-W*0.45)<70)continue;
      g.strokeStyle='rgba(255,120,44,'+(0.5*sc3).toFixed(3)+')';g.lineWidth=1+sc3*1.6;
      g.beginPath();g.moveTo(cx2,cy2);
      for(let sg3=0;sg3<segs;sg3++){cx2+=(r()-0.3)*26*sc3;cy2+=(r()-0.5)*8*sc3;g.lineTo(cx2,cy2);}
      g.stroke();
      g.strokeStyle='rgba(255,90,30,'+(0.16*sc3).toFixed(3)+')';g.lineWidth=4*sc3+1;g.stroke();
    }
    g.restore();
    if(opts.genes&&opts.genes.length){ /* ember-lit fauna hold the basalt bank */
      const bcv=hdBeastBare(opts.genes[0],(seed^0x8EA)>>>0);
      const pB=lavaAt(0.66);
      _hdPlaceBeast(g,bcv,pB[0]+80,pB[1]+6,0.44*_vistaSizeScale(opts.genes[0]),true,0,0.22,'34,14,10');
      if(opts.genes[1]){
        const bcv2=hdBeastBare(opts.genes[1],(seed^0x77F)>>>0);
        const pF2=lavaAt(0.3);
        _hdPlaceBeast(g,bcv2,pF2[0]-84,pF2[1]+8,0.15*_vistaSizeScale(opts.genes[1]),true,0.26,0.12,'34,14,10','150,96,80');
      }
    }
  }
  if(sea){
    /* THE ISLAND SCENE — an ocean world's landing: open water to the
       horizon, a scatter of islands, and the beach under your boots.
       Everything keys off the pal (day/night/rain/twilight/snow). */
    const by=H*0.795;
    const SEA={day:['#c6dae2','#4e88a8','#1c4866'],night:['#111e33','#0a1526','#050b16'],
      rain:['#98a2a8','#4e5e68','#242f38'],twilight:['#e89a62','#6a3a58','#1c1130'],
      snow:['#b8c6d2','#5c7688','#2a4250']}[opts.pal]||['#c6dae2','#4e88a8','#1c4866'];
    const BCH={day:['#d8c49c','#a98e62'],night:['#1a2233','#0d1320'],rain:['#8e8878','#585444'],
      twilight:['#7c5040','#33203a'],snow:['#dce6ee','#9cb0c0']}[opts.pal]||['#d8c49c','#a98e62'];
    const isl=(ix,iw,ih,col)=>{
      g.fillStyle=col;g.beginPath();g.moveTo(ix-iw/2,hz+1);
      for(let x=0;x<=iw;x+=6){
        const t=x/iw, env2=Math.sin(t*3.1416);
        g.lineTo(ix-iw/2+x, hz+1-(_hdFbm(x*0.02+(ix|0),3,seed+(ix|0),3)*0.7+0.5)*ih*env2);
      }
      g.lineTo(ix+iw/2,hz+1);g.closePath();g.fill();
    };
    /* island layout: seeded per world (L1) AND per LANDING (wave-2 Gold pass —
       open-sea compositions were too similar; the salt re-deals island
       presence/count/placement and the swell every descent) */
    const rS=mulberry32((seed ^ 0x5EA1 ^ (((opts.salt|0)+1)*0x9E3779B1))>>>0);
    /* Gold R2 gate #5: EIGHT COMPOSITION ARCHETYPES — real different scenes,
       not one composition with parameter jitter. The salt picks the archetype,
       then varies freely within it. */
    const arch=(rS()*8)|0;
    let nIsl=0, bigScale=1, distArch=false, rocky=false, reef=false, storm=false, lowSun=false, lifeArch=false;
    if(arch===0){ nIsl=0; }                                       /* empty horizon */
    else if(arch===1){ nIsl=1; bigScale=1.7; }                    /* one NEAR island */
    else if(arch===2){ nIsl=3; distArch=true; }                   /* distant archipelago */
    else if(arch===3){ nIsl=1; rocky=true; bigScale=1.3; }        /* rocky coast */
    else if(arch===4){ nIsl=(rS()<0.5?1:0); reef=true; }          /* reef shelf */
    else if(arch===5){ nIsl=(rS()<0.4?1:0); storm=true; }         /* storm front */
    else if(arch===6){ nIsl=1+((rS()*2)|0); lowSun=true; }        /* low sun */
    else { nIsl=0; lifeArch=true; }                               /* distant life */
    if(distArch){ for(let ii=0;ii<3;ii++) isl(rX(W*(0.18+ii*0.28+rS()*0.10)),W*(0.045+rS()*0.035),4+rS()*4,P.layers[0]); }
    else{
      if(nIsl>1) isl(rX(W*(0.76+rS()*0.16)),W*(0.08+rS()*0.08),8+rS()*8,P.layers[0]);
      if(nIsl>2) isl(rX(W*(0.52+rS()*0.20)),W*(0.06+rS()*0.06),6+rS()*6,P.layers[0]);
    }
    const bigX=rX(W*(0.16+rL()*0.12)),bigW=W*(0.20+rL()*0.12)*bigScale;
    if(nIsl>0 && !distArch){
      if(rocky){ /* a dark cliff mass shouldering out of the water, spray at its feet */
        g.fillStyle='rgba(26,28,34,0.96)';
        g.beginPath();g.moveTo(bigX-bigW/2,hz+1);
        g.lineTo(bigX-bigW*0.34,hz-(30+rS()*18));g.lineTo(bigX-bigW*0.05,hz-(38+rS()*22));
        g.lineTo(bigX+bigW*0.22,hz-(20+rS()*14));g.lineTo(bigX+bigW/2,hz+1);g.closePath();g.fill();
        g.fillStyle='rgba(225,235,240,0.5)';
        for(let sp2=0;sp2<5;sp2++){ g.beginPath();g.ellipse(bigX-bigW*0.3+sp2*bigW*0.15,hz+2,7+rS()*7,2.2,0,0,7);g.fill(); }
      } else isl(bigX,bigW,(22+rS()*16)*bigScale,P.layers[1]);
    }
    const swell=storm?1.5+rS()*0.4:(arch===0||reef?0.5+rS()*0.4:0.6+rS()*1.1);
    if(civ!=='none' && nIsl>0){
      /* an inhabited archipelago shows its harbor from the water */
      const litUp=opts.pal==='night'||opts.pal==='twilight';
      if(civ==='space'){
        for(let tw9=0;tw9<6;tw9++){
          const txx=bigX-bigW*0.28+tw9*bigW*0.11+(r()-0.5)*8, th9=10+r()*22, tww=2.5+r()*3;
          g.fillStyle=litUp?'#0c1422':'#1a2636';
          g.fillRect(txx-tww/2,hz-6-th9,tww,th9+6);
          for(let wn2=0;wn2<Math.floor(th9/5);wn2++)
            if(r()<(litUp?0.9:0.6)){g.fillStyle=r()<0.5?'#8fd6ff':'#ffd98a';
              g.fillRect(txx-0.8,hz-9-wn2*5,1.4,1.6);}
        }
        g.fillStyle='#ff6a5a';g.fillRect(bigX-1,hz-40-r()*6,1.8,1.8);
      } else {
        g.fillStyle='#241c14';g.fillRect(bigX-7,hz-9,14,9);
        g.fillStyle='#312619';g.beginPath();g.moveTo(bigX-8,hz-9);g.lineTo(bigX,hz-15);g.lineTo(bigX+8,hz-9);g.closePath();g.fill();
        for(let hd2=0;hd2<4;hd2++){g.fillStyle='#ffc86a';
          g.fillRect(bigX-bigW*0.2+hd2*bigW*0.13,hz-3-r()*4,1.6,2);}
      }
    }
    const sg4=g.createLinearGradient(0,hz,0,by+14);
    sg4.addColorStop(0,SEA[0]);sg4.addColorStop(0.42,SEA[1]);sg4.addColorStop(1,SEA[2]);
    g.fillStyle=sg4;g.fillRect(0,hz,W,by-hz+14);
    /* the light lays a glitter road on the water — sun by day, moon by
       night — but ONLY if the card hung a moon in this sky */
    if(P.sun>0.05||(opts.pal==='night'&&(opts.moons||0)>0)){
      const gx3=opts.pal==='night'?W*0.15:sx;
      const gcol=opts.pal==='night'?'205,220,255':(dusk?'255,190,120':'255,242,200');
      const gk=opts.pal==='night'?0.7:(P.sun||0.5);
      g.save();g.globalCompositeOperation='lighter';
      /* a bright seam right at the waterline, then loose sparkle dashes in a
         widening envelope — no drawn shape, the density IS the road */
      const seam=g.createRadialGradient(gx3,hz+3,1,gx3,hz+3,60);
      seam.addColorStop(0,'rgba('+gcol+','+(0.35*gk).toFixed(3)+')');
      seam.addColorStop(1,'rgba('+gcol+',0)');
      g.fillStyle=seam;g.fillRect(gx3-60,hz,120,10);
      for(let gl3=0;gl3<150;gl3++){
        const tg3=r(), yy=hz+2+tg3*tg3*(by-hz-6);
        const hw=(8+tg3*150)*(0.5+r()*0.5);
        g.fillStyle='rgba('+gcol+','+((0.26-tg3*0.17)*gk*(0.3+r()*0.7)).toFixed(3)+')';
        g.fillRect(gx3+(r()-0.5)*hw, yy, 3+tg3*14*r(), 1+tg3*1.4);
      }
      g.restore();
    }
    g.strokeStyle='rgba('+P.crest+',0.5)';
    const nWv=Math.max(8,Math.round(16*swell));
    for(let wv=0;wv<nWv;wv++){ /* crests open up as they near the shore; density+weight ride the swell */
      const tw4=wv/nWv, yy=hz+4+tw4*tw4*(by-hz-2);
      g.globalAlpha=(0.05+tw4*0.13)*Math.min(1.25,swell);g.lineWidth=(0.8+tw4*1.4)*(0.7+swell*0.35);
      let x6=r()*40-30;
      while(x6<W){const len2=14+r()*40+tw4*50;
        g.beginPath();g.moveTo(x6,yy+(r()-0.5)*3);
        g.quadraticCurveTo(x6+len2/2,yy-1-tw4*2,x6+len2,yy+(r()-0.5)*3);g.stroke();
        x6+=len2+20+r()*90;}
    }
    g.globalAlpha=1;
    /* archetype dressing (Gold R2 gate #5) */
    if(storm){ /* a charcoal squall front swallowing the horizon, rain veils under it */
      for(let sc2=0;sc2<7;sc2++){ const scx=W*(sc2/6)+((rS()-0.5)*50), scy=hz-26-rS()*26, scw=80+rS()*90;
        const sg6=g.createRadialGradient(scx,scy,0,scx,scy,scw);
        sg6.addColorStop(0,'rgba(24,28,36,0.72)');sg6.addColorStop(0.6,'rgba(24,28,36,0.4)');sg6.addColorStop(1,'rgba(24,28,36,0)');
        g.save();g.translate(scx,scy);g.scale(1,(15+rS()*13)/scw);g.translate(-scx,-scy);
        g.fillStyle=sg6;g.beginPath();g.arc(scx,scy,scw,0,7);g.fill();g.restore(); }
      g.strokeStyle='rgba(150,165,185,0.22)';g.lineWidth=1.4;
      for(let rn2=0;rn2<14;rn2++){ const rx2=W*(0.1+rS()*0.8);
        g.beginPath();g.moveTo(rx2,hz-20-rS()*14);g.lineTo(rx2-7,hz+7);g.stroke(); }
      g.fillStyle='rgba(40,48,58,0.25)';g.fillRect(0,hz,W,by-hz+14);   /* the sea goes iron-grey */
    }
    if(reef){ /* a turquoise shallow shelf in the foreground, coral heads breaking it */
      const rg5=g.createLinearGradient(0,by-38,0,by+10);
      rg5.addColorStop(0,'rgba(70,200,190,0)');rg5.addColorStop(0.65,'rgba(80,215,200,0.30)');rg5.addColorStop(1,'rgba(96,225,208,0.42)');
      g.fillStyle=rg5;g.fillRect(0,by-38,W,50);
      g.fillStyle='rgba(150,110,96,0.55)';
      for(let cn2=0;cn2<7;cn2++){ g.beginPath();g.ellipse(W*(0.08+rS()*0.84),by-6-rS()*20,4+rS()*7,2.4+rS()*2.4,0,0,7);g.fill(); }
    }
    if(lowSun && opts.pal!=='night'){ /* the sun lies on the water — a warm horizon band */
      const lg5=g.createLinearGradient(0,hz-16,0,hz+34);
      lg5.addColorStop(0,'rgba(255,176,96,0.34)');lg5.addColorStop(0.5,'rgba(255,150,80,0.18)');lg5.addColorStop(1,'rgba(255,150,80,0)');
      g.fillStyle=lg5;g.fillRect(0,hz-16,W,50);
    }
    if(lifeArch){ /* something vast breaks the far water; seabirds ride over it */
      const lx2=W*(0.3+rS()*0.4);
      g.fillStyle='rgba(14,20,28,0.85)';
      g.beginPath();g.moveTo(lx2-34,hz+2);g.quadraticCurveTo(lx2,hz-11-rS()*7,lx2+34,hz+2);g.closePath();g.fill();
      g.beginPath();g.moveTo(lx2+42,hz+2);g.lineTo(lx2+50,hz-7-rS()*5);g.lineTo(lx2+56,hz+2);g.closePath();g.fill();
      g.strokeStyle='rgba(20,26,34,0.8)';g.lineWidth=1.4;g.lineCap='round';
      for(let bd2=0;bd2<3;bd2++){ const bx5=lx2-30+rS()*70, by5=hz-26-rS()*20;
        g.beginPath();g.moveTo(bx5-4,by5);g.quadraticCurveTo(bx5,by5-3,bx5+0.5,by5);g.moveTo(bx5+0.5,by5);g.quadraticCurveTo(bx5+1,by5-3,bx5+5,by5);g.stroke(); }
    }
    if((opts.aqua||0)>0){
      /* the card's swimmers break the surface: dorsal arcs, a tail fin,
         a ripple ring — the ocean's roster is finally IN the ocean */
      const rQ=mulberry32((seed^0x50A5^(((opts.salt|0)+1)*0x85EBCA6B))>>>0);   /* feature-local, per landing */
      const na=Math.min(2,opts.aqua);
      for(let ai2=0;ai2<na;ai2++){
        const axx=W*(0.22+rQ()*0.55), ayy=hz+(by-hz)*(0.35+rQ()*0.32);
        const asz=(5+rQ()*9)*(0.5+(ayy-hz)/(by-hz));
        g.fillStyle=opts.pal==='night'?'rgba(8,12,22,0.9)':'rgba(12,20,32,0.85)';
        g.beginPath();g.moveTo(axx-asz,ayy);g.quadraticCurveTo(axx,ayy-asz*0.9,axx+asz,ayy);g.closePath();g.fill();
        g.beginPath();g.moveTo(axx+asz*1.6,ayy);g.lineTo(axx+asz*2.1,ayy-asz*0.7);g.lineTo(axx+asz*2.4,ayy);g.closePath();g.fill();
        g.strokeStyle='rgba(230,240,250,0.25)';g.lineWidth=1;
        g.beginPath();g.ellipse(axx+asz*0.5,ayy+1.5,asz*2.1,2.2,0,0,7);g.stroke();
      }
    }
    /* the beach you stand on */
    const shoreY=x=>by+10-Math.sin(x/W*3.1416)*16-_hdFbm(x*0.01,9,seed+13,3)*8;
    const bg2=g.createLinearGradient(0,by-6,0,H);
    bg2.addColorStop(0,BCH[0]);bg2.addColorStop(1,BCH[1]);
    g.beginPath();g.moveTo(0,H);g.lineTo(0,shoreY(0));
    for(let x7=0;x7<=W;x7+=8)g.lineTo(x7,shoreY(x7));
    g.lineTo(W,H);g.closePath();g.fillStyle=bg2;g.fill();
    /* the wonder roll: bioluminescent shores — life-rich dark water
       glows where it breaks (the cards' glow-in-the-dark biology) */
    const foamC=bioLume?'96,255,224':'255,255,255';
    if(bioLume){
      g.save();g.globalCompositeOperation='lighter';
      g.strokeStyle='rgba(64,255,214,0.30)';g.lineWidth=6;
      g.beginPath();
      for(let xb=0;xb<=W;xb+=8){const yb2=shoreY(xb)-2;
        xb?g.lineTo(xb,yb2):g.moveTo(xb,yb2);}
      g.stroke();g.restore();
    }
    g.strokeStyle='rgba('+foamC+',0.45)';g.lineWidth=1.8;   /* foam lines */
    g.beginPath();
    for(let x8=0;x8<=W;x8+=8){const yB=shoreY(x8)-1.5+Math.sin(x8*0.09)*1.2;
      x8?g.lineTo(x8,yB):g.moveTo(x8,yB);}
    g.stroke();
    g.strokeStyle='rgba('+foamC+',0.2)';g.lineWidth=3.5;
    g.beginPath();
    for(let x9=0;x9<=W;x9+=8){const yB2=shoreY(x9)-5+Math.sin(x9*0.05+2)*1.6;
      x9?g.lineTo(x9,yB2):g.moveTo(x9,yB2);}
    g.stroke();
    for(let sp3=0;sp3<160;sp3++){const spy=by+8+Math.pow(r(),1.4)*(H-by-10);
      g.globalAlpha=0.10;g.fillStyle=opts.pal==='snow'?'#8ea2b4':'#5c4a30';
      g.fillRect(r()*W,spy,1.5+(spy-by)/(H-by)*3,1);}
    g.globalAlpha=1;
    if(opts.genes&&opts.genes.length){ /* life comes down to the water */
      const bcv=hdBeastBare(opts.genes[0],(seed^0x8EA)>>>0);
      _hdPlaceBeast(g,bcv,W*0.30,H*0.885,0.46*_vistaSizeScale(opts.genes[0]),true,opts.pal==='night'?0.18:0,P.sun>0?0.10:0,'86,72,44');
      if(opts.genes[1]){
        const bcv2=hdBeastBare(opts.genes[1],(seed^0x77F)>>>0);
        _hdPlaceBeast(g,bcv2,W*0.60,by+16,0.15*_vistaSizeScale(opts.genes[1]),false,0.24,0.05,'86,72,44');
      }
    }
    if(flora){
      _hdStampPlant(g,pcv,rX(W*0.07),H*0.93,1.0,frost,pd*0.9,pdc);
      _hdStampPlant(g,pcv2,rX(W*0.93),H*0.90,0.8,frost,pd*0.9,pdc);
      _hdStampPlant(g,pcv2,rX(W*0.55),by+9,0.18,0.45+frost*0.3,pd,pdc);
      _hdStampPlant(g,pcv,rX(W*0.72),by+13,0.22,0.4+frost*0.3,pd,pdc);
    }
  }
  /* v1.6 B15.5 (RC3 Gold blockers 2/3): ICE / GREY(rocky) / HAZE(venus) worlds were skipped by every
     placement block above (the land block excludes these pals), so cryogeyser/tundra/rocky/venus read
     identical across empty/Earth/procedural. Place the world's own anchor + secondary on the near ground. */
  if(!sea && (opts.pal==='ice'||opts.pal==='grey'||opts.pal==='haze') && opts.genes && opts.genes.length){
    const gY=H*0.90, tuftC=opts.pal==='ice'?'150,175,200':(opts.pal==='grey'?'96,96,108':'150,140,60');
    const bcvA=hdBeastBare(opts.genes[0],(seed^0x9CE)>>>0);
    _hdPlaceBeast(g,bcvA,rX(W*0.34),gY,0.44*_vistaSizeScale(opts.genes[0]),!cmpFlip,opts.pal==='haze'?0.18:0.12,0,tuftC);
    if(opts.genes[1]){ const bcvB=hdBeastBare(opts.genes[1],(seed^0x71D)>>>0);
      _hdPlaceBeast(g,bcvB,rX(W*0.64),hz+(H-hz)*0.42,0.15*_vistaSizeScale(opts.genes[1]),cmpFlip,0.30,0.04,tuftC); }
  }
  if((civ==='iron'||civ==='town')&&!sea){
    const kx=(zx0+zx1)/2+20,ky=plat+2;
    /* the road ENTERS from the bank the river is NOT on (art audit): the river
       mouth is seeded, so the entry side is chosen against it — near-field
       water and near-field road never share ground. The bends interpolate
       toward the settlement so either side flows the same S into the distance. */
    const _rdX=(_rivMouthX!=null && _rivMouthX<W*0.52)?W*0.68:W*0.30;
    const _rdBow=(_rdX<W*0.5?1:-1)*W*0.055;
    const road=[[_rdX,H+10],[_rdX+(kx-_rdX)*0.26+_rdBow,H*0.82],[_rdX+(kx-_rdX)*0.55-_rdBow*0.4,H*0.70],[kx-18,ky+8]];
    const roadAt=t=>{const a=road[0],b=road[1],c=road[2],d=road[3];
      return[(1-t)*(1-t)*(1-t)*a[0]+3*(1-t)*(1-t)*t*b[0]+3*(1-t)*t*t*c[0]+t*t*t*d[0],
             (1-t)*(1-t)*(1-t)*a[1]+3*(1-t)*(1-t)*t*b[1]+3*(1-t)*t*t*c[1]+t*t*t*d[1]]};
    g.beginPath();
    for(let t7=0;t7<=1.001;t7+=0.04){const p5=roadAt(t7),w4=3+(1-t7)*(1-t7)*40;
      if(t7===0)g.moveTo(p5[0]-w4/2,p5[1]);else g.lineTo(p5[0]-w4/2,p5[1]);}
    for(let t8=1;t8>=-0.001;t8-=0.04){const p6=roadAt(t8),w5=3+(1-t8)*(1-t8)*40;g.lineTo(p6[0]+w5/2,p6[1]);}
    g.closePath();g.fillStyle=opts.pal==='rain'?'#3e3830':'#5c5038';g.fill();
    g.strokeStyle='rgba(30,26,18,0.5)';g.lineWidth=1.5;g.stroke();
    if(opts.pal==='rain'){
      g.globalCompositeOperation='lighter';
      for(let pu=0;pu<8;pu++){const tp=0.08+r()*0.55,pp=roadAt(tp);
        const shw=(6+(1-tp)*26)*(0.7+r()*0.6);
        g.fillStyle='rgba(196,208,220,'+(0.10+r()*0.10)+')';
        g.fillRect(pp[0]-shw/2+(r()-0.5)*10,pp[1]+(r()-0.5)*5,shw,1.1+(1-tp)*0.8);}
      g.globalCompositeOperation='source-over';}
    const fieldQuad=(tNear,side,wN,wF,hue)=>{
      const pN=roadAt(tNear),pF=roadAt(tNear+0.16);
      const oN=side*(24+(1-tNear)*30),oF=side*(16+(1-tNear)*18);
      const q=[[pN[0]+oN,pN[1]],[pN[0]+oN+side*wN,pN[1]-4],[pF[0]+oF+side*wF,pF[1]-2],[pF[0]+oF,pF[1]]];
      g.fillStyle=hue;g.beginPath();g.moveTo(q[0][0],q[0][1]);
      g.lineTo(q[1][0],q[1][1]);g.lineTo(q[2][0],q[2][1]);g.lineTo(q[3][0],q[3][1]);g.closePath();g.fill();
      g.strokeStyle='rgba(30,36,22,0.45)';g.lineWidth=1.4;
      for(let fr2=1;fr2<5;fr2++){const q0=[q[0][0]+(q[1][0]-q[0][0])*fr2/5,q[0][1]+(q[1][1]-q[0][1])*fr2/5],
        q1=[q[3][0]+(q[2][0]-q[3][0])*fr2/5,q[3][1]+(q[2][1]-q[3][1])*fr2/5];
        g.beginPath();g.moveTo(q0[0],q0[1]);g.lineTo(q1[0],q1[1]);g.stroke();}
    };
    const dim=opts.pal==='rain'?0.22:0.35;
    fieldQuad(0.10,-1,150,80,'rgba(140,124,56,'+dim+')');
    fieldQuad(0.10, 1,150,80,'rgba(84,112,48,'+dim+')');
    fieldQuad(0.30,-1,110,58,'rgba(100,120,50,'+(dim-0.03)+')');
    fieldQuad(0.30, 1,110,58,'rgba(140,124,56,'+(dim-0.05)+')');
    for(let hh=0;hh<7;hh++){
      const thh=0.14+hh*0.06,sideH=hh%2?1:-1,pRd=roadAt(thh);
      const hx=pRd[0]+sideH*(30+(1-thh)*36),hy=pRd[1]+3,s4=0.55+(1-thh)*0.85;
      g.fillStyle='rgba(10,16,10,0.3)';g.beginPath();g.ellipse(hx-9*s4,hy+2,11*s4,3*s4,0,0,7);g.fill();
      g.fillStyle='#1c1712';g.fillRect(hx-8*s4,hy-9*s4,16*s4,9*s4);
      g.fillStyle='#2c241c';g.fillRect(hx,hy-9*s4,8*s4,9*s4);
      g.fillStyle='#3c2e20';g.beginPath();g.moveTo(hx-9*s4,hy-9*s4);g.lineTo(hx,hy-15*s4);g.lineTo(hx+9*s4,hy-9*s4);g.closePath();g.fill();
      g.fillStyle='#ffc86a';g.fillRect(hx+2*s4,hy-6*s4,2.6*s4,3*s4);
      if(hh%3===0){g.strokeStyle='rgba(190,196,206,0.28)';g.lineWidth=2;
        g.beginPath();g.moveTo(hx,hy-15*s4);
        g.quadraticCurveTo(hx+(opts.pal==='rain'?14:8),hy-15*s4-(opts.pal==='rain'?8:18),hx+(opts.pal==='rain'?26:4+r()*10),hy-15*s4-(opts.pal==='rain'?13:38));g.stroke();}
    }
    if(civ==='town'){
      /* Industrial/Modern era (V6): low flat-roofed blocks with lit
         windows and streetlamps down the road — no castle for a world
         whose card says railways and computers */
      const blockT=(x,y,w2,h2)=>{g.fillStyle='#1f2731';g.fillRect(x-w2/2,y-h2,w2,h2);
        g.fillStyle='#2b3542';g.fillRect(x,y-h2,w2/2,h2);
        for(let wr=0;wr<Math.floor(h2/7);wr++)for(let wc=0;wc<Math.floor(w2/9);wc++)
          if(_hdHash(wr,(wc+x)|0,3)<0.55){g.fillStyle=_hdHash(wr,(wc+x)|0,5)<0.5?'#ffd98a':'#c8dfff';
            g.fillRect(x-w2/2+3+wc*9,y-6-wr*7,2.2,3);}
      };
      g.fillStyle='rgba(10,16,10,0.35)';g.beginPath();g.ellipse(kx-20,ky+5,70,7,0,0,7);g.fill();
      blockT(kx-38,ky,34,26);blockT(kx+4,ky,44,38);blockT(kx+46,ky,28,20);
      blockT(kx-70,ky,20,14);blockT(kx+78,ky,22,16);
      g.save();g.globalCompositeOperation='lighter';
      for(let lp=0;lp<6;lp++){const tl=0.12+lp*0.13,pl2=roadAt(tl),lsc=(1-tl+0.4);
        const lx3=pl2[0]+(lp%2?14:-14)*lsc, ly3=pl2[1];
        g.strokeStyle='rgba(120,130,140,0.7)';g.lineWidth=1;
        g.beginPath();g.moveTo(lx3,ly3);g.lineTo(lx3,ly3-9*lsc);g.stroke();
        g.fillStyle='rgba(255,214,130,0.85)';g.beginPath();g.arc(lx3,ly3-9*lsc,1.4,0,7);g.fill();}
      g.restore();
    } else {
      const block=(x,y,w,h,dk,lt)=>{g.fillStyle=dk;g.fillRect(x-w/2,y-h,w,h);g.fillStyle=lt;g.fillRect(x,y-h,w/2,h);};
      g.fillStyle='rgba(10,16,10,0.35)';g.beginPath();g.ellipse(kx-30,ky+5,60,7,0,0,7);g.fill();
      block(kx,ky,86,34,'#232c38','#303c4a');
      for(let cn=0;cn<7;cn++)g.fillRect(kx-40+cn*12,ky-40,7,7);
      block(kx-52,ky,20,52,'#1e2732','#2b3644');
      block(kx+52,ky,20,52,'#1e2732','#2b3644');
      block(kx,ky-30,30,34,'#273241','#374556');
      g.fillStyle='#161d26';
      g.beginPath();g.moveTo(kx-62,ky-52);g.lineTo(kx-52,ky-68);g.lineTo(kx-42,ky-52);g.closePath();g.fill();
      g.beginPath();g.moveTo(kx+42,ky-52);g.lineTo(kx+52,ky-68);g.lineTo(kx+62,ky-52);g.closePath();g.fill();
      g.beginPath();g.moveTo(kx-17,ky-64);g.lineTo(kx,ky-80);g.lineTo(kx+17,ky-64);g.closePath();g.fill();
      g.fillStyle='#ffc86a';
      g.fillRect(kx-56,ky-34,3,4.5);g.fillRect(kx+50,ky-34,3,4.5);g.fillRect(kx-5,ky-48,4,6);g.fillRect(kx+10,ky-20,3,4.5);
    }
    for(let fp=0;fp<6;fp++){
      const fpx=(fp<3?fp*0.10+0.03:0.76+(fp-3)*0.085)*W;
      _hdStampPlant(g,pcv,fpx,ridgeY(fpx)+3,0.22+_hdHash(fp,seed,5)*0.12,0.42+frost*0.4,pd,pdc);
    }
    _hdStampPlant(g,pcv,W*0.06,H*0.92,0.85,frost,pd*0.9,pdc);
  }
  if(civ==='space'&&!sea){
    const night=opts.pal==='night';
    const towers=[],bay=(zx1-zx0-52)/6;
    for(let tw=0;tw<7;tw++)towers.push({x:zx0+26+tw*bay+(r()-0.5)*bay*0.22,h:44+r()*80,w:Math.min(12+r()*8,bay*0.62),row:0});
    for(let tw2=0;tw2<6;tw2++)towers.push({x:zx0+26+bay*0.5+tw2*bay+(r()-0.5)*bay*0.18,h:26+r()*40,w:Math.min(9+r()*7,bay*0.5),row:1});
    towers.sort((a,b)=>a.row-b.row).forEach(function(T){
      const base2=ridgeY(T.x)+(T.row?1:4);
      const dk=night?(T.row?'#101825':'#0b121e'):(T.row?'#1d2836':'#141d2a');
      const lt=night?(T.row?'#182334':'#121c2c'):(T.row?'#2c3c50':'#22324a');
      g.fillStyle=dk;g.beginPath();
      g.moveTo(T.x-T.w/2,base2);g.lineTo(T.x-T.w/2+1.5,base2-T.h);g.lineTo(T.x+T.w/2-1.5,base2-T.h);g.lineTo(T.x+T.w/2,base2);g.closePath();g.fill();
      g.fillStyle=lt;g.beginPath();
      g.moveTo(T.x,base2);g.lineTo(T.x,base2-T.h);g.lineTo(T.x+T.w/2-1.5,base2-T.h);g.lineTo(T.x+T.w/2,base2);g.closePath();g.fill();
      for(let wn=0;wn<Math.floor(T.h/8);wn++){
        const lit=night?0.92:0.7;
        if(r()<lit){g.fillStyle=r()<0.5?'#8fd6ff':'#ffd98a';g.fillRect(T.x-T.w/4,base2-8-wn*8,1.8,2.6);}
        if(r()<lit*0.8){g.fillStyle=r()<0.5?'#8fd6ff':'#ffd98a';g.fillRect(T.x+T.w/5,base2-8-wn*8,1.8,2.6);}
      }
      if(T.h>90){g.strokeStyle='#26364a';g.lineWidth=1.6;
        g.beginPath();g.moveTo(T.x,base2-T.h);g.lineTo(T.x,base2-T.h-14);g.stroke();
        g.fillStyle='#ff6a5a';g.beginPath();g.arc(T.x,base2-T.h-15,2.2,0,7);g.fill();}
      g.fillStyle='rgba(6,10,16,0.55)';g.fillRect(T.x-T.w/2,base2-1,T.w,2.4);
    });
    /* the city SITS IN its own air (art audit — "skyline flush with the
       mountains"): one low haze skirt across the block bases ties the whole
       cluster into the ridge, the same seating law as buildings and the
       river tail. Dusk breathes warm, day cool, night the glow of streets. */
    {const _skb=ridgeY((zx0+zx1)/2);
     const _skc=night?'96,124,164':(dusk?'214,168,118':'172,186,206');
     const skT=g.createLinearGradient(0,_skb-12,0,_skb+14);
     skT.addColorStop(0,'rgba('+_skc+',0)');skT.addColorStop(0.55,'rgba('+_skc+','+(night?0.13:0.17)+')');skT.addColorStop(1,'rgba('+_skc+',0)');
     g.fillStyle=skT;g.fillRect(zx0-18,_skb-12,(zx1-zx0)+36,26);}
    for(let sp2=0;sp2<5;sp2++){
      const spx=(sp2<3?sp2*0.09+0.04:0.78+(sp2-3)*0.09)*W;
      _hdStampPlant(g,pcv,spx,ridgeY(spx)+3,0.20+_hdHash(sp2,seed,9)*0.10,night?0.55:0.42+frost*0.4,pd,pdc);
    }
    _hdStampPlant(g,pcv,W*0.93,H*0.93,0.9,night?0.25:frost,pd*0.9,pdc);
  }
  if(wx==='rain'||opts.pal==='rain'){
    g.strokeStyle='rgba(200,212,224,0.14)';g.lineWidth=1;
    for(let rn=0;rn<170;rn++){const rx3=r()*W,ry3=r()*H,rl=9+r()*8;
      g.beginPath();g.moveTo(rx3,ry3);g.lineTo(rx3-rl*0.25,ry3+rl);g.stroke();}
    g.strokeStyle='rgba(214,224,234,0.22)';g.lineWidth=1.4;
    for(let rn2=0;rn2<70;rn2++){const rx4=r()*W,ry4=r()*H,rl2=15+r()*12;
      g.beginPath();g.moveTo(rx4,ry4);g.lineTo(rx4-rl2*0.28,ry4+rl2);g.stroke();}
    const mist=g.createLinearGradient(0,hz-10,0,hz+70);
    mist.addColorStop(0,'rgba(150,160,168,0)');mist.addColorStop(0.5,'rgba(150,160,168,0.22)');mist.addColorStop(1,'rgba(150,160,168,0)');
    g.fillStyle=mist;g.fillRect(0,hz-10,W,90);
  }
  if(opts.pal==='dust'){
    for(let db=0;db<4;db++){
      const dy2=hz-30+db*60;
      const bank=g.createLinearGradient(0,dy2-24,0,dy2+30);
      bank.addColorStop(0,'rgba(216,168,104,0)');bank.addColorStop(0.5,'rgba(216,168,104,'+(0.16+db*0.05)+')');bank.addColorStop(1,'rgba(216,168,104,0)');
      g.fillStyle=bank;g.fillRect(0,dy2-24,W,60);
    }
    g.strokeStyle='rgba(240,204,140,0.18)';g.lineWidth=1.2;
    for(let wnd=0;wnd<60;wnd++){const wx2=r()*W,wy2=r()*H,wl=26+r()*70;
      g.beginPath();g.moveTo(wx2,wy2);
      g.quadraticCurveTo(wx2+wl*0.5,wy2-2+r()*4,wx2+wl,wy2+(r()-0.5)*5);g.stroke();}
  }
  if(opts.pal==='ice'){
    for(let cz=0;cz<9;cz++){const ix2=r()*W,iy2=hz+70+r()*(H-hz-90),is2=(iy2-hz)/(H-hz)*22+6;
      g.fillStyle='rgba(190,225,248,0.85)';
      g.beginPath();g.moveTo(ix2,iy2);g.lineTo(ix2+is2*0.28,iy2-is2);g.lineTo(ix2+is2*0.5,iy2);g.closePath();g.fill();
      g.fillStyle='rgba(255,255,255,0.9)';
      g.beginPath();g.moveTo(ix2+is2*0.28,iy2-is2);g.lineTo(ix2+is2*0.38,iy2);g.lineTo(ix2+is2*0.5,iy2);g.closePath();g.fill();}
  }
  if(wx==='snow'){ /* round flakes at two depths — rain streaks, snow drifts */
    for(let sf=0;sf<240;sf++){
      g.fillStyle='rgba(255,255,255,'+(0.25+r()*0.35).toFixed(3)+')';
      g.beginPath();g.arc(r()*W,r()*H,0.8+r()*1.2,0,7);g.fill();}
    for(let sf2=0;sf2<60;sf2++){
      g.fillStyle='rgba(255,255,255,'+(0.5+r()*0.4).toFixed(3)+')';
      g.beginPath();g.arc(r()*W,r()*H,1.6+r()*1.5,0,7);g.fill();}
    const chill=g.createLinearGradient(0,hz-16,0,hz+64);
    chill.addColorStop(0,'rgba(210,224,238,0)');chill.addColorStop(0.5,'rgba(210,224,238,0.18)');chill.addColorStop(1,'rgba(210,224,238,0)');
    g.fillStyle=chill;g.fillRect(0,hz-16,W,80);
  }
  if(wx==='ash'){ /* ash drifts down; embers climb from the glowing ground */
    for(let af=0;af<150;af++){
      g.fillStyle='rgba(170,160,158,'+(0.14+r()*0.22).toFixed(3)+')';
      g.beginPath();g.arc(r()*W,r()*H,0.7+r()*1.3,0,7);g.fill();}
    g.save();g.globalCompositeOperation='lighter';
    for(let ef=0;ef<50;ef++){const ex2=r()*W,ey2=hz+r()*(H-hz),el2=3+r()*7;
      g.strokeStyle='rgba(255,150,60,'+(0.25+r()*0.45).toFixed(3)+')';g.lineWidth=1;
      g.beginPath();g.moveTo(ex2,ey2);g.lineTo(ex2+(r()-0.5)*3,ey2-el2);g.stroke();}
    g.restore();
  }
  if(wx==='haze'&&opts.pal!=='haze'){ /* heat shimmer bands over a hot horizon */
    for(let hb=0;hb<3;hb++){const hy3=hz-8+hb*26;
      const hg3=g.createLinearGradient(0,hy3-10,0,hy3+14);
      hg3.addColorStop(0,'rgba(255,236,190,0)');hg3.addColorStop(0.5,'rgba(255,236,190,0.10)');hg3.addColorStop(1,'rgba(255,236,190,0)');
      g.fillStyle=hg3;g.fillRect(0,hy3-10,W,24);}
  }
  if((opts.air||0)>0 && !nightize){
    /* the card's fliers ride this sky — gliders, floaters, cloud-deck
       drifters, drawn as a distant flock (scene-appropriate placement) */
    const rF=mulberry32((seed^0xF11E)>>>0);   /* feature-local stream */
    const fl=Math.min(3,opts.air)+((rF()*2)|0);
    const fc2=opts.pal==='night'?'rgba(205,218,242,0.38)':(dusk?'rgba(30,20,36,0.8)':'rgba(22,28,40,0.75)');
    g.strokeStyle=fc2;g.lineWidth=1.7;g.lineCap='round';
    for(let fi=0;fi<fl;fi++){
      const fxx=W*(0.10+rF()*0.80), fyy=hz*(0.16+rF()*0.50), fs2=2.5+rF()*4;
      g.beginPath();g.moveTo(fxx-fs2*2,fyy);g.quadraticCurveTo(fxx-fs2,fyy-fs2,fxx,fyy);
      g.quadraticCurveTo(fxx+fs2,fyy-fs2,fxx+fs2*2,fyy);g.stroke();
    }
  }
  if(dusk){ /* the dusk grade: violet above, a warm band at the sun, night rising */
    const tw3=g.createLinearGradient(0,0,0,H);
    tw3.addColorStop(0,'rgba(30,20,70,0.28)');tw3.addColorStop(0.45,'rgba(215,110,50,0.10)');
    tw3.addColorStop(0.62,'rgba(120,60,90,0.10)');tw3.addColorStop(1,'rgba(14,10,34,0.30)');
    g.fillStyle=tw3;g.fillRect(0,0,W,H);
  }
  if(nightize){ /* the card said night: the type's own scene, by starlight */
    const ng=g.createLinearGradient(0,0,0,H);
    ng.addColorStop(0,'rgba(5,8,22,0.72)');ng.addColorStop(0.5,'rgba(6,10,26,0.58)');ng.addColorStop(1,'rgba(4,6,18,0.64)');
    g.fillStyle=ng;g.fillRect(0,0,W,H);
    for(let s7=0;s7<170;s7++){
      g.fillStyle='rgba(255,255,255,'+(0.12+r()*0.5).toFixed(3)+')';
      g.fillRect(r()*W,r()*hz*0.5,1.1,1.1);}
    const mns2=Math.min(opts.moons||0,3);   /* the card's moons, small and high */
    for(let mn2=0;mn2<mns2;mn2++){
      const mxx2=W*(0.14+mn2*0.13),myy2=H*(0.09+mn2*0.03),mr2=mn2===0?9:5-mn2;
      g.fillStyle=mn2===0?'#dfe8f6':'#b8c4da';g.beginPath();g.arc(mxx2,myy2,mr2,0,7);g.fill();
      g.fillStyle='rgba(140,158,186,0.5)';g.beginPath();g.arc(mxx2-mr2*0.3,myy2-mr2*0.2,mr2*0.22,0,7);g.fill();
    }
  } else if(duskize){ /* the card said twilight: the dusk grade over the type's scene */
    const dg2=g.createLinearGradient(0,0,0,H);
    dg2.addColorStop(0,'rgba(40,30,70,0.30)');dg2.addColorStop(0.5,'rgba(180,90,50,0.14)');dg2.addColorStop(1,'rgba(20,16,40,0.28)');
    g.fillStyle=dg2;g.fillRect(0,0,W,H);
  }
  if(opts.wb) _hdBiomeDress(g, opts, seed, hz, W, H, BIOME_PROFILES);
  if(opts.evt) _hdWxEvent(g, opts.evt, seed, hz, W, H, opts.pal==='night'||opts.nightize);
  if(opts.titan) _hdTitan(g, sea?'sea':'land', seed, hz, W, H, opts.pal==='night'||opts.nightize);
  g.fillStyle=desert?'#1c1006':(ember?'#120605':(sea?'#140f08':(opts.pal==='snow'?'#0e141c':'#071108')));
  g.beginPath();g.moveTo(0,H);
  for(let x2=0;x2<=W;x2+=6)g.lineTo(x2,H-8-_hdFbm(x2*0.02,3,seed+41,3)*16);
  g.lineTo(W,H);g.closePath();g.fill();
  if(!desert&&!ember&&flora){
    g.strokeStyle='rgba('+(opts.pal==='snow'?'14,20,30':(sea?'22,18,10':'10,22,12'))+',0.95)';g.lineWidth=1.6;
    for(let gb=0;gb<70;gb++){const gx2=r()*W,gy2=H-4-r()*10,gh2=8+r()*16;
      g.beginPath();g.moveTo(gx2,gy2);g.quadraticCurveTo(gx2+(r()-0.5)*8,gy2-gh2*0.6,gx2+(r()-0.5)*14,gy2-gh2);g.stroke();}}
  _hdVistaEco(g, W, H, hz, opts, seed, BIOME_PROFILES);   /* v1.6: biome life (rig silhouettes) + atmosphere fx */
  const vg=g.createRadialGradient(W/2,H*0.45,H*0.3,W/2,H*0.5,W*0.62);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(2,3,8,'+(opts.pal==='night'?0.3:(ember?0.38:0.45))+')');
  g.fillStyle=vg;g.fillRect(0,0,W,H);
  return cv;
}
function renderPreservedGasDeckVistaV1(o){
  const W=960,H=430,cv=createSpeciesCanvas(1, 1);cv.width=W;cv.height=H;
  const g=cv.getContext('2d'), r=mulberry32((o.seed^0xDEC)>>>0);
  const night=o.tod==='night', dusk=o.tod==='twilight';
  /* the giant's biome tunes the deck: an Ember giant glows its own sullen
     red; Pastel-Ammonia decks lift pale; a Storm-Eye giant is dominated
     by the one great storm */
  const hue=o.wb==='hotglow' ? 8 : (o.hue==null?30:o.hue);
  const hsl=(h,s,l,a)=>'hsla('+(((h%360)+360)%360)+','+s+'%,'+l+'%,'+(a==null?1:a)+')';
  const hz=H*(0.56+r()*0.08);
  /* upper haze — the same band family, thinned by altitude */
  const sky=g.createLinearGradient(0,0,0,hz);
  sky.addColorStop(0, hsl(hue, 38, night?6:(dusk?16:34)));
  sky.addColorStop(0.7, hsl(hue+10, 44, night?10:(dusk?26:52)));
  sky.addColorStop(1, hsl(hue+16, 50, night?14:(dusk?38:66)));
  g.fillStyle=sky; g.fillRect(0,0,W,hz+2);
  /* high shelf-bands riding the jet streams — blurred into the air, an
     atmosphere is weather, not linework (Nick's coherence call) */
  try{ g.filter='blur(5px)'; }catch(_){ }
  for(let i=0;i<5;i++){
    const y=hz*(0.12+i*0.17)+(r()-0.5)*10, th=6+r()*14, ph=r()*TAU;
    g.fillStyle=hsl(hue+(r()-0.5)*24, 40, (night?12:(dusk?30:58))+(r()-0.5)*8, 0.20+r()*0.15);
    g.beginPath(); g.moveTo(0,y);
    for(let x2=0;x2<=W;x2+=60) g.lineTo(x2, y+Math.sin(x2*0.004+ph)*8);
    g.lineTo(W,y+th);
    for(let x3=W;x3>=0;x3-=60) g.lineTo(x3, y+th+Math.sin(x3*0.004+ph)*8);
    g.closePath(); g.fill();
  }
  try{ g.filter='none'; }catch(_){ }
  if(night){
    for(let i=0;i<90;i++){
      g.fillStyle='rgba(255,255,255,'+(0.22+r()*0.5).toFixed(2)+')';
      g.fillRect(r()*W, r()*hz*0.85, 1.3, 1.3);
    }
  } else {
    const sx2=W*(0.2+r()*0.6), sy2=hz*(dusk?0.62:0.3);
    const sg=g.createRadialGradient(sx2,sy2,0,sx2,sy2,60);
    sg.addColorStop(0,'rgba(255,246,225,'+(dusk?0.5:0.75)+')'); sg.addColorStop(1,'rgba(255,246,225,0)');
    g.fillStyle=sg; g.beginPath(); g.arc(sx2,sy2,60,0,TAU); g.fill();
  }
  /* the card's ring, seen edge-on from inside — a lit band + its shadow line */
  if(o.ring){
    g.save(); g.translate(W*0.5, hz*0.55); g.rotate(-0.18);
    try{ g.filter='blur(1.5px)'; }catch(_){ }
    const rg2=g.createLinearGradient(-W*0.6,0,W*0.6,0);
    rg2.addColorStop(0,'rgba(230,225,210,0)');
    rg2.addColorStop(0.5,'rgba(230,225,210,'+(night?0.30:0.38)+')');
    rg2.addColorStop(1,'rgba(230,225,210,0)');
    g.fillStyle=rg2; g.fillRect(-W*0.6,-2.2,W*1.2,4.4);
    g.fillStyle='rgba(20,16,28,'+(night?0.35:0.20)+')'; g.fillRect(-W*0.6,2.2,W*1.2,1.4);
    g.restore();
  }
  /* moons from the card, small and high (max 3 drawn) */
  for(let i=0;i<Math.min(3,o.moons|0);i++){
    const mx=W*(0.12+r()*0.76), my2=hz*(0.10+r()*0.38), mr=3.5+r()*6;
    g.fillStyle='rgba(228,232,240,'+(night?0.85:0.5)+')';
    g.beginPath(); g.arc(mx,my2,mr,0,TAU); g.fill();
  }
  /* polar auroras — the immense field's crown, faint curtains at the rims */
  if(o.aurora){
    try{ g.filter='blur(8px)'; }catch(_){ }
    for(const side of [0.10,0.90]){
      for(let i=0;i<3;i++){
        const ax=W*side+(r()-0.5)*90, aw=30+r()*50;
        const ag=g.createLinearGradient(ax,0,ax,hz*0.5);
        ag.addColorStop(0,hsl(140,80,60,0));
        ag.addColorStop(0.35,hsl(i%2?280:140,80,62,night?0.20:0.10));
        ag.addColorStop(1,hsl(280,80,60,0));
        g.fillStyle=ag; g.fillRect(ax-aw/2,0,aw,hz*0.5);
      }
    }
    try{ g.filter='none'; }catch(_){ }
  }
  /* THE DECK — cloud-top floor rolling away to the horizon */
  const deck=g.createLinearGradient(0,hz,0,H);
  deck.addColorStop(0, hsl(hue+8, 46, night?16:(dusk?34:62)));
  deck.addColorStop(0.5, hsl(hue-6, 42, night?10:(dusk?24:46)));
  deck.addColorStop(1, hsl(hue-14, 38, night?6:(dusk?14:30)));
  g.fillStyle=deck; g.fillRect(0,hz,W,H-hz);
  /* broad rolling swells first — the deck is weather, not dots */
  try{ g.filter='blur(7px)'; }catch(_){ }
  for(let sw=0;sw<3;sw++){
    const y=hz+(H-hz)*(0.22+sw*0.28), ph=r()*TAU, amp=8+sw*10;
    g.fillStyle=hsl(hue+(r()-0.5)*14, 44, (night?15:(dusk?32:60))+sw*3, 0.28);
    g.beginPath(); g.moveTo(0,y);
    for(let x4=0;x4<=W;x4+=48) g.lineTo(x4, y+Math.sin(x4*0.006+ph)*amp);
    g.lineTo(W,H); g.lineTo(0,H); g.closePath(); g.fill();
  }
  try{ g.filter='none'; }catch(_){ }
  for(let row=0;row<4;row++){
    const y=hz+(H-hz)*(0.16+row*0.24), sc=0.5+row*0.45;
    for(let i=0;i<10;i++){
      const x2=((i+(row%2?0.5:0))/10)*W+(r()-0.5)*40, br=(16+r()*26)*sc;
      const pg=g.createRadialGradient(x2,y,0,x2,y,br);
      pg.addColorStop(0, hsl(hue+(r()-0.5)*18, 44, (night?18:(dusk?38:68))+r()*8, 0.3));
      pg.addColorStop(1, hsl(hue, 44, night?12:40, 0));
      g.fillStyle=pg; g.beginPath(); g.arc(x2,y,br,0,TAU); g.fill();
    }
  }
  /* the great storm, if the card carries one — a vast oval on the horizon
     (on a Storm-Eye giant it IS the horizon) */
  if(o.spot || o.wb==='stormeye'){
    const eye=o.wb==='stormeye';
    const sx3=W*(0.25+r()*0.5), sy3=hz+(H-hz)*0.18, rw=(90+r()*70)*(eye?2.2:1);
    g.save(); g.translate(sx3,sy3); g.scale(1,0.36);
    const eyeBoost=o.wb==='stormeye'?1.5:1;
    const spg=g.createRadialGradient(0,0,0,0,0,rw);
    spg.addColorStop(0,hsl(o.spotHue||hue,60,night?22:48,0.55*eyeBoost));
    spg.addColorStop(0.55,hsl((o.spotHue||hue)+14,55,night?15:38,0.32*eyeBoost));
    spg.addColorStop(1,hsl(o.spotHue||hue,50,40,0));
    g.fillStyle=spg; g.beginPath(); g.arc(0,0,rw,0,TAU); g.fill(); g.restore();
  }
  /* ammonia lightning lighting the deeps from below */
  const nl=(night?4:2)+((r()<0.5)?1:0);
  for(let i=0;i<nl;i++){
    const lx=r()*W, ly=hz+(H-hz)*(0.3+r()*0.6), lr=20+r()*36;
    const lg2=g.createRadialGradient(lx,ly,0,lx,ly,lr);
    lg2.addColorStop(0,'rgba(200,220,255,'+(night?0.5:0.28)+')');
    lg2.addColorStop(1,'rgba(200,220,255,0)');
    g.fillStyle=lg2; g.beginPath(); g.arc(lx,ly,lr,0,TAU); g.fill();
  }
  /* AERIAL LIFE (Nick: "creatures should show up in the biomes — I don't see any
     in the gas ones"). A gas giant's biosphere is microbial + aerial flora + rare
     air fauna, so the deck now paints the world's ACTUAL life: floating cloud-
     gardens (its af flora), gas-bladder colonies + an aeroplankton swarm (the
     microbial haze), and — when the world carries them — its real air CREATURES as
     flying silhouettes, drawn from the same genome as their Compendium portrait. */
  const _hasAir=(o.air>0)||(o.airGenes&&o.airGenes.length)||(o.aerFlora&&o.aerFlora.length);
  if(_hasAir){
    /* the floating cloud-garden — the world's aerial flora, hung in the deck */
    if(o.aerFlora&&o.aerFlora.length){
      const gr=mulberry32((o.seed^0xAF10A)>>>0);
      const gsp=()=>({trunk:'hsla(150,16%,24%,0.8)', leaf:'hsla('+((140+gr()*90)|0)+',44%,'+(night?34:46)+'%,0.82)', spread:1.1+gr()*0.6, depth:3, lean:0.2});
      const gcv=_hdPlantBare((o.seed^0xAF10)>>>0, gsp());
      for(let gi=0;gi<3;gi++){ const gx=W*(0.16+gr()*0.68), gy=hz*(0.30+gr()*0.5), gs=0.20+gr()*0.13;
        _hdStampPlant(g, gcv, gx, gy, gs, night?0.52:0.36, night?0.42:0.14); }
    }
    for(let i=0;i<Math.min(5,(o.air||1)+2);i++){
      const anchor=(i===0), fx=W*(0.15+r()*0.7), fy=hz*(0.42+r()*0.42), fs=(anchor?18:6)+r()*(anchor?10:8);
      const bg3=g.createRadialGradient(fx,fy-fs*0.2,1,fx,fy,fs);   // a lit gas-bladder body
      bg3.addColorStop(0,'rgba('+(night?'60,70,100':'120,110,140')+',0.55)');
      bg3.addColorStop(1,'rgba('+(night?'12,16,26':'30,26,40')+',0.5)');
      g.fillStyle=bg3; g.beginPath(); g.ellipse(fx,fy,fs,fs*0.66,0,0,TAU); g.fill();
      g.lineWidth=anchor?1.4:1.0; g.strokeStyle='rgba('+(night?'120,140,190':'40,36,54')+',0.4)';
      for(let t2=0;t2<(anchor?5:3);t2++){ const tx=fx-fs*0.5+t2*fs*(anchor?0.24:0.4);
        g.beginPath(); g.moveTo(tx,fy+fs*0.5);
        g.quadraticCurveTo(tx+(r()-0.5)*6, fy+fs*1.6, tx+(r()-0.5)*10, fy+fs*(2.2+r())); g.stroke(); }
    }
    /* the world's real AIR CREATURES — flying, from their own genome (no ground
       shadow: they're aloft). Distance-hazed into the deck like every other body. */
    if(o.airGenes&&o.airGenes.length){
      const cr=mulberry32((o.seed^0xA1F1A)>>>0);
      o.airGenes.forEach((ag,ai)=>{
        try{
          const bcv=hdBeastBare(ag,(o.seed^(0xB13+ai*97))>>>0);
          const S=bcv.width, sc=0.15+cr()*0.09, w=S*sc, h=S*sc;
          const cx=W*(0.2+cr()*0.6), cy=hz*(0.26+cr()*0.44);
          const work=createSpeciesCanvas(1, 1); work.width=work.height=S;
          const wg=work.getContext('2d'); wg.drawImage(bcv,0,0);
          wg.globalCompositeOperation='source-atop';
          wg.fillStyle='rgba('+(night?'74,90,124':'150,168,205')+','+(night?0.44:0.30)+')'; wg.fillRect(0,0,S,S);
          g.save(); g.translate(cx,cy); if(cr()<0.5) g.scale(-1,1);
          g.drawImage(work,-w/2,-h/2,w,h); g.restore();
        }catch(_){ }
      });
    }
    g.fillStyle='rgba('+(night?'150,180,230':'200,190,220')+',0.4)';   // aeroplankton swarm — ambient biology
    for(let i=0;i<26;i++){ g.beginPath();g.arc(W*(0.1+r()*0.8), hz*(0.4+r()*0.5), 1+r()*1.6, 0,TAU);g.fill(); }
  }
  /* the breath of haze where deck meets sky */
  const hzg=g.createLinearGradient(0,hz-30,0,hz+50);
  hzg.addColorStop(0,'rgba(255,255,255,0)');
  hzg.addColorStop(0.5,hsl(hue+16,50,night?18:70,0.16));
  hzg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=hzg; g.fillRect(0,hz-30,W,80);
  if(o.wb==='hotglow'){
    /* the night side is a furnace — the deck lights itself from below */
    const fg=g.createLinearGradient(0,H,0,hz);
    fg.addColorStop(0,'rgba(255,90,30,0.30)'); fg.addColorStop(1,'rgba(255,90,30,0)');
    g.fillStyle=fg; g.fillRect(0,hz,W,H-hz);
  } else if(o.wb==='ammonia'){
    g.fillStyle='rgba(240,238,246,0.10)'; g.fillRect(0,0,W,H);   /* the pastel lift */
  }
  if(o.evt) _hdWxEvent(g, o.evt, o.seed, hz, W, H, night);
  if(o.titan) _hdTitan(g, 'deck', o.seed, hz, W, H, night);
  return cv;
}
const PRESERVED_FULL_VISTA_SOURCE_SHA256 = '00e5195ec2e83aed84bf4e1116fe1b7ebb8d163a5ae469c16ad2f712211852d3';
export { renderPreservedGenericVistaV1, renderPreservedGasDeckVistaV1, renderPreservedAbyssVistaV1, renderPreservedReefVistaV1, PRESERVED_FULL_VISTA_SOURCE_SHA256 };
