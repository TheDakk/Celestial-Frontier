// Flora-in-vista audit: does the vista draw the world's ACTUAL flora species
// (cactus / fern / tree / flower) instead of a generic canopy? Passes real
// flora genes as floraGenes to hdVista, across biomes.
module.exports = {
  width: 1460, height: 900,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#7fe6a0'}, vit:150, tier:0});
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,900);
    g.font='12px monospace';
    // flora genomes forced to specific FORMs (FAM index): 5=cactus, 0/16=fern/palm, 1=tree, 13=flower
    const flora=(form,i)=>hdGenesFor({seed:90000+i*337, kingdom:'flora', form:form, color:i%17, accent:(i*3)%17, trait:(i*2)%25, body:i%5, pattern:i%4});
    const cases=[
      ['desert · its CACTI',      {seed:9401,era:'none',pal:'day',wb:'dunesea',water:'none',moons:1,floraGenes:[flora(5,1),flora(5,2)]}],
      ['jungle · its BROADLEAVES',{seed:9402,era:'none',pal:'day',wb:'jungle',flora:true,moons:1,floraGenes:[flora(1,3),flora(16,4)]}],
      ['meadow · FERNS + FLOWERS',{seed:9403,era:'none',pal:'day',wb:'temperate',flora:true,moons:0,floraGenes:[flora(0,5),flora(13,6)]}],
      ['savanna · generic (none)',{seed:9404,era:'none',pal:'day',wb:'savanna',flora:true,moons:1,floraGenes:null}],
    ];
    cases.forEach((c,i)=>{
      const x=16+(i%2)*722, y=30+((i/2|0))*440;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(hdVista(c[1]), x, y, 706, 316); }
      catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,80), x, y+20); }
    });
  }`,
};
