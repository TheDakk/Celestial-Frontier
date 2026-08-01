/* AUTO-LIFTED VERBATIM renderer-section painters from main.js (v1.8.9):
   _starSpr (3799-3799) · starSprite (3800-3828) · _decoSpr (3833-3833) · decoSprite (3834-4008) · _quasarSprC (4804-4804) · _quasarSpr (4805-4878).
   body sha256/16 65e2c50cf4eda859. ⚠ DO NOT EDIT. Regenerate: node tools/lift-art-extras.mjs
   Browser-only (canvas). */
import { mulberry32, TAU, hashInt } from '@cf/domain-rand';

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
export { decoSprite, _quasarSpr, starSprite };
