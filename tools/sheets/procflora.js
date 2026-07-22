// v1.6: the CURRENT procedural (non-Earth) flora — the plants you scavenge/eat
// for HP on alien worlds. Rendered through the same box-fit as the cards.
// (Shows the known weakness: procedural flora has no growth families yet, so it
//  all renders as the recursive tree, palette/shape-swapped.)
module.exports = {
  width: 1320, height: 900,
  lift: ['mulberry32', 'hashInt'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    g.fillStyle='#0b120c'; g.fillRect(0,0,1320,900);
    g.font='10px monospace';
    const hues=['rgba(46,109,58,0.9)','rgba(58,125,79,0.9)','rgba(90,138,58,0.9)','rgba(122,154,42,0.9)',
      'rgba(42,106,90,0.9)','rgba(106,74,122,0.9)','rgba(138,90,42,0.9)','rgba(58,90,138,0.9)',
      'rgba(150,120,60,0.9)','rgba(80,150,120,0.9)'];
    const COLS=10, ROWS=5, cw=132, ch=176;
    for(let i=0;i<COLS*ROWS;i++){
      const col=i%COLS, row=(i/COLS)|0, r=mulberry32((i*911+7)>>>0);
      const leaf=hues[i%hues.length];
      const lum=(i%6===0)?'rgba(150,220,180,0.9)':null;
      const FAM=['tree','conifer','palm','shrub','herb','flower','grass','cactus','fern','vine','seaweed','moss','trap','crop','tree','shrub'];
      const sp={trunk:(lum?'#2a2440':'#26301c'), leaf:leaf, accent:leaf, lum:lum,
        spread:0.7+r()*0.75, depth:4+(r()<0.5?1:0), lean:0.1+r()*0.55,
        form:FAM[i%FAM.length], fform:['daisy','disc','orchid','spike','lily'][i%5],
        cform:['spire','layered','bushy','dense','round'][i%5], tform:['broad','weep','baobab','acacia'][i%4],
        cob:(i%4===0)?1:0, rosette:(i%7===0)?1:0, fruit:(i%3===0)?1:0, flower:(i%4===0)?1:0,
        head:(i%5===0)?'cattail':undefined};
      const x=8+col*cw, y=12+row*ch;
      g.fillStyle=(i%2)?'#0e160e':'#111a10'; g.fillRect(x,y,cw-6,ch-8);
      try{ const pcv=_hdPlantBare((i*131+7)>>>0, sp);
        const T=150,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
        _fitPlant(tx2,pcv,T); g.drawImage(tc, x+(cw-6-T)/2, y+2); }
      catch(e){ g.fillStyle='#f66';g.fillText('ERR',x+6,y+70); }
      g.fillStyle='#7a9a6a'; g.fillText('proc flora '+i+(lum?' (lum)':''), x+4, y+ch-12);
    }
  }`,
};
