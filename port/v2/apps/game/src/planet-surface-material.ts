/**
 * Opt-in Earth material proof over the unchanged canonical unlit atlas.
 *
 * The caller supplies normalized RGB, canonical (u, latitude), the unit visible
 * sphere normal (x right / y down / z toward viewer), and the existing canonical
 * diffuse light. The function returns FINAL LIT RGB; do not multiply by light
 * again. The caller retains its existing disk discard, edge alpha and vColor.
 * Uses ES100 arithmetic only; no fragment derivatives or extensions required.
 *
 * Three continuous value-noise octaves (12 scalar hash evaluations) return their
 * analytic coordinate gradients from the same hashes. No texture reads, vertex
 * displacement, time, world RNG or storage. Grain/relief follow canonical
 * coordinates; illumination stays in view space. Fine detail fades at poles and
 * the limb; this is not screen-footprint filtering or a measured terrain model.
 *
 * Masks are perceptual, NOT terrain/biome classifications. The canonical Earth
 * producer uses blue open water/shallows, green/tan/grey land and pale polar ice
 * (PlanetGen.surfaceColor's temperate terran branch). Blue-channel surplus gives
 * a soft water estimate; pale near-neutral paint suppresses both material masks.
 * Mixed coast pixels get weak treatment. No mask changes an atlas texel, coast,
 * classification, palette owner or silhouette. This does not establish painted
 * reference quality, true elevation/roughness data or physical-device admission.
 */
export const EARTH_SURFACE_MATERIAL_GLSL_V1 = `
float cfEarthMaterialHashV1(vec2 cell) {
  vec3 h = fract(vec3(cell.x, cell.y, cell.x) * 0.1031);
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}

// Value, d(value)/d(coordinate.x), d(value)/d(coordinate.y).
vec3 cfEarthMaterialNoiseV1(vec2 coordinate) {
  vec2 cell = floor(coordinate);
  vec2 local = fract(coordinate);
  vec2 blend = local * local * (3.0 - 2.0 * local);
  vec2 blendGradient = 6.0 * local * (1.0 - local);
  float a = cfEarthMaterialHashV1(cell);
  float b = cfEarthMaterialHashV1(cell + vec2(1.0, 0.0));
  float c = cfEarthMaterialHashV1(cell + vec2(0.0, 1.0));
  float d = cfEarthMaterialHashV1(cell + vec2(1.0, 1.0));
  float lower = mix(a, b, blend.x);
  float upper = mix(c, d, blend.x);
  return vec3(mix(lower, upper, blend.y),
    mix(b - a, d - c, blend.y) * blendGradient.x,
    (upper - lower) * blendGradient.y);
}

vec3 cfEarthSurfaceMaterialV1(vec3 albedo, float longitude, float latitude,
  vec3 normal, float light) {
  vec2 coordinate = vec2(longitude, latitude) * 10.0;
  vec3 octave0 = cfEarthMaterialNoiseV1(coordinate);
  vec3 octave1 = cfEarthMaterialNoiseV1(coordinate * 2.0 + vec2(7.3, -4.1));
  vec3 octave2 = cfEarthMaterialNoiseV1(coordinate * 4.0 + vec2(-11.7, 6.9));
  float grain = 0.57 * octave0.x + 0.29 * octave1.x + 0.14 * octave2.x - 0.5;
  // Chain rule converts octave-local gradients back to canonical (u, latitude).
  vec2 canonicalGradient = 0.57 * 10.0 * octave0.yz
    + 0.29 * 20.0 * octave1.yz + 0.14 * 40.0 * octave2.yz;

  float minimumChannel = min(albedo.r, min(albedo.g, albedo.b));
  float maximumChannel = max(albedo.r, max(albedo.g, albedo.b));
  float paleIce = smoothstep(0.58, 0.84, minimumChannel)
    * (1.0 - smoothstep(0.14, 0.27, maximumChannel - minimumChannel));
  float blueSurplus = albedo.b - max(albedo.r, albedo.g);
  float water = smoothstep(0.055, 0.13, blueSurplus) * (1.0 - paleIce);
  float land = (1.0 - smoothstep(0.02, 0.08, blueSurplus)) * (1.0 - paleIce);

  // u = 1.4 * (atan(normal.x, normal.z) - angle), latitude = normal.y.
  // Map their analytic gradients into the unit sphere's tangent plane. The
  // polar denominator is bounded before detail fades to zero at either pole.
  float polarRadiusSquared = max(0.0, 1.0 - normal.y * normal.y);
  vec3 longitudeTangent = 1.4 * vec3(normal.z, 0.0, -normal.x)
    / max(polarRadiusSquared, 0.0025);
  vec3 latitudeTangent = vec3(0.0, 1.0, 0.0) - normal.y * normal;
  vec3 gradient = canonicalGradient.x * longitudeTangent
    + canonicalGradient.y * latitudeTangent;
  gradient = clamp(gradient * 0.002, vec3(-0.045), vec3(0.045));
  float detail = smoothstep(0.025, 0.14, polarRadiusSquared)
    * smoothstep(0.08, 0.22, normal.z);
  vec3 reliefNormal = normalize(normal - gradient * land * detail);

  // Use the existing, deliberately unnormalized canonical light vector.
  const vec3 lightDirection = vec3(-0.42, -0.30, 0.86);
  float relief = clamp(0.88 * (max(dot(reliefNormal, lightDirection), 0.0)
    - max(dot(normal, lightDirection), 0.0)), -0.04, 0.04);
  // Grain changes RGB proportionally: at most 2.25% on land / 0.6% on water.
  float albedoFactor = 1.0 + grain * detail * (0.045 * land + 0.012 * water);
  vec3 color = albedo * albedoFactor * max(0.0, light + relief);

  // Roughness only modulates a small, fixed-light-side water sheen. It is not
  // an authoritative ocean or physically calibrated roughness map.
  float roughness = 0.30 + grain * detail * 0.12;
  vec3 halfVector = normalize(normalize(lightDirection) + vec3(0.0, 0.0, 1.0));
  float litSide = smoothstep(0.24, 0.55, light);
  float sheen = water * litSide * 0.024
    * pow(max(dot(normal, halfVector), 0.0), mix(88.0, 48.0, roughness));
  color += vec3(0.78, 0.86, 1.0) * sheen;

  // Thin INNER rim only; the caller's existing alpha owns the exact silhouette.
  float atmosphere = (1.0 - smoothstep(0.03, 0.22, normal.z)) * litSide * 0.022;
  color += vec3(0.46, 0.66, 0.92) * atmosphere;
  return clamp(color, vec3(0.0), vec3(1.0));
}
`;
