/** Canonical system-view dimensions, in world units. */
export const SYSTEM_PROTOSTAR_WIDTH = 140;
export const SYSTEM_PROTOSTAR_HEIGHT = 80;

/** Bake the original system renderer's tilted dust disk and warm core.
 * The caller owns the returned canvas through the existing scene texture scope.
 * Three backing pixels per world unit preserve the bounded 420×240 surface.
 */
export function createSystemProtostarCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SYSTEM_PROTOSTAR_WIDTH * 3;
  canvas.height = SYSTEM_PROTOSTAR_HEIGHT * 3;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('System protostar requires a 2D canvas context');
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(3, 3);

  context.save();
  context.rotate(0.4);
  context.scale(1, 0.34);
  const disk = context.createRadialGradient(0, 0, 14, 0, 0, 70);
  disk.addColorStop(0, 'rgba(0,0,0,0)');
  disk.addColorStop(0.3, 'rgba(200,150,110,0.55)');
  disk.addColorStop(0.7, 'rgba(150,105,75,0.30)');
  disk.addColorStop(1, 'transparent');
  context.fillStyle = disk;
  context.beginPath();
  context.arc(0, 0, 70, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const core = context.createRadialGradient(0, 0, 0, 0, 0, 30);
  core.addColorStop(0, '#ffd2a0');
  core.addColorStop(0.4, '#ff9a5a');
  core.addColorStop(1, 'transparent');
  context.fillStyle = core;
  context.beginPath();
  context.arc(0, 0, 30, 0, Math.PI * 2);
  context.fill();
  return canvas;
}
