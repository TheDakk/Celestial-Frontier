/* AUTO-LIFTED VERBATIM renderer-section painters from main.js (v1.8.9):
   _starSpr (3799-3799) · starSprite (3800-3828) · _decoSpr (3833-3833) · decoSprite (3834-4008) · _quasarSprC (4804-4804) · _quasarSpr (4805-4878) · _rockSprites (4353-4353) · _rockSet (4354-4381) · _ringSprCache (4386-4386) · _ringSprite (4387-4446) · _starSurfCache (4454-4454) · _starSurf (4455-4516) · _moonSprs (4517-4517) · _moonSpr (4518-4697) · _dwarfSprs (4698-4698) · _dwarfSpr (4699-4711) · _rogueSprC (4755-4755) · _rogueSpr (4756-4766) · _beamSprC (4767-4767) · _beamSpr (4768-4779) · _nsCoreSprC (4780-4780) · _nsCoreSpr (4781-4791) · _bhSprC (4910-4910) · _bhSpr (4911-4991) · _cloudSprCache (4883-4883) · _cloudSpr (4884-4909).
   body sha256/16 aa06054db71ba330. ⚠ DO NOT EDIT. Regenerate: node tools/lift-art-extras.mjs
   Browser-only (canvas). */
import { mulberry32, clamp, makeNoise, TAU, hashInt } from '@cf/domain-rand';

