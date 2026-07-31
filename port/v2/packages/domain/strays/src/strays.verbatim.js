/* AUTO-LIFTED VERBATIM domain-pure strays from main.js (v1.8.9) — functions
   living OUTSIDE the 14 [domain] modules that fixtures pin or domain code
   calls: cleanName (13274-13274) · _r2 (14592-14592) · encodeWhere (14593-14601) · decodeWhere (14615-14636) · winEstimate (18459-18462) · STAT_KEYS (16772-16772) · floraStat (16782-16782) · BIOME_SETS (10763-10823) · biomeFor (10824-10835) · hdGenesFor (5605-5701) · _sanitizeSavedGenome (14153-14201).
   body sha256/16 5abcca3cda9b35c5. ⚠ DO NOT EDIT. Regenerate: node tools/lift-strays.mjs */
import { mulberry32, clamp, hashInt } from '@cf/domain-rand';
import { SP_COLOR, FA_TRAIT, FA_DIET, FA_HEAD, FA_LIMBS, FA_SKIN, FA_TAIL, FA_PATTERN, FA_EYES, FA_HABITAT, SP_HEX, FA_SIZE_M, TIER_MAX, habOf, locoOf } from '@cf/domain-speciestraits';
import { b64encUtf8, b64decUtf8 } from '@cf/domain-encutil';
import { battleStats } from '@cf/domain-combatcore';

