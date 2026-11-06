// Source-specific positive-paint contour additions, after all existing non-remainder owners.
export const headRegions={
 hummingbird:[
 {id:'reviewed-crown',joint:'head',layer:'near',polygonPx:[[660,362],[777,362],[777,422],[660,422]],reason:'Dorsal crown above the eye: original head polygon missed source plumage.'},
 {id:'reviewed-nape',joint:'neck1',layer:'near',polygonPx:[[660,422],[777,422],[777,475],[660,475]],reason:'Lower nape below reviewed crown, continuous with upper neck. Existing head/wing paint retains priority.'},
 {id:'reviewed-bill',joint:'beak',layer:'near',polygonPx:[[986,387],[1038,387],[1038,397],[986,397]],reason:'Thin upper bill rim beyond old beak polygon.'}
 ],
 'wild-pony':[
 {id:'reviewed-cheek',joint:'head',layer:'near',polygonPx:[[864,517],[919,517],[919,582],[864,582]],reason:'Visible rear lower cheek between original head, jaw and neck polygons. Jaw ownership has prior priority.'}
 ]
};
