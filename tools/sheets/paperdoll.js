// v1.5 proof sheet: THE PAPERDOLL — the full-body explorer for the new
// character screen, beside the v1.4 bust (style continuity check) and a
// copy with every DOLL_ANCHORS socket marked (alignment check).
module.exports = {
  width: 1240, height: 700,
  lift: ['mulberry32', '_playerAvatarURL', 'playerAvatar',
         '_dollURL', 'paperdollAvatar', 'DOLL_ANCHORS'],
  draw: `function(g){
    g.fillStyle='#07080f'; g.fillRect(0,0,1240,700);
    g.fillStyle='#8892b8'; g.font='12px monospace';
    g.fillText('v1.4 bust (style anchor)', 20, 22);
    g.fillText('v1.5 paperdoll (full length)', 320, 22);
    g.fillText('socket anchors (finger targets)', 720, 22);
    const bust=new Image(); bust.src=playerAvatar();
    bust.onload=function(){ g.drawImage(bust, 20, 34, 240, 240); };
    const doll=new Image(); doll.src=paperdollAvatar();
    doll.onload=function(){
      const W=380, H=Math.round(W*600/360);
      g.drawImage(doll, 320, 34, W, H);
      // annotated copy: socket rings at anchor points
      g.drawImage(doll, 720, 34, W, H);
      g.font='11px monospace';
      for(const k in DOLL_ANCHORS){
        const a=DOLL_ANCHORS[k];
        const x=720+a[0]*W, y=34+a[1]*H;
        g.strokeStyle='rgba(127,208,255,0.9)'; g.lineWidth=2;
        g.beginPath(); g.arc(x,y,24,0,7); g.stroke();
        g.fillStyle='#7fd0ff'; g.fillText(k, x+28, y+4);
      }
    };
  }`,
};
