export function assertPainterCaptureRgba(primary:ArrayLike<number>,captured:ArrayLike<number>):0{
 if(primary.length!==captured.length||primary.length%4)throw Error('Painter capture RGBA dimensions');let changed=0;for(let i=0;i<primary.length;i++)if(primary[i]!==captured[i])changed++;if(changed)throw Error('Painter capture changed RGBA channels: '+changed);return 0;
}
