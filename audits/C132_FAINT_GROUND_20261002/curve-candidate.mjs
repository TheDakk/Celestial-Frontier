/** Offline experiment only. The runtime does not import this author. */
export function scaleWholeCurves(timeline, joints, gain, hash) {
  if (!(gain >= 0 && gain <= 1) || !Number.isFinite(gain)) throw Error('Invalid curve gain');
  if (gain === 1) return timeline;
  const {hash: _old, ...body} = timeline, selected = new Set(joints);
  const tracks = Object.fromEntries(Object.entries(body.tracks).map(([joint, keys]) =>
    [joint, selected.has(joint) ? keys.map(key => ({...key, value: key.value * gain})) : keys]));
  const secondary = body.secondary.map(track => selected.has(track.joint)
    ? {...track, keys: track.keys.map(key => ({...key, value: key.value * gain}))} : track);
  const result = {...body, tracks, secondary};
  return {...result, hash: hash(JSON.stringify(result))};
}

/** Fixed gain for the complete curves; never a per-frame clamp or ground change.
 * `fits` owns the actual source geometry and complete sampled publication path.
 * Binary search finds a candidate, not a mathematical continuous-time guarantee.
 * Dense independent verification is mandatory before even an audit PASS. */
export function authorCurveCandidate(timeline, joints, fits, hash, steps = 12) {
  if (fits(timeline)) return {timeline, gain: 1, changed: false};
  if (!fits(scaleWholeCurves(timeline, joints, 0, hash))) {
    return {timeline, gain: null, changed: false, refusal: 'No safe rest-of-head envelope'};
  }
  let low = 0, high = 1;
  for (let i = 0; i < steps; i++) {
    const middle = (low + high) / 2;
    if (fits(scaleWholeCurves(timeline, joints, middle, hash))) low = middle; else high = middle;
  }
  if (!(low > 0)) return {timeline, gain: null, changed: false, refusal: 'No nonzero head excursion'};
  const candidate = scaleWholeCurves(timeline, joints, low, hash);
  if (!fits(candidate)) throw Error('Candidate verification failed');
  return {timeline: candidate, gain: low, changed: true};
}
