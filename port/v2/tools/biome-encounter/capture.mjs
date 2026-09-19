/** Three complete six-second turns, independently checked against encoded media. */
export function inspectEncounterCapture(media,live){
 const duration=Number(media.format?.duration),videos=media.streams?.filter(s=>s.codec_type==='video')??[],video=videos[0],frames=Number(video?.nb_read_frames);
 if(!Number.isFinite(duration)||duration<18||duration>18.75)throw Error('Encounter capture: incomplete eighteen-second timeline or excess padding');
 if(videos.length!==1||!Number.isInteger(frames)||frames<1026||video.width!==1600||video.height!==900)throw Error('Encounter capture: encoded frame or canvas budget');
 if(!Number.isFinite(live.fps)||live.fps<57||live.frames<1026||!Number.isFinite(live.wholeFrameP95Ms)||live.wholeFrameP95Ms>=16.67||Object.keys(live.creatureP95Ms??{}).length!==3||Object.values(live.creatureP95Ms).some(n=>!Number.isFinite(n)||n>=2))throw Error('Encounter capture: live pacing or creature update budget');
 return {duration,frames,width:video.width,height:video.height,minimumFrames:1026,targetFps:60,status:'PASS'};
}
