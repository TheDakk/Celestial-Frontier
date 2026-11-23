/**
 * Paints a picture of pixel values on a canvas, one canvas pixel per value, and sizes the canvas to it: value v
 * is shown in colours[v] (0xRRGGBB), and value 0 is left transparent. Does nothing where the browser gives no
 * 2D context.
 */
export function paintPixels(canvas: HTMLCanvasElement, picture: { w: number; h: number; pixels: ArrayLike<number> }, colours: readonly number[]): void {
  canvas.width = picture.w;
  canvas.height = picture.h;
  if (picture.w === 0 || picture.h === 0) return;
  const context = canvas.getContext('2d');
  if (context === null) return;
  const image = context.createImageData(picture.w, picture.h);
  for (let i = 0; i < picture.pixels.length; i++) {
    const value = picture.pixels[i] ?? 0;
    if (value === 0) continue;
    const colour = colours[value] ?? 0;
    image.data[i * 4] = (colour >>> 16) & 255;
    image.data[i * 4 + 1] = (colour >>> 8) & 255;
    image.data[i * 4 + 2] = colour & 255;
    image.data[i * 4 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}
