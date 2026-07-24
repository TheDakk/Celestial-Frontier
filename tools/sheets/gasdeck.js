// Gas-deck aerial-life audit: cloud gardens + gas-bladder colonies + REAL air
// creatures (genome silhouettes) + aeroplankton, so a populated gas giant reads
// as a living cloud biome (Nick: "I don't see any creatures in the gas ones").
module.exports = {
  width: 1460, height: 900,
  lift: ['mulberry32', 'hashInt', 'makeNoise',
         'SP_COLOR', 'SP_HEX', 'FA_HEAD', 'FA_TRAIT', 'FA_PATTERN', 'FA_SIZE_M', 'FA_HABITAT', 'FA_EYES', 'FA_TAIL', 'FA_LIMBS', 'FA_SKIN', 'FA_DIET',
         'FA_LOCO', 'EX_LOCO', 'EX_HABITAT', 'habOf', 'locoOf'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true; window.HD_PORTRAITS=true;
    window.battleStats=(x)=>({ab:{col:'#8fd6ff'}, vit:150, tier:0});
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,900);
    g.font='12px monospace';
    // build a couple of air-fauna genomes (winged / gliding morphology) + an aerial flora
    const airGene=(i)=>hdGenesFor({seed:70000+i*613, kingdom:'fauna', color:i%17, accent:(i*3)%17,
      body:(i%2?7:14), loco:0, trait:(i*5)%25, size:(i%3)+1, head:i%10, limbs:i%4, skin:i%9,
      tail:i%7, pattern:(i*3)%8, eyes:i%6, behavior:i%12, habitat:1});
    const aerFlora=(i)=>hdGenesFor({seed:80000+i*211, kingdom:'flora', form:(i%16), af:1, color:i%17});
    const cases=[
      ['amber day · gardens + 2 fliers', {seed:9201,hue:30,spot:true,spotHue:55,ring:true,moons:2,tod:'day',aurora:true,air:1,airGenes:[airGene(1),airGene(2)],aerFlora:[aerFlora(1)]}],
      ['cyan night · flier + colonies',  {seed:9202,hue:200,spot:false,ring:false,moons:4,tod:'night',aurora:true,air:2,airGenes:[airGene(3)],aerFlora:[aerFlora(2)]}],
      ['pastel ammonia · garden swarm',  {seed:9203,hue:280,spot:true,spotHue:250,ring:false,moons:3,tod:'day',air:0,airGenes:[],aerFlora:[aerFlora(3)],wb:'ammonia'}],
      ['ember giant night · 2 fliers',   {seed:9204,hue:30,spot:false,ring:true,moons:1,tod:'night',air:1,airGenes:[airGene(4),airGene(5)],aerFlora:[],wb:'hotglow'}],
    ];
    cases.forEach((c,i)=>{
      const x=16+(i%2)*722, y=30+((i/2|0))*440;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-6);
      try{ g.drawImage(_hdDeckScene(c[1]), x, y, 706, 316); }
      catch(e){ g.fillStyle='#ff6a5a'; g.fillText(String(e).slice(0,80), x, y+20); }
    });
  }`,
};
