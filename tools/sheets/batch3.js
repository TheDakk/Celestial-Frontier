// Batch 3 proof sheet: the gas-giant cloud deck across families and hours.
module.exports = {
  width: 1460, height: 700,
  lift: ['mulberry32', '_hdDeckScene'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1460,700);
    const cases=[
      ['amber day · ring · great spot · auroras', {seed:9101,hue:30,spot:true,spotHue:55,ring:true,moons:3,tod:'day',aurora:true,air:0}],
      ['cyan night · 6 moons · drifters',          {seed:9102,hue:200,spot:false,ring:false,moons:6,tod:'night',aurora:true,air:2}],
      ['violet twilight · great spot',             {seed:9103,hue:310,spot:true,spotHue:285,ring:false,moons:1,tod:'twilight',aurora:false,air:0}],
      ['green day · ring',                         {seed:9104,hue:110,spot:false,ring:true,moons:2,tod:'day',aurora:true,air:1}],
    ];
    g.font='13px monospace';
    cases.forEach((c,i)=>{
      const x=20+(i%2)*720, y=30+((i/2)|0)*330;
      g.fillStyle='#8892b8'; g.fillText(c[0], x, y-8);
      g.drawImage(_hdDeckScene(c[1]), x, y, 700, 314);
    });
  }`,
};
