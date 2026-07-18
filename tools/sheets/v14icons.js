// v1.4 proof sheet: the Fabricator's part/gear icons (every shape family)
// + the new asteroid rock sprites (belt + icy) that replaced the squares.
module.exports = {
  width: 1240, height: 760,
  lift: ['mulberry32', 'hashInt', '_rockSprites', '_rockSet',
         'ITEMS', 'ITEM_BY', '_partIcons', 'partIcon'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1240,760);
    g.fillStyle='#8892b8'; g.font='12px monospace';
    // rocks first: 8 belt + 8 icy variants at display scale
    g.fillText('belt rocks (was: fillRect squares)', 20, 22);
    _rockSet('rock').forEach((cv,i)=>{ g.drawImage(cv, 20+i*50, 32, 44, 44); });
    g.fillText('icy ring lumps', 480, 22);
    _rockSet('ice').forEach((cv,i)=>{ g.drawImage(cv, 480+i*50, 32, 44, 44); });
    // every fabricator icon, labeled, 96px
    let x=20, y=110;
    for(const it of ITEMS){
      const img=new Image();
      img.src=partIcon(it.id);
      // data URI decodes synchronously enough for headless shots after load;
      // draw on onload to be safe
      (function(ix,iy,item){
        img.onload=function(){ g.drawImage(img, ix, iy, 96, 96);
          g.fillStyle='#8892b8'; g.font='10px monospace';
          g.fillText(item.name.slice(0,16), ix, iy+108);
          g.fillText('T'+item.tier+' '+item.cat+(item.slot?' · '+item.slot:''), ix, iy+120);
        };
      })(x,y,it);
      x+=118; if(x>1240-118){ x=20; y+=140; }
    }
  }`,
};
