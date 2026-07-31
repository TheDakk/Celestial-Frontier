/* PAINTER→PIXI PIPELINE SPIKE — the answer to "re-express each painter in Pixi
   with the same integrity".

   After two hand-drawn attempts both missed the art bar, the honest route to
   "same integrity, higher scale" is NOT redrawing: it is CARRYING THE PAINTERS.
   This script:
     1. lifts the real vista painter stack VERBATIM from main.js (the exact same
        lift list tools/sheets/vistas.js uses — proven machinery),
     2. runs each painter through a 2× CONTEXT-SCALE SHIM — the painter draws in
        its native 960×430 coordinate space onto a 1920×860 canvas via
        ctx.scale(2,2), so every gradient/stroke/curve scales uniformly.
        Verbatim art, double resolution. (Checked: no shadowBlur in the vista
        block, the one canvas feature that ignores transforms.)
     3. uploads the results as Pixi textures and applies a GPU shader on top
        (custom GLSL color-grade + vignette; falls back to ColorMatrix if the
        custom program fails, and SAYS SO in the page title).

   Usage: node pipeline.js          (writes pipeline.html + pipeline-proof.png)   */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

/* — the same lift used by tools/proofsheet.js, verbatim — */
function lift(name) {
  let i = main.indexOf('function ' + name + '(');
  if (i >= 0) {
    let d = 0, j = main.indexOf('{', i);
    for (let k = j; k < main.length; k++) {
      if (main[k] === '{') d++;
      else if (main[k] === '}') { d--; if (!d) return main.slice(i, k + 1); }
    }
  }
  i = main.search(new RegExp('\\n(const|let) ' + name + '[=\\s]'));
  if (i >= 0) return main.slice(i + 1, main.indexOf(';\n', i) + 1);
  throw new Error('cannot lift: ' + name);
}

/* the exact dependency set tools/sheets/vistas.js declares */
const LIFT = ['mulberry32', 'hashInt',
  'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT',
  'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET', 'FA_LOCO', 'EX_LOCO', 'EX_HABITAT',
  'habOf', 'locoOf', 'BIOME_PROFILES'];
let lifted = LIFT.map(lift).join('\n');
const A = 'let hdOn=true, _vistaPend=false;', B = 'function showVistaBox';
const i = main.indexOf(A), j = main.indexOf(B, i + A.length);
if (i < 0 || j < 0) throw new Error('liftBetween markers not found');
lifted += '\n' + main.slice(i, j);

