// EARTH LANDINGS audit (Nick): land on Earth 12 times — the landing-region roll
// must spread across Earth's real surface mix (mostly seas; forests, jungle,
// savanna, tundra, wetlands, salt pans on land), and every scene must carry
// BOTH its fauna and flora together. Also prints the rolled-biome histogram
// over 200 salts so the 70/30 weighting is verifiable, not vibes.
module.exports = {
  width: 1460, height: 1240,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf',
         'BIOME_SETS', 'biomeFor', 'biomeComposition', '_EARTH_LANDING', '_earthLandComp', '_earthLandingComp', 'biomeForLanding'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#7fe6a0'}, vit:150, tier:0});
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,1240);
    g.font='12px monospace';
    const P={type:'terran', seed:133, seaHue:210, landHue:115, iceAmt:0.5, moons:1};
    // histogram over 200 landing salts
    const hist={};
    for(let s=0;s<200;s++){ const b=biomeForLanding(P,'temperate',s); if(b) hist[b.k]=(hist[b.k]||0)+1; }
    const hs=Object.entries(hist).sort((a,b)=>b[1]-a[1]).map(e=>e[0]+' '+(e[1]/2).toFixed(1)+'%').join(' · ');
    g.fillStyle='#ffd96a'; g.fillText('Earth landing-roll histogram (200 rolls): '+hs, 16, 18);
    // 12 landings: render the rolled biome with Earth-style fauna+flora genes
    const fauna=(i)=>hdGenesFor({seed:60000+i*431, kingdom:'fauna', color:i%17, accent:(i*3)%17,
      body:0, loco:0, trait:i%25, size:(i%4)+1, head:i%10, limbs:i%4, skin:i%9, tail:i%7,
      pattern:i%8, eyes:i%6, behavior:i%12, habitat:0});
    const flora=(form,i)=>hdGenesFor({seed:61000+i*211, kingdom:'flora', form:form, color:2, accent:(i*5)%17, trait:i%25, body:i%5, pattern:i%4});
    for(let li=0; li<12; li++){
      const b=biomeForLanding(P,'temperate',li*13+3);
      const x=16+(li%3)*482, y=52+((li/3)|0)*292;
      const sea=['opensea','archipelago','stormsea','volcisle','milksea'].includes(b.k);
      g.fillStyle='#8892b8'; g.fillText('landing '+(li+1)+': '+b.k+(sea?' (sea)':' (land)'), x, y-6);
      try{
        const o={seed:133, era:'none', pal:'day', wb:b.k, flora:true, water:'liquid', moons:1,
          genes:sea?null:[fauna(li),fauna(li+5)], herd:sea?0:3, aqua:sea?2:0,
          floraGenes:sea?null:[flora([5,0,1,13,16][li%5],li),flora(1,li+3)],
          biome:sea?'island':undefined};
        g.drawImage(hdVista(o), x, y, 470, 210);
      }catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,70), x, y+20); }
    }
  }`,
};