function cleanName(s,n){ return String(s).replace(/[<>&"']/g,'').trim().slice(0,n||24); }   /* verify-pass: one sanitizer, parameterized cap */
function _r2(n){ return Math.round(n*100)/100; }
function encodeWhere(w, name){
  const g=w.gal;
  const o={t:w.type==='planet'?'p':(w.type==='star'?'s':'g'),
    g:[_r2(g.x),_r2(g.y),_r2(g.size),g.sp,_r2(g.tilt),_r2(g.rot),g.seed,(g.home?1:0)|(g.quasar?2:0)|(g.dwarf?4:0)]};
  if(w.star) o.s=[_r2(w.star.x),_r2(w.star.y),w.star.seed];
  if(w.pseed!=null) o.p=w.pseed;
  if(name) o.n=String(name).slice(0,24);
  return 'CF1-'+b64encUtf8(JSON.stringify(o)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeWhere(code){
  try{
    if(String(code||'').length>8192) return null;   /* CF-CR-010: bound before any decode — a pasted megabyte must not block the main thread */
    const h=String(code).indexOf('CF1-'); if(h<0) return null;
    let b64=String(code).slice(h+4).trim().replace(/-/g,'+').replace(/_/g,'/');
    while(b64.length%4) b64+='=';
    const o=JSON.parse(b64decUtf8(b64));
    const G=o.g; if(!G || G.length<8) return null;
    /* review catch (NaN-camera crash): a crafted CF1 code with a non-numeric
       size/tilt/… passed the x/y reach gate, then goTo's 0.55*minWH/size went
       NaN and blacked the screen. Coerce+clamp every decoded number the way
       loadSave does for its own fields; a bad number can't reach a transform. */
    const _n=(v,d,lo,hi)=>{ const x=+v; return isFinite(x)?clamp(x,lo,hi):d; };
    const gal={x:_n(G[0],0,-1e7,1e7),y:_n(G[1],0,-1e7,1e7),size:_n(G[2],60,8,4000),
      sp:_n(G[3],0,0,3e5),tilt:_n(G[4],0.5,-7,7),rot:_n(G[5],0,-7,7),seed:_n(G[6],1,0,4294967295)>>>0,
      home:!!(G[7]&1), quasar:!!(G[7]&2), dwarf:!!(G[7]&4)};
    const w={type:o.t==='p'?'planet':(o.t==='s'?'star':'galaxy'), gal};
    if(o.s) w.star={x:_n(o.s[0],0,-1e7,1e7),y:_n(o.s[1],0,-1e7,1e7),seed:_n(o.s[2],1,0,4294967295)>>>0};
    if(o.p!=null){ const p=+o.p; if(isFinite(p)) w.pseed=clamp(p,0,4294967295)>>>0; }
    return {where:w, name:o.n?(cleanName(o.n)||null):null};
  }catch(_){ return null; }
}
function winEstimate(champ, native){
  const A=champ.stats||battleStats(champ.genome), B=battleStats(native.genome);
  return clamp(A.total/(A.total+B.total), 0.05, 0.95);
}
const STAT_KEYS=['vit','fer','res','agi','ins'];
function floraStat(g){ return STAT_KEYS[(g&&g.seed!=null)?(hashInt(g.seed,0xF0,7)%5):0]; }
const BIOME_SETS={
 terran:[
  {k:'temperate',n:'Temperate world', w:24, land:100, bands:['temperate'], f:'meadows, forests and slow rivers under a kind sun'},
  {k:'savanna',  n:'Savanna world',   w:12, land:100, bands:['temperate','hot'], f:'gold grass to the horizon, herds moving like weather'},
  {k:'jungle',   n:'Jungle world',    w:10, land:85,  bands:['temperate'], f:'canopy over canopy — the ground is a rumor'},
  {k:'marsh',    n:'Marsh world',     w:8,  land:90,  bands:['temperate'], f:'reed flats and braided channels, loud with small lives'},
  {k:'swamp',    n:'Swamp world',     w:7,  land:80,  bands:['temperate'], f:'blackwater fens under hanging moss'},
  {k:'mangrove', n:'Mangrove world',  w:5,  land:90,  bands:['temperate'], f:'tangled roots walking out into a warm sea'},
  {k:'tundra',   n:'Tundra world',    w:12, land:90,  bands:['cold'], f:'permafrost moss and a low, reluctant sun'},
  {k:'karst',    n:'Karst world',     w:5,  land:80,  bands:['temperate','cold','hot'], f:'sinkholes and cave mouths — the ground is hollow'},
  {k:'saltflat', n:'Salt-Flat world', w:8,  land:85,  bands:['hot'], f:'blinding white pans where the water used to be'},
  {k:'fungal',   n:'Fungal world',    w:1.6,land:85,  bands:['temperate','cold'], rare:1, f:'spore towers and gill canopies — a forest with no trees'},
  {k:'crystalsteppe',n:'Crystal Steppe world',w:1.4,land:85, bands:['temperate','cold','hot'], rare:1, f:'mineral spires standing in the grass like a frozen chord'},
 ],
 ocean:[
  {k:'opensea',  n:'Open-Sea world',  w:20, land:90, f:'water to every horizon, weather its only geography'},
  {k:'archipelago',n:'Archipelago world',w:14, land:95, f:'island chains scattered like a flung handful of green'},
  {k:'coral',    n:'Coral-Shallows world',w:10, land:100, bands:['temperate'], f:'turquoise reef flats you can read from orbit'},
  {k:'stormsea', n:'Storm-Sea world', w:8,  land:60, f:'squall lines stacked to the edge of sight'},
  {k:'volcisle', n:'Volcanic-Archipelago world', w:5, land:70, f:'young fire building new land out of the sea'},
  {k:'abyssal',  n:'Abyssal world',   w:7,  land:75, f:'no islands, no shallows — a lightless deep that goes down and down'},
  {k:'milksea',  n:'Milk-Sea world',  w:1.4,land:90, rare:1, f:'bioluminescent blooms wide enough to glow at the horizon'},
 ],
 ice:[
  {k:'glacier',  n:'Glacier world',   w:18, land:90, f:'rivers of old ice grinding to a frozen sea'},
  {k:'packice',  n:'Pack-Ice world',  w:12, land:85, f:'a frozen ocean ridged where the floes shoulder each other'},
  {k:'cryogeyser',n:'Cryogeyser world',w:8, land:70, f:'plumes of buried sea breaking through the crust'},
  {k:'blueice',  n:'Blue-Ice world',  w:2,  land:55, rare:1, f:'canyons of old blue ice, lit from within'},
 ],
 desert:[
  {k:'dunesea',  n:'Dune-Sea world',  w:18, land:90, f:'sand in slow waves the size of hills'},
  {k:'canyon',   n:'Canyon world',    w:10, land:85, f:'slot canyons and strata — a history book split open'},
  {k:'saltpan',  n:'Salt-Pan world',  w:8,  land:85, bands:['hot'], f:'mirage shimmer over crusted brine pans'},
  {k:'oxide',    n:'Oxide-Waste world',w:10,land:75, f:'rust plains walked by dust devils'},
  {k:'glass',    n:'Glass-Desert world',w:1.6,land:50, rare:1, f:'sand fused to glass by old lightning, sharp as a warning'},
 ],
 rocky:[
  {k:'cratered', n:'Cratered world',  w:18, land:95, f:'a face that remembers every impact'},
  {k:'boulder',  n:'Boulder-Field world',w:10,land:90, f:'regolith plains strewn with stones the size of houses'},
  {k:'graben',   n:'Graben-Canyon world',w:8,land:85, f:'the crust pulled apart into long shadowed trenches'},
  {k:'geode',    n:'Geode world',     w:2.4,land:80, rare:1, f:'gashes of amethyst where the ground split and grew jewels'},
  {k:'carbon',   n:'Carbon world',    w:1.6,land:60, rare:1, f:'graphite-black plains that glint, here and there, like diamond'},
 ],
 venus:[
  {k:'sulfurdeck',n:'Sulfur-Storm world',w:10,land:30, f:'storm decks of sulfur, gold-green and furious'},
  {k:'acidhaze', n:'Acid-Haze world', w:12, land:25, f:'a crushing haze that eats light and metal alike'},
  {k:'abyssgreen',n:'Greenhouse-Abyss world',w:4,land:10, f:'the bottom of an atmosphere like an ocean — gloom, heat, and lightning'},
 ],
 lava:[
  {k:'ashwaste', n:'Ash-Waste world', w:10, land:35, f:'cooling fields under a slow gray snowfall of ash'},
  {k:'emberfield',n:'Ember-Field world',w:10,land:25, f:'ground that glows through its own cracks'},
  {k:'obsidian', n:'Obsidian world',  w:7,  land:20, f:'black glass plains veined with fire'},
  {k:'magmasea', n:'Magma-Sea world', w:4,  land:10, f:'a shoreline where the ocean is molten rock'},
 ],
 gas:[
  {k:'banded',   n:'Banded giant',    w:16, land:65, f:'storm bands running unbroken around the world'},
  {k:'ammonia',  n:'Pastel-Ammonia giant',w:8,land:75, f:'soft pale decks, deceptively calm'},
  {k:'stormeye', n:'Storm-Eye giant', w:4,  land:30, f:'one storm older than nations, wider than worlds'},
  {k:'hotglow',  n:'Ember giant',     w:3,  land:15, rare:1, f:'a giant that glows its own sullen red — the night side is a furnace'},
 ],
};
function biomeFor(P, band){
  if(P.seed===133) return null;   /* Earth is Earth — home never re-labels (its card said savanna; it lies) */
  const set=BIOME_SETS[P.type]; if(!set) return null;
  const bd=band==='frozen'?'cold':band;   /* remnant-orbit worlds read as cold country */
  const cands=set.filter(b=>!b.bands || b.bands.includes(bd));
  const pool=cands.length?cands:set;
  const r=mulberry32(hashInt(P.seed, 0xB10E, 7)>>>0);
  let total=0; for(const b of pool) total+=b.w;
  let v=r()*total;
  for(const b of pool){ v-=b.w; if(v<=0) return b; }
  return pool[pool.length-1];
}
function hdGenesFor(g){
  const S=battleStats(g), r=mulberry32((g.seed^0xBEA57)>>>0);
  const col=(S.ab&&S.ab.col)||'#c8a878';
  const plan=(g.body||0)%16;
  const headTxt=FA_HEAD[(g.head||0)%FA_HEAD.length]||'';
  const trait=FA_TRAIT[(g.trait||0)%FA_TRAIT.length]||'';
  const patTxt=FA_PATTERN[(g.pattern||0)%FA_PATTERN.length]||'';
  const sizeM=FA_SIZE_M[(g.size||2)%FA_SIZE_M.length]||1;
  const hideHex=SP_HEX[SP_COLOR[(g.color||0)%SP_COLOR.length]]||'#8a9bb5';
  const hn=parseInt(hideHex.slice(1),16), an=parseInt(col.slice(1),16);
  const bmix=(a,b2)=>Math.round(Math.min(255, a*0.62+b2*0.38));
  const base=[bmix((hn>>16)&255,(an>>16)&255), bmix((hn>>8)&255,(an>>8)&255), bmix(hn&255,an&255)];
  const horn=(headTxt.includes('horn')||headTxt.includes('crest')||/crystal antlers/.test(trait))
    ?0.7+r()*0.4:(plan===11?1.0:(plan===10?0.5:0));
  /* v1.3.5 coherence pass (Nick: creatures read bland/flat): a second
     harmonious body color rotates off the hide hue — direction and
     distance from the ACCENT gene, so bred children inherit their
     two-tone honestly — and the pattern paints in a mixed tone instead
     of plain shadow. FINISH climbs with the creature's own rarity tier:
     matte → sheen → iridescent → prismatic pearl. */
  const rot=((g.accent||0)%2?1:-1)*(26+((g.accent||0)%5)*6);
  const _h2r=(rgb,deg)=>{
    const [R,G2,B]=rgb; const mx=Math.max(R,G2,B), mn=Math.min(R,G2,B); const l=(mx+mn)/2;
    let h=0,s2=0; const d2=mx-mn;
    if(d2){ s2=l>127?d2/(510-mx-mn):d2/(mx+mn);
      h= mx===R ? ((G2-B)/d2+(G2<B?6:0)) : mx===G2 ? (B-R)/d2+2 : (R-G2)/d2+4; h*=60; }
    h=(h+deg+360)%360;
    const c2=(1-Math.abs(2*l/255-1))*s2*255, x2=c2*(1-Math.abs((h/60)%2-1)), m2=l-c2/2;
    const [r5,g5,b5]= h<60?[c2,x2,0]:h<120?[x2,c2,0]:h<180?[0,c2,x2]:h<240?[0,x2,c2]:h<300?[x2,0,c2]:[c2,0,x2];
    return [Math.round(clamp(r5+m2,0,255)),Math.round(clamp(g5+m2,0,255)),Math.round(clamp(b5+m2,0,255))];
  };
  const base2=_h2r(base, rot);
  const pat=[(base2[0]*0.5+((an>>16)&255)*0.3)|0,(base2[1]*0.5+((an>>8)&255)*0.3)|0,(base2[2]*0.5+(an&255)*0.3)|0];
  /* the iridescent pair — far hue swings for the high finishes, so a
     Mythic actually LOOKS like oil-on-water, not a rumor of it */
  const irid=_h2r(base, rot>0?130:-130), irid2=_h2r(base, rot>0?-110:110);
  const tier=S.tier|0;
  const R={bulk:clamp(0.62+sizeM*0.30+(S.vit/400)*0.30,0.6,1.7),
    len:0.82+((g.size||2)%5)*0.09+((g.body||0)%4)*0.05,   /* body length dial */
    neck:0.3+((g.head||0)%5)*0.13,
    horn:horn,
    tail:0.35+((g.tail||0)%7)*0.09,
    leg:(plan===2||plan===12)?0.9:0.3+((g.limbs||0)%6)*0.09,
    stripes:patTxt==='striped'||patTxt==='banded'?0.75:0,
    mottle:/mottled|spotted|marbled/.test(patTxt)?0.95:0.62,
    aqua:/swim|filter|jet|brine-crawl/.test(locoOf(g))||/ocean|shallows|reef|vent|trench|lakeshore|sea/.test(habOf(g)),
    airb:/glider|floater|drifter|soarer|storm-rider|winged/.test(locoOf(g))||/cloud deck|updraft/.test(habOf(g)),
    base:base, base2:base2, pat:pat, irid:irid, irid2:irid2,
    dark:[base[0]*0.42|0,base[1]*0.42|0,base[2]*0.42|0],
    finish:tier>=8?3:(tier>=6?2:(tier>=4?1:0)),
    rim:g.lumin?col:'rgba(255,220,170,1)', eye:col,
    plan:plan, glow:!!g.lumin, apex:!!g.apex, par:!!g.par,
    tier:tier,
    heat:(g.habitat||0)%FA_HABITAT.length};
  /* v1.6 Pass 7 PROCEDURAL PHENOTYPE RESOLVER (Nick-authorized re-pin): resolve the
     rich descriptor genes into drawable phenotype so the portrait expresses the genome
     (heads/eyes/tails/limbs/skin were text-only). Attached to R for ALL genomes; the
     Earth rigs ignore these (they own their anatomy), procedural bodies read them. */
  R.headK=(g.head||0)%FA_HEAD.length;                 // 0 blunt..9 frilled (see FA_HEAD)
  R.eyeN=FA_EYES[(g.eyes||0)%FA_EYES.length];          // 0/1/2/4/6/8 — eyeless head overrides to 0
  R.tailK=(g.tail||0)%FA_TAIL.length;                  // 0 none..6 stinger (see FA_TAIL)
  R.limbN=FA_LIMBS[(g.limbs||0)%FA_LIMBS.length];      // total walking limbs (0/2/3/4/6/8)
  R.skinK=(g.skin||0)%FA_SKIN.length;                  // scaled/furred/chitinous/…/crystalline
  R.dietK=(g.diet||0)%FA_DIET.length;
  /* v1.6 EARTH BESTIARY: a named cradle creature reads as itself (art-only) */
  if(g._earthName){ R._earthName=g._earthName;   /* v1.6: mark Earth genes so hdBeastBare never routes them to a procedural family (fingerprint-safe: the probe only passes procedural genomes) */
    try{ const rec=_earthArt(g._earthName); if(rec){
    /* the recipe fully owns flight & water — a wolf never sprouts wings from a
       stray random loco gene (Nick's toad-with-wings catch) */
    R.airb=!!rec.airb; R.aqua=!!rec.aqua;
    Object.assign(R, rec);
    R.dark=[R.base[0]*0.42|0, R.base[1]*0.42|0, R.base[2]*0.42|0];
    if(!('pat' in rec)) R.pat=[R.base[0]*0.5|0,R.base[1]*0.5|0,R.base[2]*0.5|0];   /* recipes may set a hard pattern tone (tiger/zebra) */
    /* catalog polish 2026-07-24: the RECIPE owns the pelt. Only species whose
       recipe declares stripes/rosettes wear them (tiger/zebra/leopard…);
       stray striped/mottled PATTERN GENES are muted — a real orangutan is
       not striped. Procedural aliens keep their gene-driven hides. */
    R._recPelt=('stripes' in rec)||('mottle' in rec);
    if(!('stripes' in rec)) R.stripes=0;
    if(!('mottle' in rec)) R.mottle=Math.min(R.mottle||0.62, 0.4);
  } }catch(_){ } }
  else if(g._earthBlend){   /* v1.6 BREED BLEND: Earth STRUCTURE (rig+anatomy) but keep the child's ALIEN palette */
    try{ const rec=_earthArt(g._earthBlend); if(rec){
      const kB=R.base,kB2=R.base2,kP=R.pat,kI=R.irid,kI2=R.irid2,kE=R.eye,kR=R.rim,kG=R.glow;
      R.airb=!!rec.airb; R.aqua=!!rec.aqua; Object.assign(R, rec);
      R.base=kB; R.base2=kB2; R.pat=kP; R.irid=kI; R.irid2=kI2; R.eye=kE; R.rim=kR; R.glow=kG;   /* restore procedural colour/finish */
      R.dark=[R.base[0]*0.42|0,R.base[1]*0.42|0,R.base[2]*0.42|0];
      R._recPelt=('stripes' in rec)||('mottle' in rec);   /* a tiger-child keeps tiger stripes — in ITS OWN colors (breeding cohesion) */
      R._earthBlend=g._earthBlend; delete R._earthName;   /* NOT a pure Earth gene — no name lock */
      /* v1.6 Pass 8 LINEAGE DRIFT: Earth-anchor strength (organic — set at breeding by the
         mate's alienness, accumulating over generations). hdBeastBare grafts alien phenotype
         onto the Earth rig in proportion to (1-anchor). */
      R._anchor=(g._anchorVal!=null)?g._anchorVal:0.85;
      R._gen=g.gen||1;
    } }catch(_){ } }
  return R;
}
function _sanitizeSavedGenome(g){
  if(!g || typeof g!=='object') return null;
  if(!Number.isFinite(+g.seed)) return null;
  if(g.kingdom!=null && !['fauna','flora','fungi','microbe'].includes(g.kingdom)) return null;
  const cl=(v,lo,hi)=>{ const x=+v; return Number.isFinite(x)?Math.max(lo,Math.min(hi,x)):lo; };
  if('brood' in g) g.brood=cl(g.brood,0,200);   /* expanded audit §4: 200 is the effective battle cap — 9999 bought UI lies + save bloat */
  if('fed' in g) g.fed=cl(g.fed,0,200);
  if('xp' in g) g.xp=cl(g.xp,0,486);   /* CF-CR-003: level 9 is xp 486 (levelOf √(xp/6) caps at 9) — 1e6 bought nothing but save bloat */
  if('hurt' in g) g.hurt=cl(g.hurt,0,1);
  /* ROUND 9 CF1806-01 — THE SIZE CLAMP WAS REMOVED HERE, and must not come back.
     v1.8.6 shipped TWO fixes for one problem: battleStats now WRAPS size (% FA_SIZE.length,
     the same value the card prints) and this line CLAMPED it to 0..5 on load. The wrap
     alone is correct and sufficient; the clamp was actively harmful.
     WHY IT WAS HARMFUL: crossGenome's mutation list includes `size` and never wraps it, and
     evolveGenome mutates again on every breed, so HONEST saves carry size > 5 — measured on
     this build's own functions at 12.4% of lineages by generation 5 and 14.6% by generation 20
     (max seen 11). This clamp rewrote every one of them, permanently, on the next load:
       stored 6 -> card "tiny",  vit 50   becomes  card "titanic", vit 70
       stored 9 -> card "large", vit 62   becomes  card "titanic", vit 70
     Portrait scale, voice pitch (sizeF reads size % 6), the body-length dial and the
     "Size Classes" collection slot all move with it, and a share code exported before the
     reload no longer matches one exported after.
     WHY IT BOUGHT NOTHING: its own justification was "a hand-edited size:1e6 bought
     +4,000,000 vitality". The wrap already closes that — measured, size:1e6 yields vit 66
     against a LEGITIMATE maximum of 70 at size 5. normGenome's Math.abs((+o.size)|0) feeds
     the same wrapped reader, so the share-code path is closed by the wrap too.
     ⚠ Note for anyone tempted to "finish" this by wrapping size at load instead: don't.
     Wrapping on load would REWRITE HONEST DATA — the same mistake as the clamp, just less
     visibly. crossGenome legitimately produces size>5 (12.4% of lineages by gen 5); the
     stored value is the creature's real gene and the save is not the place to edit it. The
     drift itself is a BALANCE question, and crossGenome is a fingerprint probe.
     ⚠ CORRECTED 2026-07-31 (port Phase 0, ROADMAP 9f). This note used to justify the rule
     with "speciesGrade/rarityRoll/sapience read `g.size` RAW (>=3, >=4, >=5), so a stored 6
     is NOT equivalent to a stored 0". THAT IS FALSE SINCE v1.8.9 — our own _szOf fix routed
     speciesGrade (~2143) and sapienceTier (~2036) through the wrap, and rarityRoll never
     read size at all. The RULE is unchanged and now rests on the reason above; what changed
     is that wrapping at load would today buy NOTHING, because every reader already wraps.
     The lesson is the point: a fix can invalidate the stated reason for a decision made
     elsewhere, and nobody re-reads the note. When a change touches a value, grep every
     reader AND every comment that reasons about it (CLAUDE.md rule 7).
     See port/DECISIONS.md §5, ROADMAP 9f, and SAVE_SYSTEM.md. */
  /* ROUND 7 CF1802-15: mirror normGenome — battlefield modifiers never survive
     a save any more than they survive a share code, and the guardian bands are
     honoured only where they are genuine. */
  delete g._mult; delete g._wf;
  if(g.apex!=null){ const a=(+g.apex)|0; if(a>=12 && a<=TIER_MAX) g.apex=a; else delete g.apex; }
  if(g.par!=null){ const a=(+g.par)|0; if(a>=8 && a<=11) g.par=a; else delete g.par; }
  return g;
}
export { cleanName, _r2, encodeWhere, decodeWhere, winEstimate, STAT_KEYS, floraStat, BIOME_SETS, biomeFor, hdGenesFor, _sanitizeSavedGenome };
