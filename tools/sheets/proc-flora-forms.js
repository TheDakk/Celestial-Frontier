// PROCEDURAL CHARACTERISTICS — FLORA GROWTH FORMS. Each row isolates one
// growth form (or sub-variant) so we can see what the plant generator draws and
// where it can gain Earth-style structure (roots, harvest organs, form variety).
const ROWS = [
  { label:'tree',    sp:{form:'tree'} },
  { label:'conifer', sp:{form:'conifer'} },
  { label:'palm',    sp:{form:'palm'} },
  { label:'shrub',   sp:{form:'shrub'} },
  { label:'herb',    sp:{form:'herb'} },
  { label:'flower',  sp:{form:'flower', flower:1} },
  { label:'grass',   sp:{form:'grass'} },
  { label:'cactus',  sp:{form:'cactus'} },
  { label:'fern',    sp:{form:'fern'} },
  { label:'vine',    sp:{form:'vine'} },
  { label:'seaweed', sp:{form:'seaweed'} },
  { label:'moss',    sp:{form:'moss'} },
  { label:'trap (carnivore)', sp:{form:'trap'} },
  { label:'crop',    sp:{form:'crop'} },
  { label:'root/tuber (Earth harvest only — not procedurally selected; see b15-aqflora for aquatic/aerial)', sp:{form:'root'} },
  { label:'tree tforms (broad/weep/baobab/acacia)', vary:'tform', sp:{form:'tree'} },
  { label:'conifer cforms (spire/layered/bushy/dense/round/columnar)', vary:'cform', sp:{form:'conifer'} },
  { label:'flower fforms (daisy/disc/orchid/spike/lily)', vary:'fform', sp:{form:'flower', flower:1} },
  { label:'luminescent (any form)', lum:true, vary:'form' },
];
module.exports = {
  width: 8 * 160 + 320, height: ROWS.length * 176 + 30,
  lift: ['mulberry32', 'hashInt', 'SP_COLOR', 'SP_HEX'],
  liftBetween: ['let hdOn=true, _vistaPend=false;', 'function showVistaBox'],
  draw: `function(g){
    window.clamp=(v,a,b)=>v<a?a:v>b?b:v; window.tutDone=true;
    const ROWS=${JSON.stringify(ROWS)};
    const FAM=['tree','conifer','palm','shrub','herb','flower','grass','cactus','fern','vine','seaweed','moss','trap','crop','tree','shrub'];
    const TFORM=['broad','weep','baobab','acacia'], CFORM=['spire','layered','bushy','dense','round','columnar'], FFORM=['daisy','disc','orchid','spike','lily'];
    const W=${8 * 160 + 320}, H=${ROWS.length * 176 + 30};
    g.fillStyle='#0b120c'; g.fillRect(0,0,W,H);
    const hues=['rgba(46,109,58,0.9)','rgba(90,138,58,0.9)','rgba(122,154,42,0.9)','rgba(42,106,90,0.9)',
      'rgba(106,74,122,0.9)','rgba(138,90,42,0.9)','rgba(58,90,138,0.9)','rgba(150,120,60,0.9)'];
    const SAMPLES=8, cw=158, ch=172, LBL=310;
    ROWS.forEach(function(row,ri){
      const y=10+ri*176;
      g.fillStyle='#8aa87a'; g.font='12px monospace'; g.fillText(row.label, 8, y+ch/2);
      for(let s=0;s<SAMPLES;s++){
        const seed=(ri*911+s*131+7)>>>0, r=mulberry32(seed);
        const leaf=hues[(ri+s)%hues.length];
        const lum=row.lum?'rgba(150,220,180,0.9)':null;
        const sp=Object.assign({ trunk:(lum?'#2a2440':'#26301c'), leaf:leaf, accent:leaf, lum:lum,
          spread:0.7+r()*0.75, depth:4+(r()<0.5?1:0), lean:0.1+r()*0.55,
          fform:FFORM[s%5], cform:CFORM[s%6], tform:TFORM[s%4],
          cob:(s%4===0)?1:0, rosette:(s%7===0)?1:0, fruit:(s%3===0)?1:0 }, row.sp||{});
        if(row.vary==='tform') sp.tform=TFORM[s%4];
        if(row.vary==='cform') sp.cform=CFORM[s%6];
        if(row.vary==='fform') sp.fform=FFORM[s%5];
        if(row.vary==='form') sp.form=FAM[s%FAM.length];
        const x=LBL+s*cw;
        g.fillStyle=(s%2)?'#0e160e':'#111a10'; g.fillRect(x,y,cw-6,ch-6);
        try{ const pcv=_hdPlantBare((ri*137+s*29+7)>>>0, sp);
          const T=150,tc=document.createElement('canvas');tc.width=tc.height=T;const tx2=tc.getContext('2d');
          _fitPlant(tx2,pcv,T); g.drawImage(tc, x+(cw-6-T)/2, y+2);
        }catch(e){ g.fillStyle='#f66';g.font='9px monospace';g.fillText('ERR',x+6,y+40); }
      }
    });
  }`,
};
