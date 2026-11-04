// Reviewed source-space additions, applied after every existing non-remainder region.
// The existing ownership has priority: only formerly body-owned paint may move.
// These are per-painting corrections, never a species-name authoring heuristic.
export const headRegions={
 '16-lark':[
  {id:'reviewed-nape',joint:'neck1',layer:'near',polygonPx:[[740,462],[791,462],[791,521],[740,521]],reason:'Connected dorsal nape feathers between the original head/upper-neck polygons and the far wing root. The source silhouette is continuous, but this patch was body-owned.'},
  {id:'reviewed-forehead',joint:'head',layer:'near',polygonPx:[[852,450],[871,450],[871,465],[852,465]],reason:'Small upper forehead/crown edge above the bill base; follows the head rather than the torso.'},
  {id:'reviewed-bill-edge',joint:'beak',layer:'near',polygonPx:[[885,499],[889,499],[889,502],[885,502]],reason:'Two source pixels at the lower bill edge border the beak owner.'},
 ],
 '18-hawk':[
  {id:'reviewed-nape',joint:'neck1',layer:'near',polygonPx:[[639,452],[735,452],[735,504],[639,504]],reason:'Dorsal nape/neck feather contour behind the head and above the folded far-wing root. Retain all prior wing ownership; only the formerly body-owned nape island moves.'},
  {id:'reviewed-forehead',joint:'head',layer:'near',polygonPx:[[838,422],[868,422],[868,452],[838,452]],reason:'Upper face and cere-root contour outside the old head polygon. Existing beak ownership remains exact.'},
  {id:'reviewed-tail-tip',joint:'tailFan',layer:'near',polygonPx:[[350,767],[419,767],[419,822],[350,822]],reason:'Visible distal tail feathers omitted by the transferred tail polygon. Their original paint is retained and assigned to the existing tail joint.'},
 ],
};
