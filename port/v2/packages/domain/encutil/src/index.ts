/* @cf/domain-encutil — MODULE 10 of 14.
   Ported from main.js `@module EncUtil [domain]` (lines 2207–2233, v1.8.9, tag v1.8.9).

   ⚠ PARITY RULES (Gate B): bodies below are the v1.8.9 source VERBATIM apart
   from type annotations. In particular shade()'s `v|0` truncation and its
   asymmetric lighten/darken arithmetic are part of the art contract — every
   painterly portrait derives its palette through it.

   ⚠ FIXTURE COVERAGE, recorded not silent: no golden generator and no
   fingerprint probe calls EncUtil DIRECTLY. b64encUtf8/b64decUtf8 get pinned
   transitively when CombatCore lands (the whereCodec/creatureCodec probes
   round-trip through them); shade/svgURI feed [app]-layer art only. Until
   then test/parity.test.ts pins them against INDEPENDENT truth: Node's
   Buffer base64 (a second implementation, not an echo of this one) and
   hand-computed shade values.

   Runtime note: btoa/atob and TextEncoder/TextDecoder are globals in every
   target (browsers, Node ≥16) — no DOM import, so the no-DOM lint stays clean. */

export function b64encUtf8(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}
export function b64decUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
export function svgURI(svg: string): string {
  return 'data:image/svg+xml;base64,' + b64encUtf8(svg);
}
/** Lighten (f>0) or darken (f<0) a #rrggbb color. Verbatim v1.8.9 arithmetic. */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
}