const html = `<!doctype html><meta charset="utf-8"><title>pipeline-loading</title>
<style>html,body{margin:0;background:#07090f;color:#8fa3bf;font:12px/1.4 ui-monospace,monospace}</style>
<body>
<script src="./node_modules/pixi.js/dist/pixi.min.js"></script>
<script>
const TAU=Math.PI*2;
${lifted}
</script>
<script>
(async () => {
  /* prelude the vista sheet uses */
  window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
  const ABC=['#6fd3ff','#ff9fe0','#7fe6a0','#ffd96a','#d6a0ff','#ff8a72'];
  window.battleStats=(x)=>({ab:{col:ABC[(x.trait||0)%ABC.length]}, vit:150, tier:0});

  /* ── SPIKE-ONLY PLACEMENT POLISH (Nick: 'weird shading around the animal') ──
     The shipped pass draws near-black occlusion tufts at alpha 0.92 plus a wide
     0.46-alpha shadow pool; against 2x-crisp terrain they read as a smudge.
     This variant: tufts fewer/thinner/taller-tapered at ~half alpha with a
     green-tinted color, shadow pool tightened and softened. HOT-SWAPPED per
     cell so A1/A2 are an honest shipped-vs-polished A/B on the same seed.
     main.js is NOT touched; if Nick approves, this becomes a recorded port
     delta, not a silent change. */
  const _placeShipped=_hdPlaceBeast;
  const _placePolished=function(g,bcv,x,groundY,scale,flip,hazeAmt,warm,tuft,hazeCol){
    const S=bcv.width,w=S*scale,h=S*scale;
    const work=document.createElement('canvas');work.width=work.height=S;
    const wg=work.getContext('2d');
    wg.drawImage(bcv,0,0);
    wg.globalCompositeOperation='source-atop';
    if(warm>0){wg.fillStyle='rgba(255,218,168,'+warm+')';wg.fillRect(0,0,S,S);}
    if(hazeAmt>0){wg.fillStyle='rgba('+(hazeCol||'127,162,196')+','+hazeAmt+')';wg.fillRect(0,0,S,S);}
    /* tighter, softer contact shadow: pool 0.46->0.30 and 12% narrower */
    const shA=0.30*(1-hazeAmt*0.65);
    const rx=Math.max(6,w*0.33);
    const sgd2=g.createRadialGradient(x,groundY+2,1,x,groundY+2,rx);
    sgd2.addColorStop(0,'rgba(0,0,0,'+shA.toFixed(3)+')');sgd2.addColorStop(0.55,'rgba(0,0,0,'+(shA*0.45).toFixed(3)+')');sgd2.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=sgd2;g.beginPath();g.ellipse(x,groundY+2,rx,Math.max(2,h*0.05),0,0,7);g.fill();
    g.fillStyle='rgba(0,0,0,'+(shA*0.55).toFixed(3)+')';
    g.beginPath();g.ellipse(x,groundY+2,w*0.19,h*0.026,0,0,7);g.fill();
    g.save();g.translate(x,groundY-bcv._feetY*h);
    if(flip)g.scale(-1,1);
    g.drawImage(work,-w/2,0,w,h);g.restore();
    /* occlusion tufts: 30% fewer, thinner, ~half alpha, green-tinted, and
       TAPERED — a second thinner pass over the top half so blades fade out
       instead of ending as blunt dark bars */
    const nT=Math.max(3,(8*scale*4)|0);
    const tuftCol=(tuft||'22,44,26');
    for(let tf=0;tf<nT;tf++){
      const gx=x+(tf/nT-0.5)*w*0.66+(_hdHash(tf,x|0,7)-0.5)*8;
      const tall=(tf%4===0);
      const gh=(4+_hdHash(tf,3,9)*7)*scale*3.2*(tall?1.7:1);
      const midx=gx+(_hdHash(tf,5,3)-0.5)*6, midy=groundY+3-gh*0.6;
      const tipx=gx+(_hdHash(tf,8,5)-0.5)*10, tipy=groundY+3-gh;
      g.strokeStyle='rgba('+tuftCol+','+(0.58-hazeAmt*0.35).toFixed(3)+')';
      g.lineWidth=Math.max(1,1.25*scale*4);
      g.beginPath();g.moveTo(gx,groundY+3);g.quadraticCurveTo(midx,midy,tipx,tipy);g.stroke();
      g.strokeStyle='rgba('+tuftCol+','+(0.26-hazeAmt*0.15).toFixed(3)+')';
      g.lineWidth=Math.max(0.6,0.6*scale*4);
      g.beginPath();g.moveTo(midx,midy);g.quadraticCurveTo((midx+tipx)/2,(midy+tipy)/2,tipx,tipy);g.stroke();
    }
  };

  let sd=5000;
  const mk=(nm)=>{ const gg={seed:sd++, kingdom:'fauna', color:(sd*3)%17, accent:(sd*5)%17,
    form:sd%18, body:(sd*5)%16, loco:sd%13, trait:(sd*7)%25, size:2, head:sd%10,
    limbs:sd%6, skin:sd%9, tail:sd%7, pattern:(sd*3)%8, eyes:sd%6, behavior:sd%12, habitat:8};
    const big=/whale|elephant|orca|camel|bear/i, mid=/lion|jaguar|deer|turtle|horse/i;
    gg.size = big.test(nm)?5:(mid.test(nm)?3:2);
    if(nm){ gg._earthName=nm; gg.name=nm; } const G=hdGenesFor(gg); G.size=gg.size; return G; };

  /* ── THE 2× SHIM: verbatim painter, doubled resolution ──
     hdVista creates its own canvas; intercept creation, double the backing
     store, and pre-scale the context so the painter's 960×430 coordinate
     space lands on 1920×860 pixels. No art code touched. */
  const SCALE=2;
  const origCreate=document.createElement.bind(document);
  let shimOn=false;
  /* ⚠ FIRST CANVAS ONLY. v1 of this shim scaled EVERY canvas created during the
     paint call — including the painter's internal scratch canvases — so every
     drawImage(subCanvas,…) composited at 4× and creatures/trees blew up or fell
     off-frame (see pipeline-proof attempt 1: the jungle was three giant blobs).
     Scaling just the outermost canvas keeps composition byte-faithful: direct
     draws gain true 2× resolution; sub-canvas layers upscale ×2 at composite
     time. TRUE 2× on every layer needs painters to take a DPR parameter — a
     mechanical Phase 3 transform, not re-authoring. */
  document.createElement=(tag)=>{
    const el=origCreate(tag);
    if(shimOn && tag==='canvas'){
      shimOn=false;   /* arm for exactly one canvas — the vista's own */
      const origW=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width');
      const origH=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'height');
      Object.defineProperty(el,'width',{ configurable:true, get(){ return origW.get.call(el)/SCALE; },
        set(v){ origW.set.call(el, v*SCALE); const g=el.getContext('2d'); g.setTransform(SCALE,0,0,SCALE,0,0); }});
      Object.defineProperty(el,'height',{ configurable:true, get(){ return origH.get.call(el)/SCALE; },
        set(v){ origH.set.call(el, v*SCALE); const g=el.getContext('2d'); g.setTransform(SCALE,0,0,SCALE,0,0); }});
    }
    return el;
  };
  /* ⚠ After painting, DELETE the instance getters. They exist so the PAINTER
     sees its native 960×430 coordinate space — but Pixi reads cv.width too, and
     a lying getter makes Texture.from() frame only the upper-left quadrant of
     the 2× bitmap (attempt 2's failure: every "2×" cell was actually the
     top-left quarter of the painting — big sun, cropped deer). Deleting the
     instance properties re-exposes the prototype accessors and the true
     1920×860 backing size. */
  const paint=(opts, scaled, polish)=>{ _hdPlaceBeast = polish ? _placePolished : _placeShipped; shimOn=!!scaled; const cv=hdVista(opts); shimOn=false; _hdPlaceBeast=_placeShipped;
    if(scaled){ delete cv.width; delete cv.height; } return cv; };

  /* ── the cells: same seeds native vs 2×, then 2×+shader across biomes ── */
  const CW=507, CH=227, PAD=2, CAP=18;
  const cells=[
    { t:'A1 · SHIPPED placement (native)', o:{seed:1000, pal:'day', wb:'temperate', biome:'land', flora:true, water:'liquid', moons:1, era:'none', genes:['Red Deer','Fox'].map(mk), herd:2}, scaled:false, shader:false, polish:false },
    { t:'A2 · POLISHED placement · SAME SEED', o:{seed:1000, pal:'day', wb:'temperate', biome:'land', flora:true, water:'liquid', moons:1, era:'none', genes:['Red Deer','Fox'].map(mk), herd:2}, scaled:false, shader:false, polish:true },
    { t:'B1 · polished · 2x + shader · jungle', o:{seed:1097, pal:'day', wb:'jungle', biome:'land', flora:true, water:'liquid', moons:1, era:'none', genes:['Jaguar','Toucan'].map(mk), herd:2}, scaled:true, shader:true, polish:true },
    { t:'B2 · polished · 2x + shader · dune sea', o:{seed:1291, pal:'sand', wb:'dunesea', biome:'land', flora:true, water:'none', moons:1, era:'none', genes:['Camel'].map(mk), herd:1}, scaled:true, shader:true, polish:true },
    { t:'C1 · polished · 2x + shader · coral', o:{seed:1388, pal:'day', wb:'coral', biome:'island', flora:true, water:'liquid', moons:1, era:'none', genes:['Sea Turtle','Clownfish'].map(mk), herd:2}, scaled:true, shader:true, polish:true },
    { t:'C2 · polished · 2x + shader · glacier night', o:{seed:1485, pal:'snow', wb:'glacier', biome:'land', flora:true, water:'frozen', moons:1, era:'none', nightize:true, genes:['Polar Bear'].map(mk), herd:1}, scaled:true, shader:true, polish:true },
  ];

  const { Application, Container, Sprite, Texture, Filter, GlProgram, ColorMatrixFilter, Text } = PIXI;
  const app=new Application();
  await app.init({ width: CW*2+PAD*3, height: (CH+CAP)*3+PAD*4, background:'#07090f', antialias:true, preference:'webgl' });
  document.body.appendChild(app.canvas);

  /* GPU grade: custom GLSL — subtle filmic lift + vignette. Fall back to
     ColorMatrix and say so, rather than silently shipping a different claim. */
  let shaderMode='custom-glsl';
  const mkGrade=()=>{
    try{
      const frag=\`
        in vec2 vTextureCoord; uniform sampler2D uTexture; uniform vec4 uInputSize;
        void main(){
          vec4 c=texture(uTexture, vTextureCoord);
          vec3 g=pow(c.rgb, vec3(0.94));                 /* filmic lift */
          g=mix(vec3(dot(g,vec3(0.299,0.587,0.114))), g, 1.12);   /* +sat */
          vec2 p=vTextureCoord-0.5; g*=1.0-dot(p,p)*0.55;          /* vignette */
          gl_FragColor=vec4(g, c.a);
        }\`;
      const vert=\`
        in vec2 aPosition; out vec2 vTextureCoord;
        uniform vec4 uInputSize; uniform vec4 uOutputFrame; uniform vec4 uOutputTexture;
        vec4 filterVertexPosition(void){
          vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
          position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
          position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
          return vec4(position, 0.0, 1.0);
        }
        vec2 filterTextureCoord(void){ return aPosition * (uOutputFrame.zw * uInputSize.zw); }
        void main(void){ gl_Position=filterVertexPosition(); vTextureCoord=filterTextureCoord(); }\`;
      return new Filter({ glProgram: new GlProgram({ vertex: vert, fragment: frag }) });
    }catch(e){
      shaderMode='fallback-colormatrix ('+e.message+')';
      const f=new ColorMatrixFilter(); f.saturate(0.12); f.contrast(0.06); return f;
    }
  };

  cells.forEach((c,idx)=>{
    const col=idx%2, row=(idx/2)|0;
    const x=PAD+col*(CW+PAD), y=PAD+row*(CH+CAP+PAD);
    let cv; try{ sd=5000; cv=paint(c.o, c.scaled, c.polish); }catch(e){
      const t=new Text({ text:'ERR '+e.message, style:{ fill:0xff6666, fontSize:12 }}); t.x=x+8; t.y=y+8; app.stage.addChild(t); return; }
    const spr=new Sprite(Texture.from(cv));
    spr.x=x; spr.y=y; spr.width=CW; spr.height=CH;
    if(c.shader){ spr.filters=[mkGrade()]; }
    app.stage.addChild(spr);
    const cap=new Text({ text:c.t+'   ['+(c.scaled?'painter space 960×430 → backing '+cv.width+'×'+cv.height:'painter canvas '+cv.width+'×'+cv.height)+']',
      style:{ fill:0xc8b98a, fontSize:11, fontFamily:'monospace' }});
    cap.x=x+2; cap.y=y+CH+3; app.stage.addChild(cap);
  });

  requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    document.title='pipeline-ready|'+shaderMode;
  })));
})().catch(e=>{ document.title='pipeline-error|'+(e&&e.message||e); });
</script></body>`;

fs.writeFileSync(path.join(__dirname, 'pipeline.html'), html);
console.log('pipeline.html written (' + (html.length / 1024).toFixed(0) + ' KB, ' + LIFT.length + ' lifted names + vista block)');

const OUT = path.join(__dirname, 'pipeline-proof.png');
try { fs.unlinkSync(OUT); } catch (_) {}
const page = 'file:///' + path.join(__dirname, 'pipeline.html').replace(/\\/g, '/');
execFileSync(process.env.CF_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1020,743', '--virtual-time-budget=15000',
  '--screenshot=' + OUT, page,
], { stdio: 'pipe', timeout: 180000 });
console.log(fs.existsSync(OUT) ? 'pipeline-proof.png written (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)' : 'NO SCREENSHOT');
