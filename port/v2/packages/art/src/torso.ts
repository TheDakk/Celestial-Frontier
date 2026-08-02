/* torso.ts — THE BODY AS A SOLID, arc stage 3 wave 4.

   ★ WHY THIS EXISTS. Wave 4's brief was two things Nick named:

     "there's a line between their body, almost like it looks like the legs
      are hooked in"
     "think of it like a skin, not like you're painting on top of the animal"

   Both are the same defect wearing two coats. The quadruped torso was a
   FLAT SHAPE: a hand-written back line, a hand-written belly line, and a
   bezier joining them. A flat shape has no inside. Nothing drawn on it can
   know where the surface turns away from the light, nothing drawn beside it
   can know how deep the body is at that point, and a limb can only ever be
   BUTTED against its outline — which is the line Nick sees.

   So the torso is now a SOLID: a generalized cylinder — a spine curve with
   a radius that varies along it. Everything else falls out of that one
   change:

   · THE SILHOUETTE is the true envelope of the swept circle, so it is
     smooth by construction. There is no closing seam to cusp (D-ART-84),
     no orphan subpath to leave a chord (D-ART-87), and no straight facet
     anywhere — the flat slab back and the machined rear are gone because
     nothing draws a line any more.
   · THE LIMBS emerge from the radius profile. A shoulder and a haunch are
     BULGES IN THE BODY, so a leg leaves a mass of muscle that is literally
     the same surface as the trunk.
   · THE SKIN gets a coordinate system. Every point on the body has a (u
     along the spine, phi around the girth), a real surface normal, and
     therefore a foreshortening and a shading value. A mark placed in that
     space wraps the body instead of floating on it — see skin.ts.

   The parameterisation:
     u    0 at the tail root … 1 at the base of the neck
     phi  -PI/2 ventral (belly) … 0 the near flank facing the viewer … +PI/2 dorsal (spine)

   ⚠ D-ART-83. The SHAPE LANGUAGE here is shared, because every mammal does
   have a ribcage and a haunch. The VALUES are per species and come from
   that species' own reference row. A shared vocabulary is not a shared
   body: what made 127 animals identical was clamping their numbers, not
   giving them the same anatomy. */

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** the engine's light, matching every bodyGrad in the codebase: upper-left,
    and slightly toward the viewer so a round body has a terminator on it */
const LX = -0.42, LY = -0.52, LZ = 0.745;

export interface TubeSpec {
  /** axis point at u */
  P: (u: number) => [number, number];
  /** cross-section radius at u */
  R: (u: number) => number;
}

export interface Frame {
  x: number; y: number;          /** axis point */
  tx: number; ty: number;        /** unit tangent, pointing forward */
  nx: number; ny: number;        /** unit normal, pointing dorsal (up) */
  r: number;                     /** radius here */
  k: number;                     /** dR/ds — how fast the body is tapering */
}

export class Tube {
  constructor(private spec: TubeSpec) {}

  frame(u: number): Frame {
    const h = 1e-3;
    const a = this.spec.P(Math.max(0, u - h)), b = this.spec.P(Math.min(1, u + h));
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const sp = Math.hypot(dx, dy) || 1e-6;
    dx /= sp; dy /= sp;
    const ra = this.spec.R(Math.max(0, u - h)), rb = this.spec.R(Math.min(1, u + h));
    const du = Math.min(1, u + h) - Math.max(0, u - h);
    /* dR/ds — the taper rate in ARC LENGTH, which is what the envelope needs */
    const dRds = ((rb - ra) / Math.max(1e-6, du)) / (sp / Math.max(1e-6, du));
    const p = this.spec.P(u);
    return { x: p[0], y: p[1], tx: dx, ty: dy, nx: dy, ny: -dx, r: this.spec.R(u),
      k: Math.max(-0.985, Math.min(0.985, dRds)) };
  }