const _starSpr=new Map();
function starSprite(col, spike){
  const key=col+(spike?'+':'');
  let sp=_starSpr.get(key);
  if(sp) return sp;
  const S=64, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const n=parseInt(col.slice(1),16), cr=(n>>16)&255, cg=(n>>8)&255, cb=n&255;
  const halo=g.createRadialGradient(C,C,0.4,C,C,C);
  halo.addColorStop(0,'rgba(255,255,255,0.95)');
  halo.addColorStop(0.12,'rgba('+cr+','+cg+','+cb+',0.9)');
  halo.addColorStop(0.30,'rgba('+cr+','+cg+','+cb+',0.28)');
  halo.addColorStop(0.62,'rgba('+cr+','+cg+','+cb+',0.07)');
  halo.addColorStop(1,'rgba('+cr+','+cg+','+cb+',0)');
  g.fillStyle=halo; g.fillRect(0,0,S,S);
  if(spike){
    g.globalCompositeOperation='lighter';
    const sg2=g.createLinearGradient(0,C,S,C);
    sg2.addColorStop(0,'rgba('+cr+','+cg+','+cb+',0)');
    sg2.addColorStop(0.5,'rgba(255,255,255,0.55)');
    sg2.addColorStop(1,'rgba('+cr+','+cg+','+cb+',0)');
    g.fillStyle=sg2;
    g.fillRect(0,C-0.7,S,1.4);
    g.save();g.translate(C,C);g.rotate(Math.PI/2);g.translate(-C,-C);
    g.fillRect(0,C-0.7,S,1.4);
    g.restore();
  }
  _starSpr.set(key,cv);
  return cv;
}
const _decoSpr=new WeakMap();
function decoSprite(dc){
  let sp=_decoSpr.get(dc);
  if(sp) return sp;
  /* 256 masters (2026-07-24 deep-space crispness): nebulae are BIG map
     features — zoomed in, the old 128 went soft. All geometry is C-relative,
     so doubling only sharpens. */
  const S=256, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const r=mulberry32(hashInt((dc.x*7)|0,(dc.y*7)|0,dc.k==='mol'?5:9)>>>0);
  if(dc.k==='h2'||dc.k==='neb'){
    g.globalCompositeOperation='lighter';
    for(let i=0;i<16;i++){
      const a=r()*TAU, d=Math.pow(r(),1.5)*C*0.62;
      const bx=C+Math.cos(a)*d, by=C+Math.sin(a)*d, br=C*(0.14+r()*0.30);
      const hue=dc.hue+(r()-0.5)*36;
      const ng=g.createRadialGradient(bx,by,0,bx,by,br);
      ng.addColorStop(0,'hsla('+hue+',82%,'+(58+r()*16)+'%,'+(0.10+r()*0.12).toFixed(3)+')');
      ng.addColorStop(1,'hsla('+hue+',82%,55%,0)');
      g.fillStyle=ng;g.beginPath();g.arc(bx,by,br,0,TAU);g.fill();
    }
    for(let i2=0;i2<10;i2++){  /* embedded newborn stars */
      const a2=r()*TAU, d2=Math.pow(r(),1.6)*C*0.5, sp2=1.4*(S/128);
      g.fillStyle='rgba(255,255,255,'+(0.35+r()*0.5).toFixed(3)+')';
      g.fillRect(C+Math.cos(a2)*d2, C+Math.sin(a2)*d2, sp2, sp2);
    }
    /* MULTI-SCALE STRUCTURE (visual review 2026-07-24, additive so the base
       cloud keeps its look): filaments + a carved cavity + (h2) dark dust
       lanes + a newborn CLUSTER, or (reflection) a lighting star with a
       brightened near edge — clouds stop reading as uniform blurs */
    g.globalCompositeOperation='lighter';
    g.lineCap='round';
    for(let f2=0;f2<3;f2++){   /* wisped filaments arcing through the body */
      r();   /* stream-preserving draw (was an unused angle — removing it would reseed every cloud's art) */
      const fr3=C*(0.16+r()*0.38), fw=(3.2+r()*3.4)*(S/128);
      g.strokeStyle='hsla('+(dc.hue+(r()-0.5)*30)+',80%,72%,'+(0.045+r()*0.045).toFixed(3)+')';
      g.lineWidth=fw;
      g.beginPath(); g.arc(C+(r()-0.5)*C*0.4, C+(r()-0.5)*C*0.4, fr3, r()*TAU, r()*TAU+1.2+r()*1.4); g.stroke();
    }
    g.globalCompositeOperation='source-over';
    { /* a wind-carved cavity — one soft dark hollow */
      const cvx=C+(r()-0.5)*C*0.5, cvy=C+(r()-0.5)*C*0.5, cvr=C*(0.10+r()*0.12);
      const cg4=g.createRadialGradient(cvx,cvy,0,cvx,cvy,cvr);
      cg4.addColorStop(0,'rgba(8,6,14,0.32)'); cg4.addColorStop(1,'rgba(8,6,14,0)');
      g.fillStyle=cg4; g.beginPath(); g.arc(cvx,cvy,cvr,0,TAU); g.fill();
    }
    if(dc.k==='h2'){
      for(let dl=0;dl<3;dl++){   /* dark dust lanes cutting the glow */
        g.strokeStyle='rgba(10,6,14,'+(0.16+r()*0.10).toFixed(2)+')';
        g.lineWidth=(2.2+r()*2.6)*(S/128);
        g.beginPath(); g.arc(C+(r()-0.5)*C*0.5, C+(r()-0.5)*C*0.6, C*(0.2+r()*0.3), r()*TAU, r()*TAU+1.0+r()); g.stroke();
      }
      { /* the newborn cluster — stars born together, not scattered */
        const kx2=C+(r()-0.5)*C*0.5, ky2=C+(r()-0.5)*C*0.5;
        for(let s3=0;s3<7;s3++){
          const sa3=r()*TAU, sd3=Math.pow(r(),1.4)*C*0.08;
          g.fillStyle='rgba(255,255,255,'+(0.5+r()*0.4).toFixed(2)+')';
          g.fillRect(kx2+Math.cos(sa3)*sd3, ky2+Math.sin(sa3)*sd3, 1.6*(S/128), 1.6*(S/128));
        }
      }
    } else {
      /* reflection: ONE bright illuminating star + the near side glows */
      const lsx=C+(r()-0.5)*C*0.7, lsy=C+(r()-0.5)*C*0.7;
      g.save(); g.globalCompositeOperation='lighter';
      const lg4=g.createRadialGradient(lsx,lsy,0,lsx,lsy,C*0.34);
      lg4.addColorStop(0,'rgba(235,244,255,0.9)');
      lg4.addColorStop(0.12,'hsla('+dc.hue+',70%,80%,0.35)');
      lg4.addColorStop(1,'hsla('+dc.hue+',70%,70%,0)');
      g.fillStyle=lg4; g.beginPath(); g.arc(lsx,lsy,C*0.34,0,TAU); g.fill();
      g.restore();
    }
  } else if(dc.k==='mol'){
    /* dark clouds DIM the starlight — they must never read as black
       holes punched in the disk (Nick's splotch report). Soft wide
       falloff, gentle alphas, one feathered mass instead of blob piles. */
    const mg2=g.createRadialGradient(C,C,0,C,C,C*0.72);
    mg2.addColorStop(0,'rgba(16,12,24,0.52)');
    mg2.addColorStop(0.55,'rgba(22,16,32,0.30)');
    mg2.addColorStop(1,'rgba(22,16,32,0)');
    g.fillStyle=mg2;g.beginPath();g.arc(C,C,C*0.72,0,TAU);g.fill();
    for(let i=0;i<8;i++){
      const a=r()*TAU, d=Math.pow(r(),1.4)*C*0.4;
      const bx=C+Math.cos(a)*d, by=C+Math.sin(a)*d, br=C*(0.20+r()*0.26);
      const ng=g.createRadialGradient(bx,by,0,bx,by,br);
      ng.addColorStop(0,'rgba(14,10,22,'+(0.16+r()*0.14).toFixed(3)+')');
      ng.addColorStop(1,'rgba(22,16,32,0)');
      g.fillStyle=ng;g.beginPath();g.arc(bx,by,br,0,TAU);g.fill();
    }
    /* wave-2 (Gold Master): EMBEDDED PROTOSTARS — faint warm sparks buried in
       the darkness, the tell that this is a nursery, not a hole */
    for(let i=0;i<3;i++){
      const a=r()*TAU, d=Math.pow(r(),1.6)*C*0.34;
      const px=C+Math.cos(a)*d, py=C+Math.sin(a)*d, pr2=S*(0.010+r()*0.012);
      const pg=g.createRadialGradient(px,py,0,px,py,pr2*3.2);
      pg.addColorStop(0,'rgba(255,190,140,'+(0.22+r()*0.14).toFixed(2)+')');
      pg.addColorStop(0.4,'rgba(220,120,90,0.10)');
      pg.addColorStop(1,'rgba(220,120,90,0)');
      g.fillStyle=pg;g.beginPath();g.arc(px,py,pr2*3.2,0,TAU);g.fill();
    }
    g.strokeStyle='rgba(140,112,170,0.20)';g.lineWidth=S/110;  /* rim light — a touch stronger (wave-2) */
    g.beginPath();g.arc(C,C,C*0.5,r()*TAU,r()*TAU+2.0);g.stroke();
  } else if(dc.k==='rem'){
    g.globalCompositeOperation='lighter';
    /* an expanding gas shell — warm puffs crowd a torn, uneven ring, the
       way real remnants shred. No strokes, no clean circle: Nick's law,
       everything that dies in space dies as a cloud (v1.3.5). */
    for(let i=0;i<22;i++){
      const a=r()*TAU, rr2=C*(0.58+(r()-0.5)*0.24);
      const bx=C+Math.cos(a)*rr2, by=C+Math.sin(a)*rr2, br=C*(0.10+r()*0.16);
      const hue=14+r()*26;
      const ng=g.createRadialGradient(bx,by,0,bx,by,br);
      ng.addColorStop(0,'hsla('+hue+',88%,'+(56+r()*14)+'%,'+(0.10+r()*0.14).toFixed(3)+')');
      ng.addColorStop(1,'hsla('+hue+',88%,55%,0)');
      g.fillStyle=ng;g.beginPath();g.arc(bx,by,br,0,TAU);g.fill();
    }
    /* cool wisps drifting free of the shell */
    for(let i2=0;i2<8;i2++){
      const a2=r()*TAU, d2=C*(0.28+r()*0.48);
      const bx2=C+Math.cos(a2)*d2, by2=C+Math.sin(a2)*d2, br2=C*(0.05+r()*0.09);
      const ng2=g.createRadialGradient(bx2,by2,0,bx2,by2,br2);
      ng2.addColorStop(0,'hsla('+(200+r()*40)+',70%,72%,'+(0.05+r()*0.07).toFixed(3)+')');
      ng2.addColorStop(1,'hsla(210,70%,70%,0)');
      g.fillStyle=ng2;g.beginPath();g.arc(bx2,by2,br2,0,TAU);g.fill();
    }
    const core=g.createRadialGradient(C,C,0,C,C,C*0.12);
    core.addColorStop(0,'rgba(220,235,255,0.95)');core.addColorStop(1,'rgba(220,235,255,0)');
    g.fillStyle=core;g.beginPath();g.arc(C,C,C*0.12,0,TAU);g.fill();
    /* visual review: an EXPANDING remnant reads by its shock front — a
       partial bright shell arc + filament streamers tracing the blast */
    g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round';
    const shA=r()*TAU;
    g.strokeStyle='rgba(255,214,170,0.14)'; g.lineWidth=5.5*(S/128);
    g.beginPath(); g.arc(C,C,C*0.60,shA,shA+2.4+r()*1.4); g.stroke();
    g.strokeStyle='rgba(255,236,210,0.10)'; g.lineWidth=3.0*(S/128);
    g.beginPath(); g.arc(C,C,C*0.64,shA+0.3,shA+1.8+r()); g.stroke();
    for(let fl2=0;fl2<4;fl2++){   /* filaments streaming outward */
      const fa4=r()*TAU;
      g.strokeStyle='hsla('+(14+r()*30)+',85%,66%,'+(0.07+r()*0.05).toFixed(2)+')';
      g.lineWidth=(2.2+r()*2.2)*(S/128);
      g.beginPath();
      g.moveTo(C+Math.cos(fa4)*C*0.22, C+Math.sin(fa4)*C*0.22);
      g.quadraticCurveTo(C+Math.cos(fa4+0.25)*C*0.42, C+Math.sin(fa4+0.25)*C*0.42,
                         C+Math.cos(fa4+0.12)*C*0.60, C+Math.sin(fa4+0.12)*C*0.60);
      g.stroke();
    }
    g.restore();
  } else if(dc.k==='plan'){
    /* PLANETARY NEBULA (HD coverage pass): the one deco that still drew
       stroked circles. A dying sun's shed shell — torn teal/gold puffs on
       a ring annulus, white-dwarf spark at center. Same recipe as 'rem',
       cooler chemistry. */
    g.globalCompositeOperation='lighter';
    for(let i=0;i<18;i++){
      const a=r()*TAU, rr2=C*(0.42+(r()-0.5)*0.18);
      const bx=C+Math.cos(a)*rr2, by=C+Math.sin(a)*rr2, br=C*(0.09+r()*0.13);
      const hue=r()<0.62?166+r()*26:42+r()*18;
      const ng=g.createRadialGradient(bx,by,0,bx,by,br);
      ng.addColorStop(0,'hsla('+hue+',80%,'+(58+r()*14)+'%,'+(0.10+r()*0.13).toFixed(3)+')');
      ng.addColorStop(1,'hsla('+hue+',80%,55%,0)');
      g.fillStyle=ng;g.beginPath();g.arc(bx,by,br,0,TAU);g.fill();
    }
    for(let i2=0;i2<6;i2++){   /* faint outer halo wisps */
      const a2=r()*TAU, d2=C*(0.62+r()*0.22);
      const bx2=C+Math.cos(a2)*d2, by2=C+Math.sin(a2)*d2, br2=C*(0.05+r()*0.07);
      const ng2=g.createRadialGradient(bx2,by2,0,bx2,by2,br2);
      ng2.addColorStop(0,'hsla(190,70%,70%,'+(0.04+r()*0.05).toFixed(3)+')');
      ng2.addColorStop(1,'hsla(190,70%,70%,0)');
      g.fillStyle=ng2;g.beginPath();g.arc(bx2,by2,br2,0,TAU);g.fill();
    }
    const wd=g.createRadialGradient(C,C,0,C,C,C*0.09);
    wd.addColorStop(0,'rgba(255,255,255,0.95)');wd.addColorStop(1,'rgba(210,240,255,0)');
    g.fillStyle=wd;g.beginPath();g.arc(C,C,C*0.09,0,TAU);g.fill();
  }
  _decoSpr.set(dc,cv);
  return cv;
}
let _quasarSprC=null;
function _quasarSpr(){
  /* a feeding supermassive black hole (HD coverage pass): dim host-galaxy
     haze, blinding accretion core, twin tapered jets ending in faint
     lobes — was a per-frame gradient dot with a flat stroked line */
  if(_quasarSprC) return _quasarSprC;
  const S=320, cv=document.createElement('canvas'); cv.width=cv.height=S;   /* 2026-07-24 deep-space crispness: 2× master, all coords S-relative */
  const g=cv.getContext('2d'), C=S/2;
  /* the host, almost drowned by its own core */
  g.save(); g.translate(C,C); g.scale(1,0.42);
  const host=g.createRadialGradient(0,0,0,0,0,S*0.30);
  host.addColorStop(0,'rgba(170,185,235,0.20)');
  host.addColorStop(0.6,'rgba(150,165,215,0.10)');
  host.addColorStop(1,'rgba(150,165,215,0)');
  g.fillStyle=host; g.beginPath(); g.arc(0,0,S*0.30,0,TAU); g.fill();
  g.restore();
  /* twin RELATIVISTIC jets (visual review 2026-07-24, fix-first #1: the old
     wedges read as rectangular beams). Each jet: a faint wide emission cone,
     a narrow core that TAPERS and fades (never a squared cap), bright plasma
     KNOTS pulsing along it, and slight waviness — the approaching jet drawn
     brighter and longer than the receding one (relativistic asymmetry). */
  g.globalCompositeOperation='lighter';
  const jr=mulberry32(0x0A57);
  for(const sgn of [-1,1]){
    const bo=(sgn<0)?1.0:0.62;                 /* approaching side brighter/longer */
    const jlen=S*(sgn<0?0.47:0.40);
    /* the wide faint cone */
    const cg2=g.createLinearGradient(C,C,C+sgn*jlen,C);
    cg2.addColorStop(0,'rgba(150,185,255,'+(0.14*bo).toFixed(2)+')');
    cg2.addColorStop(1,'rgba(140,180,255,0)');
    g.fillStyle=cg2;
    g.beginPath();
    g.moveTo(C+sgn*S*0.04, C);
    g.lineTo(C+sgn*jlen, C-S*0.062);
    g.lineTo(C+sgn*jlen, C+S*0.062);
    g.closePath(); g.fill();
    /* the narrow tapering core — wavy segments thinning to nothing */
    let px2=C+sgn*S*0.045, py2=C, w2=S*0.016;
    const segs=7;
    for(let i2=0;i2<segs;i2++){
      const t2=(i2+1)/segs;
      const nx=C+sgn*jlen*t2, ny=C+Math.sin(t2*9+(sgn<0?0.4:2.1))*S*0.012;
      const sg3=g.createLinearGradient(px2,0,nx,0);
      sg3.addColorStop(0,'rgba(170,205,255,'+((0.50*(1-t2*0.85))*bo).toFixed(2)+')');
      sg3.addColorStop(1,'rgba(160,195,255,'+((0.50*(1-Math.min(1,t2*1.15)))*bo).toFixed(2)+')');
      g.strokeStyle=sg3; g.lineWidth=Math.max(0.8, w2*(1-t2*0.8)); g.lineCap='round';
      g.beginPath(); g.moveTo(px2,py2); g.lineTo(nx,ny); g.stroke();
      px2=nx; py2=ny;
    }
    /* plasma knots — brightness pulses where the jet shocks itself */
    for(let k2=0;k2<3;k2++){
      const kt=0.22+jr()*0.62, kx=C+sgn*jlen*kt, ky=C+Math.sin(kt*9+(sgn<0?0.4:2.1))*S*0.012;
      const kr2=S*(0.012+jr()*0.014)*(1-kt*0.5);
      const kg2=g.createRadialGradient(kx,ky,0,kx,ky,kr2*2.4);
      kg2.addColorStop(0,'rgba(210,228,255,'+(0.5*bo*(1-kt*0.6)).toFixed(2)+')');
      kg2.addColorStop(1,'rgba(170,205,255,0)');
      g.fillStyle=kg2; g.beginPath(); g.arc(kx,ky,kr2*2.4,0,TAU); g.fill();
    }
  }
  /* a hint of the accretion disc around the core (tilted, small) */
  g.save(); g.translate(C,C); g.rotate(-0.35); g.scale(1,0.32);
  const dg2=g.createRadialGradient(0,0,S*0.035,0,0,S*0.12);
  dg2.addColorStop(0,'rgba(0,0,0,0)');
  dg2.addColorStop(0.4,'rgba(190,205,255,0.30)');
  dg2.addColorStop(1,'rgba(160,180,255,0)');
  g.fillStyle=dg2; g.beginPath(); g.arc(0,0,S*0.12,0,TAU); g.fill();
  g.restore();
  g.globalCompositeOperation='source-over';
  /* the core outshines everything */
  const q=g.createRadialGradient(C,C,0,C,C,S*0.19);
  q.addColorStop(0,'#ffffff'); q.addColorStop(0.18,'#bcd4ff');
  q.addColorStop(0.5,'rgba(140,180,255,0.35)'); q.addColorStop(1,'rgba(140,180,255,0)');
  g.fillStyle=q; g.beginPath(); g.arc(C,C,S*0.19,0,TAU); g.fill();
  return _quasarSprC=cv;
}
const _rockSprites={};
function _rockSet(kind){
  let set=_rockSprites[kind]; if(set) return set;
  set=_rockSprites[kind]=[];
  const ice=kind==='ice';
  const mid=ice?'#8fa8c2':'#7a7266', lit=ice?'#d8e8f6':'#a89e8e';
  for(let v=0;v<8;v++){
    const S=24, cv=document.createElement('canvas'); cv.width=cv.height=S;
    const g=cv.getContext('2d'), r=mulberry32(hashInt(0xA57E, v, ice?2:1)>>>0);
    const cx=S/2, cy=S/2, n=7+((r()*4)|0), pts=[];
    for(let i=0;i<n;i++){ const a=i/n*TAU, rr=S*0.32*(0.60+r()*0.55); pts.push([cx+Math.cos(a)*rr, cy+Math.sin(a)*rr]); }
    g.fillStyle=mid; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<n;i++) g.lineTo(pts[i][0],pts[i][1]);
    g.closePath(); g.fill();
    /* sunward facet + shadowed flank, clipped to the silhouette */
    g.globalCompositeOperation='source-atop';
    const lg2=g.createLinearGradient(0,0,S,S);
    lg2.addColorStop(0,lit); lg2.addColorStop(0.45,'rgba(0,0,0,0)'); lg2.addColorStop(1,'rgba(10,8,6,0.55)');
    g.fillStyle=lg2; g.fillRect(0,0,S,S);
    /* a couple of crater pocks */
    for(let k2=0;k2<3;k2++){
      g.fillStyle='rgba(0,0,0,'+(0.18+r()*0.16).toFixed(2)+')';
      g.beginPath(); g.arc(cx+(r()-0.5)*S*0.42, cy+(r()-0.5)*S*0.42, 1+r()*2.2, 0, TAU); g.fill();
    }
    g.globalCompositeOperation='source-over';
    set.push(cv);
  }
  return set;
}
const _ringSprCache=new Map();
function _ringSprite(seed, hue){
  /* translucent banded ring system + Cassini gap, per-seed. 512 master
     (2026-07-24 universe-crispness pass — the rng recipe is size-independent,
     so doubling the canvas only sharpens; cache stays tiny per system). */
  let sp=_ringSprCache.get(seed); if(sp) return sp;
  if(_ringSprCache.size>10){ _ringSprCache.delete(_ringSprCache.keys().next().value); }
  const S=512, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const r=mulberry32((seed^0x7717)>>>0);
  const bands=3+((r()*3)|0);
  /* pre-roll the band recipe, then SCALE it to fit the sprite — wide
     many-band rolls (Nick's Uranus) used to run past the canvas edge and
     come back square-cut. Same rng draws, same look, bounded radius. */
  const recipe=[];
  let radEnd=C*0.62;
  for(let b=0;b<bands;b++){
    const w=C*(0.045+r()*0.075);
    recipe.push({w, a1:(0.24+r()*0.30), a2:(0.10+r()*0.16)});
    radEnd+=w*1.12+C*0.012;
  }
  const k=Math.min(1, (C*0.96-C*0.62)/Math.max(1,(radEnd-C*0.62)));
  let rad=C*0.62;
  for(const bn of recipe){
    const w=bn.w*k;
    rad+=w*0.5;
    g.strokeStyle='rgba('+hue+','+bn.a1.toFixed(2)+')';
    g.lineWidth=w;
    g.beginPath(); g.arc(C,C,rad,0,TAU); g.stroke();
    /* a brighter inner filament inside each band */
    g.strokeStyle='rgba('+hue+','+bn.a2.toFixed(2)+')';
    g.lineWidth=w*0.34;
    g.beginPath(); g.arc(C,C,rad-w*0.22,0,TAU); g.stroke();
    rad+=w*0.62+C*0.012*k;
  }
  /* the Cassini-style gap */
  g.globalCompositeOperation='destination-out';
  g.strokeStyle='rgba(0,0,0,0.9)'; g.lineWidth=C*0.028;
  g.beginPath(); g.arc(C,C,C*(0.70+r()*0.16),0,TAU); g.stroke();
  /* feather the outer edge */
  g.strokeStyle='rgba(0,0,0,0.45)'; g.lineWidth=C*0.02;
  g.beginPath(); g.arc(C,C,rad-C*0.005,0,TAU); g.stroke();
  /* visual review 2026-07-24: rings were "slightly too perfect" — ~1 in 3
     seeds carves a SECOND minor gap, and every ring gets faint particle
     grain along its bands (drawn after the recipe, so existing band layouts
     are untouched — same first draws, same look plus texture) */
  if(r()<0.35){
    g.strokeStyle='rgba(0,0,0,0.55)'; g.lineWidth=C*0.012;
    g.beginPath(); g.arc(C,C,C*(0.64+r()*0.24),0,TAU); g.stroke();
  }
  g.globalCompositeOperation='source-over';
  g.save(); g.globalCompositeOperation='source-atop';
  for(let gi=0;gi<260;gi++){
    const ga=r()*TAU, gd=C*0.62+r()*(rad-C*0.62);
    g.fillStyle='rgba('+(r()<0.5?'255,255,255':'0,0,0')+','+(0.05+r()*0.10).toFixed(2)+')';
    g.fillRect(C+Math.cos(ga)*gd, C+Math.sin(ga)*gd, 1.3, 1.3);
  }
  g.restore();
  _ringSprCache.set(seed, cv);   /* FIFO-capped at 10 on entry — 512² masters are ~1MB each */
  return cv;
}
const _starSurfCache=new Map();
function _starSurf(seed, col, kind){
  const key=(seed>>>0)+'|'+col+'|'+(kind||'');
  let sp=_starSurfCache.get(key); if(sp) return sp;
  if(_starSurfCache.size>6){ _starSurfCache.delete(_starSurfCache.keys().next().value); }
  const S=512, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const n=parseInt((col||'#ffe9c8').slice(1),16), cr=(n>>16)&255, cg2=(n>>8)&255, cb=n&255;
  const fbm=makeNoise((seed^0x57A2)>>>0);
  const giant=(kind==='RG'||kind==='SG'), wd=(kind==='WD');
  const hot=(kind==='B'||kind==='A'), dwarfM=(kind==='M'||kind==='K'||kind==='BD');
  /* visual review §3: classes differ by TEXTURE, not just tint — giants churn
     huge cells, hot stars boil in tight fine granules, red dwarfs mottle dark
     and throw flares, white dwarfs stay near-smooth */
  const cell=giant?2.1:(hot?8.5:(dwarfM?6.2:5.5));
  const img=g.createImageData(S,S), d=img.data;
  for(let y=0;y<S;y++){
    const dy=(y-C)/C;
    for(let x=0;x<S;x++){
      const dx=(x-C)/C, rr2=dx*dx+dy*dy, i=(y*S+x)*4;
      if(rr2>1){ d[i+3]=0; continue; }
      const z=Math.sqrt(1-rr2), u=Math.atan2(dx,z)*1.4;
      const gN=fbm(u*cell+3, dy*cell-2, 4);
      let k=wd ? (0.90+gN*0.12) : (dwarfM ? (0.58+gN*0.66) : (hot ? (0.80+gN*0.34) : (0.72+gN*0.50)));   /* granulation contrast per class */
      const limb=Math.pow(z,0.55);                          /* real limb darkening */
      k*=(0.52+0.48*limb);
      const core=Math.pow(z,2)*(wd?0.5:0.38);              /* white-hot center lift */
      const rr=Math.sqrt(rr2);
      d[i  ]=clamp(cr*k+(255-cr)*core,0,255);
      d[i+1]=clamp(cg2*k+(255-cg2)*core,0,255);
      d[i+2]=clamp(cb*k+(255-cb)*core,0,255);
      d[i+3]= rr>0.965 ? Math.max(0,Math.round(255*(1-rr)/0.035)) : 255;   /* feathered chromosphere edge */
    }
  }
  g.putImageData(img,0,0);
  /* class signatures over the surface: red dwarfs throw bright FLARE arcs;
     supergiants loft prominence PLUMES past the limb (visual review §3) */
  const pr2=mulberry32((seed^0xF1A2)>>>0);
  if(dwarfM){
    g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round';
    for(let i2=0;i2<3;i2++){
      const fa2=pr2()*TAU, fr2=S*(0.28+pr2()*0.14);
      g.strokeStyle='rgba(255,220,180,'+(0.18+pr2()*0.16).toFixed(2)+')';
      g.lineWidth=S*(0.008+pr2()*0.010);
      g.beginPath(); g.arc(C+Math.cos(fa2)*S*0.06, C+Math.sin(fa2)*S*0.06, fr2, fa2-0.3, fa2+0.3+pr2()*0.4); g.stroke();
    }
    g.restore();
  }
  if(kind==='SG'||kind==='RG'){
    g.save(); g.globalCompositeOperation='lighter';
    const np2=kind==='SG'?4:2;
    for(let i2=0;i2<np2;i2++){
      const pa2=pr2()*TAU, px3=C+Math.cos(pa2)*S*0.497, py3=C+Math.sin(pa2)*S*0.497;
      const pg3=g.createRadialGradient(px3,py3,0,px3,py3,S*(0.028+pr2()*0.026));
      pg3.addColorStop(0,'rgba('+cr+','+((cg2*0.8)|0)+','+((cb*0.6)|0)+','+(0.20+pr2()*0.12).toFixed(2)+')');
      pg3.addColorStop(1,'rgba('+cr+','+((cg2*0.8)|0)+','+((cb*0.6)|0)+',0)');
      g.fillStyle=pg3; g.beginPath(); g.arc(px3,py3,S*(0.028+pr2()*0.026),0,TAU); g.fill();
    }
    g.restore();
  }
  _starSurfCache.set(key, cv);
  return cv;
}
const _moonSprs={};
function _moonSpr(ti, hd){
  /* the four moon types as lit spheres — the live view finally matches
     the card thumb: rocky grey, icy blue-white, volcanic gold, captured
     rubble-brown. hd (2026-07-24 universe-crispness): a CLOSE moon renders
     a 160px master with real crater fields / streaks / crack networks —
     the 28px far-view master upscaled was the moon version of the chunky
     Earth. Same rng seed either way; the hd pass just draws MORE of it. */
  const mk=hd?('h'+ti):ti;
  let sp=_moonSprs[mk]; if(sp) return sp;
  const S=hd?160:28, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const base=['#b9bcc6','#cfe4f2','#e0c060','#8d8678'][ti]||'#c8ccd8';
  const n=parseInt(base.slice(1),16), br2=(n>>16)&255, bg2=(n>>8)&255, bb2=n&255;
  const K=(k,a)=>'rgba('+Math.min(255,(br2*k)|0)+','+Math.min(255,(bg2*k)|0)+','+Math.min(255,(bb2*k)|0)+','+(a==null?1:a)+')';
  const lg2=g.createRadialGradient(C-S*0.16,C-S*0.16,1,C,C,S*0.48);
  lg2.addColorStop(0,K(1.35)); lg2.addColorStop(0.6,K(1)); lg2.addColorStop(1,K(0.55));
  g.fillStyle=lg2; g.beginPath(); g.arc(C,C,S*0.46,0,TAU); g.fill();
  const r=mulberry32(0xA00E+ti);
  const lw=S/28;                                /* stroke weights scale with the master */
  g.save(); g.beginPath(); g.arc(C,C,S*0.452,0,TAU); g.clip();   /* details never float off the sphere */
  if(hd){
    /* terrain mottling first — big soft tonal patches so the ground reads
       as ground, not a flat gradient (both albedo directions, low alpha) */
    for(let i=0;i<9;i++){
      const mx2=C+(r()-0.5)*S*0.8, my2=C+(r()-0.5)*S*0.8, mr2=S*(0.07+r()*0.10);
      const mg2=g.createRadialGradient(mx2,my2,0,mx2,my2,mr2);
      const dkn=r()<0.5;
      mg2.addColorStop(0,dkn?'rgba(0,0,10,0.10)':'rgba(255,255,255,0.07)');
      mg2.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=mg2; g.beginPath(); g.arc(mx2,my2,mr2,0,TAU); g.fill();
    }
  }
  if(ti===2){ /* volcanic (wave-2 Gold pass): dark basalt fields + irregular
                 calderas + mostly-COOLED fissures with only segments glowing —
                 geology, not a toy with luminous cracks */
    if(hd){
      for(let i=0;i<4;i++){   /* cooled basalt flows — broad soft dark fields */
        const bx3=C+(r()-0.5)*S*0.66, by3=C+(r()-0.5)*S*0.66, br3=S*(0.10+r()*0.13);
        const bg3=g.createRadialGradient(bx3,by3,0,bx3,by3,br3);
        bg3.addColorStop(0,'rgba(30,20,14,'+(0.18+r()*0.12).toFixed(2)+')');
        bg3.addColorStop(1,'rgba(30,20,14,0)');
        g.fillStyle=bg3; g.beginPath(); g.arc(bx3,by3,br3,0,TAU); g.fill();
      }
      for(let i=0;i<2;i++){   /* ash shrouds — soft grey veils */
        const ax=C+(r()-0.5)*S*0.6, ay=C+(r()-0.5)*S*0.6, ar2=S*(0.10+r()*0.08);
        const ag=g.createRadialGradient(ax,ay,0,ax,ay,ar2);
        ag.addColorStop(0,'rgba(120,110,100,0.14)'); ag.addColorStop(1,'rgba(120,110,100,0)');
        g.fillStyle=ag; g.beginPath(); g.arc(ax,ay,ar2,0,TAU); g.fill();
      }
      for(let i=0;i<1;i++){   /* ONE commanding caldera — dark rimmed pit, molten floor hint */
        const kx=C+(r()-0.5)*S*0.42, ky=C+(r()-0.5)*S*0.42, kr=S*(0.062+r()*0.024), ka=r()*TAU;
        g.fillStyle='rgba(24,14,10,0.62)';
        g.beginPath();
        for(let p2=0;p2<=10;p2++){ const a=p2/10*TAU;
          const w2=1+Math.sin(a*3+ka)*0.22+Math.sin(a*5+ka*2)*0.12;
          const px=kx+Math.cos(a)*kr*w2, py=ky+Math.sin(a)*kr*0.72*w2;
          if(p2) g.lineTo(px,py); else g.moveTo(px,py); }
        g.closePath(); g.fill();
        const kg=g.createRadialGradient(kx,ky,0,kx,ky,kr*0.6);
        kg.addColorStop(0,'rgba(255,140,50,0.5)'); kg.addColorStop(1,'rgba(255,140,50,0)');
        g.fillStyle=kg; g.beginPath(); g.arc(kx,ky,kr*0.6,0,TAU); g.fill();
      }
      for(let i=0;i<5;i++){   /* fissures: fine cooled cracks, ~1/3 carry a glowing segment */
        const fx2=C+(r()-0.5)*S*0.6, fy2=C+(r()-0.5)*S*0.6, fa2=r()*TAU, fl2=S*(0.05+r()*0.04);
        const mx3=fx2+Math.cos(fa2)*fl2*0.5, my3=fy2+Math.sin(fa2)*fl2*0.5;
        const ex3=mx3+Math.cos(fa2+0.4)*fl2*0.5, ey3=my3+Math.sin(fa2+0.4)*fl2*0.5;
        g.strokeStyle='rgba(40,26,16,0.45)'; g.lineWidth=0.38*lw;
        g.beginPath(); g.moveTo(fx2,fy2); g.lineTo(mx3,my3); g.lineTo(ex3,ey3); g.stroke();
        if(i%3===0){ g.strokeStyle='rgba(255,120,50,0.5)'; g.lineWidth=0.3*lw;
          g.beginPath(); g.moveTo(mx3,my3); g.lineTo((mx3+ex3)/2,(my3+ey3)/2); g.stroke(); }
      }
    } else {   /* far master: ONE readable feature — a glowing caldera + 2 fissures */
      const kx=C+(r()-0.5)*S*0.3, ky=C+(r()-0.5)*S*0.3;
      g.fillStyle='rgba(24,14,10,0.7)'; g.beginPath(); g.ellipse(kx,ky,S*0.10,S*0.075,r(),0,TAU); g.fill();
      const kg=g.createRadialGradient(kx,ky,0,kx,ky,S*0.06);
      kg.addColorStop(0,'rgba(255,140,50,0.75)'); kg.addColorStop(1,'rgba(255,140,50,0)');
      g.fillStyle=kg; g.beginPath(); g.arc(kx,ky,S*0.06,0,TAU); g.fill();
      g.strokeStyle='rgba(255,110,50,0.5)'; g.lineWidth=0.8*lw;
      for(let i=0;i<2;i++){ const fa2=r()*TAU, fx2=C+(r()-0.5)*S*0.5, fy2=C+(r()-0.5)*S*0.5;
        g.beginPath(); g.moveTo(fx2,fy2);
        g.lineTo(fx2+Math.cos(fa2)*S*0.2, fy2+Math.sin(fa2)*S*0.2); g.stroke(); }
    }
  } else if(ti===1){ /* icy (wave-2 Gold pass): BRANCHING interrupted fractures
                        with displacement highlights — Europa, not engraving */
    if(hd){
      const crack=(x,y,ang,len,w2,depth)=>{
        let px=x, py=y, a=ang;
        const segs=3+((r()*3)|0);
        for(let s2=0;s2<segs;s2++){
          const sl=len*(0.2+r()*0.18), gap=r()<0.22;   /* interruptions */
          const nx2=px+Math.cos(a)*sl, ny2=py+Math.sin(a)*sl;
          if(!gap){
            g.strokeStyle='rgba(120,150,190,'+(0.30+r()*0.14).toFixed(2)+')';
            g.lineWidth=Math.max(0.3,w2*(0.7+r()*0.6))*lw;
            g.beginPath(); g.moveTo(px,py); g.lineTo(nx2,ny2); g.stroke();
            /* displacement highlight: a bright hairline offset to the sun side */
            g.strokeStyle='rgba(255,255,255,0.20)'; g.lineWidth=0.3*lw;
            g.beginPath(); g.moveTo(px-0.9*lw,py-0.9*lw); g.lineTo(nx2-0.9*lw,ny2-0.9*lw); g.stroke();
          }
          px=nx2; py=ny2; a+=(r()-0.5)*0.7;
          if(depth<2 && r()<0.30) crack(px,py,a+(r()<0.5?-0.8:0.8),len*0.55,w2*0.7,depth+1);   /* branches */
        }
      };
      for(let i=0;i<4;i++) crack(C+(r()-0.5)*S*0.55, C+(r()-0.5)*S*0.55, r()*TAU, S*0.3, 0.6, 0);
      for(let i=0;i<6;i++){   /* frost patches stay */
        const px3=C+(r()-0.5)*S*0.6, py3=C+(r()-0.5)*S*0.6, pr3=(1.0+r()*1.6)*lw;
        const pg3=g.createRadialGradient(px3,py3,0,px3,py3,pr3);
        pg3.addColorStop(0,'rgba(255,255,255,0.22)'); pg3.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle=pg3; g.beginPath(); g.arc(px3,py3,pr3,0,TAU); g.fill(); }
    } else {   /* far master: ONE bold interrupted fracture across the face */
      g.strokeStyle='rgba(110,145,185,0.55)'; g.lineWidth=0.9*lw;
      let px=C-S*0.3, py=C+(r()-0.5)*S*0.3, a=(r()-0.5)*0.5;
      for(let s2=0;s2<4;s2++){ const nx2=px+Math.cos(a)*S*0.17, ny2=py+Math.sin(a)*S*0.17;
        if(s2!==2){ g.beginPath(); g.moveTo(px,py); g.lineTo(nx2,ny2); g.stroke(); }
        px=nx2; py=ny2; a+=(r()-0.5)*0.8; }
      g.strokeStyle='rgba(255,255,255,0.35)'; g.lineWidth=0.5*lw;
      g.beginPath(); g.arc(C,C,S*0.26, r()*TAU, r()*TAU+0.8); g.stroke();
    }
  } else { /* rocky / captured craters. HD: NON-OVERLAPPING placement (rejection
              sampling), few-large-many-small sizing, and real bowl shading
              matched to the sprite's upper-left light — no stray rim arcs. */
    if(!hd){
      /* far master (wave-2): ONE hero crater with a real bowl + 3 specks — a
         distant moon keeps a readable material feature */
      const hx=C+(r()-0.5)*S*0.34, hy=C+(r()-0.5)*S*0.34, hr2=S*0.11;
      const hb=g.createLinearGradient(hx-hr2,hy-hr2,hx+hr2,hy+hr2);
      hb.addColorStop(0,'rgba(0,0,8,0.4)'); hb.addColorStop(0.55,'rgba(0,0,8,0.15)'); hb.addColorStop(1,K(1.25,0.35));
      g.fillStyle=hb; g.beginPath(); g.arc(hx,hy,hr2,0,TAU); g.fill();
      for(let i=0;i<3;i++){
        g.fillStyle='rgba(0,0,0,'+(0.14+r()*0.14).toFixed(2)+')';
        g.beginPath(); g.arc(C+(r()-0.5)*S*0.55, C+(r()-0.5)*S*0.55, 0.8+r()*1.4, 0, TAU); g.fill();
      }
    } else {
      const placed=[];
      for(let t2=0; t2<70 && placed.length<11; t2++){
        const big=placed.length<2;
        const prd=S*(big?(0.075+r()*0.045):(0.020+r()*0.032));
        const px2=C+(r()-0.5)*S*0.76, py2=C+(r()-0.5)*S*0.76;
        if(Math.hypot(px2-C,py2-C)+prd>S*0.44) continue;               /* stay on the face */
        if(placed.some(p=>Math.hypot(p.x-px2,p.y-py2)<(p.r+prd)*1.25)) continue;   /* never overlap */
        placed.push({x:px2,y:py2,r:prd});
      }
      for(const cr2 of placed){
        /* bowl: an across-the-crater gradient — shadowed wall toward the
           light (upper-left), lit far wall — reads as depth, not a dot */
        const bg4=g.createLinearGradient(cr2.x-cr2.r,cr2.y-cr2.r,cr2.x+cr2.r,cr2.y+cr2.r);
        bg4.addColorStop(0,'rgba(0,0,8,0.34)');
        bg4.addColorStop(0.55,'rgba(0,0,8,0.13)');
        bg4.addColorStop(1,K(1.22,0.30));
        g.fillStyle=bg4; g.beginPath(); g.arc(cr2.x,cr2.y,cr2.r,0,TAU); g.fill();
        /* BROKEN raised rim (wave-2): the ring gradient clips to 2–3 partial
           arc wedges with seeded gaps — slumped walls, not a stamped circle */
        const rg4=g.createRadialGradient(cr2.x,cr2.y,cr2.r*0.85,cr2.x,cr2.y,cr2.r*1.22);
        rg4.addColorStop(0,'rgba(0,0,0,0)');
        rg4.addColorStop(0.55,K(1.18,0.16));
        rg4.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=rg4;
        let ra=r()*TAU;
        for(let w2=0;w2<3;w2++){ const span=1.1+r()*1.6;
          g.beginPath(); g.moveTo(cr2.x,cr2.y);
          g.arc(cr2.x,cr2.y,cr2.r*1.25,ra,ra+span); g.closePath(); g.fill();
          ra+=span+0.25+r()*0.7; }
        /* ASYMMETRIC EJECTA on the large craters: faint pale rays thrown
           mostly one way (oblique impact) */
        if(cr2.r>S*0.06){
          const ea=r()*TAU;
          g.strokeStyle=K(1.20,0.10); g.lineCap='round';
          for(let e2=0;e2<6;e2++){
            const a=ea+(r()-0.5)*1.5, el=cr2.r*(1.5+r()*1.8);
            g.lineWidth=(0.4+r()*0.7)*lw;
            g.beginPath(); g.moveTo(cr2.x+Math.cos(a)*cr2.r*1.15, cr2.y+Math.sin(a)*cr2.r*1.15);
            g.lineTo(cr2.x+Math.cos(a)*(cr2.r*1.15+el), cr2.y+Math.sin(a)*(cr2.r*1.15+el)); g.stroke();
          }
        }
      }
    }
  }
  g.restore();
  _moonSprs[mk]=cv; return cv;
}
const _dwarfSprs=[];
function _dwarfSpr(v){
  let sp=_dwarfSprs[v%3]; if(sp) return sp;
  const S=24, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2, r=mulberry32(0xD3A2F+(v%3));
  const lg2=g.createRadialGradient(C-3,C-3,1,C,C,S*0.5);
  lg2.addColorStop(0,'#e8ddc8'); lg2.addColorStop(0.55,'#c2b8a6'); lg2.addColorStop(1,'#6e6656');
  g.fillStyle=lg2; g.beginPath(); g.arc(C,C,S*0.45,0,TAU); g.fill();
  for(let i=0;i<3;i++){
    g.fillStyle='rgba(0,0,0,'+(0.14+r()*0.14).toFixed(2)+')';
    g.beginPath(); g.arc(C+(r()-0.5)*S*0.5, C+(r()-0.5)*S*0.5, 0.7+r()*1.4, 0, TAU); g.fill();
  }
  _dwarfSprs[v%3]=cv; return cv;
}
let _rogueSprC=null;
function _rogueSpr(){
  if(_rogueSprC) return _rogueSprC;
  const S=12, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const rg2=g.createRadialGradient(C-1.5,C-1.5,0,C,C,C-0.5);
  rg2.addColorStop(0,'rgba(96,90,142,0.85)');
  rg2.addColorStop(0.55,'rgba(46,42,68,0.9)');
  rg2.addColorStop(1,'rgba(46,42,68,0)');
  g.fillStyle=rg2; g.beginPath(); g.arc(C,C,C-0.5,0,TAU); g.fill();
  return _rogueSprC=cv;
}
let _beamSprC=null;
function _beamSpr(){
  /* one tapered lighthouse beam pointing +x — every pulsar draws it
     twice, rotated, instead of allocating gradients per frame */
  if(_beamSprC) return _beamSprC;
  const W2=48, H2=10, cv=document.createElement('canvas'); cv.width=W2; cv.height=H2;
  const g=cv.getContext('2d');
  const bg2=g.createLinearGradient(0,0,W2,0);
  bg2.addColorStop(0,'rgba(190,230,255,0.85)'); bg2.addColorStop(1,'rgba(190,230,255,0)');
  g.strokeStyle=bg2; g.lineWidth=3.4; g.lineCap='round';
  g.beginPath(); g.moveTo(2,H2/2); g.lineTo(W2-2,H2/2); g.stroke();
  return _beamSprC=cv;
}
let _nsCoreSprC=null;
function _nsCoreSpr(){
  if(_nsCoreSprC) return _nsCoreSprC;
  const S=24, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  const ng=g.createRadialGradient(C,C,0,C,C,C);
  ng.addColorStop(0,'rgba(255,255,255,0.95)');
  ng.addColorStop(0.45,'rgba(220,235,255,0.75)');
  ng.addColorStop(1,'rgba(190,220,255,0)');
  g.fillStyle=ng; g.beginPath(); g.arc(C,C,C,0,TAU); g.fill();
  return _nsCoreSprC=cv;
}
let _bhSprC=null;
function _bhSpr(){
  /* the black hole, done right (2026-07-24 deep-space pass): a BAKED
     cinematic render replacing the per-frame gradient dot — tilted
     accretion disc with a DOPPLER-BEAMED approaching side, the far side of
     the disc LENSED into a ring arcing over and under the hole, a razor
     photon ring, and the pure-black horizon punched last. One sprite,
     drawImage'd (heat rule). */
  if(_bhSprC) return _bhSprC;
  const S=256, cv=document.createElement('canvas'); cv.width=cv.height=S;
  const g=cv.getContext('2d'), C=S/2;
  g.translate(C,C); g.rotate(0.5);
  /* ambient heat-glow bath */
  const amb=g.createRadialGradient(0,0,S*0.08,0,0,S*0.48);
  amb.addColorStop(0,'rgba(255,150,60,0.20)');
  amb.addColorStop(0.5,'rgba(255,110,40,0.07)');
  amb.addColorStop(1,'rgba(255,110,40,0)');
  g.fillStyle=amb; g.beginPath(); g.arc(0,0,S*0.48,0,TAU); g.fill();
  /* the flat disc — hot inner rim cooling outward */
  g.save(); g.scale(1,0.42);
  const ad=g.createRadialGradient(0,0,S*0.115,0,0,S*0.44);
  ad.addColorStop(0,'rgba(0,0,0,0)');
  ad.addColorStop(0.18,'rgba(255,214,150,0.95)');
  ad.addColorStop(0.42,'rgba(255,150,50,0.60)');
  ad.addColorStop(0.75,'rgba(210,90,30,0.26)');
  ad.addColorStop(1,'rgba(180,70,25,0)');
  g.fillStyle=ad; g.beginPath(); g.arc(0,0,S*0.44,0,TAU); g.fill();
  /* Doppler beaming — the side spinning TOWARD you blazes white-gold */
  g.globalCompositeOperation='lighter';
  const dop=g.createLinearGradient(-S*0.40,0,S*0.12,0);
  dop.addColorStop(0,'rgba(255,235,190,0.55)');
  dop.addColorStop(0.55,'rgba(255,200,120,0.16)');
  dop.addColorStop(1,'rgba(255,200,120,0)');
  g.fillStyle=dop; g.beginPath(); g.arc(0,0,S*0.44,0,TAU); g.fill();
  g.restore();
  /* the LENSED far side — the disc behind the hole bent into a halo that
     HUGS the horizon, brightest at the apex over the top (the Interstellar
     silhouette; first draft's wide loop read as a detached ring toy) */
  g.globalCompositeOperation='lighter';
  g.lineCap='round';
  g.strokeStyle='rgba(255,200,120,0.62)'; g.lineWidth=S*0.022;
  g.beginPath(); g.ellipse(0,0,S*0.112,S*0.155,0,Math.PI*1.15,Math.PI*1.85); g.stroke();   /* over the top */
  g.strokeStyle='rgba(255,170,90,0.30)'; g.lineWidth=S*0.014;
  g.beginPath(); g.ellipse(0,0,S*0.112,S*0.145,0,Math.PI*0.18,Math.PI*0.82); g.stroke();   /* under, dimmer */
  /* the photon ring — light itself in orbit, razor thin (review: −12% peak) */
  g.strokeStyle='rgba(255,244,220,0.78)'; g.lineWidth=S*0.008;
  g.beginPath(); g.arc(0,0,S*0.107,0,TAU); g.stroke();
  /* lensed background stars — faint smeared arcs skimming the photon ring */
  {
    const br2=mulberry32(0xB40E);
    g.lineCap='round';
    for(let i2=0;i2<6;i2++){
      const sa2=br2()*TAU, sr2=S*(0.125+br2()*0.05);
      g.strokeStyle='rgba(235,240,255,'+(0.10+br2()*0.10).toFixed(2)+')';
      g.lineWidth=(0.7+br2()*0.7);
      g.beginPath(); g.arc(0,0,sr2,sa2,sa2+0.25+br2()*0.35); g.stroke();
    }
  }
  /* disc turbulence — broken brightness streaks riding the flow */
  g.save(); g.scale(1,0.42);
  {
    const tr2=mulberry32(0xB41F);
    for(let i2=0;i2<7;i2++){
      const ta2=tr2()*TAU, trr=S*(0.16+tr2()*0.24);
      const bright=tr2()<0.5;
      g.strokeStyle=bright?'rgba(255,225,170,'+(0.10+tr2()*0.10).toFixed(2)+')'
                          :'rgba(80,30,10,'+(0.10+tr2()*0.10).toFixed(2)+')';
      g.lineWidth=S*(0.008+tr2()*0.012);
      g.beginPath(); g.arc(0,0,trr,ta2,ta2+0.5+tr2()*0.9); g.stroke();
    }
  }
  g.restore();
  g.globalCompositeOperation='source-over';
  /* the horizon — black, punched LAST, with a whisper-soft edge (review:
     the perfectly clean circle read as a sticker) */
  const hg3=g.createRadialGradient(0,0,S*0.088,0,0,S*0.102);
  hg3.addColorStop(0,'rgba(0,0,0,1)'); hg3.addColorStop(0.88,'rgba(0,0,0,1)'); hg3.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=hg3;
  g.beginPath(); g.arc(0,0,S*0.102,0,TAU); g.fill();
  g.setTransform(1,0,0,1,0,0);
  return _bhSprC=cv;
}
const _cloudSprCache=new Map();
function _cloudSpr(P){
  let sp=_cloudSprCache.get(P.seed); if(sp) return sp;
  if(_cloudSprCache.size>12){ _cloudSprCache.delete(_cloudSprCache.keys().next().value); }
  const PX=256, cv=document.createElement('canvas'); cv.width=cv.height=PX;
  const g=cv.getContext('2d');
  const img=g.createImageData(PX,PX), d=img.data;
  const fbm=makeNoise((P.seed^0xC10D)>>>0);
  const R0=PX/2;
  for(let y=0;y<PX;y++){
    const dy=(y-R0)/R0;
    for(let x=0;x<PX;x++){
      const dx=(x-R0)/R0, rr2=dx*dx+dy*dy, i=(y*PX+x)*4;
      if(rr2>1){ d[i+3]=0; continue; }
      const z=Math.sqrt(1-rr2), u=Math.atan2(dx,z)*1.4;
      const wf3=0.55+((hashInt(P.seed>>>0,0x33D,2)&255)/255)*0.5;
      const cl=fbm(u*2.2*wf3+7, dy*2.2/(0.75+wf3*0.35)+11, 4);
      let a=cl>0.60 ? Math.min((cl-0.60)*3.0, 0.8) : 0;
      const rr=Math.sqrt(rr2);
      if(rr>0.82) a*=Math.max(0,(1-rr)/0.18);   /* taper well before the limb */
      d[i]=250; d[i+1]=252; d[i+2]=255; d[i+3]=(a*255)|0;
    }
  }
  g.putImageData(img,0,0);
  _cloudSprCache.set(P.seed, cv);
  return sp=cv;
}
export { decoSprite, _quasarSpr, starSprite, _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr, _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr, _cloudSpr };
