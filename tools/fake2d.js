// The one shared fake CanvasRenderingContext2D for every jsdom-based tool
// (harness.js, smoke.js, systems-check.js, balance-sim.js). Four private
// copies drifted until two of them lacked createImageData and threw on every
// frame — one implementation ends that class of failure. Unknown methods
// no-op via the Proxy; unknown property sets (fillStyle, font, …) are stored.
'use strict';
function makeFake2D(canvas) {
  const gradient = { addColorStop() {} };
  const fake = {
    canvas,
    save() {}, restore() {}, beginPath() {}, closePath() {}, clip() {},
    moveTo() {}, lineTo() {}, bezierCurveTo() {}, quadraticCurveTo() {},
    arc() {}, arcTo() {}, ellipse() {}, rect() {}, roundRect() {},
    fill() {}, stroke() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }),
    drawImage() {}, putImageData() {},
    getImageData: (x, y, w, h) => ({ width: w || 1, height: h || 1, data: new Uint8ClampedArray(Math.max(1, (w || 1) * (h || 1) * 4)) }),
    createImageData: (w, h) => ({ width: w || 1, height: h || 1, data: new Uint8ClampedArray(Math.max(1, (w || 1) * (h || 1) * 4)) }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createConicGradient: () => gradient,
    createPattern: () => null,
    setTransform() {}, resetTransform() {}, transform() {},
    translate() {}, rotate() {}, scale() {},
    setLineDash() {}, getLineDash: () => [],
    isPointInPath: () => false, isPointInStroke: () => false,
    filter: 'none',
  };
  return new Proxy(fake, {
    get(t, p) { if (p in t) return t[p]; return () => undefined; },
    set(t, p, v) { t[p] = v; return true; },
  });
}
// Installs the fake on a jsdom window's canvas prototype (the shape every tool repeats).
function installFakeCanvas(window) {
  const proto = window.HTMLCanvasElement.prototype;
  proto.getContext = function (kind) {
    if (kind !== '2d') return null;
    if (!this.__fake2d) this.__fake2d = makeFake2D(this);
    return this.__fake2d;
  };
  proto.toDataURL = function () { return 'data:image/png;base64,'; };
}
module.exports = { makeFake2D, installFakeCanvas };