  /** THE ENVELOPE. Where the swept circle actually touches the silhouette.
      Not P ± R·n: as the body tapers the contact point slides around the
      circle, which is exactly what makes a real tapering limb or trunk read
      as a solid instead of a ribbon. side +1 dorsal, -1 ventral. */
  envelope(u: number, side: 1 | -1): [number, number] {
    const f = this.frame(u);
    const s = Math.sqrt(Math.max(0, 1 - f.k * f.k));
    const ux = -f.k * f.tx + side * s * f.nx;
    const uy = -f.k * f.ty + side * s * f.ny;
    return [f.x + ux * f.r, f.y + uy * f.r];
  }

  /** a point on the visible surface */
  pt(u: number, phi: number): [number, number] {
    const f = this.frame(u);
    return [f.x + f.nx * f.r * Math.sin(phi), f.y + f.ny * f.r * Math.sin(phi)];
  }

  /** how much the surface at (u,phi) faces the viewer: 1 dead-on, 0 at the rim.
      This one number drives BOTH foreshortening and how much a mark shows. */
  facing(u: number, phi: number): number {
    const f = this.frame(u);
    return Math.sqrt(Math.max(0, 1 - f.k * f.k)) * Math.max(0, Math.cos(phi));
  }

  /** lambert at (u,phi) against the engine light — 0 full shadow, 1 full light */
  light(u: number, phi: number): number {
    const f = this.frame(u);
    const s = Math.sqrt(Math.max(0, 1 - f.k * f.k));
    /* the surface normal in 3D: an axial part from the taper, and the
       cross-section part swinging from ventral through the viewer to dorsal */
    const nx = -f.k * f.tx + s * f.nx * Math.sin(phi);
    const ny = -f.k * f.ty + s * f.ny * Math.sin(phi);
    const nz = s * Math.cos(phi);
    return Math.max(0, Math.min(1, (nx * LX + ny * LY + nz * LZ) * 0.5 + 0.5));
  }

  /** the closed silhouette: dorsal line forward, round the nose, ventral line
      back, round the tail. Smooth by construction — no seam anywhere. */
  outline(n = 72): Array<[number, number]> {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) pts.push(this.envelope(i / n, 1));
    pts.push(...this.cap(1, 1, -1));
    for (let i = n; i >= 0; i--) pts.push(this.envelope(i / n, -1));
    pts.push(...this.cap(0, -1, 1));
    return pts;
  }

  /** the end of the body is the terminal circle, walked round the outside
      between the two envelope contact points — so a rump is a dome, never a
      cut. `from`/`to` are the dorsal/ventral sides being joined. */
  private cap(u: number, from: 1 | -1, to: 1 | -1): Array<[number, number]> {
    const f = this.frame(u);
    const ang = (side: 1 | -1): number => {
      const s = Math.sqrt(Math.max(0, 1 - f.k * f.k));
      return Math.atan2(-f.k * f.ty + side * s * f.ny, -f.k * f.tx + side * s * f.nx);
    };
    let a0 = ang(from), a1 = ang(to);
    /* walk the short way that goes AROUND the end (away from the body) */
    const outward = Math.atan2(f.ty * (u > 0.5 ? 1 : -1), f.tx * (u > 0.5 ? 1 : -1));
    let d = a1 - a0;
    while (d <= -Math.PI) d += TAU;
    while (d > Math.PI) d -= TAU;
    const mid = a0 + d / 2;
    let away = mid - outward;
    while (away <= -Math.PI) away += TAU;
    while (away > Math.PI) away -= TAU;
    if (Math.abs(away) > Math.PI / 2) d = d > 0 ? d - TAU : d + TAU;
    const out: Array<[number, number]> = [];
    const N = 14;
    for (let i = 1; i < N; i++) {
      const a = a0 + (d * i) / N;
      out.push([f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r]);
    }
    return out;
  }

  /** lay the silhouette into the current path as a smooth closed curve */
  trace(c: Ctx, n = 72): void {
    const pts = this.outline(n);
    const m = pts.length;
    const mid = (i: number, j: number): [number, number] =>
      [(pts[i]![0] + pts[j]![0]) / 2, (pts[i]![1] + pts[j]![1]) / 2];
    const s = mid(m - 1, 0);
    c.moveTo(s[0], s[1]);
    for (let i = 0; i < m; i++) {
      const nxt = mid(i, (i + 1) % m);
      c.quadraticCurveTo(pts[i]![0], pts[i]![1], nxt[0], nxt[1]);
    }
    c.closePath();
  }

  /** put the canvas into SKIN SPACE at (u,phi): origin on the surface, x
      running along the spine, y running around the girth, and both axes
      scaled by how far the surface has turned away. Draw a circle inside
      this and it comes out as an ellipse lying on the body. */
  withMark(c: Ctx, u: number, phi: number, cb: (c: Ctx) => void): void {
    const f = this.frame(u);
    const [x, y] = this.pt(u, phi);
    const axial = Math.sqrt(Math.max(0, 1 - f.k * f.k));
    const girth = Math.abs(Math.cos(phi));
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(f.ty, f.tx));
    c.scale(Math.max(0.07, axial), Math.max(0.07, girth));
    cb(c);
    c.restore();
  }

  /** the px length of one unit of u at this point — for converting a mark
      width in pixels into skin coordinates */
  speed(u: number): number {
    const h = 2e-3;
    const a = this.spec.P(Math.max(0, u - h)), b = this.spec.P(Math.min(1, u + h));
    return Math.hypot(b[0] - a[0], b[1] - a[1]) / (Math.min(1, u + h) - Math.max(0, u - h));
  }

  radius(u: number): number { return this.spec.R(u); }
  axis(u: number): [number, number] { return this.spec.P(u); }
}

