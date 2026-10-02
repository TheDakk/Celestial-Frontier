// Full-size source review: these rectangles enclose only the named source contour.
// Original priority owners remain before all supplemental regions.
export const headRegions={
 chough:[
 {id:'reviewed-nape',joint:'neck1',layer:'near',polygonPx:[[658,390],[758,390],[758,455],[658,455]],reason:'Dorsal neck feather contour between original head and wing ownership; only body-owned pixels transfer.'},
 {id:'reviewed-bill',joint:'beak',layer:'near',polygonPx:[[911,388],[992,388],[992,448],[911,448]],reason:'Visible upper curved red bill outside its transferred polygon; retain prior head/beak owners.'}
 ],
 crow:[
 {id:'reviewed-nape',joint:'neck1',layer:'near',polygonPx:[[660,420],[754,420],[754,477],[660,477]],reason:'Dorsal nape feathers connect head and neck, not torso.'},
 {id:'reviewed-bill',joint:'beak',layer:'near',polygonPx:[[885,403],[921,403],[921,417],[885,417]],reason:'Upper bill rim outside old beak polygon; preserve painted source.'}
 ],
 'snowy-owl':[
 {id:'reviewed-nape',joint:'neck1',layer:'near',polygonPx:[[637,381],[776,381],[776,472],[637,472]],reason:'Upper dorsal nape plumage; existing head and wing polygons retain priority.'},
 {id:'reviewed-crown',joint:'head',layer:'near',polygonPx:[[875,333],[930,333],[930,391],[875,391]],reason:'Front crown above eye and facial disk, following head.'}
 ]
};
