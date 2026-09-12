/** Read-only image registration. This measures placement, not species identity or segmentation. */
export function boxIoU(a,b){
  const overlap=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  return overlap/(a.width*a.height+b.width*b.height-overlap);
}
export function registerOrganism(composite,painting,alpha,W,H,box,{search=24,stride=4}={}){
  if(composite.length!==W*H*4||painting.length!==composite.length||alpha.length!==W*H)throw Error('Registration image shape');
  const points=[];let sa=0,saa=0;
  for(let y=Math.max(0,Math.ceil(box.y));y<Math.min(H,box.y+box.height);y+=stride)for(let x=Math.max(0,Math.ceil(box.x));x<Math.min(W,box.x+box.width);x+=stride){
    const i=y*W+x;if(alpha[i]<240)continue;const p=i*4,a=.2126*composite[p]+.7152*composite[p+1]+.0722*composite[p+2];
    points.push({x,y,a});sa+=a;saa+=a*a;
  }
  const n=points.length;if(n<24||saa-sa*sa/n<25*n)throw Error('Insufficient visible texture for box registration');
  const cx=box.x+box.width/2,cy=box.y+box.height/2;let best={score:-2};
  for(const scale of [.9,.925,.95,.975,1,1.025,1.05,1.075,1.1])for(let dy=-search;dy<=search;dy+=2)for(let dx=-search;dx<=search;dx+=2){
    let sb=0,sbb=0,sab=0,valid=true;
    for(const {x,y,a}of points){const xx=Math.round(cx+(x-cx)*scale+dx),yy=Math.round(cy+(y-cy)*scale+dy);if(xx<0||xx>=W||yy<0||yy>=H){valid=false;break;}
      const p=(yy*W+xx)*4,b=.2126*painting[p]+.7152*painting[p+1]+.0722*painting[p+2];sb+=b;sbb+=b*b;sab+=a*b;}
    if(!valid||sbb-sb*sb/n<25*n)continue;
    const score=(sab-sa*sb/n)/Math.sqrt((saa-sa*sa/n)*(sbb-sb*sb/n));
    if(score>best.score)best={score,scale,dx,dy};
  }
  if(best.score<.55)throw Error('No reliable organism registration');
  const width=box.width*best.scale,height=box.height*best.scale,postBox={x:cx+best.dx-width/2,y:cy+best.dy-height/2,width,height};
  return {...best,samples:n,postBox,iou:boxIoU(box,postBox),method:'masked texture registration; not segmentation',speciesAccepted:false};
}
export function admitsBoxOverlap(row){return Number.isFinite(row.score)&&row.score>=.55&&Number.isFinite(row.iou)&&row.iou>=.9;}