/** A LIMB IS A TUBE TOO. Catmull-Rom through the joints, so an elbow is a
    bend in a solid rather than the corner between two strokes. */
export function pathThrough(pts: Array<[number, number]>): (u: number) => [number, number] {
  const n = pts.length;
  return (u: number): [number, number] => {
    const t = Math.max(0, Math.min(0.99999, u)) * (n - 1);
    const i = Math.floor(t), s = t - i;
    const g = (j: number): [number, number] => pts[Math.max(0, Math.min(n - 1, j))]!;
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const s2 = s * s, s3 = s2 * s;
    const cr = (a: number, b: number, cc: number, d: number): number =>
      0.5 * ((2 * b) + (-a + cc) * s + (2 * a - 5 * b + 4 * cc - d) * s2 + (-a + 3 * b - 3 * cc + d) * s3);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
  };
}

/** Catmull-Rom through knots — the radius profile wants to pass THROUGH the
    anatomy values it is given, not merely near them. */
export function spline(knots: Array<[number, number]>): (u: number) => number {
  const xs = knots.map((k) => k[0]), ys = knots.map((k) => k[1]);
  return (u: number): number => {
    const t = Math.max(xs[0]!, Math.min(xs[xs.length - 1]!, u));
    let i = 0;
    while (i < xs.length - 2 && t > xs[i + 1]!) i++;
    const x0 = xs[i]!, x1 = xs[i + 1]!;
    const s = (t - x0) / Math.max(1e-6, x1 - x0);
    const p0 = ys[Math.max(0, i - 1)]!, p1 = ys[i]!, p2 = ys[i + 1]!, p3 = ys[Math.min(ys.length - 1, i + 2)]!;
    const s2 = s * s, s3 = s2 * s;
    return 0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3);
  };
}

/* ⚠ mammalProfile() was REMOVED in wave 7. It hung a radius profile under a
   FIXED BACK LINE, so every bulge of shoulder or haunch muscle pushed the BELLY
   down by twice what it raised the back — two grey spheres hanging under the gut
   on every slim animal, which is what Nick's audit reported. The two outlines
   are authored directly now and the radius is derived from the gap between them
   (see quadrupedoverrides.ts). Its history is in git at fc7b362. */
